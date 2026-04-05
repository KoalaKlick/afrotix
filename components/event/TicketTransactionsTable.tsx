"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
    ChevronLeft, 
    ChevronRight,
    ArrowUpDown,
    Search,
    Ticket
} from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "../shared/status-badge";
import { useDataTable } from "@/lib/hooks/use-data-table";
import { Input } from "@/components/ui/input";
import { formatAmount } from "@/lib/utils";

interface Transaction {
    id: string;
    orderNumber: string;
    buyerName: string | null;
    buyerEmail: string | null;
    buyerPhone: string | null;
    amount: number;
    fees: number;
    currency: string;
    status: string;
    ticketCount: number;
    createdAt: string;
}

interface TicketTransactionsTableProps {
    readonly initialData: {
        transactions: Transaction[];
        total: number;
    };
    readonly eventId: string;
    readonly fetchPage: (options: { 
        page: number; 
        limit: number; 
        search?: string; 
        sortBy?: string; 
        sortDir?: "asc" | "desc" 
    }) => Promise<{ transactions: Transaction[]; total: number }>;
}

export function TicketTransactionsTable({ initialData, eventId, fetchPage }: TicketTransactionsTableProps) {
    const {
        data,
        total,
        page,
        totalPages,
        limit,
        isLoading,
        searchQuery,
        setSearchQuery,
        handlePageChange,
        handleSort,
    } = useDataTable<Transaction>({
        initialData: initialData.transactions,
        initialTotal: initialData.total,
        fetchData: fetchPage,
    });

    return (
        <div className="space-y-4 px-0">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                        placeholder="Filter by order # or buyer..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
            </div>

            <div className="rounded-lg border bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-32">
                                <button 
                                    onClick={() => handleSort('orderNumber')}
                                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                                >
                                    Order #
                                    <ArrowUpDown className="size-3" />
                                </button>
                            </TableHead>
                            <TableHead>Buyer</TableHead>
                            <TableHead className="text-center">
                                <button 
                                    onClick={() => handleSort('ticketCount')}
                                    className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors"
                                >
                                    Tickets
                                    <ArrowUpDown className="size-3" />
                                </button>
                            </TableHead>
                            <TableHead>
                                <button 
                                    onClick={() => handleSort('amount')}
                                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                                >
                                    Amount
                                    <ArrowUpDown className="size-3" />
                                </button>
                            </TableHead>
                            <TableHead>
                                <button 
                                    onClick={() => handleSort('createdAt')}
                                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                                >
                                    Date
                                    <ArrowUpDown className="size-3" />
                                </button>
                            </TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={`skeleton-${i}`} className="animate-pulse">
                                    <TableCell colSpan={6} className="h-16 bg-muted/20" />
                                </TableRow>
                            ))
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No matching ticket transactions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((tx) => (
                                <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors text-sm">
                                    <TableCell className="font-medium font-mono text-xs">
                                        {tx.orderNumber}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-xs">{tx.buyerName || "Guest checkout"}</span>
                                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                {tx.buyerEmail || tx.buyerPhone || "No contact"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center justify-center size-6 rounded bg-muted font-bold text-[10px]">
                                            {tx.ticketCount}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-xs font-semibold">
                                            {formatAmount(tx.amount, tx.currency)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-[10px] text-muted-foreground">
                                            <span>{format(new Date(tx.createdAt), "MMM d, yyyy")}</span>
                                            <span>{format(new Date(tx.createdAt), "HH:mm")}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge variant="success" className="h-5 px-2 text-[10px]"/>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-muted-foreground">
                        Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} transactions
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={page === 1 || isLoading}
                            className="h-7 w-7 p-0"
                        >
                            <ChevronLeft className="size-3" />
                        </Button>
                        <span className="text-[10px] font-medium">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages || isLoading}
                            className="h-7 w-7 p-0"
                        >
                            <ChevronRight className="size-3" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
