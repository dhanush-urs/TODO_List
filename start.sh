#!/bin/bash

echo "🚀 Starting TODO App..."

# Activate venv
source venv/bin/activate

# Start backend
echo "Starting backend..."
uvicorn backend.main:app --reload &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd frontend
python3 -m http.server 5500 &
FRONTEND_PID=$!
cd ..

# Give servers time
sleep 2

echo ""
echo "=========================================="
echo "🚀 Application Started Successfully"
echo "=========================================="
echo "Backend API:  http://127.0.0.1:8000"
echo "API Docs:     http://127.0.0.1:8000/docs"
echo "Frontend UI:  http://localhost:5500"
echo "=========================================="

# Open browser (Mac)
open http://localhost:5500

# Handle Ctrl+C
trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Keep script running
wait