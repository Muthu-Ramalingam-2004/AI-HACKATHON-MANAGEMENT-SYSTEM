@echo off
set USE_SQLITE=true
cd backend
..\venv\Scripts\python.exe -u -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > uvicorn.log 2>&1
