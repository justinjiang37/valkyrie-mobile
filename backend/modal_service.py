"""
Valkyrie Modal inference service.

Two GPU classes in one Modal app:
  - Inference  → Qwen3-VL-2B-Instruct  (per-frame description)
  - Scorer     → Qwen3.5-4B            (timeline → risk score JSON)

DEPLOY
------
    modal deploy backend/modal_service.py

CONTRACTS
---------
run_batch_local(frames: list[bytes]) -> {"descriptions": list[str]}
run_scoring_local(descriptions: list[str]) -> {
    "illness_risk_score": int, "detections": list[str], "summary": str
}
"""

from __future__ import annotations

import io
import os
from collections import deque

import modal

# ---------------------------------------------------------------------------
# Configuration (mirrors the notebook's Step 4)
# ---------------------------------------------------------------------------

MODEL_ID         = "Qwen/Qwen3-VL-2B-Instruct"
SCORER_MODEL_ID  = "Qwen/Qwen3.5-4B"
CAPTURE_FPS      = 0.5
TARGET_HEIGHT    = 360
WINDOW_SIZE      = 1     # evaluate every frame individually
SLIDE_STEP       = 1     # no overlap needed when window is a single frame
MAX_NEW_TOKENS   = 80
USER_PROMPT      = (
    "You are analysing a horse health monitoring video. "
    "Describe the horse's posture and behaviour in one sentence. "
    "Focus on: is it standing, lying down, is it's head near its stomach"
    "Focus on: is it standing, lying down, rolling, kicking at its belly, biting its flanks, or showing signs of distress?"
)

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

# ---------------------------------------------------------------------------
# Modal App + Docker image
# ---------------------------------------------------------------------------

app = modal.App("valkyrie-inference")

CACHE_DIR = "/cache"


def _download_models() -> None:
    """
    Run once during `modal deploy` to bake both model weights into the image layer.
    After this, cold-starts load from the local filesystem -- no network needed.
    """
    from huggingface_hub import snapshot_download

    token = os.environ.get("HF_TOKEN")
    snapshot_download(MODEL_ID,        cache_dir=CACHE_DIR, token=token)
    snapshot_download(SCORER_MODEL_ID, cache_dir=CACHE_DIR, token=token)


inference_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git")
    .pip_install(
        "torch>=2.4,<2.7",
        "torchvision>=0.19,<0.22",
        "transformers==5.5.3",
        "accelerate>=0.34",
        "qwen-vl-utils",
        "opencv-python-headless",
        "Pillow",
        "numpy",
        "huggingface_hub",
    )
    # Download weights at image-build time; baked into the image layer.
    # Re-runs only when the image definition changes (e.g. pip versions bump).
    .run_function(
        _download_models,
        secrets=[modal.Secret.from_name("hf-token")],
    )
)


# ---------------------------------------------------------------------------
# Inference class
# ---------------------------------------------------------------------------

