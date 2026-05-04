#!/usr/bin/env python3
"""
Garmin Connect data sync script.

Uses GarminDB to download data from Garmin Connect and export it as JSON
for the Fitness AI dashboard to consume.

Usage:
  python3 scripts/garmin_sync.py                  # Sync latest data
  python3 scripts/garmin_sync.py --setup           # Interactive setup
  python3 scripts/garmin_sync.py --status          # Check connection status

Requires: pip install garmindb
"""

import json
import os
import sys
import datetime
import argparse
from pathlib import Path

# Data directory (same as the rest of the app)
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data"
GARMIN_CONFIG_DIR = PROJECT_ROOT / "data" / ".garmin"

def ensure_dirs():
    DATA_DIR.mkdir(exist_ok=True)
    GARMIN_CONFIG_DIR.mkdir(exist_ok=True)

def get_config_path():
    return GARMIN_CONFIG_DIR / "GarminConnectConfig.json"

def get_session_path():
    return GARMIN_CONFIG_DIR / "garth_session"

def create_default_config(email: str, password: str):
    """Create GarminDB config file with user credentials."""
    config = {
        "db": {"type": "sqlite"},
        "garmin": {"domain": "garmin.com"},
        "credentials": {
            "user": email,
            "secure_password": False,
            "password": password,
            "password_file": None
        },
        "data": {
            "weight_start_date": "01/01/2024",
            "sleep_start_date": "01/01/2024",
            "rhr_start_date": "01/01/2024",
            "hrv_start_date": "01/01/2024",
            "monitoring_start_date": "01/01/2024",
            "download_latest_activities": 50,
            "download_all_activities": 1000
        },
        "directories": {
            "relative_to_home": False,
            "base_dir": str(GARMIN_CONFIG_DIR / "HealthData"),
            "mount_dir": "/Volumes/GARMIN"
        },
        "enabled_stats": {
            "monitoring": True,
            "steps": True,
            "itime": True,
            "sleep": True,
            "rhr": True,
            "hrv": True,
            "weight": True,
            "activities": True
        },
        "settings": {"metric": True},
        "course_views": {"steps": []},
        "activities": {"display": []},
        "checkup": {"look_back_days": 90}
    }

    ensure_dirs()
    config_path = get_config_path()
    with open(config_path, "w") as f:
        json.dump(config, f, indent=4)
    print(f"Config saved to {config_path}")
    return config_path


def setup():
    """Interactive setup for Garmin Connect credentials."""
    print("\n=== Garmin Connect Setup ===\n")
    print("Enter your Garmin Connect login details.")
    print("These are stored locally in data/.garmin/ and never sent anywhere else.\n")

    email = input("Garmin Connect email: ").strip()
    password = input("Garmin Connect password: ").strip()

    if not email or not password:
        print("Error: Email and password are required.")
        sys.exit(1)

    create_default_config(email, password)

    # Try to authenticate
    print("\nTesting connection...")
    try:
        from garth import Client as GarthClient
        garth = GarthClient()
        garth.configure(domain="garmin.com")
        garth.login(email, password)

        # Save session for reuse
        session_path = get_session_path()
        with open(session_path, "w") as f:
            f.write(garth.dumps())
        print("Connected to Garmin Connect successfully!")
        print(f"Session saved to {session_path}")

        # Save status
        status = {
            "connected": True,
            "email": email,
            "last_auth": datetime.datetime.now().isoformat(),
        }
        with open(DATA_DIR / "garmin-status.json", "w") as f:
            json.dump(status, f, indent=2)

        print("\nSetup complete! Run 'python3 scripts/garmin_sync.py' to sync data.\n")

    except Exception as e:
        print(f"\nConnection failed: {e}")
        print("Check your email and password, then try again.\n")
        status = {"connected": False, "error": str(e)}
        with open(DATA_DIR / "garmin-status.json", "w") as f:
            json.dump(status, f, indent=2)
        sys.exit(1)


def check_status():
    """Check if Garmin Connect is configured and connected."""
    status_file = DATA_DIR / "garmin-status.json"
    if not status_file.exists():
        print("Not configured. Run: python3 scripts/garmin_sync.py --setup")
        return False

    with open(status_file) as f:
        status = json.load(f)

    if status.get("connected"):
        print(f"Connected as {status.get('email', 'unknown')}")
        print(f"Last auth: {status.get('last_auth', 'unknown')}")
        if status.get("last_sync"):
            print(f"Last sync: {status['last_sync']}")
        return True
    else:
        print(f"Not connected: {status.get('error', 'unknown error')}")
        return False


def get_garth_client():
    """Get an authenticated Garth client."""
    from garth import Client as GarthClient

    session_path = get_session_path()
    garth = GarthClient()
    garth.configure(domain="garmin.com")

    if session_path.exists():
        with open(session_path, "r") as f:
            garth.loads(f.read())
        return garth

    # Fall back to login from config
    config_path = get_config_path()
    if not config_path.exists():
        raise Exception("Not configured. Run: python3 scripts/garmin_sync.py --setup")

    with open(config_path) as f:
        config = json.load(f)

    email = config["credentials"]["user"]
    password = config["credentials"]["password"]
    garth.login(email, password)

    # Save session
    with open(session_path, "w") as f:
        f.write(garth.dumps())

    return garth


