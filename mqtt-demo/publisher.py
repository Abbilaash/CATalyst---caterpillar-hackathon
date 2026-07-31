import json
import random
import time
from datetime import datetime, timezone
import paho.mqtt.client as mqtt
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

# ==========================================
# MQTT Configuration (Public Broker)
# ==========================================
BROKER = "test.mosquitto.org"
PORT = 1883
CONTROL_PORT = 8086
CLIENT_ID = f"cat-publisher-{random.randint(1000, 9999)}"

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(f"[OK] Publisher connected to Local MQTT Broker ({BROKER}:{PORT})", flush=True)
        print(f"[STREAM] Telemetry publisher ready for single active machine selection...\n", flush=True)
    else:
        print(f"[ERROR] Failed to connect, return code {rc}", flush=True)

try:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, CLIENT_ID)
except AttributeError:
    client = mqtt.Client(CLIENT_ID)

client.on_connect = on_connect

print(f"Connecting to {BROKER}:{PORT}...", flush=True)
client.connect(BROKER, PORT, 60)
client.loop_start()

# Helper function for delta clamping
def clamp_delta(current_val, target_val, max_delta):
    diff = target_val - current_val
    if diff > max_delta:
        return current_val + max_delta
    elif diff < -max_delta:
        return current_val - max_delta
    return target_val

# ==========================================
# PERSISTENT MACHINE SIMULATOR
# ==========================================

