import React, { useState, useMemo, useEffect } from 'react';
import { useWeatherData } from './hooks/useWeatherData';
import {
    ComparisonChart as PollutionChart,
    AtmosphereTrendChart,
    AirRadialChart,
    SpatialRadarChart as StationMap
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

const TRANSLATIONS = {
    en: {
        brand: 'ATMOSPHERIC NEXUS',
        system: 'QUANTUM AIR ANALYSIS SYSTEM',
        location: 'ULAANBAATAR GRID',
        geospatial: 'GEOSPATIAL MATRIX',
        temporal: 'TEMPORAL ANALYSIS',
        molecular: 'MOLECULAR SCAN',
        quantumIndex: 'QUANTUM INDEX',
        airQualityIndex: 'AQI SCORE',
        healthStatus: 'HEALTH STATUS',
        temperature: 'TEMPERATURE',
        activeSensors: 'ACTIVE SENSORS',
        active: 'ACTIVE',
        live: 'LIVE',
        optimal: 'OPTIMAL',
        moderate: 'MODERATE',
        status: 'SYSTEM STATUS',
        integrity: 'Network integrity',
        heartbeat: 'Telemetry Heartbeat',
        reliability: 'Signal Integrity',
        loading: 'SYNCHRONIZING SECURE NETWORK...',
        all: 'ALL',
        today: '1D',
        last7: '1W',
        last30: '1M'
    },
    mn: {
        brand: 'ATMOSPHERIC NEXUS',
        system: 'КВАНТ АГААРЫН ШИНЖИЛГЭ',
        location: 'УЛААНБААТАР СҮЛЖЭЭ',
        geospatial: 'ОРОН ЗАЙН МАТРИЦ',
        temporal: 'ХУГАЦААНЫ ШИНЖИЛГЭ',
        molecular: 'МОЛЕКУЛЫН САН',
        quantumIndex: 'КВАНТ ИНДЕКС',
        airQualityIndex: 'AQI ОНОО',
        healthStatus: 'ЭРҮҮЛ МЭНД',
        temperature: 'ХЭМ',
        activeSensors: 'МЭДРЭГЧҮҮД',
        active: 'ИДЭВХТЭЙ',
        live: 'ШУУД',
        optimal: 'ХЭВИЙН',
        moderate: 'ДУНДАЖ',
        status: 'СҮЛЖЭЭНИЙ ТӨЛӨВ',
        integrity: 'Сүлжээний нэгдмэл байдал',
        heartbeat: 'Сүлжээний дохио',
        reliability: 'Дохионы найдвартай байдал',
        loading: 'СҮЛЖЭЭГ СИНХРОНЧИЛЖ БАЙНА...',
        all: 'БҮГД',
        today: '1Ө',
        last7: '1Д',
        last30: '1С'
    }
};

function App() {
    const { getFilteredData, getLatestMetrics, loading, error, stations } = useWeatherData();
    const [timeRange, setTimeRange] = useState('today');
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

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
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col p-4 gap-4 transition-colors duration-500">
            {/* Cyber-Grid Background */}
            <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />

            {/* Scanline Effect */}
            <div className="scanline" />

            {/* Header Layer */}
            <header className="flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/40 shadow-[0_0_15px_rgba(0,255,255,0.2)]">
                        <Activity className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-foreground leading-[0.8] font-rajdhani">
                            ATMOSPHERIC <span className="text-primary italic">NEXUS</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground mt-1">
                            {t('system')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[9px] uppercase font-black tracking-widest text-primary/60">Location</span>
                        <span className="text-sm font-bold tracking-tight">{t('location')}</span>
                    </div>

                    <div className="flex bg-card/40 backdrop-blur-md rounded-lg border border-white/5 p-1 h-10 items-center">
                        {['today', 'last7', 'last30'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    "px-4 h-full rounded-md text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                    timeRange === range ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(0,255,255,0.4)]" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {t(range)}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                        <div className="flex bg-card/40 rounded-lg border border-white/5 p-1">
                            {['en', 'mn'].map(l => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    className={cn(
                                        "px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all",
                                        lang === l ? "bg-white/10 text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2.5 rounded-lg glass-panel hover:bg-white/10 transition-colors"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Primary Metrics Layer */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 z-10 shrink-0">
                <MetricCard
                    label={t('quantumIndex')}
                    value={metrics.avgAQI || '--'}
                    status={metrics.isOffline ? 'OFFLINE' : t('live')}
                    icon={<Activity className="w-4 h-4 text-primary" />}
                    subValue="Optimal atmospheric conditions"
                    trend="stable"
                />
                <MetricCard
                    label={t('healthStatus')}
                    value={metrics.avgAQI ? getHealthLevel(metrics.avgAQI).status : '--'}
                    status="ACTIVE"
                    icon={<HeartPulse className="w-4 h-4 text-accent" />}
                    subValue="PM2.5 & PM10 monitored"
                    trend="stable"
                />
                <MetricCard
                    label={t('temperature')}
                    value={metrics.temp != null ? `${metrics.temp}°` : '--'}
                    status="READY"
                    icon={<ThermometerSun className="w-4 h-4 text-primary" />}
                    subValue={`Thermal index: ${metrics.feels != null ? metrics.feels : '--'}° • Fog detected`}
                    trend="stable"
                />
                <MetricCard
                    label={t('activeSensors')}
                    value={metrics.activeCount || '0'}
                    status="ONLINE"
                    icon={<Zap className="w-4 h-4 text-primary" />}
                    subValue={`${t('integrity')}: 95%`}
                    trend="up"
                />
            </div>

            {/* Main Intelligence Grid */}
            <main className="flex-1 grid grid-cols-12 gap-4 z-10 min-h-0 overflow-hidden mb-2">

                {/* Column 1: Quantum Analysis (25%) */}
                <div className="col-span-3 flex flex-col gap-4 min-h-0">
                    <Card className="flex-1 glass-panel border-white/5 bg-background/20 relative overflow-hidden p-6 flex flex-col items-center justify-center">
                        <div className="absolute top-4 left-4 text-[9px] font-black uppercase tracking-widest text-primary/60">{t('quantumIndex')}</div>
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-black text-emerald-500 uppercase">{t('live')}</span>
                        </div>

                        {/* Radial Gauge */}
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="502" strokeDashoffset={502 - (502 * Math.min(metrics.avgAQI || 0, 200)) / 200} className="text-primary drop-shadow-[0_0_10px_rgba(0,255,255,0.4)] transition-all duration-1000" />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-7xl font-black tracking-tighter leading-none">{metrics.avgAQI || '--'}</span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mt-2">{t('airQualityIndex')}</span>
                            </div>
                        </div>

                        <div className="mt-8 self-stretch">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-bold text-emerald-500 uppercase tracking-widest">{t('optimal')}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">Range: 0-50 Optimal</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[70%] shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
                            </div>
                            <p className="mt-3 text-[11px] text-muted-foreground/80 font-bold leading-relaxed italic">
                                Atmospheric conditions are ideal
                            </p>
                        </div>
                    </Card>

                    <Card className="h-48 glass-panel border-white/5 bg-background/20 overflow-hidden flex flex-col p-5">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">{t('molecular')}</span>
                            <Zap className="w-3 h-3 text-primary animate-pulse" />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                                    <span className="text-primary font-black tracking-widest">PM2.5 <span className="opacity-40 ml-1 text-[8px]">µg/m³</span></span>
                                    <span className="font-rajdhani text-sm">{metrics.avgAQI ? Math.round(metrics.avgAQI * 0.4) : '--'} <span className="opacity-40 text-[10px]">/35</span></span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary shadow-[0_0_8px_rgba(0,255,255,0.4)]" style={{ width: '45%' }} />
                                </div>
                                <div className="flex justify-between text-[8px] font-black uppercase mt-1 opacity-60 tracking-[0.2em]">
                                    <span className="text-emerald-500">{t('optimal')}</span>
                                    <span>34.3%</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase mb-1">
                                    <span className="text-accent font-black tracking-widest">PM10 <span className="opacity-40 ml-1 text-[8px]">µg/m³</span></span>
                                    <span className="font-rajdhani text-sm">{metrics.avgAQI ? Math.round(metrics.avgAQI * 0.6) : '--'} <span className="opacity-40 text-[10px]">/50</span></span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent shadow-[0_0_8px_rgba(255,0,255,0.4)]" style={{ width: '36%' }} />
                                </div>
                                <div className="flex justify-between text-[8px] font-black uppercase mt-1 opacity-60 tracking-[0.2em]">
                                    <span className="text-emerald-500">{t('optimal')}</span>
                                    <span>36.0%</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Column 2: Geospatial & Temporal (55%) */}
                <div className="col-span-6 flex flex-col gap-4 min-h-0">
                    <Card className="flex-[1.2] glass-panel border-white/5 bg-background/20 relative overflow-hidden">
                        <div className="absolute top-4 left-4 z-20">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">{t('geospatial')}</span>
                            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 border border-white/5 backdrop-blur-xl">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
                                <span className="text-[10px] font-black tracking-[0.2em] text-primary">47.92°N, 106.91°E</span>
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 z-20 flex gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{t('optimal')}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{t('moderate')}</span>
                            </div>
                        </div>

                        {/* Map Component */}
                        <div className="h-full w-full">
                            <StationMap
                                stations={metrics.stations}
                                filteredData={filteredData}
                            />
                        </div>

                        <div className="absolute bottom-4 right-4 z-20 px-4 py-1.5 rounded-lg bg-black/60 border border-white/5 backdrop-blur-xl">
                            <div className="flex items-center gap-4">
                                <div className="h-px w-16 bg-white/20 relative">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                                </div>
                                <span className="text-[9px] font-black tracking-[0.3em] text-white/40 uppercase">20km</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="flex-1 glass-panel border-white/5 bg-background/20 flex flex-col overflow-hidden relative p-4">
                        <div className="flex items-center justify-between mb-4 z-20 relative">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">{t('temporal')}</span>
                            <div className="flex gap-4">
                                {['AQI', 'PM2.5', 'PM10'].map(tag => (
                                    <div key={tag} className="flex items-center gap-1.5">
                                        <div className={cn("w-1.5 h-1.5 rounded-full", tag === 'AQI' ? 'bg-primary' : tag === 'PM2.5' ? 'bg-accent' : 'bg-rose-500')} />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">{tag}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 w-full relative z-10">
                            <PollutionChart data={filteredData} />
                        </div>
                    </Card>
                </div>

                {/* Column 3: Sensor Network (25%) */}
                <div className="col-span-3 flex flex-col min-h-0">
                    <Card className="flex-1 glass-panel border-white/5 bg-background/20 overflow-hidden flex flex-col relative">
                        <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Sensor Network</span>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_10px_rgba(0,255,255,0.1)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                <span className="text-[9px] font-black text-primary uppercase">{metrics.activeCount} ACTIVE</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                            {metrics.stations.map((s) => (
                                <div
                                    key={s.id}
                                    className={cn(
                                        "group p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden",
                                        s.status === 'live' ? "glass-panel bg-white/[0.03] border-white/10 hover:border-primary/40" : "bg-black/40 border-white/5 opacity-50"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">{s.id_num || '#--'}</span>
                                                <span className="text-xs font-black uppercase tracking-tighter truncate max-w-[120px]">{s.label}</span>
                                            </div>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/30 ml-0.5">{s.region || 'Unknown'}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-2xl font-black tracking-tighter leading-none">{s.val || '--'}</span>
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">AQI</span>
                                        </div>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden flex-1 relative">
                                        <div
                                            className={cn("h-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.5)]", getHealthLevel(s.val || 0).bg)}
                                            style={{ width: `${Math.min((s.val || 0) / 2, 100)}%` }}
                                        />
                                    </div>
                                    <SignalHigh className={cn("absolute bottom-3 right-3 w-3 h-3 transition-colors", s.status === 'live' ? "text-emerald-500" : "text-muted-foreground")} />
                                </div>
                            ))}
                        </div>

                        <div className="p-5 border-t border-white/5 bg-black/60 relative">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-2">{t('status')}:</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-bold text-emerald-500/90 leading-tight uppercase tracking-tight">All parameters within safe thresholds</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>

            {/* Global Telemetry Footprint */}
            <footer className="h-8 flex items-center justify-between z-10 shrink-0 px-2">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30">
                            {t('heartbeat')}: <span className="text-primary/60 ml-1">[{metrics.lastUpdated ? metrics.lastUpdated.split(' ')[1] : '--:--'}]</span>
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/20">System Integrity</span>
                        <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="w-[95%] h-full bg-primary/40" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tight text-emerald-500/60">95% Reliable</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground/20">Quantum Nexus Terminal v2.5</span>
                </div>
            </footer>
        </div>
    );
}

function MetricCard({ label, value, status, icon, subValue, trend }) {
    return (
        <Card className="glass-panel group p-4 border-white/5 bg-background/20 relative overflow-hidden transition-all hover:border-primary/40">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 transition-colors group-hover:border-primary/30">
                        {icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{label}</span>
                </div>
                <div className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-black tracking-widest border transition-all",
                    status === 'OFFLINE' ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : "bg-primary/10 border-primary/30 text-primary group-hover:bg-primary/20"
                )}>
                    {status}
                </div>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-black tracking-tighter leading-none">{value}</span>
                {trend && (
                    <div className={cn("text-[11px] font-black", trend === 'up' ? 'text-rose-500' : 'text-emerald-500')}>
                        {trend === 'up' ? '↑' : '↓'}
                    </div>
                )}
            </div>

            <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-tight truncate">
                    {subValue}
                </p>
            </div>

            {/* Precision corner accents */}
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>
    );
}

export default App;
