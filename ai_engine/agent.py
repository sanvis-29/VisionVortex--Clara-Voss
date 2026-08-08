from datetime import datetime, timezone

from ai_engine.persona import CLARA_PERSONA
from ai_engine.pipeline import run_editorial_cycle
from ai_engine.memory import (
    get_beliefs,
    add_belief,
    memory_summary,
)


def initialize_clara():
    """
    Initialize Clara's persistent editorial identity.

    Safe to call multiple times.
    Existing beliefs will not be duplicated.
    """

    existing_beliefs = get_beliefs()

    if not existing_beliefs:
        print("[Clara] Initializing editorial world model...")

        for belief in CLARA_PERSONA.get("beliefs", []):
            add_belief(
                text=belief["text"],
                status="STABLE",
                strength=belief.get("strength", 0.5),
            )

    return {
        "id": "clara_voss",
        "name": CLARA_PERSONA["name"],
        "role": CLARA_PERSONA["role"],
        "philosophy": CLARA_PERSONA["philosophy"],
        "status": "ACTIVE",
        "initialized_at": datetime.now(timezone.utc).isoformat(),
        "memory": memory_summary(),
    }


def run_clara_cycle():
    """
    Main function the backend should call.

    Executes one autonomous editorial cycle and
    returns JSON-compatible state.
    """

    initialize_clara()

    try:
        result = run_editorial_cycle(
            agent_id="clara_voss"
        )

        return {
            "success": True,
            "agent": "clara_voss",
            "state": (
                "PUBLISHING"
                if result.get("status") == "PUBLISHED"
                else "OBSERVING"
            ),
            "cycle": result,
        }

    except Exception as exc:
        print(f"[Clara] Editorial cycle failed: {exc}")

        return {
            "success": False,
            "agent": "clara_voss",
            "state": "OBSERVING",
            "error": str(exc),
            "cycle": None,
        }


def get_clara_snapshot():
    """
    Lightweight state for frontend/status API.
    Does NOT trigger generation.
    """

    summary = memory_summary()

    return {
        "id": "clara_voss",
        "name": CLARA_PERSONA["name"],
        "role": CLARA_PERSONA["role"],
        "philosophy": CLARA_PERSONA["philosophy"],
        "state": "OBSERVING",
        "memory_count": summary["memory_count"],
        "belief_count": summary["belief_count"],
        "beliefs": summary["beliefs"],
    }