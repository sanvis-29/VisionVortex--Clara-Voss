from dotenv import load_dotenv

load_dotenv()

from ai_engine.writer import generate_post


story = {
    "title": "OpenAI agents gain persistent browser access",
    "summary": (
        "A new agent capability allows persistent browser interaction "
        "across longer-running tasks."
    ),
    "url": "https://example.com",
    "source": "Example Source",
    "score": 89,
    "decision": "PUBLISH",
    "breakdown": {
        "consequence": 92,
        "novelty": 84,
        "relevance": 96,
        "credibility": 88,
    },
}

memories = [
    {
        "topic": "AI coding agents",
        "main_claim": "Coding assistants are becoming workflow operators.",
        "angle": "Autonomy over autocomplete.",
        "stance": "Agents are becoming action systems.",
    }
]

beliefs = [
    {
        "id": "belief_1",
        "text": (
            "AI agents become meaningful when they can take actions, "
            "not merely generate text."
        ),
        "strength": 0.85,
    }
]

result = generate_post(
    story,
    memories,
    beliefs,
)

print()
print("POST")
print(result["post_text"])

print()
print("RATIONALE")
print(result["rationale"])

print()
print("ANGLE")
print(result["angle"])

print()
print("STANCE")
print(result["stance"])

print()
print("BELIEF UPDATES")
print(result["belief_updates"])