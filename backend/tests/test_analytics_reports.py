from datetime import datetime, timedelta

from app.api.v1.analytics import build_utilization_series, build_downtime_series


def test_build_utilization_series_uses_asset_daily_runtime_capacity():
    assets = [
        {"asset_id": "a1", "total_runtime": 16.0},
        {"asset_id": "a2", "total_runtime": 8.0},
    ]
    assignments = [
        {
            "asset_id": "a1",
            "start_time": datetime(2026, 7, 25, 8, 0),
            "end_time": datetime(2026, 7, 25, 16, 0),
        },
        {
            "asset_id": "a2",
            "start_time": datetime(2026, 7, 25, 12, 0),
            "end_time": datetime(2026, 7, 25, 18, 0),
        },
    ]

    series = build_utilization_series(assets, assignments, days=1)

    assert len(series) == 1
    assert series[0]["working_hours"] == 16.0
    assert series[0]["capacity_hours"] == 24.0
    assert series[0]["utilization_pct"] == 66.7


def test_build_downtime_series_uses_maintenance_and_interruptions():
    maintenance_logs = [
        {"date": datetime(2026, 7, 25), "status": "done"},
        {"date": datetime(2026, 7, 26), "status": "upcoming"},
    ]
    interruptions = [
        {"interrupted_at": datetime(2026, 7, 25, 10, 0), "status": "pending"},
        {"interrupted_at": datetime(2026, 7, 26, 12, 0), "status": "cancelled"},
    ]

    series = build_downtime_series(maintenance_logs, interruptions, days=2)

    assert len(series) == 2
    assert series[0]["scheduled"] == 1
    assert series[0]["unplanned"] == 1
