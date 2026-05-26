# ==============================================================================
# Digital PR Dashboard Launcher - Full Verification & Startup
# ==============================================================================
# This script:
# 1. Verifies Node.js/npm availability
# 2. Ensures dependencies are installed
# 3. Runs production build (npm run build)
# 4. Runs TypeScript type check (npx tsc --noEmit)
# 5. If all checks pass, starts development server on port 3001
# ==============================================================================

# Enable strict error handling
$ErrorActionPreference = "Stop"
$script:ProjectRoot = "D:\Codex Folder\digital-pr-agents\dashboard"
$script:Port = 3001
$script:DevUrl = "http://localhost:$script:Port"

# Helper functions for colored output (DEFINED FIRST)
function Write-Header($text) {
    Write-Host "`n=== $text ===`n" -ForegroundColor Cyan
}

function Write-Success($text) {
    Write-Host "✓ $text" -ForegroundColor Green
}

function Write-Warning($text) {
    Write-Host "⚠ $text" -ForegroundColor Yellow
}

function Write-Error($text) {
    Write-Host "✗ $text" -ForegroundColor Red
}

function Write-Info($text) {
    Write-Host "ℹ $text" -ForegroundColor DarkCyan
}

# Clear screen and show header
Clear-Host
Write-Header "Digital PR Dashboard Launcher"
Write-Info "Project Root: $script:ProjectRoot"
Write-Info "Target Port: $script:Port"

try {
    # 1. Verify Node.js availability
    Write-Header "Checking Node.js & npm"
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw "Node.js not found. Please install Node.js from https://nodejs.org/"
    }
    $nodeVersion = node --version
    Write-Success "Node.js version: $nodeVersion"
    
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        throw "npm not found. Please install Node.js which includes npm."
    }
    $npmVersion = npm --version
    Write-Success "npm version: $npmVersion"

    # 2. Change to project directory
    Write-Header "Changing to project directory"
    if (-not (Test-Path $script:ProjectRoot)) {
        throw "Project directory not found: $script:ProjectRoot"
    }
    Set-Location -Path $script:ProjectRoot
    Write-Success "Changed to: $(Get-Location)"

    # 3. Verify dependencies are installed
    Write-Header "Checking dependencies"
    $nodeModulesPath = Join-Path $script:ProjectRoot "node_modules"
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Warning "node_modules not found. Installing dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install dependencies"
        }
        Write-Success "Dependencies installed successfully"
    } else {
        Write-Success "Dependencies already installed"
    }

    # 4. Run production build
    Write-Header "Running production build"
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build failed!"
        Write-Error $buildResult
        throw "Build process encountered errors"
    }
    Write-Success "Production build completed successfully"

    # 5. Run TypeScript type check
    Write-Header "Running TypeScript type check"
    $tscResult = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "TypeScript check failed!"
        Write-Error $tscResult
        throw "TypeScript compilation encountered errors"
    }
    Write-Success "TypeScript check passed with no errors"

    # 6. Start development server
    Write-Header "Starting development server"
    Write-Info "Dashboard will be available at: $script:DevUrl"
    Write-Info "Press Ctrl+C to stop the server"
    Write-Host ""
    
    npm run dev

} catch {
    Write-Error "Launch failed: $_"
    Write-Host ""
    Write-Warning "Troubleshooting tips:"
    Write-Host "  1. Ensure Node.js is installed (https://nodejs.org)"
    Write-Host "  2. Check internet connectivity for npm install"
    Write-Host "  3. Verify you have write permissions to the project folder"
    Write-Host "  4. Try running 'npm install' manually in the project directory"
    exit 1
}