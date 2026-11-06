@echo off
title Launch SEERPAYANAM TN-ITIS
echo ===================================================
echo   Tamil Nadu Intelligent Transit Management System
echo   Launching Backend API & Frontend UI...
echo ===================================================

start "SEERPAYANAM Backend (FastAPI + Simulation)" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

start "SEERPAYANAM Frontend (Vite + React)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo Both servers are launching in separate terminal windows!
echo - Backend API:  http://localhost:8000
echo - Frontend UI:  http://localhost:5173
echo.
echo You can open your browser at: http://localhost:5173
echo ===================================================
pause

