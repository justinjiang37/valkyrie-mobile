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
    illness_risk_score: int
    detections: list[str]
    summary: str
    raw_descriptions: Optional[list[str]] = None


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    results: Optional[InferenceResult] = None
    error: Optional[str] = None
