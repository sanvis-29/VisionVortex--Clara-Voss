from dotenv import load_dotenv

load_dotenv()

from ai_engine.pipeline import run_editorial_cycle


result = run_editorial_cycle(
    agent_id="clara_voss"
)

print()
print("=" * 72)
print("FINAL RESULT")
print("=" * 72)

print()
print("Status:")
print(result["status"])

print()
print("Discovered:")
print(result["discovered"])

if result.get("published"):
    print()
    print("POST:")
    print(result["published"]["text"])

    print()
    print("RATIONALE:")
    print(result["published"]["rationale"])

else:
    print()
    print("NO PUBLICATION")
    print(result.get("message"))

print()
print("Rejected:")
print(result.get("rejected_count", len(result.get("rejected", []))))