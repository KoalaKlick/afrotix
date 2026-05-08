"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  StatCard,
  StatsGrid,
  statIcons,
} from "@/components/event/core/EventStats";
import { VotingBarChart } from "../charts/VotingBarChart";
import { VotingTrendChart } from "../charts/VotingTrendChart";
import { VotingPieChart } from "../charts/VotingPieChart";
import { TicketTypeBarChart } from "../charts/TicketTypeBarChart";
import { TicketTrendChart } from "../charts/TicketTrendChart";
import { CategoryDetailModal } from "../nomination/CategoryDetailModal";
import { EventTransactionsSheet } from "../transactions/EventTransactionsSheet";
import type { VotingChartCategory } from "../charts/VotingBarChart";
import type {
  EventDetailStatsData,
  VoteTrendPoint,
  TicketTrendPoint,
} from "@/lib/types/event-stats";
import type { EventDetailEvent } from "@/lib/types/event";
import { cn, formatAmount } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { FileText } from "lucide-react";
import Link from "next/link";

interface EventOverviewTabProps {
  readonly event: EventDetailEvent;
  readonly eventStats: EventDetailStatsData;
  readonly votingCategories: VotingChartCategory[];
  readonly voteTrend: VoteTrendPoint[];
  readonly ticketTrend?: TicketTrendPoint[];
  readonly ticketTypeSales?: {
    id: string;
    name: string;
    sold: number;
    capacity: number;
  }[];
  readonly initialTicketTransactions?: { transactions: any[]; total: number };
  readonly initialVoteTransactions?: { transactions: any[]; total: number };
}

export function EventOverviewTab({
  event,
  eventStats,
  votingCategories,
  voteTrend,
  ticketTrend = [],
  ticketTypeSales = [],
  initialTicketTransactions = { transactions: [], total: 0 },
  initialVoteTransactions = { transactions: [], total: 0 },
}: EventOverviewTabProps) {
  const sponsors = event.sponsors ?? [];
  const socialLinks = event.socialLinks ?? [];
  const galleryLinks = event.galleryLinks ?? [];
  const eventId = event.id;
  const eventType = event.type;
  const votingMode = event.votingMode;
  const isVotingType = eventType === "voting" || eventType === "hybrid";
  const [selectedCategory, setSelectedCategory] =
    useState<VotingChartCategory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [breakdownType, setBreakdownType] = useState<
    "votes" | "tickets" | "nominations"
  >("votes");

  const payoutConfigured = Boolean(
    event.organization.paystackAccountNumber &&
      event.organization.paystackAccountName &&
      event.organization.paystackBankCode,
  );

  function handleCategoryClick(category: VotingChartCategory) {
    setSelectedCategory(category);
    setModalOpen(true);
  }

  function handleViewBreakdown() {
    setBreakdownOpen(true);
  }

  return (
    <div className="space-y-6 @container">
      {/* Event Stats */}
      <StatsGrid columns={4}>
        <StatCard
          label="Gross Revenue"
          value={formatAmount(eventStats.revenue)}
          iconSrc={statIcons.cedi}
          description={
            [
              eventStats.ticketRevenue > 0 &&
                `Tickets ${formatAmount(eventStats.ticketRevenue)}`,
              eventStats.voteRevenue > 0 &&
                `Votes ${formatAmount(eventStats.voteRevenue)}`,
              eventStats.nominationRevenue > 0 &&
                `Nominations ${formatAmount(eventStats.nominationRevenue)}`,
            ]
              .filter(Boolean)
              .join(" · ") ||
            (payoutConfigured
              ? event.organization.paystackAccountName || "Account Connected"
              : "No payout account")
          }
          onClick={() => {
            setBreakdownType("tickets");
            handleViewBreakdown();
          }}
          className="cursor-pointer hover:border-primary/30 transition-all"
        />

        {/* Type specific stats */}
        {(eventType === "ticketed" || eventType === "hybrid") && (
          <StatCard
            label="Tickets Sold"
            value={eventStats.ticketsSold}
            iconSrc={statIcons.ticket}
            description={
              eventStats.capacity === null
                ? undefined
                : `/ ${eventStats.capacity} capacity`
            }
          />
        )}

        {(eventType === "voting" || eventType === "hybrid") && (
          <div className="relative group">
            <StatCard
              label="Total Votes"
              value={eventStats.totalVotes}
              iconSrc={statIcons.vote}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBreakdownType("votes");
                handleViewBreakdown();
              }}
              className="absolute top-2 right-2 h-7 px-2 text-[10px] font-bold bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FileText className="size-3 mr-1" />
              BREAKDOWN
            </Button>
          </div>
        )}

        {(eventType === "ticketed" || eventType === "hybrid") && (
          <StatCard
            label="Check-ins"
            value={eventStats.checkIns}
            iconSrc={statIcons.user}
            description={
              eventStats.ticketsSold > 0
                ? `${Math.round((eventStats.checkIns / eventStats.ticketsSold) * 100)}% of sold`
                : undefined
            }
          />
        )}

        {eventType === "voting" && (
          <StatCard
            label="Categories"
            value={eventStats.totalCategories}
            iconSrc={statIcons.analytics}
          />
        )}

        {eventType === "ticketed" && (
          <StatCard
            label="Orders"
            value={eventStats.totalOrders}
            iconSrc={statIcons.analytics}
          />
        )}
      </StatsGrid>

      {/* Ticket Charts */}
      {(eventType === "ticketed" ||
        eventType === "hybrid" ||
        ticketTrend.length > 0) && (
        <div className="grid grid-cols-1 overflow-x-auto @3xl:grid-cols-[auto_500px] gap-4">
          <TicketTypeBarChart sales={ticketTypeSales} />
          <TicketTrendChart data={ticketTrend} />
        </div>
      )}

      {/* Voting Charts */}
      {isVotingType && votingCategories.length > 0 && (
        <div className="grid grid-cols-1 overflow-x-auto @3xl:grid-cols-[auto_500px] gap-4">
          <VotingBarChart
            categories={votingCategories}
            onCategoryClick={handleCategoryClick}
          />
          {votingMode === "internal" ? (
            <VotingPieChart
              categories={votingCategories}
              onCategoryClick={handleCategoryClick}
            />
          ) : (
            <VotingTrendChart data={voteTrend} />
          )}
        </div>
      )}

      <CategoryDetailModal
        eventId={eventId}
        category={selectedCategory}
        votingMode={votingMode}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      <EventTransactionsSheet
        eventId={eventId}
        isVotingType={isVotingType}
        open={breakdownOpen}
        onOpenChange={setBreakdownOpen}
        defaultType={breakdownType}
        initialVoteTransactions={initialVoteTransactions}
        initialTicketTransactions={initialTicketTransactions}
      />

      {/* Extras Summary */}
      <StatsGrid columns={3}>
        <StatCard
          label="Sponsors"
          value={sponsors.length}
          iconSrc={statIcons.plus}
          className="bg-card"
        />
        <StatCard
          label="Social Links"
          value={socialLinks.length}
          iconSrc={statIcons.search}
          className="bg-card"
        />
        <StatCard
          label="Galleries"
          value={galleryLinks.length}
          iconSrc={statIcons.analytics}
          className="bg-card"
        />
      </StatsGrid>
    </div>
  );
}
