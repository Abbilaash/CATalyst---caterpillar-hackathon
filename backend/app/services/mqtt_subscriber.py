import json
import asyncio
from gmqtt import Client as MQTTClient
from gmqtt.mqtt.constants import MQTTv311
from datetime import datetime, timezone
import random

from app.db.postgres import AsyncSessionLocal
from app.models.postgres.telemetry import Telemetry
from app.api.v1.websockets import manager

BROKER_HOST = "test.mosquitto.org"
BROKER_PORT = 1883
TOPIC = "catalyst/surya/+/telemetry"

def on_connect(client, flags, rc, properties):
    print(f"[MQTT] Connected to {BROKER_HOST}:{BROKER_PORT}")
    client.subscribe(TOPIC)
    print(f"[MQTT] Subscribed to {TOPIC}")

def on_message(client, topic, payload, qos, properties):
    # This is a synchronous callback, but we need to run async code.
    # gmqtt usually allows async callbacks if they are coroutines, let's make it a coroutine!
    pass

async def on_message_async(client, topic, payload, qos, properties):
    try:
        data = json.loads(payload.decode())
        asset_id = data.get("asset_id")
        
        if not asset_id:
            return

        # 1. Broadcast to WebSockets
        await manager.broadcast_to_asset(asset_id, data)

        # 2. Save to Database
        async with AsyncSessionLocal() as db:
            telemetry_record = Telemetry(
                asset_id=asset_id,
                timestamp=datetime.fromisoformat(data["timestamp"]) if "timestamp" in data else datetime.now(timezone.utc),
                latitude=data.get("latitude"),
                longitude=data.get("longitude"),
                altitude=data.get("altitude"),
                heading=data.get("heading"),
                speed_kmph=data.get("speed_kmph"),
                engine_status=True if data.get("engine_status") == "ON" else False,
                engine_rpm=data.get("engine_rpm"),
                engine_hours=data.get("engine_hours"),
                idle_hours=data.get("idle_hours"),
                fuel_level_percent=data.get("fuel_level_percent"),
                fuel_remaining_liters=data.get("fuel_remaining_liters"),
                fuel_consumption_lph=data.get("fuel_consumption_lph"),
                engine_temperature=data.get("engine_temperature"),
                coolant_temperature=data.get("coolant_temperature"),
                hydraulic_oil_temperature=data.get("hydraulic_oil_temperature"),
                hydraulic_pressure=data.get("hydraulic_pressure"),
                payload_tons=data.get("payload_tons"),
                bucket_position_percent=data.get("bucket_position_percent"),
                boom_height=data.get("boom_height"),
                battery_voltage=data.get("battery_voltage"),
                operating_mode=data.get("operating_mode"),
                ignition_status=True if data.get("ignition_status") == "ON" else False,
            )
            db.add(telemetry_record)
            await db.commit()

    except Exception as e:
        print(f"[MQTT Error] failed to process message: {e}")

def on_disconnect(client, packet, exc=None):
    print("[MQTT] Disconnected")

async def start_mqtt_client():
    client_id = f"fastapi-backend-{random.randint(1000, 9999)}"
    client = MQTTClient(client_id)

    client.on_connect = on_connect
    client.on_message = on_message_async
    client.on_disconnect = on_disconnect

    try:
        await client.connect(BROKER_HOST, BROKER_PORT, keepalive=60, version=MQTTv311)
    except Exception as e:
        print(f"[MQTT] Failed to connect to local broker: {e}. Is it running?")
