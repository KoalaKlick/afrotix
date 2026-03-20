"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";
import { cn, formatAmount } from "@/lib/utils";

interface Order {
    id: string;
    orderNumber: string;
    buyerName: string | null;
    buyerEmail: string;
    total: number | { toNumber?: () => number };
    currency: string;
    status: string;
    createdAt: Date | string;
    event: { title: string };
}

interface RecentOrdersTableProps {
    readonly orders: Order[];
}

const statusStyles: Record<string, string> = {
    confirmed: "bg-tertiary-100 text-tertiary-700 dark:bg-tertiary-900/30 dark:text-tertiary-400",
    paid: "bg-tertiary-100 text-tertiary-700 dark:bg-tertiary-900/30 dark:text-tertiary-400",
    pending: "bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400",
    cancelled: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
    refunded: "bg-muted text-muted-foreground",
};

function formatRelative(date: Date | string) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
    return (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <Receipt className="size-4 text-primary-500" />
                <h3 className="font-semibold">Recent Orders</h3>
            </div>
            {orders.length === 0 ? (
                <div className="flex h-30 items-center justify-center text-sm text-muted-foreground">
                    No orders yet
                </div>
            ) : (
                <div className="overflow-x-auto -mx-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-6">Buyer</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="pr-6 text-right">When</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => {
                                const total =
                                    typeof order.total === "object" && order.total?.toNumber
                                        ? order.total.toNumber()
                                        : Number(order.total);

                                return (
                                    <TableRow key={order.id}>
                                        <TableCell className="pl-6">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {order.buyerName || "—"}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {order.buyerEmail}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="truncate text-sm">
                                                {order.event.title}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm tabular-nums">
                                            {formatAmount(total, order.currency)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={cn(
                                                    "text-[10px] capitalize",
                                                    statusStyles[order.status] ?? statusStyles.pending
                                                )}
                                            >
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-6 text-right text-xs text-muted-foreground">
                                            {formatRelative(order.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
