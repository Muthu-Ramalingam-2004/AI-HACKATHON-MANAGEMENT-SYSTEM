@echo off
setlocal enabledelayedexpansion

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
powershell -ExecutionPolicy Bypass -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%STARTUP_LNK%'); $Shortcut.TargetPath = '%~dp0start.bat'; $Shortcut.WorkingDirectory = '%~dp0'; $Shortcut.Save()" >nul 2>&1
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

:: 5. Port check and clean up (kills old instances to prevent conflicts/zombies)
call :log "[INFO] Checking port availability and cleaning up old instances..."
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":8000 *LISTENING"') do (
    call :log "[CLEANUP] Stopping backend process PID %%a on port 8000..."
    taskkill /f /pid %%a >> "%~dp0logs\startup.log" 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":5173 *LISTENING"') do (
    call :log "[CLEANUP] Stopping frontend process PID %%a on port 5173..."
    taskkill /f /pid %%a >> "%~dp0logs\startup.log" 2>&1
)
call :log "[SUCCESS] Port checks completed. Ports 8000 and 5173 are free."

:: 6. Start FastAPI Backend in a new window
call :log "[INFO] Starting FastAPI Backend on port 8000..."
set "USE_SQLITE=true"
start "FastAPI Backend Server (Port 8000)" cmd /k "cd backend && ..\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

:: 7. Wait for backend health check
call :log "[INFO] Waiting for backend server to become ready on http://127.0.0.1:8000..."
set /a count=0
:check_loop
venv\Scripts\python.exe check_health.py >nul 2>&1
if %errorlevel% equ 0 (
    goto backend_ready
)
set /a count+=1
if %count% geq 30 (
    call :log "[ERROR] Backend failed to start or respond to health checks with HTTP 200 within 30 seconds."
    call :log "[ERROR] Please check the 'FastAPI Backend Server' command window."
    pause
    exit /b 1
)
ping 127.0.0.1 -n 2 >nul
goto check_loop

:backend_ready
call :log "[SUCCESS] Backend is healthy and ready (HTTP 200 verified)!"

:: 8. Start React Frontend (Vite) in a new window
call :log "[INFO] Starting React Frontend (Vite)..."
start "React Frontend (Vite) (Port 5173)" cmd /k "cd frontend && npm run dev"

:: 9. Wait for frontend port to be ready
call :log "[INFO] Waiting for frontend server to start on http://localhost:5173..."
set /a count=0
:frontend_check_loop
powershell -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    goto frontend_ready
)
set /a count+=1
if %count% geq 15 (
    call :log "[ERROR] Frontend failed to start or bind to port 5173 within 15 seconds."
    pause
    exit /b 1
)
ping 127.0.0.1 -n 2 >nul
goto frontend_check_loop

:frontend_ready
call :log "[SUCCESS] Frontend is ready on port 5173!"

:: 10. Open the browser only after services are ready
call :log "[INFO] Opening default browser to http://localhost:5173 ..."
start "" "http://localhost:5173"

:: 11. Run dashboard controls in the main window
call :log "====================================================="
call :log "   AI Hackathon Management System is running!"
call :log "====================================================="
call :log "   - Backend API: http://127.0.0.1:8000/docs"
call :log "   - Frontend UI: http://localhost:5173"
call :log ""
call :log "   Press [ENTER] in this window to stop both servers..."
call :log "====================================================="
pause >nul

call :log "[INFO] Stopping services..."
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":8000 *LISTENING"') do (
    call :log "[CLEANUP] Stopping backend process PID %%a..."
    taskkill /f /pid %%a >> "%~dp0logs\startup.log" 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r /c:":5173 *LISTENING"') do (
    call :log "[CLEANUP] Stopping frontend process PID %%a..."
    taskkill /f /pid %%a >> "%~dp0logs\startup.log" 2>&1
)
call :log "[SUCCESS] All services stopped successfully."
ping 127.0.0.1 -n 3 >nul
exit /b 0

:: Logging helper function
:log
echo [%DATE% %TIME%] %~1
echo [%DATE% %TIME%] %~1 >> "%~dp0logs\startup.log"
goto :eof
