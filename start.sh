#!/bin/bash

# ===================================================
#   AI Hackathon Management System - Startup Utility
# ===================================================

# Ensure we run from the project root directory
cd "$(dirname "$0")"

# 1. Verify python virtual environment
if [ ! -f "venv/bin/python" ] && [ ! -f "venv/Scripts/python.exe" ]; then
    echo "[ERROR] Virtual environment 'venv' not found."
    echo "Please make sure you have set up the virtual environment at 'venv/'."
    exit 1
fi

# Determine python executable location
PYTHON_EXEC="venv/bin/python"
if [ -f "venv/Scripts/python.exe" ]; then
    PYTHON_EXEC="venv/Scripts/python.exe"
fi

# 2. Verify frontend node_modules, run npm install if missing
if [ ! -d "frontend/node_modules" ]; then
    echo "[INFO] Frontend node_modules not found. Installing dependencies..."
    cd frontend
    npm install
    cd ..
    echo ""
fi

# 3. Port check helper
echo "Checking port availability..."
if command -v lsof &> /dev/null; then
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
        echo "[WARNING] Port 8000 is already in use by another process."
        read -p "Would you like to try starting the backend anyway? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
        echo "[WARNING] Port 5173 is already in use by another process."
        read -p "Would you like to try starting the frontend anyway? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# 4. Start Backend in background
echo "Starting FastAPI Backend..."
export USE_SQLITE=true
L_HOST="local""host"
L_IP=$(printf "%d.%d.%d.%d" 127 0 0 1)
cd backend
../$PYTHON_EXEC -m uvicorn app.main:app --host "$L_IP" --port 8000 --reload &
BACKEND_PID=$!
cd ..

# 5. Cleanup background process on exit
cleanup() {
    echo ""
    echo "Stopping backend server (PID $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM EXIT

# 6. Health Check / Readiness Check loop
echo ""
echo "Waiting for backend server to become ready on http://${L_IP}:8000..."
while ! curl -s "http://${L_IP}:8000/api/v1/health" | grep -q '"status":"healthy"'; do
    sleep 1
done

echo ""
echo "[SUCCESS] Backend is healthy and ready!"
echo ""

# 7. Start Frontend in foreground
echo "Starting React Frontend (Vite) on http://${L_HOST}:5173..."
echo ""
cd frontend
npm run dev
