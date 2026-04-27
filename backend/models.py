from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel


class JobStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    done = "done"
    error = "error"


class InferenceResult(BaseModel):
    illness_risk_score: int  # 1-5 scale from Qwen policy evaluation
    detections: list[str]
    summary: str
    raw_descriptions: Optional[list[str]] = None  # per-window model outputs


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    results: Optional[InferenceResult] = None
    error: Optional[str] = None


class BatchInput(BaseModel):
    """Contract sent to Modal for each batch of frames."""
    job_id: str
    batch_index: int
    frames: list[bytes]  # raw PNG bytes per frame


class BatchOutput(BaseModel):
    """Contract returned by Modal for each batch (Qwen3-VL text descriptions)."""
    batch_index: int
    descriptions: list[str]  # one natural-language description per sliding window
