import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';

const STATIONS = [
    { id: 'school72', id_num: '#01', label: 'School No. 72', region: 'Downtown', flag: '🏫' },
    { id: 'school17', id_num: '#02', label: 'School No. 17', region: 'Midtown', flag: '🏫' },
    { id: 'kind280', id_num: '#03', label: 'Kindergarten 280', region: 'Uptown', flag: '🎒' },
    { id: 'chd12', id_num: '#04', label: 'CHD 12 Khoroo', region: 'East Side', flag: '🏢' },
    { id: 'chd9', id_num: '#05', label: 'CHD 9', region: 'West Side', flag: '🏙️' },
    { id: 'chd6', id_num: '#06', label: 'CHD 6', region: 'Central', flag: '🏙️' },
    { id: 'czech', id_num: '#07', label: 'Czech Embassy', region: 'Embassy Row', flag: '🇨🇿' },
    { id: 'french', id_num: '#08', label: 'French Embassy', region: 'Embassy Row', flag: '🇫🇷' },
    { id: 'eu', id_num: '#09', label: 'EU Delegation', region: 'Diplomatic Quarter', flag: '🇪🇺' },
    { id: 'airv', id_num: '#10', label: 'Air V', region: 'North District', flag: '📡' },
    { id: 'yarmag', id_num: '#11', label: 'Yarmag', region: 'Uptown', flag: '🏙️' },
    { id: 'mandakh', id_num: '#12', label: 'Mandakh', region: 'Downtown', flag: '🏙️' },
    { id: 'school49', id_num: '#13', label: 'School No. 49', region: 'East District', flag: '🏫' },
    { id: 'kind154', id_num: '#14', label: 'Kindergarten 154', region: 'South Side', flag: '🎒' },
    { id: 'kind298', id_num: '#15', label: 'Kindergarten 298', region: 'West District', flag: '🎒' },
    { id: 'kind292', id_num: '#16', label: 'Kindergarten 292', region: 'North Side', flag: '🎒' },
    { id: 'neocity', id_num: '#17', label: 'Neo City', region: 'New Development', flag: '🏢' },
    { id: 'school138', id_num: '#18', label: 'School No. 138', region: 'Suburb', flag: '🏫' }
];

