"use client";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Tooltip,
    Legend,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import {
    ChartContainer,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { PieChart as PieChartIcon } from "lucide-react";
import type { VotingChartCategory } from "./VotingBarChart";
import type { ReactNode } from "react";
import { Card, CardHeader } from "../ui/card";

const PIE_COLORS = [
    "var(--color-primary-500)",
    "var(--color-secondary-400)",
    "var(--color-tertiary-500)",
    "var(--color-sepia-500)",
    "var(--color-primary-300)",
    "var(--color-secondary-600)",
    "var(--color-tertiary-300)",
    "var(--color-sepia-300)",
    "var(--color-primary-700)",
    "var(--color-tertiary-700)",
];

function PieChartTooltip({ active, payload }: TooltipContentProps): ReactNode {
    if (!active || !payload?.length) return null;
    const entry = payload[0];
    const fullName = entry?.payload?.fullName as string;
    const nominees = entry?.payload?.nominees as number;
    const votes = entry?.payload?.votes as number;
    return (
        <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
            <p className="font-semibold">{fullName}</p>
            <p className="text-muted-foreground">{nominees} nominees</p>
            <p className="text-muted-foreground">{votes} total votes</p>
        </div>
    );
}

interface VotingPieChartProps {
    readonly categories: VotingChartCategory[];
    readonly onCategoryClick?: (category: VotingChartCategory) => void;
}

export function VotingPieChart({ categories, onCategoryClick }: VotingPieChartProps) {
    const chartConfig: ChartConfig = {};
    categories.forEach((cat, i) => {
        chartConfig[cat.id] = {
            label: cat.name,
            color: PIE_COLORS[i % PIE_COLORS.length],
        };
    });

    const data = categories.map((cat, i) => ({
        name: cat.name.length > 18 ? `${cat.name.slice(0, 17)}…` : cat.name,
        fullName: cat.name,
        value: cat.votingOptions.length,
        nominees: cat.votingOptions.length,
        votes: cat.votingOptions.reduce((s, o) => s + o.votesCount, 0),
        fill: PIE_COLORS[i % PIE_COLORS.length],
        categoryId: cat.id,
    }));

    return (
        <Card className="">
            <CardHeader className="mb-4 flex items-center gap-2">
                <PieChartIcon className="size-4 text-secondary-500" />
                <h3 className="font-semibold">Nominees by Category</h3>
            </CardHeader>
            <ChartContainer config={chartConfig} className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            strokeWidth={0}
                            cursor={onCategoryClick ? "pointer" : undefined}
                            onClick={(_data, index) => {
                                if (!onCategoryClick) return;
                                const cat = categories[index];
                                if (cat) onCategoryClick(cat);
                            }}
                        />
                        <Tooltip content={PieChartTooltip} />
                        <Legend
                            content={<ChartLegendContent className="flex-col items-start" />}
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            wrapperStyle={{ paddingLeft: 16 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </ChartContainer>
            {onCategoryClick && (
                <p className="mt-2 text-xs text-muted-foreground text-center">
                    Click a slice to view category breakdown
                </p>
            )}
        </Card>
    );
}
