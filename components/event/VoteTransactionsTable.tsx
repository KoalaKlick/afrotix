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
import { Badge } from "@/components/ui/badge";
import { 
    ChevronLeft, 
    ChevronRight, 
    CheckCircle2, 
    Clock, 
    Hash
} from "lucide-react";
import { format } from "date-fns";

interface Transaction {
    id: string;
    voteCount: number;
    amount: number;
    currency: string;
    reference: string;
    status: string;
    createdAt: string;
    voterEmail?: string;
    voterPhone?: string;
    nomineeName?: string;
    nomineeCode?: string;
}

interface VoteTransactionsTableProps {
    readonly initialData: {
        transactions: Transaction[];
        total: number;
    };
    readonly eventId: string;
    readonly fetchPage: (page: number) => Promise<{ transactions: Transaction[]; total: number }>;
}

/**
 * Anonymized vote transactions table.
 * Shows payment info (amount, date, status) but NEVER reveals
 * voter identity or which nominee was voted for.
 */
export function VoteTransactionsTable({ initialData, eventId, fetchPage }: VoteTransactionsTableProps) {
    const [data, setData] = useState(initialData.transactions);
    const [total, setTotal] = useState(initialData.total);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const limit = 10;
    const totalPages = Math.ceil(total / limit);

    const handlePageChange = async (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || isLoading) return;
        
        setIsLoading(true);
        try {
            const result = await fetchPage(newPage);
            setData(result.transactions);
            setTotal(result.total);
            setPage(newPage);
        } catch (error) {
            console.error("Failed to fetch page:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 px-4">
            <div className="rounded-lg border bg-card">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="text-center">Votes</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Voter</TableHead>
                            <TableHead>Nominee</TableHead>
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
                                    No successful transactions found for this event.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((tx) => (
                                <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center justify-center size-7 rounded-full bg-primary-50 text-primary-700 font-bold text-xs ring-1 ring-primary-200">
                                            {tx.voteCount}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-mono text-sm font-semibold">
                                                {tx.currency} {tx.amount.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Hash className="size-2.5" />
                                                {tx.reference.slice(0, 12)}...
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="size-3" />
                                                {format(new Date(tx.createdAt), "MMM d, yyyy")}
                                            </span>
                                            <span>{format(new Date(tx.createdAt), "HH:mm")}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            {tx.voterEmail ? (
                                                <span className="font-medium text-[13px]">{tx.voterEmail}</span>
                                            ) : (
                                                <span className="text-muted-foreground text-[13px]">No email</span>
                                            )}
                                            {tx.voterPhone && (
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {tx.voterPhone}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{tx.nomineeName || "N/A"}</span>
                                            {tx.nomineeCode && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    #{tx.nomineeCode}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant="secondary" 
                                            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 flex items-center gap-1 w-fit"
                                        >
                                            <CheckCircle2 className="size-3" />
                                            Successful
                                        </Badge>
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
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <span className="text-xs font-medium">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page === totalPages || isLoading}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
