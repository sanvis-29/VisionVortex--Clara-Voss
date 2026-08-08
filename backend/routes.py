from fastapi import APIRouter
import json
import os

router = APIRouter(prefix="/api/agent", tags=["Agent"])

DB_FILE = "latest_state.json"

def safe_load_state():
    """Safely loads saved state without breaking if storage.py is different."""
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "state": "OBSERVING",
        "topics": [],
        "feed": [],
        "memory": []
    }

@router.get("/status")
def get_status():
    data = safe_load_state()
    return {
        "state": data.get("state", "OBSERVING"),
        "snapshot": {}
    }

@router.get("/topics")
def get_topics():
    data = safe_load_state()
    return {"topics": data.get("topics", [])}

@router.get("/feed")
def get_feed():
    data = safe_load_state()
    return {"feed": data.get("feed", [])}

@router.get("/memory")
def get_memory():
    data = safe_load_state()
    return {"memory": data.get("memory", [])}