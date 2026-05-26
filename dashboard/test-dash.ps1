# Start dashboard
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 5
Set-Location 'D:\Codex Folder\digital-pr-agents\dashboard'
$env:PORT=3001
Start-Process node -ArgumentList 'node_modules\.bin\next', 'dev' -WindowStyle Normal
Start-Sleep -Seconds 15
# Test connection
try {
  $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 10 -UseBasicParsing
  Write-Host "Status: $($response.StatusCode)"
  Write-Host "Has select: $($response.Content -match 'select')"
  Write-Host "Has text-slate: $($response.Content -match 'text-slate-800')"
} catch {
  Write-Host "Error: $($_.Exception.Message)"
}