from datetime import datetime, timezone

from ai_engine.discovery import discover_all
from ai_engine.scorer import rank_candidates
from ai_engine.memory import (
    get_memories,
    get_beliefs,
    find_related_memories,
    add_memory,
    update_belief,
)
from ai_engine.writer import generate_post


PUBLISH_THRESHOLD = 72


def _apply_belief_updates(belief_updates):
    """
    Apply Clara's generated belief changes to persistent memory.
    """

    if not belief_updates:
        return []

    updated = []

    for item in belief_updates:
        belief_id = item.get("belief_id")
        effect = item.get("effect", "STABLE")

        if not belief_id:
            continue

        result = update_belief(
            belief_id=belief_id,
            status=effect,
        )

        if result:
            updated.append(
                {
                    "belief_id": belief_id,
                    "effect": effect,
                    "reason": item.get("reason", ""),
                }
            )

    return updated


def _build_rejected_log(ranked_candidates):
    rejected = []

    for story in ranked_candidates:
        if story["decision"] == "PUBLISH":
            continue

        rejected.append(
            {
                "title": story.get("title"),
                "url": story.get("url"),
                "source": story.get("source"),
                "score": story.get("score"),
                "decision": story.get("decision"),
                "reason": story.get("reason"),
                "breakdown": story.get("breakdown", {}),
            }
        )

    return rejected


def run_editorial_cycle(agent_id="clara_voss"):
    """
    Complete autonomous Clara editorial cycle.

    1. Discover live stories
    2. Retrieve editorial memory
    3. Score/rank candidates
    4. Reject weak stories
    5. Select strongest publishable story
    6. Retrieve relevant memories
    7. Generate post + rationale
    8. Persist memory
    9. Update beliefs
    10. Return cycle result
    """

    started_at = datetime.now(timezone.utc).isoformat()

    print()
    print("=" * 72)
    print("CLARA VOSS — EDITORIAL CYCLE")
    print("=" * 72)

    print("\n[1/7] Discovering live signals...")

    stories = discover_all()

    print(f"Discovered {len(stories)} stories.")

    if not stories:
        return {
            "agent_id": agent_id,
            "started_at": started_at,
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "status": "NO_SIGNALS",
            "discovered": 0,
            "published": None,
            "rejected": [],
            "message": "No live stories were discovered.",
        }

    print("\n[2/7] Loading editorial memory...")

    memories = get_memories()
    beliefs = get_beliefs()

    print(f"Loaded {len(memories)} memories.")
    print(f"Loaded {len(beliefs)} beliefs.")

    print("\n[3/7] Scoring editorial candidates...")

    ranked = rank_candidates(
        stories,
        memories=memories,
    )

    for candidate in ranked[:5]:
        print(
            f"{candidate['score']:>5} | "
            f"{candidate['decision']:<7} | "
            f"{candidate['title']}"
        )

    rejected = _build_rejected_log(ranked)

    print("\n[4/7] Choosing publication candidate...")

    publishable = [
        candidate
        for candidate in ranked
        if candidate["decision"] == "PUBLISH"
        and candidate["score"] >= PUBLISH_THRESHOLD
    ]

    if not publishable:
        print("No story cleared Clara's editorial threshold.")

        return {
            "agent_id": agent_id,
            "started_at": started_at,
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "status": "SILENCE",
            "discovered": len(stories),
            "published": None,
            "rejected": rejected,
            "top_candidates": ranked[:5],
            "message": (
                f"{len(stories)} developments reviewed. "
                "None exceeded Clara's editorial threshold."
            ),
        }

    selected = publishable[0]

    print()
    print("SELECTED:")
    print(selected["title"])
    print("Score:", selected["score"])

    print("\n[5/7] Retrieving related memories...")

    related_memories = find_related_memories(
        candidate_title=selected.get("title", ""),
        candidate_summary=selected.get("summary", ""),
        limit=3,
    )

    useful_memories = [
        memory
        for memory in related_memories
        if memory.get("similarity", 0) > 0
    ]

    print(f"Found {len(useful_memories)} related memories.")

    print("\n[6/7] Generating Clara's editorial post...")

    generated = generate_post(
        story=selected,
        related_memories=useful_memories,
        beliefs=beliefs,
    )

    print("Post generated.")

    print("\n[7/7] Updating editorial memory...")

    new_memory = add_memory(
        topic=generated.get(
            "topic",
            selected.get("title", "AI / Technology"),
        ),
        entities=generated.get("entities", []),
        main_claim=generated.get(
            "main_claim",
            generated.get("post_text", "")[:180],
        ),
        angle=generated.get(
            "angle",
            "Consequence over announcement",
        ),
        stance=generated.get(
            "stance",
            "Analytical",
        ),
        sources=[
            selected.get("url")
        ]
        if selected.get("url")
        else [],
        post_text=generated.get("post_text", ""),
    )

    belief_updates = _apply_belief_updates(
        generated.get("belief_updates", [])
    )

    finished_at = datetime.now(timezone.utc).isoformat()

    print()
    print("=" * 72)
    print("PUBLICATION COMPLETE")
    print("=" * 72)

    return {
        "agent_id": agent_id,
        "started_at": started_at,
        "finished_at": finished_at,
        "status": "PUBLISHED",

        "discovered": len(stories),
        "rejected_count": len(rejected),

        "selected_story": {
            "title": selected.get("title"),
            "summary": selected.get("summary"),
            "url": selected.get("url"),
            "source": selected.get("source"),
            "score": selected.get("score"),
            "decision": selected.get("decision"),
            "reason": selected.get("reason"),
            "breakdown": selected.get("breakdown", {}),
        },

        "published": {
            "text": generated.get("post_text"),
            "rationale": generated.get("rationale"),
            "topic": generated.get("topic"),
            "entities": generated.get("entities", []),
            "main_claim": generated.get("main_claim"),
            "angle": generated.get("angle"),
            "stance": generated.get("stance"),
            "sources": [
                selected.get("url")
            ]
            if selected.get("url")
            else [],
            "created_at": finished_at,
        },

        "memory_created": new_memory,

        "belief_updates": belief_updates,

        "rejected": rejected,

        "top_candidates": ranked[:5],
    }