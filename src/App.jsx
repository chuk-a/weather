import React, { useState, useMemo } from 'react';
import { useWeatherData } from './hooks/useWeatherData';
import { HeroSection } from './components/HeroSection';
import { MarketChart } from './components/Charts';
import { TickerTape } from './components/TickerTape';
import { RefreshCw, Download } from 'lucide-react';
import { motion } from "framer-motion";

function App() {
    const { filteredData, getFilteredData, getLatestMetrics, loading, error, stations } = useWeatherData();
    // Fixed range for "Market View" (usually today or 24h)
    const [range, setRange] = useState('today');

    const metrics = getLatestMetrics();
    const chartData = useMemo(() => getFilteredData(range), [getFilteredData, range]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs tracking-widest uppercase">
            <span className="animate-pulse flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> ESTABLISHING FEED...
            </span>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-red-500 font-mono text-xs">
            CONNECTION HOST_ERROR: {error}
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30 font-sans pb-20 overflow-x-hidden">

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-6 py-4 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900">
                <div className="text-sm font-bold tracking-tighter flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    UB.AIR <span className="text-zinc-600 font-mono font-normal">TERMINAL</span>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-mono font-medium text-zinc-500">
                    <span className="hidden sm:inline-block">MARKET: OPEN</span>
                    <span className="text-zinc-700">|</span>
                    <button onClick={() => setRange('today')} className={range === 'today' ? "text-zinc-100" : "hover:text-zinc-300"}>1D</button>
                    <button onClick={() => setRange('last7')} className={range === 'last7' ? "text-zinc-100" : "hover:text-zinc-300"}>1W</button>
                    <button onClick={() => setRange('last30')} className={range === 'last30' ? "text-zinc-100" : "hover:text-zinc-300"}>1M</button>
                    <span className="text-zinc-700">|</span>
                    <a href="weather_log.csv" download className="hover:text-emerald-400 transition-colors">CSV.EXPORT</a>
                </div>
            </header>

            <main className="pt-24 container mx-auto px-4 max-w-5xl">
                {/* The Big Number */}
                <HeroSection metrics={metrics} lastUpdated={metrics?.lastUpdated} />

                {/* The Market Chart */}
                <div className="mt-12 h-[400px] w-full border-t border-zinc-900/50 pt-8 animate-in sticky top-24">
                    <h3 className="text-xs font-mono text-zinc-500 mb-4 tracking-widest uppercase">
                        Market Trend (PM2.5 AVG)
                    </h3>
                    <MarketChart data={chartData} />
                </div>
            </main>

            {/* Ticker Tape Footer */}
            <TickerTape stations={stations} metrics={metrics} />

        </div>
    );
}

export default App;
