@echo off
setlocal enabledelayedexpansion

::==============================================
:: Muck Rack Journalist Collector
::==============================================
:: Purpose: Collect journalist profiles from Muck Rack
:: Usage: collect-muckrack-journalists.cmd [options]
::
:: Options:
::   -beat "QUERY"       Search beat/keyword (required)
::   -count N            Target count (default: 500)
::   -output "PATH"      Output directory
::   -port N             Chrome debug port (default: 9222)
::   -job "SLUG"         Job/campaign identifier
::
:: Examples:
::   collect-muckrack-journalists.cmd -beat "pedestrian safety" -count 100
::   collect-muckrack-journalists.cmd -beat "transportation" -count 500 -job "my-campaign"

set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%collect-muckrack-journalists.ps1"

:: Parse arguments
set "BEAT="
set "COUNT=500"
set "OUTPUT="
set "PORT=9222"
set "JOB="

:parse_args
if "%~1"=="" goto run_script
if /i "%~1"=="-beat" (
    set "BEAT=%~2"
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-count" (
    set "COUNT=%~2"
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
if /i "%~1"=="-port" (
    set "PORT=%~2"
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-job" (
    set "JOB=%~2"
    shift
    shift
    goto parse_args
)
echo Unknown argument: %~1
echo Usage: collect-muckrack-journalists.cmd -beat "QUERY" [-count N] [-output PATH] [-port N] [-job SLUG]
exit /b 1

:run_script
if "%BEAT%"=="" (
    echo Error: -beat is required
    echo Usage: collect-muckrack-journalists.cmd -beat "QUERY" [-count N] [-output PATH] [-port N] [-job SLUG]
    exit /b 1
)

echo.
echo [Muck Rack Journalist Collector]
echo Beat: %BEAT%
echo Target Count: %COUNT%
echo Port: %PORT%
if defined OUTPUT echo Output: %OUTPUT%
if defined JOB echo Job: %JOB%
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -Beat "%BEAT%" -TargetCount %COUNT% -Port %PORT% -OutputDir "%OUTPUT%" -JobSlug "%JOB%"
exit /b %ERRORLEVEL%