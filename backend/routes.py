from fastapi import APIRouter
from ai_engine.agent import get_clara_snapshot
from storage import load_saved_state

router = APIRouter(prefix="/api/agent", tags=["Agent"])

@router.get("/status")
def get_status():
    state_data = load_saved_state()
    # Ensures the required "state" field defaults to "OBSERVING"
    return {
        "state": state_data.get("state", "OBSERVING"),
        "snapshot": get_clara_snapshot()
    }

@router.get("/topics")
def get_topics():
    state_data = load_saved_state()
    return {"topics": state_data.get("topics", [])}

@router.get("/feed")
def get_feed():
    state_data = load_saved_state()
    return {"feed": state_data.get("feed", [])}

@router.get("/memory")
def get_memory():
    state_data = load_saved_state()
    return {"memory": state_data.get("memory", [])}
