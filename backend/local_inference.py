"""
Fully local VLM inference for Valkyrie — Qwen3-VL-4B-Instruct + Qwen3.5-4B scorer.

Models are loaded once on first call and reused across all subsequent batches.
Weights are downloaded automatically to ~/.cache/huggingface on first run.

Set USE_LOCAL=true in .env to activate. Install deps first:
    pip install -r requirements.txt

CONTRACT (matches modal_service):
    run_batch_local(frames: list[bytes])     -> {"descriptions": list[str]}
    run_scoring_local(descriptions: list[str]) -> {
        "illness_risk_score": int, "detections": list[str], "summary": str
    }
"""

from __future__ import annotations

import io
import logging
import os
from collections import deque

logger = logging.getLogger(__name__)

MODEL_ID       = "Qwen/Qwen3-VL-4B-Instruct"  # 2B and 4B exist; 3B does not
CAPTURE_FPS    = 0.5
WINDOW_SIZE    = 1
SLIDE_STEP     = 1
MAX_NEW_TOKENS = 48
USER_PROMPT    = (
    "You are analysing a horse health monitoring video. "
    "Describe the horse's posture and behaviour in one sentence. "
    "Focus on: is it standing, lying down, is it's head directly touching its stomach"
    "Focus on: is it standing, lying down, rolling, kicking at its belly, biting its flanks, or showing signs of distress?"
)

# ---------------------------------------------------------------------------
# Lazy singletons — loaded once, reused across all pipeline calls
# ---------------------------------------------------------------------------

# VLM (Qwen3-VL) — frame inference
_model     = None
_processor = None
_device    = None

# LLM (Qwen3.5-4B) — description scoring
SCORER_MODEL_ID   = "Qwen/Qwen3.5-4B"
_scorer_model     = None
_scorer_tokenizer = None
_scorer_device    = None

_SCORING_SYSTEM_PROMPT = """\
You are a veterinary AI assistant evaluating horse health from a surveillance video.

You will receive an ordered timeline of short descriptions from a vision model.
Description 1 is the earliest frame; the last is the most recent.

Your job:
1. Read the full timeline and identify the horse's posture in each description \
(standing / lying down / rolling / other).
2. Count posture TRANSITIONS: each time consecutive descriptions switch between \
"standing" and "lying" (in either direction) counts as ONE transition.
3. Apply the clinical policies below and return the HIGHEST matching risk score.

Clinical policies (apply the highest that matches):
  5/5 — violent rolling, thrashing, or flipping onto its back observed
  4/5 — kicking at belly, biting flanks, or head repeatedly near abdomen observed
  3/5 — more than 3 lying<->standing transitions across the full timeline
  2/5 — horse has been lying down continuously for over an hour (>= 120 descriptions at 0.5 FPS)
  1/5 — default; none of the above

Respond with ONLY a valid JSON object, no markdown, no extra text:
{
  "illness_risk_score": <integer 1-5>,
  "detections": [<string>, ...],
  "summary": "<one sentence explaining the risk level and key observations>"
}\
"""


def _load_model() -> None:
    global _model, _processor, _device
    if _model is not None:
        return

    import torch
    from transformers import AutoProcessor, Qwen3VLForConditionalGeneration

    if torch.backends.mps.is_available():
        _device = "mps"
    elif torch.cuda.is_available():
        _device = "cuda"
    else:
        _device = "cpu"

    # bfloat16 triggers an MPS matmul bug with Qwen3-VL's GQA; use float16 instead
    dtype = torch.float16 if _device == "mps" else "auto"

    logger.info("Loading %s on device=%s dtype=%s", MODEL_ID, _device, dtype)

    hf_token = os.environ.get("HF_TOKEN") or None

    _processor = AutoProcessor.from_pretrained(
        MODEL_ID,
        min_pixels=64  * 28 * 28,
        max_pixels=512 * 28 * 28,
        token=hf_token,
    )

    _model = Qwen3VLForConditionalGeneration.from_pretrained(
        MODEL_ID,
        torch_dtype=dtype,
        device_map="auto",
        attn_implementation="eager",
        token=hf_token,
    )
    _model.eval()
    logger.info("Model loaded on %s", _device)


