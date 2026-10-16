#!/usr/bin/env bash
set -e

echo "========================================================"
echo "  LuminaPress Video Studio - Launching Application..."
echo "========================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is required to run LuminaPress Video Studio."
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting LuminaPress Video Studio..."
if command -v open &> /dev/null; then
    open http://localhost:3001 &
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3001 &
fi

npm start
