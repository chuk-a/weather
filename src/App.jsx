import React, { useState, useMemo } from 'react';
import { useWeatherData } from './hooks/useWeatherData';
import { StationCard } from './components/StationCard';
import { HeroSection } from './components/HeroSection';
import { PMChart, TempChart, WindChart } from './components/Charts';
import { Moon, Sun, Globe, Download } from 'lucide-react';

function App() {
    const { filteredData, getFilteredData, getLatestMetrics, loading, error, stations } = useWeatherData();
    const [range, setRange] = useState('today');
    const [darkMode, setDarkMode] = useState(false);

    // Toggle Dark Mode (simple class toggle on body)
    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.body.classList.toggle('dark');
    };

    const metrics = getLatestMetrics();
    const chartData = useMemo(() => getFilteredData(range), [getFilteredData, range]);

    if (loading) return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500">Loading Weather Data...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-xl text-red-500">Error: {error}</div>;

    return (
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <div className="container mx-auto px-4 py-8 max-w-7xl">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center mb-10 bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-sm">
                    <div className="mb-4 md:mb-0 text-center md:text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-white">UB Air</h1>
                        <p className="text-gray-600 dark:text-gray-300">Atmospheric Monitoring</p>
                    </div>

                    <div className="flex gap-3 items-center">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2.5 rounded-xl bg-white/50 hover:bg-white/80 transition-colors shadow-sm text-gray-700"
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <button className="p-2.5 rounded-xl bg-white/50 hover:bg-white/80 transition-colors shadow-sm text-gray-700">
                            <Globe size={20} />
                        </button>

                        <select
                            value={range}
                            onChange={(e) => setRange(e.target.value)}
                            className="p-2.5 rounded-xl bg-white/50 border-none outline-none hover:bg-white/80 transition-colors shadow-sm text-gray-700 font-medium cursor-pointer"
                        >
                            <option value="today">Today</option>
                            <option value="last7">7 Days</option>
                            <option value="last30">30 Days</option>
                            <option value="all">All Time</option>
                        </select>

                        <a
                            href="weather_log.csv"
                            download
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/50 hover:bg-white/80 transition-colors shadow-sm text-gray-700 font-medium no-underline"
                        >
                            <Download size={18} /> CSV
                        </a>
                    </div>
                </header>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <HeroSection metrics={metrics} lastUpdated={metrics?.lastUpdated} />

                    <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stations.map(s => (
                            <StationCard
                                key={s.id}
                                station={s}
                                val={metrics?.stations.find(st => st.id === s.id)?.val}
                                time={metrics?.stations.find(st => st.id === s.id)?.time}
                            />
                        ))}
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-2 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-6 shadow-lg h-96">
                        <PMChart data={chartData} stations={stations} />
                    </div>
                    <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-6 shadow-lg h-80">
                        <TempChart data={chartData} />
                    </div>
                    <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-6 shadow-lg h-80">
                        <WindChart data={chartData} />
                    </div>
                </div>

                <footer className="mt-16 text-center text-white/80 text-sm pb-8">
                    Data sourced from weather.gov.mn & Local IQAir Stations · <a href="https://github.com/chuk-a/weather" className="underline hover:text-white">GitHub</a>
                </footer>

            </div>
        </div>
    );
}

export default App;
