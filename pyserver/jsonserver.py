from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS

from PIL import Image

import json
import os
import threading

path = os.getcwd() + "/pyserver/data/connections.json"
recpath = os.getcwd() + "/pyserver/data/recording.json"

flask_app = Flask(__name__)
CORS(flask_app)

# Web server for serving HTML files
web_app = Flask(__name__, static_folder='../Website')
CORS(web_app)

@web_app.route('/')
def serve_index():
    return send_from_directory('../Website', 'index.html')

@web_app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('../Website', filename)

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

@flask_app.route('/rec/read')
def readrec():

    with open(recpath, "r") as f:
        data = json.load(f)

    return jsonify(data)

@flask_app.route('/rec/write', methods=['POST'])
def writerec():
    if request.is_json:
        data = request.get_json()
        with open(recpath, "w") as f:
            json.dump(data, f, indent=4)

        return {"message":"JSON data dumped"}, 200

def run():
    flask_app.run(debug=False, host="0.0.0.0", port=5001)

def run_web_server():
    print("YOU CAN ACCESS THE WEBUI THROUGH:")
    print("localhost:8080")
    print("^^^^^^^^^^^^^^")
    print()
    web_app.run(debug=False, host="0.0.0.0", port=8080)

if __name__ == "__main__":
    # Start the JSON API server in a separate thread
    api_thread = threading.Thread(target=run)
    api_thread.daemon = True
    api_thread.start()
    
    # Start the web server in the main thread
    run_web_server()