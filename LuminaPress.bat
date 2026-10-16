@echo off
setlocal
title LuminaPress Video Studio
echo ========================================================
echo   LuminaPress Video Studio - Launching Application...
echo ========================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required to run LuminaPress Video Studio.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)

echo Checking build assets...
if not exist "dist\index.html" (
    echo Building studio frontend and server engine...
    call npm run build
) else if not exist "dist-server\server\src\index.js" (
    echo Building studio frontend and server engine...
    call npm run build
)

echo Starting LuminaPress Video Studio on http://localhost:3001...
start "" http://localhost:3001
node dist-server/server/src/index.js
pause
