from fastapi import APIRouter
import json
import os

router = APIRouter(prefix="/api/agent", tags=["Agent"])

DB_FILE = "latest_state.json"


def safe_load_state():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    return {
        "success": True,
        "agent": "clara_voss",
        "state": "OBSERVING",
        "cycle": {
            "status": "SILENCE",
            "discovered": 0,
            "published": None,
            "rejected": [],
            "top_candidates": [],
        },
    }


@router.get("/status")
def get_status():
    data = safe_load_state()
    cycle = data.get("cycle", {})

    return {
        "id": data.get("agent", "clara_voss"),
        "state": data.get("state", "OBSERVING"),
        "active": data.get("success", True),
        "cycle_status": cycle.get("status", "SILENCE"),
        "discovered": cycle.get("discovered", 0),
        "rejected": len(cycle.get("rejected", [])),
        "published": 1 if cycle.get("published") else 0,
        "message": cycle.get("message", ""),
        "started_at": cycle.get("started_at"),
        "finished_at": cycle.get("finished_at"),
    }


@router.get("/topics")
def get_topics():
    data = safe_load_state()
    cycle = data.get("cycle", {})

    topics = cycle.get("top_candidates", [])

    return {
        "topics": topics
    }


@router.get("/feed")
def get_feed():
    data = safe_load_state()
    cycle = data.get("cycle", {})

    published = cycle.get("published")

    if not published:
        return {
            "posts": []
        }

    return {
        "posts": [
            {
                "id": "latest_post",
                "text": published.get("text"),
                "rationale": published.get("rationale"),
                "topic": published.get("topic"),
                "entities": published.get("entities", []),
                "mainClaim": published.get("main_claim"),
                "angle": published.get("angle"),
                "stance": published.get("stance"),
                "sources": published.get("sources", []),
                "createdAt": published.get("created_at"),
            }
        ]
    }


@router.get("/memory")
def get_memory():
    try:
        from ai_engine.memory import memory_summary

        summary = memory_summary()

        return {
            "memories": summary.get("recent_memories", []),
            "beliefs": summary.get("beliefs", []),
            "memory_count": summary.get("memory_count", 0),
            "belief_count": summary.get("belief_count", 0),
        }

    except Exception as exc:
        return {
            "memories": [],
            "beliefs": [],
            "memory_count": 0,
            "belief_count": 0,
            "error": str(exc),
        }