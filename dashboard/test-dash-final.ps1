$env:PORT=3001
Set-Location 'D:\Codex Folder\digital-pr-agents\dashboard'
Start-Process node -ArgumentList 'node_modules\.bin\next', 'start' -WindowStyle Normal
Start-Sleep -Seconds 20
try {
  $r = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 10
  Write-Host "Status: $($r.StatusCode)"
  Write-Host "Has select: $($r.Content -match 'select')"
  Write-Host "Has text-slate: $($r.Content -match 'text-slate-800')"
} catch {
  Write-Host "Error: $($_.Exception.Message)"
}