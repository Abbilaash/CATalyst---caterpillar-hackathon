import subprocess
import sys
import time
import os

print("==========================================================")
print("🚀 CATalyst Equipment Monitoring System - Live Flow Demo")
print("==========================================================")
print("Starting Broker, Subscriber, and Publisher processes...\n")

# Current directory
cwd = os.path.dirname(os.path.abspath(__file__))

# 1. Start Broker
broker_proc = subprocess.Popen([sys.executable, "broker.py"], cwd=cwd)
time.sleep(2)

# 2. Start Timescale Ingestor Subscriber
sub_proc = subprocess.Popen([sys.executable, "subscriber_timescale.py"], cwd=cwd)
time.sleep(2)

# 3. Start Telematics Publisher
pub_proc = subprocess.Popen([sys.executable, "publisher.py"], cwd=cwd)
time.sleep(2)

print("\n✅ All processes started successfully!")
print("==========================================================")
print("Launching Live Terminal Streaming Monitor...\n")
time.sleep(1)

# 4. Run Live Monitor in foreground
try:
    monitor_proc = subprocess.run([sys.executable, "live_monitor.py"], cwd=cwd)
except KeyboardInterrupt:
    pass
finally:
    print("\n🛑 Stopping all CATalyst processes cleanly...")
    pub_proc.terminate()
    sub_proc.terminate()
    broker_proc.terminate()
    print("👋 Flow Demo Terminated Cleanly.")
