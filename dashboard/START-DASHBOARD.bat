@echo off
REM ==============================================================================
REM Digital PR Dashboard Launcher - Batch File
REM ==============================================================================
REM This batch file:
REM 1. Changes to the dashboard directory
REM 2. Verifies Node.js/npm availability
REM 3. Installs dependencies if needed
REM 4. Runs production build (npm run build)
REM 5. Runs TypeScript type check (npx tsc --noEmit)
REM 6. If all checks pass, starts development server on port 3001
REM ==============================================================================

cd /d "D:\Codex Folder\digital-pr-agents\dashboard"
if errorlevel 1 (
    echo ERROR: Could not change to dashboard directory
    pause
    exit /b 1
)

echo.
echo === Digital PR Dashboard Launcher ===
echo Project: %CD%
echo.

REM Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install from https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo.

REM Check npm
where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm not found. Please install Node.js which includes npm.
    pause
    exit /b 1
)
npm --version
echo.

REM Check if node_modules exists, if not install
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully.
    echo.
) else (
    echo Dependencies already installed.
    echo.
)

REM Run production build
echo Running production build...
npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo Production build completed successfully.
echo.

REM Run TypeScript check
echo Running TypeScript type check...
npx tsc --noEmit
if errorlevel 1 (
    echo ERROR: TypeScript check failed
    pause
    exit /b 1
)
echo TypeScript check passed with no errors.
echo.

REM Start development server
echo Starting development server on port 3001...
echo Dashboard will be available at: http://localhost:3001
echo Press Ctrl+C to stop the server
echo.
npm run dev