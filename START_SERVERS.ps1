Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Handwriting Dyslexia Analyzer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "[1/3] Starting Python Flask API (Port 6000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\backend'; py predict_api.py"

Start-Sleep -Seconds 3

Write-Host "[2/3] Starting Node.js Backend (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\backend'; npm start"

Start-Sleep -Seconds 3

Write-Host "[3/3] Starting Frontend (Vite Dev Server)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\frontend\vite-project'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All servers are starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Flask API:    http://localhost:6000" -ForegroundColor Cyan
Write-Host "Node Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend:     Check the 'Frontend Dev Server' window for the URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "Servers are running in separate windows. Close those windows to stop the servers." -ForegroundColor Yellow




