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

if [ ! -f "bin/ffmpeg" ] && ! command -v ffmpeg &> /dev/null; then
    echo "[INFO] FFmpeg not found in bin/ or system PATH."
    if command -v brew &> /dev/null; then
        echo "Installing FFmpeg via Homebrew..."
        brew install ffmpeg
    elif command -v apt-get &> /dev/null; then
        echo "Installing FFmpeg via apt..."
        sudo apt-get update && sudo apt-get install -y ffmpeg
    fi
fi

if [ ! -f "dist/index.html" ] || [ ! -f "dist-server/server/src/index.js" ]; then
    echo "Building studio frontend and server engine..."
    npm run build
fi

echo "Starting LuminaPress Video Studio on http://localhost:3001..."
if command -v open &> /dev/null; then
    open http://localhost:3001 &
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3001 &
fi

node dist-server/server/src/index.js
