"use client";

import type { ReactNode } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ChartContainer,
    type ChartConfig,
} from "@/components/ui/chart";
import type { VotingChartCategory } from "./VotingBarChart";
import { Trophy, Vote } from "lucide-react";

const BAR_COLORS = [
    "var(--color-primary-500)",
    "var(--color-secondary-400)",
    "var(--color-tertiary-500)",
    "var(--color-sepia-500)",
    "var(--color-primary-300)",
    "var(--color-secondary-600)",
    "var(--color-tertiary-300)",
    "var(--color-sepia-300)",
];

function ModalBarTooltip({ active, payload }: TooltipContentProps): ReactNode {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
    const fullName = entry?.payload?.fullName as string;
    return (
        <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
            <p className="font-semibold">{fullName}</p>
            <p className="text-muted-foreground">{Number(entry?.value ?? 0).toLocaleString()} votes</p>
        </div>
    );
}

interface CategoryDetailModalProps {
    readonly category: VotingChartCategory | null;
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
}

export function CategoryDetailModal({ category, open, onOpenChange }: CategoryDetailModalProps) {
    if (!category) return null;

    const sorted = [...category.votingOptions].sort((a, b) => b.votesCount - a.votesCount);
    const totalVotes = sorted.reduce((sum, o) => sum + o.votesCount, 0);
    const leader = sorted[0];

    const chartConfig: ChartConfig = {
        votes: { label: "Votes", color: BAR_COLORS[0] },
    };

    const data = sorted.map((opt, i) => ({
        name: opt.optionText.length > 12 ? `${opt.optionText.slice(0, 11)}…` : opt.optionText,
        fullName: opt.optionText,
        votes: opt.votesCount,
        fill: BAR_COLORS[i % BAR_COLORS.length],
    }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Vote className="size-5 text-primary-500" />
                        {category.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Summary */}
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                            Total Votes
                            <p className="text-lg font-bold text-foreground">{totalVotes.toLocaleString()}</p>
                        </div>
                        {leader && totalVotes > 0 && (
                            <div className="text-right text-sm text-muted-foreground">
                                <div className="flex items-center gap-1 justify-end">
                                    <Trophy className="size-3.5 text-secondary-500" />
                                    Leading
                                </div>
                                <p className="font-semibold text-foreground">{leader.optionText}</p>
                            </div>
                        )}
                    </div>

                    {/* Bar Chart */}
                    <ChartContainer config={chartConfig} className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                layout="vertical"
                                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} className="fill-muted-foreground" />
                                <Tooltip content={ModalBarTooltip} />
                                <Bar dataKey="votes" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>

                    {/* Rankings Table */}
                    <div className="rounded-lg border">
                        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 px-4 py-2 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
                            <span>#</span>
                            <span>Nominee</span>
                            <span className="text-right">Votes</span>
                            <span className="text-right">Share</span>
                        </div>
                        <div className="divide-y max-h-60 overflow-y-auto">
                            {sorted.map((opt, i) => {
                                const pct = totalVotes > 0 ? ((opt.votesCount / totalVotes) * 100).toFixed(1) : "0";
                                return (
                                    <div key={opt.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 px-4 py-2.5 text-sm items-center">
                                        <span className="text-muted-foreground font-medium w-5">{i + 1}</span>
                                        <span className="truncate">{opt.optionText}</span>
                                        <span className="text-right font-medium tabular-nums">{opt.votesCount.toLocaleString()}</span>
                                        <span className="text-right text-muted-foreground tabular-nums w-14">{pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
