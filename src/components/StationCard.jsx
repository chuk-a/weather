import React from 'react';

const getAQIMeta = (pm25) => {
    if (pm25 == null) return { color: 'text-gray-400', bg: 'bg-gray-400', label: 'Offline', border: 'border-gray-400' };
    if (pm25 <= 12) return { color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Good', border: 'border-emerald-500' };
    if (pm25 <= 35) return { color: 'text-amber-500', bg: 'bg-amber-500', label: 'Moderate', border: 'border-amber-500' };
    if (pm25 <= 55) return { color: 'text-orange-500', bg: 'bg-orange-500', label: 'Sensitive', border: 'border-orange-500' };
    if (pm25 <= 150) return { color: 'text-red-500', bg: 'bg-red-500', label: 'Unhealthy', border: 'border-red-500' };
    return { color: 'text-rose-900', bg: 'bg-rose-900', label: 'Hazardous', border: 'border-rose-900' };
};

export function StationCard({ station, val, time }) {
    const meta = getAQIMeta(val);

    return (
        <div className="relative bg-white/60 backdrop-blur-md border border-white/40 rounded-2xl p-5 flex flex-col justify-between h-40 overflow-hidden shadow-lg hover:-translate-y-1 transition-transform duration-300">
            <div
                className={`absolute top-5 right-5 w-3 h-3 rounded-full ${meta.bg} shadow-[0_0_10px_currentColor] animate-pulse`}
            />

            <div className="text-lg font-semibold mb-1 flex items-center gap-2">
                <span>{station.flag}</span>
                <span>{station.label}</span>
            </div>

            <div className={`text-4xl font-bold ${meta.color} mt-auto`}>
                {val ?? '--'}
            </div>

            <div className="flex justify-between items-end mt-2">
                <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                {time && (
                    <span className="text-xs text-gray-500 flex items-center gap-1 opacity-80">
                        🕒 {time}
                    </span>
                )}
            </div>
        </div>
    );
}
