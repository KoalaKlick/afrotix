/**
 * Dashboard Stats Card Component
 * Displays a single statistic with icon, value, and optional trend
 */

import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatsCardProps {
    readonly title: string;
    readonly value: string | number;
    readonly description?: string;
    readonly icon: LucideIcon;
    readonly trend?: {
        value: number;
        isPositive: boolean;
    };
    readonly className?: string;
}

export function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    className,
}: StatsCardProps) {
    return (
        <div className={cn("bg-card border rounded-xl p-6 shadow-sm", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="size-5 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                </div>
                {trend && (
                    <div
                        className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            trend.isPositive ? "text-green-600" : "text-red-600"
                        )}
                    >
                        {trend.isPositive ? (
                            <ArrowUp className="size-3" />
                        ) : (
                            <ArrowDown className="size-3" />
                        )}
                        {Math.abs(trend.value)}%
                    </div>
                )}
            </div>
            <div className="mt-4">
                <p className="text-3xl font-bold">{value}</p>
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
            </div>
        </div>
    );
}