class CaterpillarMachine:
    def __init__(self, asset_id, name, model, equipment_type, fuel_capacity, initial_hours, initial_fuel, start_lat, start_lon):
        self.asset_id = asset_id
        self.name = name
        self.model = model
        self.equipment_type = equipment_type
        self.fuel_capacity = float(fuel_capacity)
        
        # State Variables
        self.engine_status = "OFF"
        self.ignition_status = "OFF"
        self.operating_mode = "Parked"
        self.ticks_in_current_mode = 0
        self.mode_duration_ticks = random.randint(10, 30)
        
        # Telemetry Values (Persisted across updates)
        self.fuel_remaining_liters = float(initial_fuel)
        self.fuel_level_percent = round((self.fuel_remaining_liters / self.fuel_capacity) * 100, 2)
        self.engine_hours = float(initial_hours)
        self.idle_hours = 120.5
        
        self.engine_rpm = 0
        self.speed_kmph = 0.0
        self.hydraulic_pressure = 25.0
        self.engine_temperature = 35.0
        self.coolant_temperature = 33.0
        self.hydraulic_oil_temperature = 30.0
        self.battery_voltage = 24.0
        
        self.payload_tons = 0.0
        self.bucket_position_percent = 0.0
        self.boom_height = 0.0
        
        self.latitude = start_lat
        self.longitude = start_lon
        self.altitude = 320.0
        self.heading = 180.0

    def update_tick(self, dt=2):
        """Updates persistent machine telemetry strictly while Engine is ON."""
        if self.engine_status != "ON":
            return {
                "asset_id": self.asset_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "latitude": self.latitude,
                "longitude": self.longitude,
                "altitude": self.altitude,
                "heading": self.heading,
                "speed_kmph": 0.0,
                "engine_status": "OFF",
                "ignition_status": "OFF",
                "engine_rpm": 0,
                "engine_hours": round(self.engine_hours, 4),
                "idle_hours": round(self.idle_hours, 4),
                "fuel_level_percent": self.fuel_level_percent,
                "fuel_remaining_liters": self.fuel_remaining_liters,
                "fuel_consumption_lph": 0.0,
                "engine_temperature": self.engine_temperature,
                "coolant_temperature": self.coolant_temperature,
                "hydraulic_oil_temperature": self.hydraulic_oil_temperature,
                "hydraulic_pressure": 25.0,
                "payload_tons": 0.0,
                "bucket_position_percent": 0.0,
                "boom_height": 0.0,
                "battery_voltage": 24.0,
                "operating_mode": "Parked"
            }

        self.ticks_in_current_mode += 1

        # 1. Mode Transitions (every 20-60s)
        if self.ticks_in_current_mode >= self.mode_duration_ticks:
            self.ticks_in_current_mode = 0
            self.mode_duration_ticks = random.randint(10, 30)

            if self.operating_mode in ["Idle", "Parked"]:
                self.operating_mode = "Travelling"
            elif self.operating_mode == "Travelling":
                self.operating_mode = "Working"
            elif self.operating_mode == "Working":
                self.operating_mode = "Idle"

        # 2. Target Values per Mode & Noticeable Fuel Burn Rates
        if self.operating_mode == "Idle":
            self.idle_hours += round(dt / 3600, 6)
            self.engine_hours += round(dt / 3600, 6)
            
            target_rpm = random.randint(700, 850)
            target_speed = 0.0
            burn_per_tick = 0.02  # -0.02 L every 2 seconds
            fuel_rate_lph = 36.0
            target_hydraulic = random.uniform(80.0, 120.0)
            target_temp = 78.0
            self.payload_tons = 0.0
            self.bucket_position_percent = 0.0
            self.boom_height = 0.0

        elif self.operating_mode == "Travelling":
            self.engine_hours += round(dt / 3600, 6)

            target_rpm = random.randint(1200, 1700)
            target_speed = random.uniform(5.0, 15.0)
            burn_per_tick = 0.06  # -0.06 L every 2 seconds
            fuel_rate_lph = 108.0
            target_hydraulic = random.uniform(120.0, 180.0)
            target_temp = 84.0
            self.payload_tons = 0.0
            self.bucket_position_percent = 0.0
            self.boom_height = 0.0

        elif self.operating_mode == "Working":
            self.engine_hours += round(dt / 3600, 6)

            target_rpm = random.randint(1700, 2100)
            target_speed = 0.0
            burn_per_tick = 0.12  # -0.12 L every 2 seconds
            fuel_rate_lph = 216.0
            target_hydraulic = random.uniform(280.0, 340.0)
            target_temp = 89.5
            self.payload_tons = min(15.0, round(self.payload_tons + random.uniform(0.5, 1.5), 1))
            self.bucket_position_percent = round(random.uniform(30.0, 90.0), 1)
            self.boom_height = round(random.uniform(1.2, 3.8), 2)

        # 3. ENFORCE STRICT DELTA LIMITS
        self.engine_rpm = int(clamp_delta(self.engine_rpm, target_rpm, 80))
        self.speed_kmph = round(clamp_delta(self.speed_kmph, target_speed, 2.0), 1)
        self.engine_temperature = round(clamp_delta(self.engine_temperature, target_temp, 0.5), 1)
        self.coolant_temperature = round(self.engine_temperature * 0.94, 1)
        self.hydraulic_oil_temperature = round(self.engine_temperature * 0.75, 1)
        self.hydraulic_pressure = round(clamp_delta(self.hydraulic_pressure, target_hydraulic, 15.0), 1)
        self.battery_voltage = round(24.0 + random.uniform(-0.15, 0.15), 1)

        # 4. FUEL DECAY: Decreases noticeably on EVERY tick (Floor at 0)
        self.fuel_remaining_liters = max(0.0, round(self.fuel_remaining_liters - burn_per_tick, 2))
        self.fuel_level_percent = round((self.fuel_remaining_liters / self.fuel_capacity) * 100, 2)

        # 5. GPS Movement (when moving)
        if self.speed_kmph > 0:
            self.latitude = round(self.latitude + random.uniform(0.00003, 0.00008), 6)
            self.longitude = round(self.longitude + random.uniform(0.00003, 0.00008), 6)
            self.heading = round((self.heading + random.uniform(-3.0, 3.0)) % 360, 1)

        return {
            "asset_id": self.asset_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "latitude": self.latitude,
            "longitude": self.longitude,
            "altitude": self.altitude,
            "heading": self.heading,
            "speed_kmph": self.speed_kmph,
            "engine_status": self.engine_status,
            "ignition_status": self.ignition_status,
            "engine_rpm": self.engine_rpm,
            "engine_hours": round(self.engine_hours, 4),
            "idle_hours": round(self.idle_hours, 4),
            "fuel_level_percent": self.fuel_level_percent,
            "fuel_remaining_liters": self.fuel_remaining_liters,
            "fuel_consumption_lph": fuel_rate_lph,
            "engine_temperature": self.engine_temperature,
            "coolant_temperature": self.coolant_temperature,
            "hydraulic_oil_temperature": self.hydraulic_oil_temperature,
            "hydraulic_pressure": self.hydraulic_pressure,
            "payload_tons": self.payload_tons,
            "bucket_position_percent": self.bucket_position_percent,
            "boom_height": self.boom_height,
            "battery_voltage": self.battery_voltage,
            "operating_mode": self.operating_mode
        }

    def refuel(self, liters):
        if liters <= 0:
            return False, "Fuel amount must be positive"
        new_fuel = min(self.fuel_capacity, round(self.fuel_remaining_liters + liters, 2))
        added = round(new_fuel - self.fuel_remaining_liters, 2)
        self.fuel_remaining_liters = new_fuel
        self.fuel_level_percent = round((self.fuel_remaining_liters / self.fuel_capacity) * 100, 2)
        return True, added

import requests

# Persistent Fleet Map
fleet_map = {}

def load_fleet_from_api():
    try:
        response = requests.get("http://localhost:8000/api/v1/equipment", timeout=5)
        response.raise_for_status()
        equipment_list = response.json()
        
        # Pick 3 valid assets for the demo simulation
        for eq in equipment_list[:3]:
            fleet_map[eq["id"]] = CaterpillarMachine(
                asset_id=eq["id"],
                name=eq["name"],
                model=eq["model"],
                equipment_type=eq["category"],
                fuel_capacity=350.0,
                initial_hours=1245.80,
                initial_fuel=310.0,
                start_lat=40.7128,
                start_lon=-74.0060
            )
        print(f"[INIT] Loaded {len(fleet_map)} real machines from backend API.", flush=True)
    except Exception as e:
        print(f"[WARNING] Failed to load fleet from API: {e}. Falling back to hardcoded ids.", flush=True)
        fleet_map["CAT-EXC-349"] = CaterpillarMachine("CAT-EXC-349", "CAT 349", "349", "Excavator", 350.0, 1245.8, 310.0, 40.71, -74.0)

