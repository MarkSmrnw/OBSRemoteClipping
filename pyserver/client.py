from obswebsocket import obsws, requests

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

import mss
from PIL import Image

import io
import time

flask_app = Flask(__name__)
CORS(flask_app)

SERVERIP = "0.0.0.0"
DEVICEID = 0
HASCONNECTION = False
WS = None

# OBSW

# FUNCS

def take_ss() -> bytes:
    with mss.mss() as sct:
        monitor = sct.monitors[1]
        sct_img = sct.grab(monitor)
        img = Image.frombytes("RGB", sct_img.size, sct_img.rgb)

        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format="WEBP")
        return img_byte_arr.getvalue()

# FLASC

@flask_app.route('/ping')
def ping():
    return jsonify({"message":"Ping recieved."}), 200

@flask_app.route('/connect', methods=['POST'])
def connection():
    if request.is_json:
        data = request.get_json()

        # DATA STRUCTURE
        #{  
        #    "deviceId" : 1,
        #}

        if (data['deviceId']):

            global SERVERIP
            global DEVICEID
            global HASCONNECTION

            SERVERIP = request.remote_addr
            DEVICEID = data['deviceId']

            if (HASCONNECTION == False):
                global WS

                WS = obsws("localhost", 4455)
                WS.connect()

                HASCONNECTION = True

                return jsonify({'message': "Client recieved connection."}), 200
            return jsonify({"error": "Client already has a connection!"}), 403
        
        return jsonify({"error":"Proper content not delivered"}), 400
    return jsonify({"error":"Request is not JSON."}), 400

@flask_app.route('/disconnect')
def disconnect():
    
    global WS
    global SERVERIP
    global DEVICEID
    global HASCONNECTION

    if (HASCONNECTION and WS):
        WS.disconnect()

        SERVERIP = "0.0.0.0"
        DEVICEID = 0
        HASCONNECTION = False
        WS = None

        return jsonify({'message': "Client disconnected."}), 200
    return jsonify({'error': "Client has no connection."}), 400


@flask_app.route('/screenshot')
def sendscreenshot():
    try:
        return send_file(
            io.BytesIO(take_ss()),
            mimetype= 'image/webp',
            as_attachment=False,
            download_name="screen.webp"
        )
    except Exception as e:
        return str(e), 500

def run():
    flask_app.run(debug=False, host="0.0.0.0", port=5000)
    