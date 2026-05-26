#Requires -Version 5.1
<#
.SYNOPSIS
    Chrome Debug Browser Launcher for Digital PR Workflow

.DESCRIPTION
    Launches a dedicated Chrome browser instance with remote debugging enabled
    for Muck Rack, SERP research, and journalist data collection tasks.

.PARAMETER Action
    Action to perform: Launch, Verify, Stop, Status, or Restart

.PARAMETER Port
    Debug port number (default: 9222)

.PARAMETER ProfilePath
    Custom profile directory path

.PARAMETER Headless
    Run Chrome in headless mode (for automation)

.PARAMETER Force
    Force restart even if already running

.EXAMPLE
    .\launch-debug-chrome.ps1 -Action Launch
    Launch debug Chrome with default settings

.EXAMPLE
    .\launch-debug-chrome.ps1 -Action Verify
    Verify debug endpoint is accessible

.EXAMPLE
    .\launch-debug-chrome.ps1 -Action Stop
    Stop debug Chrome and cleanup

.NOTES
    Version: 2.0
    Requires: Chrome browser installed
    Used for: Muck Rack collection, SERP research, journalist targeting
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('Launch', 'Verify', 'Stop', 'Status', 'Restart', 'Clean')]
    [string]$Action = 'Launch',

    [Parameter(Mandatory=$false)]
    [ValidateRange(1024, 65535)]
    [int]$Port = 9222,

    [Parameter(Mandatory=$false)]
    [string]$ProfilePath = '',

    [Parameter(Mandatory=$false)]
    [switch]$Headless,

    [Parameter(Mandatory=$false)]
    [switch]$Force
)

#region Configuration
$Script:Config = @{
    # Chrome installation paths (checked in order)
    ChromePaths = @(
        'C:\Program Files\Google\Chrome\Application\chrome.exe',
        "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
        'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
        'C:\Program Files\Google\Chrome Beta\Application\chrome.exe',
        "$env:LOCALAPPDATA\Google\Chrome Beta\Application\chrome.exe"
    )

    # Default profile directory
    DefaultProfileDir = 'D:\Codex Folder\chrome-debug-profile'

    # Debug port range
    MinPort = 9222
    MaxPort = 9229

    # Timeouts
    StartupTimeout = 10
    VerifyTimeout = 5
    CleanupTimeout = 3

    # Chrome flags for debugging
    DebugFlags = @(
        '--remote-debugging-port={PORT}',
        '--user-data-dir={PROFILE}',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-popup-blocking',
        '--disable-translate',
        '--disable-background-networking',
        '--disable-sync',
        '--metrics-recording-only',
        '--disable-metrics',
        '--safebrowsing-disable-auto-update',
        '--disable-client-side-phishing-detection',
        '--disable-crash-reporter',
        '--disable-logging',
        '--ignore-certificate-errors',
        '--allow-running-insecure-content'
    )

    # Headless-specific flags
    HeadlessFlags = @(
        '--headless=new',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--window-size=1920,1080',
        '--virtual-time-budget=5000'
    )
}
#endregion

#region Helper Functions

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Success', 'Warning', 'Error', 'Debug')]
        [string]$Level = 'Info',
        [switch]$NoNewLine
    )
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $color = switch ($Level) {
        'Info'    { 'White' }
        'Success' { 'Green' }
        'Warning' { 'Yellow' }
        'Error'   { 'Red' }
        'Debug'   { 'Cyan' }
    }
    if ($NoNewLine) {
        Write-Host "$Message" -ForegroundColor $color -NoNewline
    } else {
        Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
    }
}

function Find-ChromeInstallation {
    Write-Log "Searching for Chrome installation..." -Level Info

    foreach ($path in $Script:Config.ChromePaths) {
        if (Test-Path -LiteralPath $path) {
            $version = (Get-Item -LiteralPath $path).VersionInfo.FileVersion
            Write-Log "Found Chrome at: $path (Version: $version)" -Level Success
            return $path
        }
    }

    # Try to find via registry
    try {
        $chromeKey = Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe' -ErrorAction SilentlyContinue
        if ($chromeKey -and (Test-Path $chromeKey.'(default)')) {
            $version = (Get-Item $chromeKey.'(default)').VersionInfo.FileVersion
            Write-Log "Found Chrome via registry: $($chromeKey.'(default)') (Version: $version)" -Level Success
            return $chromeKey.'(default)'
        }
    } catch {
        Write-Log "Registry search failed: $_" -Level Debug
    }

    return $null
}