load_fleet_from_api()

active_asset_id = None
if fleet_map:
    active_asset_id = list(fleet_map.keys())[0]
    machine = fleet_map[active_asset_id]
    machine.engine_status = "ON"
    machine.ignition_status = "ON"
    machine.operating_mode = "Idle"
    machine.engine_rpm = 700
    print(f"[DEMO] Auto-started machine {active_asset_id} to stream telemetry immediately.", flush=True)

class PublisherControlHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        global active_asset_id
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            raw_body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
            req = json.loads(raw_body)
            asset_id = req.get('asset_id')
            cmd = req.get('command')

            if asset_id in fleet_map:
                machine = fleet_map[asset_id]

                if cmd == 'START_ENGINE':
                    for m in fleet_map.values():
                        if m.asset_id != asset_id:
                            m.engine_status = "OFF"
                            m.ignition_status = "OFF"
                            m.operating_mode = "Parked"
                    
                    active_asset_id = asset_id
                    machine.engine_status = "ON"
                    machine.ignition_status = "ON"
                    machine.operating_mode = "Idle"
                    machine.engine_rpm = 700

                    # Publish MQTT event catalyst/surya/{asset_id}/events
                    event_topic = f"catalyst/surya/{asset_id}/events"
                    event_payload = {
                        "asset_id": asset_id,
                        "event_type": "ENGINE_STARTED",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                    client.publish(event_topic, json.dumps(event_payload))
                    print(f"[MQTT EVENT] Topic '{event_topic}' | Engine Started for '{asset_id}'", flush=True)

                elif cmd == 'STOP_ENGINE':
                    machine.engine_status = "OFF"
                    machine.ignition_status = "OFF"
                    machine.operating_mode = "Parked"
                    machine.engine_rpm = 0
                    machine.speed_kmph = 0.0
                    if active_asset_id == asset_id:
                        active_asset_id = None

                    # Publish MQTT event catalyst/surya/{asset_id}/events
                    event_topic = f"catalyst/surya/{asset_id}/events"
                    event_payload = {
                        "asset_id": asset_id,
                        "event_type": "ENGINE_STOPPED",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                    client.publish(event_topic, json.dumps(event_payload))
                    print(f"[MQTT EVENT] Topic '{event_topic}' | Engine Stopped for '{asset_id}'", flush=True)

                elif cmd == 'ADD_FUEL':
                    liters = float(req.get('amount', 0.0))
                    success, result = machine.refuel(liters)
                    if success:
                        # Publish FUEL_ADDED MQTT event to catalyst/surya/{asset_id}/events
                        event_topic = f"catalyst/surya/{asset_id}/events"
                        event_payload = {
                            "asset_id": asset_id,
                            "event_type": "FUEL_ADDED",
                            "liters_added": result,
                            "fuel_remaining_liters": machine.fuel_remaining_liters,
                            "fuel_level_percent": machine.fuel_level_percent,
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        }
                        client.publish(event_topic, json.dumps(event_payload))
                        print(f"[MQTT EVENT] Topic '{event_topic}' | Added +{result}L -> New Fuel: {machine.fuel_remaining_liters}L ({machine.fuel_level_percent}%)", flush=True)

            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'SUCCESS', 'active': active_asset_id}).encode('utf-8'))
        except Exception as e:
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ERROR', 'error': str(e)}).encode('utf-8'))

    def log_message(self, format, *args):
        pass

def start_control_server():
    server = HTTPServer(('0.0.0.0', CONTROL_PORT), PublisherControlHandler)
    server.serve_forever()

threading.Thread(target=start_control_server, daemon=True).start()

# Main Telemetry Loop: Publishes ONLY for the single active machine to catalyst/surya/{asset_id}/telemetry
try:
    while True:
        if active_asset_id and active_asset_id in fleet_map:
            machine = fleet_map[active_asset_id]
            if machine.engine_status == "ON":
                telemetry_data = machine.update_tick(dt=2)
                telemetry_topic = f"catalyst/surya/{machine.asset_id}/telemetry"
                result = client.publish(telemetry_topic, json.dumps(telemetry_data))
                
                if result[0] == 0:
                    print(f"[OK] Topic '{telemetry_topic}' | ONLY [{machine.asset_id}] Mode: {telemetry_data['operating_mode']:<10} | RPM: {telemetry_data['engine_rpm']:<4} | Fuel: {telemetry_data['fuel_remaining_liters']} L ({telemetry_data['fuel_level_percent']}%)", flush=True)

        time.sleep(2)

except KeyboardInterrupt:
    print("\nStopping CATalyst Telematics Publisher...", flush=True)
    client.loop_stop()
    client.disconnect()
    print("Disconnected cleanly.", flush=True)
