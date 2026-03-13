/**
 * Dashboard Stats Card Component
 * Displays a single statistic with icon, value, and optional trend
 */

import type { LucideIcon } from "lucide-react";
import NextImage from "next/image";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Derive card bg/border from icon filename color suffix
 */
function getIconColorStyles(iconSrc: string): string {
    const filename = iconSrc.split("/").pop() ?? "";
    const base = filename.replace(".webp", "");
    const color = base.split("-").pop();

    switch (color) {
        case "red":
            return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900";
        case "yellow":
            return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900";
        case "green":
            return "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900";
        case "black":
            return "bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800";
        default:
            return "bg-card";
    }
}

export interface StatsCardProps {
    readonly title: string;
    readonly value: string | number;
    readonly description?: string;
    readonly icon?: LucideIcon;
    readonly iconSrc?: string;
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
    iconSrc,
    trend,
    className,
}: StatsCardProps) {
    const cardStyle = iconSrc ? getIconColorStyles(iconSrc) : "bg-card";

    return (
        <div className={cn("border rounded-xl p-6 shadow-sm relative overflow-hidden", cardStyle, className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {iconSrc && (
                        <NextImage src={iconSrc} alt={title} width={40} height={40} className="size-10 object-contain" />
                    )}
                    {!iconSrc && Icon && (
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="size-5 text-primary" />
                        </div>
                    )}
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
