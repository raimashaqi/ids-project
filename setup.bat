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

REM Activate virtual environment
.\venv\Scripts\Activate

REM Install requirements
echo Installing requirements...
pip install -r requirements.txt

REM Create database
echo Creating database...
mysql -u root -e "CREATE DATABASE IF NOT EXISTS yuk_mari;"

REM Initialize the application
echo Initializing application...
python run.py

echo Setup complete! You can now run the application using 'run.bat'
pause 