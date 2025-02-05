@echo off
echo Setting up IDS Project...

REM cek kalo python dah diinstall
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed! Please install Python 3.8 or later.
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b
)

REM cek virtual environment kalo belum ada buat
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate dan install requirements
cmd /k ".\venv\Scripts\activate.bat && (
    echo Installing requirements... &&
    pip install -r requirements.txt &&
    echo Creating database... &&
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS yuk_mari;" &&
    echo Setup complete! You can now run the application using 'run.bat' &&
    pause &&
    exit
)" 