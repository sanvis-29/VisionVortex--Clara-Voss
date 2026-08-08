import json
import os
import re
from datetime import datetime, timezone

MEMORY_FILE = os.path.join(
    os.path.dirname(__file__),
    "memory_store.json",
)


def _normalize(text):
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def _load_store():
    if not os.path.exists(MEMORY_FILE):
        return {
            "memories": [],
            "beliefs": [],
        }

    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        if not isinstance(data, dict):
            return {
                "memories": [],
                "beliefs": [],
            }

        data.setdefault("memories", [])
        data.setdefault("beliefs", [])

        return data

    except Exception as exc:
        print(f"[Memory] Could not load store: {exc}")

        return {
            "memories": [],
            "beliefs": [],
        }


def _save_store(store):
    try:
        with open(MEMORY_FILE, "w", encoding="utf-8") as file:
            json.dump(
                store,
                file,
                indent=2,
                ensure_ascii=False,
            )

    except Exception as exc:
        print(f"[Memory] Could not save store: {exc}")


def get_memories():
    store = _load_store()

    return store["memories"]


def get_beliefs():
    store = _load_store()

    return store["beliefs"]


def add_memory(
    topic,
    entities,
    main_claim,
    angle,
    stance,
    sources=None,
    post_text=None,
):
    store = _load_store()

    memory = {
        "id": f"memory_{len(store['memories']) + 1}",
        "topic": topic,
        "entities": entities or [],
        "main_claim": main_claim,
        "angle": angle,
        "stance": stance,
        "sources": sources or [],
        "post_text": post_text or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    store["memories"].append(memory)

    _save_store(store)

    return memory


def add_belief(
    text,
    status="STABLE",
    strength=0.5,
):
    store = _load_store()

    belief = {
        "id": f"belief_{len(store['beliefs']) + 1}",
        "text": text,
        "status": status,
        "strength": strength,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    store["beliefs"].append(belief)

    _save_store(store)

    return belief


def update_belief(
    belief_id,
    status,
    strength=None,
):
    store = _load_store()

    for belief in store["beliefs"]:
        if belief["id"] == belief_id:
            belief["status"] = status
            belief["updated_at"] = datetime.now(
                timezone.utc
            ).isoformat()

            if strength is not None:
                belief["strength"] = strength

            _save_store(store)

            return belief

    return None


def find_related_memories(
    candidate_title,
    candidate_summary="",
    limit=5,
):
    """
    Lightweight semantic-ish matching for MVP.
    No vector DB required yet.
    """

    memories = get_memories()

    candidate_text = _normalize(
        f"{candidate_title} {candidate_summary}"
    )

    candidate_words = set(candidate_text.split())

    ranked = []

    for memory in memories:
        memory_text = _normalize(
            " ".join(
                [
                    str(memory.get("topic", "")),
                    str(memory.get("main_claim", "")),
                    str(memory.get("angle", "")),
                    " ".join(memory.get("entities", [])),
                ]
            )
        )

        memory_words = set(memory_text.split())

        if not candidate_words or not memory_words:
            similarity = 0

        else:
            overlap = candidate_words & memory_words

            similarity = len(overlap) / max(
                len(candidate_words),
                1,
            )

        ranked.append(
            {
                **memory,
                "similarity": round(similarity, 3),
            }
        )

    ranked.sort(
        key=lambda item: item["similarity"],
        reverse=True,
    )

    return ranked[:limit]


def has_significant_overlap(
    candidate_title,
    candidate_summary="",
    threshold=0.35,
):
    related = find_related_memories(
        candidate_title,
        candidate_summary,
        limit=1,
    )

    if not related:
        return {
            "overlap": False,
            "similarity": 0,
            "memory": None,
        }

    best = related[0]

    return {
        "overlap": best["similarity"] >= threshold,
        "similarity": best["similarity"],
        "memory": best,
    }


def memory_summary():
    store = _load_store()

    return {
        "memory_count": len(store["memories"]),
        "belief_count": len(store["beliefs"]),
        "recent_memories": store["memories"][-5:],
        "beliefs": store["beliefs"],
    }