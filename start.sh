#!/usr/bin/env bash
set -e

# Start Python API server in background
python3 server.py &
PYTHON_PID=$!

# Kill Python server when this script exits
trap "kill $PYTHON_PID 2>/dev/null" EXIT

echo "Python server started (PID $PYTHON_PID) on http://localhost:8000"
echo "Starting Vite dev server..."

# Start Vite in foreground (Ctrl+C stops both)
npm run dev
