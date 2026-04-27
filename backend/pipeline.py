"""
Video processing pipeline for Valkyrie.

Flow:
  1. Save video bytes to a temp file
  2. Use ffmpeg to scale to 360p and extract frames at 0.5 FPS as PNGs
  3. Filter static frames via motion detection
  4. Send each frame to Qwen3-VL (VLM) for a natural-language description
  5. Aggregate descriptions via fast regex (default) or Qwen3.5-4B (LLM)
  6. Update job store with final results or error
"""

from __future__ import annotations

import logging
import os
import re
import subprocess
import tempfile
import threading
import time
from pathlib import Path

import job_store
from models import JobStatus

if os.environ.get("USE_LOCAL", "false").lower() == "true":
    from local_inference import run_batch_local, run_scoring_local
else:
    from modal_service import run_batch_local, run_scoring_local

logger = logging.getLogger(__name__)


def cv_pipeline_enabled() -> bool:
    return os.environ.get("CV_PIPELINE_ENABLED", "").strip().lower() in {"1", "true", "yes", "on"}


FRAME_FPS         = 0.5
SCALE_HEIGHT      = 360  # matches TARGET_HEIGHT in modal_service.py / notebook
MOTION_THRESHOLD  = 5.0  # RMS pixel diff (0-255); frames below this are skipped

# Streaming pipeline tuning — mirrors how a live feed will behave
VLM_MICRO_BATCH   = 1    # frames per VLM call; 1 = most stream-like
SCORING_INTERVAL  = 30   # new descriptions between scoring passes = 60s of video at 0.5 FPS
SCORER_POLL_SEC   = 1.0  # how often scorer checks for new work

# Scoring backend toggle. Default = fast regex (live-stream friendly).
# Set USE_LLM_SCORING=true in .env to use the Qwen3.5-4B LLM instead.
USE_LLM_SCORING   = os.environ.get("USE_LLM_SCORING", "false").lower() == "true"


