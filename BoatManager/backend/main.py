import json
import os
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import requests
import threading
import paho.mqtt.client as mqtt
import binascii
import base64
import time
from math import sin, cos, radians, degrees, asin, atan2
from dateutil import parser
import datetime
from dotenv import load_dotenv



load_dotenv()

APIKEY = os.getenv("APIKEY")
headers = {
    "Authorization": "Bearer " + str(APIKEY),
    "Content-Type": "application/json",
}

# MQTT cred
MQTT_APIKEY = os.getenv("MQTT_APIKEY")
MQTT_TENANT = os.getenv("MQTT_TENANT")
MQTT_BROKER = os.getenv("MQTT_BROKER")
MQTT_PORT = os.getenv("MQTT_PORT")
APPLICATION_ID = os.getenv("APPLICATION_ID")


def filter_message(msg):
    return {
        "device_id": msg["end_device_ids"]["device_id"],
        "timestamp": msg["received_at"],
        "payload_raw": msg["uplink_message"]["frm_payload"],
        "payload_decoded": base64.b64decode(
            msg["uplink_message"]["frm_payload"]
        ).decode("utf-8"),
    }


def on_connect(client, userdata, flags, rc, prop):
    print("connected with result code " + str(rc))
    client.subscribe("#")


def send_register(device: str, username: str, plate: str):
    deveui_b = os.urandom(8)
    deveui_x = binascii.hexlify(deveui_b).decode("utf-8").upper()

    appkey_b = os.urandom(16)
    appkey_x = binascii.hexlify(appkey_b).decode("utf-8").upper()

    url = "https://eu1.cloud.thethings.network/api/v3/applications/anti-theft-boat0/devices"
    nsurl = (
        "https://eu1.cloud.thethings.network/api/v3/ns/applications/anti-theft-boat0/devices/"
        + device
    )
    asurl = (
        "https://eu1.cloud.thethings.network/api/v3/as/applications/anti-theft-boat0/devices/"
        + device
    )
    jsurl = (
        "https://eu1.cloud.thethings.network/api/v3/js/applications/anti-theft-boat0/devices/"
        + device
    )
    data = {
        "end_device": {
            "ids": {
                "join_eui": "0000000000000000",
                "dev_eui": str(deveui_x),
                "device_id": device,
                "application_ids": {"application_id": "anti-theft-boat0"},
            },
            "network_server_address": "eu1.cloud.thethings.network",
            "application_server_address": "eu1.cloud.thethings.network",
            "join_server_address": "eu1.cloud.thethings.network",
        },
        "field_mask": {
            "paths": [
                "network_server_address",
                "application_server_address",
                "join_server_address",
            ]
        },
    }

    data_ns = {
        "end_device": {
            "frequency_plan_id": "EU_863_870_TTN",
            "lorawan_version": "MAC_V1_0_3",
            "lorawan_phy_version": "PHY_V1_0_3_REV_A",
            "supports_join": True,
            "multicast": False,
            "supports_class_b": False,
            "supports_class_c": False,
            "mac_settings": {"rx2_data_rate_index": 0, "rx2_frequency": "869525000"},
            "ids": {
                "join_eui": "0000000000000000",
                "dev_eui": str(deveui_x),
                "device_id": device,
                "application_ids": {"application_id": "anti-theft-boat0"},
            },
        },
        "field_mask": {
            "paths": [
                "frequency_plan_id",
                "lorawan_version",
                "lorawan_phy_version",
                "supports_join",
                "multicast",
                "supports_class_b",
                "supports_class_c",
                "mac_settings.rx2_data_rate_index",
                "mac_settings.rx2_frequency",
                "ids.join_eui",
                "ids.dev_eui",
                "ids.device_id",
                "ids.application_ids.application_id",
            ]
        },
    }

    data_as = {
        "end_device": {
            "ids": {
                "join_eui": "0000000000000000",
                "dev_eui": str(deveui_x),
                "device_id": device,
                "application_ids": {"application_id": "anti-theft-boat0"},
            }
        },
        "field_mask": {
            "paths": [
                "ids.join_eui",
                "ids.dev_eui",
                "ids.device_id",
                "ids.application_ids.application_id",
            ]
        },
    }

    data_js = {
        "end_device": {
            "ids": {
                "join_eui": "0000000000000000",
                "dev_eui": str(deveui_x),
                "device_id": device,
                "application_ids": {"application_id": "anti-theft-boat0"},
            },
            "root_keys": {"app_key": {"key": str(appkey_x)}},
        },
        "field_mask": {
            "paths": [
                "ids.join_eui",
                "ids.dev_eui",
                "ids.device_id",
                "ids.application_ids.application_id",
                "root_keys.app_key.key",
            ]
        },
    }

    response = requests.post(url, headers=headers, json=data)

    time.sleep(5)
    if response.status_code == 200:
        print(response.text)
        print("-----------------------")
        print(nsurl)
        print(asurl)
        print(jsurl)
        print("-----------------------")

        response_ns = requests.put(nsurl, headers=headers, json=data_ns)
        time.sleep(2)
        response_as = requests.put(asurl, headers=headers, json=data_as)
        time.sleep(5)
        response_js = requests.put(jsurl, headers=headers, json=data_js)
        if (
            response_ns.status_code == 200
            and response_as.status_code == 200
            and response_js.status_code == 200
        ):
            response = {
                "DeviceId": device,
                "DevEui": str(deveui_x),
                "AppKey": str(appkey_x),
                "message": "Device added successfully",
                "device": {
                    "deviceId": device,
                    "username": username,
                    "targa": plate,
                },
                "status": 200,
            }
            return response
        else:
            print(response_ns.status_code)
            print(response_ns.text)
            print("-----------------------")
            print(response_as.status_code)
            print(response_as.text)
            print("-----------------------")
            print(response_js.status_code)
            print(response_js.text)
            print("-----------------------")
            return "err"
    else:
        print(response.status_code)
        print(response.text)
        return "err"


