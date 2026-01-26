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
import { DistrictMap } from './components/DistrictMap';
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
    Map as MapIcon,
    ShieldAlert,
    Wind as WindIcon,
    Navigation
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function App() {
    const { getFilteredData, getLatestMetrics, loading, error, stations } = useWeatherData();
    const [range, setRange] = useState('today');
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [selectedDistricts, setSelectedDistricts] = useState([]);

    const metrics = getLatestMetrics();
    const chartData = useMemo(() => getFilteredData(range), [getFilteredData, range]);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const healthData = useMemo(() => {
        if (!metrics) return null;
        const aqi = metrics.avgAQI;
        if (aqi <= 12) return { level: 'OPTIMAL', color: 'text-emerald-500', advice: 'Ideal conditions. Perfect for outdoor exercise.', mask: false };
        if (aqi <= 35) return { level: 'MODERATE', color: 'text-amber-500', advice: 'Fair air. Sensitive individuals should monitor symptoms.', mask: false };
        if (aqi <= 55) return { level: 'SENSITIVE', color: 'text-orange-500', advice: 'High risk for respiratory groups. Wear mask if sensitive.', mask: true };
        if (aqi <= 150) return { level: 'UNHEALTHY', color: 'text-red-500', advice: 'Avoid outdoor exertion. High-efficiency masks required.', mask: true };
        return { level: 'HAZARDOUS', color: 'text-rose-600', advice: 'Critical emergency. Remain indoors with air purifiers.', mask: true };
    }, [metrics]);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-background text-muted-foreground font-mono text-xs tracking-widest uppercase">
            <span className="animate-pulse flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> SYNCHRONIZING SECURE NETWORK...
            </span>
        </div>
    );

    return (
        <div className="min-h-screen lg:h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-300 overflow-x-hidden">

            {/* HAZARD ALERT BANNER */}
            {metrics?.avgAQI > 150 && (
                <div className="bg-rose-600 text-white h-8 flex items-center justify-center gap-4 px-6 relative z-[100] overflow-hidden shadow-lg border-b border-rose-500">
                    <div className="animate-pulse flex items-center gap-2 font-black text-[11px] tracking-widest uppercase italic">
                        <AlertTriangle className="w-3.5 h-3.5 stroke-[3]" />
                        CRITICAL ATMOSPHERIC HAZARD DETECTED
                    </div>
                    <div className="h-4 w-px bg-white/20 hidden md:block" />
                    <div className="text-[10px] font-bold hidden md:block uppercase tracking-tighter opacity-90">
                        City Average: {metrics.avgAQI} µg/m³ — Indoor filtration strictly recommended.
                    </div>
                </div>
            )}

            {/* SHADCN TOP NAV */}
            <nav className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center shadow-sm">
                            <Activity className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold tracking-tighter text-lg">UB.PREMIER</span>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-sm font-medium">
                        <NavButton active icon={<LayoutDashboard className="w-4 h-4" />}>Command</NavButton>
                        <NavButton icon={<ShieldAlert className="w-4 h-4" />}>Health Hub</NavButton>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </button>
                    <div className="flex bg-muted/50 rounded-lg p-1">
                        {['today', 'last7', 'last30'].map((r) => (
                            <button key={r} onClick={() => setRange(r)} className={cn("px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all duration-200", range === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                                {r === 'today' ? '1D' : r === 'last7' ? '1W' : '1M'}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* COMMAND CENTER CONTENT */}
            <main className="flex-1 p-4 lg:p-6 overflow-y-auto lg:overflow-hidden flex flex-col gap-4 lg:gap-6">

                {/* Metric Layer */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 shrink-0">
                    <MetricCard
                        title="City Concentration"
                        value={metrics?.isOffline ? "LOST" : metrics?.avgAQI}
                        unit="µg/m³"
                        trend={metrics?.avgAQI > 50 ? "up" : "down"}
                        status={metrics?.avgAQI > 150 ? "emergency" : "normal"}
                    />
                    <MetricCard
                        title="Ambient Temperature"
                        value={metrics?.temp}
                        unit="°C"
                        trend="stable"
                    />
                    <MetricCard
                        title="Wind Velocity"
                        value={metrics?.wind}
                        unit="m/s"
                        desc="Blowing North-West"
                        color="text-blue-500"
                        icon={<div className="animate-pulse flex items-center justify-center p-2"><Navigation className="w-6 h-6 text-blue-500 -rotate-45" /></div>}
                        isSplit={true}
                    />
                    <MetricCard
                        title="Ambient Atmosphere"
                        value={`${metrics?.temp}°`}
                        unit="TEMP"
                        desc={`${metrics?.feels}° Feels | ${metrics?.humidity}% Humidity`}
                        color="text-amber-500"
                        icon={<ThermometerSun className="w-4 h-4 text-amber-500 opacity-20" />}
                    />
                </div>

                {/* Intelligence Layer */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-7 gap-6 min-h-[800px] lg:min-h-0">

                    {/* Visual Intelligence (Map & Trends) */}
                    <Card className="lg:col-span-4 bg-card border-border flex flex-col overflow-hidden shadow-sm">
                        <Tabs defaultValue="radar" className="flex-1 flex flex-col overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-1 h-14 shrink-0 border-b border-border/50 px-4">
                                <TabsList className="bg-muted/50 h-8">
                                    <TabsTrigger value="radar" className="text-[10px] font-bold py-1 flex items-center gap-1.5">Distribution</TabsTrigger>
                                    <TabsTrigger value="pollution" className="text-[10px] font-bold py-1">Pollution</TabsTrigger>
                                    <TabsTrigger value="wind" className="text-[10px] font-bold py-1">Wind Speed</TabsTrigger>
                                    <TabsTrigger value="temp" className="text-[10px] font-bold py-1">Climate</TabsTrigger>
                                </TabsList>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    PREDICTIVE_ACTIVE
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-4 min-h-0 overflow-hidden">
                                <TabsContent value="radar" className="h-full m-0 outline-none">
                                    <SpatialRadarChart stations={stations} metrics={metrics} />
                                </TabsContent>
                                <TabsContent value="pollution" className="h-full m-0 outline-none">
                                    <ComparisonChart data={chartData} stations={stations} highlightedIds={selectedDistricts} />
                                </TabsContent>
                                <TabsContent value="wind" className="h-full m-0 outline-none">
                                    <WindVelocityChart data={chartData} />
                                </TabsContent>
                                <TabsContent value="temp" className="h-full m-0 outline-none">
                                    <AtmosphereTrendChart data={chartData} />
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>

                    {/* Standings & Signals */}
                    <Card className="lg:col-span-3 bg-card border-border flex flex-col overflow-hidden shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 h-14 shrink-0 border-b border-border/50">
                            <div>
                                <CardTitle className="text-sm font-bold tracking-tight">Regional Signals</CardTitle>
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase tracking-tighter">Live District Node Status</p>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto custom-scrollbar p-0">
                            <StationTable
                                stations={stations}
                                metrics={metrics}
                                isCompact={true}
                                onSelectionChange={setSelectedDistricts}
                            />
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
                            <div className={cn("text-3xl font-black tracking-tighter tabular-nums leading-none", color)}>{value ?? '--'}</div>
                            <div className="text-[10px] font-mono text-muted-foreground font-bold uppercase">{unit}</div>
                        </div>
                        <p className="text-[9px] text-muted-foreground font-bold font-mono mt-2 uppercase tracking-tighter max-w-[160px] leading-relaxed">
                            {desc}
                        </p>
                    </div>
                    {isSplit && (
                        <div className="w-20 h-20 -mr-2 flex items-center justify-center">
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default App;
