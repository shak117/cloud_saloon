@echo off
echo ========================================================
echo   CLOUD SALON - Premium SaaS Platform by Cloud Technologies
echo   Pilot Tenant: SK Relax Studio (Satara, Maharashtra)
echo ========================================================

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8001 ...
start "Cloud Salon Backend (Port 8001)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload"

timeout /t 3 /nobreak > nul

echo [2/2] Starting React Vite Frontend on http://localhost:5174 ...
start "Cloud Salon Frontend (Port 5174)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 2 /nobreak > nul
start http://localhost:5174

echo Cloud Salon is running!
pause
