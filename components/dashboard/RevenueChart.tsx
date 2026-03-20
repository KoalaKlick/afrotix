"use client";

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import {
    ChartContainer,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";

interface RevenueChartProps {
    readonly data: { month: string; revenue: number }[];
}

const chartConfig: ChartConfig = {
    revenue: {
        label: "Revenue",
        color: "var(--color-tertiary-500)",
    },
};

function formatMonth(month: string) {
    const [year, m] = month.split("-");
    const date = new Date(Number(year), Number(m) - 1);
    return date.toLocaleString("default", { month: "short" });
}

export function RevenueChart({ data }: RevenueChartProps) {
    const hasData = data.some((d) => d.revenue > 0);

    return (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="size-4 text-tertiary-500" />
                <h3 className="font-semibold">Revenue Overview</h3>
            </div>
            {hasData ? (
                <ChartContainer config={chartConfig} className="h-50 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-tertiary-500)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-tertiary-500)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickFormatter={formatMonth}
                                tickLine={false}
                                axisLine={false}
                                fontSize={12}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                fontSize={12}
                                tickFormatter={(v) =>
                                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                                }
                            />
                            <Tooltip
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(val) => formatMonth(val)}
                                        formatter={(value) =>
                                            Number(value).toLocaleString(undefined, {
                                                style: "currency",
                                                currency: "GHS",
                                                minimumFractionDigits: 0,
                                            })
                                        }
                                    />
                                }
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="var(--color-tertiary-500)"
                                strokeWidth={2}
                                fill="url(#revenueGrad)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>
            ) : (
                <div className="flex h-50 items-center justify-center text-sm text-muted-foreground">
                    No revenue data yet
                </div>
            )}
        </div>
    );
}
