@echo off
setlocal enabledelayedexpansion

::==============================================
:: Chrome CDP Client - Command Wrapper
::==============================================
:: Purpose: Execute Chrome DevTools Protocol commands
:: Usage: chrome-cdp-client.cmd [action] [options]
::
:: Actions:
::   navigate     - Navigate to URL
::   gethtml      - Get page HTML
::   getelements  - Find elements by CSS selector
::   screenshot   - Take screenshot
::   getcookies   - Get browser cookies
::   execscript   - Execute JavaScript
::   network      - Get network logs
::   metrics      - Get performance metrics
::
:: Options:
::   -url "URL"       Target URL (for navigate)
::   -selector "SEL" CSS selector (for getelements)
::   -script "JS"     JavaScript code (for execscript)
::   -port N          Debug port (default: 9222)
::   -output "PATH"   Output file (for screenshot)
::
:: Examples:
::   chrome-cdp-client.cmd navigate -url "https://muckrack.com"
::   chrome-cdp-client.cmd gethtml
::   chrome-cdp-client.cmd getelements -selector ".journalist-card"
::   chrome-cdp-client.cmd screenshot -output "screenshot.png"
::   chrome-cdp-client.cmd execscript -script "document.title"

set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%chrome-cdp-client.ps1"

:: Parse arguments
set "ACTION="
set "URL="
set "SELECTOR="
set "SCRIPT="
set "PORT=9222"
set "OUTPUT="

:parse_args
if "%~1"=="" goto run_script
if /i "%~1"=="navigate" set "ACTION=Navigate"& shift& goto parse_args
if /i "%~1"=="gethtml" set "ACTION=GetHTML"& shift& goto parse_args
if /i "%~1"=="getelements" set "ACTION=GetElements"& shift& goto parse_args
if /i "%~1"=="screenshot" set "Action=Screenshot"& shift& goto parse_args
if /i "%~1"=="getcookies" set "Action=GetCookies"& shift& goto parse_args
if /i "%~1"=="execscript" set "Action=ExecuteScript"& shift& goto parse_args
if /i "%~1"=="network" set "Action=GetNetworkLogs"& shift& goto parse_args
if /i "%~1"=="metrics" set "Action=GetPerformanceMetrics"& shift& goto parse_args
if /i "%~1"=="-url" (
    set "URL=%~2"
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-selector" (
    set "SELECTOR=%~2"
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-script" (
    set "SCRIPT=%~2"
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-port" (
    set "PORT=%~2"
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-output" (
    set "OUTPUT=%~2"
    shift
    shift
    goto parse_args
)
echo Unknown argument: %~1
echo Usage: chrome-cdp-client.cmd [action] [-url URL] [-selector SEL] [-script JS] [-port N] [-output PATH]
exit /b 1

:run_script
if "%ACTION%"=="" (
    echo Error: action is required
    echo Usage: chrome-cdp-client.cmd [action] [-url URL] [-selector SEL] [-script JS] [-port N] [-output PATH]
    exit /b 1
)

echo.
echo [Chrome CDP Client]
echo Action: %ACTION%
echo Port: %PORT%
if defined URL echo URL: %URL%
if defined SELECTOR echo Selector: %SELECTOR%
if defined OUTPUT echo Output: %OUTPUT%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -Action %ACTION% -Url "%URL%" -Selector "%SELECTOR%" -Script "%SCRIPT%" -Port %PORT% -OutputPath "%OUTPUT%"
exit /b %ERRORLEVEL%