import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    RadialBarChart,
    RadialBar,
    Cell,
    PieChart,
    Pie
} from 'recharts';

// --- HELPER: Pivot Data (Columns -> Rows) ---
const usePivotData = (data, keys) => {
    return useMemo(() => {
        if (!data || !data.timestamps) return [];
        return data.timestamps.map((t, i) => {
            const row = { time: t };

            // OPTION A: Calculate Average ("City Mean")
            if (!keys || keys.length === 0) {
                let sum = 0;
                let count = 0;
                const stationIds = ['french', 'eu', 'czech', 'yarmag', 'chd9', 'mandakh', 'chd6', 'airv', 'school17', 'school72', 'chd12', 'kind280'];
                stationIds.forEach(id => {
                    const v = data[id][i];
                    if (v != null) { sum += v; count++; }
                });
                row.value = count > 0 ? Math.round(sum / count) : null;
            }
            // OPTION B: Specific Keys (Regional Comparison)
            else {
                keys.forEach(k => {
                    row[k] = data[k][i];
                });
            }
            return row;
        });
    }, [data, keys]);
};

// --- HELPER: Needle for AQI Gauge ---
const RADIAN = Math.PI / 180;
const needle = (value, data, cx, cy, iR, oR, color) => {
    let total = 0;
    data.forEach((v) => {
        total += v.value;
    });
    const ang = 180.0 * (1 - value / 200); // Scale 0-200 to 180-0 degrees
    const cos = Math.cos(-RADIAN * ang);
    const sin = Math.sin(-RADIAN * ang);
    const r = 5;
    const xba = cx + r * sin;
    const yba = cy - r * cos;
    const xbb = cx - r * sin;
    const ybb = cy + r * cos;
    const xp = cx + oR * cos;
    const yp = cy + oR * sin;

    return [
        <circle key="center" cx={cx} cy={cy} r={r} fill={color} stroke="none" />,
        <path key="needle" d={`M${xba} ${yba}L${xbb} ${ybb}L${xp} ${yp} Z`} stroke="#none" fill={color} />,
    ];
};

// --- NEW: AUTHENTIC PM2.5 NEEDLE GAUGE ---
export function AirRadialChart({ value }) {
    const data = [
        { name: 'Good', value: 12, fill: '#10b981' },         // 0-12
        { name: 'Moderate', value: 23, fill: '#fbbf24' },     // 12-35
        { name: 'Sensitive', value: 20, fill: '#f97316' },    // 35-55
        { name: 'Unhealthy', value: 95, fill: '#ef4444' },    // 55-150
        { name: 'Very Unhealthy', value: 50, fill: '#8b5cf6' }, // 150-200
    ];

    const cx = 80;
    const cy = 80;
    const iR = 50;
    const oR = 75;

    return (
        <div className="w-full h-full flex items-center justify-center pt-4">
            <PieChart width={160} height={100}>
                <Pie
                    dataKey="value"
                    startAngle={180}
                    endAngle={0}
                    data={data}
                    cx={cx}
                    cy={cy}
                    innerRadius={iR}
                    outerRadius={oR}
                    stroke="none"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
                {needle(Math.min(value || 0, 500), data, cx, cy, iR, oR, 'currentColor')}
            </PieChart>
        </div>
    );
}

// --- NEW: SPATIAL TELEMETRY (Fidelity Radar) ---
export function SpatialRadarChart({ stations, metrics }) {
    const data = useMemo(() => {
        if (!metrics || !stations) return [];
        return stations
            .map(s => {
                const stats = metrics.stations.find(st => st.id === s.id);
                return {
                    subject: s.label.toUpperCase(),
                    value: stats?.val || 0,
                    fullMark: 200,
                    status: stats?.status
                };
            })
            // Only show active nodes (Live or Delayed) on the radar
            .filter(item => item.status === 'live' || item.status === 'delayed');
    }, [stations, metrics]);

    return (
        <div className="w-full h-full min-h-[350px] flex items-center justify-center relative bg-[#0F0A1E]/20 cyber-grid">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: '900' }}
                    />
                    <Radar
                        name="AQI"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                        animationDuration={1500}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0F0A1E',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- NEW: TEMPORAL ANALYSIS (Selected Lines Only) ---
