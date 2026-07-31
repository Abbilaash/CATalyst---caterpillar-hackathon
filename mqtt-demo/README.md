# CATalyst MQTT Telematics Demo

This directory contains a complete MQTT telemetry pipeline simulating live Caterpillar heavy equipment metrics (excavators, dozers, mining trucks) using a **Local Python MQTT Broker** (avoiding network firewall port blocks).

---

## 🚀 How to Run the Demo

### Step 1: Start the Local Broker (Terminal 1)
```bash
python broker.py
```
*Runs the local MQTT broker on `localhost:1883`.*

### Step 2: Start the Subscriber (Terminal 2)
```bash
python subscriber.py
```
*Subscribes to `catalyst/telematics/#` and prints real-time telemetry updates and overheat alerts.*

### Step 3: Start the Telematics Publisher (Terminal 3)
```bash
python publisher.py
```
*Generates and streams live Caterpillar machine sensors (engine RPM, hydraulic temperature, fuel %, GPS coordinates) every 2 seconds.*

---

## 📁 File Structure

* **[broker.py](broker.py)**: Python-native local MQTT broker (`amqtt`).
* **[publisher.py](publisher.py)**: Machine fleet telematics generator.
* **[subscriber.py](subscriber.py)**: Real-time telemetry receiver & alert monitor.
* **[requirements.txt](requirements.txt)**: Python dependencies (`paho-mqtt`, `amqtt`, `setuptools<70.0.0`).
