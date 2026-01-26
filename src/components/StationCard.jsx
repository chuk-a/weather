import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const getAQIMeta = (pm25) => {
    if (pm25 == null) return { color: 'text-muted-foreground', label: 'Offline', indicator: 'bg-muted' };
    if (pm25 <= 12) return { color: 'text-emerald-500', label: 'Good', indicator: 'bg-emerald-500' };
    if (pm25 <= 35) return { color: 'text-amber-500', label: 'Moderate', indicator: 'bg-amber-500' };
    if (pm25 <= 55) return { color: 'text-orange-500', label: 'Sensitive', indicator: 'bg-orange-500' };
    if (pm25 <= 150) return { color: 'text-red-500', label: 'Unhealthy', indicator: 'bg-red-500' };
    return { color: 'text-rose-900', label: 'Hazardous', indicator: 'bg-rose-900' };
};

export function StationCard({ station, val, time }) {
    const meta = getAQIMeta(val);

    return (
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md border-white/20 dark:border-slate-800/50">
            <div
                className={cn(
                    "absolute top-4 right-4 w-2.5 h-2.5 rounded-full transition-all duration-500 shadow-[0_0_8px_currentColor]",
                    meta.indicator,
                    val != null ? "animate-pulse" : ""
                )}
            />

            <CardHeader className="p-4 pb-0">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <span>{station.flag}</span>
                    {station.label}
                </CardTitle>
            </CardHeader>

            <CardContent className="p-4 pt-2">
                <div className={cn("text-4xl font-bold tracking-tighter", meta.color)}>
                    {val ?? '--'}
                </div>

                <div className="flex justify-between items-end mt-2">
                    <span className={cn("text-xs font-semibold uppercase tracking-wider", meta.color)}>
                        {meta.label}
                    </span>
                    {time && (
                        <span className="text-[10px] text-muted-foreground/70 font-mono">
                            {time}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
