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

driver = webdriver.Chrome(options=chrome_options)
wait = WebDriverWait(driver, 15)

def safe_get(url, retries=3, delay=10):
    for attempt in range(retries):
        try:
            driver.get(url)
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
        return ["ERROR"] * 5  # now returning 5 values total

    driver.get("https://weather.gov.mn")

    temperature  = get_text("/html/body/div/div[2]/div/div[2]/div/div[1]/div/div[2]/div[2]", "Temperature")
    feels_like   = get_text("/html/body/div/div[2]/div/div[2]/div/div[1]/div/div[2]/div[3]/div/div[2]/h1", "Feels Like")
    wind_speed   = get_text("/html/body/div[1]/div[2]/div/div[2]/div/div[1]/div/div[3]/div[1]/p[2]", "Wind Speed (m/s)")
    humidity     = get_text("/html/body/div[1]/div[2]/div/div[2]/div/div[1]/div/div[3]/div[3]/p[2]", "Humidity")

    return temperature, feels_like, wind_speed, humidity

def scrape_pm25(url, label):
    print(f"Scraping {label} PM2.5...")
    if not safe_get(url):
        return "ERROR", "ERROR"
    
    # Check for "No current data" message first
    try:
        page_source = driver.page_source
        if "No current data" in page_source or "no current data" in page_source.lower():
            print(f"{label}: No current data available")
            return "OFFLINE", "OFFLINE"
    except:
        pass
    
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
    
    for i, xpath in enumerate(xpath_val_strategies):
        try:
            elem = wait.until(EC.presence_of_element_located((By.XPATH, xpath)))
            val = elem.text.strip()
            if val and val != "ERROR":
                print(f"{label} PM2.5 (Strategy #{i+1}): {val}")
                break
        except Exception as e:
            if i == len(xpath_val_strategies) - 1:
                print(f"{label} PM2.5: All strategies failed")
    
    # Robust Time Extraction with multiple fallback strategies
    time_val = "ERROR"
    xpath_time_strategies = [
        '//*[contains(text(), "Local time")]',
        '//*[contains(text(), "local time")]',
        "//time",
        '//*[contains(@class, "time")]',
        '//*[contains(text(), "Updated")]',
        '//*[contains(text(), "updated")]',
        "//div[contains(@class, 'date')]",
        "//span[contains(@class, 'date')]",
        "//p[contains(text(), ':') and (contains(text(), 'AM') or contains(text(), 'PM') or contains(text(), 'Jan') or contains(text(), 'Feb') or contains(text(), 'Mar') or contains(text(), 'Apr') or contains(text(), 'May') or contains(text(), 'Jun') or contains(text(), 'Jul') or contains(text(), 'Aug') or contains(text(), 'Sep') or contains(text(), 'Oct') or contains(text(), 'Nov') or contains(text(), 'Dec'))]",
    ]
    
    for i, xpath in enumerate(xpath_time_strategies):
        try:
            elem = wait.until(EC.presence_of_element_located((By.XPATH, xpath)))
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

# Scrape all data
temperature, feels_like, wind_speed, humidity = scrape_weather()
pm25_french, time_french = scrape_pm25("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/french-embassy-peace-avenue", "French Embassy")
pm25_eu, time_eu         = scrape_pm25("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/eu-delegation-to-mongolia", "EU Delegation")
pm25_czech, time_czech   = scrape_pm25("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/czech-embassy-ulaanbaatar", "Czech Embassy")
pm25_yarmag, time_yarmag = scrape_pm25("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/yarmag-garden-city", "Yarmag Garden City")
pm25_chd9, time_chd9     = scrape_pm25("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/chd-9-khoroo", "CHD 9 Khoroo")
pm25_mandakh, time_mandakh = scrape_pm25("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/mandakh-naran-tuv", "Mandakh Naran Tuv")
pm25_chd6, time_chd6     = scrape_pm25("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/chd-6-horoo", "CHD 6 Horoo")
pm25_airv, time_airv     = scrape_pm25("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/air-v", "Air V")
pm25_school17, time_school17 = scrape_pm25("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/school-no-17", "School 17")
pm25_school72, time_school72 = scrape_pm25("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/school-no-72", "School 72")
pm25_chd12, time_chd12   = scrape_pm25("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/chd-12-khoroo", "CHD 12")
pm25_kind280, time_kind280 = scrape_pm25("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/kindergarden--280", "Kindergarden 280")
pm25_school49, time_school49 = scrape_pm25("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/49-r-surguuli", "School 49")
pm25_kind154, time_kind154 = scrape_pm25("https://www.iqair.com/mongolia/ulaanbaatar/ulaanbaatar/kindergarden--154", "Kindergarden 154")


driver.quit()

# Standardized output path relative to project root
output_path = "public/weather_log.csv"

# Write header if file is empty
if not os.path.exists(output_path) or os.stat(output_path).st_size == 0:
    with open(output_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "timestamp", "temperature", "feels_like", "wind_speed", "humidity",
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
            "pm25_kind154", "time_kind154"
        ])

# Append latest data with UB-local timestamp
with open(output_path, "a", encoding="utf-8-sig", newline="") as f:
    writer = csv.writer(f)
    writer.writerow([
        timestamp,
        clean(temperature),
        clean(feels_like),
        clean(wind_speed),
        clean(humidity),
        clean(pm25_french), clean(time_french, is_time=True),
        clean(pm25_eu), clean(time_eu, is_time=True),
        clean(pm25_czech), clean(time_czech, is_time=True),
        clean(pm25_yarmag), clean(time_yarmag, is_time=True),
        clean(pm25_chd9), clean(time_chd9, is_time=True),
        clean(pm25_mandakh), clean(time_mandakh, is_time=True),
        clean(pm25_chd6), clean(time_chd6, is_time=True),
        clean(pm25_airv), clean(time_airv, is_time=True),
        clean(pm25_school17), clean(time_school17, is_time=True),
        clean(pm25_school72), clean(time_school72, is_time=True),
        clean(pm25_chd12), clean(time_chd12, is_time=True),
        clean(pm25_kind280), clean(time_kind280, is_time=True),
        clean(pm25_school49), clean(time_school49, is_time=True),
        clean(pm25_kind154), clean(time_kind154, is_time=True)
    ])
