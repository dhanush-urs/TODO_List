from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base
from routers.tasks import router as tasks_router
import models

# Verify Python version
python_version = sys.version_info
if python_version.major != 3 or python_version.minor != 11:
    print(f"⚠️  WARNING: This application ideally runs with Python 3.11")
    print(f"   Current version: Python {python_version.major}.{python_version.minor}.{python_version.micro}")

print(f"✅ Running with Python {python_version.major}.{python_version.minor}.{python_version.micro}")

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")
except Exception as e:
    print(f"❌ Failed to create database tables: {e}")
    sys.exit(1)

# Initialize FastAPI app
app = FastAPI(
    title="TODO List API",
    description="A production-style TODO list application ready for Railway deployment",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for frontend access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(tasks_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Optional: Serve static frontend files if they exist
# This mounts the frontend directory to the root.
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend')
if os.path.isdir(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return {
            "message": "TODO List API",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/health",
            "frontend": "Not found locally"
        }

# Startup event
@app.on_event("startup")
async def startup_event():
    print("\n" + "="*60)
    print("🚀 TODO List API Started Successfully!")
    print("="*60)
    print(f"📍 API Docs: /docs")
    print(f"🔧 Health: /health")
    if os.path.isdir(frontend_dir):
        print(f"🌐 Frontend served at: /")
    print("="*60 + "\n")
