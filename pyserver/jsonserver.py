from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS

from PIL import Image

import json
import os
import threading

import obswebsocket

path = os.path.dirname(os.path.abspath(__file__)) + r"\data\connections.json"
recpath = os.path.dirname(os.path.abspath(__file__)) + r"\data\recording.json"

flask_app = Flask(__name__)
CORS(flask_app)

##### OBSWS HANDLING #####

connectionhash = {
    # 'IPADDRESS' : THREADOBJ
}

@flask_app.route('/obsw/connect', methods=['POST'])
def connectobs():
    # TO DO:
    # - SAVE CONNECTIONS IN THREADS
    # - CONNECT VIA SERVER
    # - REMOVE WEBSOCKET FOR WEBSOCKET :)

    ...

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

@flask_app.route('/obsw/read')
def readrec():

    with open(recpath, "r") as f:
        data = json.load(f)

    return jsonify(data)

@flask_app.route('/obsw/write', methods=['POST'])
def writerec():
    if request.is_json:
        data = request.get_json()
        with open(recpath, "w") as f:
            json.dump(data, f, indent=4)

        return {"message":"JSON data dumped"}, 200

@flask_app.route('/ping', methods=['POST'])
async def ping():
    if request.is_json:
        
        data = request.get_json()
        if data['ip']:
            response = os.system(f"ping {data['ip']}")
            
            if response == 0:
                return {"message":response}, 200
            else:
                return {"error":response}, 400
                

def run():
    flask_app.run(debug=False, host="0.0.0.0", port=5001)

def run_web_server():
    print("YOU CAN ACCESS THE WEBUI THROUGH:")
    print("localhost:8080")
    print("^^^^^^^^^^^^^^")
    print()
    web_app.run(debug=False, host="0.0.0.0", port=8080)

if __name__ == "__main__":
    api_thread = threading.Thread(target=run)
    api_thread.daemon = True
    api_thread.start()
    
    run_web_server()