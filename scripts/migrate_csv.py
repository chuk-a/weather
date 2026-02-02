import csv
import os

INPUT_FILE = "public/weather_log.csv"
WEATHER_FILE = "public/weather_log_new.csv"
PM25_FILE = "public/pm25_log.csv"

def migrate():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    print("Reading old data...")
    with open(INPUT_FILE, "r", encoding="utf-8-sig") as f:
        reader = list(csv.reader(f))
        if not reader:
            print("File is empty.")
            return

    headers = reader[0]
    data = reader[1:]

    # weather_log.csv should contain: timestamp, temperature, feels_like, wind_speed, humidity
    # Indices: 0, 1, 2, 3, 4
    weather_headers = headers[:5]
    
    # pm25_log.csv should contain: timestamp, [all pm25 columns...]
    # Indices: 0, 5 onwards
    pm25_headers = [headers[0]] + headers[5:]

    print(f"Splitting {len(data)} rows...")
    
    weather_rows = []
    pm25_rows = []

    for row in data:
        # Weather data (first 5 cols)
        if len(row) >= 5:
            weather_rows.append(row[:5])
        
        # PM2.5 data (timestamp + rest)
        if len(row) > 5:
            # Check if PM2.5 data is valid (not just offline/error/empty for the whole row)
            # We can include it even if it's partial, to preserve history.
            # But maybe we can filter out rows where we didn't scrape PM2.5?
            # For now, let's keep exact history. 
            pm25_rows.append([row[0]] + row[5:])

    print(f"Writing {len(weather_rows)} rows to {WEATHER_FILE}...")
    with open(WEATHER_FILE, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(weather_headers)
        writer.writerows(weather_rows)

    print(f"Writing {len(pm25_rows)} rows to {PM25_FILE}...")
    with open(PM25_FILE, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(pm25_headers)
        writer.writerows(pm25_rows)

    print("Migration complete. Please check the new files.")
    print("If correct, rename 'weather_log_new.csv' to 'weather_log.csv'.")

if __name__ == "__main__":
    migrate()
