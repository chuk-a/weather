import React, { useState, useMemo } from 'react';
import { useWeatherData } from './hooks/useWeatherData';
import { HeroSection } from './components/HeroSection';
import { MarketChart } from './components/Charts';
import { TickerTape } from './components/TickerTape';
import { AnalyticsView } from './components/AnalyticsView';
import { RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function App() {
    const { filteredData, getFilteredData, getLatestMetrics, loading, error, stations } = useWeatherData();
    const [range, setRange] = useState('today');
    const [activeTab, setActiveTab] = useState('monitor'); // monitor | analytics

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
            <header className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-6 py-4 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 transition-all duration-300">
                <div className="text-sm font-bold tracking-tighter flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    UB.AIR <span className="text-zinc-600 font-mono font-normal">MONITOR</span>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-mono font-medium text-zinc-500">
                    <span className="hidden sm:inline-block">SENSORS: ACTIVE</span>
                    <span className="text-zinc-700">|</span>
                    <button onClick={() => setRange('today')} className={range === 'today' ? "text-zinc-100" : "hover:text-zinc-300 transition-colors"}>1D</button>
                    <button onClick={() => setRange('last7')} className={range === 'last7' ? "text-zinc-100" : "hover:text-zinc-300 transition-colors"}>1W</button>
                    <button onClick={() => setRange('last30')} className={range === 'last30' ? "text-zinc-100" : "hover:text-zinc-300 transition-colors"}>1M</button>
                    <span className="text-zinc-700">|</span>
                    <a href="weather_log.csv" download className="hover:text-emerald-400 transition-colors">CSV.EXPORT</a>
                </div>
            </header>

            <main className="pt-24 container mx-auto px-4 max-w-5xl mb-20">

                <Tabs defaultValue="monitor" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex justify-center mb-8">
                        <TabsList className="bg-zinc-900/50 border border-zinc-800">
                            <TabsTrigger value="monitor" className="text-xs uppercase tracking-widest data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400">
                                Live Monitor
                            </TabsTrigger>
                            <TabsTrigger value="analytics" className="text-xs uppercase tracking-widest data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400">
                                Analytics
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="monitor" className="outline-none">
                        {/* The Big Number */}
                        <HeroSection metrics={metrics} lastUpdated={metrics?.lastUpdated} />

                        {/* The Market Chart */}
                        <div className="mt-12 h-[400px] w-full border-t border-zinc-900/50 pt-8 animate-in sticky top-24">
                            <h3 className="text-xs font-mono text-zinc-500 mb-4 tracking-widest uppercase">
                                City Pollution Trend (PM2.5)
                            </h3>
                            <MarketChart data={chartData} />
                        </div>
                    </TabsContent>

                    <TabsContent value="analytics" className="outline-none">
                        <AnalyticsView chartData={chartData} stations={stations} metrics={metrics} />
                    </TabsContent>
                </Tabs>

            </main>

            {/* Ticker Tape Footer */}
            <TickerTape stations={stations} metrics={metrics} />

        </div>
    );
}

export default App;
