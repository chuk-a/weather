import React from 'react';
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const getAQIColor = (pm25) => {
    if (pm25 == null) return "text-zinc-500";
    if (pm25 <= 12) return "text-emerald-400"; // Neon Green
    if (pm25 <= 35) return "text-amber-400";   // Neon Amber
    if (pm25 <= 55) return "text-orange-400";
    if (pm25 <= 150) return "text-red-500";
    return "text-rose-600";
};

export function TickerTape({ stations, metrics }) {
    // Duplicate list for seamless loop
    const tickerItems = [...stations, ...stations, ...stations];

    return (
        <div className="h-full bg-zinc-950 flex items-center overflow-hidden">
            <div className="flex whitespace-nowrap animate-ticker">
                {tickerItems.map((s, i) => {
                    const val = metrics?.stations.find(st => st.id === s.id)?.val;
                    const color = getAQIColor(val);

                    return (
                        <div key={`${s.id}-${i}`} className="inline-flex items-center mx-6 text-xs font-mono tracking-wider">
                            <span className="text-zinc-400 mr-2 opacity-50">{s.id.toUpperCase()}</span>
                            <span className={cn("font-bold", color)}>
                                {val ?? '--'}
                            </span>
                            <span className={cn("ml-1", color)}>
                                {val ? '▲' : ''}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