def fetch_sleep_data(garth, days=30):
    """Fetch sleep data from Garmin Connect API."""
    sleeps = []
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=days)

    current = end_date
    while current >= start_date:
        try:
            date_str = current.strftime("%Y-%m-%d")
            data = garth.connectapi(
                f"/wellness-service/wellness/dailySleepData/{date_str}"
            )
            if data and data.get("dailySleepDTO"):
                sleep_dto = data["dailySleepDTO"]
                sleeps.append({
                    "date": date_str,
                    "start": sleep_dto.get("sleepStartTimestampLocal"),
                    "end": sleep_dto.get("sleepEndTimestampLocal"),
                    "total_sleep_seconds": sleep_dto.get("sleepTimeSeconds", 0),
                    "deep_sleep_seconds": sleep_dto.get("deepSleepSeconds", 0),
                    "light_sleep_seconds": sleep_dto.get("lightSleepSeconds", 0),
                    "rem_sleep_seconds": sleep_dto.get("remSleepSeconds", 0),
                    "awake_seconds": sleep_dto.get("awakeSleepSeconds", 0),
                    "avg_spo2": sleep_dto.get("averageSpO2Value"),
                    "avg_respiration": sleep_dto.get("averageRespirationValue"),
                    "avg_stress": sleep_dto.get("averageStressValue", sleep_dto.get("sleepStress")),
                    "score": sleep_dto.get("sleepScores", {}).get("overall", {}).get("value")
                        if sleep_dto.get("sleepScores") else None,
                    "quality": sleep_dto.get("sleepScores", {}).get("overall", {}).get("qualifierKey")
                        if sleep_dto.get("sleepScores") else None,
                })
        except Exception as e:
            # Skip days with no data
            if "404" not in str(e) and "204" not in str(e):
                print(f"  Sleep {current}: {e}")
        current -= datetime.timedelta(days=1)

    return sleeps


def fetch_stress_data(garth, days=14):
    """Fetch daily stress data."""
    stress_data = []
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=days)

    current = end_date
    while current >= start_date:
        try:
            date_str = current.strftime("%Y-%m-%d")
            data = garth.connectapi(
                f"/usersummary-service/usersummary/daily/{date_str}"
            )
            if data:
                stress_data.append({
                    "date": date_str,
                    "avg_stress": data.get("averageStressLevel"),
                    "max_stress": data.get("maxStressLevel"),
                    "rest_stress_duration": data.get("restStressDuration"),
                    "low_stress_duration": data.get("lowStressDuration"),
                    "medium_stress_duration": data.get("mediumStressDuration"),
                    "high_stress_duration": data.get("highStressDuration"),
                    "body_battery_high": data.get("bodyBatteryHighestValue"),
                    "body_battery_low": data.get("bodyBatteryLowestValue"),
                    "steps": data.get("totalSteps"),
                    "resting_hr": data.get("restingHeartRate"),
                    "min_hr": data.get("minHeartRate"),
                    "max_hr": data.get("maxHeartRate"),
                    "avg_hr": data.get("averageHeartRate"),
                    "floors_ascended": data.get("floorsAscended"),
                    "active_seconds": data.get("activeSeconds"),
                    "calories_total": data.get("totalKilocalories"),
                    "calories_active": data.get("activeKilocalories"),
                })
        except Exception as e:
            if "404" not in str(e):
                print(f"  Stress {current}: {e}")
        current -= datetime.timedelta(days=1)

    return stress_data


def fetch_hrv_data(garth, days=30):
    """Fetch HRV data."""
    hrv_data = []
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=days)

    current = end_date
    while current >= start_date:
        try:
            date_str = current.strftime("%Y-%m-%d")
            data = garth.connectapi(
                f"/hrv-service/hrv/{date_str}"
            )
            if data and data.get("hrvSummary"):
                summary = data["hrvSummary"]
                hrv_data.append({
                    "date": date_str,
                    "weekly_avg": summary.get("weeklyAvg"),
                    "last_night": summary.get("lastNight"),
                    "last_night_avg": summary.get("lastNightAvg"),
                    "last_night_5min_high": summary.get("lastNight5MinHigh"),
                    "baseline_low": summary.get("baselineLowUpper"),
                    "baseline_high": summary.get("baselineBalancedUpper"),
                    "status": summary.get("status"),
                })
        except Exception as e:
            if "404" not in str(e):
                print(f"  HRV {current}: {e}")
        current -= datetime.timedelta(days=1)

    return hrv_data


