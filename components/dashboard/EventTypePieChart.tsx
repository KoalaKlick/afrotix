"use client";

import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Legend,
    Tooltip,
} from "recharts";
import {
    ChartContainer,
    ChartTooltipContent,
    ChartLegendContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { PieChart as PieChartIcon } from "lucide-react";

interface EventTypePieChartProps {
    readonly byType: {
        voting: number;
        ticketed: number;
        hybrid: number;
        standard: number;
    };
}

const COLORS = [
    "var(--color-primary-500)",     // red  → voting
    "var(--color-secondary-400)",   // gold → ticketed
    "var(--color-tertiary-500)",    // green → hybrid
    "var(--color-sepia-500)",       // sepia → standard
];

const chartConfig: ChartConfig = {
    voting: { label: "Voting", color: COLORS[0] },
    ticketed: { label: "Ticketed", color: COLORS[1] },
    hybrid: { label: "Hybrid", color: COLORS[2] },
    standard: { label: "Standard", color: COLORS[3] },
};

export function EventTypePieChart({ byType }: EventTypePieChartProps) {
    const data = [
        { name: "Voting", value: byType.voting, key: "voting" },
        { name: "Ticketed", value: byType.ticketed, key: "ticketed" },
        { name: "Hybrid", value: byType.hybrid, key: "hybrid" },
        { name: "Standard", value: byType.standard, key: "standard" },
    ].filter((d) => d.value > 0);

    const total = data.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <PieChartIcon className="size-4 text-secondary-500" />
                <h3 className="font-semibold">Event Types</h3>
            </div>
            {total === 0 ? (
                <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                    No events yet
                </div>
            ) : (
                <ChartContainer config={chartConfig} className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.map((entry) => ({
                                    ...entry,
                                    fill: COLORS[["voting", "ticketed", "hybrid", "standard"].indexOf(entry.key)],
                                }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={70}
                                paddingAngle={3}
                                dataKey="value"
                                nameKey="name"
                                strokeWidth={0}
                            />
                            <Tooltip
                                content={
                                    <ChartTooltipContent hideLabel />
                                }
                            />
                            <Legend
                                content={<ChartLegendContent />}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            )}
        </div>
    );
}