def _extract_frames(video_path: str, frames_dir: str) -> list[Path]:
    """Run ffmpeg to scale and extract frames. Returns sorted list of frame Paths."""
    cmd = [
        "ffmpeg",
        "-i", video_path,
        "-vf", f"scale=-2:{SCALE_HEIGHT},fps={FRAME_FPS}",
        "-q:v", "2",
        "-y",
        os.path.join(frames_dir, "%04d.png"),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")

    frames = sorted(Path(frames_dir).glob("*.png"))
    logger.info("Extracted %d frames from %s", len(frames), video_path)
    return frames


def _read_frame_bytes(frame_paths: list[Path]) -> list[bytes]:
    return [p.read_bytes() for p in frame_paths]


def _compute_frame_diff(path1: Path, path2: Path) -> float:
    from PIL import Image, ImageChops, ImageStat
    img1 = Image.open(path1).convert("L")
    img2 = Image.open(path2).convert("L")
    return ImageStat.Stat(ImageChops.difference(img1, img2)).rms[0]


def _filter_static_frames(
    frames: list[Path], threshold: float = MOTION_THRESHOLD
) -> tuple[list[Path], set[int]]:
    """Return active frames and the set of original indices that are active."""
    if len(frames) <= 1:
        return frames, set(range(len(frames)))
    active: list[Path] = [frames[0]]
    active_set: set[int] = {0}
    for i in range(1, len(frames)):
        if _compute_frame_diff(frames[i - 1], frames[i]) >= threshold:
            active.append(frames[i])
            active_set.add(i)
    return active, active_set


# ---------------------------------------------------------------------------
# Regex-based scoring (fast path, default for live streams)
# ---------------------------------------------------------------------------

# 60 seconds of frames at 0.5 FPS
_SCORING_WINDOW = 30
# Head/leg condition must appear this many times in a 60s window to trigger 4/5
_HEAD_LEG_THRESHOLD = 0
# Lying↔standing transitions in a 60s window to trigger 3/5
_TRANSITION_THRESHOLD = 3
# Continuous lying >= 1 hour triggers 2/5
_LYING_DURATION_THRESHOLD_SEC = 3600
_LYING_FRAME_THRESHOLD = int(_LYING_DURATION_THRESHOLD_SEC * FRAME_FPS)

_RISK_SUMMARIES = {
    5: "Critical: Horse observed rolling or thrashing — severe colic risk.",
    4: "High: Horse's head or leg repeatedly near abdomen — colic indicators present.",
    3: "Moderate: Horse repeatedly alternating between lying and standing.",
    2: "Low-moderate: Horse has been lying down continuously for over an hour.",
    1: "Low: No significant colic indicators observed.",
}

_NEGATION_CUES = re.compile(
    r"\b(not|no|never|without|isn'?t|aren'?t|doesn'?t|don'?t|"
    r"no\s+signs?\s+of|no\s+indication\s+of)\b",
    re.IGNORECASE,
)

_ROLLING_RE = re.compile(r'\b(rolling|thrashing)\b')
_LYING_RE = re.compile(r'\b(lying|lies|lay|recumbent|on the ground|on its side)\b')
_STANDING_RE = re.compile(r'\b(standing|upright|stands|stood)\b')
_HEAD_BITE_RE = re.compile(
    r'\b(biting|nipping|chewing)\b.{0,30}\b(flank|belly|abdomen|stomach|side)\b'
)
_HEAD_KICK_RE = re.compile(
    r'\b(kicking|pawing)\b.{0,30}\b(belly|abdomen|stomach)\b'
)
_HEAD_TURN_RE = re.compile(
    r'\bhead\b.{0,30}\b(turned|turning|looking|reaching|craning)\b'
    r'.{0,30}\b(toward|towards|at)\b.{0,30}\b(flank|belly|abdomen|stomach)\b'
)


def _is_negated(text: str, match_start: int) -> bool:
    """True if a negation cue precedes match_start within ~60 chars
    without an intervening clause break."""
    window = text[max(0, match_start - 60) : match_start]
    last_break = max(window.rfind("."), window.rfind(";"))
    if last_break != -1:
        window = window[last_break + 1 :]
    return bool(_NEGATION_CUES.search(window))


def _has_unnegated_match(pattern: re.Pattern, text: str) -> bool:
    return any(not _is_negated(text, m.start()) for m in pattern.finditer(text))


def _parse_frame_result(desc: str) -> dict:
    """Parse a natural-language VLM description into boolean signals."""
    d = desc.lower()

    # Explicit "standing" overrides contradictory rolling/lying claims in the
    # same description — a horse cannot be standing and rolling at once.
    standing = _has_unnegated_match(_STANDING_RE, d)
    rolling  = _has_unnegated_match(_ROLLING_RE, d) and not standing
    lying    = (
        _has_unnegated_match(_LYING_RE, d)
        and not rolling
        and not standing
    )

    head_near_abdomen = (
        _has_unnegated_match(_HEAD_BITE_RE, d)
        or _has_unnegated_match(_HEAD_KICK_RE, d)
        or _has_unnegated_match(_HEAD_TURN_RE, d)
    )

    return {
        "lying":             lying,
        "standing":          standing or (not lying and not rolling),
        "rolling":           rolling,
        "head_near_abdomen": head_near_abdomen,
    }


def _aggregate_results(descriptions: list[str]) -> dict:
    """
    Regex-based clinical scoring over a description timeline.

    Priority (highest wins):
      5/5 — rolling detected in any window
      4/5 — head/leg near abdomen > HEAD_LEG_THRESHOLD times in any window
      3/5 — lying↔standing transitions > TRANSITION_THRESHOLD in any window
      2/5 — horse has been lying down continuously for >= 1 hour
      1/5 — none of the above
    """
    if not descriptions:
        return {
            "illness_risk_score": 1,
            "detections": [],
            "summary": "No observations produced by the vision model.",
        }

    frames = [_parse_frame_result(d) for d in descriptions]

    any_rolling = False
    max_head_leg_count = 0
    max_transitions = 0

    max_lying_run = 0
    current_lying_run = 0
    for f in frames:
        if f["lying"] and not f["rolling"]:
            current_lying_run += 1
            max_lying_run = max(max_lying_run, current_lying_run)
        else:
            current_lying_run = 0

    for start in range(len(frames)):
        window = frames[start : start + _SCORING_WINDOW]

        if any(f["rolling"] for f in window):
            any_rolling = True

        head_leg_count = sum(
            1 for f in window
            if not f["rolling"] and f["head_near_abdomen"]
        )
        max_head_leg_count = max(max_head_leg_count, head_leg_count)

        transitions = 0
        prev_lying = None
        for f in window:
            if f["rolling"]:
                continue
            if prev_lying is not None and f["lying"] != prev_lying:
                transitions += 1
            prev_lying = f["lying"]
        max_transitions = max(max_transitions, transitions)

    if any_rolling:
        risk = 5
        detections = ["rolling"]
    elif max_head_leg_count > _HEAD_LEG_THRESHOLD:
        risk = 4
        detections = ["head_or_leg_near_abdomen"]
    elif max_transitions > _TRANSITION_THRESHOLD:
        risk = 3
        detections = ["repeated_lying_standing"]
    elif max_lying_run >= _LYING_FRAME_THRESHOLD:
        risk = 2
        detections = ["lying_over_one_hour"]
    else:
        risk = 1
        detections = []

    return {
        "illness_risk_score": risk,
        "detections":         detections,
        "summary":            _RISK_SUMMARIES[risk],
    }


# ---------------------------------------------------------------------------
# Scoring dispatcher — chooses backend based on USE_LLM_SCORING env toggle
# ---------------------------------------------------------------------------

def _score_descriptions(descriptions: list[str]) -> dict:
    """Return a results dict (without raw_descriptions) for a description list.

    Routes to the LLM (Qwen3.5-4B) if USE_LLM_SCORING=true, otherwise the
    fast regex aggregator. The LLM is more accurate but ~seconds-per-call;
    the regex path is microseconds and safe for live-stream use.
    """
    if USE_LLM_SCORING:
        raw = run_scoring_local(descriptions)
        return {
            "illness_risk_score": raw.get("illness_risk_score", 1),
            "detections":         raw.get("detections", []),
            "summary":            raw.get("summary", ""),
        }
    return _aggregate_results(descriptions)


def _vlm_producer(
    active_frames: list[Path],
    shared_descs: list[str],
    lock: threading.Lock,
    done_event: threading.Event,
    error_box: list[BaseException],
) -> None:
    """Run VLM sequentially over active frames, appending to shared list."""
    try:
        for start in range(0, len(active_frames), VLM_MICRO_BATCH):
            chunk = active_frames[start : start + VLM_MICRO_BATCH]
            frame_bytes = _read_frame_bytes(chunk)
            output = run_batch_local(frame_bytes)
            descs = output.get("descriptions", [])
            with lock:
                shared_descs.extend(descs)
    except BaseException as exc:  # noqa: BLE001
        error_box.append(exc)
    finally:
        done_event.set()


def _scorer_consumer(
    job_id: str,
    shared_descs: list[str],
    lock: threading.Lock,
    done_event: threading.Event,
) -> None:
    """Periodically score accumulated descriptions and publish partial results."""
    last_scored = 0
    final_pass_done = False

    while True:
        with lock:
            current_len = len(shared_descs)

        should_score = (
            current_len - last_scored >= SCORING_INTERVAL
            or (done_event.is_set() and current_len > last_scored and not final_pass_done)
        )

        if should_score:
            with lock:
                snapshot = list(shared_descs)
            results = _score_descriptions(snapshot)
            results["raw_descriptions"] = snapshot
            try:
                job_store.set_partial_result(job_id, results)
            except Exception:
                logger.exception("set_partial_result failed for job %s", job_id)
            last_scored = len(snapshot)
            if done_event.is_set() and last_scored == current_len:
                final_pass_done = True
                break
            continue

        if done_event.is_set() and last_scored >= current_len:
            break

        time.sleep(SCORER_POLL_SEC)


def run_pipeline(job_id: str, video_bytes: bytes) -> None:
    """
    Entry point called by FastAPI BackgroundTasks.
    Runs the full pipeline and updates the job store.
    """
    if not cv_pipeline_enabled():
        logger.info("CV pipeline disabled by killswitch; skipping job %s", job_id)
        job_store.set_done(job_id, {
            "illness_risk_score": 1,
            "detections": [],
            "summary": "CV pipeline disabled.",
            "raw_descriptions": [],
        })
        return

    logger.info("Pipeline started for job %s", job_id)
    job_store.set_status(job_id, JobStatus.processing)

    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            video_path = os.path.join(tmp_dir, "input_video")
            frames_dir = os.path.join(tmp_dir, "frames")
            os.makedirs(frames_dir)

            with open(video_path, "wb") as f:
                f.write(video_bytes)

            frames = _extract_frames(video_path, frames_dir)

            if not frames:
                raise RuntimeError(
                    "No frames extracted from video. Check ffmpeg and the uploaded file."
                )

            active_frames, active_set = _filter_static_frames(frames)
            logger.info(
                "Motion filter: %d/%d frames active for job %s",
                len(active_frames), len(frames), job_id,
            )

            logger.info(
                "Streaming %d active frames for job %s (micro-batch=%d, score every %d)",
                len(active_frames), job_id, VLM_MICRO_BATCH, SCORING_INTERVAL,
            )

            # Producer (VLM, sequential) + consumer (scorer, periodic) run concurrently.
            shared_descs: list[str] = []
            lock = threading.Lock()
            done_event = threading.Event()
            producer_error: list[BaseException] = []

            producer = threading.Thread(
                target=_vlm_producer,
                args=(active_frames, shared_descs, lock, done_event, producer_error),
                name=f"vlm-producer-{job_id[:8]}",
            )
            consumer = threading.Thread(
                target=_scorer_consumer,
                args=(job_id, shared_descs, lock, done_event),
                name=f"scorer-{job_id[:8]}",
            )

            producer.start()
            consumer.start()
            producer.join()
            consumer.join()

            if producer_error:
                raise producer_error[0]

            # Rebuild full timeline: static frames inherit the previous active
            # frame's description so posture carries forward through the motion
            # filter. Frames before the first active one default to all-no.
            active_iter = iter(shared_descs)
            default_desc = "The horse is standing upright with its head up, showing no signs of distress."
            full_descriptions: list[str] = []
            last_desc = default_desc
            for i in range(len(frames)):
                if i in active_set:
                    last_desc = next(active_iter)
                full_descriptions.append(last_desc)

            results = _score_descriptions(full_descriptions)
            results["raw_descriptions"] = full_descriptions
            job_store.set_done(job_id, results)
            logger.info(
                "Pipeline done for job %s — risk=%d/5, detections=%s",
                job_id,
                results["illness_risk_score"],
                results["detections"],
            )

    except Exception as exc:
        logger.exception("Pipeline error for job %s", job_id)
        job_store.set_error(job_id, str(exc))
