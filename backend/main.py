import sys
import os

# Root folder ko Python path me add kar rahe hain
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai_engine.agent import initialize_clara
from routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[STARTUP] Initializing Clara Agent...")
    try:
        initialize_clara()
    except Exception as e:
        print(f"[STARTUP WARNING] {e}")
    yield

app = FastAPI(title="VisionVortex Clara Voss API", lifespan=lifespan)

# Allow CORS
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
    return {"message": "Clara Voss Backend API is running."}
