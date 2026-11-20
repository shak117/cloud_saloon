@echo off
echo Starting Cloud Salon FastAPI Server on port 8001...
cd /d "%~dp0"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
