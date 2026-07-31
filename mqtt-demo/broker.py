import asyncio
import sys
from amqtt.broker import Broker

# Configuration for Local TCP MQTT Broker (Port: 1883)
config = {
    "listeners": {
        "default": {
            "type": "tcp",
            "bind": "127.0.0.1:1883",
        }
    },
    "sys_interval": 10,
    "auth": {
        "allow-anonymous": True,
    }
}

async def main():
    broker = Broker(config)
    await broker.start()
    print("==================================================")
    print("CATalyst Local MQTT Broker Started!")
    print("TCP Broker Endpoint: mqtt://localhost:1883")
    print("==================================================")
    print("Keep this script running in the background for your demo.\n")
    
    # Keep broker running
    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    try:
        if sys.platform == "win32":
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nStopping Local MQTT Broker...")
