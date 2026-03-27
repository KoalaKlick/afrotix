"use client";

import { PageHeader } from "@/components/shared/page-header";
import { CustomizableEventStats } from "@/components/event/CustomizableEventStats";
import type { EventStatsData } from "@/components/event/EventStats";
import {
    OngoingEvents,
    RevenueChart,
    EventTypePieChart,
    RecentOrdersTable,
} from "@/components/dashboard";
import { PROJ_NAME } from "@/lib/const/branding";

interface OngoingEvent {
    id: string;
    title: string;
    type: string;
    coverImage: string | null;
    venueName: string | null;
    startDate: string | null;
}

interface RecentOrder {
    id: string;
    orderNumber: string;
    buyerName: string | null;
    buyerEmail: string;
    total: number | { toNumber?: () => number };
    currency: string;
    status: string;
    createdAt: Date | string;
    event: { title: string };
}

interface DashboardContentProps {
    readonly stats: EventStatsData;
    readonly profileStats: {
        organizationCount: number;
        createdEvents: number;
    };
    readonly ongoingEvents: OngoingEvent[];
    readonly recentOrders: RecentOrder[];
    readonly revenueData: { month: string; revenue: number }[];
}

export function DashboardContent({
    stats,
    profileStats,
    ongoingEvents,
    recentOrders,
    revenueData,
}: DashboardContentProps) {
    return (
        <>
            <PageHeader breadcrumbs={[{ label: "Dashboard" }]} />

            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
                {/* Ongoing Events Strip */}
                <OngoingEvents events={ongoingEvents} />

                {/* Customizable Stats */}
                <CustomizableEventStats
                    stats={stats}
                    profileStats={profileStats}
                    storageKey={`${PROJ_NAME.toLowerCase()}:dashboard-stats`}
                    defaultKeys={["total", "ticketsSold", "revenue", "votes"]}
                />

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <RevenueChart data={revenueData} />
                    <EventTypePieChart byType={stats.byType} />
                </div>

                {/* Orders Table */}
                <RecentOrdersTable orders={recentOrders} />
            </div>
        </>
    );
}