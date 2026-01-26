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
                // Add cache-busting query parameter
                const cacheBust = `?t=${Date.now()}`;
                let response = await fetch(`weather_log.csv${cacheBust}`);
                if (!response.ok) {
                    response = await fetch(`./weather_log.csv${cacheBust}`);
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
                setError(err.message);
                setLoading(false);
            }
        }

        fetchData();
        // Set up auto-refresh every 5 minutes
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const cleanNumber = (val) => {
        if (!val || val === "ERROR") return null;
        const n = parseFloat(String(val).replace(/[^\d.-]/g, ''));
        return Number.isFinite(n) ? n : null;
    };

    const cleanTime = (rawStr) => {
        if (!rawStr) return null;
        const clean = rawStr.replace(/(\r\n|\n|\r)/gm, " ").trim();
        if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(clean)) return clean;
        const stdMatch = clean.match(/(\d{1,2}:\d{2}),\s*([A-Za-z]{3}\s\d{1,2})/);
        if (stdMatch) return `${stdMatch[1]}, ${stdMatch[2]}`;
        const messyMatch = clean.match(/(\d{1,2}:\d{2})\s*([A-Za-z]{3}\s\d{1,2})/);
        if (messyMatch) return `${messyMatch[1]}, ${messyMatch[2]}`;
        return clean;
    };

    const processData = (rows) => {
        const raw = {
            timestamps: [], temps: [], feels: [], humidities: [], windSpeeds: [],
            french: [], eu: [], czech: [], yarmag: [], chd9: [], mandakh: [], chd6: [], airv: [], school17: [], school72: [], chd12: [], kind280: [],
            time_french: [], time_eu: [], time_czech: [], time_yarmag: [], time_chd9: [], time_mandakh: [], time_chd6: [], time_airv: [], time_school17: [], time_school72: [], time_chd12: [], time_kind280: []
        };

        rows.forEach(row => {
            // Robustly find timestamp key (handles BOM)
            const tsKey = Object.keys(row).find(k => k.endsWith('timestamp'));
            let ts = cleanTime(row[tsKey]);

            if (ts && ts.includes(',')) {
                const [time, date] = ts.split(',').map(s => s.trim());
                const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
                const [monName, day] = date.split(' ');
                const mon = months[monName] || '01';
                const dayFmt = day.padStart(2, '0');
                const year = new Date().getFullYear();
                ts = `${year}-${mon}-${dayFmt} ${time}`;
            }

            if (!ts) return;

            raw.timestamps.push(ts);
            raw.temps.push(cleanNumber(row.temperature));
            raw.feels.push(cleanNumber(row.feels_like));
            raw.humidities.push(cleanNumber(row.humidity));
            raw.windSpeeds.push(cleanNumber(row.wind_speed));

            STATIONS.forEach(s => {
                raw[s.id].push(cleanNumber(row[`pm25_${s.id}`]));
                raw[`time_${s.id}`].push(row[`time_${s.id}`] || row[tsKey]);
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
        const year = now.getFullYear();
        const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };

        const processedStations = STATIONS.map(s => {
            const val = data[s.id][idx];
            const tStr = cleanTime(data[`time_${s.id}`][idx]);
            let status = 'offline';

            if (tStr) {
                try {
                    // Robust parser for "HH:mm, MMM DD"
                    if (tStr.includes(',')) {
                        const [timePart, datePart] = tStr.split(',').map(x => x.trim());
                        const [monName, day] = datePart.split(' ');
                        const mon = months[monName] || '01';
                        const dayFmt = day.padStart(2, '0');
                        // Construct ISO string for local time parsing
                        // Note: We assume the data is in the same timezone as the user (Ulaanbaatar)
                        const isoStr = `${year}-${mon}-${dayFmt}T${timePart}:00`;
                        const d = new Date(isoStr);

                        if (!isNaN(d.getTime())) {
                            const diffHrs = (now - d) / (1000 * 60 * 60);
                            if (diffHrs < 2.0 && diffHrs > -1.0) { // Delayed up to 2h
                                status = diffHrs < 0.5 ? 'live' : 'delayed';
                            } else {
                                status = 'stale';
                            }
                        }
                    } else if (/^\d{4}/.test(tStr)) {
                        // Standard YYYY-MM-DD HH:mm
                        const d = new Date(tStr.replace(' ', 'T'));
                        if (!isNaN(d.getTime())) {
                            const diffHrs = (now - d) / (1000 * 60 * 60);
                            status = diffHrs < 0.5 ? 'live' : (diffHrs < 2 ? 'delayed' : 'stale');
                        }
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
            activeCount: currentVals.length,
            totalCount: STATIONS.length,
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
