import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    annotationPlugin
);

const STATION_COLORS = {
    french: '#2563eb', eu: '#7c3aed', czech: '#db2777', yarmag: '#059669',
    chd9: '#ea580c', mandakh: '#d97706', chd6: '#4f46e5', airv: '#0891b2'
};

const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, border: { display: false } }
    },
    plugins: {
        legend: { labels: { usePointStyle: true, boxWidth: 6, padding: 20 } },
        tooltip: { backgroundColor: 'rgba(255,255,255,0.9)', titleColor: '#000', bodyColor: '#333', borderColor: 'rgba(0,0,0,0.05)', borderWidth: 1 }
    },
    interaction: { mode: 'index', intersect: false }
};

export function PMChart({ data, stations }) {
    const chartData = {
        labels: data.timestamps,
        datasets: stations.map(s => ({
            label: s.label,
            data: data[s.id],
            borderColor: STATION_COLORS[s.id] || '#999',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4
        }))
    };

    return <Line data={chartData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, title: { display: true, text: "District Pollution Levels", align: 'start', font: { size: 16, weight: 'bold' } } } }} />;
}

export function TempChart({ data }) {
    const chartData = {
        labels: data.timestamps,
        datasets: [
            {
                label: 'Temperature',
                data: data.temps,
                borderColor: '#eab308',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(234, 179, 8, 0.5)');
                    gradient.addColorStop(1, 'rgba(234, 179, 8, 0.0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointRadius: 0
            },
            {
                label: 'Feels Like',
                data: data.feels,
                borderColor: '#f97316',
                borderDash: [5, 5],
                backgroundColor: 'transparent',
                fill: false,
                tension: 0.4,
                pointRadius: 0
            }
        ]
    };

    return <Line data={chartData} options={commonOptions} />;
}

export function WindChart({ data }) {
    const maxWind = Math.max(...(data.windSpeeds || []).filter(v => v != null && !isNaN(v)), 0);

    const windBenchmarks = {
        lightAir: { val: 0.5, label: 'Light Air', color: '#94a3b8' }, // gray-400 equivalentish
        lightBreeze: { val: 1.6, label: 'Light Breeze', color: '#10b981' },
        gentleBreeze: { val: 3.4, label: 'Gentle Breeze', color: '#3b82f6' },
        moderateBreeze: { val: 5.5, label: 'Moderate', color: '#f59e0b' },
        freshBreeze: { val: 8.0, label: 'Fresh', color: '#f97316' },
        strongBreeze: { val: 10.8, label: 'Strong', color: '#ef4444' },
        gale: { val: 13.9, label: 'Gale', color: '#7f1d1d' }
    };

    const annotations = {};
    for (const [key, b] of Object.entries(windBenchmarks)) {
        if (b.val <= maxWind + 2) {
            annotations[key] = {
                type: 'line',
                yMin: b.val,
                yMax: b.val,
                borderColor: b.color === '#94a3b8' ? 'rgba(0,0,0,0.1)' : b.color + '60',
                borderWidth: 1,
                borderDash: [4, 4],
                label: {
                    content: b.label,
                    display: true,
                    color: b.color,
                    font: { size: 10 },
                    position: 'start',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    yAdjust: -6
                }
            };
        }
    }

    const chartData = {
        labels: data.timestamps,
        datasets: [{
            label: 'Wind Speed',
            data: data.windSpeeds,
            backgroundColor: '#3b82f6',
            borderRadius: 4
        }]
    };

    return <Bar data={chartData} options={{ ...commonOptions, plugins: { ...commonOptions.plugins, annotation: { annotations } } }} />;
}
