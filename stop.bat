@echo off
setlocal enabledelayedexpansion

:: Ensure we run from the project root directory
cd /d "%~dp0"

:: Initialize logging directory
if not exist "%~dp0logs" mkdir "%~dp0logs"

call :log "==================================================="
call :log "   AI Hackathon Management System - Stop Utility"
call :log "==================================================="

if not exist "venv\Scripts\python.exe" (
    call :log "[ERROR] Python virtual environment 'venv' not found."
    pause
    exit /b 1
)

call :log "[INFO] Stopping all background processes..."
venv\Scripts\python.exe manage.py stop

call :log "[SUCCESS] All services stopped successfully."
pause
exit /b 0

:: Logging helper function
:log
echo [%DATE% %TIME%] %~1
echo [%DATE% %TIME%] %~1 >> "%~dp0logs\startup.log"
goto :eof
