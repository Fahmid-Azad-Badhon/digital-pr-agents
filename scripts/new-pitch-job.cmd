@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0new-pitch-job.ps1" -Name "%~1"
