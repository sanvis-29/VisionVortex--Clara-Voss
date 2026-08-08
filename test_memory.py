from ai_engine.memory import (
    add_memory,
    get_memories,
    find_related_memories,
    memory_summary,
)

add_memory(
    topic="AI coding agents",
    entities=[
        "GitHub Copilot",
        "Claude Code",
    ],
    main_claim="Coding assistants are becoming workflow operators.",
    angle="Autonomy is becoming more important than autocomplete.",
    stance="Agents are moving from suggestion systems to action systems.",
    sources=[
        "https://example.com"
    ],
    post_text=(
        "Coding assistants are becoming coding operators."
    ),
)

print("\nALL MEMORIES")
print(get_memories())

print("\nRELATED MEMORY TEST")

matches = find_related_memories(
    "New autonomous coding agent released",
    "The agent can modify repositories and execute development tasks."
)

for match in matches:
    print()
    print("Topic:", match["topic"])
    print("Similarity:", match["similarity"])

print("\nMEMORY SUMMARY")
print(memory_summary())