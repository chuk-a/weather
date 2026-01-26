import React from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceLine } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// --- CONFIG ---
const stationConfig = {
    french: { label: "French Embassy", color: "hsl(221, 83%, 53%)" }, // Blue
    eu: { label: "EU Delegation", color: "hsl(263, 83%, 58%)" }, // Purple
    czech: { label: "Czech Embassy", color: "hsl(330, 81%, 50%)" }, // Pink
    yarmag: { label: "Yarmag", color: "hsl(158, 64%, 52%)" }, // Emerald 500
    chd9: { label: "CHD 9", color: "hsl(24, 95%, 53%)" }, // Orange
    mandakh: { label: "Mandakh", color: "hsl(38, 92%, 50%)" }, // Amber
    chd6: { label: "CHD 6", color: "hsl(250, 84%, 67%)" }, // Indigo
    airv: { label: "Air V", color: "hsl(189, 94%, 43%)" }, // Cyan
};

const tempConfig = {
    temp: { label: "Temperature", color: "hsl(47, 95%, 57%)" }, // Yellow
    feels: { label: "Feels Like", color: "hsl(24, 95%, 65%)" } // Orange-ish
};

const windConfig = {
    wind: { label: "Wind Speed", color: "hsl(217, 91%, 60%)" } // Blue
};

// --- HELPER: Pivot Data (Columns -> Rows) ---
const usePivotData = (data, keys) => {
    return React.useMemo(() => {
        if (!data || !data.timestamps) return [];
        return data.timestamps.map((t, i) => {
            const row = { time: t };
            keys.forEach(k => row[k] = data[k][i]);
            return row;
        });
    }, [data, keys]);
};

export function PMChart({ data, stations }) {
    const chartData = usePivotData(data, stations.map(s => s.id));

    return (
        <Card className="col-span-1 lg:col-span-2 shadow-lg border-white/20 dark:border-slate-800/50 backdrop-blur-md bg-white/40 dark:bg-slate-950/40">
            <CardHeader>
                <CardTitle>District Pollution Levels</CardTitle>
                <CardDescription>PM2.5 concentrations over time</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={stationConfig} className="min-h-[300px] w-full">
                    <AreaChart data={chartData} margin={{ left: -20, right: 10 }}>
                        <defs>
                            {stations.map(s => (
                                <linearGradient key={s.id} id={`fill${s.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={stationConfig[s.id]?.color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={stationConfig[s.id]?.color} stopOpacity={0.05} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis
                            dataKey="time"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => value.slice(11, 16)} // Show HH:mm
                        />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={[0, 'auto']} />
                        <ChartTooltip content={<ChartTooltipContent indicator="dot" labelFormatter={(v) => v} />} />
                        {stations.map(s => (
                            <Area
                                key={s.id}
                                type="monotone"
                                dataKey={s.id}
                                stroke={stationConfig[s.id]?.color}
                                fill={`url(#fill${s.id})`}
                                strokeWidth={2}
                                dot={false}
                            />
                        ))}
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

export function TempChart({ data }) {
    const chartData = usePivotData(data, ['temps', 'feels']);

    return (
        <Card className="shadow-lg border-white/20 dark:border-slate-800/50 backdrop-blur-md bg-white/40 dark:bg-slate-950/40">
            <CardHeader>
                <CardTitle>Temperature</CardTitle>
                <CardDescription>Latest trends (°C)</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={tempConfig} className="min-h-[250px] w-full">
                    <AreaChart data={chartData} margin={{ left: -20, right: 10 }}>
                        <defs>
                            <linearGradient id="fillTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={tempConfig.temp.color} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={tempConfig.temp.color} stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis dataKey="time" tickLine={false} axisLine={false} tickFormatter={(value) => value.slice(11, 16)} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="temps" stroke={tempConfig.temp.color} fill="url(#fillTemp)" strokeWidth={2} name="Temperature" />
                        <Line type="monotone" dataKey="feels" stroke={tempConfig.feels.color} strokeWidth={2} strokeDasharray="4 4" dot={false} name="Feels Like" />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

export function WindChart({ data }) {
    const chartData = usePivotData(data, ['windSpeeds']);

    // Benchmarks (simplified for Recharts)
    const benchmarks = [
        { y: 3.4, label: 'Gentle', color: '#3b82f6' },
        { y: 8.0, label: 'Fresh', color: '#f97316' },
        { y: 13.9, label: 'Gale', color: '#7f1d1d' }
    ];

    return (
        <Card className="shadow-lg border-white/20 dark:border-slate-800/50 backdrop-blur-md bg-white/40 dark:bg-slate-950/40">
            <CardHeader>
                <CardTitle>Wind Speed</CardTitle>
                <CardDescription>Gusts & Benchmarks (m/s)</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={windConfig} className="min-h-[250px] w-full">
                    <BarChart data={chartData} margin={{ left: -20, right: 10 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis dataKey="time" tickLine={false} axisLine={false} tickFormatter={(value) => value.slice(11, 16)} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="windSpeeds" fill={windConfig.wind.color} radius={[4, 4, 0, 0]} name="Wind" />
                        {benchmarks.map((b, i) => (
                            <ReferenceLine key={i} y={b.y} stroke={b.color} strokeDasharray="3 3" label={{ position: 'insideBottomRight', value: b.label, fill: b.color, fontSize: 10 }} />
                        ))}
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
