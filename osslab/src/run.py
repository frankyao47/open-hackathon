#!flask/bin/python
from app import app
import sys
sys.path.append("common")

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=80, debug=True)
