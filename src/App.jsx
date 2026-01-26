import React, { useState, useMemo, useEffect } from 'react';
import { useWeatherData } from './hooks/useWeatherData';
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

const TRANSLATIONS = {
    en: {
        brand: 'ATMOSPHERIC NEXUS',
        system: 'QUANTUM AIR ANALYSIS SYSTEM',
        location: 'ULAANBAATAR GRID',
        cityConc: 'CITY CONCENTRATION',
        guard: 'HEALTH SAFEGUARD',
        atmosphere: 'ATMOSPHERE',
        composition: 'COMPOSITION',
        map: 'Map',
        pollution: 'Pollution',
        windSpeed: 'Wind Speed',
        climate: 'Climate',
        activeSignals: 'Active Signals',
        filtering: '2H Filtering',
        feels: 'Feels',
        sync: 'Sync',
        heartbeat: 'Telemetry Heartbeat',
        loading: 'SYNCHRONIZING SECURE NETWORK...',
        all: 'ALL',
        today: '1D',
        last7: '1W',
        last30: '1M',
        unitTemp: 'C',
        unitHumidity: '%'
    },
    mn: {
        brand: 'ATMOSPHERIC NEXUS',
        system: 'КВАНТ АГААРЫН ШИНЖИЛГЭ',
        location: 'УЛААНБААТАР СҮЛЖЭЭ',
        cityConc: 'ХОТЫН БОХИРДОЛ',
        guard: 'ЭРҮҮЛ МЭНД',
        atmosphere: 'ЦАГ АГААР',
        composition: 'НАЙРЛАГА',
        map: 'Газрын зураг',
        pollution: 'Бохирдол',
        windSpeed: 'Салхины хурд',
        climate: 'Цаг уур',
        activeSignals: 'Идэвхтэй Цэгүүд',
        filtering: '2Ц Шүүлтүүр',
        feels: 'Мэдрэгдэх',
        sync: 'Синх',
        heartbeat: 'Сүлжээний дохио',
        loading: 'СҮЛЖЭЭГ ШАЛГАЖ БАЙНА...',
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
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col p-4 gap-4 transition-colors duration-500 group">
            {/* Cyber-Grid Background */}
            <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />

            {/* Scanline Effect */}
            <div className="scanline" />

            {/* Header Layer */}
            <header className="flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/40 shadow-[0_0_15px_rgba(0,255,255,0.2)]">
                        <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter text-foreground leading-none font-rajdhani">
                            {t('brand')}
                        </h1>
                        <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-muted-foreground mt-1">
                            {t('system')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[9px] uppercase font-black tracking-widest text-primary/60">Location</span>
                        <span className="text-sm font-bold tracking-tight">{t('location')}</span>
                    </div>

                    <div className="flex bg-card/40 backdrop-blur-md rounded-lg border border-white/5 p-1 h-9 items-center">
                        {['today', 'last7', 'last30'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    "px-3 h-full rounded-md text-[9px] font-black uppercase tracking-widest transition-all duration-300",
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
                                        "px-2 py-0.5 text-[9px] font-black uppercase rounded transition-all",
                                        lang === l ? "bg-white/10 text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2 rounded-lg glass-panel hover:bg-white/10 transition-colors"
                        >
                            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Primary Metrics Layer (Restored 4nd-card header) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 z-10 shrink-0">
                <MetricCard
                    label={t('cityConc')}
                    value={metrics.isOffline ? 'LOST' : metrics.avgAQI}
                    unit="µg/m³"
                    icon={<AirRadialChart value={metrics.avgAQI} />}
                    subValue={`${metrics.activeCount}/${metrics.totalCount} ${t('activeSignals')} | ${t('filtering')}`}
                    isSplit
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
                    icon={<ThermometerSun className="w-6 h-6 text-sky-400 opacity-40" />}
                    subValue={`${t('feels')} ${metrics.feels != null ? metrics.feels : '--'}°C | T-ZONE`}
                />
                <MetricCard
                    label={t('composition')}
                    value={metrics.humidity || '--'}
                    unit="%"
                    icon={<Droplets className="w-6 h-6 text-blue-400 opacity-40" />}
                    subValue={`WIND ${metrics.wind || '--'}m/s | RH ${metrics.humidity || '--'}%`}
                />
            </div>

            {/* Main Intelligence Grid (Hybrid 70/30) */}
            <main className="flex-1 grid grid-cols-1 md:grid-cols-10 gap-4 z-10 min-h-0 overflow-hidden mb-2">

                {/* Left Section (70%): Tabs Restore */}
                <Card className="md:col-span-7 glass-panel border-white/5 bg-background/20 relative overflow-hidden flex flex-col p-0 border-none">
                    <Tabs defaultValue="map" className="flex flex-col h-full bg-transparent">
                        <div className="px-6 pt-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">Intelligence Layer</span>
                                <div className="h-3 w-px bg-white/10" />
                                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/40 border border-white/5 backdrop-blur-md">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
                                    <span className="text-[9px] font-black text-primary/80 uppercase">SYSTEM_ACTIVE</span>
                                </div>
                            </div>
                            <TabsList className="bg-white/5 border border-white/5 gap-1 h-9">
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
                                <PollutionChart data={filteredData} />
                            </TabsContent>
                            <TabsContent value="wind" className="h-full m-0 p-0 relative border-none outline-none pt-4">
                                <WindVelocityChart data={filteredData} />
                            </TabsContent>
                            <TabsContent value="climate" className="h-full m-0 p-0 relative border-none outline-none pt-4">
                                <AtmosphereTrendChart data={filteredData} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </Card>

                {/* Right Section (30%): Sensor Network */}
                <div className="md:col-span-3 flex flex-col min-h-0">
                    <Card className="flex-1 glass-panel border-white/5 bg-background/20 overflow-hidden flex flex-col relative">
                        <div className="p-4 border-b border-white/5 flex flex-col gap-1 shrink-0 bg-white/[0.02]">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/80">REGIONAL SIGNALS</span>
                            <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest">LIVE DISTRICT NODE STATUS</span>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                            {metrics.stations.map((s) => (
                                <div
                                    key={s.id}
                                    className={cn(
                                        "group p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden",
                                        s.status === 'live' ? "glass-panel bg-white/[0.03] border-white/10 hover:border-primary/40" : "bg-black/40 border-white/5 opacity-50"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[9px] font-black text-primary/60">{s.id_num || '#--'}</span>
                                                <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[100px]">{s.label}</span>
                                            </div>
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/20">{s.region || 'Unknown'}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xl font-black tracking-tighter leading-none">{s.val || '--'}</span>
                                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">AQI</span>
                                        </div>
                                    </div>
                                    <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden flex-1 relative">
                                        <div
                                            className={cn("h-full transition-all duration-1000", getHealthLevel(s.val || 0).bg)}
                                            style={{ width: `${Math.min((s.val || 0) / 2, 100)}%` }}
                                        />
                                    </div>
                                    <SignalHigh className={cn("absolute bottom-2 right-2 w-3 h-3 transition-colors", s.status === 'live' ? "text-emerald-500" : "text-muted-foreground")} />
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-white/5 bg-black/60 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest">SECURE_LINK</span>
                            </div>
                            <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">S_ACTIVE</span>
                        </div>
                    </Card>
                </div>
            </main>

            {/* Global Telemetry Footprint */}
            <footer className="h-6 flex items-center justify-between z-10 shrink-0 px-2 lg:px-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/30">
                            {t('heartbeat')}: <span className="text-primary/60 ml-1">[{metrics.lastUpdated ? metrics.lastUpdated.split(' ')[1] : '--:--'}]</span>
                        </span>
                    </div>
                </div>
                <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-foreground/20 italic">QUANTUM NEXUS TERMINAL v2.7</span>
                </div>
            </footer>
        </div>
    );
}

function MetricCard({ label, value, unit, icon, subValue, isSplit = false, statusColor }) {
    return (
        <Card className="glass-panel group p-4 border-white/5 bg-background/20 relative overflow-hidden transition-all hover:border-primary/40">
            <div className="flex items-center justify-between mb-4 flex-nowrap">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 border-l-2 border-primary/20 pl-2">{label}</span>
                {!isSplit && icon}
            </div>

            <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-2">
                    <span className={cn("text-4xl font-black tracking-tighter leading-none tabular-nums", statusColor)}>{value}</span>
                    <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">{unit}</span>
                </div>
                {isSplit && <div className="w-20 h-10 flex items-center justify-center opacity-80">{icon}</div>}
            </div>

            <div className="mt-4 pt-2 border-t border-white/5">
                <p className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-tighter truncate">
                    {subValue}
                </p>
            </div>
        </Card>
    );
}

export default App;
