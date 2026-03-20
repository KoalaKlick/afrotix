"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Tooltip,
    Legend,
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
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";
import type { VotingChartCategory } from "./VotingBarChart";
import { Trophy, Vote, User } from "lucide-react";
import { getEventImageUrl } from "@/lib/image-url-utils";

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

function ModalPieTooltip({ active, payload }: TooltipContentProps): ReactNode {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
    const fullName = entry?.payload?.fullName as string;
    const pct = entry?.payload?.pct as string;
    return (
        <div className="rounded-lg border border-primary-900/20 bg-background px-3 py-2 text-sm shadow-md">
            <p className="font-semibold text-primary-500">{fullName}</p>
            <p className="text-muted-foreground">{Number(entry?.value ?? 0).toLocaleString()} votes ({pct}%)</p>
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
        pct: totalVotes > 0 ? ((opt.votesCount / totalVotes) * 100).toFixed(1) : "0",
    }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-lg border-primary-900/10 overflow-hidden "
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-primary-500">
                        <Vote className="size-5" />
                        {category.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Summary */}
                    <div className="flex items-center justify-between rounded-lg border border-secondary-900/10 px-4 py-3 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(234,179,8,0.0),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(22,163,74,0.0),transparent_26%)]" >
                        <div className="text-sm text-muted-foreground">
                            Total Votes
                            <p className="text-lg font-bold text-primary-500">{totalVotes.toLocaleString()}</p>
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

                    {/* Pie Chart */}
                    <ChartContainer config={chartConfig} className="h-56 w-full [&>div]:aspect-auto!">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="votes"
                                    nameKey="name"
                                    cx="35%"
                                    cy="50%"
                                    innerRadius="45%"
                                    outerRadius="80%"
                                    paddingAngle={2}
                                    strokeWidth={0}
                                />
                                <Tooltip content={ModalPieTooltip} />
                                <Legend
                                    layout="vertical"
                                    align="right"
                                    verticalAlign="middle"
                                    content={<ChartLegendContent className="flex-col items-start" />}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>

                    {/* Rankings Table */}
                    <div className="rounded-lg border border-tertiary-900/10 overflow-hidden">
                        <div className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-x-3 px-4 py-2 border-b border-tertiary-900/10 text-xs font-medium text-muted-foreground" style={{ backgroundImage: "radial-gradient(circle at top right, color-mix(in srgb, var(--color-tertiary-600) 10%, transparent), transparent 60%)" }}>
                            <span>#</span>
                            <span className="w-8"></span>
                            <span>Nominee</span>
                            <span className="text-right">Votes</span>
                            <span className="text-right">Share</span>
                        </div>
                        <div className="divide-y max-h-60 overflow-y-auto">
                            {sorted.map((opt, i) => {
                                const pct = totalVotes > 0 ? ((opt.votesCount / totalVotes) * 100).toFixed(1) : "0";
                                const displayImage = opt.finalImage || opt.imageUrl;
                                const displayImageUrl = getEventImageUrl(displayImage);
                                return (
                                    <div key={opt.id} className="grid grid-cols-[auto_auto_1fr_auto_auto] gap-x-3 px-4 py-2.5 text-sm items-center">
                                        <span className="text-muted-foreground font-medium w-5">{i + 1}</span>
                                        <div className="size-8 rounded-md overflow-hidden bg-muted flex items-center justify-center border border-primary-900/10">
                                            {displayImageUrl ? (
                                                <Image
                                                    src={displayImageUrl}
                                                    alt={opt.optionText}
                                                    width={32}
                                                    height={32}
                                                    className="size-full object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <User className="size-4 text-muted-foreground" />
                                            )}
                                        </div>
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
