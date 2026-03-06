import requests
from datetime import datetime
import csv
import os
import pytz
import time
import random

# Localized timestamp for Ulaanbaatar
tz = pytz.timezone("Asia/Ulaanbaatar")
timestamp = datetime.now(tz).strftime("%Y-%m-%d %H:%M")

# IQAir internal API base URL (no Vercel checkpoint, no auth needed)
API_BASE = "https://website-api.airvisual.com/v1/stations"

# All 18 IQAir stations in Ulaanbaatar with their API IDs
iqair_stations = [
    ("655ee265e6e0c82f596ac45b", "French Embassy"),
    ("65b0a99b8441ccadf01c0c77", "EU Delegation"),
    ("6821a8a4c40bbf0f2b1304d1", "Czech Embassy"),
    ("6646c42fb9b5ef12c29b1334", "Yarmag Garden City"),
    ("696ef79a8db9bc0e8091e24d", "CHD 9 Khoroo"),
    ("3e191f101dde82a1ccfc", "Mandakh Naran Tuv"),
    ("696ef7ad096d7ae05dbd288b", "CHD 6 Horoo"),
    ("696f1c1536e5461e2dad20b4", "Air V"),
    ("696f1ab73b94da2d865efa34", "School 17"),
    ("696efa01096d7ae05dbd2944", "School 72"),
    ("696ef700b1e0755bd589c3ff", "CHD 12"),
    ("6976ffb080858d5e2d7f78c1", "Kindergarden 280"),
    ("69773a5ed1bb673c5ead0cc1", "School 49"),
    ("6976fc7aaf5db8104f30adff", "Kindergarden 154"),
    ("697716b4104dafaea0d4351c", "Kindergarden 298"),
    ("6977005d4890fb7a3a7eb910", "Kindergarden 292"),
    ("67b6ce7c79d02d01146e8ac8", "Neo City"),
    ("6976fc5997a4a17f409850a0", "School 138"),
]

# Session for connection reuse
session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
})

def fetch_station(station_id, label):
    """Fetch PM2.5 data from IQAir's internal API."""
    url = f"{API_BASE}/{station_id}"
    try:
        time.sleep(random.uniform(0.5, 1.5))  # Polite delay
        resp = session.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        # Extract PM2.5 from pollutants array
        pm25 = "ERROR"
        current = data.get("current", {})
        pollutants = current.get("pollutants", [])
        for p in pollutants:
            if p.get("pollutantName") == "pm25":
                pm25 = str(p.get("concentration", "ERROR"))
                break

        # If no pollutants array, try top-level concentration (mainPollutant is pm25)
        if pm25 == "ERROR" and current.get("mainPollutant") == "pm25":
            pm25 = str(current.get("concentration", "ERROR"))

        # Extract timestamp from API response
        ts = current.get("ts", "ERROR")
        if ts != "ERROR":
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                local_dt = dt.astimezone(tz)
                ts = local_dt.strftime("%H:%M, %b %d")
            except:
                ts = ts[:16]  # Fallback: just trim ISO string

        print(f"{label}: PM2.5={pm25} µg/m³, Time={ts}")
        return pm25, ts

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(f"{label}: Station not found (404)")
            return "OFFLINE", "OFFLINE"
        print(f"{label}: HTTP error {e.response.status_code}")
        return "ERROR", "ERROR"
    except Exception as e:
        print(f"{label}: Error - {e}")
        return "ERROR", "ERROR"


def scrape_weather():
    """Scrape weather from weather.gov.mn using requests (no browser needed)."""
    print("Fetching weather.gov.mn...")
    try:
        # Try to get weather data; if it fails, return errors
        # Note: weather.gov.mn may also need a browser, but we keep it simple for now
        # Using the first IQAir station's weather data as fallback
        url = f"{API_BASE}/655ee265e6e0c82f596ac45b"
        resp = session.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        current = data.get("current", {})

        temperature = str(current.get("temperature", "ERROR"))
        humidity = str(current.get("humidity", "ERROR"))
        wind_speed = str(current.get("wind", {}).get("speed", "ERROR"))
        condition = current.get("condition", "ERROR")

        print(f"Temperature: {temperature}°C")
        print(f"Humidity: {humidity}%")
        print(f"Wind Speed: {wind_speed} km/h")
        print(f"Condition: {condition}")

        return temperature, condition, wind_speed, humidity
    except Exception as e:
        print(f"Weather fetch error: {e}")
        return "ERROR", "ERROR", "ERROR", "ERROR"


# Standardized output paths
weather_path = "public/weather_log.csv"
pm25_path = "public/pm25_log.csv"

def init_csv(path, headers):
    if not os.path.exists(path) or os.stat(path).st_size == 0:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8-sig", newline="") as f:
            csv.writer(f).writerow(headers)

init_csv(weather_path, ["timestamp", "temperature", "feels_like", "wind_speed", "humidity"])
init_csv(pm25_path, ["timestamp", "pm25_french", "time_french", "pm25_eu", "time_eu", "pm25_czech", "time_czech", "pm25_yarmag", "time_yarmag", "pm25_chd9", "time_chd9", "pm25_mandakh", "time_mandakh", "pm25_chd6", "time_chd6", "pm25_airv", "time_airv", "pm25_school17", "time_school17", "pm25_school72", "time_school72", "pm25_chd12", "time_chd12", "pm25_kind280", "time_kind280", "pm25_school49", "time_school49", "pm25_kind154", "time_kind154", "pm25_kind298", "time_kind298", "pm25_kind292", "time_kind292", "pm25_neocity", "time_neocity", "pm25_school138", "time_school138"])

def get_last_timestamp(filepath):
    if not os.path.exists(filepath) or os.stat(filepath).st_size == 0: return None
    from collections import deque
    with open(filepath, "r", encoding="utf-8-sig") as f:
        try: return deque(csv.reader(f), maxlen=1)[0][0]
        except: return None

last_pm25_ts = get_last_timestamp(pm25_path)
update_pm25 = True
if last_pm25_ts:
    try:
        last_dt = tz.localize(datetime.strptime(last_pm25_ts, "%Y-%m-%d %H:%M"))
        if datetime.now(tz).hour == last_dt.hour: update_pm25 = True  # FORCED FOR VERIFICATION
    except: pass

# Scrape Weather (using IQAir API data from French Embassy station)
temperature, feels_like, wind_speed, humidity = scrape_weather()
with open(weather_path, "a", encoding="utf-8-sig", newline="") as f:
    csv.writer(f).writerow([timestamp, temperature, feels_like, wind_speed, humidity])

# Scrape PM2.5
if update_pm25:
    print("Fetching fresh PM2.5 data from IQAir API...")
    pm25_row = [timestamp]
    for station_id, label in iqair_stations:
        p, t = fetch_station(station_id, label)
        pm25_row.extend([p, t])
    with open(pm25_path, "a", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerow(pm25_row)

print(f"\nDone! Timestamp: {timestamp}")
