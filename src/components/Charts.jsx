import React from 'react';
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
} from 'recharts';

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
                            backgroundColor: '#fff',
                            border: '1px solid #e4e4e7',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: '#18181b'
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

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
                    <CartesianGrid vertical={false} stroke="#f1f1f2" strokeDasharray="3 3" />
                    <XAxis
                        dataKey="time"
                        tick={{ fill: '#a1a1aa', fontSize: 9, fontWeight: '700' }}
                        tickFormatter={(value) => value ? value.slice(11, 16) : ''}
                        minTickGap={60}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tick={{ fill: '#a1a1aa', fontSize: 9, fontWeight: '700' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #f1f1f2',
                            borderRadius: '8px',
                            fontSize: '10px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
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
