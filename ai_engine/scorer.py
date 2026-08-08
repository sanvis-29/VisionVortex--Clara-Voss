import math
import re
from datetime import datetime, timezone
from urllib.parse import urlparse

from ai_engine.persona import CLARA_PERSONA


AI_KEYWORDS = {
    "ai",
    "artificial intelligence",
    "agent",
    "agents",
    "llm",
    "model",
    "models",
    "deepmind",
    "openai",
    "anthropic",
    "claude",
    "gemini",
    "deepseek",
    "machine learning",
    "ml",
    "neural",
    "inference",
    "reasoning",
    "robotics",
    "autonomous",
    "gpu",
    "nvidia",
    "open source",
    "security",
    "prompt injection",
    "tool use",
}

HIGH_IMPACT_WORDS = {
    "launch",
    "release",
    "released",
    "breakthrough",
    "security",
    "vulnerability",
    "exploit",
    "open source",
    "open-source",
    "agent",
    "agents",
    "autonomous",
    "inference",
    "cost",
    "pricing",
    "benchmark",
    "research",
    "architecture",
    "permissions",
    "browser",
    "tool use",
}

HYPE_WORDS = {
    "revolutionary",
    "game-changing",
    "insane",
    "mind-blowing",
    "unbelievable",
    "shocking",
    "viral",
    "ultimate",
    "world-changing",
    "best ever",
}


TRUSTED_DOMAINS = {
    "openai.com",
    "anthropic.com",
    "deepmind.google",
    "googleblog.com",
    "github.com",
    "arxiv.org",
    "nature.com",
    "science.org",
    "microsoft.com",
    "meta.com",
    "nvidia.com",
    "huggingface.co",
}


def clamp(value, minimum=0, maximum=100):
    return max(minimum, min(maximum, value))


def normalize_text(text):
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def contains_any(text, phrases):
    text = normalize_text(text)
    return any(phrase in text for phrase in phrases)


def domain_from_url(url):
    try:
        domain = urlparse(url).netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        return domain
    except Exception:
        return ""


def score_relevance(story):
    text = f"{story.get('title', '')} {story.get('summary', '')}".lower()

    matches = sum(1 for keyword in AI_KEYWORDS if keyword in text)

    if matches == 0:
        return 15

    return clamp(35 + matches * 12)


def score_consequence(story):
    text = f"{story.get('title', '')} {story.get('summary', '')}".lower()

    score = 35

    matches = sum(1 for word in HIGH_IMPACT_WORDS if word in text)
    score += matches * 8

    engagement = story.get("engagement", 0) or 0

    if engagement > 300:
        score += 12
    elif engagement > 100:
        score += 8
    elif engagement > 30:
        score += 4

    return clamp(score)


def score_novelty(story):
    text = f"{story.get('title', '')} {story.get('summary', '')}".lower()

    score = 50

    novelty_terms = [
        "new",
        "launch",
        "release",
        "released",
        "breakthrough",
        "first",
        "introduces",
        "debuts",
        "unveils",
        "open-sources",
        "open source",
    ]

    matches = sum(1 for term in novelty_terms if term in text)
    score += matches * 8

    return clamp(score)


def score_credibility(story):
    url = story.get("url", "")
    domain = domain_from_url(url)

    score = 55

    if domain in TRUSTED_DOMAINS:
        score = 92
    elif story.get("source") == "Hacker News":
        score = 68

    return clamp(score)


def score_timeliness(story):
    published_at = story.get("published_at")

    if not published_at:
        return 60

    try:
        published = datetime.fromisoformat(
            published_at.replace("Z", "+00:00")
        )

        now = datetime.now(timezone.utc)

        age_hours = (now - published).total_seconds() / 3600

        if age_hours <= 6:
            return 100
        if age_hours <= 24:
            return 88
        if age_hours <= 72:
            return 70
        if age_hours <= 168:
            return 50

        return 30

    except Exception:
        return 60


def score_discussion_potential(story):
    engagement = story.get("engagement", 0) or 0

    if engagement >= 500:
        return 95
    if engagement >= 250:
        return 85
    if engagement >= 100:
        return 75
    if engagement >= 40:
        return 65
    if engagement >= 10:
        return 50

    return 35


def hype_penalty(story):
    text = f"{story.get('title', '')} {story.get('summary', '')}".lower()

    matches = sum(1 for word in HYPE_WORDS if word in text)

    return clamp(matches * 18, 0, 80)


def repetition_penalty(story, memories=None):
    if not memories:
        return 0

    candidate_title = normalize_text(story.get("title", ""))

    if not candidate_title:
        return 0

    candidate_words = set(candidate_title.split())

    best_overlap = 0

    for memory in memories:
        memory_text = normalize_text(
            " ".join(
                [
                    str(memory.get("topic", "")),
                    str(memory.get("angle", "")),
                    str(memory.get("main_claim", "")),
                ]
            )
        )

        memory_words = set(memory_text.split())

        if not memory_words:
            continue

        overlap = len(candidate_words & memory_words) / max(
            len(candidate_words), 1
        )

        best_overlap = max(best_overlap, overlap)

    if best_overlap >= 0.65:
        return 75

    if best_overlap >= 0.45:
        return 45

    if best_overlap >= 0.25:
        return 20

    return 0


def editorial_score(story, memories=None):
    relevance = score_relevance(story)
    consequence = score_consequence(story)
    novelty = score_novelty(story)
    credibility = score_credibility(story)
    timeliness = score_timeliness(story)
    discussion = score_discussion_potential(story)

    hype = hype_penalty(story)
    repetition = repetition_penalty(story, memories)

    total = (
        0.25 * consequence
        + 0.20 * novelty
        + 0.20 * relevance
        + 0.15 * credibility
        + 0.10 * timeliness
        + 0.10 * discussion
        - 0.20 * hype
        - 0.25 * repetition
    )

    score = round(clamp(total), 1)

    if relevance < 35:
        decision = "REJECT"
        reason = "Outside Clara's primary editorial domain."

    elif credibility < 45:
        decision = "REJECT"
        reason = "Source credibility is too weak for publication."

    elif repetition >= 60:
        decision = "REJECT"
        reason = "Substantially overlaps with Clara's previous coverage."

    elif score >= 72:
        decision = "PUBLISH"
        reason = (
            "Clears Clara's editorial threshold with sufficient consequence, "
            "relevance, novelty, and sourcing quality."
        )

    elif score >= 58:
        decision = "WATCH"
        reason = (
            "Potentially meaningful, but not yet strong enough to justify publication."
        )

    else:
        decision = "REJECT"
        reason = (
            "Does not introduce enough consequence or editorial value "
            "to justify publication."
        )

    return {
        "score": score,
        "decision": decision,
        "reason": reason,
        "breakdown": {
            "consequence": consequence,
            "novelty": novelty,
            "relevance": relevance,
            "credibility": credibility,
            "timeliness": timeliness,
            "discussion_potential": discussion,
            "hype_penalty": hype,
            "repetition_penalty": repetition,
        },
    }


def rank_candidates(stories, memories=None):
    scored = []

    for story in stories:
        result = editorial_score(story, memories)

        scored.append(
            {
                **story,
                **result,
            }
        )

    return sorted(
        scored,
        key=lambda item: item["score"],
        reverse=True,
    )