"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
    Calendar,
    Users,
    Ticket,
    Vote,
    TrendingUp,
    Clock,
    CheckCircle,
    FileText,
    Zap,
    Ban,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Individual Stat Card Props
 */
export interface StatCardProps {
    label: string;
    value: number | string;
    icon?: LucideIcon;
    description?: string;
    href?: string;
    variant?: "default" | "success" | "warning" | "danger" | "info";
    className?: string;
}

/**
 * Reusable Stat Card Component
 */
export function StatCard({
    label,
    value,
    icon: Icon,
    description,
    href,
    variant = "default",
    className,
}: StatCardProps) {
    const variantStyles = {
        default: "bg-card",
        success: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900",
        warning: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900",
        danger: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
        info: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
    };

    const iconStyles = {
        default: "text-muted-foreground",
        success: "text-emerald-600 dark:text-emerald-400",
        warning: "text-amber-600 dark:text-amber-400",
        danger: "text-red-600 dark:text-red-400",
        info: "text-blue-600 dark:text-blue-400",
    };

    const content = (
        <Card className={cn("border transition-shadow hover:shadow-md", variantStyles[variant], className)}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {description && <p className="text-xs text-muted-foreground">{description}</p>}
                    </div>
                    {Icon && <Icon className={cn("size-8 opacity-80", iconStyles[variant])} />}
                </div>
            </CardContent>
        </Card>
    );

    if (href) {
        return (
            <Link href={href} className="block">
                {content}
            </Link>
        );
    }

    return content;
}

/**
 * Stats Grid Container
 */
interface StatsGridProps {
    children: ReactNode;
    columns?: 2 | 3 | 4 | 5;
    className?: string;
}

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
    const colClasses = {
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
        5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    };

    return <div className={cn("grid gap-4", colClasses[columns], className)}>{children}</div>;
}

/**
 * Stats Section with Title
 */
interface StatsSectionProps {
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

export function StatsSection({ title, description, children, className }: StatsSectionProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {(title ?? description) && (
                <div>
                    {title && <h3 className="text-lg font-semibold">{title}</h3>}
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
            )}
            {children}
        </div>
    );
}

/**
 * Event Stats Data Type (matches DAL return)
 */
export interface EventStatsData {
    total: number;
    published: number;
    draft: number;
    ongoing: number;
    ended: number;
    cancelled: number;
    upcoming: number;
    byType: {
        voting: number;
        ticketed: number;
        hybrid: number;
        advertisement: number;
    };
    totalTicketsSold: number;
    totalRevenue: number;
    totalAttendees: number;
    totalVotes: number;
    mostAttendedEvent?: { id: string; title: string; attendees: number };
    upcomingEvent?: { id: string; title: string; startDate: Date };
    recentEvent?: { id: string; title: string; endDate: Date };
}

/**
 * Pre-built Event Stats Component
 * Uses the stats data from getOrganizationEventStats
 */
interface EventStatsProps {
    stats: EventStatsData;
    showEngagement?: boolean;
    showByType?: boolean;
    className?: string;
}

export function EventStats({ stats, showEngagement = true, showByType = false, className }: EventStatsProps) {
    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className={cn("space-y-6", className)}>
            {/* Primary Stats */}
            <StatsGrid columns={4}>
                <StatCard label="Total Events" value={stats.total} icon={Calendar} />
                <StatCard
                    label="Published"
                    value={stats.published}
                    icon={CheckCircle}
                    variant="success"
                />
                <StatCard label="Ongoing" value={stats.ongoing} icon={Zap} variant="info" />
                <StatCard label="Drafts" value={stats.draft} icon={FileText} variant="warning" />
            </StatsGrid>

            {/* Engagement Stats */}
            {showEngagement && (stats.totalTicketsSold > 0 || stats.totalVotes > 0) && (
                <StatsSection title="Engagement">
                    <StatsGrid columns={4}>
                        <StatCard
                            label="Tickets Sold"
                            value={stats.totalTicketsSold}
                            icon={Ticket}
                        />
                        <StatCard label="Check-ins" value={stats.totalAttendees} icon={Users} />
                        <StatCard label="Total Votes" value={stats.totalVotes} icon={Vote} />
                        <StatCard
                            label="Revenue"
                            value={formatCurrency(stats.totalRevenue)}
                            icon={TrendingUp}
                            variant="success"
                        />
                    </StatsGrid>
                </StatsSection>
            )}

            {/* Event Type Breakdown */}
            {showByType && (
                <StatsSection title="By Event Type">
                    <StatsGrid columns={4}>
                        <StatCard label="Voting" value={stats.byType.voting} icon={Vote} />
                        <StatCard label="Ticketed" value={stats.byType.ticketed} icon={Ticket} />
                        <StatCard label="Hybrid" value={stats.byType.hybrid} icon={Calendar} />
                        <StatCard label="Advertisement" value={stats.byType.advertisement} icon={FileText} />
                    </StatsGrid>
                </StatsSection>
            )}
        </div>
    );
}

// Export icons for custom use
export const StatIcons = {
    Calendar,
    Users,
    Ticket,
    Vote,
    TrendingUp,
    Clock,
    CheckCircle,
    FileText,
    Zap,
    Ban,
};
