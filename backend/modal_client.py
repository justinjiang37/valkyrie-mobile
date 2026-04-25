"""
Client-side shim for invoking the deployed Modal VLM class from the FastAPI
backend. Keeps the `run_batch(frames) -> {"descriptions": [...]}` contract that
pipeline.py expects.

Requires MODAL_TOKEN_ID + MODAL_TOKEN_SECRET in the environment (loaded from
.env by main.py's `load_dotenv()` before this module is imported).
"""

from __future__ import annotations

import logging
from threading import Lock

import modal

logger = logging.getLogger(__name__)

APP_NAME   = "valkyrie-vlm"
CLASS_NAME = "VLM"

_vlm_instance = None
_lock = Lock()


def _get_vlm():
    global _vlm_instance
    if _vlm_instance is not None:
        return _vlm_instance
    with _lock:
        if _vlm_instance is None:
            logger.info("Resolving deployed Modal class %s/%s", APP_NAME, CLASS_NAME)
            Cls = modal.Cls.from_name(APP_NAME, CLASS_NAME)
            _vlm_instance = Cls()
    return _vlm_instance


def run_batch_remote(frames: list[bytes]) -> dict:
    vlm = _get_vlm()
    return vlm.run_batch.remote(frames)
