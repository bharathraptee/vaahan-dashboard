import sys
import os
import threading

# Ensure backend root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import companies, rtos, analytics
from services.companies_service import periodic_auto_sync_loop

app = FastAPI(title="Vahan EV Dashboard Backend", version="2.0.0")

# CORS middleware for Vercel and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all modular routers
app.include_router(companies.router)
app.include_router(rtos.router)
app.include_router(analytics.router)

@app.on_event("startup")
def start_background_auto_sync():
    """
    Spawns the continuous background auto-sync worker on application startup.
    Runs every 12 hours to auto-detect new OEMs registered on Vahan.
    """
    daemon_thread = threading.Thread(target=periodic_auto_sync_loop, daemon=True)
    daemon_thread.start()
    print("[STARTUP] 12-hour background auto-detection daemon started successfully.")

@app.get("/")
def root():
    return {"status": "ok", "message": "Vahan EV Dashboard Backend is running"}
