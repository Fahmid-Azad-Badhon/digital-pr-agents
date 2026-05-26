@echo off
setlocal

set "PORTABLE_NODE=%~dp0..\..\.tools\node-v24.15.0-win-x64\node.exe"
if exist "%PORTABLE_NODE%" (
  "%PORTABLE_NODE%" "%~dp0draft-journalist-intel.js" %*
) else (
  node "%~dp0draft-journalist-intel.js" %*
)

endlocal

