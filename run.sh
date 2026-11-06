#!/usr/bin/env bash
# SEERPAYANAM — 1-Click Launch Script (Linux/macOS)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "==================================================="
echo "  SEERPAYANAM — Tamil Nadu Intelligent Transit Management System"
echo "  Starting Backend API & Frontend Dev Server..."
echo "==================================================="

# Choose python from virtualenv if available
if [ -f "$SCRIPT_DIR/backend/venv/bin/python" ]; then
    PYTHON_CMD="$SCRIPT_DIR/backend/venv/bin/python"
else
    PYTHON_CMD="python3"
fi

# 0. Cleanly free ports 8000 and 5173 if any old process is lingering
echo "Freeing ports 8000 and 5173..."
fuser -k 8000/tcp 5173/tcp 2>/dev/null || true
sleep 1

# Clean up background jobs on exit
cleanup() {
    echo ""
    echo "Shutting down SEERPAYANAM servers..."
    kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start FastAPI Backend
echo "Starting Backend API on http://127.0.0.1:8000 ..."
(cd "$SCRIPT_DIR/backend" && "$PYTHON_CMD" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload) &
BACKEND_PID=$!

# Wait briefly for backend to initialize
sleep 2

# 2. Start Vite Frontend
echo "Starting Frontend on http://localhost:5173 ..."
(cd "$SCRIPT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "==================================================="
echo "  SEERPAYANAM is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://127.0.0.1:8000"
echo "  API Docs: http://127.0.0.1:8000/docs"
echo "  Press Ctrl+C to stop both servers."
echo "==================================================="

wait

