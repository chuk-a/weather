import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime
import csv
import os
import time
import pytz
import re
import random
import sys

# Localized timestamp for Ulaanbaatar
tz = pytz.timezone("Asia/Ulaanbaatar")
timestamp = datetime.now(tz).strftime("%Y-%m-%d %H:%M")

# Detect if running in CI (GitHub Actions sets CI=true)
IS_CI = os.environ.get("CI", "false").lower() == "true"

# Setup undetected Chrome
options = uc.ChromeOptions()
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--window-size=1920,1080")

if IS_CI:
    # On CI: use xvfb (virtual display) so we DON'T need headless mode
    # This is better for anti-detection since headless Chrome is easily fingerprinted
    options.add_argument("--disable-gpu")
else:
    # Local: run headless for convenience
    options.add_argument("--headless=new")

driver = uc.Chrome(options=options, version_main=None)
driver.set_page_load_timeout(20)
wait = WebDriverWait(driver, 10)

def safe_get(url, retries=2, delay=3):
    for attempt in range(retries):
        try:
            driver.get(url)
            # Give Cloudflare challenge time to resolve
            time.sleep(2)
            return True
        except Exception as e:
            print(f"[{datetime.now().isoformat()}] Attempt {attempt+1} failed for {url}: Timeout or Error")
            if attempt < retries - 1:
                time.sleep(delay)
    return False

def get_text(xpath, label):
    try:
        value = wait.until(EC.presence_of_element_located((By.XPATH, xpath))).text.strip()
        print(f"{label}: {value}")
        return value
    except Exception as e:
        print(f"{label} error:", e)
        return "ERROR"

def scrape_weather():
    print("Scraping weather.gov.mn...")
    if not safe_get("https://weather.gov.mn"):
        return ["ERROR"] * 4

    temperature  = get_text("/html/body/div/div[2]/div/div[2]/div/div[1]/div/div[2]/div[2]", "Temperature")
    feels_like   = get_text("/html/body/div/div[2]/div/div[2]/div/div[1]/div/div[2]/div[3]/div/div[2]/h1", "Feels Like")
    wind_speed   = get_text("/html/body/div[1]/div[2]/div/div[2]/div/div[1]/div/div[3]/div[1]/p[2]", "Wind Speed (m/s)")
    humidity     = get_text("/html/body/div[1]/div[2]/div/div[2]/div/div[1]/div/div[3]/div[3]/p[2]", "Humidity")

    return temperature, feels_like, wind_speed, humidity

# Track if we've already dumped debug info (only dump once)
_debug_dumped = False