export function useWeatherData() {
    const [weather, setWeather] = useState(null);
    const [aqi, setAqi] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const cleanNumber = (val) => {
        if (!val || val === "ERROR" || val === "OFFLINE") return null;
        const n = parseFloat(String(val).replace(/[^\d.-]/g, ''));
        return Number.isFinite(n) ? n : null;
    };

    const cleanTime = (rawStr) => {
        if (!rawStr) return null;
        const clean = rawStr.replace(/(\r\n|\n|\r)/gm, " ").trim();

        // Already ISO-like
        if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(clean)) return clean;

        // Helper to infer year more robustly
        const parseWithInferredYear = (time, datePart) => {
            const [monName, day] = datePart.split(' ');
            const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
            const mon = months[monName] || '01';
            const dayFmt = day.padStart(2, '0');

            const now = new Date();
            let year = now.getFullYear();

            // Construct tentative date
            let tentative = `${year}-${mon}-${dayFmt} ${time}`;
            let tDate = new Date(tentative);

            // Check for year boundary issues
            if (tDate > new Date(now.getTime() + 48 * 60 * 60 * 1000)) {
                year -= 1;
                tentative = `${year}-${mon}-${dayFmt} ${time}`;
            }

            return tentative;
        };

        // Format: "10:00, Jan 27"
        const stdMatch = clean.match(/(\d{1,2}:\d{2}),\s*([A-Za-z]{3}\s\d{1,2})/);
        if (stdMatch) return parseWithInferredYear(stdMatch[1], stdMatch[2]);

        // Format: "10:00 Jan 27"
        const messyMatch = clean.match(/(\d{1,2}:\d{2})\s*([A-Za-z]{3}\s\d{1,2})/);
        if (messyMatch) return parseWithInferredYear(messyMatch[1], messyMatch[2]);

        // Format: "1/27/26 10:23"
        const d = new Date(clean.replace(/-/g, '/'));
        if (!isNaN(d.getTime())) {
            const pad = num => String(num).padStart(2, '0');
            const year = d.getFullYear(); 
            const month = pad(d.getMonth() + 1);
            const day = pad(d.getDate());
            const hours = pad(d.getHours());
            const minutes = pad(d.getMinutes());
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        }

        return clean;
    };

    const fetchCSV = async (filename) => {
        const cacheBust = `?t=${Date.now()}`;
        // 1. Try local
        try {
            const res = await fetch(`/${filename}${cacheBust}`);
            if (res.ok) return await res.text();
        } catch (e) {
            console.warn(`Local fetch for ${filename} failed, trying fallback...`);
        }
        // 2. Try GitHub
        const RAW_URL = `https://raw.githubusercontent.com/chuk-a/weather/main/public/${filename}`;
        const res = await fetch(`${RAW_URL}${cacheBust}`);
        if (!res.ok) throw new Error(`Failed to fetch ${filename}`);
        return await res.text();
    };

    const processWeather = (rows) => {
        const raw = {
            timestamps: [], temps: [], feels: [], humidities: [], windSpeeds: []
        };
        rows.forEach(row => {
             const tsKey = Object.keys(row).find(k => k.toLowerCase().includes('timestamp'));
             let ts = cleanTime(row[tsKey]);
             
             // Handle BOM or weird keys
             if (!ts && row[Object.keys(row)[0]]) {
                 ts = cleanTime(row[Object.keys(row)[0]]);
             }
             
             if (!ts) return;

             raw.timestamps.push(ts);
             raw.temps.push(cleanNumber(row.temperature));
             raw.feels.push(cleanNumber(row.feels_like));
             raw.humidities.push(cleanNumber(row.humidity));
             raw.windSpeeds.push(cleanNumber(row.wind_speed));
        });
        return raw;
    };

    const processAQI = (rows) => {
        const raw = {
             timestamps: [],
             ...STATIONS.reduce((acc, s) => ({ ...acc, [s.id]: [], [`time_${s.id}`]: [] }), {})
        };
        
        rows.forEach(row => {
            const tsKey = Object.keys(row).find(k => k.toLowerCase().includes('timestamp'));
            let ts = cleanTime(row[tsKey]);
            if (!ts) return;

            raw.timestamps.push(ts);
            
            STATIONS.forEach(s => {
                raw[s.id].push(cleanNumber(row[`pm25_${s.id}`]));
                raw[`time_${s.id}`].push(row[`time_${s.id}`]);
            });
        });
        return raw;
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [weatherText, aqiText] = await Promise.all([
                fetchCSV('weather_log.csv'),
                fetchCSV('pm25_log.csv')
            ]);

            const parse = (text) => {
                return new Promise((resolve) => {
                    Papa.parse(text.trim(), {
                        header: true,
                        skipEmptyLines: true,
                        complete: (res) => resolve(res.data)
                    });
                });
            };

            const weatherRows = await parse(weatherText);
            const aqiRows = await parse(aqiText);

            // Sort helper
            const sorter = (a, b) => {
                const k = Object.keys(a).find(key => key.toLowerCase().includes('timestamp'));
                if (!k) return 0;
                return new Date(cleanTime(a[k])) - new Date(cleanTime(b[k]));
            };

            weatherRows.sort(sorter);
            aqiRows.sort(sorter);

            setWeather(processWeather(weatherRows));
            setAqi(processAQI(aqiRows));
            setLoading(false);

        } catch (err) {
            console.error(err);
            setError(err.message);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const getFilteredData = (dataObj, range) => {
        if (!dataObj || range === 'all') return dataObj;
        
        const now = new Date();
        const days = range === 'today' ? 1 : (range === 'last7' ? 7 : 30);
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        let start = 0;
        for (let i = dataObj.timestamps.length - 1; i >= 0; i--) {
            if (new Date(dataObj.timestamps[i]) < cutoff) {
                start = i + 1;
                break;
            }
        }

        if (start <= 0) return dataObj;

        const sliced = {};
        Object.keys(dataObj).forEach(k => {
             sliced[k] = dataObj[k].slice(start);
        });
        return sliced;
    };

    const getLatestMetrics = () => {
        if (!weather || !aqi) return null;

        // Latest Weather
        const wIdx = weather.timestamps.length - 1;
        
        // Latest AQI
        const aIdx = aqi.timestamps.length - 1;
        
        // Calculate AQI avg from latest row
        const currentVals = STATIONS
            .map(s => aqi[s.id][aIdx])
            .filter(v => v != null);
            
        const avg = currentVals.length
            ? Math.round(currentVals.reduce((a, b) => a + b, 0) / currentVals.length)
            : null;

        const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
        
        const processedStations = STATIONS.map(s => {
             const val = aqi[s.id][aIdx];
             const tStr = cleanTime(aqi[`time_${s.id}`][aIdx]);
             
             let status = 'offline';
             if (tStr) {
                // Status logic (same as before)
                try {
                     const now = new Date();
                     const year = now.getFullYear();
                     
                     let d;
                     if (tStr.includes(',')) {
                         const [timePart, datePart] = tStr.split(',').map(x => x.trim());
                         const [monName, day] = datePart.split(' ');
                         const mon = months[monName] || '01';
                         const dayFmt = day.padStart(2, '0');
                         d = new Date(`${year}-${mon}-${dayFmt}T${timePart}:00`);
                     } else {
                         d = new Date(tStr.replace(' ', 'T'));
                     }
                     
                     if (!isNaN(d.getTime())) {
                          const diffHrs = (now - d) / (1000 * 60 * 60);
                          // Allow lenient delay since AQI is hourly
                          if (diffHrs < 2.5 && diffHrs > -1.0) {
                               status = diffHrs < 1.1 ? 'live' : 'delayed';
                          } else {
                               status = 'stale';
                          }
                     }
                } catch(e) { status = 'offline'; }
             }

             return {
                 ...s,
                 val,
                 time: tStr,
                 status,
                 trend: 'stable' // Simplified for now
             };
        });

        // Determine if system is offline based on Weather timestamp
        const lastWTime = new Date(weather.timestamps[wIdx]);
        const now = new Date();
        const isOffline = (now - lastWTime) / (1000 * 60 * 60) > 1; // Weather should be fresh

        return {
            lastUpdated: weather.timestamps[wIdx],
            avgAQI: avg,
            activeCount: currentVals.length,
            totalCount: STATIONS.length,
            isOffline: isOffline,
            temp: weather.temps[wIdx],
            feels: weather.feels[wIdx],
            humidity: weather.humidities[wIdx],
            wind: weather.windSpeeds[wIdx],
            stations: processedStations
        };
    };

    return {
        weather,
        aqi,
        loading,
        error,
        getFilteredData,
        getLatestMetrics,
        refetch: fetchData,
        stations: STATIONS
    };
}
