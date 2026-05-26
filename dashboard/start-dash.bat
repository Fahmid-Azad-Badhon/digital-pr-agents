@echo off
cd /d "D:\Codex Folder\digital-pr-agents\dashboard"
set PORT=3001
start "" "C:\Program Files\nodejs\node.exe" "D:\Codex Folder\digital-pr-agents\dashboard\node_modules\.bin\next" dev
timeout /t 20 /nobreak
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" http://localhost:3001
