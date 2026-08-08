from dotenv import load_dotenv

load_dotenv()

from ai_engine.agent import (
    initialize_clara,
    run_clara_cycle,
    get_clara_snapshot,
)


print("\nINITIALIZING CLARA")
print("=" * 60)

initial = initialize_clara()

print("Name:", initial["name"])
print("Role:", initial["role"])
print("Status:", initial["status"])


print("\nRUNNING AUTONOMOUS CYCLE")
print("=" * 60)

result = run_clara_cycle()

print("Success:", result["success"])
print("State:", result["state"])

if result["cycle"]:

    cycle = result["cycle"]

    print("Cycle Status:", cycle["status"])
    print("Discovered:", cycle["discovered"])

    if cycle.get("published"):

        print("\nPOST:")
        print(cycle["published"]["text"])

        print("\nRATIONALE:")
        print(cycle["published"]["rationale"])


print("\nCLARA SNAPSHOT")
print("=" * 60)

snapshot = get_clara_snapshot()

print(snapshot)