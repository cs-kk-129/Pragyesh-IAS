@echo off
echo Starting UPSC Evaluation System...
echo.

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Starting backend server...
start "Backend" cmd /k "cd backend && python run_backend.py"

echo.
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting frontend server...
start "Frontend" cmd /k "npm run dev"

echo.
echo Services are starting...
echo Frontend: http://localhost:5000
echo Backend: http://localhost:8001
echo API Docs: http://localhost:8001/docs
echo.
echo Press any key to exit...
pause >nul