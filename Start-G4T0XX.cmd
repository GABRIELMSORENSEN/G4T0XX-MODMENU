@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-G4T0XX.ps1"
if errorlevel 1 pause
