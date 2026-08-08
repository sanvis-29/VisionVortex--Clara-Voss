import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..")
    )
)

from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai_engine.agent import initialize_clara
from routes import router
from scheduler import start_scheduler, stop_scheduler


# Load root .env
ROOT_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)

load_dotenv(
    os.path.join(ROOT_DIR, ".env")
)


@asynccontextmanager
async def lifespan(app: FastAPI):

    print("[STARTUP] Initializing Clara Agent...")

    try:
        initialize_clara()
        print("[STARTUP] Clara initialized.")
    except Exception as e:
        print(f"[STARTUP WARNING] {e}")

    print("[STARTUP] Starting autonomous scheduler...")

    try:
        start_scheduler(interval_minutes=15)
    except Exception as e:
        print(f"[SCHEDULER WARNING] {e}")

    yield

    print("[SHUTDOWN] Stopping scheduler...")

    try:
        stop_scheduler()
    except Exception:
        pass


app = FastAPI(
    title="VisionVortex Clara Voss API",
    description="Autonomous editorial intelligence backend for Clara Voss.",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router)


@app.get("/")
def root():
    return {
        "message": "Clara Voss Backend API is running.",
        "agent": "clara_voss",
        "autonomy": "ACTIVE",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "agent": "clara_voss",
    }