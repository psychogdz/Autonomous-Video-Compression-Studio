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

echo Starting LuminaPress Video Studio...
start http://localhost:3001
call npm start
