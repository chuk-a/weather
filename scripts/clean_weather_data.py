import csv
import re

def clean_weather_data():
    input_file = 'public/weather_log.csv'
    output_file = 'public/weather_log_cleaned.csv'
    
    print("Starting data cleaning...")
    
    # Read the CSV file
    with open(input_file, 'r', encoding='utf-8-sig') as infile:
        reader = csv.reader(infile)
        rows = list(reader)
    
    # Get header
    header = rows[0]
    data_rows = rows[1:]
    
    cleaned_rows = []
    error_count = 0
    
    for row in data_rows:
        cleaned_row = []
        for i, value in enumerate(row):
            # Strip whitespace
            value = value.strip()
            
            # Replace ERROR with empty string
            if value == 'ERROR':
                value = ''
                error_count += 1
            
            cleaned_row.append(value)
        
        cleaned_rows.append(cleaned_row)
    
    # Write cleaned data to new file
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.writer(outfile)
        writer.writerow(header)
        writer.writerows(cleaned_rows)
    
    print(f"Data cleaning complete!")
    print(f"- Total rows processed: {len(data_rows)}")
    print(f"- ERROR values replaced: {error_count}")
    print(f"- Output file: {output_file}")

if __name__ == '__main__':
    clean_weather_data()