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
                        className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-600 pl-0 h-auto py-0 font-bold"
                    >
                        District
                        <ArrowUpDown className="ml-1.5 h-2.5 w-2.5" />
                    </Button>
                ),
                cell: ({ row }) => (
                    <div className="flex flex-col py-1">
                        <span className="text-sm font-bold text-zinc-900 leading-tight">{row.getValue("label")}</span>
                        <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold tracking-tighter">
                            SYNC: {row.original.time?.split(',')[0] || '--'}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: "val",
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-zinc-600 h-auto py-0 ml-auto font-bold"
                    >
                        µg/m³
                        <ArrowUpDown className="ml-1.5 h-2.5 w-2.5" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const val = row.getValue("val");
                    let color = "text-zinc-400";
                    if (val <= 12) color = "text-emerald-600";
                    else if (val <= 35) color = "text-amber-600";
                    else if (val <= 55) color = "text-orange-600";
                    else if (val <= 150) color = "text-red-600";
                    else if (val > 150) color = "text-rose-700";

                    return <div className={`font-mono text-right text-sm font-black ${color}`}>{val ?? '--'}</div>;
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
                    let bg = "bg-zinc-100 text-zinc-400 border-zinc-200";

                    if (val <= 12) { label = "Good"; bg = "bg-emerald-50 text-emerald-700 border-emerald-100"; }
                    else if (val <= 35) { label = "Moderate"; bg = "bg-amber-50 text-amber-700 border-amber-100"; }
                    else if (val <= 55) { label = "Sensitive"; bg = "bg-orange-50 text-orange-700 border-orange-100"; }
                    else if (val <= 150) { label = "Unhealthy"; bg = "bg-red-50 text-red-700 border-red-100"; }
                    else if (val > 150) { label = "Hazardous"; bg = "bg-rose-50 text-rose-700 border-rose-100"; }

                    if (val == null) return <span className="text-zinc-400 text-[8px] font-bold border border-zinc-100 px-1 rounded uppercase">No Signal</span>;

                    return (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${bg}`}>
                            {label}
                        </span>
                    );
                },
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
        <div className="bg-white">
            <Table>
                <TableHeader className="bg-zinc-50 border-y border-zinc-100">
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
                                className="border-zinc-50 hover:bg-zinc-50/50 transition-colors h-11"
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
                            <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-400 font-mono text-[10px] font-bold tracking-widest uppercase">
                                SEARCHING_FOR_SIGNALS...
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