def scrape_pm25(url, label):
    global _debug_dumped
    print(f"Scraping {label} PM2.5...")
    if not safe_get(url):
        return "ERROR", "ERROR"
    
    # Check for Cloudflare challenge or "No current data" early
    try:
        page_source = driver.page_source
        
        # Detect various Cloudflare challenge indicators
        cf_indicators = [
            "Just a moment", "cf-browser-verification", "challenge-platform",
            "Checking your browser", "Attention Required", "cf-challenge",
            "Please Wait", "_cf_chl"
        ]
        for indicator in cf_indicators:
            if indicator in page_source:
                print(f"{label}: Cloudflare challenge detected ({indicator}), skipping")
                if not _debug_dumped:
                    print(f"[DEBUG] Page title: {driver.title}")
                    print(f"[DEBUG] Page source snippet (first 500 chars): {page_source[:500]}")
                    _debug_dumped = True
                return "ERROR", "ERROR"
        
        if "No current data" in page_source or "no current data" in page_source.lower():
            print(f"{label}: No current data available")
            return "OFFLINE", "OFFLINE"
    except:
        pass
    
    # Use a short wait (2s) for fallback XPath strategies
    short_wait = WebDriverWait(driver, 2)
    
    # Robust Value Extraction with multiple fallback strategies
    val = "ERROR"
    xpath_val_strategies = [
        '//*[@id="main-content"]//p[contains(text(), "µg/m³")]/preceding-sibling::p',
        "//span[contains(text(), 'µg/m³')]/preceding-sibling::span",
        '//*[@id="main-content"]//div[contains(@class, "aqi-value")]//p[1]',
        "//p[contains(text(), 'µg/m³')]/../p[1]",
        "//div[contains(@class, 'pollutant-concentration-wrapper')]//p[1]",
        "//main//p[contains(text(), 'µg/m³')]/preceding-sibling::*[1]",
    ]
    
    # First strategy gets a longer wait (5s), rest get 2s
    for i, xpath in enumerate(xpath_val_strategies):
        try:
            w = WebDriverWait(driver, 5) if i == 0 else short_wait
            elem = w.until(EC.presence_of_element_located((By.XPATH, xpath)))
            val = elem.text.strip()
            if val and val != "ERROR":
                print(f"{label} PM2.5 (Strategy #{i+1}): {val}")
                break
        except Exception as e:
            if i == len(xpath_val_strategies) - 1:
                print(f"{label} PM2.5: All strategies failed")
                # Dump debug info on first total failure
                if not _debug_dumped:
                    try:
                        print(f"[DEBUG] Page title: {driver.title}")
                        print(f"[DEBUG] Current URL: {driver.current_url}")
                        print(f"[DEBUG] Page source snippet (first 1000 chars):")
                        print(driver.page_source[:1000])
                    except:
                        pass
                    _debug_dumped = True
    
    # Robust Time Extraction with multiple fallback strategies
    time_val = "ERROR"
    xpath_time_strategies = [
        '//*[contains(text(), "Local time")]',
        '//*[contains(text(), "local time")]',
        "//time",
        '//*[contains(@class, "time")]',
    ]
    
    for i, xpath in enumerate(xpath_time_strategies):
        try:
            elem = short_wait.until(EC.presence_of_element_located((By.XPATH, xpath)))
            time_val = elem.text.strip()
            if time_val and time_val != "ERROR" and len(time_val) > 0:
                print(f"{label} Time (Strategy #{i+1}): {time_val}")
                break
        except Exception as e:
            if i == len(xpath_time_strategies) - 1:
                print(f"{label} Time: All strategies failed")
            
    return val, time_val

def clean(val, is_time=False):
    if isinstance(val, str):
        # Remove embedding newlines and extra spaces
        val = val.replace("\r", " ").replace("\n", " ").strip()
        
        if "ERROR" in val:
            return "ERROR"
        
        if "OFFLINE" in val:
            return "OFFLINE"
        
        if is_time:
            # Extract timestamp if it matches HH:mm, MMM DD (IQAir format)
            # Try multiple time formats
            patterns = [
                r"(\d{1,2}:\d{2}),\s*([A-Za-z]{3}\s\d{1,2})",  # "15:00, Jan 26"
                r"Local time:\s*(\d{1,2}:\d{2}),\s*([A-Za-z]{3}\s\d{1,2})",  # "Local time: 15:00, Jan 26"
                r"Updated.*?(\d{1,2}:\d{2}),\s*([A-Za-z]{3}\s\d{1,2})",  # "Updated 15:00, Jan 26"
                r"(\d{1,2}:\d{2}\s*[AP]M),\s*([A-Za-z]{3}\s\d{1,2})",  # "3:00 PM, Jan 26"
            ]
            
            for pattern in patterns:
                ts_match = re.search(pattern, val, re.IGNORECASE)
                if ts_match:
                    return f"{ts_match.group(1)}, {ts_match.group(2)}"
            
            # If no pattern matches but we have a colon (likely a time), return as is
            if ":" in val and len(val) < 50:
                return val
            
            return "ERROR"

        # Check for specific IQAir "No current data" patterns
        if "No current data" in val or "no current data" in val.lower():
             return "OFFLINE"

        # Standard cleaning for numbers/units
        # Extract only the numeric part if it's a value (preserving negative sign)
        num_match = re.search(r"(-?\d+(\.\d+)?)", val)
        if num_match:
            return num_match.group(1)

        return val.strip()
    return val


# Standardized output paths
weather_path = "public/weather_log.csv"
pm25_path = "public/pm25_log.csv"

