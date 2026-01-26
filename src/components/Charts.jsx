import React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

// --- HELPER: Pivot Data (Columns -> Rows) ---
const usePivotData = (data, keys) => {
    return React.useMemo(() => {
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

export function CityMeanChart({ data }) {
    const chartData = usePivotData(data, []);

    return (
        <div className="w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                    <XAxis
                        dataKey="time"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'monospace' }}
                        tickFormatter={(value) => value ? value.slice(11, 16) : ''}
                        minTickGap={50}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'monospace' }}
                        domain={[0, 'auto']}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                        itemStyle={{ color: '#10b981' }}
                        labelStyle={{ color: '#71717a', fontSize: '10px', fontFamily: 'monospace', marginBottom: '4px' }}
                        formatter={(value) => [value, 'µg/m³']}
                        labelFormatter={(l) => `TIME: ${l}`}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ComparisonChart({ data, stations }) {
    const chartData = usePivotData(data, stations.map(s => s.id));
    const colors = [
        "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
        "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"
    ];

    return (
        <div className="w-full h-full min-h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#27272a" strokeDasharray="3 3" />
                    <XAxis
                        dataKey="time"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'monospace' }}
                        tickFormatter={(value) => value ? value.slice(11, 16) : ''}
                        minTickGap={50}
                    />
                    <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: '#52525b', fontSize: 10, fontFamily: 'monospace' }}
                        domain={[0, 'auto']}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                        labelStyle={{ color: '#71717a', fontSize: '10px', fontFamily: 'monospace', marginBottom: '4px' }}
                        labelFormatter={(l) => `TIME: ${l}`}
                        formatter={(value) => [value, 'µg/m³']}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '20px' }} />
                    {stations.map((s, i) => (
                        <Line
                            key={s.id}
                            type="monotone"
                            dataKey={s.id}
                            stroke={colors[i % colors.length]}
                            strokeWidth={2}
                            name={s.label}
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
