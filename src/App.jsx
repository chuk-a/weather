import React, { useState, useMemo, useEffect } from 'react';
import { useWeatherData } from './hooks/useWeatherData';
import { StationTable } from './components/StationTable';
import {
    ComparisonChart as PollutionChart,
    AtmosphereTrendChart,
    WindVelocityChart,
    AirRadialChart,
    SpatialRadarChart as RadarChart
} from './components/Charts';
import {
    Wind,
    Droplets,
    ThermometerSun,
    Activity,
    AlertTriangle,
    ShieldCheck,
    LayoutDashboard,
    Moon,
    Sun,
    Map as MapIcon,
    ShieldAlert,
    Wind as WindIcon,
    Navigation,
    HeartPulse,
    Zap,
    SignalHigh
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { RetroGrid } from "@/components/ui/retro-grid";

const TRANSLATIONS = {
    en: {
        brand: 'AIR MONITORING',
        system: 'ULAANBAATAR AIR QUALITY NETWORK',
        location: 'ULAANBAATAR, MN',
        cityConc: 'CITY CONCENTRATION',
        guard: 'HEALTH ADVISORY',
        atmosphere: 'ATMOSPHERE',
        composition: 'WIND & HUMIDITY',
        map: 'Map',
        pollution: 'Pollution',
        windSpeed: 'Wind Speed',
        climate: 'Climate',
        activeSignals: 'Active Stations',
        filtering: '2H Window',
        feels: 'Feels',
        sync: 'Sync',
        heartbeat: 'Last Update',
        loading: 'INITIALIZING DATA...',
        all: 'ALL',
        today: '1D',
        last7: '1W',
        last30: '1M',
        unitTemp: 'C',
        unitHumidity: '%'
    },
    mn: {
        brand: 'АГААРЫН МОНИТОРИНГ',
        system: 'УЛААНБААТАР ХОТЫН АГААРЫН ЧАНАР',
        location: 'УЛААНБААТАР, МН',
        cityConc: 'ДУНДАЖ АГУУЛАМЖ',
        guard: 'ЭРҮҮЛ МЭНДИЙН ЗӨВЛӨМЖ',
        atmosphere: 'ЦАГ АГААР',
        composition: 'САЛХИ БА ЧИЙГШИЛ',
        map: 'Газрын зураг',
        pollution: 'Бохирдол',
        windSpeed: 'Салхины хурд',
        climate: 'Уур амьсгал',
        activeSignals: 'Идэвхтэй цэгүүд',
        filtering: 'Шүүлтийн цонх',
        feels: 'Мэдрэгдэх',
        sync: 'Синхрон',
        heartbeat: 'Сүүлд шинэчлэгдсэн',
        loading: 'ӨГӨГДЛИЙГ УНШИЖ БАЙНА...',
        all: 'БҮГД',
        today: '1Ө',
        last7: '1Д',
        last30: '1С',
        all: 'БҮГД',
        today: '1Ө',
        last7: '1Д',
        last30: '1С',
        unitTemp: 'Хэм',
        unitHumidity: '%'
    }
};

function App() {
    const { getFilteredData, getLatestMetrics, loading, error, stations } = useWeatherData();
    const [timeRange, setTimeRange] = useState('today');
    // Force dark mode
    const [theme] = useState('dark');
    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

    const [selectedStations, setSelectedStations] = useState([]);

    // Debug selection
    useEffect(() => {
        console.log("App: selectedStations updated:", selectedStations);
    }, [selectedStations]);

    const t = (key) => TRANSLATIONS[lang][key] || key;

    const metrics = useMemo(() => getLatestMetrics() || {
        avgAQI: 0,
        isOffline: true,
        activeCount: 0,
        totalCount: 0,
        stations: []
    }, [getLatestMetrics]);

    const filteredData = useMemo(() => getFilteredData(timeRange), [getFilteredData, timeRange]);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('lang', lang);
    }, [lang]);

    const getHealthLevel = (aqi) => {
        if (aqi <= 12) return { status: 'OPTIMAL', bg: 'bg-emerald-500', text: 'text-emerald-500' };
        if (aqi <= 35) return { status: 'MODERATE', bg: 'bg-amber-500', text: 'text-amber-500' };
        if (aqi <= 55) return { status: 'SENSITIVE', bg: 'bg-orange-500', text: 'text-orange-500' };
        if (aqi <= 150) return { status: 'UNHEALTHY', bg: 'bg-red-500', text: 'text-red-500' };
        return { status: 'HAZARDOUS', bg: 'bg-rose-600', text: 'text-rose-600' };
    };

    if (loading) return (
        <div className="h-screen w-screen bg-[#0F0A1E] flex flex-col items-center justify-center font-mono">
            <Activity className="w-12 h-12 text-primary animate-pulse mb-4" />
            <div className="text-[10px] font-black tracking-[0.5em] text-primary/60 uppercase animate-bounce">
                {t('loading')}
            </div>
        </div>
    );

    return (
        <div className="h-screen bg-background/80 text-foreground relative overflow-hidden flex flex-col p-2 gap-2 transition-colors duration-500 group font-sans selection:bg-primary/30">
            {/* Ambient Background Grid */}
            <RetroGrid
                opacity={0.15}
                cellSize={40}
                angle={60}
            />

            <div className="absolute top-0 z-[0] h-screen w-screen bg-purple-950/5 dark:bg-purple-950/10 pointer-events-none bg-[radial-gradient(ellipse_40%_50%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />

            {/* Header Layer */}
            <header className="flex items-center justify-between z-10 shrink-0 mb-1 relative">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded border border-emerald-500/20 flex items-center justify-center backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <Activity className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 leading-none font-sans drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                            {t('brand')}
                        </h1>
                        <p className="text-[8px] uppercase tracking-[0.2em] font-medium text-muted-foreground mt-1 opacity-70">
                            {t('system')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-cyan-500/80 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">Location</span>
                        <span className="text-sm font-bold tracking-tight">{t('location')}</span>
                    </div>

                    <div className="flex bg-muted/80 backdrop-blur-sm rounded-lg border border-border p-1 h-9 items-center shadow-sm">
                        {['today', 'last7', 'last30'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    "px-2 h-full rounded text-[8px] font-bold uppercase tracking-wider transition-all duration-300",
                                    timeRange === range ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t(range)}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                        <div className="flex bg-muted/80 backdrop-blur-sm rounded-lg border border-border p-1 shadow-sm">
                            {['en', 'mn'].map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    className={cn(
                                        "px-2 py-0.5 text-[9px] font-black uppercase rounded transition-all",
                                        lang === l ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
                                    )}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Primary Metrics Layer (Restored 4nd-card header) */}
            < div className="grid grid-cols-1 md:grid-cols-4 gap-4 z-10 shrink-0 relative" >
                <MetricCard
                    label={t('cityConc')}
                    value={metrics.isOffline ? 'LOST' : metrics.avgAQI}
                    unit="µg/m³"
                    icon={<AirRadialChart value={metrics.avgAQI} />}
                    subValue={`${metrics.activeCount}/${metrics.totalCount} ${t('activeSignals')} | ${t('filtering')}`}
                    isSplit
                    statusColor={getHealthLevel(metrics.avgAQI).text}
                />
                <MetricCard
                    label={t('guard')}
                    value={metrics.avgAQI ? getHealthLevel(metrics.avgAQI).status : '--'}
                    unit="STATUS"
                    icon={<ShieldCheck className="w-6 h-6 text-emerald-500 opacity-40" />}
                    subValue="IDEAL CONDITIONS. PERFECT FOR OUTDOOR EXERCISE."
                    statusColor={getHealthLevel(metrics.avgAQI).text}
                />
                <MetricCard
                    label={t('atmosphere')}
                    value={metrics.temp != null ? `${metrics.temp}°` : '--'}
                    unit="C"
                    icon={<ThermometerSun className="w-6 h-6 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />}
                    subValue={`${t('feels')} ${metrics.feels != null ? metrics.feels : '--'}°C | T-ZONE`}
                    statusColor="text-amber-500"
                />
                <MetricCard
                    label={t('composition')}
                    value={metrics.wind || '--'}
                    unit="m/s"
                    icon={<Wind className="w-6 h-6 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]" />}
                    subValue={`SPEED ${metrics.wind ? (metrics.wind * 3.6).toFixed(1) : '--'} km/h | RELATIVE HUMIDITY ${metrics.humidity || '--'} %`}
                    statusColor="text-blue-500"
                />
            </div >

            {/* Main Intelligence Grid (Hybrid 70/30) */}
            <main className="flex-1 grid grid-cols-1 md:grid-cols-10 gap-2 z-10 min-h-0 overflow-y-auto md:overflow-hidden relative" >

                {/* Left Section (70%): Tabs Restore */}
                <Card className="md:col-span-7 border-border bg-card/60 backdrop-blur-sm relative overflow-hidden flex flex-col p-0 shadow-sm transition-all hover:bg-card/80 min-h-[450px] md:min-h-0" >
                    <Tabs defaultValue="map" className="flex flex-col h-full bg-transparent">
                        <div className="px-6 pt-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-500/80 drop-shadow-[0_0_5px_rgba(6,182,212,0.3)]">Data Visualization</span>
                                <div className="h-2 w-px bg-white/10" />
                                {/* Removed flavor text */}
                            </div>
                            <TabsList className="bg-muted/80 backdrop-blur-sm border border-border gap-1 h-9">
                                <TabsTrigger value="map" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[9px] font-black px-4 h-7">{t('map')}</TabsTrigger>
                                <TabsTrigger value="pollution" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[9px] font-black px-4 h-7">{t('pollution')}</TabsTrigger>
                                <TabsTrigger value="wind" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[9px] font-black px-4 h-7">{t('windSpeed')}</TabsTrigger>
                                <TabsTrigger value="climate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-[9px] font-black px-4 h-7">{t('climate')}</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 min-h-0 relative">
                            <TabsContent value="map" className="h-full m-0 p-0 relative border-none outline-none">
                                <RadarChart stations={stations} metrics={metrics} />
                            </TabsContent>
                            <TabsContent value="pollution" className="h-full m-0 p-0 relative border-none outline-none pt-4">
                                <PollutionChart data={filteredData} selectedStations={selectedStations} />
                            </TabsContent>
                            <TabsContent value="wind" className="h-full m-0 p-0 relative border-none outline-none pt-4">
                                <WindVelocityChart data={filteredData} />
                            </TabsContent>
                            <TabsContent value="climate" className="h-full m-0 p-0 relative border-none outline-none pt-4">
                                <AtmosphereTrendChart data={filteredData} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </Card >

                <div className="md:col-span-3 flex flex-col min-h-[600px] md:min-h-0">
                    <Card className="flex-1 border-border bg-card/60 backdrop-blur-sm overflow-hidden flex flex-col relative p-0 shadow-sm transition-all hover:bg-card/80">
                        <div className="flex-1 min-h-0 overflow-hidden">
                            <StationTable
                                stations={stations}
                                metrics={metrics}
                                lang={lang}
                                onSelectionChange={setSelectedStations}
                            />
                        </div>

                        <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-widest leading-none">NETWORK STATUS: OPTIMAL</span>
                            </div>
                            {/* <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">S_ACTIVE</span> */}
                        </div>
                    </Card>
                </div>
            </main >

            {/* Global Telemetry Footprint */}
            < footer className="px-3 py-1 border-t border-border bg-muted/40 backdrop-blur-md flex items-center justify-between shrink-0 relative z-20" >
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                        <span className="text-[8px] font-medium text-muted-foreground/60 uppercase tracking-widest leading-none">
                            {t('heartbeat')}: <span className="text-primary/40 ml-1">{metrics.lastUpdated ? metrics.lastUpdated.split(' ')[1] : '--:--'}</span>
                        </span>
                    </div>
                </div>
                <div>
                    <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-foreground/10">DATA ENGINE v1.0</span>
                </div>
            </footer >
        </div >
    );
}

function MetricCard({ label, value, unit, icon, subValue, isSplit = false, statusColor }) {
    // Determine glow color based on statusColor class
    const getGlowClass = (colorClass) => {
        if (!colorClass) return "";
        if (colorClass.includes('emerald')) return "drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]";
        if (colorClass.includes('amber')) return "drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]";
        if (colorClass.includes('orange')) return "drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]";
        if (colorClass.includes('red')) return "drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]";
        if (colorClass.includes('rose')) return "drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]";
        if (colorClass.includes('blue') || colorClass.includes('cyan')) return "drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]";
        return "";
    };

    return (
        <Card className="group p-2 px-3 border-border bg-card relative overflow-hidden transition-all hover:shadow-lg hover:bg-card/90">
            <div className="flex items-center justify-between mb-1 flex-nowrap">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.4)] border-l-2 border-primary/40 pl-2">{label}</span>
                {!isSplit && icon}
            </div>

            <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-1">
                    <span className={cn("text-3xl font-black tracking-tighter leading-none tabular-nums animate-in fade-in slide-in-from-left duration-700", statusColor, getGlowClass(statusColor))}>
                        {value}
                    </span>
                    <span className={cn("text-[8px] font-black uppercase tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]", statusColor ? statusColor : "text-white/40")}>
                        {unit}
                    </span>
                </div>
                {isSplit && <div className="w-16 h-8 flex items-center justify-center scale-110">{icon}</div>}
            </div>

            <div className="mt-2 pt-1 border-t border-border">
                <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest truncate group-hover:text-cyan-400/80 transition-colors">
                    {subValue}
                </p>
            </div>
        </Card>
    );
}

export default App;
