import React from 'react';
import { Thermometer, Wind, Droplets, HelpCircle } from 'lucide-react';

// Using a custom icon for "Feels Like" since HandWarmer/Scarf isn't standard in basic sets, using HelpCircle or similar.
// Actually Lucide has 'ThermometerSun' or similar. We used a scarf emoji before. Let's use 'Hand' or just text.
// We'll use ThermometerSun for Feels Like.
import { ThermometerSun } from 'lucide-react';

const getAQIMeta = (pm25) => {
    if (pm25 == null) return { color: '#9ca3af', label: 'Loading...', border: 'border-gray-400' }; // gray-400
    if (pm25 <= 12) return { color: '#10b981', label: 'Good', border: 'border-emerald-500' };
    if (pm25 <= 35) return { color: '#f59e0b', label: 'Moderate', border: 'border-amber-500' };
    if (pm25 <= 55) return { color: '#f97316', label: 'Sensitive', border: 'border-orange-500' };
    if (pm25 <= 150) return { color: '#ef4444', label: 'Unhealthy', border: 'border-red-500' };
    return { color: '#7f1d1d', label: 'Hazardous', border: 'border-rose-900' };
};

export function HeroSection({ metrics, lastUpdated }) {
    const meta = getAQIMeta(metrics?.avgAQI);

    // Dynamic ring color
    const ringStyle = {
        borderTopColor: meta.color,
        boxShadow: `0 0 20px ${meta.color}40`
    };

    return (
        <>
            {/* Hero Card */}
            <div className="col-span-1 md:col-span-2 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-6 shadow-lg relative flex items-center justify-around">
                <div className="absolute top-4 right-4 text-xs bg-black/5 px-2 py-1 rounded-full text-gray-500">
                    {lastUpdated ? `Sync: ${lastUpdated}` : 'Syncing...'}
                </div>

                <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Ring */}
                    <div
                        className="absolute w-full h-full rounded-full border-[10px] border-white/40 rotate-[-45deg] transition-colors duration-500"
                        style={ringStyle}
                    ></div>
                    <span className="text-6xl font-bold z-10 leading-none text-gray-800">
                        {metrics ? metrics.avgAQI : '--'}
                    </span>
                </div>

                <div className="text-center">
                    <div className="text-3xl font-light text-gray-800 mb-2">{meta.label}</div>
                    <div className="text-sm text-gray-500 font-medium">Average PM2.5 in UB</div>
                </div>
            </div>

            {/* Weather Card */}
            <div className="col-span-1 md:col-span-2 bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-6 shadow-lg flex justify-between items-center px-10">

                <div className="flex flex-col items-center gap-1">
                    <Thermometer className="w-8 h-8 text-gray-700" />
                    <span className="text-2xl font-bold text-gray-800">{metrics?.temp ?? '--'}°</span>
                    <span className="text-xs uppercase tracking-widest text-gray-500">Temp</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <ThermometerSun className="w-8 h-8 text-orange-600" />
                    <span className="text-2xl font-bold text-gray-800">{metrics?.feels ?? '--'}°</span>
                    <span className="text-xs uppercase tracking-widest text-gray-500">Feels Like</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <Droplets className="w-8 h-8 text-blue-600" />
                    <span className="text-2xl font-bold text-gray-800">{metrics?.humidity ?? '--'}%</span>
                    <span className="text-xs uppercase tracking-widest text-gray-500">Ag</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <Wind className="w-8 h-8 text-slate-600" />
                    <span className="text-2xl font-bold text-gray-800">{metrics?.wind ?? '--'}</span>
                    <span className="text-xs uppercase tracking-widest text-gray-500">Wind</span>
                </div>

            </div>
        </>
    );
}
