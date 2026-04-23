# Valkyrie Backend — Fully Local CV Pipeline

FastAPI + Qwen3-VL-2B-Instruct running **fully locally**. For each registered horse, analyzes a pre-recorded video and returns an illness-risk score (1–5) plus behavioral detections.

Horses and their video paths are registered in `HORSE_VIDEOS` at the top of [main.py](main.py). Add a new entry (and drop the video in `backend/videos/`) to enable analysis for another horse — no other changes needed.

## Setup

Requires Python 3.10+ and `ffmpeg` on PATH.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Mac: `brew install ffmpeg` if needed.

First inference call downloads ~5 GB of Qwen3-VL weights to `~/.cache/huggingface/`.

## Run

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

## Endpoints

- `GET  /health` — also lists registered horses
- `POST /api/horses/{horse_id}/analyze` — start analysis; returns `{job_id, status: "queued"}`
- `GET  /api/horses/{horse_id}/status` — latest job for that horse (partial results stream in during processing)
- `GET  /api/jobs/{job_id}` — poll any job by id

## Quick test

```bash
curl -X POST http://localhost:8000/api/horses/bella/analyze
# then poll:
curl http://localhost:8000/api/horses/bella/status
```

Expected for `horse-rolling17.mov`: `illness_risk_score: 5`, `detections: ["rolling"]`.
