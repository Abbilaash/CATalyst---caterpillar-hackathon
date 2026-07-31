import json
import os
import random
import sqlite3
import threading
from datetime import datetime, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler
import paho.mqtt.client as mqtt

try:
    import psycopg2
    HAS_POSTGRES = True
except ImportError:
    HAS_POSTGRES = False

BROKER = "localhost"
PORT = 1883
TOPIC_TELEMETRY = "cat/+/telemetry"
TOPIC_EVENTS = "cat/+/events"
HTTP_PORT = 8085
CLIENT_ID = f"cat-timescale-subscriber-{random.randint(1000, 9999)}"

PG_HOST = os.environ.get("POSTGRES_HOST", "localhost")
PG_PORT = int(os.environ.get("POSTGRES_PORT", 5432))
PG_DB = os.environ.get("POSTGRES_DB", "caterpillar_telematics")
PG_USER = os.environ.get("POSTGRES_USER", "postgres")
PG_PASS = os.environ.get("POSTGRES_PASSWORD", "postgres")

SQLITE_DB = "telematics_timescale_fallback.db"
pg_conn = None

def init_db():
    global pg_conn
    if HAS_POSTGRES:
        try:
            pg_conn = psycopg2.connect(
                host=PG_HOST, port=PG_PORT, dbname=PG_DB, user=PG_USER, password=PG_PASS, connect_timeout=3
            )
            pg_conn.autocommit = True
            print(f"[DB OK] Connected to TimescaleDB / PostgreSQL database '{PG_DB}' on {PG_HOST}:{PG_PORT}", flush=True)
            return
        except Exception as e:
            print(f"[DB WARN] PostgreSQL unavailable ({e}). Using SQLite database '{SQLITE_DB}'", flush=True)

    conn = sqlite3.connect(SQLITE_DB)
    cursor = conn.cursor()
    
    # Ensure assets table exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assets (
            asset_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            model TEXT NOT NULL,
            equipment_type TEXT NOT NULL,
            fuel_capacity REAL NOT NULL,
            max_payload_tons REAL NOT NULL
        )
    """)

    cursor.execute("""
        INSERT OR IGNORE INTO assets VALUES 
            ('CAT-EXC-349', 'CAT 349 Hydraulic Excavator', '349 UHD', 'Hydraulic Excavator', 350.0, 15.0),
            ('CAT-DOZ-D11', 'CAT D11 Mining Dozer', 'D11 Heavy Tractor', 'Track-Type Tractor', 500.0, 25.0),
            ('CAT-TRK-797F', 'CAT 797F Mining Truck', '797F Off-Highway', 'Off-Highway Truck', 700.0, 400.0)
    """)

    # Ensure exact requested telemetry schema
    cursor.execute("PRAGMA table_info(telemetry)")
    existing_cols = [row[1] for row in cursor.fetchall()]

    if existing_cols and "fuel_remaining_liters" not in existing_cols:
        cursor.execute("DROP TABLE telemetry")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS telemetry (
            telemetry_id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            altitude REAL,
            heading REAL,
            speed_kmph REAL,
            engine_status TEXT,
            ignition_status TEXT,
            engine_rpm INTEGER,
            engine_hours REAL,
            idle_hours REAL,
            fuel_level_percent REAL,
            fuel_remaining_liters REAL,
            fuel_consumption_lph REAL,
            engine_temperature REAL,
            coolant_temperature REAL,
            hydraulic_oil_temperature REAL,
            hydraulic_pressure REAL,
            payload_tons REAL,
            bucket_position_percent REAL,
            boom_height REAL,
            battery_voltage REAL,
            operating_mode TEXT
        )
    """)
    conn.commit()
    conn.close()
    print(f"[DB OK] Local SQLite persistent store initialized with exact telemetry schema: '{SQLITE_DB}'", flush=True)

