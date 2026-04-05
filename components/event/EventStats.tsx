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
import { cn, formatAmount } from "@/lib/utils";

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
    draft: "/stat-icon/draft-black.webp",
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
    onClick?: () => void;
}

/**
 * Derive card gradient from the icon filename's color suffix.
 * Bottom-right glow matches the icon color.
 */
function getIconColorStyles(iconSrc: string): { style: React.CSSProperties; className: string } {
    const filename = iconSrc.split("/").pop() ?? "";
    const base = filename.replace(".webp", "");
    const color = base.split("-").pop();

    const colorGlow: Record<string, string> = {
        red: "radial-gradient(circle at bottom right,color-mix(in srgb, var(--color-tertiary-600) 28%, transparent),transparent 50%)",
        yellow: "radial-gradient(circle at bottom right,color-mix(in srgb, var(--color-secondary-500) 28%, transparent),transparent 50%)",
        green: "radial-gradient(circle at bottom right,color-mix(in srgb, var(--color-primary-600) 28%, transparent),transparent 50%)",
        black: "radial-gradient(circle at bottom right,rgba(160,160,160,0.18),transparent 50%)",
    };

    const borderColor: Record<string, string> = {
        red: "border-tertiary-900/10",
        yellow: "border-secondary-900/10",
        green: "border-primary-900/10",
        black: "border-gray-800/10",
    };

    const backgroundImage = color && colorGlow[color] ? colorGlow[color] : undefined;
    const border = color && borderColor[color] ? borderColor[color] : "border-white/10";

    return { style: backgroundImage ? { backgroundImage } : {}, className: border };
}

/**
 * Format a number with compact notation for large values (1.2K, 1.5M, etc.)
 */
function formatCompact(value: number | string): string {
    if (typeof value === "string") return value;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (value >= 10_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    if (value >= 1_000) return value.toLocaleString();
    return value.toString();
}

/**
 * Get text size class based on display string length
 */
function getValueSizeClass(display: string): string {
    const len = display.length;
    if (len <= 2) return "text-6xl leading-12";
    if (len <= 4) return "text-5xl leading-11";
    if (len <= 6) return "text-4xl leading-10";
    if (len <= 9) return "text-3xl leading-9";
    return "text-2xl leading-8";
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
    onClick,
}: StatCardProps) {
    const variantStyles = {
        default: "bg-card",
        success: "bg-tertiary-50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900",
        warning: "bg-secondary-50 dark:bg-secondary-950/20 border-secondary-200 dark:border-secondary-900",
        danger: "bg-tertiary-50 dark:bg-tertiary-950/20 border-tertiary-200 dark:border-tertiary-900",
        info: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
    };

    const iconStyles = {
        default: "text-tertiary-600 dark:text-tertiary-400",
        success: "text-primary-600 dark:text-primary-400",
        warning: "text-secondary-600 dark:text-secondary-400",
        danger: "text-tertiary-600 dark:text-tertiary-400",
        info: "text-blue-600 dark:text-blue-400",
    };

    // Icon color suffix takes priority, then variant
    const iconColor = iconSrc ? getIconColorStyles(iconSrc) : null;
    const cardStyle = iconColor ? iconColor.className : variantStyles[variant];
    const cardInlineStyle = iconColor ? iconColor.style : undefined;

    const content = (() => {
        const display = typeof value === "number" ? formatCompact(value) : value;
        const sizeClass = getValueSizeClass(String(display));

        return (
            <Card 
                className={cn(
                    "relative px-4 group overflow-hidden border transition-shadow ", 
                    cardStyle, 
                    className,
                    onClick && "cursor-pointer active:scale-[0.98]"
                )} 
                style={{ backgroundColor: 'transparent', ...cardInlineStyle }}
                onClick={onClick}
            >
                <CardContent className="p-0 !bg-transparent">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">{label}</p>
                            <p className={cn(sizeClass, "font-bold font-montserrat text-black")}>{display}</p>
                            {description && <p className="text-xs text-muted-foreground">{description}</p>}
                        </div>
                        {iconSrc && (
                            <NextImage src={iconSrc} alt={label} width={100} height={100} className="h-full group-hover:-bottom-7 duration-300 group-hover:opacity-70 transition-all  select-none w-auto object-cover opacity-20 absolute -bottom-8 -right-8" />
                        )}
                        {!iconSrc && Icon && (
                            <Icon className={cn("size-8 opacity-80", iconStyles[variant])} />
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    })();

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
                <StatCard label="Drafts" value={stats.draft} iconSrc={statIcons.draft} />
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
                            value={formatAmount(stats.totalRevenue)}
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
