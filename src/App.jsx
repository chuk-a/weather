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
        <div className="h-screen flex items-center justify-center bg-white text-zinc-500 font-mono text-xs tracking-widest uppercase">
            <span className="animate-pulse flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> SYNCHRONIZING SENSOR NETWORK...
            </span>
        </div>
    );

    if (error) return (
        <div className="h-screen flex items-center justify-center bg-white text-red-500 font-mono text-xs font-bold px-10 text-center">
            NETWORK_CONNECTION_FAILURE: {error}
        </div>
    );

    return (
        <div className="h-screen bg-zinc-50 text-zinc-950 font-sans overflow-hidden flex flex-col">

            {/* SHADCN TOP NAV */}
            <nav className="h-14 border-b border-zinc-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center shadow-sm">
                            <Activity className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold tracking-tighter text-lg bg-clip-text text-zinc-900">UB.AIR</span>
                    </div>

                    <div className="hidden md:flex items-center gap-4 text-sm font-medium">
                        <NavButton active icon={<LayoutDashboard className="w-4 h-4 text-emerald-600" />}>Overview</NavButton>
                        <NavButton icon={<BarChart3 className="w-4 h-4" />}>Analytics</NavButton>
                        <NavButton icon={<FileText className="w-4 h-4" />}>Reports</NavButton>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-zinc-100/80 rounded-lg p-1">
                        {['today', 'last7', 'last30'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={cn(
                                    "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all duration-200",
                                    range === r ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                                )}
                            >
                                {r === 'today' ? '1D' : r === 'last7' ? '1W' : '1M'}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all shadow-sm active:scale-95">
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                </div>
            </nav>

            {/* DASHBOARD CONTENT */}
            <main className="flex-1 p-6 overflow-hidden flex flex-col gap-6">

                {/* Metric Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                    <MetricCard
                        title="City Mean (PM2.5)"
                        value={metrics?.avgAQI}
                        unit="µg/m³"
                        desc="Estimated urban average"
                        color={metrics?.avgAQI > 55 ? "text-orange-600" : "text-emerald-600"}
                        icon={<Activity className="w-4 h-4 text-emerald-500" />}
                    />
                    <MetricCard
                        title="High Pollution Alert"
                        value={derived?.peak}
                        unit="µg/m³"
                        desc="Peak regional recording"
                        color="text-red-600 font-extrabold"
                        icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
                    />
                    <MetricCard
                        title="Sensor Coverage"
                        value={derived?.activeSensors}
                        unit="NODES"
                        desc="Stations reporting live data"
                        color="text-blue-600"
                        icon={<ShieldCheck className="w-4 h-4 text-blue-500" />}
                    />
                    <MetricCard
                        title="Atmosphere"
                        value={`${metrics?.temp}°`}
                        unit="TEMP"
                        desc={`${metrics?.humidity}% Humid | ${metrics?.wind}m/s Wind`}
                        color="text-amber-600"
                        icon={<ThermometerSun className="w-4 h-4 text-amber-500" />}
                    />
                </div>

                {/* Analytics Layer */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-7 gap-6 min-h-0 overflow-hidden">

                    {/* Trends */}
                    <Card className="lg:col-span-4 bg-white border-zinc-200 flex flex-col overflow-hidden shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 h-14 shrink-0 border-b border-zinc-50">
                            <div>
                                <CardTitle className="text-sm font-bold text-zinc-900 tracking-tight">Pollution Trend Analysis</CardTitle>
                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-tighter">Temporal Concentration Mapping</p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                NETWORK_ONLINE
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-4 min-h-0">
                            <ComparisonChart data={chartData} stations={stations} isLight={true} />
                        </CardContent>
                    </Card>

                    {/* Standings */}
                    <Card className="lg:col-span-3 bg-white border-zinc-200 flex flex-col overflow-hidden shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 h-14 shrink-0 border-b border-zinc-50">
                            <div>
                                <CardTitle className="text-sm font-bold text-zinc-900 tracking-tight">Regional Standings</CardTitle>
                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-tighter">Ranked by Atmospheric Index</p>
                            </div>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">
                                Live Data
                            </span>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto custom-scrollbar p-0">
                            <StationTable stations={stations} metrics={metrics} isCompact={true} isLight={true} />
                        </CardContent>
                    </Card>

                </div>

            </main>

            {/* FOOTER TICKER */}
            <div className="shrink-0 h-10 border-t border-zinc-200 bg-white shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
                <TickerTape stations={stations} metrics={metrics} isLight={true} />
            </div>

        </div>
    );
}

function NavButton({ children, active, icon }) {
    return (
        <button className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-[13px] transition-all duration-200",
            active ? "bg-zinc-100 text-zinc-950" : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50"
        )}>
            {icon}
            {children}
        </button>
    );
}

function MetricCard({ title, value, unit, desc, icon, color }) {
    return (
        <Card className="bg-white border-zinc-200 group hover:border-zinc-300 transition-all duration-300 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                {icon}
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-1.5 space-y-0">
                <CardTitle className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-1.5 pt-1">
                    <div className={cn("text-4xl font-black tracking-tighter tabular-nums", color)}>{value ?? '--'}</div>
                    <div className="text-[11px] font-mono text-zinc-400 font-bold uppercase">{unit}</div>
                </div>
                <p className="text-[10px] text-zinc-500 font-bold font-mono mt-2 flex items-center gap-1.5 uppercase tracking-tighter">
                    {desc}
                </p>
            </CardContent>
        </Card>
    );
}

export default App;
