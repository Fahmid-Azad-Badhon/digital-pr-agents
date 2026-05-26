# Digital PR Dashboard Launcher
# Place helper functions at the very top to avoid scope issues

function Write-Header($text) { Write-Host "`n=== $text ===`n" -ForegroundColor Cyan }
function Write-Success($text) { Write-Host "✓ $text" -ForegroundColor Green }
function Write-Warning($text) { Write-Host "⚠ $text" -ForegroundColor Yellow }
function Write-Error($text) { Write-Host "✗ $text" -ForegroundColor Red }
function Write-Info($text) { Write-Host "ℹ $text" -ForegroundColor DarkCyan }

# Configuration
$ErrorActionPreference = "Stop"
$ProjectRoot = "D:\Codex Folder\digital-pr-agents\dashboard"
$Port = 3001
$DevUrl = "http://localhost:$Port"

# Clear screen and show header
Clear-Host
Write-Header "Digital PR Dashboard Launcher"
Write-Info "Project Root: $ProjectRoot"
Write-Info "Target Port: $Port"

# Main execution block
try {
    Write-Header "Checking Node.js & npm"
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { 
        throw "Node.js not found. Install from https://nodejs.org/" 
    }
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { 
        throw "npm not found. Node.js includes npm." 
    }
    Write-Success "Node.js: $(node --version) | npm: $(npm --version)"

    Write-Header "Changing to project directory"
    if (-not (Test-Path $ProjectRoot)) { 
        throw "Project directory not found: $ProjectRoot" 
    }
    Set-Location -Path $ProjectRoot
    Write-Success "Changed to: $(Get-Location)"

    Write-Header "Checking dependencies"
    $nodeModulesPath = Join-Path $ProjectRoot "node_modules"
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Warning "Installing dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) { 
            throw "Failed to install dependencies" 
        }
        Write-Success "Dependencies installed successfully"
    } else {
        Write-Success "Dependencies already installed"
    }

    Write-Header "Running production build"
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -ne 0) { 
        Write-Error "Build failed!" 
        Write-Error $buildResult 
        throw "Build process encountered errors" 
    }
    Write-Success "Production build completed successfully"

    Write-Header "Running TypeScript type check"
    $tscResult = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -ne 0) { 
        Write-Error "TypeScript check failed!" 
        Write-Error $tscResult 
        throw "TypeScript compilation encountered errors" 
    }
    Write-Success "TypeScript check passed with no errors"

    Write-Header "Starting development server"
    Write-Info "Dashboard will be available at: $DevUrl"
    Write-Info "Press Ctrl+C to stop the server"
    Write-Host ""
    
    npm run dev

} catch {
    Write-Error "Launch failed: $_"
    Write-Host ""
    Write-Warning "Troubleshooting:"
    Write-Host "  1. Ensure Node.js is installed (https://nodejs.org)"
    Write-Host "  2. Check internet connectivity"
    Write-Host "  3. Verify write permissions to project folder"
    Write-Host "  4. Try 'npm install' manually in project directory"
    exit 1
}