def delete_device(device: str):
    url = (
        "https://eu1.cloud.thethings.network/api/v3/applications/anti-theft-boat0/devices/"
        + device
    )
    nsurl = (
        "https://eu1.cloud.thethings.network/api/v3/ns/applications/anti-theft-boat0/devices/"
        + device
    )
    asurl = (
        "https://eu1.cloud.thethings.network/api/v3/as/applications/anti-theft-boat0/devices/"
        + device
    )
    jsurl = (
        "https://eu1.cloud.thethings.network/api/v3/js/applications/anti-theft-boat0/devices/"
        + device
    )

    response = requests.delete(url, headers=headers)

    responsens = requests.delete(nsurl, headers=headers)
    responseas = requests.delete(asurl, headers=headers)
    responsejs = requests.delete(jsurl, headers=headers)

    if (
        response.status_code == 200
        and responsens.status_code == 200
        and responseas.status_code == 200
        and responsejs.status_code == 200
    ):
        return "delete succesfully" + device
    else:
        print(response.status_code)
        print(response.text)
        return "err"


def get_devices():
    url = "https://eu1.cloud.thethings.network/api/v3/applications/anti-theft-boat0/devices"

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        print("okay")
        return jsonify(response.json())
    else:
        print(response.status_code)
        print(response.text)
        return "err"


app = Flask(__name__)


CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:5173"],
    allow_credentials=True,
)


BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"sqlite:///{os.path.join(BASE_DIR, 'devices.db')}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)


class Device(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    device_id = db.Column(db.String(100), nullable=False, unique=True)
    targa = db.Column(db.String(20), nullable=False)
    username = db.Column(db.String(80), unique=False, nullable=False)
    alarm = db.Column(db.Boolean, default=False)
    status = db.Column(db.Integer, default=0)
    current_lat = db.Column(db.Float, default=37.514387)
    current_long = db.Column(db.Float, default=15.106798)


class AlarmMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    device_id = db.Column(db.String(100), nullable=False, unique=False)
    time = db.Column(db.String(80), nullable=False)
    velocity = db.Column(db.String(80), nullable=False)
    direction = db.Column(db.String(80), nullable=False)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(100), nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    cognome = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False)


class UserTokens(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    token = db.Column(db.String(128), nullable=False)


with app.app_context():
    db.create_all()


def on_message(client, userdata, msg):
    topic = str(msg.topic)
    message_str = msg.payload.decode("utf-8")

    try:
        message_json = json.loads(message_str)
        filtered = filter_message(message_json)
        print(json.dumps(filtered, indent=2))
        print("----Data----")
        payload_text = filtered["payload_decoded"]
        print(payload_text)
        device_id = filtered["device_id"]
        timestamp = filtered["timestamp"]
        direzione = None
        flusso = None
        if ";" in payload_text:
            direzione, flusso = payload_text.split(";")
            with app.app_context():
                print("----Device----")
                device = Device.query.filter_by(device_id=device_id).first()
                print("--------------------")
                print(device)
                if device and not device.alarm and device.status == 1:
                    print(f"Setting alarm ON for device {device_id}")
                    device.alarm = True

                if device.alarm:
                    new_packet = AlarmMessage(
                        device_id=device_id,
                        time=timestamp,
                        velocity=flusso,
                        direction=direzione,
                    )
                    db.session.add(new_packet)

                db.session.commit()

    except Exception as e:
        print("Errore nel parsing o nel filtro del messaggio:", e)


client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id="pyintegration",
    userdata=None,
    protocol=4,
)
client.on_connect = on_connect
client.on_message = on_message
client.username_pw_set(APPLICATION_ID, MQTT_APIKEY)
client.connect(MQTT_BROKER, 1883, 60)


