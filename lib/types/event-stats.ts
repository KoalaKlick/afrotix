import { LucideIcon } from "lucide-react";

/**
 * Event Statistics Types
 * Extensible structure for event stats on the my-events page
 */

// Individual stat item
export interface StatItem {
    label: string;
    value: number | string;
    icon?: LucideIcon;
    description?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    href?: string; // Optional link
}

// Stat category for grouping
export interface StatCategory {
    id: string;
    title: string;
    stats: StatItem[];
}

// Raw stats from database
export interface EventStatsData {
    // Basic counts
    total: number;
    published: number;
    draft: number;
    ongoing: number;
    ended: number;
    cancelled: number;
    upcoming: number;

    // By event type
    byType: {
        voting: number;
        ticketed: number;
        hybrid: number;
        advertisement: number;
    };

    // Engagement metrics
    totalTicketsSold: number;
    totalRevenue: number;
    totalAttendees: number; // Checked-in tickets
    totalVotes: number;

    // Highlights
    mostAttendedEvent?: {
        id: string;
        title: string;
        attendees: number;
    };
    upcomingEvent?: {
        id: string;
        title: string;
        startDate: Date;
    };
    recentEvent?: {
        id: string;
        title: string;
        endDate: Date;
    };
}

// Default empty stats
export const defaultEventStats: EventStatsData = {
    total: 0,
    published: 0,
    draft: 0,
    ongoing: 0,
    ended: 0,
    cancelled: 0,
    upcoming: 0,
    byType: {
        voting: 0,
        ticketed: 0,
        hybrid: 0,
        advertisement: 0,
    },
    totalTicketsSold: 0,
    totalRevenue: 0,
    totalAttendees: 0,
    totalVotes: 0,
};
