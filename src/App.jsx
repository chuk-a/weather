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

const TRANSLATIONS = {
    en: {
        brand: 'UB AIR QUALITY',
        city: 'ULAANBAATAR',
        command: 'Command',
        health: 'Health Hub',
        hazardBanner: 'CRITICAL ATMOSPHERIC HAZARD DETECTED',
        hazardAdvice: 'Indoor filtration strictly recommended.',
        cityMean: 'City Mean',
        cityConc: 'City Concentration',
        activeSignals: 'Active Signals',
        filtering: '2H Filtering',
        guard: 'Health Safeguard',
        atmosphere: 'Atmosphere',
        feels: 'Feels',
        composition: 'Composition',
        wind: 'Wind',
        humidity: 'Humidity',
        map: 'Map',
        pollution: 'Pollution',
        windSpeed: 'Wind Speed',
        climate: 'Climate',
        systemActive: 'SYSTEM_ACTIVE',
        regional: 'Regional Signals',
        nodeStatus: 'Live District Node Status',
        sync: 'Sync',
        heartbeat: 'Telemetry Heartbeat',
        loading: 'SYNCHRONIZING SECURE NETWORK...',
        unitStatus: 'STATUS',
        unitTemp: 'C',
        unitHumidity: '%',
    },
    mn: {
        brand: 'АГААРЫН ЧАНАР',
        city: 'УЛААНБААТАР',
        command: 'Удирдах',
        health: 'Эрүүл мэнд',
        hazardBanner: 'АГААРЫН БОХИРДОЛ САЛТАРЛАА',
        hazardAdvice: 'Агаар шүүгч ашиглахыг зөвлөж байна.',
        cityMean: 'Хотын Дундаж',
        cityConc: 'Хотын Агаарын Чанар',
        activeSignals: 'Идэвхтэй Цэгүүд',
        filtering: '2Ц Шүүлтүүр',
        guard: 'Эрүүл Мэнд',
        atmosphere: 'Цаг Агаар',
        feels: 'Мэдрэгдэх',
        composition: 'Найрлага',
        wind: 'Салхи',
        humidity: 'Чийгшил',
        map: 'Газрын зураг',
        pollution: 'Бохирдол',
        windSpeed: 'Салхины хурд',
        climate: 'Цаг уур',
        systemActive: 'СҮЛЖЭЭ_ИДЭВХТЭЙ',
        regional: 'Бүс Нутгийн Мэдээ',
        nodeStatus: 'Дүүргүүдийн Төлөв',
        sync: 'Синх',
        heartbeat: 'Сүлжээний дохио',
        loading: 'СҮЛЖЭЭГ ШАЛГАЖ БАЙНА...',
        unitStatus: 'ТӨЛӨВ',
        unitTemp: 'Хэм',
        unitHumidity: '%',
    }
};

