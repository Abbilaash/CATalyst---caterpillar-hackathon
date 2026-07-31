import json
import random
import paho.mqtt.client as mqtt

# ==========================================
# MQTT Configuration (Local Broker)
# ==========================================
BROKER = "localhost"
PORT = 1883
TOPIC = "catalyst/telematics/#"
CLIENT_ID = f"cat-subscriber-{random.randint(1000, 9999)}"

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(f"[OK] Connected to Local MQTT Broker ({BROKER}:{PORT})", flush=True)
        print(f"[SUB] Subscribing to topic pattern: '{TOPIC}'", flush=True)
        print("Waiting for incoming machine telematics data...\n", flush=True)
        client.subscribe(TOPIC)
    else:
        print(f"[ERROR] Failed to connect, return code {rc}", flush=True)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        machine_id = payload.get("machine_id", "UNKNOWN")
        model = payload.get("model", "")
        status = payload.get("status", "NORMAL")
        metrics = payload.get("metrics", {})
        location = payload.get("location", {})
        timestamp = payload.get("timestamp", "")

        status_tag = "[OK]" if status == "OPERATIONAL" else "[WARNING]"

        print("--------------------------------------------------", flush=True)
        print(f"{status_tag} [TELEMETRY RECEIVED] Topic: {msg.topic}", flush=True)
        print(f"Machine:  {machine_id} ({model})", flush=True)
        print(f"Time:     {timestamp}", flush=True)
        print(f"Coords:   Lat {location.get('lat')}, Lng {location.get('lng')}", flush=True)
        print(f"Metrics:  Engine RPM: {metrics.get('engine_rpm')} | Hyd Temp: {metrics.get('hydraulic_temp_c')}C | Fuel: {metrics.get('fuel_level_percent')}%", flush=True)
        if status != "OPERATIONAL":
            print(f"ALERT STATUS: {status}", flush=True)
        print("--------------------------------------------------\n", flush=True)

    except json.JSONDecodeError:
        print(f"Raw Message Received on {msg.topic}: {msg.payload.decode('utf-8')}", flush=True)

# Initialize Client with paho-mqtt v2 / v1 compatibility
try:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, CLIENT_ID)
except AttributeError:
    client = mqtt.Client(CLIENT_ID)

client.on_connect = on_connect
client.on_message = on_message

print(f"Connecting to {BROKER}:{PORT}...", flush=True)
client.connect(BROKER, PORT, 60)

try:
    client.loop_forever()
except KeyboardInterrupt:
    print("\nStopping CATalyst Telematics Subscriber...", flush=True)
    client.disconnect()
    print("Disconnected cleanly.", flush=True)
