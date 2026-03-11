"use client";

import { Calendar, Ticket, DollarSign, Users, User, Wallet } from "lucide-react";
import type { Profile, Organization } from "@/lib/generated/prisma";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
    StatsCard,
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
            href: "/promoter/events/new",
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

    const isNewUser = stats.totalEvents === 0; // This logic might need adjustment based on actual setup completion

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Dashboard</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Total Events"
                        value={stats.totalEvents.toString()}
                        description="Total events you've created across all organizations."
                        icon={Calendar}
                        trend={stats.totalEvents > 0 ? { value: 0, isPositive: true } : undefined}
                    />
                    <StatsCard
                        title="Tickets Sold"
                        value={stats.ticketsSold.toLocaleString()}
                        description="Total tickets across all events"
                        icon={Ticket}
                        trend={stats.ticketsSold > 0 ? { value: 0, isPositive: true } : undefined}
                    />
                    <StatsCard
                        title="Revenue"
                        value={`£${stats.revenue.toLocaleString()}`}
                        description="Total earnings"
                        icon={DollarSign}
                        trend={stats.revenue > 0 ? { value: 0, isPositive: true } : undefined}
                    />
                    <StatsCard
                        title="Attendees"
                        value={stats.attendees.toLocaleString()}
                        description="People at your events"
                        icon={Users}
                        trend={stats.attendees > 0 ? { value: 0, isPositive: true } : undefined}
                    />
                </div>

                {/* Activity and Events Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <RecentActivity activities={emptyActivities} />
                    <UpcomingEvents events={[]} />
                </div>
            </div>
        </>
    );
}