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

    // Define Columns inside component
    const columns = useMemo(() => {
        const cols = [
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
                cell: ({ row }) => (
                    <div className="flex flex-col py-1">
                        <span className="text-sm font-bold text-foreground leading-tight">{row.getValue("label")}</span>
                        <span className="text-[9px] font-mono text-muted-foreground uppercase font-bold tracking-tighter">
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
                        className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground h-auto py-0 ml-auto font-bold"
                    >
                        µg/m³
                        <ArrowUpDown className="ml-1.5 h-2.5 w-2.5" />
                    </Button>
                ),
                cell: ({ row }) => {
                    const val = row.getValue("val");
                    let color = "text-muted-foreground";
                    if (val <= 12) color = "text-emerald-500";
                    else if (val <= 35) color = "text-amber-500";
                    else if (val <= 55) color = "text-orange-500";
                    else if (val <= 150) color = "text-red-500";
                    else if (val > 150) color = "text-rose-500 font-black";

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
                    let colorSet = "bg-muted text-muted-foreground border-border";

                    if (val <= 12) { label = "Good"; colorSet = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"; }
                    else if (val <= 35) { label = "Moderate"; colorSet = "bg-amber-500/10 text-amber-500 border-amber-500/20"; }
                    else if (val <= 55) { label = "Sensitive"; colorSet = "bg-orange-500/10 text-orange-500 border-orange-500/20"; }
                    else if (val <= 150) { label = "Unhealthy"; colorSet = "bg-red-500/10 text-red-500 border-red-500/20"; }
                    else if (val > 150) { label = "Hazardous"; colorSet = "bg-rose-500/10 text-rose-500 border-rose-500/20"; }

                    if (val == null) return <span className="text-muted-foreground text-[8px] font-bold border border-border px-1 rounded uppercase">No Signal</span>;

                    return (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${colorSet}`}>
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
                                className="border-border/40 hover:bg-muted/50 transition-colors h-11"
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
