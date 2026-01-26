import React from 'react';
import { cn } from "@/lib/utils";

const getAQIColor = (pm25) => {
    if (pm25 == null) return "text-zinc-300";
    if (pm25 <= 12) return "text-emerald-600";
    if (pm25 <= 35) return "text-amber-600";
    if (pm25 <= 55) return "text-orange-600";
    if (pm25 <= 150) return "text-red-500";
    return "text-rose-600";
};

export function TickerTape({ stations, metrics }) {
    // Duplicate list for seamless loop
    const tickerItems = [...stations, ...stations, ...stations];

    return (
        <div className="h-full bg-white flex items-center overflow-hidden">
            <div className="flex whitespace-nowrap animate-ticker">
                {tickerItems.map((s, i) => {
                    const val = metrics?.stations.find(st => st.id === s.id)?.val;
                    const color = getAQIColor(val);

                    return (
                        <div key={`${s.id}-${i}`} className="inline-flex items-center mx-8 text-[11px] font-mono font-bold tracking-tight">
                            <span className="text-zinc-400 mr-2 uppercase tracking-widest">{s.id}</span>
                            <span className={cn("font-black", color)}>
                                {val ?? '--'}
                            </span>
                            <span className={cn("ml-1 text-[10px]", color)}>
                                {val ? 'µg' : ''}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
