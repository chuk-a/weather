import React, { useState, useMemo } from "react";
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
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StationTable({ stations, metrics, isCompact = false }) {
    const [sorting, setSorting] = useState([{ id: 'val', desc: true }]);

    // Define Columns inside component to respond to isCompact
    const columns = useMemo(() => {
        const cols = [
            {
                accessorKey: "label",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-300 pl-0 h-auto py-0"
                    >
                        District
                        <ArrowUpDown className="ml-1.5 h-2.5 w-2.5" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-300 leading-none">{row.getValue("label")}</span>
                    </div>
                ),
            },
            {
                accessorKey: "val",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-300 h-auto py-0 ml-auto"
                    >
                        µg/m³
                        <ArrowUpDown className="ml-1.5 h-2.5 w-2.5" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const val = row.getValue("val");
                    let color = "text-zinc-500";
                    if (val <= 12) color = "text-emerald-400";
                    else if (val <= 35) color = "text-amber-400";
                    else if (val <= 55) color = "text-orange-400";
                    else if (val <= 150) color = "text-red-500";
                    else if (val > 150) color = "text-rose-600";

                    return <div className={`font-mono text-right text-xs font-bold ${color}`}>{val ?? '--'}</div>;
                },
            }
        ];

        if (!isCompact) {
            cols.push({
                accessorKey: "status",
                header: "AQ_STATUS",
                cell: ({ row }) => {
                    const val = row.getValue("val");
                    let label = "Offline";
                    let bg = "bg-zinc-500/10 text-zinc-500";

                    if (val <= 12) { label = "Good"; bg = "bg-emerald-500/10 text-emerald-500"; }
                    else if (val <= 35) { label = "Moderate"; bg = "bg-amber-500/10 text-amber-500"; }
                    else if (val <= 55) { label = "Sensitive"; bg = "bg-orange-500/10 text-orange-500"; }
                    else if (val <= 150) { label = "Unhealthy"; bg = "bg-red-500/10 text-red-500"; }
                    else if (val > 150) { label = "Hazardous"; bg = "bg-rose-900/20 text-rose-500"; }

                    if (val == null) return <span className="text-zinc-600 text-[8px] uppercase">No Signal</span>;

                    return (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${bg}`}>
                            {label}
                        </span>
                    );
                },
            });

            cols.push({
                accessorKey: "time",
                header: "LAST_SYNC",
                cell: ({ row }) => <div className="text-zinc-600 text-[10px] font-mono">{row.getValue("time")?.split(',')[0] || '--'}</div>,
            });
        }

        return cols;
    }, [isCompact]);

    // Merge static station info with dynamic metrics
    const data = useMemo(() => {
        return stations.map(s => {
            const m = metrics?.stations.find(st => st.id === s.id);
            return {
                ...s,
                val: m?.val,
                time: m?.time,
                status: m?.val // dummy for accessor
            };
        });
    }, [stations, metrics]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    });

    return (
        <div className="rounded-md border border-zinc-900 bg-zinc-950/20">
            <Table>
                <TableHeader className="bg-zinc-900/40">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="border-zinc-900 hover:bg-transparent h-10">
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id} className="px-3 h-10">
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
                                className="border-zinc-900 hover:bg-emerald-500/5 transition-colors h-9"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="px-3 py-1">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-600 font-mono text-xs">
                                NO_SIGNAL_DETECTED
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