def fetch_activities(garth, count=50):
    """Fetch recent activities."""
    activities = []
    try:
        data = garth.connectapi(
            f"/activitylist-service/activities/search/activities",
            params={"limit": count, "start": 0}
        )
        if data and isinstance(data, list):
            for a in data:
                activities.append({
                    "id": a.get("activityId"),
                    "name": a.get("activityName", ""),
                    "type": a.get("activityType", {}).get("typeKey", ""),
                    "sport": a.get("activityType", {}).get("typeKey", ""),
                    "start_time": a.get("startTimeLocal", ""),
                    "duration_seconds": a.get("duration"),
                    "distance_meters": a.get("distance"),
                    "avg_hr": a.get("averageHR"),
                    "max_hr": a.get("maxHR"),
                    "calories": a.get("calories"),
                    "avg_speed": a.get("averageSpeed"),
                    "max_speed": a.get("maxSpeed"),
                    "elevation_gain": a.get("elevationGain"),
                    "avg_cadence": a.get("averageRunningCadenceInStepsPerMinute")
                        or a.get("averageBikingCadenceInRevPerMinute"),
                    "training_effect_aerobic": a.get("aerobicTrainingEffect"),
                    "training_effect_anaerobic": a.get("anaerobicTrainingEffect"),
                    "training_load": a.get("activityTrainingLoad"),
                    "vo2_max": a.get("vO2MaxValue"),
                })
    except Exception as e:
        print(f"  Activities error: {e}")

    return activities


def fetch_body_composition(garth, days=30):
    """Fetch weight and body composition data."""
    try:
        end_date = datetime.date.today()
        start_date = end_date - datetime.timedelta(days=days)
        data = garth.connectapi(
            f"/weight-service/weight/dateRange",
            params={
                "startDate": start_date.strftime("%Y-%m-%d"),
                "endDate": end_date.strftime("%Y-%m-%d"),
            }
        )
        if data and isinstance(data, list):
            return [{
                "date": w.get("calendarDate", ""),
                "weight_kg": round(w.get("weight", 0) / 1000, 1) if w.get("weight") else None,
                "bmi": w.get("bmi"),
                "body_fat_pct": w.get("bodyFat"),
                "muscle_mass_kg": round(w.get("muscleMass", 0) / 1000, 1) if w.get("muscleMass") else None,
            } for w in data]
    except Exception as e:
        if "404" not in str(e):
            print(f"  Body composition error: {e}")
    return []


def sync():
    """Main sync function — downloads data and saves as JSON."""
    ensure_dirs()
    print("Syncing Garmin Connect data...")

    try:
        garth = get_garth_client()
    except Exception as e:
        print(f"Auth error: {e}")
        print("Run: python3 scripts/garmin_sync.py --setup")
        sys.exit(1)

    # Fetch all data types
    print("  Fetching sleep data...")
    sleeps = fetch_sleep_data(garth, days=30)
    print(f"    Got {len(sleeps)} nights")

    print("  Fetching daily summaries (stress, body battery, steps)...")
    daily = fetch_stress_data(garth, days=14)
    print(f"    Got {len(daily)} days")

    print("  Fetching HRV data...")
    hrv = fetch_hrv_data(garth, days=30)
    print(f"    Got {len(hrv)} days")

    print("  Fetching activities...")
    activities = fetch_activities(garth, count=50)
    print(f"    Got {len(activities)} activities")

    print("  Fetching body composition...")
    body = fetch_body_composition(garth, days=30)
    print(f"    Got {len(body)} entries")

    # Save everything as JSON
    garmin_data = {
        "synced": datetime.datetime.now().isoformat(),
        "sleep": sorted(sleeps, key=lambda x: x["date"], reverse=True),
        "daily_summary": sorted(daily, key=lambda x: x["date"], reverse=True),
        "hrv": sorted(hrv, key=lambda x: x["date"], reverse=True),
        "activities": activities,
        "body_composition": body,
    }

    output_path = DATA_DIR / "garmin-data.json"
    with open(output_path, "w") as f:
        json.dump(garmin_data, f, indent=2)
    print(f"\nData saved to {output_path}")

    # Update status
    status_file = DATA_DIR / "garmin-status.json"
    if status_file.exists():
        with open(status_file) as f:
            status = json.load(f)
    else:
        status = {"connected": True}

    status["last_sync"] = datetime.datetime.now().isoformat()
    status["record_counts"] = {
        "sleep": len(sleeps),
        "daily_summary": len(daily),
        "hrv": len(hrv),
        "activities": len(activities),
        "body_composition": len(body),
    }
    with open(status_file, "w") as f:
        json.dump(status, f, indent=2)

    # Save session for reuse
    session_path = get_session_path()
    with open(session_path, "w") as f:
        f.write(garth.dumps())

    print("Sync complete!\n")


def main():
    parser = argparse.ArgumentParser(description="Garmin Connect data sync")
    parser.add_argument("--setup", action="store_true", help="Interactive setup")
    parser.add_argument("--status", action="store_true", help="Check connection status")
    args = parser.parse_args()

    if args.setup:
        setup()
    elif args.status:
        check_status()
    else:
        sync()


if __name__ == "__main__":
    main()
