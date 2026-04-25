"""
Modal-hosted VLM inference for Valkyrie — Qwen3-VL-2B-Instruct on T4.

Deploy once:
    cd backend
    export $(grep -v '^#' .env | xargs)
    modal deploy modal_service.py

After deploy, pipeline.py imports the deployed class by name and invokes
`VLM.run_batch.remote(frames)` — contract matches local_inference.run_batch_local:
    Input:  list[bytes]  -- PNG frame bytes
    Output: dict         -- {"descriptions": list[str]}
"""

from __future__ import annotations

import io
from collections import deque

import modal

APP_NAME       = "valkyrie-vlm"
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

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "torch==2.5.1",
        "torchvision==0.20.1",
        "transformers==5.5.3",
        "accelerate>=0.34",
        "qwen-vl-utils",
        "Pillow>=10.0.0",
        "numpy",
        "huggingface-hub>=0.23.0",
    )
)

app = modal.App(APP_NAME, image=image)

hf_cache = modal.Volume.from_name("valkyrie-hf-cache", create_if_missing=True)


@app.cls(
    gpu="T4",
    volumes={"/root/.cache/huggingface": hf_cache},
    secrets=[modal.Secret.from_dotenv()],
    scaledown_window=300,
    timeout=600,
)
class VLM:
    @modal.enter()
    def load(self) -> None:
        import os
        import torch
        from transformers import AutoProcessor, Qwen3VLForConditionalGeneration

        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        hf_token = os.environ.get("HF_TOKEN") or None

        self._processor = AutoProcessor.from_pretrained(
            MODEL_ID,
            min_pixels=64  * 28 * 28,
            max_pixels=512 * 28 * 28,
            token=hf_token,
        )
        self._model = Qwen3VLForConditionalGeneration.from_pretrained(
            MODEL_ID,
            torch_dtype="auto",
            device_map="auto",
            attn_implementation="eager",
            token=hf_token,
        )
        self._model.eval()

    def _infer_window(self, frames: list) -> str:
        import torch
        from qwen_vl_utils import process_vision_info

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "video", "video": frames, "fps": float(CAPTURE_FPS)},
                    {"type": "text", "text": USER_PROMPT},
                ],
            }
        ]

        text_prompt = self._processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        image_inputs, video_inputs = process_vision_info(messages)
        inputs = self._processor(
            text=[text_prompt],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        )
        inputs = {k: v.to(self._device) for k, v in inputs.items()}

        with torch.inference_mode():
            output_ids = self._model.generate(
                **inputs,
                max_new_tokens=MAX_NEW_TOKENS,
                do_sample=False,
            )

        generated = [
            out[len(inp):] for inp, out in zip(inputs["input_ids"], output_ids)
        ]
        return self._processor.batch_decode(
            generated, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )[0].strip()

    @modal.method()
    def run_batch(self, frames: list[bytes]) -> dict:
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


@app.local_entrypoint()
def smoke_test() -> None:
    """Quick check after deploy: `modal run modal_service.py`."""
    import pathlib
    frames_dir = pathlib.Path(__file__).parent / "videos"
    sample = next(frames_dir.glob("*.mov"), None)
    if sample is None:
        print("No sample video found; deploy only.")
        return
    print(f"Class deployed. Invoke via VLM().run_batch.remote([...frame bytes...]).")
