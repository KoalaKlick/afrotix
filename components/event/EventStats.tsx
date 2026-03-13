"use client";

import { ReactNode } from "react";
import NextImage from "next/image";
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
 * 3D stat icon paths mapped by name
 */
export const statIcons = {
    analytics: "/stat-icon/analytics-yellow.webp",
    cancel: "/stat-icon/cancel-red.webp",
    cediBlack: "/stat-icon/cedi-black.webp",
    cedi: "/stat-icon/cedi-green.webp",
    end: "/stat-icon/end-red.webp",
    euro: "/stat-icon/euro-green.webp",
    high: "/stat-icon/high-green.webp",
    locationBlack: "/stat-icon/location-black.webp",
    location: "/stat-icon/location-red.webp",
    ongoingGreen: "/stat-icon/ongoing-green.webp",
    ongoing: "/stat-icon/ongoing-yellow.webp",
    plus: "/stat-icon/plus-green.webp",
    search: "/stat-icon/search-red.webp",
    ticketRed: "/stat-icon/ticket-red.webp",
    ticket: "/stat-icon/ticket-yellow.webp",
    user: "/stat-icon/user-black.webp",
    vote: "/stat-icon/vote-red.webp",
} as const;

/**
 * Individual Stat Card Props
 */
export interface StatCardProps {
    label: string;
    value: number | string;
    icon?: LucideIcon;
    iconSrc?: string;
    description?: string;
    href?: string;
    variant?: "default" | "success" | "warning" | "danger" | "info";
    className?: string;
}

/**
 * Derive card color from the icon filename's color suffix
 */
function getIconColorStyles(iconSrc: string): string {
    const filename = iconSrc.split("/").pop() ?? "";
    const base = filename.replace(".webp", "");
    const color = base.split("-").pop();

    switch (color) {
        case "red":
            return "bg-red-100 dark:bg-red-950/20 border-red-200 dark:border-red-900";
        case "yellow":
            return "bg-amber-100 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900";
        case "green":
            return "bg-emerald-100 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900";
        case "black":
            return "bg-gray-100 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800";
        default:
            return "bg-card";
    }
}

/**
 * Reusable Stat Card Component
 */
export function StatCard({
    label,
    value,
    icon: Icon,
    iconSrc,
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

    // Icon color suffix takes priority, then variant
    const cardStyle = iconSrc ? getIconColorStyles(iconSrc) : variantStyles[variant];

    const content = (
        <Card className={cn("border relative px-4 font-montserrat overflow-clip transition-shadow hover:shadow-md", cardStyle, className)}>
            <CardContent className="p-0">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                        <p className="text-6xl leading-12 font-bold text-white">{value}</p>
                        {description && <p className="text-xs text-muted-foreground">{description}</p>}
                    </div>
                    {iconSrc && (
                        <NextImage src={iconSrc} alt={label} width={100} height={100} className="h-full w-auto object-cover opacity-20 absolute -bottom-10 -right-10" />
                    )}
                    {!iconSrc && Icon && (
                        <Icon className={cn("size-8 opacity-80", iconStyles[variant])} />
                    )}
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
                <StatCard label="Total Events" value={stats.total} iconSrc={statIcons.search} />
                <StatCard
                    label="Published"
                    value={stats.published}
                    iconSrc={statIcons.high}
                />
                <StatCard label="Ongoing" value={stats.ongoing} iconSrc={statIcons.ongoing} />
                <StatCard label="Drafts" value={stats.draft} iconSrc={statIcons.end} />
            </StatsGrid>

            {/* Engagement Stats */}
            {showEngagement && (stats.totalTicketsSold > 0 || stats.totalVotes > 0) && (
                <StatsSection title="Engagement">
                    <StatsGrid columns={4}>
                        <StatCard
                            label="Tickets Sold"
                            value={stats.totalTicketsSold}
                            iconSrc={statIcons.ticket}
                        />
                        <StatCard label="Check-ins" value={stats.totalAttendees} iconSrc={statIcons.user} />
                        <StatCard label="Total Votes" value={stats.totalVotes} iconSrc={statIcons.vote} />
                        <StatCard
                            label="Revenue"
                            value={formatCurrency(stats.totalRevenue)}
                            iconSrc={statIcons.analytics}
                        />
                    </StatsGrid>
                </StatsSection>
            )}

            {/* Event Type Breakdown */}
            {showByType && (
                <StatsSection title="By Event Type">
                    <StatsGrid columns={4}>
                        <StatCard label="Voting" value={stats.byType.voting} iconSrc={statIcons.vote} />
                        <StatCard label="Ticketed" value={stats.byType.ticketed} iconSrc={statIcons.ticketRed} />
                        <StatCard label="Hybrid" value={stats.byType.hybrid} iconSrc={statIcons.ongoingGreen} />
                        <StatCard label="Advertisement" value={stats.byType.advertisement} iconSrc={statIcons.plus} />
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
