import pandas as pd

# Function to clean weather data

def clean_weather_data():
    # Read the CSV file
    df = pd.read_csv('public/weather_log.csv', encoding='utf-8-sig')  # Remove BOM if present

    # Strip whitespace from string values
    df = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)

    # Replace "ERROR" with empty strings
    df.replace('ERROR', '', inplace=True)

    # Handle missing data
    df.fillna('', inplace=True)  # Fill missing values with empty strings

    # Validate numeric columns
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')  # Convert to numbers, set errors to NaN

    # Write cleaned data to new file
    df.to_csv('public/weather_log_cleaned.csv', index=False)

    # Print summary of issues
    print('Data Cleaning Summary:')
    print(df.isnull().sum())

# Run the cleaning function
if __name__ == '__main__':
    clean_weather_data()