def save_telemetry_to_db(data):
    ts = data.get("timestamp", datetime.now(timezone.utc).isoformat())
    asset_id = data.get("asset_id")
    if not asset_id:
        return

    lat = float(data.get("latitude", 40.7128))
    lon = float(data.get("longitude", -74.0060))
    alt = float(data.get("altitude", 320.0))
    heading = float(data.get("heading", 180.0))
    speed_kmph = float(data.get("speed_kmph", 0.0))

    engine_status = str(data.get("engine_status", "OFF"))
    ignition_status = str(data.get("ignition_status", "OFF" if engine_status == "OFF" else "ON"))
    engine_rpm = int(data.get("engine_rpm", 0 if engine_status == "OFF" else 700))
    engine_hours = float(data.get("engine_hours", 1245.8))
    idle_hours = float(data.get("idle_hours", 120.5))

    fuel_level_percent = float(data.get("fuel_level_percent", 80.0))
    fuel_remaining_liters = float(data.get("fuel_remaining_liters", 280.0))
    fuel_consumption_lph = float(data.get("fuel_consumption_lph", 0.0 if engine_status == "OFF" else 3.6))

    engine_temp = float(data.get("engine_temperature", 35.0))
    coolant_temp = float(data.get("coolant_temperature", round(engine_temp * 0.94, 1)))
    hyd_oil_temp = float(data.get("hydraulic_oil_temperature", 45.0))
    hydraulic_pressure = float(data.get("hydraulic_pressure", 25.0 if engine_status == "OFF" else 95.0))

    payload_tons = float(data.get("payload_tons", 0.0))
    bucket_pos = float(data.get("bucket_position_percent", 0.0))
    boom_height = float(data.get("boom_height", 0.0))

    battery_voltage = float(data.get("battery_voltage", 24.0))
    operating_mode = str(data.get("operating_mode", "Idle" if engine_status == "ON" else "Parked"))

    params = (
        asset_id, ts, lat, lon, alt, heading, speed_kmph,
        engine_status, ignition_status, engine_rpm, engine_hours, idle_hours,
        fuel_level_percent, fuel_remaining_liters, fuel_consumption_lph,
        engine_temp, coolant_temp, hyd_oil_temp, hydraulic_pressure,
        payload_tons, bucket_pos, boom_height, battery_voltage, operating_mode
    )

    if pg_conn:
        try:
            cursor = pg_conn.cursor()
            query = """
                INSERT INTO telemetry (
                    asset_id, timestamp, latitude, longitude, altitude, heading, speed_kmph,
                    engine_status, ignition_status, engine_rpm, engine_hours, idle_hours,
                    fuel_level_percent, fuel_remaining_liters, fuel_consumption_lph,
                    engine_temperature, coolant_temperature, hydraulic_oil_temperature, hydraulic_pressure,
                    payload_tons, bucket_position_percent, boom_height, battery_voltage, operating_mode
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, params)
            print(f"[TIMESCALE LOGGED] asset_id: {asset_id} | Mode: {operating_mode:<10} | Fuel: {fuel_remaining_liters}L ({fuel_level_percent}%)", flush=True)
            return
        except Exception as e:
            print(f"[PG ERROR] {e}. Falling back to SQLite.", flush=True)

    try:
        conn = sqlite3.connect(SQLITE_DB)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO telemetry (
                asset_id, timestamp, latitude, longitude, altitude, heading, speed_kmph,
                engine_status, ignition_status, engine_rpm, engine_hours, idle_hours,
                fuel_level_percent, fuel_remaining_liters, fuel_consumption_lph,
                engine_temperature, coolant_temperature, hydraulic_oil_temperature, hydraulic_pressure,
                payload_tons, bucket_position_percent, boom_height, battery_voltage, operating_mode
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, params)
        conn.commit()
        conn.close()
        print(f"[SQLITE LOGGED] asset_id: {asset_id} | Mode: {operating_mode:<10} | Fuel: {fuel_remaining_liters}L ({fuel_level_percent}%)", flush=True)
    except Exception as e:
        print(f"[DB SAVE ERROR] {e}", flush=True)

class HTTPTelemetryHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        try:
            telemetry_data = json.loads(post_data.decode('utf-8'))
            save_telemetry_to_db(telemetry_data)
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'SUCCESS'}).encode('utf-8'))
        except Exception as e:
            self.send_response(400)
            self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        try:
            conn = sqlite3.connect(SQLITE_DB)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM telemetry ORDER BY timestamp DESC LIMIT 1")
            row = cursor.fetchone()
            if row:
                self.wfile.write(json.dumps(dict(row)).encode('utf-8'))
            else:
                self.wfile.write(json.dumps({}).encode('utf-8'))
            conn.close()
        except Exception as e:
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

    def log_message(self, format, *args):
        pass

def start_http_server():
    server = HTTPServer(('0.0.0.0', HTTP_PORT), HTTPTelemetryHandler)
    print(f"[HTTP OK] Immediate DB Ingestion API listening on http://localhost:{HTTP_PORT}", flush=True)
    server.serve_forever()

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(f"[OK] Subscriber connected to MQTT Broker ({BROKER}:{PORT})", flush=True)
        print(f"[SUB] Listening for telemetry on '{TOPIC_TELEMETRY}' & events on '{TOPIC_EVENTS}'...\n", flush=True)
        client.subscribe([(TOPIC_TELEMETRY, 0), (TOPIC_EVENTS, 0)])
    else:
        print(f"[ERROR] Failed to connect to MQTT broker, return code {rc}", flush=True)

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode("utf-8"))
        if "/telemetry" in msg.topic:
            save_telemetry_to_db(data)
        elif "/events" in msg.topic:
            event_type = data.get("event_type", "EVENT")
            asset_id = data.get("asset_id", "UNKNOWN")
            print(f"📌 [MQTT EVENT] Topic: {msg.topic} | Event: {event_type} | Asset: {asset_id}", flush=True)
            if "fuel_remaining_liters" in data:
                save_telemetry_to_db(data)
    except Exception as e:
        print(f"[ERR] Failed to process message on {msg.topic}: {e}", flush=True)

if __name__ == "__main__":
    init_db()

    http_thread = threading.Thread(target=start_http_server, daemon=True)
    http_thread.start()

    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, CLIENT_ID)
    except AttributeError:
        client = mqtt.Client(CLIENT_ID)

    client.on_connect = on_connect
    client.on_message = on_message

    print(f"Connecting to MQTT Broker at {BROKER}:{PORT}...", flush=True)
    client.connect(BROKER, PORT, 60)

    try:
        client.loop_forever()
    except KeyboardInterrupt:
        print("\nStopping TimescaleDB Ingestion Service...", flush=True)
        client.disconnect()
