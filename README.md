## Content

- [Introduction](#Introduction)
- [Quickstart](#Quickstart)

## Introduction 

**Threat Detector** is a system to detect threats from external and internal  network as a stand-alone system. The system will detect threat which in this case is vulnerabilities like injection attack.

## Quickstart

1. Ensure you have installed Python programming language version 3.x. If haven't, please install it first here: https://www.python.org/downloads/
2. Install requirement python libraries. Type it on command line: pip install -r requirements
3. Run mini IDS Server in app > idsServer.py by typing it on command line: python app/idsServer.py
4. Run front App in app > templates > index.html by typing it on command line: python app/templates/index.html
5. (Optional) if you would like to test it by yourself, you can try it from attacker in app > attackerTest.py by typing it on command line: python app/attackerTest.py