from ai_engine.discovery import discover_all

stories = discover_all()

print(f"Discovered: {len(stories)}")

for story in stories[:5]:
    print()
    print(story["title"])
    print(story["source"])
    print(story["url"])