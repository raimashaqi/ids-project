#!/bin/bash

echo "Setting up IDS Project..."

# cek python dah diinstall belum
if ! command -v python3 &> /dev/null; then
    echo "Python is not installed! Please install Python 3.8 or later."
    echo "For Ubuntu/Debian: sudo apt install python3"
    echo "For Mac: brew install python3"
    exit 1
fi

# cek virtual env dah diinstall belum
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# aktifkan virtual environment (git bash)
source venv/Scripts/Activate

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# buat database
echo "Creating database..."
mysql -u root -e "CREATE DATABASE IF NOT EXISTS yuk_mari;"

# Initialize the application
echo "Initializing application..."
python run.py

echo "Setup complete! You can now run the application using './run.sh'" 