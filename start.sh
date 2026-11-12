#!/bin/bash
# ==============================================================================
#  EconoCausal - Local Launch & Orchestration Script
#  Starts FastAPI Backend (port 8000) and Vite React Dashboard (port 5173)
# ==============================================================================

# Ensure script runs from the repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Configure writable cache directory to prevent matplotlib font cache rebuild delays
export MPLCONFIGDIR="/tmp/matplotlib_cache"
mkdir -p "$MPLCONFIGDIR"

echo "=========================================================="
echo "  🚀 Starting EconoCausal Dynamic Pricing Platform"
echo "=========================================================="

# ------------------------------------------------------------------------------
# 1. Helper: Port Management & Conflict Resolution
# ------------------------------------------------------------------------------
free_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        local pids
        pids=$(lsof -ti :"$port" 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "  ⚠️  Port $port is in use by PID(s): $pids. Freeing port..."
            for pid in $pids; do
                kill -15 "$pid" 2>/dev/null || true
            done
            sleep 1
            # Re-check and force-kill if still bound
            local lingering
            lingering=$(lsof -ti :"$port" 2>/dev/null || true)
            if [ -n "$lingering" ]; then
                for pid in $lingering; do
                    kill -9 "$pid" 2>/dev/null || true
                done
                sleep 0.5
            fi
            local check
            check=$(lsof -ti :"$port" 2>/dev/null || true)
            if [ -z "$check" ]; then
                echo "  ✓ Port $port cleared."
            else
                echo "  ℹ️  Notice: Process on port $port could not be terminated (PID: $check)."
            fi
        fi
    fi
}

# ------------------------------------------------------------------------------
# 2. Pre-flight Environment & Dependency Checks
# ------------------------------------------------------------------------------
echo "[Pre-flight] Validating runtime environment..."

if ! command -v python3 >/dev/null 2>&1; then
    echo "❌ Error: python3 is not installed or not in PATH."
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ Error: npm is not installed or not in PATH."
    exit 1
fi

# Ensure frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "  📦 frontend/node_modules not found. Installing dependencies via npm install..."
    (cd frontend && npm install)
    echo "  ✓ Frontend dependencies installed successfully."
fi

# Clean up any stale or lingering processes on ports 8000 and 5173
free_port 8000
free_port 5173

# ------------------------------------------------------------------------------
# 3. Process Tracking & Graceful Shutdown Handler
# ------------------------------------------------------------------------------
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    # Disable traps to avoid duplicate invocation
    trap - SIGINT SIGTERM EXIT
    echo ""
    echo "=========================================================="
    echo "  🛑 Shutting down EconoCausal services..."
    echo "=========================================================="

    if [ -n "$BACKEND_PID" ]; then
        echo "  • Terminating Backend (PID: $BACKEND_PID)..."
        pkill -P "$BACKEND_PID" 2>/dev/null || true
        kill -15 "$BACKEND_PID" 2>/dev/null || true
    fi

    if [ -n "$FRONTEND_PID" ]; then
        echo "  • Terminating Frontend (PID: $FRONTEND_PID)..."
        pkill -P "$FRONTEND_PID" 2>/dev/null || true
        kill -15 "$FRONTEND_PID" 2>/dev/null || true
    fi

    # Kill any other background sub-jobs of this shell
    kill $(jobs -p) 2>/dev/null || true

    # Final sweep: ensure ports are clean for subsequent launches
    free_port 8000
    free_port 5173

    echo "  ✅ All servers stopped. Have a great day!"
    echo "=========================================================="
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# ------------------------------------------------------------------------------
# 4. Launch FastAPI Backend
# ------------------------------------------------------------------------------
echo ""
echo "[1/2] Launching FastAPI Backend on http://localhost:8000 ..."
python3 -m uvicorn app:app --app-dir backend --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait briefly for backend to become responsive
echo "      Waiting for FastAPI backend to initialize..."
backend_ready=false
for i in {1..20}; do
    if curl -s -f http://127.0.0.1:8000/api/health >/dev/null 2>&1; then
        backend_ready=true
        break
    fi
    sleep 0.5
done

if [ "$backend_ready" = true ]; then
    echo "      ✓ Backend is healthy and ready."
else
    echo "      ℹ️  Backend is warming up in background."
fi

# ------------------------------------------------------------------------------
# 5. Launch Vite React Frontend
# ------------------------------------------------------------------------------
echo ""
echo "[2/2] Launching Vite React Dashboard on http://localhost:5173 ..."
(cd frontend && npm run dev -- --host 0.0.0.0 --port 5173) &
FRONTEND_PID=$!

# Wait briefly for Vite dev server to respond
echo "      Waiting for Vite development server..."
frontend_ready=false
for i in {1..20}; do
    if curl -s -f http://127.0.0.1:5173 >/dev/null 2>&1; then
        frontend_ready=true
        break
    fi
    sleep 0.5
done

if [ "$frontend_ready" = true ]; then
    echo "      ✓ Frontend server is ready."
fi

# ------------------------------------------------------------------------------
# 6. Auto-Open Browser & Display Status Summary
# ------------------------------------------------------------------------------
echo ""
echo "=========================================================="
echo "  ✅ Both Services Are Running with Full Motion UI!"
echo "  • Animated Dashboard UI: http://localhost:5173"
echo "  • API Swagger Docs:      http://localhost:8000/docs"
echo "  • Standalone HTML:       econocausal.html"
echo "  • Press [Ctrl+C] to stop all servers."
echo "=========================================================="
echo ""

# Open browser if on macOS or Linux desktop
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:5173" 2>/dev/null || true
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:5173" 2>/dev/null || true
fi

# Keep script running and wait for child processes or user interrupt (Ctrl+C)
wait $BACKEND_PID $FRONTEND_PID