@app.route("/register", methods=["POST"])
def register():
    input_json = request.get_json(force=True)
    if not input_json:
        return jsonify({"error": "No json received"}), 400

    device_id = input_json.get("deviceId")
    username = input_json.get("username")
    plate = input_json.get("targa")

    if not all([device_id, username, plate]):
        return jsonify({"error": "Missing required fields"}), 400

    respons = send_register(device_id, username, plate)
    if respons != "err":
        new_device = Device(
            device_id=input_json["deviceId"],
            targa=input_json["targa"],
            username=username,
        )

        db.session.add(new_device)
        db.session.commit()
    return jsonify({"respons": respons}), 201


@app.route("/delete/<deviceid>")
def delete(deviceid):
    try:
        respons = delete_device(deviceid)
        device = Device.query.filter_by(device_id=deviceid).first()

        if not device or respons == "err":
            return jsonify({"error": f"Device with ID {deviceid} not found"}), 404

        db.session.delete(device)
        db.session.commit()

        return jsonify({"message": f"Device {deviceid} deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/devices", methods=["POST"])
def list_devices():
    input_json = request.get_json(force=True)
    if not input_json:
        return jsonify({"error": "No json received"}), 400

    user_token = input_json.get("AuthToken")

    username_bytoken = UserTokens.query.filter_by(token=user_token).first()

    user = User.query.filter_by(username=username_bytoken.username).first()

    if user.role == "admin":
        devices = Device.query.all()
        return jsonify(
            [
                {
                    "device": {
                        "deviceId": d.device_id,
                        "username": d.username,
                        "targa": d.targa,
                        "allerta": d.alarm,
                        "status": d.status,
                    }
                }
                for d in devices
            ]
        )

    if not username_bytoken:
        return jsonify({"error": "no valid token"})

    devices = Device.query.filter_by(username=username_bytoken.username)

    return jsonify(
        [
            {
                "device": {
                    "deviceId": d.device_id,
                    "username": d.username,
                    "targa": d.targa,
                    "allerta": d.alarm,
                    "status": d.status,
                }
            }
            for d in devices
        ]
    )
    # usare per prendere da ttn;
    # return get_devices()


@app.route("/alertmonitor", methods=["POST"])
def monitor_alert():
    with app.app_context():
        data = request.get_json()
        if not data:
            return jsonify({"error": "No json received"}), 400
        print("-----------------------")
        deviceid = data.get("deviceId")
        print("-------------device ", deviceid);
        last_packet = (AlarmMessage.query.filter_by(device_id=deviceid).order_by(AlarmMessage.id.desc()).first())

        print("---------quest è la query:", last_packet)
        print("-----------------------")
        previous_packet = (
            AlarmMessage.query.filter_by(device_id=deviceid)
            .order_by(AlarmMessage.id.desc())
            .offset(2)
            .first()
        )
        print("-----------------------")

        time1 = last_packet.time
        time2 = previous_packet.time

        time1 = time1.rstrip("Z")[:26]
        time2 = time2.rstrip("Z")[:26]

        dt1 = datetime.datetime.strptime(time1, "%Y-%m-%dT%H:%M:%S.%f")
        dt2 = datetime.datetime.strptime(time2, "%Y-%m-%dT%H:%M:%S.%f")

        second1 = int(dt1.timestamp())
        second2 = int(dt2.timestamp())
        time3 = second1 - second2 

        print("_________________--", time3)
        time3 = (second1 / 3600) - (second2 / 3600)

        v = last_packet.velocity
        direction = last_packet.direction
        R = 3440.065

        distanza = float(v) * time3
        print("distanzaaa----------- ", distanza)

        device = Device.query.filter_by(device_id=deviceid).first()

        latrad = radians(device.current_lat)

        lonrad = radians(device.current_long)

        distanza_angolare = distanza / R
        directionrad = radians(int(direction))
        print("lat", latrad)
        print("long", lonrad)
        print("------------")

        new_lat = asin(
            sin(latrad) * cos(distanza_angolare)
            + cos(latrad) * sin(distanza_angolare) * cos(directionrad)
        )
        new_lon = lonrad + atan2(
            sin(directionrad) * sin(distanza_angolare) * cos(latrad),
            cos(distanza_angolare) - sin(latrad) * sin(new_lat),
        )
        new_lat = degrees(new_lat)
        new_lon = degrees(new_lon)
        print("new lat", new_lat)
        print("new long", new_lon)
        print("------------")

        device.current_lat = new_lat
        device.current_long = new_lon
        

        print("-----------------------")

        print("dt1: ", time1)
        print("dt2: ", time2)
        print("dt3: ", time3)
        print("v: ", v)
        print("dir: ", direction)
        print("lat: ", device.current_lat)
        print("lon: ", device.current_long)

        payload = {
            "speed": v,
            "direction": direction,
            "latitude": new_lat,
            "longitude": new_lon,
            "timestamp": time1,
        }

        db.session.commit()

    return jsonify(payload)


@app.route("/switchst", methods=["POST"])
def change_status():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No json received"}), 400

    user_token = data.get("AuthToken")
    deviceid = data.get("deviceId")
    change_st = data.get("payload")
    change_st = change_st.encode("utf-8")
    b64_st = base64.b64encode(change_st)

    topic = "v3/anti-theft-boat0@ttn/devices/" + deviceid + "/down/replace"

    payload = {
        "downlinks": [
            {"f_port": 1, "frm_payload": b64_st.decode(), "priority": "NORMAL"}
        ]
    }
    print("-------------------")
    print(payload)
    username_bytoken = UserTokens.query.filter_by(token=user_token).first()

    if not username_bytoken:
        return jsonify({"error": "no valid token"}, 400)

    device = Device.query.filter_by(
        username=username_bytoken.username, device_id=deviceid
    ).first()

    print(change_st)
    if change_st == b"off":
        print("------------off")
        device.alarm = False
        device.status = 0
        device.current_lat = 37.514387
        device.current_long = 15.106798
        AlarmMessage.query.filter_by(device_id=device.device_id).delete()

    if change_st == b"on":
        print("--------------on")
        device.status = 1

    db.session.commit()

    if not username_bytoken.username or not device:
        return jsonify({"error": "Invalid device or user"}), 401

    client_send = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id="downlink",
        userdata=None,
        protocol=4,
    )
    client_send.on_connect = on_connect
    client_send.username_pw_set(APPLICATION_ID, MQTT_APIKEY)
    client_send.connect(MQTT_BROKER, 1883, 60)

    client_send.loop_start()

    client.publish(topic, json.dumps(payload))

    return "200"


