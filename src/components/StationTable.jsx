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
import { ArrowUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StationTable({ stations, metrics, isCompact = false, onSelectionChange, lang = 'en' }) {
    const [sorting, setSorting] = useState([{ id: 'val', desc: true }]);
    const [rowSelection, setRowSelection] = useState({});

    const t = (key) => {
        const dict = {
            en: {
                district: 'District',
                sync: 'Sync',
                active: 'Active Signals',
                stale: 'Stale Nodes',
                nodes: 'NODES',
                searching: 'SEARCHING_FOR_SIGNALS...'
            },
            mn: {
                district: 'Дүүрэг',
                sync: 'Цаг',
                active: 'Идэвхтэй Мэдээлэл',
                stale: 'Хоцрогдсон Цэгүүд',
                nodes: 'ЦЭГ',
                searching: 'СҮЛЖЭЭГ ШАЛГАЖ БАЙНА...'
            }
        };
        return dict[lang][key] || key;
    };

    useEffect(() => {
        const selectedIds = Object.keys(rowSelection);
        if (onSelectionChange) onSelectionChange(selectedIds);
    }, [rowSelection, onSelectionChange]);

    // Define Columns inside component
    const columns = useMemo(() => {
        const cols = [
            {
                id: "select",
                header: () => <div className="w-4" />,
                cell: ({ row }) => (
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            row.toggleSelected();
                        }}
                        className={cn(
                            "w-4 h-4 rounded border border-border flex items-center justify-center cursor-pointer transition-all",
                            row.getIsSelected() ? "bg-primary border-primary" : "bg-muted/30"
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
                        className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground pl-0 h-auto py-0 font-bold"
                    >
                        {t('district')}
                        <ArrowUpDown className="ml-1.5 h-2.5 w-2.5" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const status = row.original.status;
                    const statusColors = {
                        live: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
                        delayed: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse",
                        stale: "bg-red-500 opacity-50",
                        offline: "bg-muted"
                    };

                    return (
                        <div className="flex items-center gap-3 py-1">
                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusColors[status] || statusColors.offline)} />
                            <span className="text-sm font-bold text-foreground leading-tight truncate">
                                {row.original.flag} {row.getValue("label")}
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
                        className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground h-auto py-0 font-bold"
                    >
                        {t('sync')}
                        <ArrowUpDown className="ml-1.5 h-2.5 w-2.5" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const rawTime = row.getValue("time") || "";
                    let displayTime = "--";

                    if (rawTime.includes(',')) {
                        displayTime = rawTime.split(',')[0].trim();
                    } else if (rawTime.includes(' ')) {
                        displayTime = rawTime.split(' ').pop();
                    }

                    return (
                        <div className="text-[10px] font-mono text-muted-foreground font-bold tabular-nums">
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
                        className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground h-auto py-0 ml-auto font-bold"
                    >
                        µg/m³
                        <ArrowUpDown className="ml-1.5 h-2.5 w-2.5" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const val = row.getValue("val");
                    const trend = row.original.trend;
                    const trendIcons = {
                        up: <span className="text-[10px] ml-1">↑</span>,
                        down: <span className="text-[10px] ml-1">↓</span>,
                        stable: null
                    };

                    let color = "text-muted-foreground";
                    if (val <= 12) color = "text-emerald-500";
                    else if (val <= 35) color = "text-amber-500";
                    else if (val <= 55) color = "text-orange-500";
                    else if (val <= 150) color = "text-red-500";
                    else if (val > 150) color = "text-rose-500 font-black";

                    return (
                        <div className="flex items-center justify-end gap-1">
                            <div className={cn("font-mono text-right text-sm font-black", color)}>
                                {val ?? '--'}
                            </div>
                            <div className={cn("w-3 text-right font-bold", trend === 'up' ? "text-red-500" : trend === 'down' ? "text-emerald-500" : "text-muted/30")}>
                                {trendIcons[trend]}
                            </div>
                        </div>
                    );
                },
            }
        ];

        return cols;
    }, [lang]);

    // Merge static station info with dynamic metrics
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
        <div className="bg-card h-full">
            <Table>
                <TableHeader className="bg-muted/30 border-y border-border/50 sticky top-0 z-20">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="border-transparent hover:bg-transparent">
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className="px-5 h-9">
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {(() => {
                        const rows = table.getRowModel().rows;
                        if (!rows?.length) return (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
                                    {t('searching')}
                                </TableCell>
                            </TableRow>
                        );

                        const activeRows = rows.filter(r => r.original.status === 'live' || r.original.status === 'delayed');
                        const staleRows = rows.filter(r => r.original.status === 'stale' || r.original.status === 'offline');

                        const renderRows = (rowGroup, titleKey, colorClass) => (
                            <>
                                {rowGroup.length > 0 && (
                                    <TableRow className="bg-muted/10 hover:bg-muted/10 border-y border-border/20 pointer-events-none">
                                        <TableCell colSpan={columns.length} className="py-1.5 px-5">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-1 h-3 rounded-full", colorClass)} />
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">
                                                    {t(titleKey)} <span className="ml-1 opacity-50">[{rowGroup.length} {t('nodes')}]</span>
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {rowGroup.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        onClick={() => row.toggleSelected()}
                                        className={cn(
                                            "border-border/40 hover:bg-muted/50 transition-colors h-11 cursor-pointer",
                                            row.getIsSelected() && "bg-muted/40",
                                            (row.original.status === 'stale' || row.original.status === 'offline') && "opacity-60"
                                        )}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="px-5 py-0">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </>
                        );

                        return (
                            <>
                                {renderRows(activeRows, "active", "bg-emerald-500")}
                                {renderRows(staleRows, "stale", "bg-red-500")}
                            </>
                        );
                    })()}
                </TableBody>
            </Table>
        </div>
    );
}
