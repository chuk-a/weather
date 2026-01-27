import React, { useState, useMemo, useEffect } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Check, SignalHigh } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StationTable({ stations, metrics, onSelectionChange, lang = 'en' }) {
    const [sorting, setSorting] = useState([{ id: 'val', desc: true }]);
    const [rowSelection, setRowSelection] = useState({});

    const t = (key) => {
        const dict = {
            en: {
                district: 'DISTRICT',
                sync: 'SYNC',
                val: 'MG/M³',
                active: 'ACTIVE SIGNALS',
                stale: 'STALE NODES',
                nodes: 'NODES',
                live: 'LIVE DISTRICT NODE STATUS',
                regional: 'REGIONAL SIGNALS'
            },
            mn: {
                district: 'ДҮҮРЭГ',
                sync: 'ЦАГ',
                val: 'MG/M³',
                active: 'ИДЭВХТЭЙ ЦЭГҮҮД',
                stale: 'ХОЦРОГДСОН ЦЭГҮҮД',
                nodes: 'ЦЭГ',
                live: 'ДҮҮРГҮҮДИЙН ТӨЛӨВ',
                regional: 'БҮС НҮТГИЙН МЭДЭЭ'
            }
        };
        return dict[lang][key] || key;
    };

    useEffect(() => {
        const selectedIds = Object.keys(rowSelection);
        if (onSelectionChange) onSelectionChange(selectedIds);
    }, [rowSelection, onSelectionChange]);

    const columns = useMemo(() => [
        {
            id: "select",
            header: () => <div className="w-10" />,
            cell: ({ row }) => (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        row.toggleSelected();
                    }}
                    className={cn(
                        "w-4 h-4 rounded border border-white/10 flex items-center justify-center cursor-pointer transition-all ml-1",
                        row.getIsSelected() ? "bg-primary border-primary" : "bg-white/5 group-hover:bg-white/10"
                    )}
                >
                    {row.getIsSelected() && <Check className="w-3 h-3 text-primary-foreground stroke-[4]" />}
                </div>
            ),
        },
        {
            accessorKey: "label",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-primary transition-colors h-auto py-0 pl-0 group"
                >
                    {t('district')}
                    <ArrowUpDown className="ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
            ),
            cell: ({ row }) => {
                const status = row.original.status;
                const statusColors = {
                    live: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
                    delayed: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse",
                    stale: "bg-red-500 opacity-50",
                    offline: "bg-muted/40"
                };

                return (
                    <div className="flex items-center gap-4 py-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusColors[status] || statusColors.offline)} />
                        <div className="text-[10px] opacity-20 group-hover:opacity-40 transition-opacity shrink-0">
                            {row.original.label.toLowerCase().includes('school') ? '🏫' :
                                row.original.label.toLowerCase().includes('kinder') ? '🧸' :
                                    row.original.label.toLowerCase().includes('embassy') ? '🏛️' : '📡'}
                        </div>
                        <span className="text-xs font-black uppercase tracking-tight text-foreground/80 group-hover:text-foreground transition-colors truncate">
                            {row.getValue("label")}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "time",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-primary transition-colors h-auto py-0 group"
                >
                    {t('sync')}
                    <ArrowUpDown className="ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
            ),
            cell: ({ row }) => {
                const rawTime = row.getValue("time") || "";
                let displayTime = "--";
                // Display the full timestamp with date for clarity
                if (rawTime && rawTime !== "ERROR" && rawTime !== "OFFLINE") {
                    displayTime = rawTime;
                } else if (rawTime === "ERROR" || rawTime === "OFFLINE") {
                    displayTime = rawTime;
                } else {
                    displayTime = "--";
                }
                return (
                    <div className="text-[10px] font-black text-muted-foreground/30 tabular-nums uppercase">
                        {displayTime}
                    </div>
                );
            }
        },
        {
            accessorKey: "val",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-primary transition-colors h-auto py-0 ml-auto group"
                >
                    {t('val')}
                    <ArrowUpDown className="ml-2 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
            ),
            cell: ({ row }) => {
                const val = row.getValue("val");
                let color = "text-muted-foreground/20";
                if (val != null) {
                    if (val <= 12) color = "text-emerald-500";
                    else if (val <= 35) color = "text-amber-500";
                    else if (val <= 55) color = "text-orange-500";
                    else color = "text-rose-500 font-black";
                }

                return (
                    <div className="flex items-center justify-end gap-3 group/val">
                        <div className={cn("text-lg font-black tracking-tighter tabular-nums transition-all group-hover/val:scale-110", color)}>
                            {val ?? '--'}
                        </div>
                        <SignalHigh className={cn("w-3 h-3 opacity-20", val != null ? "text-primary" : "text-muted")} />
                    </div>
                );
            },
        }
    ], [lang]);

    const data = useMemo(() => {
        if (!metrics) return stations.map(s => ({ ...s, val: null, time: null, status: 'offline', trend: 'stable' }));
        return metrics.stations;
    }, [stations, metrics]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onRowSelectionChange: setRowSelection,
        getRowId: (row) => row.id,
        state: {
            sorting,
            rowSelection,
        },
    });

    return (
        <div className="bg-transparent h-full flex flex-col min-h-0 overflow-hidden font-rajdhani">
            {/* Header section remains sticky */}
            <div className="p-4 border-b border-white/5 flex flex-col gap-1 shrink-0 bg-white/[0.02] relative z-20">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/80">{t('regional')}</span>
                <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">{t('live')}</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                {(() => {
                    const allRows = table.getRowModel().rows;
                    const activeRows = allRows.filter(r => r.original.status === 'live' || r.original.status === 'delayed');
                    const staleRows = allRows.filter(r => r.original.status === 'stale' || r.original.status === 'offline');

                    return (
                        <div className="flex flex-col gap-0">
                            {/* ACTIVE / MAIN TABLE SECTION */}
                            {activeRows.length > 0 && (
                                <div className="flex flex-col">
                                    <div className="bg-white/5 border-y border-white/5 flex items-center px-5 h-8 sticky top-0 z-30 backdrop-blur-md">
                                        <div className="w-1 h-3 rounded-full bg-primary mr-3" />
                                        <span className="text-[9px] font-black uppercase tracking-[.3em] text-primary">
                                            {t('active')} <span className="ml-2 text-primary/40">[{activeRows.length} {t('nodes')}]</span>
                                        </span>
                                    </div>
                                    <Table className="relative z-10 border-collapse">
                                        <TableHeader className="bg-transparent border-b border-white/5 sticky top-8 z-30 backdrop-blur-md">
                                            {table.getHeaderGroups().map((headerGroup) => (
                                                <TableRow key={headerGroup.id} className="border-transparent hover:bg-transparent">
                                                    {headerGroup.headers.map((header) => (
                                                        <TableHead key={header.id} className="px-5 h-10 align-middle">
                                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableHeader>
                                        <TableBody>
                                            {activeRows.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    onClick={() => row.toggleSelected()}
                                                    className={cn(
                                                        "border-white/5 transition-all cursor-pointer group hover:bg-white/[0.03]",
                                                        row.getIsSelected() && "bg-primary/5 border-primary/20"
                                                    )}
                                                >
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id} className="px-5 py-0 h-11 border-none">
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* STALE / BOTTOM LIST SECTION */}
                            {staleRows.length > 0 && (
                                <div className="flex flex-col pb-4">
                                    <div className="bg-white/5 border-y border-white/5 flex items-center px-5 h-8 mt-2">
                                        <div className="w-1 h-3 rounded-full bg-rose-500/60 mr-3 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                                        <span className="text-[9px] font-black uppercase tracking-[.3em] text-rose-500/60">
                                            {t('stale')} <span className="ml-2 opacity-40">[{staleRows.length} {t('nodes')}]</span>
                                        </span>
                                    </div>
                                    <Table className="relative z-10 border-collapse opacity-50">
                                        {/* Optional: Add headers for stale table if preferred, or hide them for brevity */}
                                        <TableBody>
                                            {staleRows.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    onClick={() => row.toggleSelected()}
                                                    className={cn(
                                                        "border-white/5 transition-all cursor-pointer group hover:bg-white/[0.03]",
                                                        row.getIsSelected() && "bg-primary/5 border-primary/20"
                                                    )}
                                                >
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id} className="px-5 py-0 h-10 border-none">
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {allRows.length === 0 && (
                                <div className="h-48 flex flex-col items-center justify-center gap-4 text-center">
                                    <div className="w-10 h-10 rounded-full border border-primary/20 border-t-primary animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/40">SYNCHRONIZING SECURE NETWORK...</span>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* Footer remains sticky */}
            <div className="p-4 border-t border-white/5 bg-black/60 flex items-center justify-between shrink-0 relative z-20">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest leading-none">SECURE_LINK</span>
                </div>
                <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest leading-none">S_ACTIVE</span>
            </div>
        </div>
    );
}
