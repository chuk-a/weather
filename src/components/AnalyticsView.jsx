import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComparisonChart } from './Charts';
import { StationTable } from './StationTable';

export function AnalyticsView({ chartData, stations, metrics }) {
    return (
        <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Chart Section */}
            <Card className="bg-zinc-950 border-zinc-900 border-l-4 border-l-emerald-500 shadow-xl">
                <CardHeader>
                    <CardTitle className="text-zinc-100 uppercase tracking-widest text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Sector Performance
                    </CardTitle>
                    <CardDescription className="text-zinc-500 font-mono text-xs">
                        Comparative analysis of all sensor stations over time.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ComparisonChart data={chartData} stations={stations} />
                </CardContent>
            </Card>

            {/* Data Grid Section */}
            <Card className="bg-zinc-950 border-zinc-900 border-l-4 border-l-amber-500 shadow-xl">
                <CardHeader>
                    <CardTitle className="text-zinc-100 uppercase tracking-widest text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full" /> Sensor Data Grid
                    </CardTitle>
                    <CardDescription className="text-zinc-500 font-mono text-xs">
                        Detailed telemetry sorted by pollution levels.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <StationTable stations={stations} metrics={metrics} />
                </CardContent>
            </Card>

        </div>
    );
}
