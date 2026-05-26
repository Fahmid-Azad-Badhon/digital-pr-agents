param(
  [int]$Port = 3002,
  [string]$DistDir = "",
  [int]$MaxWaitSeconds = 90,
  [switch]$ForceClean,
  [switch]$OpenBrowser
)

$ErrorActionPreference = "Stop"

$projectPath = "D:\Codex Folder\digital-pr-agents\dashboard"
if ([string]::IsNullOrWhiteSpace($DistDir)) {
  $DistDir = ".next-dev-$Port"
}

$healthUrl = "http://localhost:$Port/api/health"
$logsDir = Join-Path $projectPath "logs\launcher"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outLog = Join-Path $logsDir "dev-$Port-$timestamp.out.log"
$errLog = Join-Path $logsDir "dev-$Port-$timestamp.err.log"

function Write-Info([string]$message) {
  Write-Host "[INFO] $message" -ForegroundColor Cyan
}

function Write-Warn([string]$message) {
  Write-Host "[WARN] $message" -ForegroundColor Yellow
}

function Write-Ok([string]$message) {
  Write-Host "[OK]   $message" -ForegroundColor Green
}

function Write-Fail([string]$message) {
  Write-Host "[FAIL] $message" -ForegroundColor Red
}

function Stop-ProcessesOnPort([int]$TargetPort) {
  $connections = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue
  foreach ($conn in $connections) {
    try {
      Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
      Write-Info "Stopped process $($conn.OwningProcess) on port $TargetPort"
    } catch {
      Write-Warn "Could not stop process $($conn.OwningProcess) on port $TargetPort"
    }
  }
}

function Wait-ForHealth([string]$Url, [int]$TimeoutSeconds) {
  $start = Get-Date
  do {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 4
      if ($response.StatusCode -eq 200) {
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds 700
    }
  } while ((New-TimeSpan -Start $start -End (Get-Date)).TotalSeconds -lt $TimeoutSeconds)
  return $false
}

function Log-IndicatesNextChunkCorruption([string]$logPath) {
  if (-not (Test-Path $logPath)) {
    return $false
  }
  $tail = Get-Content $logPath -Tail 250 -ErrorAction SilentlyContinue
  $joined = ($tail -join "`n")
  return (
    $joined -match "Cannot find module '\./chunks/vendor-chunks/next\.js'" -or
    $joined -match "MODULE_NOT_FOUND" -or
    $joined -match "webpack-runtime\.js"
  )
}

function Start-StableDevServer {
  param(
    [string]$WorkDir,
    [int]$TargetPort,
    [string]$TargetDistDir,
    [string]$StdOutLog,
    [string]$StdErrLog
  )

  $command = @(
    "Set-Location '$WorkDir'"
    "`$env:NEXT_DIST_DIR = '$TargetDistDir'"
    "`$env:NODE_ENV = 'development'"
    "npm run dev -- -p $TargetPort 1>> '$StdOutLog' 2>> '$StdErrLog'"
  ) -join "; "

  return Start-Process -FilePath "powershell" `
    -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $command) `
    -PassThru -WindowStyle Hidden
}

New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
Set-Location $projectPath

Write-Info "Project: $projectPath"
Write-Info "Port: $Port"
Write-Info "DistDir: $DistDir"
Write-Info "Logs: $outLog"

Stop-ProcessesOnPort -TargetPort $Port

$distPath = Join-Path $projectPath $DistDir
if ($ForceClean -and (Test-Path $distPath)) {
  Write-Info "ForceClean enabled. Removing $distPath"
  Remove-Item -Recurse -Force $distPath -ErrorAction SilentlyContinue
}

Write-Info "Starting Next.js dev server..."
$proc = Start-StableDevServer -WorkDir $projectPath -TargetPort $Port -TargetDistDir $DistDir -StdOutLog $outLog -StdErrLog $errLog
Start-Sleep -Seconds 2

$healthy = Wait-ForHealth -Url $healthUrl -TimeoutSeconds $MaxWaitSeconds
if (-not $healthy) {
  $combinedLogPath = $outLog
  if (Log-IndicatesNextChunkCorruption -logPath $outLog -or Log-IndicatesNextChunkCorruption -logPath $errLog) {
    Write-Warn "Detected Next chunk cache corruption. Running auto-heal restart..."
    try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {}
    Stop-ProcessesOnPort -TargetPort $Port
    if (Test-Path $distPath) {
      Remove-Item -Recurse -Force $distPath -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    $proc = Start-StableDevServer -WorkDir $projectPath -TargetPort $Port -TargetDistDir $DistDir -StdOutLog $outLog -StdErrLog $errLog
    Start-Sleep -Seconds 2
    $healthy = Wait-ForHealth -Url $healthUrl -TimeoutSeconds $MaxWaitSeconds
  }
}

if (-not $healthy) {
  Write-Fail "Dashboard failed health-check: $healthUrl"
  Write-Host "  StdOut log: $outLog"
  Write-Host "  StdErr log: $errLog"
  exit 1
}

$healthPayload = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 8
Write-Ok "Dashboard is healthy on http://localhost:$Port"
Write-Host "  status: $($healthPayload.status)"
Write-Host "  name:   $($healthPayload.name)"
Write-Host "  dist:   $DistDir"
Write-Host "  pid:    $($proc.Id)"
Write-Host "  logs:   $outLog"

if ($OpenBrowser) {
  Start-Process "http://localhost:$Port/workflow" | Out-Null
}
