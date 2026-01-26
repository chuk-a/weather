import React from 'react';
import { cn } from "@/lib/utils";
import { ArrowUpRight, Cloud, Wind, Droplets } from 'lucide-react';

const getAQIMeta = (pm25) => {
    if (pm25 == null) return { color: 'text-zinc-500', bg: 'bg-zinc-500/10', label: 'OFFLINE' };
    if (pm25 <= 12) return { color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'GOOD' };
    if (pm25 <= 35) return { color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'MODERATE' };
    if (pm25 <= 55) return { color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'SENSITIVE' };
    if (pm25 <= 150) return { color: 'text-red-500', bg: 'bg-red-500/10', label: 'UNHEALTHY' };
    return { color: 'text-rose-600', bg: 'bg-rose-600/10', label: 'HAZARDOUS' };
};

export function HeroSection({ metrics, lastUpdated }) {
    const meta = getAQIMeta(metrics?.avgAQI);

    return (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-700">

            {/* Badge */}
            {/* Badge */}
            <div className={cn("px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest mb-6 flex items-center gap-2 border border-current/20", meta.color, meta.bg)}>
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                </span>
                {meta.label} AIR
            </div>

            {/* The Big Number */}
            <div className="flex items-baseline gap-2">
                <h1 className={cn("text-9xl md:text-[12rem] font-black tracking-tighter leading-none tabular-nums", meta.color)}>
                    {metrics ? metrics.avgAQI : '--'}
                </h1>
                <span className="text-2xl md:text-4xl font-bold text-zinc-600 mb-8 md:mb-12">µg/m³</span>
            </div>

            <div className="mt-4 flex items-center gap-6 text-zinc-400 font-mono text-sm">
                <span className="flex items-center gap-2 text-emerald-400">
                    <ArrowUpRight className="w-4 h-4" />
                    REAL-TIME INDEX
                </span>
                <span>
                    UB.CITY • {lastUpdated?.slice(11) || '--:--'}
                </span>
            </div>

            {/* Grid Stats */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-12 w-full max-w-2xl px-6 border-t border-zinc-800 pt-8">
                <Stat label="TEMP" value={metrics?.temp ? `${metrics.temp}°` : '--'} icon={Cloud} />
                <Stat label="WIND" value={metrics?.wind ? `${metrics.wind}` : '--'} unit="m/s" icon={Wind} />
                <Stat label="HUMID" value={metrics?.humidity ? `${metrics.humidity}` : '--'} unit="%" icon={Droplets} />
            </div>

        </div>
    );
}

function Stat({ label, value, unit, icon: Icon }) {
    return (
        <div className="flex flex-col items-center gap-1 group">
            <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1 group-hover:text-zinc-300 transition-colors flex items-center gap-2">
                <Icon className="w-3 h-3" /> {label}
            </div>
            <div className="text-3xl font-bold text-zinc-100 tabular-nums">
                {value}<span className="text-zinc-600 text-lg ml-0.5">{unit}</span>
            </div>
        </div>
    )
}
