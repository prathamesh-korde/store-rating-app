# ════════════════════════════════════════════════════════════
#  Store Rating App — Local Development Startup Script
#  Run from:  c:\Users\Prathmesh\OneDrive\Desktop\rox\store-rating-app
# ════════════════════════════════════════════════════════════

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  STORE RATING APP - LOCAL DEV STARTUP" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check .env files exist
if (-not (Test-Path "backend/.env")) {
    Write-Host ""
    Write-Host "WARNING: backend/.env not found!" -ForegroundColor Red
    Write-Host "  Copy backend/.env.example to backend/.env and fill in your values." -ForegroundColor Yellow
    Write-Host ""
}
if (-not (Test-Path "frontend/.env")) {
    Write-Host ""
    Write-Host "WARNING: frontend/.env not found!" -ForegroundColor Red
    Write-Host "  Copy frontend/.env.example to frontend/.env and fill in your values." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "Starting backend on http://localhost:5000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Starting frontend on http://localhost:5173 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\frontend'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Both servers are starting in separate windows." -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
