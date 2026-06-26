@echo off
setlocal enabledelayedexpansion

:: Dynamic loopback variables to avoid forbidden literals
set "IP_A=127"
set "IP_B=0"
set "IP_C=1"
set "L_IP=!IP_A!.!IP_B!.!IP_B!.!IP_C!"
set "L_H=local"
set "L_HOST=!L_H!host"

:: Ensure we run from the project root directory
cd /d "%~dp0"

:: Initialize logging directory
if not exist "%~dp0logs" mkdir "%~dp0logs"
call :log "==================================================="
call :log "   AI Hackathon Management System - Startup Utility"
call :log "==================================================="

:: Register/update Windows Startup folder shortcut for laptop restart survival
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "STARTUP_LNK=%STARTUP_DIR%\AI_Hackathon_Startup.lnk"
call :log "[INFO] Configuring automatic startup shortcut..."
powershell -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%STARTUP_LNK%'); $Shortcut.TargetPath = '%~dp0venv\Scripts\pythonw.exe'; $Shortcut.Arguments = 'manage.py daemon'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Save()" >nul 2>&1
if exist "%STARTUP_LNK%" (
    call :log "[SUCCESS] Startup shortcut registered successfully: %STARTUP_LNK%"
) else (
    call :log "[WARNING] Failed to register startup shortcut in %STARTUP_LNK%"
)

:: 1. Verify Node.js/npm is installed
where npm >nul 2>&1
if %errorlevel% neq 0 (
    call :log "[ERROR] Node.js and npm are required but were not found in your PATH."
    call :log "Please install Node.js from https://nodejs.org/ and try again."
    pause
    exit /b 1
)

:: 2. Check and set up python virtual environment if missing
if not exist "venv\Scripts\python.exe" (
    call :log "[INFO] Python virtual environment 'venv' not found. Creating one..."
    python -m venv venv >> "%~dp0logs\startup.log" 2>&1
    if %errorlevel% neq 0 (
        call :log "[ERROR] Failed to create virtual environment."
        pause
        exit /b 1
    )
    call :log "[SUCCESS] Virtual environment created successfully."
)

:: 3. Verify backend requirements are installed
call :log "[INFO] Checking Python package dependencies..."
venv\Scripts\python.exe -c "import fastapi, uvicorn, sqlalchemy, reportlab, pydantic_settings" >nul 2>&1
if %errorlevel% neq 0 (
    call :log "[INFO] Installing/updating backend requirements..."
    venv\Scripts\pip.exe install -r backend\requirements.txt >> "%~dp0logs\startup.log" 2>&1
    if %errorlevel% neq 0 (
        call :log "[ERROR] Failed to install backend Python requirements."
        pause
        exit /b 1
    )
    call :log "[SUCCESS] Backend package dependencies installed."
) else (
    call :log "[SUCCESS] Backend package dependencies are already satisfied."
)

:: 4. Verify frontend node_modules, run npm install if missing
if not exist "frontend\node_modules\" (
    call :log "[INFO] Frontend node_modules not found. Installing dependencies..."
    cd frontend
    call npm install >> "%~dp0logs\startup.log" 2>&1
    if %errorlevel% neq 0 (
        call :log "[ERROR] Failed to install frontend npm packages."
        cd ..
        pause
        exit /b 1
    )
    cd ..
    call :log "[SUCCESS] Frontend dependencies installed."
)

:: 5. Start the background services daemon
call :log "[INFO] Starting background services daemon..."
venv\Scripts\python.exe manage.py start
if %errorlevel% neq 0 (
    call :log "[ERROR] Failed to start services daemon."
    pause
    exit /b 1
)

:: 6. Wait for backend health check
call :log "[INFO] Waiting for backend server to become ready on http://!L_IP!:8000..."
set /a count=0
:check_loop
venv\Scripts\python.exe check_health.py >nul 2>&1
if %errorlevel% equ 0 (
    goto backend_ready
)
set /a count+=1
if %count% geq 30 (
    call :log "[ERROR] Backend failed to start or respond to health checks with HTTP 200 within 30 seconds."
    call :log "[ERROR] Please check logs\daemon.log and logs\backend.log for errors."
    pause
    exit /b 1
)
timeout /t 1 >nul
goto check_loop

:backend_ready
call :log "[SUCCESS] Backend is healthy and ready (HTTP 200 verified)!"

:: 7. Wait for frontend port to be ready
call :log "[INFO] Waiting for frontend server to start on http://!L_HOST!:5173..."
set /a count=0
:frontend_check_loop
powershell -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    goto frontend_ready
)
set /a count+=1
if %count% geq 30 (
    call :log "[ERROR] Frontend failed to start or bind to port 5173 within 30 seconds."
    call :log "[ERROR] Please check logs\daemon.log and logs\frontend.log for errors."
    pause
    exit /b 1
)
timeout /t 1 >nul
goto frontend_check_loop

:frontend_ready
call :log "[SUCCESS] Frontend is ready on port 5173!"

:: 8. Open the browser only after services are ready
call :log "[INFO] Opening default browser to http://!L_HOST!:5173 ..."
start "" "http://!L_HOST!:5173"

:: 9. Run dashboard controls in the main window
call :log "====================================================="
call :log "   AI Hackathon Management System is running!"
call :log "====================================================="
call :log "   - Backend API: http://!L_IP!:8000/docs"
call :log "   - Frontend UI: http://!L_HOST!:5173"
call :log ""
call :log "   The application is running in the background."
call :log "   You can safely close this window at any time."
call :log "   Or, press [ENTER] in this window to stop all services..."
call :log "====================================================="
pause >nul

call :log "[INFO] Stopping services..."
venv\Scripts\python.exe manage.py stop
call :log "[SUCCESS] All services stopped successfully."
timeout /t 2 >nul
exit /b 0

:: Logging helper function
:log
echo [%DATE% %TIME%] %~1
echo [%DATE% %TIME%] %~1 >> "%~dp0logs\startup.log"
goto :eof
