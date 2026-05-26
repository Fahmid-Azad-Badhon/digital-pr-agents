# Test script to verify function definitions work
function Write-Header($text) { Write-Host "`n=== $text ===`n" -ForegroundColor Cyan }
function Write-Success($text) { Write-Host "✓ $text" -ForegroundColor Green }
function Write-Warning($text) { Write-Host "⚠ $text" -ForegroundColor Yellow }
function Write-Error($text) { Write-Host "✗ $text" -ForegroundColor Red }
function Write-Info($text) { Write-Host "ℹ $text" -ForegroundColor DarkCyan }

Write-Header "Testing functions"
Write-Success "Success message works"
Write-Warning "Warning message works"
Write-Error "Error message works"
Write-Info "Info message works"