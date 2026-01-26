import React, { useState, useMemo } from 'react';
import { useWeatherData } from './hooks/useWeatherData';
import { ComparisonChart } from './components/Charts';
import { StationTable } from './components/StationTable';
import { TickerTape } from './components/TickerTape';
import {
    RefreshCw,
    Wind,
    Droplets,
    ThermometerSun,
    Activity,
    AlertTriangle,
    ShieldCheck,
    LayoutDashboard,
    BarChart3,
    FileText,
    Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function App() {
    const { getFilteredData, getLatestMetrics, loading, error, stations } = useWeatherData();
    const [range, setRange] = useState('today');

    const metrics = getLatestMetrics();
    const chartData = useMemo(() => getFilteredData(range), [getFilteredData, range]);

    // Derived Metrics for Shadcn Cards
    const derived = useMemo(() => {
        if (!metrics) return null;
        const vals = metrics.stations.map(s => s.val).filter(v => v != null);
        return {
            peak: Math.max(...vals),
            activeSensors: vals.length,
            status: metrics.avgAQI <= 35 ? "HEALTH_OPTIMAL" : (metrics.avgAQI <= 150 ? "MITIGATION_REQUIRED" : "CRITICAL_HAZARD")
        };
    }, [metrics]);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-xs tracking-widest uppercase">
            <span className="animate-pulse flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> SYNCHRONIZING SENSOR NETWORK...
            </span>
        </div>
    );

    if (error) return (
        <div className="h-screen flex items-center justify-center bg-zinc-950 text-red-500 font-mono text-xs">
            NETWORK_FAILURE: {error}
        </div>
    );

    return (
        <div className="h-screen bg-zinc-950 text-zinc-50 selection:bg-emerald-500/30 font-sans overflow-hidden flex flex-col">

            {/* --- TOP NAVIGATION (Shadcn Style) --- */}
            <nav className="h-16 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 transition-opacity hover:opacity-80 cursor-default">
                        <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Activity className="w-4 h-4 text-zinc-950" />
                        </div>
                        <span className="font-bold tracking-tighter text-lg">UB.AIR</span>
                    </div>

                    <div className="hidden md:flex items-center gap-4 text-sm">
                        <NavButton active icon={<LayoutDashboard className="w-4 h-4" />}>Overview</NavButton>
                        <NavButton icon={<BarChart3 className="w-4 h-4" />}>Analytics</NavButton>
                        <NavButton icon={<FileText className="w-4 h-4" />}>Reports</NavButton>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-zinc-900 rounded-lg p-1 mr-2">
                        {['today', 'last7', 'last30'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={cn(
                                    "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
                                    range === r ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {r === 'today' ? '1D' : r === 'last7' ? '1W' : '1M'}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 bg-zinc-100 text-zinc-950 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-300 transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </nav>

            {/* --- MAIN DASHBOARD AREA --- */}
            <main className="flex-1 p-6 overflow-hidden flex flex-col gap-6">

                {/* Top Row: Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                    <MetricCard
                        title="City Concentration"
                        value={metrics?.avgAQI}
                        unit="µg/m³"
                        desc="Estimated mean (PM2.5)"
                        color={metrics?.avgAQI > 55 ? "text-red-500" : "text-emerald-500"}
                        icon={<Activity className="w-4 h-4" />}
                    />
                    <MetricCard
                        title="Regional Peak"
                        value={derived?.peak}
                        unit="µg/m³"
                        desc="Highest active recording"
                        color="text-rose-500"
                        icon={<AlertTriangle className="w-4 h-4" />}
                    />
                    <MetricCard
                        title="Sensor Network"
                        value={derived?.activeSensors}
                        unit="NODE"
                        desc="Active monitoring stations"
                        color="text-blue-400"
                        icon={<ShieldCheck className="w-4 h-4" />}
                    />
                    <MetricCard
                        title="Atmos Conditions"
                        value={`${metrics?.temp}°`}
                        unit="CELSIUS"
                        desc={`${metrics?.humidity}% Humidity | ${metrics?.wind}m/s Wind`}
                        color="text-amber-400"
                        icon={<ThermometerSun className="w-4 h-4" />}
                    />
                </div>

                {/* Middle Row: Split View */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-7 gap-6 min-h-0 overflow-hidden">

                    {/* Left Col: Trends (Main Chart) */}
                    <Card className="lg:col-span-4 bg-zinc-900/20 border-zinc-900 flex flex-col overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 h-14 shrink-0">
                            <div>
                                <CardTitle className="text-sm font-bold tracking-tight">Pollution Trends</CardTitle>
                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">HISTORICAL CONCENTRATION ANALYSIS</p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                LIVE_FEED
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-4 min-h-0">
                            <ComparisonChart data={chartData} stations={stations} />
                        </CardContent>
                    </Card>

                    {/* Right Col: District Rankings */}
                    <Card className="lg:col-span-3 bg-zinc-900/20 border-zinc-900 flex flex-col overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 h-14 shrink-0">
                            <div>
                                <CardTitle className="text-sm font-bold tracking-tight">District Standings</CardTitle>
                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">RANKED BY ATMOSPHERIC QUALITY</p>
                            </div>
                            <button className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors uppercase">
                                View List
                            </button>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto custom-scrollbar px-2 pb-2">
                            <div className="h-full">
                                <StationTable stations={stations} metrics={metrics} isCompact={true} />
                            </div>
                        </CardContent>
                    </Card>

                </div>

            </main>

            {/* --- BOTTOM FEED --- */}
            <div className="shrink-0 h-10 border-t border-zinc-900 bg-zinc-950/50">
                <TickerTape stations={stations} metrics={metrics} />
            </div>

        </div>
    );
}

function NavButton({ children, active, icon }) {
    return (
        <button className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all duration-200",
            active ? "bg-zinc-900 text-zinc-50 shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
        )}>
            {icon}
            {children}
        </button>
    );
}

function MetricCard({ title, value, unit, desc, icon, color }) {
    return (
        <Card className="bg-zinc-900/30 border-zinc-900 group hover:border-zinc-700 transition-all duration-300 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-widest">{title}</CardTitle>
                <div className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-1.5">
                    <div className={cn("text-3xl font-bold tracking-tight tabular-nums", color)}>{value ?? '--'}</div>
                    <div className="text-[10px] font-mono text-zinc-600 font-bold uppercase">{unit}</div>
                </div>
                <p className="text-[10px] text-zinc-600 font-mono mt-1 uppercase tracking-tighter">
                    {desc}
                </p>
            </CardContent>
        </Card>
    );
}

export default App;