// --- NEW: TEMPORAL ANALYSIS (Selected Lines Only) ---
export function ComparisonChart({ data, selectedStations = [] }) {
    const chartData = useMemo(() => {
        if (!data || !data.timestamps) return [];

        const d = [];
        // Iterate through all global timestamps
        for (let i = 0; i < data.timestamps.length; i++) {
            const point = { time: data.timestamps[i] };
            let hasData = false;

            // Direct mapping: For each selected station, grab the value at index 'i'
            selectedStations.forEach(id => {
                const val = data[id] ? data[id][i] : null;
                // Only add if value is valid number
                if (val !== null && val !== undefined && val !== "") {
                    point[id] = Number(val);
                    hasData = true;
                }
            });

            // Only add point if at least one selected station has data
            if (hasData) {
                d.push(point);
            }
        }
        return d;
    }, [data, selectedStations]);

    // Color palette for selected stations
    const stationColors = ['#f472b6', '#34d399', '#60a5fa', '#a78bfa', '#facc15', '#fb923c', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];

    return (
        <div className="w-full h-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="white" strokeOpacity={0.05} strokeDasharray="3 3" />
                    <XAxis
                        dataKey="time"
                        tick={{ fill: 'white', opacity: 0.2, fontSize: 8, fontWeight: '900' }}
                        tickFormatter={(value) => {
                            if (!value) return '';
                            try {
                                return value.split(' ')[1].slice(0, 5);
                            } catch (e) { return value; }
                        }}
                        minTickGap={60}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: 'white', opacity: 0.2, fontSize: 8, fontWeight: '900' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0F0A1E',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                        }}
                        itemStyle={{ color: 'white' }}
                        labelStyle={{ color: '#aaa', marginBottom: '4px' }}
                    />

                    {/* Dynamic Lines for Selected Stations */}
                    {selectedStations.map((stationId, index) => (
                        <Line
                            key={stationId}
                            type="monotone"
                            dataKey={stationId}
                            name={stationId.toUpperCase()}
                            stroke={stationColors[index % stationColors.length]}
                            strokeWidth={2}
                            dot={{ r: 2, strokeWidth: 0, fill: stationColors[index % stationColors.length] }}
                            activeDot={{ r: 5 }}
                            connectNulls={true}
                            animationDuration={0} // Disable animation for instant feedback
                            isAnimationActive={false}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

function cn(...inputs) {
    return inputs.filter(Boolean).join(' ');
}

// --- EXISTING: ATMOSPHERE (Temp Lines) ---
export function AtmosphereTrendChart({ data }) {
    const chartData = useMemo(() => {
        if (!data || !data.timestamps) return [];
        return data.timestamps.map((t, i) => ({
            time: t,
            actual: data.temps[i],
            feels: data.feels[i]
        }));
    }, [data]);

    return (
        <div className="w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.5} />
                    <XAxis
                        dataKey="time"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: '700' }}
                        tickFormatter={(value) => value ? value.slice(11, 16) : ''}
                        minTickGap={60}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: '700' }}
                        axisLine={false}
                        tickLine={false}
                        unit="°"
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '10px',
                            color: 'hsl(var(--foreground))'
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="actual"
                        name="Actual Temp"
                        stroke="#f59e0b"
                        strokeWidth={4}
                        dot={false}
                        animationDuration={1000}
                    />
                    <Line
                        type="monotone"
                        dataKey="feels"
                        name="Feels Like"
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        animationDuration={1000}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- EXISTING: WIND (Area) ---
export function WindVelocityChart({ data }) {
    const chartData = useMemo(() => {
        if (!data || !data.timestamps) return [];
        return data.timestamps.map((t, i) => ({
            time: t,
            wind: data.windSpeeds[i]
        }));
    }, [data]);

    return (
        <div className="w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.5} />
                    <XAxis
                        dataKey="time"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: '700' }}
                        tickFormatter={(value) => value ? value.slice(11, 16) : ''}
                        minTickGap={60}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: '700' }}
                        axisLine={false}
                        tickLine={false}
                        unit="m/s"
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '10px',
                            color: 'hsl(var(--foreground))'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="wind"
                        name="Wind Speed"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorWind)"
                        animationDuration={1000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
