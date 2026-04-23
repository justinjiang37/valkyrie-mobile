"""Supabase client for writing CV results back to the shared DB."""

from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        logger.warning("SUPABASE_URL / SUPABASE_SERVICE_KEY not set; Supabase writes disabled.")
        return None
    try:
        from supabase import create_client
        _client = create_client(url, key)
        return _client
    except Exception:
        logger.exception("Failed to initialize Supabase client")
        return None


# Map horse_id in FastAPI → stall_id in Supabase.
HORSE_TO_STALL = {
    "bella": "s2",
}


def _status_from_score(overall: int) -> str:
    if overall >= 80:
        return "critical"
    if overall >= 60:
        return "at-risk"
    if overall >= 30:
        return "watch"
    return "healthy"


def write_health_score(horse_id: str, results: dict[str, Any]) -> None:
    """Insert a health_scores row from an InferenceResult dict. Best-effort."""
    client = _get_client()
    if client is None:
        return

    stall_id = HORSE_TO_STALL.get(horse_id.lower())
    if stall_id is None:
        logger.warning("No stall mapping for horse %s; skipping Supabase write", horse_id)
        return

    risk = results.get("illness_risk_score")
    if not isinstance(risk, (int, float)):
        return

    # 1-5 illness risk → 0-100 "overall" (higher = worse), matching the
    # frontend's conversion in AppContext.tsx.
    overall = int((risk - 1) * 20 + 10)
    overall = max(0, min(100, overall))
    status = _status_from_score(overall)

    try:
        client.table("health_scores").insert({
            "stall_id": stall_id,
            "overall": overall,
            "movement": overall,
            "posture": overall,
            "feeding": overall,
            "activity": overall,
            "status": status,
        }).execute()
    except Exception:
        logger.exception("Supabase health_scores insert failed for %s", horse_id)
