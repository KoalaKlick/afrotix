"use client";

import { Calendar, User, Wallet } from "lucide-react";
import { StatCard, StatsGrid, statIcons } from "@/components/event/EventStats";
import { formatAmount } from "@/lib/utils";
import type { Profile, Organization } from "@/lib/generated/prisma";
import { PageHeader } from "@/components/shared/page-header";
import {
    RecentActivity,
    UpcomingEvents,
    WelcomeCard,
    emptyActivities,
} from "@/components/dashboard";

interface DashboardContentProps {
    readonly user: {
        id: string;
        fullName: string | null;
        email: string | null;
        avatarUrl: string | null;
    };
    readonly activeOrganization: any; // Type should be more specific based on your Prisma models
    readonly stats: {
        totalEvents: number;
        ticketsSold: number;
        revenue: number;
        attendees: number;
    };
}

export function DashboardContent({
    user,
    activeOrganization,
    stats,
}: DashboardContentProps) {
    // Setup steps for the welcome card
    const setupSteps = [
        {
            id: "event",
            title: "Create your first event",
            description: "Set up a voting or ticketed event to start engaging your audience.",
            icon: Calendar,
            href: "/my-events/new",
            completed: false, // This would ideally be dynamic
        },
        {
            id: "profile",
            title: "Complete your profile",
            description: "Add a professional bio and links to your social media profiles.",
            icon: User,
            href: "/settings/profile",
            completed: true,
        },
        {
            id: "wallet",
            title: "Connect a wallet",
            description: "Set up your payout details to receive earnings from your events.",
            icon: Wallet,
            href: "/settings/billing",
            completed: false,
        },
    ];

    const isNewUser = stats.totalEvents === 0;

    return (
        <>
            <PageHeader breadcrumbs={[{ label: "Dashboard" }]} />

            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
                {/* Stats Grid */}
                <StatsGrid columns={4}>
                    <StatCard
                        label="Total Events"
                        value={stats.totalEvents}
                        iconSrc={statIcons.search}
                    />
                    <StatCard
                        label="Tickets Sold"
                        value={stats.ticketsSold}
                        iconSrc={statIcons.ticket}
                    />
                    <StatCard
                        label="Revenue"
                        value={formatAmount(stats.revenue)}
                        iconSrc={statIcons.cedi}
                    />
                    <StatCard
                        label="Attendees"
                        value={stats.attendees}
                        iconSrc={statIcons.user}
                    />
                </StatsGrid>

                {/* Activity and Events Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <RecentActivity activities={emptyActivities} />
                    <UpcomingEvents events={[]} />
                </div>
            </div>
        </>
    );
}