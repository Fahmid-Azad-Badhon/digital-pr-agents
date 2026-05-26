@echo off
setlocal enabledelayedexpansion

::==============================================
:: Chrome Debug Launcher - CMD Wrapper
::==============================================
:: Purpose: Launch Chrome with remote debugging for Muck Rack, SERP, and journalist collection
:: Usage: launch-debug-chrome.cmd [action] [options]
::
:: Actions:
::   launch      - Start debug Chrome (default)
::   verify      - Verify debug endpoint is accessible
::   stop        - Stop debug Chrome
::   status      - Check debug Chrome status
::   restart     - Restart debug Chrome
::   clean       - Clear profile data
::
:: Options:
::   -port N     - Set debug port (default: 9222)
::   -profile P  - Set profile directory
::   -headless   - Run in headless mode
::   -force      - Force restart if already running
::
:: Examples:
::   launch-debug-chrome.cmd launch
::   launch-debug-chrome.cmd launch -port 9223
::   launch-debug-chrome.cmd verify
::   launch-debug-chrome.cmd stop
::   launch-debug-chrome.cmd restart -force

set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%launch-debug-chrome.ps1"

:: Parse arguments
set "ACTION=Launch"
set "PORT=9222"
set "PROFILE="
set "HEADLESS="
set "FORCE="

:parse_args
if "%~1"=="" goto run_script
if /i "%~1"=="launch" set "ACTION=Launch"& shift& goto parse_args
if /i "%~1"=="verify" set "ACTION=Verify"& shift& goto parse_args
if /i "%~1"=="stop" set "ACTION=Stop"& shift& goto parse_args
if /i "%~1"=="status" set "ACTION=Status"& shift& goto parse_args
if /i "%~1"=="restart" set "ACTION=Restart"& shift& goto parse_args
if /i "%~1"=="clean" set "ACTION=Clean"& shift& goto parse_args
if /i "%~1"=="-port" (
    set "PORT=%~2"
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-profile" (
    set "PROFILE=%~2"
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-headless" (
    set "HEADLESS=-Headless"
    shift
    goto parse_args
)
if /i "%~1"=="-force" (
    set "FORCE=-Force"
    shift
    goto parse_args
)
echo Unknown argument: %~1
echo Usage: launch-debug-chrome.cmd [action] [-port N] [-profile P] [-headless] [-force]
exit /b 1

:run_script
echo.
echo [Chrome Debug Launcher]
echo Action: %ACTION%
echo Port: %PORT%
if defined PROFILE echo Profile: %PROFILE%
if defined HEADLESS echo Mode: Headless
if defined FORCE echo Force: Yes
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -Action %ACTION% -Port %PORT% %PROFILE% %HEADLESS% %FORCE%
exit /b %ERRORLEVEL%