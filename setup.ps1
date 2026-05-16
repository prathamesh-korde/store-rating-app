#!/usr/bin/env pwsh
# =====================================================
# StoreRate Platform - One-Click Setup Script
# Run from the store-rating-app directory:
#   .\setup.ps1
# =====================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  StoreRate Platform - Setup Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# -- Check Node.js ----------------------------------
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  [OK] Node.js $nodeVersion found" -ForegroundColor Green
} catch {
    Write-Host "  [Error] Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# -- Install Backend ---------------------------------
Write-Host ""
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\backend"
npm install
Write-Host "  [OK] Backend dependencies installed" -ForegroundColor Green

# -- Copy backend .env ------------------------------
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  [OK] Created backend .env (edit DATABASE_URL and JWT_SECRET!)" -ForegroundColor Green
} else {
    Write-Host "  [Info] backend .env already exists" -ForegroundColor Cyan
}

# -- Install Frontend --------------------------------
Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\frontend"
npm install
Write-Host "  [OK] Frontend dependencies installed" -ForegroundColor Green

# -- Copy frontend .env -----------------------------
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  [OK] Created frontend .env" -ForegroundColor Green
}

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  [OK] Setup Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Edit backend\.env and set:" -ForegroundColor White
Write-Host "       DATABASE_URL=postgresql://user:password@localhost:5432/store_rating_db" -ForegroundColor Gray
Write-Host "       JWT_SECRET=<any 32+ character string>" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Create the PostgreSQL database:" -ForegroundColor White
Write-Host "       psql -U postgres -c `"CREATE DATABASE store_rating_db;`"" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Run DB migration:" -ForegroundColor White
Write-Host "       psql <DATABASE_URL> -f backend\migrations\001_init.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Seed sample data:" -ForegroundColor White
Write-Host "       cd backend && npm run db:seed" -ForegroundColor Gray
Write-Host ""
Write-Host "  5. Start backend (port 5000):" -ForegroundColor White
Write-Host "       cd backend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  6. Start frontend (port 5173):" -ForegroundColor White
Write-Host "       cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Then open: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
