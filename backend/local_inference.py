"""
Fully local VLM inference for Valkyrie — Qwen3-VL-2B-Instruct.

Model is loaded once on first call and reused across all subsequent batches.
Weights are downloaded automatically to ~/.cache/huggingface on first run (~5 GB).

Set USE_LOCAL=true in .env to activate. Install deps first:
    pip install -r requirements-local.txt

CONTRACT (matches modal_service.run_batch_local and runpod_service.run_batch_local):
    Input:  list[bytes]  -- PNG frame bytes
    Output: dict         -- {"descriptions": list[str]}
"""

from __future__ import annotations

import io
import logging
import os
from collections import deque

logger = logging.getLogger(__name__)

MODEL_ID       = "Qwen/Qwen3-VL-2B-Instruct"
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
# Lazy singleton — loaded once, reused across all pipeline calls
# ---------------------------------------------------------------------------

_model     = None
_processor = None
_device    = None


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


# ---------------------------------------------------------------------------
# Inference helpers — direct port of modal_service.py Inference class
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Public entry point — called by pipeline.py
# ---------------------------------------------------------------------------

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
