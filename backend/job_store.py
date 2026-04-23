"""In-memory, thread-safe job store for the local Bella CV pipeline."""

from __future__ import annotations

import threading
from typing import Any

from models import JobStatus

_jobs: dict[str, dict[str, Any]] = {}
_latest_by_horse: dict[str, str] = {}
_lock = threading.Lock()


def create_job(job_id: str, horse: str | None = None) -> None:
    with _lock:
        _jobs[job_id] = {
            "job_id": job_id,
            "status": JobStatus.queued.value,
            "results": None,
            "error": None,
            "horse": horse,
        }
        if horse:
            _latest_by_horse[horse] = job_id


def get_job(job_id: str) -> dict[str, Any] | None:
    with _lock:
        job = _jobs.get(job_id)
        return dict(job) if job else None


def get_latest_job_id(horse: str) -> str | None:
    with _lock:
        return _latest_by_horse.get(horse)


def set_status(job_id: str, status: JobStatus) -> None:
    with _lock:
        if job_id in _jobs:
            _jobs[job_id]["status"] = status.value


def set_partial_result(job_id: str, results: dict[str, Any]) -> None:
    with _lock:
        if job_id in _jobs:
            _jobs[job_id]["results"] = results


def set_done(job_id: str, results: dict[str, Any]) -> None:
    with _lock:
        if job_id in _jobs:
            _jobs[job_id]["status"] = JobStatus.done.value
            _jobs[job_id]["results"] = results


def set_error(job_id: str, error: str) -> None:
    with _lock:
        if job_id in _jobs:
            _jobs[job_id]["status"] = JobStatus.error.value
            _jobs[job_id]["error"] = error
