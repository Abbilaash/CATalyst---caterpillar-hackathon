import sqlite3
import json
import os

SQLITE_DB = "telematics_timescale_fallback.db"

def inspect_database():
    if not os.path.exists(SQLITE_DB):
        print(f"Database file '{SQLITE_DB}' not found.")
        return

    conn = sqlite3.connect(SQLITE_DB)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print("=========================================================================")
    print("   CATERPILLAR EQUIPMENT TELEMETRY DATABASE - STORE INSPECTOR")
    print("=========================================================================")

    cursor.execute("SELECT COUNT(*) FROM telemetry")
    total_records = cursor.fetchone()[0]

    cursor.execute("PRAGMA table_info(telemetry)")
    columns = [row[1] for row in cursor.fetchall()]

    print(f"TOTAL STORED TELEMETRY RECORDS: {total_records} | TOTAL COLUMNS: {len(columns)}")
    print("=========================================================================\n")

    if total_records == 0:
        print("No telemetry records logged yet.")
        conn.close()
        return

    cursor.execute("SELECT * FROM telemetry ORDER BY timestamp DESC LIMIT 1")
    latest = cursor.fetchone()

    print("LATEST TELEMETRY RECORD (NEW SCHEMA):")
    print("---------------------------------------------------------------------------")
    latest_dict = dict(latest)
    for k, v in latest_dict.items():
        print(f"  * {k:<32} : {v}")
    print("---------------------------------------------------------------------------\n")

    print("RAW JSON PAYLOAD:")
    print("---------------------------------------------------------------------------")
    print(json.dumps(latest_dict, indent=2))
    print("---------------------------------------------------------------------------\n")

    print("FLEET SUMMARY BREAKDOWN:")
    print("--------------------------------------------------------------------------------")
    print(f"{'ASSET ID':<15} | {'RECORDS':<8} | {'FUEL (L)':<10} | {'FUEL %':<8} | {'MODE':<12}")
    print("--------------------------------------------------------------------------------")

    cursor.execute("""
        SELECT asset_id, COUNT(*) as cnt, fuel_remaining_liters, fuel_level_percent, operating_mode
        FROM telemetry
        GROUP BY asset_id
        ORDER BY timestamp DESC
    """)
    for row in cursor.fetchall():
        print(f"{row['asset_id']:<15} | {row['cnt']:<8} | {row['fuel_remaining_liters']:<10} | {row['fuel_level_percent']:<8} | {row['operating_mode']:<12}")
    print("--------------------------------------------------------------------------------")

    conn.close()

if __name__ == "__main__":
    inspect_database()
