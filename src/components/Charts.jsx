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
    Cell
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
                const stationIds = ['french', 'eu', 'czech', 'yarmag', 'chd9', 'mandakh', 'chd6', 'airv'];
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

// --- NEW: RADIAL GAUGE (Shadcn Style) ---
export function AirRadialChart({ value }) {
    // Normalize value (0-300 range for AQI)
    const data = [{ name: 'AQI', value: value || 0, fill: '#10b981' }];

    return (
        <div className="w-full h-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="80%"
                    outerRadius="110%"
                    barSize={6}
                    data={data}
                    startAngle={225}
                    endAngle={-45}
                >
                    <RadialBar
                        minAngle={15}
                        background={{ fill: 'hsl(var(--muted)/0.3)' }}
                        clockWise
                        dataKey="value"
                        cornerRadius={10}
                    />
                </RadialBarChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- NEW: SPATIAL RADAR (Shadcn Style) ---
export function SpatialRadarChart({ stations, metrics }) {
    const data = useMemo(() => {
        if (!metrics) return [];
        return stations.map(s => {
            const stats = metrics.stations.find(st => st.id === s.id);
            return {
                subject: s.id.toUpperCase(),
                value: stats?.val || 0,
                fullMark: 300,
            };
        });
    }, [stations, metrics]);

    return (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <Radar
                        name="AQI"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="#10b981"
                        fillOpacity={0.4}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--foreground))',
                            fontSize: '10px',
                            borderRadius: '8px'
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- EXISTING: CITY MEAN (Area) ---
export function CityMeanChart({ data }) {
    const chartData = usePivotData(data, []);

    return (
        <div className="w-full h-full min-h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorVal)"
                        animationDuration={1500}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: 'hsl(var(--foreground))'
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- EXISTING: COMPARISON (Lines) ---
export function ComparisonChart({ data, stations }) {
    const chartData = usePivotData(data, stations.map(s => s.id));

    const colors = [
        '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#f97316', '#06b6d4'
    ];

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
                    {stations.map((s, i) => (
                        <Line
                            key={s.id}
                            type="monotone"
                            dataKey={s.id}
                            name={s.label}
                            stroke={colors[i % colors.length]}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                            animationDuration={1000}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
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
