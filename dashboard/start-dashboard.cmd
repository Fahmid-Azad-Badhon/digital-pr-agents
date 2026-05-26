@echo off
chcp 65001
echo ================================================
echo  Digital PR Orchestrator Dashboard
echo ================================================
echo.

IF NOT EXIST "D:\Codex Folder\digital-pr-agents\dashboard\node_modules" (
    echo [1/3] Installing dependencies...
    cd /d "D:\Codex Folder\digital-pr-agents\dashboard"
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed!
        pause
        exit /b 1
    )
) ELSE (
    echo [1/3] Dependencies already installed.
)

echo.
echo [2/3] Starting Next.js development server...
echo Dashboard will be available at: http://localhost:3001
echo Press Ctrl+C to stop the server
echo.

cd /d "D:\Codex Folder\digital-pr-agents\dashboard"
call npm run dev

echo.
echo Server stopped.
pause