function App() {
    const { getFilteredData, getLatestMetrics, loading, error, stations } = useWeatherData();
    const [range, setRange] = useState('today');
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
    const [selectedDistricts, setSelectedDistricts] = useState([]);

    const t = (key) => TRANSLATIONS[lang][key] || key;

    const metrics = getLatestMetrics();
    const chartData = useMemo(() => getFilteredData(range), [getFilteredData, range]);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('lang', lang);
    }, [lang]);

    const healthData = useMemo(() => {
        if (!metrics) return null;
        const aqi = metrics.avgAQI;
        const langMap = {
            en: {
                optimal: { level: 'OPTIMAL', advice: 'Ideal conditions. Perfect for outdoor exercise.' },
                moderate: { level: 'MODERATE', advice: 'Fair air. Sensitive individuals should monitor symptoms.' },
                sensitive: { level: 'SENSITIVE', advice: 'High risk for respiratory groups. Wear mask if sensitive.' },
                unhealthy: { level: 'UNHEALTHY', advice: 'Avoid outdoor exertion. High-efficiency masks required.' },
                hazardous: { level: 'HAZARDOUS', advice: 'Critical emergency. Remain indoors with air purifiers.' }
            },
            mn: {
                optimal: { level: 'МАШ САЙН', advice: 'Агаарын чанар маш сайн. Гадаад орчинд дасгал хийхэд тохиромжтой.' },
                moderate: { level: 'ХЭВИЙН', advice: 'Агаарын чанар хэвийн. Мэдрэмтгий хүмүүс өөрийн биеийн байдлыг анхаарна уу.' },
                sensitive: { level: 'МЭДРЭМТГИЙ', advice: 'Агаарын бохирдолд мэдрэмтгий бүлгийнхэнд эрсдэлтэй. Маск зүүнэ үү.' },
                unhealthy: { level: 'БОХИРДОЛТОЙ', advice: 'Гадаад орчинд ажиллах, дасгал хийхээс татгалзаж, маск зүүх шаардлагатай.' },
                hazardous: { level: 'МАШ БОХИР', advice: 'Агаарт маш их бохирдолтой байна. Агаар шүүгч ажиллуулж, гэрээс гарахгүй байхыг зөвлөж байна.' }
            }
        };

        const currentDict = langMap[lang];
        if (aqi <= 12) return { ...currentDict.optimal, color: 'text-emerald-500', mask: false };
        if (aqi <= 35) return { ...currentDict.moderate, color: 'text-amber-500', mask: false };
        if (aqi <= 55) return { ...currentDict.sensitive, color: 'text-orange-500', mask: true };
        if (aqi <= 150) return { ...currentDict.unhealthy, color: 'text-red-500', mask: true };
        return { ...currentDict.hazardous, color: 'text-rose-600', mask: true };
    }, [metrics, lang]);

    return (
        <div className="min-h-screen lg:h-screen bg-background text-foreground flex flex-col transition-colors duration-300 overflow-x-hidden relative font-mono">

            {/* AMBIENT EFFECTS */}
            <div className="fixed inset-0 cyber-grid pointer-events-none opacity-40" />
            <div className="fixed inset-0 scanline pointer-events-none" />

            {/* HAZARD ALERT BANNER */}
            {metrics?.avgAQI > 150 && (
                <div className="bg-rose-600/20 text-rose-500 h-8 flex items-center justify-center gap-4 px-6 relative z-[100] overflow-hidden backdrop-blur-md border-b border-rose-500/50 shadow-[0_0_20px_rgba(225,29,72,0.2)]">
                    <div className="animate-pulse flex items-center gap-2 font-black text-[10px] tracking-widest uppercase italic">
                        <AlertTriangle className="w-3 h-3 stroke-[3]" />
                        {t('hazardBanner')}
                    </div>
                    <div className="h-3 w-px bg-rose-500/30 hidden md:block" />
                    <div className="text-[9px] font-bold hidden md:block uppercase tracking-tighter opacity-80">
                        {t('cityMean')}: <span className="text-rose-400 font-black">{metrics.avgAQI}</span> µg/m³ — {t('hazardAdvice')}
                    </div>
                </div>
            )}

            {/* TOP NAVIGATION / COMMAND LINK */}
            <nav className="h-14 border-b border-border bg-card/40 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50 relative">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2.5 group cursor-pointer">
                        <div className="w-6 h-6 bg-primary/20 border border-primary/50 rounded flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <Activity className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex flex-col -space-y-1">
                            <span className="font-black tracking-tighter text-base text-primary/90">{t('brand')}</span>
                            <span className="text-[8px] font-black tracking-[.3em] text-muted-foreground/60 uppercase">{t('city')} TERMINAL_v2.0</span>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-1.5 p-1 bg-muted/20 border border-border/50 rounded-lg">
                        <NavButton active icon={<LayoutDashboard className="w-3.5 h-3.5" />}>{t('command')}</NavButton>
                        <NavButton icon={<ShieldAlert className="w-3.5 h-3.5" />}>{t('health')}</NavButton>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Language Selector */}
                    <div className="flex bg-muted/30 rounded border border-border/50 divide-x divide-border/50">
                        <button onClick={() => setLang('en')} className={cn("px-2.5 py-1 text-[9px] font-black transition-all duration-200", lang === 'en' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}>
                            EN
                        </button>
                        <button onClick={() => setLang('mn')} className={cn("px-2.5 py-1 text-[9px] font-black transition-all duration-200", lang === 'mn' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5")}>
                            MN
                        </button>
                    </div>

                    <div className="h-4 w-px bg-border/50" />

                    <div className="flex items-center gap-2">
                        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border/50">
                            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                        <div className="flex bg-muted/30 rounded border border-border/50">
                            {['today', 'last7', 'last30'].map((r) => (
                                <button key={r} onClick={() => setRange(r)} className={cn("px-3 py-1 text-[9px] font-black uppercase transition-all duration-200", range === r ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}>
                                    {r === 'today' ? '1D' : r === 'last7' ? '1W' : '1M'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>

            {/* MAIN COMMAND INTERFACE */}
            <main className="flex-1 p-4 lg:p-6 overflow-y-auto lg:overflow-hidden flex flex-col gap-4 lg:gap-6 relative z-10">

                {/* TELEMETRY LAYER */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 shrink-0">
                    <MetricCard
                        title={t('cityConc')}
                        value={metrics?.isOffline ? "LOST" : metrics?.avgAQI}
                        unit="µg/m³"
                        desc={`${metrics?.activeCount}/${metrics?.totalCount} ${t('activeSignals')} | ${t('filtering')}`}
                        trend={metrics?.avgAQI > 50 ? "up" : "down"}
                        icon={<AirRadialChart value={metrics?.avgAQI} />}
                        isSplit={true}
                    />
                    <MetricCard
                        title={t('guard')}
                        value={healthData?.level}
                        unit={t('unitStatus')}
                        desc={healthData?.advice}
                        color={healthData?.color}
                        icon={<ShieldCheck className="w-5 h-5 opacity-40 text-primary" />}
                    />
                    <MetricCard
                        title={t('atmosphere')}
                        value={`${metrics?.temp}°`}
                        unit={t('unitTemp')}
                        desc={`${t('feels')} ${metrics?.feels}°C | T-ZONE`}
                        icon={<ThermometerSun className="w-5 h-5 opacity-40 text-sky-400" />}
                    />
                    <MetricCard
                        title={t('composition')}
                        value={`${metrics?.humidity}`}
                        unit={t('unitHumidity')}
                        desc={`${t('wind')} ${metrics?.wind}m/s | RH ${metrics?.humidity}%`}
                        icon={<Droplets className="w-5 h-5 opacity-40 text-blue-400" />}
                    />
                </div>

                {/* INTELLIGENCE GRIDS */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-7 gap-6 min-h-[800px] lg:min-h-0 min-h-0">

                    {/* SPATIAL TELEMETRY (MAP & TRENDS) */}
                    <Card className="lg:col-span-4 glass-panel flex flex-col overflow-hidden border-primary/10">
                        <Tabs defaultValue="radar" className="flex-1 flex flex-col overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-1 h-14 shrink-0 border-b border-white/5 px-4 backdrop-blur-md">
                                <TabsList className="bg-white/5 h-8 border border-white/5 p-1">
                                    <TabsTrigger value="radar" className="text-[9px] font-black py-1 px-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all">{t('map')}</TabsTrigger>
                                    <TabsTrigger value="pollution" className="text-[9px] font-black py-1 px-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all">{t('pollution')}</TabsTrigger>
                                    <TabsTrigger value="wind" className="text-[9px] font-black py-1 px-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all">{t('windSpeed')}</TabsTrigger>
                                    <TabsTrigger value="temp" className="text-[9px] font-black py-1 px-3 data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all">{t('climate')}</TabsTrigger>
                                </TabsList>
                                <div className="flex items-center gap-2 text-[9px] font-black text-primary/80 bg-primary/10 px-3 py-1 rounded border border-primary/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                    {t('systemActive')}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-4 min-h-0 overflow-hidden relative">
                                <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none" />
                                <TabsContent value="radar" className="h-full m-0 outline-none relative z-10">
                                    <SpatialRadarChart stations={stations} metrics={metrics} />
                                </TabsContent>
                                <TabsContent value="pollution" className="h-full m-0 outline-none relative z-10">
                                    <ComparisonChart data={chartData} stations={stations} highlightedIds={selectedDistricts} />
                                </TabsContent>
                                <TabsContent value="wind" className="h-full m-0 outline-none relative z-10">
                                    <WindVelocityChart data={chartData} />
                                </TabsContent>
                                <TabsContent value="temp" className="h-full m-0 outline-none relative z-10">
                                    <AtmosphereTrendChart data={chartData} />
                                </TabsContent>
                            </CardContent>
                        </Tabs>
                    </Card>

                    {/* REGIONAL LOG (STATION STATUS) */}
                    <Card className="lg:col-span-3 glass-panel flex flex-col overflow-hidden border-primary/10">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 h-14 shrink-0 border-b border-white/5 px-4 backdrop-blur-md">
                            <div>
                                <CardTitle className="text-[11px] font-black tracking-widest text-primary/90 uppercase">{t('regional')}</CardTitle>
                                <p className="text-[8px] text-muted-foreground/60 font-black mt-0.5 uppercase tracking-[.2em]">{t('nodeStatus')}</p>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto custom-scrollbar p-0">
                            <StationTable
                                stations={stations}
                                metrics={metrics}
                                isCompact={true}
                                onSelectionChange={setSelectedDistricts}
                                lang={lang}
                            />
                        </CardContent>
                    </Card>

                </div>

                {/* TELEMETRY FOOTPRINT */}
                {metrics?.lastUpdated && (
                    <div className="flex items-center gap-4 px-2 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <span className="text-[9px] font-black tracking-widest text-muted-foreground/40 uppercase">
                                {t('heartbeat')}: <span className="text-foreground/60">{new Date(metrics.lastUpdated).toLocaleString(lang === 'mn' ? 'mn-MN' : 'en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                            </span>
                        </div>
                        <div className="flex-1 h-px bg-white/5" />
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[.3em]">SECURE_LINK</span>
                                <div className="w-8 h-1 bg-primary/20 rounded-full overflow-hidden">
                                    <div className="w-2/3 h-full bg-primary animate-[pulse_2s_infinite]" />
                                </div>
                            </div>
                            <span className="text-[9px] font-black tracking-widest text-primary/40 uppercase">S_ACTIVE</span>
                        </div>
                    </div>
                )}

            </main>

            {/* ANALYTIC STREAM */}
            <div className="shrink-0 h-10 border-t border-white/5 bg-black/20 backdrop-blur-md relative z-20">
                <TickerTape stations={stations} metrics={metrics} />
            </div>

        </div>
    );
}

function NavButton({ children, active, icon }) {
    return (
        <button className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded font-black text-[10px] uppercase tracking-wider transition-all duration-200",
            active
                ? "bg-primary/20 text-primary shadow-[0_0_15px_rgba(16,185,129,0.1)] border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
        )}>
            {icon}
            {children}
        </button>
    );
}

function MetricCard({ title, value, unit, desc, icon, color, isSplit = false, trend }) {
    return (
        <Card className="glass-panel group transition-all duration-500 hover:border-primary/30 overflow-hidden relative border-primary/5">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors" />

            <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 relative z-10 px-4 pt-3">
                <CardTitle className="text-[8px] font-black uppercase tracking-[.25em] text-muted-foreground/50 flex items-center gap-2">
                    <div className="w-1 h-1 bg-primary/40 rounded-full" />
                    {title}
                    {trend === 'up' && <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.8)]" />}
                </CardTitle>
                {!isSplit && <div className="opacity-40 group-hover:opacity-80 transition-opacity">{icon}</div>}
            </CardHeader>
            <CardContent className="px-4 pb-3 relative z-10">
                <div className="flex items-end justify-between">
                    <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                            <div className={cn("text-4xl font-black tracking-tighter tabular-nums leading-none", color || "text-foreground")}>
                                {value ?? '--'}
                            </div>
                            <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">{unit}</div>
                        </div>
                        <div className="mt-4 flex flex-col gap-1">
                            <div className="h-px w-full bg-white/5" />
                            <p className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-tighter line-clamp-1">
                                {desc}
                            </p>
                        </div>
                    </div>
                    {isSplit && (
                        <div className="w-12 h-12 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-all duration-500 translate-x-1 translate-y-1">
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Precise Details */}
            <div className="absolute bottom-0 right-0 p-1 opacity-20">
                <div className="w-1.5 h-1.5 border-r border-b border-primary" />
            </div>
            <div className="absolute top-0 left-0 p-1 opacity-20">
                <div className="w-1.5 h-1.5 border-l border-t border-primary" />
            </div>
        </Card>
    );
}

export default App;
