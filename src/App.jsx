import React, { useState, useMemo } from 'react';
import { useWeatherData } from './hooks/useWeatherData';
import { StationCard } from './components/StationCard';
import { HeroSection } from './components/HeroSection';
import { PMChart, TempChart, WindChart } from './components/Charts';
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Moon, Sun, Globe, Download, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

function App() {
    const { filteredData, getFilteredData, getLatestMetrics, loading, error, stations } = useWeatherData();
    const [range, setRange] = useState('today');
    const [darkMode, setDarkMode] = useState(false);

    // Toggle Dark Mode
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.documentElement.classList.toggle('dark');
    };

    const metrics = getLatestMetrics();
    const chartData = useMemo(() => getFilteredData(range), [getFilteredData, range]);

    // Animation Variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <RefreshCw className="w-8 h-8 animate-spin text-zinc-400" />
                <p className="text-zinc-500 font-medium tracking-tight">Initializing Sensor Network...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center text-red-500 font-mono">
            Error: {error}
        </div>
    );

    return (
        <div className={`min-h-screen transition-colors duration-500 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans antialiased selection:bg-zinc-900 selection:text-white`}>
            {/* Ambient Background Gradient */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-30 dark:opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-zinc-100 to-teal-100 dark:from-indigo-900 dark:via-zinc-900 dark:to-teal-900 blur-3xl" />

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-[1600px]">

                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"
                >
                    <div className="flex flex-col items-center md:items-start group cursor-default">
                        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-zinc-100 dark:to-zinc-400 group-hover:to-zinc-700 transition-all">
                            UB Air
                        </h1>
                        <p className="text-sm text-zinc-500 font-medium tracking-wide uppercase">Atmospheric Monitoring System</p>
                    </div>

                    <div className="flex bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-full p-1.5 shadow-sm transition-all hover:bg-white/80 dark:hover:bg-zinc-900/80 hover:shadow-md">
                        <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800">
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </Button>
                        <Separator orientation="vertical" className="h-8 mx-1 bg-zinc-200 dark:bg-zinc-700" />
                        <select
                            value={range}
                            onChange={(e) => setRange(e.target.value)}
                            className="bg-transparent text-sm font-medium px-4 outline-none cursor-pointer text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                        >
                            <option value="today">Today</option>
                            <option value="last7">7 Days</option>
                            <option value="last30">30 Days</option>
                            <option value="all">All Time</option>
                        </select>
                        <Separator orientation="vertical" className="h-8 mx-1 bg-zinc-200 dark:bg-zinc-700" />
                        <Button variant="ghost" size="sm" className="rounded-full gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50" asChild>
                            <a href="weather_log.csv" download>
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">CSV</span>
                            </a>
                        </Button>
                    </div>
                </motion.header>

                {/* Bento Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-6 gap-6 mb-8"
                >
                    {/* Main Hero (2x2) */}
                    <motion.div variants={item} className="col-span-1 md:col-span-4 xl:col-span-4 row-span-2 h-full">
                        <HeroSection metrics={metrics} lastUpdated={metrics?.lastUpdated} />
                    </motion.div>

                    {/* Station Grid (Flows around hero) */}
                    <motion.div variants={item} className="col-span-1 md:col-span-4 xl:col-span-2 row-span-2 grid grid-cols-2 gap-4 h-full content-start">
                        {stations.map(s => (
                            <motion.div key={s.id} variants={item}>
                                <StationCard
                                    station={s}
                                    val={metrics?.stations.find(st => st.id === s.id)?.val}
                                    time={metrics?.stations.find(st => st.id === s.id)?.time}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* Charts Section */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
                >
                    <motion.div variants={item} className="col-span-1 lg:col-span-2">
                        <PMChart data={chartData} stations={stations} />
                    </motion.div>
                    <motion.div variants={item}>
                        <TempChart data={chartData} />
                    </motion.div>
                    <motion.div variants={item}>
                        <WindChart data={chartData} />
                    </motion.div>
                </motion.div>

                <footer className="mt-20 border-t border-zinc-200 dark:border-zinc-800 pt-8 text-center pb-20">
                    <p className="text-zinc-400 text-sm">
                        Data sourced from weather.gov.mn & Local IQAir Stations
                    </p>
                </footer>

            </div>
        </div>
    );
}

export default App;
