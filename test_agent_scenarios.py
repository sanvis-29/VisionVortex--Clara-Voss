from dotenv import load_dotenv

load_dotenv()

from ai_engine.scorer import editorial_score
from ai_engine.writer import generate_post
from ai_engine.memory import (
    get_memories,
    get_beliefs,
    find_related_memories,
)


def print_result(name, story, memories=None):
    result = editorial_score(
        story,
        memories=memories or [],
    )

    print("\n" + "=" * 72)
    print(name)
    print("=" * 72)

    print("TITLE:")
    print(story["title"])

    print("\nSCORE:")
    print(result["score"])

    print("\nDECISION:")
    print(result["decision"])

    print("\nREASON:")
    print(result["reason"])

    print("\nBREAKDOWN:")
    for key, value in result["breakdown"].items():
        print(f"{key}: {value}")

    return result


# ============================================================
# SCENARIO 1 — SHOULD REJECT
# ============================================================

reject_story = {
    "title": "Celebrity uses AI chatbot to plan vacation",
    "summary": (
        "A celebrity posted screenshots showing an AI chatbot "
        "being used to choose restaurants during a vacation."
    ),
    "url": "https://example.com/celebrity-ai",
    "source": "Hacker News",
    "published_at": "2026-08-08T12:00:00+00:00",
    "engagement": 120,
}

print_result(
    "TEST 1 — LOW VALUE / REJECT",
    reject_story,
)


# ============================================================
# SCENARIO 2 — SHOULD WATCH OR BORDERLINE
# ============================================================

watch_story = {
    "title": "New AI benchmark shows modest improvement in reasoning",
    "summary": (
        "A newly released model improves a reasoning benchmark "
        "by several percentage points but introduces no major "
        "new deployment capability."
    ),
    "url": "https://example.com/benchmark",
    "source": "Hacker News",
    "published_at": "2026-08-08T12:00:00+00:00",
    "engagement": 95,
}

print_result(
    "TEST 2 — BORDERLINE / WATCH",
    watch_story,
)


# ============================================================
# SCENARIO 3 — SHOULD PUBLISH
# ============================================================

publish_story = {
    "title": (
        "Major open-source autonomous AI agent released with "
        "persistent browser access and tool permissions"
    ),
    "summary": (
        "A major AI research lab released an open-source autonomous "
        "agent capable of persistent browser interaction, tool execution, "
        "repository modification and long-running workflows. "
        "The release includes a permissive license and new security "
        "controls for tool permissions."
    ),
    "url": "https://github.com/example/autonomous-agent",
    "source": "Hacker News",
    "published_at": "2026-08-08T13:45:00+00:00",
    "engagement": 650,
}

publish_result = print_result(
    "TEST 3 — STRONG STORY / PUBLISH",
    publish_story,
)


# ============================================================
# SCENARIO 4 — MEMORY CHECK
# ============================================================

memories = get_memories()

related = find_related_memories(
    publish_story["title"],
    publish_story["summary"],
    limit=3,
)

print("\n" + "=" * 72)
print("TEST 4 — MEMORY RETRIEVAL")
print("=" * 72)

if related:
    for item in related:
        print()
        print("Topic:", item.get("topic"))
        print("Similarity:", item.get("similarity"))
        print("Angle:", item.get("angle"))
else:
    print("No related memories yet.")


# ============================================================
# SCENARIO 5 — WRITER TEST
# ============================================================

if publish_result["decision"] == "PUBLISH":

    print("\n" + "=" * 72)
    print("TEST 5 — WRITER")
    print("=" * 72)

    generated = generate_post(
        story={
            **publish_story,
            **publish_result,
        },
        related_memories=related,
        beliefs=get_beliefs(),
    )

    print("\nPOST:")
    print(generated.get("post_text"))

    print("\nRATIONALE:")
    print(generated.get("rationale"))

    print("\nANGLE:")
    print(generated.get("angle"))

    print("\nSTANCE:")
    print(generated.get("stance"))

    print("\nBELIEF UPDATES:")
    print(generated.get("belief_updates"))