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
    { id: 'airv', label: 'Air V', flag: '📡' },
    { id: 'school17', label: 'School No. 17', flag: '🏫' },
    { id: 'school72', label: 'School No. 72', flag: '🏫' },
    { id: 'chd12', label: 'CHD 12 Khoroo', flag: '🏢' },
    { id: 'kind280', label: 'Kindergarden 280', flag: '🎒' }
];

export function useWeatherData() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // Try to fetch with relative path
                let response = await fetch('weather_log.csv');
                if (!response.ok) {
                    // Fallback for some GH pages setups
                    response = await fetch('./weather_log.csv');
                }
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

    const cleanTime = (rawStr) => {
        if (!rawStr) return null;
        // Handle "No current data \n Last update..." mess
        const clean = rawStr.replace(/(\r\n|\n|\r)/gm, " ").trim();

        // Try to match standard "YYYY-MM-DD HH:mm"
        if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(clean)) return clean;

        // Try to match standard "HH:mm, MMM DD"
        const stdMatch = clean.match(/(\d{1,2}:\d{2}),\s*([A-Za-z]{3}\s\d{1,2})/);
        if (stdMatch) return `${stdMatch[1]}, ${stdMatch[2]}`;

        // Try to match "Last update HH:mmJan DD" (Scraper glitch format)
        const messyMatch = clean.match(/(\d{1,2}:\d{2})\s*([A-Za-z]{3}\s\d{1,2})/);
        if (messyMatch) return `${messyMatch[1]}, ${messyMatch[2]}`;

        return clean; // Fallback
    };

    // Helper to convert "HH:mm, MMM DD" back to comparable Date if possible
    // (Assuming current year for rough filtering, or keep generic if not needed)
    // For now, we just ensure the timestamp string stored is clean.

    const processData = (rows) => {
        const raw = {
            timestamps: [], temps: [], feels: [], humidities: [], windSpeeds: [],
            french: [], eu: [], czech: [], yarmag: [], chd9: [], mandakh: [], chd6: [], airv: [], school17: [], school72: [], chd12: [], kind280: [],
            time_french: [], time_eu: [], time_czech: [], time_yarmag: [], time_chd9: [], time_mandakh: [], time_chd6: [], time_airv: [], time_school17: [], time_school72: [], time_chd12: [], time_kind280: []
        };

        rows.forEach(row => {
            // Clean the main timestamp
            // Standardize to YYYY-MM-DD HH:mm for Chart XAxis if it was messy?
            // "18:00, Jan 25" -> standard XAxis parser "slice(11,16)" expects "YYYY-MM-DD HH:mm"
            // We need to construct a fake ISO string if we want the chart slicer to work 100% same way
            // OR we update the Chart XAxis formatter.
            // Let's normalize everything to "YYYY-MM-DD HH:mm" if we can infer year.

            let ts = cleanTime(row.timestamp);

            // If it's "18:00, Jan 25", convert to "2026-01-25 18:00" for consistency
            if (ts && ts.includes(',')) {
                const [time, date] = ts.split(',').map(s => s.trim()); // 18:00, Jan 25
                // date is "Jan 25". Convert to "01-25"
                const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
                const [monName, day] = date.split(' ');
                const mon = months[monName] || '01';
                const dayFmt = day.padStart(2, '0');
                const year = new Date().getFullYear(); // Assume current year
                ts = `${year}-${mon}-${dayFmt} ${time}`;
            }

            if (!ts) return; // Skip garbage rows with no valid timestamp

            raw.timestamps.push(ts);
            raw.temps.push(cleanNumber(row.temperature));
            raw.feels.push(cleanNumber(row.feels_like));
            raw.humidities.push(cleanNumber(row.humidity));
            raw.windSpeeds.push(cleanNumber(row.wind_speed));

            STATIONS.forEach(s => {
                raw[s.id].push(cleanNumber(row[`pm25_${s.id}`]));
                // Fallback to main timestamp if station time is missing
                raw[`time_${s.id}`].push(row[`time_${s.id}`] || row.timestamp);
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

    const getLatestMetrics = () => {
        if (!data) return null;

        // Find the last valid row with a timestamp
        let idx = -1;
        for (let i = data.timestamps.length - 1; i >= 0; i--) {
            if (data.timestamps[i] && data.timestamps[i].length > 5) {
                idx = i;
                break;
            }
        }

        if (idx < 0) return null;

        // Helper to find value from ~60 mins ago
        const getTrend = (stationId, currentIdx) => {
            if (idx < 5) return 'stable'; // Not enough history
            const currentTime = new Date(data.timestamps[currentIdx]);

            // Look back ~60 mins
            let oldIdx = -1;
            for (let i = currentIdx - 1; i >= 0; i--) {
                const prevTime = new Date(data.timestamps[i]);
                const diffMin = (currentTime - prevTime) / (1000 * 60);
                if (diffMin >= 50 && diffMin <= 75) {
                    oldIdx = i;
                    break;
                }
                if (diffMin > 75) break;
            }

            if (oldIdx === -1) return 'stable';
            const oldVal = data[stationId][oldIdx];
            const newVal = data[stationId][currentIdx];
            if (oldVal == null || newVal == null) return 'stable';

            const diff = newVal - oldVal;
            if (diff > (oldVal * 0.05)) return 'up';
            if (diff < -(oldVal * 0.05)) return 'down';
            return 'stable';
        };

        const now = new Date();
        const processedStations = STATIONS.map(s => {
            const val = data[s.id][idx];
            const tStr = cleanTime(data[`time_${s.id}`][idx]);
            let status = 'offline';

            if (tStr) {
                try {
                    const [timePart, datePart] = tStr.split(',').map(x => x.trim());
                    const d = new Date(`${datePart}, ${now.getFullYear()} ${timePart}`);
                    if (!isNaN(d.getTime())) {
                        const diffHrs = (now - d) / (1000 * 60 * 60);
                        if (diffHrs < 0.5) status = 'live';
                        else if (diffHrs < 2) status = 'delayed'; // Strict 2-hour window
                        else status = 'stale';
                    }
                } catch (e) {
                    status = 'offline';
                }
            }

            return {
                ...s,
                val,
                time: tStr,
                status,
                trend: getTrend(s.id, idx)
            };
        });

        // Strict Filtering: Only include stations updated within the last 2 hours (live/delayed)
        const currentVals = processedStations
            .filter(s => (s.status === 'live' || s.status === 'delayed') && s.val != null)
            .map(s => s.val);

        const avg = currentVals.length
            ? Math.round(currentVals.reduce((a, b) => a + b, 0) / currentVals.length)
            : null;

        // Severe disconnection: Only hide if NO active stations exist
        const lastTs = new Date(data.timestamps[idx]);
        const isCompletelyDead = (now - lastTs) / (1000 * 60 * 60) > 24; // Keep historical view if < 24h

        return {
            lastUpdated: data.timestamps[idx],
            avgAQI: avg,
            isOffline: avg === null || isCompletelyDead,
            temp: data.temps[idx],
            feels: data.feels[idx],
            humidity: data.humidities[idx],
            wind: data.windSpeeds[idx],
            stations: processedStations
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