function Get-ChromeProcess {
    param([int]$Port = 9222)
    $processes = Get-Process -Name chrome -ErrorAction SilentlyContinue
    if ($processes) {
        $matching = $processes | Where-Object {
            $_.CommandLine -match "--remote-debugging-port=$Port" -or
            $_.CommandLine -match "chrome-debug-profile"
        }
        return $matching
    }
    return $null
}

function Wait-ForDebugEndpoint {
    param(
        [int]$Port = 9222,
        [int]$TimeoutSeconds = 10
    )

    $endpoint = "http://127.0.0.1:$Port/json/version"
    $attempts = $TimeoutSeconds * 2

    for ($i = 0; $i -lt $attempts; $i++) {
        try {
            $response = Invoke-RestMethod -Uri $endpoint -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response) {
                return $response
            }
        } catch {
            Start-Sleep -Milliseconds 500
        }
    }

    return $null
}

function Stop-ChromeProcesses {
    param(
        [int]$Port = 9222,
        [switch]$Force
    )

    $processes = Get-ChromeProcess -Port $Port
    if ($processes) {
        Write-Log "Stopping Chrome processes (PID: $($processes.Id -join ', '))..." -Level Info
        if ($Force) {
            $processes | Stop-Process -Force -ErrorAction SilentlyContinue
        } else {
            $processes | Stop-Process -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds $Script:Config.CleanupTimeout
        Write-Log "Chrome processes stopped" -Level Success
        return $true
    }
    return $false
}

function Test-PortAvailable {
    param([int]$Port = 9222)

    $connection = Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    return -not $connection.TcpTestSucceeded
}

function Get-DebugEndpointInfo {
    param([int]$Port = 9222)

    try {
        $version = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/json/version" -TimeoutSec 5
        $targets = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/json/list" -TimeoutSec 5 -ErrorAction SilentlyContinue

        return @{
            Browser = $version.Browser
            WebSocket = $version.webSocketDebuggerUrl
            Protocol = $version.'Protocol-Version'
            Targets = $targets
            Port = $Port
            Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        }
    } catch {
        return $null
    }
}

function Initialize-ProfileDirectory {
    param([string]$ProfilePath)

    if (-not $ProfilePath) {
        $ProfilePath = $Script:Config.DefaultProfileDir
    }

    # Create profile directory if it doesn't exist
    if (-not (Test-Path -LiteralPath $ProfilePath)) {
        New-Item -ItemType Directory -Path $ProfilePath -Force | Out-Null
        Write-Log "Created profile directory: $ProfilePath" -Level Info
    }

    return $ProfilePath
}

function Build-ChromeArguments {
    param(
        [int]$Port = 9222,
        [string]$ProfilePath = '',
        [switch]$Headless
    )

    $args = @()

    foreach ($flag in $Script:Config.DebugFlags) {
        $flag = $flag -replace '\{PORT\}', $Port
        $flag = $flag -replace '\{PROFILE\}', $ProfilePath
        $args += $flag
    }

    if ($Headless) {
        foreach ($flag in $Script:Config.HeadlessFlags) {
            $args += $flag
        }
    }

    return $args
}

function Get-ChromeVersion {
    param([string]$ChromePath)

    try {
        $versionInfo = Get-Item -LiteralPath $ChromePath | Select-Object VersionInfo
        return @{
            Version = $versionInfo.VersionInfo.FileVersion
            ProductName = $versionInfo.VersionInfo.ProductName
            FileDescription = $versionInfo.VersionInfo.FileDescription
        }
    } catch {
        return $null
    }
}

#endregion

#region Actions

function Start-DebugChrome {
    param(
        [int]$Port = 9222,
        [string]$ProfilePath = '',
        [switch]$Headless,
        [switch]$Force
    )

    Write-Log "========================================" -Level Info
    Write-Log "Starting Chrome Debug Session" -Level Info
    Write-Log "========================================" -Level Info

    # 1. Find Chrome
    $chromePath = Find-ChromeInstallation
    if (-not $chromePath) {
        Write-Log "Chrome not found. Please install Google Chrome." -Level Error
        throw "Chrome installation not found"
    }

    # 2. Initialize profile directory
    $profileDir = Initialize-ProfileDirectory -ProfilePath $ProfilePath

    # 3. Check if Chrome already running on port
    $existing = Get-ChromeProcess -Port $Port
    if ($existing) {
        if ($Force) {
            Write-Log "Force restarting existing Chrome session..." -Level Warning
            Stop-ChromeProcesses -Port $Port -Force
        } else {
            Write-Log "Chrome already running on port $Port" -Level Info
            $info = Get-DebugEndpointInfo -Port $Port
            if ($info) {
                Write-Log "Debug Chrome ready: $($info.Browser)" -Level Success
                Write-Log "WebSocket: $($info.WebSocket)" -Level Debug
                Write-Log "Profile: $profileDir" -Level Success
                return $info
            }
        }
    }

    # 4. Check port availability
    if (-not (Test-PortAvailable -Port $Port)) {
        Write-Log "Port $Port in use, attempting to find available port..." -Level Warning
        for ($newPort = $Script:Config.MinPort; $newPort -le $Script:Config.MaxPort; $newPort++) {
            if (Test-PortAvailable -Port $newPort) {
                $Port = $newPort
                Write-Log "Using available port: $Port" -Level Info
                break
            }
        }
    }

    # 5. Build arguments
    $arguments = Build-ChromeArguments -Port $Port -ProfilePath $profileDir -Headless:$Headless

    # 6. Launch Chrome
    Write-Log "Launching Chrome with debug port $Port..." -Level Info
    Write-Log "Profile directory: $profileDir" -Level Debug
    Write-Log "Arguments: $($arguments -join ' ')" -Level Debug

    $process = Start-Process -FilePath $chromePath -ArgumentList $arguments -PassThru -WindowStyle Normal

    # 7. Wait for debug endpoint
    Write-Log "Waiting for debug endpoint..." -Level Info -NoNewLine
    $startupAttempts = $Script:Config.StartupTimeout * 2
    $endpoint = $null

    for ($i = 0; $i -lt $startupAttempts; $i++) {
        Start-Sleep -Milliseconds 500
        Write-Log "." -Level Info -NoNewLine
        $endpoint = Wait-ForDebugEndpoint -Port $Port -TimeoutSeconds 1
        if ($endpoint) {
            Write-Log "" -Level Info
            break
        }
    }

    if (-not $endpoint) {
        Write-Log "" -Level Info
        Write-Log "Chrome started but debug endpoint not responding. Retrying..." -Level Warning
        Start-Sleep -Seconds 2
        $endpoint = Wait-ForDebugEndpoint -Port $Port -TimeoutSeconds 5
    }

    if (-not $endpoint) {
        Write-Log "Failed to connect to debug endpoint" -Level Error
        throw "Debug endpoint not available after startup"
    }

    # 8. Get final info
    $info = Get-DebugEndpointInfo -Port $Port

    Write-Log "" -Level Info
    Write-Log "========================================" -Level Success
    Write-Log "Debug Chrome ready: $($info.Browser)" -Level Success
    Write-Log "WebSocket: $($info.WebSocket)" -Level Success
    Write-Log "Profile: $profileDir" -Level Success
    Write-Log "Port: $Port" -Level Success
    Write-Log "========================================" -Level Success

    return $info
}

function Test-DebugChrome {
    param([int]$Port = 9222)

    Write-Log "Verifying Chrome debug endpoint on port $Port..." -Level Info

    $info = Get-DebugEndpointInfo -Port $Port

    if ($info) {
        Write-Log "========================================" -Level Success
        Write-Log "Status: RUNNING" -Level Success
        Write-Log "Browser: $($info.Browser)" -Level Success
        Write-Log "WebSocket: $($info.WebSocket)" -Level Success
        Write-Log "Protocol: $($info.Protocol)" -Level Success
        Write-Log "Open Tabs: $($info.Targets.Count)" -Level Info
        Write-Log "========================================" -Level Success
        return $info
    } else {
        Write-Log "Status: NOT RUNNING" -Level Warning
        Write-Log "Debug endpoint not accessible on port $Port" -Level Warning
        return $null
    }
}

function Stop-DebugChrome {
    param([int]$Port = 9222)

    Write-Log "Stopping Chrome debug session on port $Port..." -Level Info

    $stopped = Stop-ChromeProcesses -Port $Port -Force

    if ($stopped) {
        Write-Log "Chrome debug session stopped" -Level Success
        return $true
    } else {
        Write-Log "No Chrome processes found on port $Port" -Level Warning
        return $false
    }
}

function Get-DebugChromeStatus {
    param([int]$Port = 9222)

    Write-Log "Checking Chrome debug status on port $Port..." -Level Info

    $info = Get-DebugEndpointInfo -Port $Port

    if ($info) {
        Write-Log "Status: RUNNING" -Level Success
        Write-Log "Browser: $($info.Browser)" -Level Success
        Write-Log "WebSocket: $($info.WebSocket)" -Level Success
        Write-Log "Open Tabs: $($info.Targets.Count)" -Level Info

        Write-Log "`nOpen Tabs:" -Level Info
        foreach ($target in $info.Targets) {
            Write-Log "  - $($target.title)" -Level Debug
            Write-Log "    URL: $($target.url)" -Level Debug
        }

        return $info
    } else {
        Write-Log "Status: NOT RUNNING" -Level Warning
        return $null
    }
}

function Restart-DebugChrome {
    param(
        [int]$Port = 9222,
        [string]$ProfilePath = '',
        [switch]$Headless
    )

    Write-Log "Restarting Chrome debug session..." -Level Info

    Stop-DebugChrome -Port $Port

    Start-Sleep -Seconds 2

    return Start-DebugChrome -Port $Port -ProfilePath $ProfilePath -Headless:$Headless -Force
}

function Clear-ChromeData {
    param([string]$ProfilePath = '')

    if (-not $ProfilePath) {
        $ProfilePath = $Script:Config.DefaultProfileDir
    }

    if (Test-Path -LiteralPath $ProfilePath) {
        Write-Log "Cleaning Chrome profile data: $ProfilePath" -Level Info
        Stop-DebugChrome -Force
        Start-Sleep -Seconds 1

        try {
            # Remove old profile data
            Get-ChildItem -LiteralPath $ProfilePath -Recurse -ErrorAction SilentlyContinue |
                Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
            Write-Log "Profile data cleared" -Level Success
            return $true
        } catch {
            Write-Log "Error clearing profile: $_" -Level Warning
            return $false
        }
    } else {
        Write-Log "Profile directory not found: $ProfilePath" -Level Warning
        return $false
    }
}

#endregion

#region Main Execution

try {
    switch ($Action.ToLower()) {
        'launch' {
            $result = Start-DebugChrome -Port $Port -ProfilePath $ProfilePath -Headless:$Headless -Force:$Force
            Write-Output "Launch successful"
        }

        'verify' {
            $result = Test-DebugChrome -Port $Port
            if (-not $result) {
                throw "Debug Chrome not running"
            }
        }

        'stop' {
            Stop-DebugChrome -Port $Port
        }

        'status' {
            $result = Get-DebugChromeStatus -Port $Port
            if (-not $result) {
                Write-Output "Chrome debug is not running on port $Port"
            }
        }

        'restart' {
            $result = Restart-DebugChrome -Port $Port -ProfilePath $ProfilePath -Headless:$Headless
            Write-Output "Restart successful"
        }

        'clean' {
            Clear-ChromeData -ProfilePath $ProfilePath
        }
    }

    exit 0

} catch {
    Write-Log "Error: $_" -Level Error
    exit 1
}

#endregion