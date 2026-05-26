@echo off
setlocal

call "%~dp0validate-stage.cmd" "%~1" "10-google-doc.md"
if errorlevel 1 exit /b %errorlevel%

set "PORTABLE_NODE=%~dp0..\..\.tools\node-v24.15.0-win-x64\node.exe"
if exist "%PORTABLE_NODE%" (
  "%PORTABLE_NODE%" "%~dp0export-google-doc.js" %*
) else (
  node "%~dp0export-google-doc.js" %*
)

endlocal

