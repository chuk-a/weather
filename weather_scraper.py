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
        return "ERROR"
    xpath_val = '//*[@id="main-content"]/div[3]/div[2]/div[1]/div[2]/div[2]/div/div[1]/div[3]/p'
    xpath_time = '//*[@id="main-content"]/div[3]/div[2]/div[1]/div[2]/div[1]/div[1]/div/div[2]/h2'
    xpath_time_alt = '//*[@id="main-content"]/div[3]/div[2]/div[1]/div[2]/div[1]/div[1]/div/div[2]/div[2]'
    
    val = get_text(xpath_val, f"{label} PM2.5")
    time_val = get_text(xpath_time, f"{label} Time (Primary)")
    
    # If primary time doesn't look right (missing "Local time"), try alternate
    if "Local time" not in time_val:
        print(f"Primary time extraction failed for {label}, trying alternate...")
        try:
             # Try to get text from the alternate div
             alt_val = wait.until(EC.presence_of_element_located((By.XPATH, xpath_time_alt))).text.strip()
             if "Local time" in alt_val:
                 time_val = alt_val
                 print(f"Alternate time found: {time_val}")
        except Exception as e:
            print(f"Alternate time extraction failed for {label}: {e}")
            
    return val, time_val

def clean(val):
    if isinstance(val, str):
        # Remove embedding newlines and extra spaces
        val = val.replace("\r", " ").replace("\n", " ").strip()
        
        if "ERROR" in val:
            return "ERROR"
        
        # Check for specific IQAir "No current data" patterns
        if "No current data" in val:
             # Try to extract the last update time
             # Format: "No current data Last update 18:00Jan 25 Local time"
             match = datetime.strptime("18:00Jan 25", "%H:%MM %d") if "Jan" in val else None # Logic...
             # Actually, just strip it to the time if possible, or leave it as a string
             return val

        # Standard cleaning for numbers/units
        return (
            val.replace("°", "")
               .replace("C", "")
               .replace("Feels like", "")
               .replace("µg/m³", "")
               .replace("%", "")
               .replace("м/с", "")
               .replace("|", "")
               # keep the comma if it exists for the frontend parser
               .strip()
        )
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

driver.quit()

# Define output path
output_path = os.path.join(os.path.dirname(__file__), "public", "weather_log.csv")

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
            "pm25_airv", "time_airv"
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
        clean(pm25_french), clean(time_french),
        clean(pm25_eu), clean(time_eu),
        clean(pm25_czech), clean(time_czech),
        clean(pm25_yarmag), clean(time_yarmag),
        clean(pm25_chd9), clean(time_chd9),
        clean(pm25_mandakh), clean(time_mandakh),
        clean(pm25_chd6), clean(time_chd6),
        clean(pm25_airv), clean(time_airv)
    ])
