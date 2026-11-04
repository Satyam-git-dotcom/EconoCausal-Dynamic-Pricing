#!/bin/bash
# EconoCausal - Local Launch Script
# Starts FastAPI backend (port 8000) and Vite React frontend (port 5173)

set -e

echo "=========================================================="
echo "  🚀 Starting EconoCausal Dynamic Pricing Platform"
echo "=========================================================="

# Trap to kill both background processes on exit (Ctrl+C)
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start backend
echo "[1/2] Launching FastAPI Backend on http://localhost:8000 ..."
python3 -m uvicorn app:app --app-dir backend --host 0.0.0.0 --port 8000 --reload &

# Start frontend
echo "[2/2] Launching Vite React Dashboard on http://localhost:5173 ..."
(cd frontend && npm run dev -- --host 0.0.0.0 --port 5173) &

echo ""
echo "=========================================================="
echo "  ✅ Both Services Are Running!"
echo "  • Dashboard UI:     http://localhost:5173"
echo "  • API Swagger Docs: http://localhost:8000/docs"
echo "  • Press [Ctrl+C] to stop all servers."
echo "=========================================================="
echo ""

wait

