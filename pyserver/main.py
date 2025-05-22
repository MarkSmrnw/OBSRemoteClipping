from obswebsocket import obsws, requests

from flask import Flask, request, jsonify
from flask_cors import CORS

flask_app = Flask(__name__)
CORS(flask_app)

@flask_app.route('/ping', methods=['POST'])
def ping():
    return jsonify({"message":"Ping recieved."}), 200

@flask_app.route('/send_string', methods=['POST'])
def recieve_string():
    if request.is_json:
        data = request.get_json()
        print(data)

        return jsonify({"message":"Python request processed."}), 200
    return jsonify({"error": "Request must be JSON"}), 400

if __name__ == '__main__':
    flask_app.run(debug=True, host="0.0.0.0")