def _infer_window(frames: list) -> str:
    import torch
    from qwen_vl_utils import process_vision_info

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "video",
                    "video": frames,
                    "fps": float(CAPTURE_FPS),
                },
                {
                    "type": "text",
                    "text": USER_PROMPT,
                },
            ],
        }
    ]

    text_prompt = _processor.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    image_inputs, video_inputs = process_vision_info(messages)
    inputs = _processor(
        text=[text_prompt],
        images=image_inputs,
        videos=video_inputs,
        padding=True,
        return_tensors="pt",
    )
    inputs = {k: v.to(_device) for k, v in inputs.items()}

    with torch.inference_mode():
        output_ids = _model.generate(
            **inputs,
            max_new_tokens=MAX_NEW_TOKENS,
            do_sample=False,
        )

    generated = [
        out[len(inp):]
        for inp, out in zip(inputs["input_ids"], output_ids)
    ]
    return _processor.batch_decode(
        generated,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=False,
    )[0].strip()


def _load_scorer() -> None:
    global _scorer_model, _scorer_tokenizer, _scorer_device
    if _scorer_model is not None:
        return

    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    if torch.backends.mps.is_available():
        _scorer_device = "mps"
    elif torch.cuda.is_available():
        _scorer_device = "cuda"
    else:
        _scorer_device = "cpu"

    dtype = torch.float16 if _scorer_device == "mps" else "auto"
    hf_token = os.environ.get("HF_TOKEN") or None

    logger.info("Loading scorer %s on %s", SCORER_MODEL_ID, _scorer_device)
    _scorer_tokenizer = AutoTokenizer.from_pretrained(
        SCORER_MODEL_ID, token=hf_token
    )
    _scorer_model = AutoModelForCausalLM.from_pretrained(
        SCORER_MODEL_ID,
        torch_dtype=dtype,
        device_map="auto",
        token=hf_token,
    )
    _scorer_model.eval()
    logger.info("Scorer loaded on %s", _scorer_device)


def run_scoring_local(descriptions: list[str]) -> dict:
    """Score a description timeline using Qwen3.5-4B text inference."""
    import json
    import re as _re
    import torch

    _load_scorer()

    timeline = "\n".join(f"{i + 1}. {d}" for i, d in enumerate(descriptions))
    user_text = (
        f"Here is the observation timeline ({len(descriptions)} frames):\n\n"
        f"{timeline}\n\nReturn the JSON risk assessment."
    )

    messages = [
        {"role": "system", "content": _SCORING_SYSTEM_PROMPT},
        {"role": "user",   "content": user_text},
    ]

    text = _scorer_tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    inputs = _scorer_tokenizer(text, return_tensors="pt").to(_scorer_device)

    with torch.inference_mode():
        output_ids = _scorer_model.generate(
            **inputs,
            max_new_tokens=256,
            do_sample=False,
        )

    generated = output_ids[0][inputs["input_ids"].shape[1]:]
    raw = _scorer_tokenizer.decode(generated, skip_special_tokens=True).strip()

    raw = _re.sub(r"^```(?:json)?\s*", "", raw)
    raw = _re.sub(r"\s*```$", "", raw.strip())

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {"illness_risk_score": 1, "detections": [], "summary": raw}

    return data


def run_batch_local(frames: list[bytes]) -> dict:
    from PIL import Image

    _load_model()

    pil_frames = [Image.open(io.BytesIO(b)).convert("RGB") for b in frames]

    window: deque = deque(maxlen=WINDOW_SIZE)
    descriptions: list[str] = []
    frames_seen = 0

    for frame in pil_frames:
        window.append(frame)
        frames_seen += 1

        if len(window) == WINDOW_SIZE and frames_seen % SLIDE_STEP == 0:
            descriptions.append(_infer_window(list(window)))

    if len(window) >= 1 and frames_seen % SLIDE_STEP != 0:
        descriptions.append(_infer_window(list(window)))

    return {"descriptions": descriptions}
