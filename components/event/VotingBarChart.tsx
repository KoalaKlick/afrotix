"use client";

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
    ChartContainer,
    type ChartConfig,
} from "@/components/ui/chart";
import { BarChart3 } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardHeader } from "../ui/card";

export interface VotingChartCategory {
    id: string;
    name: string;
    votingOptions: {
        id: string;
        optionText: string;
        votesCount: number;
        imageUrl?: string | null;
    }[];
}

interface VotingBarChartProps {
    readonly categories: VotingChartCategory[];
    readonly onCategoryClick?: (category: VotingChartCategory) => void;
}

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

function BarChartTooltip({ active, payload }: TooltipContentProps): ReactNode {
    if (!active || !payload?.length) return null;
    const categoryName = payload[0]?.payload?.fullName as string;
    return (
        <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
            <p className="mb-1 font-semibold">{categoryName}</p>
            {payload.map((entry) => {
                const idx = String(entry.dataKey).replace("nominee", "");
                const name = entry.payload?.[`nomineeName${idx}`] as string;
                return (
                    <div key={String(entry.dataKey)} className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground">{name}:</span>
                        <span className="font-medium">{entry.value}</span>
                    </div>
                );
            })}
        </div>
    );
}

export function VotingBarChart({ categories, onCategoryClick }: VotingBarChartProps) {
    // Build grouped data: each category is a group, each nominee is a bar
    // Find max nominees across categories to create bar keys
    const maxNominees = Math.max(...categories.map(c => c.votingOptions.length), 0);

    const chartConfig: ChartConfig = {};
    for (let i = 0; i < maxNominees; i++) {
        chartConfig[`nominee${i}`] = {
            label: `Nominee ${i + 1}`,
            color: BAR_COLORS[i % BAR_COLORS.length],
        };
    }

    const data = categories.map(cat => {
        const entry: Record<string, string | number> = {
            category: cat.name.length > 15 ? `${cat.name.slice(0, 14)}…` : cat.name,
            categoryId: cat.id,
            fullName: cat.name,
        };
        const sorted = [...cat.votingOptions].sort((a, b) => b.votesCount - a.votesCount);
        sorted.forEach((opt, i) => {
            entry[`nominee${i}`] = opt.votesCount;
            entry[`nomineeName${i}`] = opt.optionText;
        });
        return entry;
    });

    return (
        <Card className="">
            <CardHeader className="mb-4 flex items-center gap-2">
                <BarChart3 className="size-4 text-primary-500" />
                <h3 className="font-semibold">Votes by Category</h3>
            </CardHeader>
            <ChartContainer config={chartConfig} className="h-72 w-full [&>div]:aspect-auto!">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                        onClick={(state) => {
                            if (!onCategoryClick || !state?.activeLabel) return;
                            // Find the category by its truncated label
                            const entry = data.find(d => d.category === state.activeLabel);
                            if (entry) {
                                const cat = categories.find(c => c.id === entry.categoryId);
                                if (cat) onCategoryClick(cat);
                            }
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="category"
                            tick={{ fontSize: 12 }}
                            className="fill-muted-foreground"
                        />
                        <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 12 }}
                            width={40}
                            className="fill-muted-foreground"
                        />
                        <Tooltip content={BarChartTooltip} />
                        {Array.from({ length: maxNominees }, (_, i) => {
                            const dataKey = `nominee${i}`;
                            return (
                                <Bar
                                    key={dataKey}
                                    dataKey={dataKey}
                                    fill={BAR_COLORS[i % BAR_COLORS.length]}
                                    radius={[4, 4, 0, 0]}
                                    cursor="pointer"
                                />
                            );
                        })}
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
            {onCategoryClick && (
                <p className="mt-2 text-xs text-muted-foreground text-center">
                    Click a category to view detailed breakdown
                </p>
            )}
        </Card>
    );
}
