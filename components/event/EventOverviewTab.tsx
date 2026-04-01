"use client";

import { useState } from "react";
import { StatCard, StatsGrid, statIcons } from "@/components/event/EventStats";
import { VotingBarChart } from "./VotingBarChart";
import { VotingTrendChart } from "./VotingTrendChart";
import { CategoryDetailModal } from "./CategoryDetailModal";
import { VoteTransactionsTable } from "./VoteTransactionsTable";
import type { VotingChartCategory } from "./VotingBarChart";
import type {
  EventDetailStatsData,
  VoteTrendPoint,
} from "@/lib/types/event-stats";
import type { EventDetailEvent } from "@/lib/types/event";
import { formatAmount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { getEventVoteTransactionsAction } from "@/lib/actions/event";
import {
  FileText,
  Loader2,
  Plus,
  Share2,
  Image as ImageIcon,
} from "lucide-react";

interface EventOverviewTabProps {
  readonly event: EventDetailEvent;
  readonly eventStats: EventDetailStatsData;
  readonly votingCategories: VotingChartCategory[];
  readonly voteTrend: VoteTrendPoint[];
}

type VoteTransactionsData = Awaited<
  ReturnType<typeof getEventVoteTransactionsAction>
>;

export function EventOverviewTab({
  event,
  eventStats,
  votingCategories,
  voteTrend,
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
  const [initialTxData, setInitialTxData] =
    useState<VoteTransactionsData | null>(null);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);

  function handleCategoryClick(category: VotingChartCategory) {
    setSelectedCategory(category);
    setModalOpen(true);
  }

  async function handleViewBreakdown() {
    setBreakdownOpen(true);
    if (!initialTxData) {
      setIsLoadingBreakdown(true);
      try {
        const data = await getEventVoteTransactionsAction(eventId, 1, 10);
        setInitialTxData(data);
      } catch (error) {
        console.error("Failed to load breakdown:", error);
      } finally {
        setIsLoadingBreakdown(false);
      }
    }
  }

  async function fetchPage(page: number) {
    return await getEventVoteTransactionsAction(eventId, page, 10);
  }

  return (
    <div className="space-y-6 @container">
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
          description={
            eventStats.capacity === null
              ? undefined
              : `/ ${eventStats.capacity} capacity`
          }
        />
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
        {isVotingType ? (
          <div className="relative group">
            <StatCard
              label="Total Votes"
              value={eventStats.totalVotes}
              iconSrc={statIcons.vote}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewBreakdown}
              className="absolute top-2 right-2 h-7 px-2 text-[10px] font-bold bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FileText className="size-3 mr-1" />
              BREAKDOWN
            </Button>
          </div>
        ) : (
          <StatCard
            label="Orders"
            value={eventStats.totalOrders}
            iconSrc={statIcons.cedi}
          />
        )}
      </StatsGrid>

      {/* Voting Charts */}
      {isVotingType && votingCategories.length > 0 && (
        <>
          <div className="grid grid-cols-1 overflow-x-auto @3xl:grid-cols-[auto_500px] gap-4">
            <VotingBarChart
              categories={votingCategories}
              onCategoryClick={handleCategoryClick}
            />
            <VotingTrendChart data={voteTrend} />
          </div>

          <CategoryDetailModal
            eventId={eventId}
            category={selectedCategory}
            votingMode={votingMode}
            open={modalOpen}
            onOpenChange={setModalOpen}
          />

          <Sheet open={breakdownOpen} onOpenChange={setBreakdownOpen}>
            <SheetContent className="sm:max-w-3xl overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle className="flex items-center gap-2 text-2xl">
                  <FileText className="size-6 text-primary" />
                  Vote Transactions
                </SheetTitle>
                <SheetDescription>
                  View a detailed list of all successful vote purchases for this
                  event.
                </SheetDescription>
              </SheetHeader>

              {isLoadingBreakdown ? (
                <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm font-medium animate-pulse">
                    Fetching transaction history...
                  </p>
                </div>
              ) : initialTxData ? (
                <VoteTransactionsTable
                  initialData={initialTxData}
                  eventId={eventId}
                  fetchPage={fetchPage}
                />
              ) : null}
            </SheetContent>
          </Sheet>
        </>
      )}

      {/* Extras Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider mb-1">
              Sponsors
            </p>
            <p className="text-2xl font-black">{sponsors.length}</p>
          </div>
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="size-6 text-primary" />
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider mb-1">
              Social Links
            </p>
            <p className="text-2xl font-black">{socialLinks.length}</p>
          </div>
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Share2 className="size-6 text-primary" />
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider mb-1">
              Galleries
            </p>
            <p className="text-2xl font-black">{galleryLinks.length}</p>
          </div>
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ImageIcon className="size-6 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
