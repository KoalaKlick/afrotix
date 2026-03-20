"use client";

import { useState } from "react";
import { StatCard, StatsGrid, statIcons } from "@/components/event/EventStats";
import { VotingBarChart } from "./VotingBarChart";
import { VotingPieChart } from "./VotingPieChart";
import { CategoryDetailModal } from "./CategoryDetailModal";
import type { VotingChartCategory } from "./VotingBarChart";
import type { EventDetailStatsData } from "@/lib/types/event-stats";
import { formatAmount } from "@/lib/utils";

interface EventOverviewTabProps {
    readonly eventStats: EventDetailStatsData;
    readonly eventType: string;
    readonly votingCategories: VotingChartCategory[];
}

export function EventOverviewTab({
    eventStats,
    eventType,
    votingCategories,
}: EventOverviewTabProps) {
    const isVotingType = eventType === "voting" || eventType === "hybrid";
    const [selectedCategory, setSelectedCategory] = useState<VotingChartCategory | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    function handleCategoryClick(category: VotingChartCategory) {
        setSelectedCategory(category);
        setModalOpen(true);
    }

    return (
        <div className="space-y-6">
            {/* Event Stats */}
            <StatsGrid columns={4}>
                <StatCard
                    label="Revenue"
                    value={formatAmount(eventStats.revenue)}
                    iconSrc={statIcons.analytics}
                />
                <StatCard
                    label="Tickets Sold"
                    value={eventStats.ticketsSold}
                    iconSrc={statIcons.ticket}
                    description={eventStats.capacity === null ? undefined : `/ ${eventStats.capacity} capacity`}
                />
                <StatCard
                    label="Check-ins"
                    value={eventStats.checkIns}
                    iconSrc={statIcons.user}
                    description={eventStats.ticketsSold > 0 ? `${Math.round((eventStats.checkIns / eventStats.ticketsSold) * 100)}% of sold` : undefined}
                />
                {isVotingType ? (
                    <StatCard
                        label="Total Votes"
                        value={eventStats.totalVotes}
                        iconSrc={statIcons.vote}
                    />
                ) : (
                    <StatCard
                        label="Orders"
                        value={eventStats.totalOrders}
                        iconSrc={statIcons.cedi}
                    />
                )}
            </StatsGrid>

            {/* Secondary Stats for voting events */}
            {isVotingType && (
                <StatsGrid columns={3}>
                    <StatCard
                        label="Categories"
                        value={eventStats.totalCategories}
                        iconSrc={statIcons.search}
                    />
                    <StatCard
                        label="Nominees"
                        value={eventStats.totalNominees}
                        iconSrc={statIcons.high}
                    />
                    <StatCard
                        label="Orders"
                        value={eventStats.totalOrders}
                        iconSrc={statIcons.cedi}
                    />
                </StatsGrid>
            )}

            {/* Voting Charts */}
            {isVotingType && votingCategories.length > 0 && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <VotingBarChart
                            categories={votingCategories}
                            onCategoryClick={handleCategoryClick}
                        />
                        <VotingPieChart
                            categories={votingCategories}
                            onCategoryClick={handleCategoryClick}
                        />
                    </div>

                    <CategoryDetailModal
                        category={selectedCategory}
                        open={modalOpen}
                        onOpenChange={setModalOpen}
                    />
                </>
            )}
        </div>
    );
}
