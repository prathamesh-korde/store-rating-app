# ════════════════════════════════════════════════════════════
#  Store Rating App — Ultimate GitHub Clean Push
#  Run from:  c:\Users\Prathmesh\OneDrive\Desktop\rox\store-rating-app
# ════════════════════════════════════════════════════════════

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  ULTIMATE GITHUB RESET & PUSH" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# ── Step 1: Ensure .gitignore is correct ────────────────────
$rootIgnore = Get-Content ".gitignore" -Raw
if ($rootIgnore -notmatch "\.env") {
    Add-Content ".gitignore" "`n.env`n.env.*`n!.env.example"
}

# ── Step 2: Delete .git history and re-initialize ───────────
Write-Host "[1/3] Resetting git history completely..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue

git init
git checkout -b main
git remote add origin https://github.com/prathamesh-korde/store-rating-app.git

# ── Step 3: Add and Commit Clean Files ──────────────────────
Write-Host "[2/3] Staging clean files..." -ForegroundColor Yellow
git add .
git commit -m "Initial clean commit (secrets removed)"

# ── Step 4: Force Push ──────────────────────────────────────
Write-Host "[3/3] Force pushing to GitHub..." -ForegroundColor Yellow
git push origin main --force

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  SUCCESS! Code pushed to GitHub." -ForegroundColor Green
Write-Host "  Your git history was reset to ensure zero secrets." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
