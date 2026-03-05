from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from datetime import datetime
import chromedriver_autoinstaller
import csv
import os
import time
import tempfile
import pytz
import re
import random

# Localized timestamp for Ulaanbaatar
tz = pytz.timezone("Asia/Ulaanbaatar")
timestamp = datetime.now(tz).strftime("%Y-%m-%d %H:%M")

# Setup ChromeDriver path
custom_path = os.path.join(tempfile.gettempdir(), "chromedriver")
os.makedirs(custom_path, exist_ok=True)
chromedriver_autoinstaller.install(path=custom_path)

# Setup headless Chrome for CI/CD
chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
# Add a realistic user agent to help bypass simple bot detection
chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

driver = webdriver.Chrome(options=chrome_options)
wait = WebDriverWait(driver, 15)

# Circuit breaker state
consecutive_failures = {}

def safe_get(url, retries=3, delay=5):
    for attempt in range(retries):
        try:
            # Random delay before request to mimic human behavior
            time.sleep(random.uniform(1, 3))
            driver.get(url)
            # Basic check if page loaded
            if "Cloudflare" in driver.page_source or "Access Denied" in driver.page_source:
                print(f"Bot detection detected for {url}")
                time.sleep(delay * 2)
                continue
            return True
        except Exception as e:
            print(f"[{datetime.now().isoformat()}] Attempt {attempt+1} failed for {url}: {e}")
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

def scrape_pm25(url, label):
    # Circuit breaker check
    if consecutive_failures.get(label, 0) >= 3:
        print(f"Circuit breaker active: Skipping {label} due to repeated timeouts.")
        return "ERROR", "ERROR"

    print(f"Scraping {label} PM2.5...")
    if not safe_get(url):
        consecutive_failures[label] = consecutive_failures.get(label, 0) + 1
        return "ERROR", "ERROR"
    
    consecutive_failures[label] = 0 # Reset on success
    
    # Check for "No current data"
    try:
        if "No current data" in driver.page_source or "no current data" in driver.page_source.lower():
            print(f"{label}: No current data available")
            return "OFFLINE", "OFFLINE"
    except:
        pass
    
    # Robust Value Extraction
    val = "ERROR"
    xpath_val_strategies = [
        '//*[@id="main-content"]//p[contains(text(), "µg/m³")]/preceding-sibling::p',
        "//span[contains(text(), 'µg/m³')]/preceding-sibling::span",
        '//*[@id="main-content"]//div[contains(@class, "aqi-value")]//p[1]',
        "//p[contains(text(), 'µg/m³')]/../p[1]",
        "//div[contains(@class, 'pollutant-concentration-wrapper')]//p[1]",
        "//main//p[contains(text(), 'µg/m³')]/preceding-sibling::*[1]",
    ]
    
    for i, xpath in enumerate(xpath_val_strategies):
        try:
            elem = WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.XPATH, xpath)))
            val = elem.text.strip()
            if val and val != "ERROR":
                print(f"{label} PM2.5 (Strategy #{i+1}): {val}")
                break
        except:
            if i == len(xpath_val_strategies) - 1:
                print(f"{label} PM2.5: All strategies failed")
    
    # Robust Time Extraction
    time_val = "ERROR"
    xpath_time_strategies = [
        '//*[contains(text(), "Local time")]',
        '//*[contains(text(), "local time")]',
        "//time",
        '//*[contains(@class, "time")]',
        "//p[contains(text(), ':') and (contains(text(), 'AM') or contains(text(), 'PM'))]",
    ]
    
    for i, xpath in enumerate(xpath_time_strategies):
        try:
            elem = WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.XPATH, xpath)))
            time_val = elem.text.strip()
            if time_val and time_val != "ERROR":
                print(f"{label} Time (Strategy #{i+1}): {time_val}")
                break
        except:
            if i == len(xpath_time_strategies) - 1:
                print(f"{label} Time: All strategies failed")
            
    return val, time_val

def clean(val, is_time=False):
    if not val or val == "ERROR": return "ERROR"
    if val == "OFFLINE": return "OFFLINE"
    
    val = val.replace("\r", " ").replace("\n", " ").strip()
    
    if is_time:
        patterns = [
            r"(\d{1,2}:\d{2}),\s*([A-Za-z]{3}\s\d{1,2})",
            r"(\d{1,2}:\d{2}\s*[AP]M),\s*([A-Za-z]{3}\s\d{1,2})"
        ]
        for pattern in patterns:
            match = re.search(pattern, val)
            if match: return f"{match.group(1)}, {match.group(2)}"
        return val[:30] # Limit length if no pattern matches

    num_match = re.search(r"(-?\d+(\.\d+)?)", val)
    return num_match.group(1) if num_match else "ERROR"

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
        if datetime.now(tz).hour == last_dt.hour: update_pm25 = False
    except: pass

# Scrape Weather
temperature, feels_like, wind_speed, humidity = scrape_weather()
with open(weather_path, "a", encoding="utf-8-sig", newline="") as f:
    csv.writer(f).writerow([timestamp, clean(temperature), clean(feels_like), clean(wind_speed), clean(humidity)])

# Scrape PM2.5
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
    for url, label in iqair_stations:
        p, t = scrape_pm25(url, label)
        pm25_row.extend([clean(p), clean(t, is_time=True)])
    with open(pm25_path, "a", encoding="utf-8-sig", newline="") as f:
        csv.writer(f).writerow(pm25_row)

driver.quit()
