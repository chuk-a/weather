import React, { useState, useMemo, useEffect } from 'react';
import { useWeatherData } from './hooks/useWeatherData';
import {
    ComparisonChart,
    AtmosphereTrendChart,
    WindVelocityChart,
    AirRadialChart,
    SpatialRadarChart
} from './components/Charts';
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
    Download,
    Moon,
    Sun,
    Radar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function App() {
    const { getFilteredData, getLatestMetrics, loading, error, stations } = useWeatherData();
    const [range, setRange] = useState('today');
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    const metrics = getLatestMetrics();
    const chartData = useMemo(() => getFilteredData(range), [getFilteredData, range]);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

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
        <div className="h-screen flex items-center justify-center bg-background text-muted-foreground font-mono text-xs tracking-widest uppercase">
            <span className="animate-pulse flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> SYNCHRONIZING SENSOR NETWORK...
            </span>
        </div>
    );

    if (error) return (
        <div className="h-screen flex items-center justify-center bg-background text-destructive font-mono text-xs font-bold px-10 text-center">
            NETWORK_CONNECTION_FAILURE: {error}
        </div>
    );

    return (
        <div className="h-screen bg-background text-foreground font-sans overflow-hidden flex flex-col transition-colors duration-300">

            {/* SHADCN TOP NAV */}
            <nav className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center shadow-sm">
                            <Activity className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold tracking-tighter text-lg">UB.AIR</span>
                    </div>

                    <div className="hidden md:flex items-center gap-4 text-sm font-medium">
                        <NavButton active icon={<LayoutDashboard className="w-4 h-4" />}>Overview</NavButton>
                        <NavButton icon={<BarChart3 className="w-4 h-4" />}>Analytics</NavButton>
                        <NavButton icon={<FileText className="w-4 h-4" />}>Reports</NavButton>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-muted-foreground hover:text-foreground"
                    >
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </button>
                    <div className="h-4 w-[1px] bg-border mx-1" />
                    <div className="flex bg-muted/50 rounded-lg p-1">
                        {['today', 'last7', 'last30'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={cn(
                                    "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all duration-200",
                                    range === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {r === 'today' ? '1D' : r === 'last7' ? '1W' : '1M'}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-all shadow-sm active:scale-95">
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Export</span>
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
                        color={metrics?.avgAQI > 55 ? "text-orange-500" : "text-emerald-500"}
                        icon={<AirRadialChart value={metrics?.avgAQI} />}
                        isSplit={true}
                    />
                    <MetricCard
                        title="High Pollution"
                        value={derived?.peak}
                        unit="µg/m³"
                        desc="Peak regional recording"
                        color="text-red-500 font-extrabold"
                        icon={<AlertTriangle className="w-4 h-4 text-red-500 opacity-20" />}
                    />
                    <MetricCard
                        title="Sensor Coverage"
                        value={derived?.activeSensors}
                        unit="NODES"
                        desc="Stations reporting live data"
                        color="text-blue-500 font-bold"
                        icon={<ShieldCheck className="w-4 h-4 text-blue-500 opacity-20" />}
                    />
                    <MetricCard
                        title="Atmosphere"
                        value={`${metrics?.temp}°`}
                        unit="TEMP"
                        desc={`${metrics?.feels || '--'}° Feels | ${metrics?.humidity}% Hum | ${metrics?.wind}m/s Wind`}
                        color="text-amber-500 font-bold"
                        icon={<ThermometerSun className="w-4 h-4 text-amber-500 opacity-20" />}
                    />
                </div>

                {/* Analytics Layer */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-7 gap-6 min-h-0 overflow-hidden">

                    {/* Trends Tab System */}
                    <Card className="lg:col-span-4 bg-card border-border flex flex-col overflow-hidden shadow-sm">
                        <Tabs defaultValue="pollution" className="flex-1 flex flex-col overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-1 h-14 shrink-0 border-b border-border/50 px-4">
                                <TabsList className="bg-muted/50 h-8">
                                    <TabsTrigger value="pollution" className="text-[10px] font-bold py-1">Pollution</TabsTrigger>
                                    <TabsTrigger value="temp" className="text-[10px] font-bold py-1">Temperature</TabsTrigger>
                                    <TabsTrigger value="wind" className="text-[10px] font-bold py-1">Wind</TabsTrigger>
                                    <TabsTrigger value="spatial" className="text-[10px] font-bold py-1">Spatial</TabsTrigger>
                                </TabsList>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    NETWORK_ONLINE
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-4 min-h-0 overflow-hidden">
                                <TabsContent value="pollution" className="h-full m-0 outline-none">
                                    <ComparisonChart data={chartData} stations={stations} />
                                </TabsContent>
                                <TabsContent value="temp" className="h-full m-0 outline-none">
                                    <AtmosphereTrendChart data={chartData} />
                                </TabsContent>
                                <TabsContent value="wind" className="h-full m-0 outline-none">
                                    <WindVelocityChart data={chartData} />
                                </TabsContent>
                                <TabsContent value="spatial" className="h-full m-0 outline-none pt-4">
                                    <SpatialRadarChart stations={stations} metrics={metrics} />
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>

                    {/* Standings */}
                    <Card className="lg:col-span-3 bg-card border-border flex flex-col overflow-hidden shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 h-14 shrink-0 border-b border-border/50">
                            <div>
                                <CardTitle className="text-sm font-bold tracking-tight">Regional Standings</CardTitle>
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase tracking-tighter">Ranked by Atmospheric Index</p>
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 px-1.5 py-0.5 rounded border border-border">
                                Live Data
                            </span>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto custom-scrollbar p-0">
                            <StationTable stations={stations} metrics={metrics} isCompact={true} />
                        </CardContent>
                    </Card>

                </div>

            </main>

            {/* FOOTER TICKER */}
            <div className="shrink-0 h-10 border-t border-border bg-card/50">
                <TickerTape stations={stations} metrics={metrics} />
            </div>

        </div>
    );
}

function NavButton({ children, active, icon }) {
    return (
        <button className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-[13px] transition-all duration-200",
            active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
        )}>
            {icon}
            {children}
        </button>
    );
}

function MetricCard({ title, value, unit, desc, icon, color, isSplit = false }) {
    return (
        <Card className="bg-card border-border group hover:border-accent transition-all duration-300 shadow-sm overflow-hidden text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground">
                <CardTitle className="text-[10px] font-mono font-bold uppercase tracking-widest">{title}</CardTitle>
                {!isSplit && <div className="p-1 opacity-20">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-baseline gap-1.5">
                            <div className={cn("text-4xl font-black tracking-tighter tabular-nums", color)}>{value ?? '--'}</div>
                            <div className="text-[11px] font-mono text-muted-foreground font-bold uppercase">{unit}</div>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold font-mono mt-2 uppercase tracking-tighter max-w-[140px]">
                            {desc}
                        </p>
                    </div>
                    {isSplit && (
                        <div className="w-20 h-20 -mr-2">
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default App;
