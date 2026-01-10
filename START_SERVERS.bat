@echo off
echo ========================================
echo Starting Handwriting Dyslexia Analyzer
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Starting Python Flask API (Port 6000)...
start "Flask API Server" cmd /k "cd backend && py predict_api.py"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Node.js Backend (Port 5000)...
start "Node Backend Server" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend (Vite Dev Server)...
start "Frontend Dev Server" cmd /k "cd frontend\vite-project && npm run dev"

echo.
echo ========================================
echo All servers are starting!
echo ========================================
echo.
echo Flask API:    http://localhost:6000
echo Node Backend: http://localhost:5000
echo Frontend:     Check the "Frontend Dev Server" window for the URL
echo.
echo Press any key to exit this window (servers will keep running)...
pause >nul




