from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai_engine.agent import initialize_clara
from scheduler import start_scheduler, stop_scheduler
from routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Agent at startup
    print("[STARTUP] Initializing Clara Agent...")
    initialize_clara()
    
    # 2. Start Background Scheduler (runs cycle every 15 minutes)
    start_scheduler(interval_minutes=15)
    
    yield
    
    # 3. Shutdown cleanup
    stop_scheduler()

app = FastAPI(title="VisionVortex Clara Voss API", lifespan=lifespan)

# Allow CORS for Frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API endpoints
app.include_router(router)

@app.get("/")
def root():
    return {"message": "Clara Voss Backend API is running."}
