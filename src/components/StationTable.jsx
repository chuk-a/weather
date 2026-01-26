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

export function StationTable({ stations, metrics, isCompact = false, onSelectionChange }) {
    const [sorting, setSorting] = useState([{ id: 'val', desc: true }]);
    const [rowSelection, setRowSelection] = useState({});

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
                        District
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

                    const rawTime = row.original.time || "";
                    let displayTime = "--";

                    if (rawTime.includes(',')) {
                        displayTime = rawTime.split(',')[0].trim();
                    } else if (rawTime.includes(' ')) {
                        // Extract HH:mm from "YYYY-MM-DD HH:mm"
                        displayTime = rawTime.split(' ').pop();
                    }

                    return (
                        <div className="flex items-center gap-3 py-1">
                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusColors[status] || statusColors.offline)} />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-foreground leading-tight">
                                    {row.original.flag} {row.getValue("label")}
                                </span>
                                <span className="text-[9px] font-mono text-muted-foreground uppercase font-bold tracking-tighter">
                                    SYNC: {displayTime}
                                </span>
                            </div>
                        </div>
                    );
                },
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
    }, []);

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
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                onClick={() => row.toggleSelected()}
                                className={cn(
                                    "border-border/40 hover:bg-muted/50 transition-colors h-11 cursor-pointer",
                                    row.getIsSelected() && "bg-muted/40"
                                )}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="px-5 py-0">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground font-mono text-[10px] font-bold tracking-widest uppercase">
                                SEARCHING_FOR_SIGNALS...
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