@app.route("/counteralert", methods=["GET"])
def counter():
    return jsonify({"counter": counter}), 

@app.route("/signin", methods=["POST"])
def signin():
    data = request.get_json()
    username_data = data.get("username")
    password = data.get("password")
    email = data.get("email")
    name = data.get("name")
    surname = data.get("surname")
    role = data.get("role", "user")

    if not username_data or not password or not email or not name or not surname:
        return jsonify({"error": "Username and password required"}), 400

    if User.query.filter_by(username=username_data).first():
        return jsonify({"error": "User already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    new_user = User(
        username=username_data,
        email=email,
        nome=name,
        cognome=surname,
        password_hash=hashed_password,
        role=role,
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201


@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
        response.headers.add(
            "Access-Control-Allow-Headers", "Content-Type,Authorization"
        )
        response.headers.add(
            "Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS"
        )
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    token_b = os.urandom(128)
    token_x = binascii.hexlify(token_b).decode("utf-8").upper()
    expire_date = datetime.datetime.now()
    expire_date = expire_date + datetime.timedelta(days=90)

    user = User.query.filter_by(username=username).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 404
    check_token = UserTokens.query.filter_by(username=username).first()
    if not check_token:
        NewUserToken = UserTokens(username=username, token=token_x)
        db.session.add(NewUserToken)
        db.session.commit()

    response = jsonify(
        {"status": "success", "auth_token": check_token.token, "role": user.role}
    )
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    response.set_cookie(
        "token",
        check_token.token,
        max_age=60 * 60 * 24 * 90,
        samesite=None,
        expires=expire_date,
        secure=False,
        httponly=True,
        path="/",
    )

    return response


# Run the Flask app
def mqtt_client():
    client.loop_forever()


if __name__ == "__main__":
    mqtt_t = threading.Thread(target=mqtt_client)
    mqtt_t.start()
    app.run(host="0.0.0.0", port= 5000, debug=True)
