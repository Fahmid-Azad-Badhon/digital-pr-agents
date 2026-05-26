@echo off
setlocal

set "EXTERNAL_COLLECTOR=D:\Codex Folder\muck-rack-automation\scripts\collect-beat-journalists.cmd"

if exist "%EXTERNAL_COLLECTOR%" (
  call "%EXTERNAL_COLLECTOR%" %*
  exit /b %ERRORLEVEL%
)

echo Missing external Muck Rack collector: %EXTERNAL_COLLECTOR%
echo Manual action required: install or restore muck-rack-automation, or run scripts\muckrack-collector.js with job slug, beat, and target count.
exit /b 1
