from __future__ import annotations

import logging
import threading
import time
import uuid
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import job_store
from models import JobResponse, JobStatus
from pipeline import cv_pipeline_enabled, run_pipeline

REQUEUE_COOLDOWN_SECONDS = 2.0

# When True, each finished job auto-queues the next cycle (live-feed behavior).
# When False, `POST /analyze` runs exactly one pipeline pass and stops.
LOOP_MODE = True

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

VIDEOS_DIR = Path(__file__).parent / "videos"

# Horse registry: horse_id -> video file path.
# Add a new entry + video file to enable analysis for another horse.
HORSE_VIDEOS: dict[str, Path] = {
    "bella":  VIDEOS_DIR / "horse-rolling17.mov",
    "rocky":  VIDEOS_DIR / "horse-rolling17.mov",
    "shadow": VIDEOS_DIR / "horse-rolling17.mov",
    "maple":  VIDEOS_DIR / "horse-rolling17.mov",
}


def _video_path_for(horse_id: str) -> Path:
    horse_id = horse_id.lower()
    if horse_id not in HORSE_VIDEOS:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown horse '{horse_id}'. Known: {sorted(HORSE_VIDEOS)}",
        )
    path = HORSE_VIDEOS[horse_id]
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Video for horse '{horse_id}' missing at {path}",
        )
    return path


app = FastAPI(title="Valkyrie Local API", version="0.1.0")


@app.on_event("startup")
async def _autostart_all_horses() -> None:
    """Kick off a continuous pipeline loop for every registered horse on boot."""
    if not cv_pipeline_enabled():
        logger.info("CV pipeline killswitch off; not autostarting horses")
        return
    for horse_id in HORSE_VIDEOS:
        with _running_lock:
            already = horse_id in _running_horses
            if not already:
                _running_horses.add(horse_id)
        if not already:
            _start_job(horse_id)
            logger.info("Auto-started pipeline loop for %s", horse_id)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "horses": sorted(HORSE_VIDEOS)}


# Horses that currently have a running loop. Entries are added when a loop
# starts and removed only when it exits.
_running_horses: set[str] = set()
_running_lock = threading.Lock()


def _start_job(horse_id: str) -> str:
    """Create a job record + spawn a worker thread for one pipeline cycle."""
    video_path = _video_path_for(horse_id)
    job_id = str(uuid.uuid4())
    video_bytes = video_path.read_bytes()
    job_store.create_job(job_id, horse=horse_id)
    logger.info("Created %s job %s (%d bytes)", horse_id, job_id, len(video_bytes))
    threading.Thread(
        target=_run_and_requeue,
        args=(horse_id, job_id, video_bytes),
        daemon=True,
    ).start()
    return job_id


def _run_and_requeue(horse_id: str, job_id: str, video_bytes: bytes) -> None:
    """Run one pipeline cycle; if LOOP_MODE, immediately start the next."""
    try:
        run_pipeline(job_id, video_bytes)
    except Exception:
        logger.exception("Pipeline crashed for %s job %s", horse_id, job_id)

    if not LOOP_MODE or not cv_pipeline_enabled():
        with _running_lock:
            _running_horses.discard(horse_id)
        return

    time.sleep(REQUEUE_COOLDOWN_SECONDS)
    try:
        _start_job(horse_id)
    except Exception:
        logger.exception("Failed to re-queue %s; loop ending", horse_id)
        with _running_lock:
            _running_horses.discard(horse_id)


@app.post("/api/horses/{horse_id}/analyze", response_model=JobResponse, status_code=202)
async def analyze_horse(horse_id: str) -> JobResponse:
    """Kick off a continuous analysis loop for this horse. Idempotent."""
    horse_id = horse_id.lower()
    _video_path_for(horse_id)  # validate early

    with _running_lock:
        already_running = horse_id in _running_horses
        if not already_running:
            _running_horses.add(horse_id)

    if already_running:
        latest = job_store.get_latest_job_id(horse_id)
        if latest is not None:
            job = job_store.get_job(latest)
            if job is not None:
                return JobResponse(
                    job_id=job["job_id"],
                    status=job["status"],
                    results=job.get("results"),
                    error=job.get("error"),
                )

    job_id = _start_job(horse_id)
    return JobResponse(job_id=job_id, status=JobStatus.queued)


@app.get("/api/horses/{horse_id}/status", response_model=JobResponse)
def horse_latest_status(horse_id: str) -> JobResponse:
    """Return the most recent job for the given horse (partial or final)."""
    horse_id = horse_id.lower()
    if horse_id not in HORSE_VIDEOS:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown horse '{horse_id}'. Known: {sorted(HORSE_VIDEOS)}",
        )
    job_id = job_store.get_latest_job_id(horse_id)
    if job_id is None:
        raise HTTPException(
            status_code=404,
            detail=f"No analysis started for '{horse_id}'. POST /api/horses/{horse_id}/analyze first.",
        )
    return _job_response(job_id)


@app.get("/api/jobs/{job_id}", response_model=JobResponse)
def get_job_status(job_id: str) -> JobResponse:
    return _job_response(job_id)


def _job_response(job_id: str) -> JobResponse:
    job = job_store.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return JobResponse(
        job_id=job["job_id"],
        status=job["status"],
        results=job.get("results"),
        error=job.get("error"),
    )
