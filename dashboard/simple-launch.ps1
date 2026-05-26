# Digital PR Dashboard Simple Launcher
# Changes to dashboard directory, runs checks, then starts dev server

# Stop on first error
$ErrorActionPreference = "Stop"

# Configuration
$projectRoot = "D:\Codex Folder\digital-pr-agents\dashboard"
$port = 3001

Write-Host "=== Digital PR Dashboard Launcher ==="
Write-Host "Project Root: $projectRoot"
Write-Host "Target Port: $port"
Write-Host ""

# Change to project directory
Write-Host "Changing to project directory..."
Set-Location -Path $projectRoot
if (-not (Test-Path .)) {
    Write-Error "Failed to change to project directory"
    exit 1
}
Write-Host "Current location: $(Get-Location)"
Write-Host ""

# Check Node.js and npm availability
Write-Host "Checking Node.js & npm..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js not found. Please install Node.js from https://nodejs.org/"
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found. Please install Node.js which includes npm."
    exit 1
}
Write-Host "Node.js version: $(node --version)"
Write-Host "npm version: $(npm --version)"
Write-Host ""

# Verify dependencies are installed
Write-Host "Checking dependencies..."
$nodeModulesPath = Join-Path $projectRoot "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "node_modules not found. Installing dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install dependencies"
        exit 1
    }
    Write-Host "Dependencies installed successfully."
} else {
    Write-Host "Dependencies already installed."
}
Write-Host ""

# Run production build
Write-Host "Running production build..."
$buildResult = npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    Write-Error $buildResult
    exit 1
}
Write-Host "Production build completed successfully."
Write-Host ""

# Run TypeScript type check
Write-Host "Running TypeScript type check..."
$tscResult = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "TypeScript check failed!"
    Write-Error $tscResult
    exit 1
}
Write-Host "TypeScript check passed with no errors."
Write-Host ""

# Start development server
Write-Host "Starting development server on port $port..."
Write-Host "Dashboard will be available at: http://localhost:$port"
Write-Host "Press Ctrl+C to stop the server"
Write-Host ""
npm run dev