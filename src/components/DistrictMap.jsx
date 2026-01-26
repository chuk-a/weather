import React, { useMemo } from 'react';
import { cn } from "@/lib/utils";

const getAQIColor = (val) => {
    if (val == null) return "fill-muted/30 stroke-border";
    if (val <= 12) return "fill-emerald-500/20 stroke-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
    if (val <= 35) return "fill-amber-500/20 stroke-amber-500";
    if (val <= 55) return "fill-orange-500/20 stroke-orange-500";
    if (val <= 150) return "fill-red-500/20 stroke-red-500";
    return "fill-rose-900/40 stroke-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.3)]";
};

export function DistrictMap({ metrics, stations }) {
    // Group stations into geographic zones
    const zones = useMemo(() => {
        if (!metrics) return null;

        const getAvg = (ids) => {
            const vals = metrics.stations
                .filter(s => ids.includes(s.id))
                .map(s => s.val)
                .filter(v => v != null);
            return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
        };

        return {
            north: getAvg(['chd6', 'chd9', 'mandakh']), // Ger District / Northern hills
            central: getAvg(['french', 'eu', 'czech']), // Business center / Embassies
            south: getAvg(['yarmag', 'airv'])           // Southern expansion / Yarmag
        };
    }, [metrics]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 select-none">
            <svg viewBox="0 0 400 300" className="w-full h-full max-w-[320px] drop-shadow-2xl">
                {/* Background Grid Pattern */}
                <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted/10" />
                    </pattern>
                </defs>
                <rect width="400" height="300" fill="url(#grid)" />

                {/* NORTH ZONE */}
                <path
                    d="M 50 120 L 200 80 L 350 120 L 320 180 L 80 180 Z"
                    className={cn("transition-all duration-700 ease-in-out stroke-[1.5]", getAQIColor(zones?.north))}
                    style={{ filter: zones?.north > 150 ? 'url(#glow-red)' : 'none' }}
                />

                {/* CENTRAL CORE */}
                <path
                    d="M 120 180 L 280 180 L 260 220 L 140 220 Z"
                    className={cn("transition-all duration-700 ease-in-out stroke-[2]", getAQIColor(zones?.central))}
                />

                {/* SOUTH ZONE */}
                <path
                    d="M 100 220 L 300 220 L 320 260 L 80 260 Z"
                    className={cn("transition-all duration-700 ease-in-out stroke-[1.5]", getAQIColor(zones?.south))}
                />

                {/* GLOW DEFS */}
                <defs>
                    <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* ZONE LABELS */}
                <text x="200" y="130" className="text-[10px] font-bold fill-muted-foreground/50 pointer-events-none uppercase tracking-widest text-center" textAnchor="middle">
                    Northern Highs
                </text>
                <text x="200" y="200" className="text-[10px] font-bold fill-muted-foreground/80 pointer-events-none uppercase tracking-widest text-center" textAnchor="middle" style={{ fill: 'currentColor' }}>
                    Central Core
                </text>
                <text x="200" y="245" className="text-[10px] font-bold fill-muted-foreground/50 pointer-events-none uppercase tracking-widest text-center" textAnchor="middle">
                    Southern Valley
                </text>

                {/* STATION DOTS */}
                {stations.map((s, i) => {
                    // Primitive mapping for now
                    const pos = {
                        'chd9': [120, 140], 'chd6': [280, 140], 'mandakh': [200, 110],
                        'french': [180, 200], 'eu': [220, 200], 'czech': [200, 208],
                        'yarmag': [150, 240], 'airv': [250, 240]
                    }[s.id] || [200, 150];

                    const val = metrics?.stations.find(st => st.id === s.id)?.val;

                    return (
                        <g key={s.id}>
                            <circle
                                cx={pos[0]}
                                cy={pos[1]}
                                r="3"
                                className={cn("transition-all duration-500 fill-foreground", val == null && "fill-muted")}
                            />
                            {val > 150 && (
                                <circle
                                    cx={pos[0]}
                                    cy={pos[1]}
                                    r="6"
                                    className="fill-red-500 animate-ping opacity-20"
                                />
                            )}
                        </g>
                    );
                })}
            </svg>

            <div className="mt-4 grid grid-cols-3 gap-8 w-full max-w-[320px]">
                <HeatmapStat label="NORTH" val={zones?.north} />
                <HeatmapStat label="CORE" val={zones?.central} />
                <HeatmapStat label="SOUTH" val={zones?.south} />
            </div>
        </div>
    );
}

function HeatmapStat({ label, val }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-[8px] font-mono font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</span>
            <span className={cn(
                "text-sm font-black font-mono",
                val == null ? "text-muted" : (val > 150 ? "text-red-500" : "text-emerald-500")
            )}>
                {val ?? '--'}
            </span>
        </div>
    );
}
