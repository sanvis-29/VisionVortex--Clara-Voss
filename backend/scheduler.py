import sys
import os

# Add root project folder to Python path so ai_engine can be imported from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from apscheduler.schedulers.background import BackgroundScheduler
from ai_engine.agent import run_clara_cycle
from storage import save_cycle_result

scheduler = BackgroundScheduler()

def job_run_clara():
    print("[SCHEDULER] Running Clara autonomous cycle...")
    try:
        result = run_clara_cycle()
        if result:
            save_cycle_result(result)
            print("[SCHEDULER] Cycle completed and state saved.")
    except Exception as e:
        print(f"[SCHEDULER ERROR] Cycle failed: {e}")

def start_scheduler(interval_minutes=15):
    scheduler.add_job(job_run_clara, 'interval', minutes=interval_minutes)
    scheduler.start()
    print(f"[SCHEDULER] Started running every {interval_minutes} minutes.")

def stop_scheduler():
    scheduler.shutdown()
    print("[SCHEDULER] Stopped.")