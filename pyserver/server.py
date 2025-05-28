from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS

from PIL import Image

import json
import os
import threading

from obswebsocket import obsws, requests

flask_app = Flask(__name__)
CORS(flask_app)

##### OBSWS HANDLING #####

connectionsDic = {}
connectionsLis = []
recordingLis = []

@flask_app.route('/obsw/connect', methods=['POST'])
def connectobs():

    global connectionsDic
    global connectionsLis

    if request.is_json:
        data = request.get_json()
        if data['ip'] and not data['ip'] in connectionsDic:
            
            websocket = obsws(data['ip'], 4455)
            try:
                websocket.connect()

                connectionsDic[data['ip']] = websocket
                connectionsLis.append(data['ip'])

                return jsonify({'message':'Device successfully connected'}), 200
            except Exception as E:
                return jsonify({'error':str(E)}), 404

        else:
            return jsonify({'error':'Device already has a WEBS connection'}), 403
    else:
        return jsonify({'error':'no JSON'}), 400
    
@flask_app.route('/obsw/disconnect', methods=['POST'])
def disconnectobs():

    global connectionsDic
    global connectionsLis
    global recordingLis

    if request.is_json:
        data = request.get_json()
        if data['ip'] and data['ip'] in connectionsDic:
            
            websocket = connectionsDic[data['ip']]

            try:
                websocket.disconnect()
                del connectionsDic[data['ip']]
                recordingLis.remove(data['ip'])

                if data['ip'] in recordingLis:
                    recordingLis.remove(data['ip'])

                return jsonify({'message':'Device successfully disconnected'}), 200
            except Exception as E:
                return jsonify({'error':E})
        else:
            return jsonify({'error':'Device has no WEBS connection'}), 403
    else:
        return jsonify({'error':'no JSON'}), 400

@flask_app.route('/obsw/readcon')
def readcon():
    return jsonify(connectionsLis), 200

@flask_app.route('/obsw/readrec')
def readrec():
    return jsonify(recordingLis), 200

@flask_app.route('/obsw/screen', methods=['POST'])
def getscreenprev():
    if request.is_json:
        data = request.get_json()
        if data['ip'] and data['ip'] in connectionsDic:
            
            websocket = connectionsDic[data['ip']]

            try:
                scene_response = websocket.call(requests.GetCurrentProgramScene())
                scene_name = scene_response.datain['currentProgramSceneName']

                screenshot_request = requests.GetSourceScreenshot(
                    sourceName=scene_name,
                    imageFormat='webp',
                    imageWidth=1920,
                    imageHeight=1080
                )

                screenshot_response = websocket.call(screenshot_request)
                image_data = screenshot_response.datain['imageData']

                return jsonify({
                    'message':'Screenshot captured successfully.',
                    'imageData':image_data
                }), 200

            except Exception as E:
                print(E)
                return jsonify({'error':str(E)}), 500
        return jsonify({'error':'Device has no WEBS connection.'}), 403
    return jsonify({'error': 'no JSON'}), 400

@flask_app.route('/obsw/startrec', methods=['POST'])
def startrec():

    global recordingLis

    if request.is_json:
        data = request.get_json()

        if data['ip'] and not data['ip'] in recordingLis:
            try:
                recordingLis.append(data['ip'])

                websocket = connectionsDic[data['ip']]
                websocket.call(requests.StartReplayBuffer())

                return jsonify({'message':'Recording started successfully'}), 200
            except Exception as E:
                if data['ip'] in recordingLis:
                    recordingLis.remove(data['ip'])
                    
                return jsonify({'error': str(E)}), 500

        else:
            return jsonify({'error':'no ip or already recording'}), 403
        
@flask_app.route('/obsw/stoprec', methods=['POST'])
def stoprec():

    global recordingLis

    if request.is_json:

        data = request.get_json()

        if data['ip'] and data['ip'] in recordingLis:

            try:
                recordingLis.remove(data['ip'])
                websocket = connectionsDic[data['ip']]
                websocket.call(requests.StopReplayBuffer())

                return jsonify({'message':'recording stopped successfully'}), 200
            except Exception as E:
                recordingLis.append(data['ip'])
                print(E)
                return jsonify({'error':str(E)}), 500
        else:
            return jsonify({'message':'bad request'}), 403
        
@flask_app.route('/obsw/saverec', methods=['POST'])
def saverec():
    global connectionsDic
    global recordingLis

    if request.is_json:
        data = request.get_json()
        if data['ip'] and data['ip'] in connectionsDic:
            try:
                websocket = connectionsDic[data['ip']]
                websocket.call(requests.SaveReplayBuffer())
                
                return jsonify({'message': 'Replay buffer saved successfully'}), 200
            except Exception as E:
                return jsonify({'error': str(E)}), 500
        else:
            return jsonify({'error': 'Device has no WEBS connection'}), 403
    else:
        return jsonify({'error': 'no JSON'}), 400
    

@flask_app.route('/ping', methods=['POST'])
def ping():
    if request.is_json:
        
        data = request.get_json()
        if data['ip']:
            response = os.system(f"ping {data['ip']} -n 1")
            
            if response == 0:
                return {"message":response}, 200
            else:
                return {"error":response}, 400
                

# WEBSERVER STUFF

web_app = Flask(__name__, static_folder='../Website')
CORS(web_app)

@web_app.route('/')
def serve_index():
    return send_from_directory('../Website', 'index.html')

@web_app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('../Website', filename)

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