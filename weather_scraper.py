import requests
from datetime import datetime
import csv
import os
import time
import random

try:
    import pytz
    tz = pytz.timezone("Asia/Ulaanbaatar")
except ImportError:
    from zoneinfo import ZoneInfo
    tz = ZoneInfo("Asia/Ulaanbaatar")

timestamp = datetime.now(tz).strftime("%Y-%m-%d %H:%M")

# IQAir search API endpoint
SEARCH_API = "https://website-api.airvisual.com/v1/search"

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

# Station cache for search index
station_cache = {}

def aqi_to_pm25(aqi):
    """Convert US EPA AQI to PM2.5 concentration in µg/m³."""
    try:
        val = float(aqi)
        if val <= 50:
            return str(round((val / 50.0) * 12.0, 1))
        elif val <= 100:
            return str(round(12.1 + ((val - 51) / 49.0) * 23.3, 1))
        elif val <= 150:
            return str(round(35.5 + ((val - 101) / 49.0) * 19.9, 1))
        elif val <= 200:
            return str(round(55.5 + ((val - 151) / 49.0) * 94.9, 1))
        elif val <= 300:
            return str(round(150.5 + ((val - 201) / 99.0) * 99.9, 1))
        else:
            return str(round(250.5 + ((val - 301) / 199.0) * 249.5, 1))
    except (ValueError, TypeError):
        return "ERROR"

def load_station_index():
    """Load real-time Ulaanbaatar station index using search API keywords."""
    global station_cache
    search_keywords = [
        'Ulaanbaatar', 'Mongolia', 'khoroo', 'school', 'kindergarten', 
        'embassy', 'CHD', 'Yarmag', 'Peace', 'District', 'horoo', 'tuv', 
        'city', 'delegation', '292', '138', '154', '298', '280', '72', 
        '17', '49', '57', '6', '9', '12', 'EU', 'Czech', 'Neo', 'Air', 'Baruun'
    ] + [label for _, label in iqair_stations]

    for term in search_keywords:
        try:
            url = f"{SEARCH_API}?q={requests.utils.quote(term)}"
            resp = session.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                for s in data.get('stations', []):
                    if s.get('city') == 'Ulaanbaatar' or 'ulaanbaatar' in s.get('url', ''):
                        sid = s.get('id')
                        if sid:
                            station_cache[sid] = s
        except Exception:
            pass

def fetch_station(station_id, label):
    """Fetch PM2.5 data from indexed IQAir station search data."""
    if not station_cache:
        load_station_index()

    station = station_cache.get(station_id)
    if not station:
        for s in station_cache.values():
            if label.lower() in s.get("name", "").lower() or label.lower() in s.get("url", "").lower():
                station = s
                break

    current_time = datetime.now(tz).strftime("%H:%M, %b %d")

    if station:
        current = station.get("current", {})
        aqi = current.get("aqi")
        if aqi is not None:
            pm25 = aqi_to_pm25(aqi)
            print(f"{label}: PM2.5={pm25} µg/m³ (AQI={aqi}), Time={current_time}")
            return pm25, current_time

    print(f"{label}: Station unlisted or offline")
    return "OFFLINE", "OFFLINE"



def scrape_weather():
    """Scrape weather from weather.gov.mn API."""
    print("Fetching weather.gov.mn API...")
    url = "https://weather.gov.mn/api/get/obs/data"
    headers = {
        "Content-Type": "application/json",
        "Referer": "https://weather.gov.mn/",
        "Origin": "https://weather.gov.mn",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    
    try:
        resp = session.post(url, json={}, headers=headers, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        
        # Locate Ulaanbaatar station (sid: 292, sum_name: "Улаанбаатар")
        ub_data = next((obs for obs in data.get("obs_data", []) if obs.get("sid") == 292 or obs.get("sum_name") == "Улаанбаатар"), None)
        
        if not ub_data:
            raise Exception("Ulaanbaatar data not found in API response")

        temperature = str(ub_data.get("ttt", "ERROR"))
        feels_like = str(ub_data.get("ttt_feels", "ERROR"))
        wind_speed = str(ub_data.get("wind_speed", "ERROR"))
        humidity = str(ub_data.get("ff", "ERROR"))

        print(f"Temperature: {temperature}°C")
        print(f"Feels Like: {feels_like}°C")
        print(f"Wind Speed: {wind_speed} m/s")
        print(f"Humidity: {humidity}%")

        return temperature, feels_like, wind_speed, humidity

    except Exception as e:
        print(f"Weather fetch error: {e}. Falling back to IQAir index data...")
        try:
            if not station_cache:
                load_station_index()
            french = station_cache.get("655ee265e6e0c82f596ac45b", {})
            current = french.get("current", {})
            temperature = str(current.get("temperature", "ERROR"))
            humidity = str(current.get("humidity", "ERROR"))
            wind_speed = str(current.get("wind", {}).get("speed", "ERROR"))
            feels_like = "ERROR"
            return temperature, feels_like, wind_speed, humidity
        except Exception:
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
