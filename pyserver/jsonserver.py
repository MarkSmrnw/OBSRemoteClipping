from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

from PIL import Image

import json
import os

path = os.getcwd() + "/pyserver/connections.json"

flask_app = Flask(__name__)
CORS(flask_app)

@flask_app.route('/read')
def readjson():
    
    with open(path, "r") as f:
        data = json.load(f)

    return jsonify(data)

@flask_app.route('/write', methods=['POST'])
def writejson():
    if request.is_json:
        data = request.get_json()
        with open(path, "w") as f:
            json.dump(data, f, indent=4)

        return {"message":"JSON data dumped"}, 200



def run():
    flask_app.run(debug=False, host="0.0.0.0", port=5001)