from ai_engine.discovery import discover_all
from ai_engine.scorer import rank_candidates

stories = discover_all()

ranked = rank_candidates(stories)

for story in ranked[:10]:
    print()
    print("=" * 70)
    print(story["title"])
    print("Score:", story["score"])
    print("Decision:", story["decision"])
    print("Reason:", story["reason"])
    print("Breakdown:", story["breakdown"])