@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0validate-stage.ps1" -JobName "%~1" -StageFile "%~2"
