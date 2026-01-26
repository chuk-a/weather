import React, { useState } from "react";
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
} from "@/components/ui/table"; // Shadcn Table
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const columns = [
    {
        accessorKey: "label",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-300 pl-0"
                >
                    Station
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="font-bold text-zinc-300">{row.getValue("label")}</div>,
    },
    {
        accessorKey: "val",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-300"
                >
                    PM2.5 (µg/m³)
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const val = row.getValue("val");
            let color = "text-zinc-500";
            if (val <= 12) color = "text-emerald-400";
            else if (val <= 35) color = "text-amber-400";
            else if (val <= 55) color = "text-orange-400";
            else if (val <= 150) color = "text-red-500";
            else if (val > 150) color = "text-rose-600";

            return <div className={`font-mono text-right ${color}`}>{val ?? '--'}</div>;
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const val = row.getValue("val");
            let label = "Offline";
            let bg = "bg-zinc-500/10 text-zinc-500";

            if (val <= 12) { label = "Good"; bg = "bg-emerald-500/10 text-emerald-500"; }
            else if (val <= 35) { label = "Moderate"; bg = "bg-amber-500/10 text-amber-500"; }
            else if (val <= 55) { label = "Sensitive"; bg = "bg-orange-500/10 text-orange-500"; }
            else if (val <= 150) { label = "Unhealthy"; bg = "bg-red-500/10 text-red-500"; }
            else if (val > 150) { label = "Hazardous"; bg = "bg-rose-900/20 text-rose-500"; }

            if (val == null) return <span className="text-zinc-600 text-[10px] uppercase">No Signal</span>;

            return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${bg}`}>
                    {label}
                </span>
            );
        },
    },
    {
        accessorKey: "time",
        header: "Last Update",
        cell: ({ row }) => <div className="text-zinc-500 text-[10px] font-mono">{row.getValue("time") || '--'}</div>,
    },
];

export function StationTable({ stations, metrics }) {
    const [sorting, setSorting] = useState([]);

    // Merge static station info with dynamic metrics
    const data = React.useMemo(() => {
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
        <div className="rounded-md border border-zinc-900 bg-zinc-950/50">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="border-zinc-900 hover:bg-zinc-900/50">
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                className="border-zinc-900 hover:bg-zinc-900/50 transition-colors"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