# Function to initialize CSV if empty
def init_csv(path, headers):
    if not os.path.exists(path) or os.stat(path).st_size == 0:
        with open(path, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(headers)

# Initialize files
init_csv(weather_path, [
    "timestamp", "temperature", "feels_like", "wind_speed", "humidity"
])

init_csv(pm25_path, [
    "timestamp",
    "pm25_french", "time_french",
    "pm25_eu", "time_eu",
    "pm25_czech", "time_czech",
    "pm25_yarmag", "time_yarmag",
    "pm25_chd9", "time_chd9",
    "pm25_mandakh", "time_mandakh",
    "pm25_chd6", "time_chd6",
    "pm25_airv", "time_airv",
    "pm25_school17", "time_school17",
    "pm25_school72", "time_school72",
    "pm25_chd12", "time_chd12",
    "pm25_kind280", "time_kind280",
    "pm25_school49", "time_school49",
    "pm25_kind154", "time_kind154",
    "pm25_kind298", "time_kind298",
    "pm25_kind292", "time_kind292",
    "pm25_neocity", "time_neocity",
    "pm25_school138", "time_school138"
])


def get_last_timestamp(filepath):
    """Reads the last timestamp from a CSV."""
    if not os.path.exists(filepath) or os.stat(filepath).st_size == 0:
        return None
    with open(filepath, "r", encoding="utf-8-sig") as f:
        from collections import deque
        try:
            last_line = deque(csv.reader(f), maxlen=1)[0]
            return last_line[0] if last_line else None
        except IndexError:
            return None

def should_update_pm25(last_ts_str):
    """Decides if PM2.5 should be scraped."""
    if not last_ts_str:
        return True
    try:
        last_dt = datetime.strptime(last_ts_str, "%Y-%m-%d %H:%M")
        last_dt = tz.localize(last_dt)
        current_dt = datetime.now(tz)
        
        # Update if different hour OR > 60 mins old
        if current_dt.hour != last_dt.hour:
            return True
        if (current_dt - last_dt).total_seconds() > 3600:
            return True
        return False
    except ValueError:
        return True

# Check if we need to scrape PM2.5
last_pm25_ts = get_last_timestamp(pm25_path)
update_pm25 = should_update_pm25(last_pm25_ts)

# Always scrape weather
temperature, feels_like, wind_speed, humidity = scrape_weather()

# Write Weather Data
with open(weather_path, "a", encoding="utf-8-sig", newline="") as f:
    writer = csv.writer(f)
    writer.writerow([
        timestamp,
        clean(temperature),
        clean(feels_like),
        clean(wind_speed),
        clean(humidity)
    ])

# Conditional PM2.5 Scrape
if update_pm25:
    print("New hour detected. Scraping fresh PM2.5 data...")
    iqair_stations = [
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/french-embassy-peace-avenue", "French Embassy"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/eu-delegation-to-mongolia", "EU Delegation"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/czech-embassy-ulaanbaatar", "Czech Embassy"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/yarmag-garden-city", "Yarmag Garden City"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/chd-9-khoroo", "CHD 9 Khoroo"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/mandakh-naran-tuv", "Mandakh Naran Tuv"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/chd-6-horoo", "CHD 6 Horoo"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/air-v", "Air V"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/school-no-17", "School 17"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/school-no-72", "School 72"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/chd-12-khoroo", "CHD 12"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/kindergarden--280", "Kindergarden 280"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/49-r-surguuli", "School 49"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/kindergarden--154", "Kindergarden 154"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/kindergarden--298", "Kindergarden 298"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/kindergarden--292", "Kindergarden 292"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/neo-city", "Neo City"),
        ("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/school--138", "School 138")
    ]
    
    pm25_row = [timestamp]
    consecutive_failures = 0
    
    for url, label in iqair_stations:
        if consecutive_failures >= 3:
            print(f"Circuit breaker active: Skipping {label} due to repeated timeouts.")
            pm25_row.extend(["ERROR", "ERROR"])
            continue
            
        p, t = scrape_pm25(url, label)
        pm25_row.extend([clean(p), clean(t, is_time=True)])
        
        if p == "ERROR" and t == "ERROR":
            consecutive_failures += 1
        else:
            consecutive_failures = 0
            
        # Only sleep if we didn't just fail/timeout
        if consecutive_failures == 0:
            time.sleep(random.uniform(3, 7))
        
    # Write PM2.5 Data
    with open(pm25_path, "a", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(pm25_row)
else:
    print(f"Skipping PM2.5 scrape (last data from {last_pm25_ts} is recent).")

driver.quit()
