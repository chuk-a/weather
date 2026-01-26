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

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-background text-muted-foreground font-mono text-xs tracking-widest uppercase">
            <span className="animate-pulse flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" /> {t('loading')}
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
                        {t('hazardBanner')}
                    </div>
                    <div className="h-4 w-px bg-white/20 hidden md:block" />
                    <div className="text-[10px] font-bold hidden md:block uppercase tracking-tighter opacity-90">
                        {t('cityMean')}: {metrics.avgAQI} µg/m³ — {t('hazardAdvice')}
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
                        <span className="font-bold tracking-tighter text-lg">{t('brand')}</span>
                    </div>
                    <div className="hidden md:flex items-center gap-4 text-sm font-medium">
                        <NavButton active icon={<LayoutDashboard className="w-4 h-4" />}>{t('command')}</NavButton>
                        <NavButton icon={<ShieldAlert className="w-4 h-4" />}>{t('health')}</NavButton>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Language Selector */}
                    <div className="flex bg-muted/50 rounded-lg p-1 mr-2 border border-border/50">
                        <button onClick={() => setLang('en')} className={cn("px-2 py-1 rounded-md text-[10px] font-bold transition-all duration-200 uppercase", lang === 'en' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                            EN
                        </button>
                        <button onClick={() => setLang('mn')} className={cn("px-2 py-1 rounded-md text-[10px] font-bold transition-all duration-200 uppercase", lang === 'mn' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                            MN
                        </button>
                    </div>

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
                        icon={<ShieldCheck className="w-5 h-5 opacity-20" />}
                    />
                    <MetricCard
                        title={t('atmosphere')}
                        value={`${metrics?.temp}°`}
                        unit={t('unitTemp')}
                        desc={`${t('feels')} ${metrics?.feels}°C | SYNC`}
                        icon={<ThermometerSun className="w-5 h-5 opacity-20" />}
                    />
                    <MetricCard
                        title={t('composition')}
                        value={`${metrics?.humidity}`}
                        unit={t('unitHumidity')}
                        desc={`${t('wind')} ${metrics?.wind}m/s | ${t('humidity')} ${metrics?.humidity}%`}
                        icon={<Droplets className="w-5 h-5 opacity-20" />}
                    />
                </div>

                {/* Intelligence Layer */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-7 gap-6 min-h-[800px] lg:min-h-0">

                    {/* Visual Intelligence (Map & Trends) */}
                    <Card className="lg:col-span-4 bg-card border-border flex flex-col overflow-hidden shadow-sm">
                        <Tabs defaultValue="radar" className="flex-1 flex flex-col overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-1 h-14 shrink-0 border-b border-border/50 px-4">
                                <TabsList className="bg-muted/50 h-8">
                                    <TabsTrigger value="radar" className="text-[10px] font-bold py-1 flex items-center gap-1.5">{t('map')}</TabsTrigger>
                                    <TabsTrigger value="pollution" className="text-[10px] font-bold py-1">{t('pollution')}</TabsTrigger>
                                    <TabsTrigger value="wind" className="text-[10px] font-bold py-1">{t('windSpeed')}</TabsTrigger>
                                    <TabsTrigger value="temp" className="text-[10px] font-bold py-1">{t('climate')}</TabsTrigger>
                                </TabsList>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    {t('systemActive')}
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
                                <CardTitle className="text-sm font-bold tracking-tight">{t('regional')}</CardTitle>
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5 uppercase tracking-tighter">{t('nodeStatus')}</p>
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

                {/* Telemetry Heartbeat */}
                {metrics?.lastUpdated && (
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span className="text-[10px] font-mono font-bold tracking-tighter text-muted-foreground/60 uppercase">
                            {t('heartbeat')}: <span className="text-foreground/80">{new Date(metrics.lastUpdated).toLocaleString(lang === 'mn' ? 'mn-MN' : 'en-GB', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                        </span>
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-[9px] font-black tracking-widest text-muted-foreground/30 uppercase">System_Active</span>
                        </div>
                    </div>
                )}

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

function MetricCard({ title, value, unit, desc, icon, color, isSplit = false, trend }) {
    return (
        <Card className="bg-card border-border group hover:border-border transition-all duration-300 shadow-sm overflow-hidden text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 text-muted-foreground/60">
                <CardTitle className="text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-2">
                    {title}
                    {trend === 'up' && <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />}
                </CardTitle>
                {!isSplit && <div className="p-1">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-baseline gap-1.5">
                            <div className={cn("text-3xl font-black tracking-tighter tabular-nums leading-none", color)}>{value ?? '--'}</div>
                            <div className="text-[10px] font-black font-mono text-muted-foreground/40 uppercase">{unit}</div>
                        </div>
                        <div className="mt-3 flex flex-col gap-0.5">
                            <p className="text-[10px] font-bold font-mono text-foreground uppercase tracking-tight">
                                {desc}
                            </p>
                            <div className="w-full h-[1px] bg-border/20 mt-1" />
                        </div>
                    </div>
                    {isSplit && (
                        <div className="w-16 h-16 flex items-center justify-center">
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default App;
