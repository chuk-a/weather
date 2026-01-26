import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Thermometer, Wind, Droplets, Sun } from 'lucide-react';
import { cn } from "@/lib/utils";

const getAQIMeta = (pm25) => {
    if (pm25 == null) return { color: 'text-zinc-400', label: 'Loading...', border: 'border-zinc-200' };
    if (pm25 <= 12) return { color: 'text-emerald-500', label: 'Good', border: 'border-emerald-500' };
    if (pm25 <= 35) return { color: 'text-amber-500', label: 'Moderate', border: 'border-amber-500' };
    if (pm25 <= 55) return { color: 'text-orange-500', label: 'Sensitive', border: 'border-orange-500' };
    if (pm25 <= 150) return { color: 'text-red-500', label: 'Unhealthy', border: 'border-red-500' };
    return { color: 'text-rose-900', label: 'Hazardous', border: 'border-rose-900' };
};

export function HeroSection({ metrics, lastUpdated }) {
    const meta = getAQIMeta(metrics?.avgAQI);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Main Gauge Card */}
            <Card className="flex flex-col items-center justify-center p-8 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl border-white/20 dark:border-slate-800/50 shadow-xl relative overflow-hidden h-full min-h-[300px]">
                {/* Abstract Background Glow */}
                <div className={cn("absolute inset-0 opacity-10 blur-3xl rounded-full scale-150 transition-colors duration-1000", meta.color.replace('text-', 'bg-'))} />

                <div className="relative z-10 text-center">
                    <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-4">City Average</div>

                    <div className="relative w-48 h-48 flex items-center justify-center mb-6 mx-auto">
                        <div className={cn("absolute w-full h-full rounded-full border-[12px] border-zinc-100 dark:border-zinc-800 transition-colors duration-500 opacity-30")} />
                        <div
                            className={cn("absolute w-full h-full rounded-full border-[12px] border-transparent border-t-current rotate-[-45deg] transition-all duration-1000", meta.color)}
                            style={{ filter: `drop-shadow(0 0 10px currentColor)` }}
                        />
                        <span className={cn("text-7xl font-bold tracking-tight", meta.color)}>
                            {metrics ? metrics.avgAQI : '--'}
                        </span>
                    </div>

                    <div className="text-3xl font-light text-zinc-700 dark:text-zinc-200">{meta.label}</div>
                    <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/50 text-xs text-zinc-500 font-medium font-mono">
                        Sync: {lastUpdated?.slice(11, 16) || '--:--'}
                    </div>
                </div>
            </Card>

            {/* Weather Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <StatBox icon={Thermometer} label="Temperature" value={metrics?.temp ? `${metrics.temp}°` : '--'} color="text-yellow-500" />
                <StatBox icon={Sun} label="Feels Like" value={metrics?.feels ? `${metrics.feels}°` : '--'} color="text-orange-500" />
                <StatBox icon={Droplets} label="Humidity" value={metrics?.humidity ? `${metrics.humidity}%` : '--'} color="text-blue-500" />
                <StatBox icon={Wind} label="Wind Speed" value={metrics?.wind ?? '--'} color="text-slate-500" />
            </div>
        </div>
    );
}

function StatBox({ icon: Icon, label, value, color }) {
    return (
        <Card className="flex flex-col items-center justify-center p-4 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md border-white/20 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all">
            <Icon className={cn("w-6 h-6 mb-2", color)} />
            <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{value}</div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{label}</div>
        </Card>
    )
}
