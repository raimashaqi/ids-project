<center><h1>Maintenance</h1></center>

## Content

- [Introduction](#Introduction)
- [Quickstart](#Quickstart) (Maintenance)
- [Installation](#Installation)
- [How to Run](#How-To-Run)
- [Technology](#Techonology)
- [Folder Structure](#Folder-Structure)

## Introduction 

**Threat Detector** is a system to detect threats from external and internal  network as a stand-alone system. The system will detect threat which in this case is vulnerabilities like injection attack.

## Quickstart

## Installation

1. Ensure you have installed Python programming language version 3.x [here](https://www.python.org/downloads/). If haven't, please install it first.
2. To avoid from the different python version and its libraries or error, please use virtual environment. Type the following command: `python -m venv your_name_environment`. See the documentation [here](https://docs.python.org/3/library/venv.html)
3. Install the python libraries. Type the following command: `pip install -r requirements`
4. Install XAMPP [here](https://www.apachefriends.org/) to run application's web server in Localhost.

## How to Run

1. Open XAMPP Control Panel and start the server (Apache, MySQL)
2. By default, the code has been set to call the database. So, create a new database in phpMyAdmin called `ymp`
4. Open the source code in your code editor. Then, activate the virtual environment `source your_name_environment/Scripts/Activate` or `./your_name_environment/Scripts/Activate`.
5. Navigate to the app directory and type the following command `python idsServer.py` in the terminal 1 and `python frontApp.py` in the terminal 2
6. Access the application here: http://localhost:5000
7. To stop the app and server, just hit `Ctrl + C`

Notes: after install a new library, please do `pip freeze > requirements.txt` to store all libraries

## Technology

1. Flask
2. Python
3. SQLAlchemy
4. MySQL

## Folder Structure
```
app/
│── static/
│   │── css/ (maintenance)
│   │── js/ (maintenance)
│   │── payload/
│── templates/
│   │── index.html (maintenance)
│── attackerTest.py (maintenance)
│── frontApp.py (maintenance)
│── idsServer.py (maintenance)
│── logs.txt
env/
README.md
requirements.txt
```