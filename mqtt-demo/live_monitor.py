import sqlite3
import time
import os

SQLITE_DB = "telematics_timescale_fallback.db"

def run_monitor():
    print("=========================================================================")
    print("   CATalyst REAL-TIME TIMESCALEDB STREAMING MONITOR (2s Auto-Refresh)")
    print("=========================================================================")

    last_count = 0
    try:
        while True:
            if not os.path.exists(SQLITE_DB):
                time.sleep(2)
                continue

            conn = sqlite3.connect(SQLITE_DB)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            try:
                cursor.execute("SELECT COUNT(*) FROM telemetry")
                total_records = cursor.fetchone()[0]

                if total_records != last_count:
                    os.system('cls' if os.name == 'nt' else 'clear')
                    print("=========================================================================")
                    print("   CATalyst REAL-TIME TIMESCALEDB STREAMING MONITOR (2s Auto-Refresh)")
                    print("=========================================================================")
                    print(f"STATUS: ACTIVE LIVE INGESTION | TOTAL RECORDS IN DB: {total_records}")
                    print("=========================================================================\n")

                    print("REAL-TIME INCOMING TELEMETRY STREAM:")
                    print("--------------------------------------------------------------------------------------------------------------")
                    print(f"{'TIMESTAMP':<25} | {'ASSET ID':<12} | {'MODE':<10} | {'RPM':<5} | {'SPEED':<6} | {'FUEL(L)':<8} | {'FUEL%':<6} | {'TEMP C'}")
                    print("--------------------------------------------------------------------------------------------------------------")

                    cursor.execute("SELECT * FROM telemetry ORDER BY timestamp DESC LIMIT 5")
                    for row in cursor.fetchall():
                        ts = str(row['timestamp'])[:22]
                        asset = str(row['asset_id'])
                        mode = str(row['operating_mode'])
                        rpm = str(row['engine_rpm'])
                        speed = str(row['speed_kmph'])
                        fuel = str(row['fuel_remaining_liters'])
                        fuel_pct = str(row['fuel_level_percent'])
                        temp = str(row['engine_temperature'])
                        print(f"{ts:<25} | {asset:<12} | {mode:<10} | {rpm:<5} | {speed:<6} | {fuel:<8} | {fuel_pct:<6} | {temp}")
                    print("--------------------------------------------------------------------------------------------------------------\n")

                    last_count = total_records

            except sqlite3.OperationalError:
                pass
            finally:
                conn.close()

            time.sleep(2)

    except KeyboardInterrupt:
        print("\nLive Monitor stopped.")

if __name__ == "__main__":
    run_monitor()
