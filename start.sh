#!/bin/bash
# EconoCausal - Local Launch Script
# Starts FastAPI backend (port 8000) and Vite React frontend (port 5173)

set -e

echo "=========================================================="
echo "  🚀 Starting EconoCausal Dynamic Pricing Platform"
echo "=========================================================="

# Trap to kill all background processes on exit (Ctrl+C)
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start backend
echo "[1/2] Launching FastAPI Backend on http://localhost:8000 ..."
MPLCONFIGDIR=/tmp/matplotlib_cache python3 -m uvicorn app:app --app-dir backend --host 0.0.0.0 --port 8000 --reload &

# Start frontend with auto-open
echo "[2/2] Launching Vite React Animated Dashboard on http://localhost:5173 ..."
(cd frontend && npm run dev -- --host 0.0.0.0 --port 5173 --open) &

echo ""
echo "=========================================================="
echo "  ✅ Both Services Are Running with Full Motion UI!"
echo "  • Animated Dashboard UI: http://localhost:5173"
echo "  • Standalone HTML:       econocausal.html"
echo "  • API Swagger Docs:      http://localhost:8000/docs"
echo "  • Press [Ctrl+C] to stop all servers."
echo "=========================================================="
echo ""

wait
