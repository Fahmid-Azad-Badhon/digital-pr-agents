@echo off
echo Starting Digital PR Dashboard...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0launch-dashboard.ps1" %*
pause