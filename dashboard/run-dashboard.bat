@echo off
REM ==============================================================================
REM Digital PR Dashboard Launcher (Batch)
REM ==============================================================================
REM Usage: run-dashboard.bat [dev|start|stop|status|build]
REM ==============================================================================

setlocal enabledelayedexpansion

set "PROJECT_PATH=D:\Codex Folder\digital-pr-agents\dashboard"
set "PORT=3001"

if "%~1"=="" (
    echo.
    echo   ════════════════════════════════════════════════════════════
    echo        Digital PR Workflow Dashboard Launcher
    echo   ════════════════════════════════════════════════════════════
    echo.
    echo Usage: run-dashboard.bat [command]
    echo.
    echo Commands:
    echo   dev    - Start in development mode (default, with hot reload)
    echo   start  - Start in production mode (faster)
    echo   stop   - Stop the running server
    echo   status - Check if server is running
    echo   open   - Open dashboard in browser
    echo   build  - Build for production
    echo.
    goto :end
)

cd /d "%PROJECT_PATH%"

if "%~1"=="dev" (
    echo.
    echo [INFO] Starting in Development Mode...
    echo [INFO] URL: http://localhost:%PORT%
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    npm run dev
    goto :end
)

if "%~1"=="start" (
    echo.
    echo [INFO] Starting in Production Mode...
    echo [INFO] URL: http://localhost:%PORT%
    echo.
    npm run start
    goto :end
)

if "%~1"=="stop" (
    echo.
    echo [INFO] Stopping dashboard server...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    echo [OK] Server stopped
    goto :end
)

if "%~1"=="status" (
    echo.
    echo [INFO] Checking dashboard status...
    netstat -ano | findstr :%PORT% | findstr LISTENING >nul
    if !errorlevel! equ 0 (
        echo [OK] Dashboard is running at http://localhost:%PORT%
    ) else (
        echo [INFO] Dashboard is not running
    )
    goto :end
)

if "%~1"=="open" (
    echo.
    echo [INFO] Opening dashboard in browser...
    netstat -ano | findstr :%PORT% | findstr LISTENING >nul
    if !errorlevel! equ 0 (
        start http://localhost:%PORT%
        echo [OK] Browser opened
    ) else (
        echo [ERROR] Dashboard is not running. Run: run-dashboard.bat dev
    )
    goto :end
)

if "%~1"=="build" (
    echo.
    echo [INFO] Building dashboard...
    call npm run build
    if !errorlevel! equ 0 (
        echo [OK] Build successful
    ) else (
        echo [ERROR] Build failed
    )
    goto :end
)

echo [ERROR] Unknown command: %~1
echo Run with no arguments to see available commands

:end
endlocal