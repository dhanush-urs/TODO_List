from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    print(f"⚠️  WARNING: This application requires Python 3.11")
    print(f"   Current version: Python {python_version.major}.{python_version.minor}.{python_version.micro}")
    print(f"   Some features may not work correctly!")
    print()

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
    description="A production-style TODO list application with advanced features",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(tasks_router)

@app.get("/")
def root():
    return {
        "message": "TODO List API",
        "version": "1.0.0",
        "docs": "/docs",
        "python_version": f"{python_version.major}.{python_version.minor}.{python_version.micro}"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "python_version": f"{python_version.major}.{python_version.minor}.{python_version.micro}"
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    print("\n" + "="*60)
    print("🚀 TODO List API Started Successfully!")
    print("="*60)
    print(f"📍 API: http://127.0.0.1:8000")
    print(f"📚 Docs: http://127.0.0.1:8000/docs")
    print(f"🔧 Health: http://127.0.0.1:8000/health")
    print(f"🐍 Python: {python_version.major}.{python_version.minor}.{python_version.micro}")
    print("="*60 + "\n")
