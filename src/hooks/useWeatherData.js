import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const STATIONS = [
    { id: 'french', label: 'French Embassy', flag: '🇫🇷' },
    { id: 'eu', label: 'EU Delegation', flag: '🇪🇺' },
    { id: 'czech', label: 'Czech Embassy', flag: '🇨🇿' },
    { id: 'yarmag', label: 'Yarmag', flag: '🏙️' },
    { id: 'chd9', label: 'CHD 9', flag: '🏙️' },
    { id: 'mandakh', label: 'Mandakh', flag: '🏙️' },
    { id: 'chd6', label: 'CHD 6', flag: '🏙️' },
    { id: 'airv', label: 'Air V', flag: '📡' }
];

export function useWeatherData() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('weather_log.csv');
                if (!response.ok) throw new Error('Failed to fetch data');
                const text = await response.text();

                Papa.parse(text.trim(), {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        processData(results.data);
                    },
                    error: (err) => {
                        setError(err.message);
                        setLoading(false);
                    }
                });
            } catch (err) {
                // Fallback or retry logic could go here
                setError(err.message);
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    const cleanNumber = (val) => {
        if (!val || val === "ERROR") return null;
        const n = parseFloat(String(val).replace(/[^\d.-]/g, ''));
        return Number.isFinite(n) ? n : null;
    };

    const processData = (rows) => {
        const raw = {
            timestamps: [], temps: [], feels: [], humidities: [], windSpeeds: [],
            french: [], eu: [], czech: [], yarmag: [], chd9: [], mandakh: [], chd6: [], airv: [],
            time_french: [], time_eu: [], time_czech: [], time_yarmag: [], time_chd9: [], time_mandakh: [], time_chd6: [], time_airv: []
        };

        rows.forEach(row => {
            raw.timestamps.push(row.timestamp);
            raw.temps.push(cleanNumber(row.temperature));
            raw.feels.push(cleanNumber(row.feels_like));
            raw.humidities.push(cleanNumber(row.humidity));
            raw.windSpeeds.push(cleanNumber(row.wind_speed));

            STATIONS.forEach(s => {
                raw[s.id].push(cleanNumber(row[`pm25_${s.id}`]));
                raw[`time_${s.id}`].push(row[`time_${s.id}`]);
            });
        });

        setData(raw);
        setLoading(false);
    };

    const getFilteredData = (range) => {
        if (!data || range === 'all') return data;

        const now = new Date();
        const days = range === 'today' ? 1 : (range === 'last7' ? 7 : 30);
        const ms = days * 24 * 60 * 60 * 1000;
        const cutoff = new Date(now.getTime() - ms);

        let start = 0;
        for (let i = data.timestamps.length - 1; i >= 0; i--) {
            // Assuming timestamp format YYYY-MM-DD HH:mm
            if (new Date(data.timestamps[i]) < cutoff) {
                start = i + 1;
                break;
            }
        }

        if (start <= 0) return data;

        const sliced = {};
        Object.keys(data).forEach(k => {
            sliced[k] = data[k].slice(start);
        });
        return sliced;
    };

    const cleanTime = (rawStr) => {
        if (!rawStr) return null;
        // Handle "No current data \n Last update..." mess
        const clean = rawStr.replace(/(\r\n|\n|\r)/gm, " ").trim();

        // Try to match standard "HH:mm, MMM DD"
        const stdMatch = clean.match(/(\d{1,2}:\d{2}),\s*([A-Za-z]{3}\s\d{1,2})/);
        if (stdMatch) return `${stdMatch[1]}, ${stdMatch[2]}`;

        // Try to match "Last update HH:mmJan DD" (Scraper glitch format)
        const messyMatch = clean.match(/(\d{1,2}:\d{2})\s*([A-Za-z]{3}\s\d{1,2})/);
        if (messyMatch) return `${messyMatch[1]}, ${messyMatch[2]}`;

        return clean; // Fallback
    };

    const getLatestMetrics = () => {
        if (!data) return null;
        const idx = data.timestamps.length - 1;
        if (idx < 0) return null;

        // Smart Average Logic
        const now = new Date();
        const currentVals = STATIONS.map(s => {
            const val = data[s.id][idx];
            let tStr = data[`time_${s.id}`][idx];
            tStr = cleanTime(tStr);

            if (val == null) return null;
            if (!tStr) return val; // Assume fresh if no time

            try {
                // Parse "10:00, Jan 26"
                const [timePart, datePart] = tStr.split(',').map(x => x.trim());
                if (!datePart) return val; // Logic fallback if split fails

                const year = now.getFullYear();
                const d = new Date(`${datePart}, ${year} ${timePart}`);
                if (isNaN(d.getTime())) return val;

                const diffHrs = (now - d) / (1000 * 60 * 60);
                if (diffHrs > 2) return null; // Stale
                return val;
            } catch (e) { return val; }
        }).filter(v => v != null);

        const avg = currentVals.length
            ? Math.round(currentVals.reduce((a, b) => a + b, 0) / currentVals.length)
            : 0;

        return {
            lastUpdated: data.timestamps[idx],
            avgAQI: avg,
            temp: data.temps[idx],
            feels: data.feels[idx],
            humidity: data.humidities[idx],
            wind: data.windSpeeds[idx],
            stations: STATIONS.map(s => ({
                ...s,
                val: data[s.id][idx],
                time: cleanTime(data[`time_${s.id}`][idx]),
            }))
        };
    };

    return {
        data,
        loading,
        error,
        getFilteredData,
        getLatestMetrics,
        stations: STATIONS
    };
}