@app.cls(
    image=inference_image,
    gpu="L4",
    timeout=600,
    # No volumes= needed -- weights are baked into the image layer
    secrets=[modal.Secret.from_name("hf-token")],
)
class Inference:
    """Loads Qwen3-VL-2B once per container, exposes run_batch() for remote calls."""

    @modal.enter()
    def load_model(self) -> None:
        import torch
        from transformers import AutoProcessor, Qwen3VLForConditionalGeneration

        # Weights are already on disk at CACHE_DIR -- no download happens here
        os.environ["HF_HOME"]            = CACHE_DIR
        os.environ["TRANSFORMERS_CACHE"] = CACHE_DIR
        os.environ["TRANSFORMERS_OFFLINE"] = "1"  # fail fast if cache is missing

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.dtype  = torch.bfloat16 if self.device == "cuda" else torch.float32

        self.processor = AutoProcessor.from_pretrained(
            MODEL_ID,
            min_pixels=64  * 28 * 28,
            max_pixels=512 * 28 * 28,
            cache_dir=CACHE_DIR,
            local_files_only=True,
        )

        self.model = Qwen3VLForConditionalGeneration.from_pretrained(
            MODEL_ID,
            torch_dtype=self.dtype,
            device_map="auto",
            cache_dir=CACHE_DIR,
            local_files_only=True,
        )
        self.model.eval()

    @modal.method()
    def run_batch(self, frames: list[bytes]) -> dict:
        """
        Process a batch of PNG frames using a sliding window.

        Each window of WINDOW_SIZE frames gets one inference call.
        Returns all descriptions collected across the batch.
        """
        from PIL import Image

        pil_frames = [Image.open(io.BytesIO(b)).convert("RGB") for b in frames]

        window: deque = deque(maxlen=WINDOW_SIZE)
        descriptions: list[str] = []
        frames_seen = 0

        for frame in pil_frames:
            window.append(frame)
            frames_seen += 1

            if len(window) == WINDOW_SIZE and frames_seen % SLIDE_STEP == 0:
                descriptions.append(self._infer_window(list(window)))

        if len(window) >= 1 and frames_seen % SLIDE_STEP != 0:
            descriptions.append(self._infer_window(list(window)))

        return {"descriptions": descriptions}

    def _infer_window(self, frames: list) -> str:
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

        text_prompt = self.processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        image_inputs, video_inputs = process_vision_info(messages)
        inputs = self.processor(
            text=[text_prompt],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.inference_mode():
            output_ids = self.model.generate(
                **inputs,
                max_new_tokens=MAX_NEW_TOKENS,
                do_sample=False,
            )

        generated = [
            out[len(inp):]
            for inp, out in zip(inputs["input_ids"], output_ids)
        ]
        return self.processor.batch_decode(
            generated,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=False,
        )[0].strip()


# ---------------------------------------------------------------------------
# Scorer class — Qwen3.5-4B text inference for risk scoring
# ---------------------------------------------------------------------------

@app.cls(
    image=inference_image,
    gpu="L4",
    timeout=120,
    secrets=[modal.Secret.from_name("hf-token")],
)
class Scorer:
    """Loads Qwen3.5-4B once per container, exposes run_scoring() for remote calls."""

    @modal.enter()
    def load_model(self) -> None:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer

        os.environ["HF_HOME"]              = CACHE_DIR
        os.environ["TRANSFORMERS_CACHE"]   = CACHE_DIR
        os.environ["TRANSFORMERS_OFFLINE"] = "1"

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.dtype  = torch.bfloat16 if self.device == "cuda" else torch.float32

        self.tokenizer = AutoTokenizer.from_pretrained(
            SCORER_MODEL_ID,
            cache_dir=CACHE_DIR,
            local_files_only=True,
        )
        self.model = AutoModelForCausalLM.from_pretrained(
            SCORER_MODEL_ID,
            torch_dtype=self.dtype,
            device_map="auto",
            cache_dir=CACHE_DIR,
            local_files_only=True,
        )
        self.model.eval()

    @modal.method()
    def run_scoring(self, descriptions: list[str]) -> dict:
        """Score a description timeline; returns {illness_risk_score, detections, summary}."""
        import json
        import re as _re
        import torch

        timeline = "\n".join(f"{i + 1}. {d}" for i, d in enumerate(descriptions))
        user_text = (
            f"Here is the observation timeline ({len(descriptions)} frames):\n\n"
            f"{timeline}\n\nReturn the JSON risk assessment."
        )

        messages = [
            {"role": "system", "content": _SCORING_SYSTEM_PROMPT},
            {"role": "user",   "content": user_text},
        ]

        text = self.tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        inputs = self.tokenizer(text, return_tensors="pt").to(self.device)

        with torch.inference_mode():
            output_ids = self.model.generate(
                **inputs,
                max_new_tokens=256,
                do_sample=False,
            )

        generated = output_ids[0][inputs["input_ids"].shape[1]:]
        raw = self.tokenizer.decode(generated, skip_special_tokens=True).strip()

        raw = _re.sub(r"^```(?:json)?\s*", "", raw)
        raw = _re.sub(r"\s*```$", "", raw.strip())

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"illness_risk_score": 1, "detections": [], "summary": raw}


# ---------------------------------------------------------------------------
# Public dispatchers used by pipeline.py
# ---------------------------------------------------------------------------

def run_batch_local(frames: list[bytes]) -> dict:
    """
    USE_MODAL=true  → Inference.run_batch.remote() on Modal GPU
    USE_MODAL=false → local placeholder so pipeline.py still runs without Modal
    """
    use_modal = os.environ.get("USE_MODAL", "false").lower() == "true"

    if use_modal:
        InferenceCls = modal.Cls.from_name("valkyrie-inference", "Inference")
        return InferenceCls().run_batch.remote(frames)

    num_descriptions = max(1, len(frames) // WINDOW_SIZE)
    return {
        "descriptions": [
            "Local dev placeholder: horse behaviour not analysed (USE_MODAL=false)."
        ] * num_descriptions
    }


def run_scoring_local(descriptions: list[str]) -> dict:
    """
    USE_MODAL=true  → Scorer.run_scoring.remote() on Modal GPU
    USE_MODAL=false → safe stub so pipeline.py still runs without Modal
    """
    use_modal = os.environ.get("USE_MODAL", "false").lower() == "true"

    if use_modal:
        ScorerCls = modal.Cls.from_name("valkyrie-inference", "Scorer")
        return ScorerCls().run_scoring.remote(descriptions)

    return {
        "illness_risk_score": 1,
        "detections": [],
        "summary": "Modal scoring stub (USE_MODAL=false)",
    }
