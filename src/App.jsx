import React, { useState, useMemo } from 'react';
import { useWeatherData } from './hooks/useWeatherData';
import { HeroSection } from './components/HeroSection';
import { ComparisonChart } from './components/Charts';
import { StationTable } from './components/StationTable';
import { TickerTape } from './components/TickerTape';
import { RefreshCw, Wind, Droplets, ThermometerSun } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

function App() {
    const { getFilteredData, getLatestMetrics, loading, error, stations } = useWeatherData();
    const [range, setRange] = useState('today');

    const metrics = getLatestMetrics();
    const chartData = useMemo(() => getFilteredData(range), [getFilteredData, range]);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs tracking-widest uppercase">
            <span className="animate-pulse flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> ESTABLISHING FEED...
            </span>
        </div>
    );

    if (error) return (
        <div className="h-screen flex items-center justify-center bg-zinc-950 text-red-500 font-mono text-xs">
            CONNECTION HOST_ERROR: {error}
        </div>
    );

    return (
        <div className="h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30 font-sans overflow-hidden flex flex-col pt-16">

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-6 py-4 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 h-16">
                <div className="text-sm font-bold tracking-tighter flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    UB.AIR <span className="text-zinc-600 font-mono font-normal uppercase">Command Center</span>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-mono font-medium text-zinc-500">
                    <span className="hidden sm:inline-block">SENSORS: ACTIVE</span>
                    <span className="text-zinc-700">|</span>
                    <div className="flex bg-zinc-900 rounded-sm p-0.5">
                        {['today', 'last7', 'last30'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-2 py-1 rounded-sm transition-colors ${range === r ? "bg-zinc-800 text-zinc-100" : "hover:text-zinc-300"}`}
                            >
                                {r === 'today' ? '1D' : r === 'last7' ? '1W' : '1M'}
                            </button>
                        ))}
                    </div>
                    <span className="text-zinc-700">|</span>
                    <a href="weather_log.csv" download className="hover:text-emerald-400 transition-colors">CSV.EXPORT</a>
                </div>
            </header>

            {/* Main Grid Layout */}
            <main className="flex-1 grid grid-cols-1 md:grid-cols-12 grid-rows-6 gap-4 p-4 overflow-hidden">

                {/* Top Left: Hero Card (Big Number) */}
                <div className="md:col-span-4 md:row-span-3">
                    <Card className="h-full bg-zinc-900/30 border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <HeroSection metrics={metrics} lastUpdated={metrics?.lastUpdated} isCompact={true} />
                    </Card>
                </div>

                {/* Right Block: Data Grid (The detailed list) */}
                <div className="md:col-span-8 md:row-span-4 overflow-hidden flex flex-col">
                    <Card className="flex-1 bg-zinc-900/30 border-zinc-800 flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b border-zinc-900 bg-zinc-950/50 flex justify-between items-center">
                            <h3 className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">Sensor Data Grid</h3>
                            <span className="text-[10px] font-mono text-zinc-600">STATIONS: {stations.length}</span>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar p-2">
                            <StationTable stations={stations} metrics={metrics} />
                        </div>
                    </Card>
                </div>

                {/* Mid Left: Quick Stats (Weather) */}
                <div className="md:col-span-4 md:row-span-1">
                    <div className="grid grid-cols-3 gap-3 h-full">
                        <StatItem icon={<ThermometerSun className="w-4 h-4 text-orange-400" />} label="TEMP" value={`${metrics?.temp}°`} />
                        <StatItem icon={<Wind className="w-4 h-4 text-blue-400" />} label="WIND" value={`${metrics?.wind}m/s`} />
                        <StatItem icon={<Droplets className="w-4 h-4 text-emerald-400" />} label="HUMID" value={`${metrics?.humidity}%`} />
                    </div>
                </div>

                {/* Bottom Span: Comparison Chart */}
                <div className="md:col-span-12 md:row-span-2 overflow-hidden flex flex-col">
                    <Card className="flex-1 bg-zinc-900/30 border-zinc-800 flex flex-col overflow-hidden">
                        <div className="px-4 py-2 border-b border-zinc-900 flex justify-between items-center">
                            <h3 className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">Atmospheric Trendlines</h3>
                            <div className="flex gap-4">
                                <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1.5 cursor-help">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE_FEED
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 p-2">
                            <ComparisonChart data={chartData} stations={stations} />
                        </div>
                    </Card>
                </div>

            </main>

            {/* Ticker Tape Footer */}
            <TickerTape stations={stations} metrics={metrics} />

        </div>
    );
}

function StatItem({ icon, label, value }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-md p-3 flex flex-col items-center justify-center gap-1 group hover:border-zinc-700 transition-colors">
            {icon}
            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-tighter">{label}</span>
            <span className="text-xs font-bold text-zinc-100 font-mono tracking-tighter">{value || '--'}</span>
        </div>
    )
}

export default App;
