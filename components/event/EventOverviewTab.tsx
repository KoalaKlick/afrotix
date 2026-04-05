"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StatCard, StatsGrid, statIcons } from "@/components/event/EventStats";
import { VotingBarChart } from "./VotingBarChart";
import { VotingTrendChart } from "./VotingTrendChart";
import { TicketTypeBarChart } from "./TicketTypeBarChart";
import { TicketTrendChart } from "./TicketTrendChart";
import { CategoryDetailModal } from "./CategoryDetailModal";
import { VoteTransactionsTable } from "./VoteTransactionsTable";
import type { VotingChartCategory } from "./VotingBarChart";
import type {
  EventDetailStatsData,
  VoteTrendPoint,
  TicketTrendPoint,
} from "@/lib/types/event-stats";
import type { EventDetailEvent } from "@/lib/types/event";
import { cn, formatAmount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  getEventTicketTransactionsAction,
  getEventVoteTransactionsAction,
} from "@/lib/actions/event";
import {
  FileText,
  Loader2,
  Plus,
  Share2,
  Image as ImageIcon,
  Ticket as TicketIcon,
  Vote as VoteIcon,
  Banknote,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { TicketTransactionsTable } from "./TicketTransactionsTable";

interface EventOverviewTabProps {
  readonly event: EventDetailEvent;
  readonly eventStats: EventDetailStatsData;
  readonly votingCategories: VotingChartCategory[];
  readonly voteTrend: VoteTrendPoint[];
  readonly ticketTrend?: TicketTrendPoint[];
  readonly ticketTypeSales?: { id: string; name: string; sold: number; capacity: number }[];
  readonly initialTicketTransactions?: { transactions: any[]; total: number };
  readonly initialVoteTransactions?: { transactions: any[]; total: number };
}

type VoteTransactionsData = Awaited<
  ReturnType<typeof getEventVoteTransactionsAction>
>;

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
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
  const [breakdownType, setBreakdownType] = useState<"votes" | "tickets">("votes");

  const payoutConfigured = Boolean(
    event.organization.paystackAccountNumber &&
    event.organization.paystackAccountName &&
    event.organization.paystackBankCode
  );

  function handleCategoryClick(category: VotingChartCategory) {
    setSelectedCategory(category);
    setModalOpen(true);
  }

  async function handleViewBreakdown() {
    setBreakdownOpen(true);
    // Loading is handled by matching the breakdownType with the existing initialTxData
    // We might need separate state if we want to cache both, but for now let's just clear when switching or just re-fetch
  }

  // Effect to fetch breakdown data when breakdown type changes and breakdown is open
  const [ticketTxData, setTicketTxData] = useState<any>(initialTicketTransactions.total > 0 ? initialTicketTransactions : null);
  const [voteTxData, setVoteTxData] = useState<any>(initialVoteTransactions.total > 0 ? initialVoteTransactions : null);

  async function loadVotes(options: any) {
    setIsLoadingBreakdown(true);
    try {
        const data = await getEventVoteTransactionsAction(eventId, options);
        setVoteTxData(data);
        return data;
    } finally {
        setIsLoadingBreakdown(false);
    }
  }

  async function loadTickets(options: any) {
    setIsLoadingBreakdown(true);
    try {
        const data = await getEventTicketTransactionsAction(eventId, options);
        setTicketTxData(data);
        return data;
    } finally {
        setIsLoadingBreakdown(false);
    }
  }


  // When breakdown opens, load the appropriate data
  useState(() => {
    // This is just to initialize, maybe use useEffect
  });

  // Removed hasLoaded logic as hooks handle it now

  return (
    <div className="space-y-6 @container">
      {/* Event Stats */}
      <StatsGrid columns={4}>
        <StatCard
          label="Gross Revenue"
          value={formatAmount(eventStats.revenue)}
          iconSrc={statIcons.cedi}
          description={payoutConfigured ? event.organization.paystackAccountName || "Account Connected" : "No payout account"}
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
      {(eventType === "ticketed" || eventType === "hybrid" || ticketTrend.length > 0) && (
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
          <VotingTrendChart data={voteTrend} />
        </div>
      )}

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
              {breakdownType === "votes" ? (
                <>
                  <VoteIcon className="size-6 text-primary" />
                  Vote Transactions
                </>
              ) : (
                <>
                  <TicketIcon className="size-6 text-primary" />
                  Ticket Transactions
                </>
              )}
            </SheetTitle>
            <SheetDescription>
              {breakdownType === "votes" 
                ? "View a detailed list of all successful vote purchases for this event."
                : "View a detailed list of all ticket orders and purchases for this event."}
            </SheetDescription>
          </SheetHeader>

          {isLoadingBreakdown ? (
            <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium animate-pulse">
                Fetching transaction history...
              </p>
            </div>
          ) : (
            <>
              {breakdownType === "votes" && voteTxData && (
                <VoteTransactionsTable
                  initialData={voteTxData}
                  eventId={eventId}
                  fetchPage={loadVotes}
                />
              )}
              {breakdownType === "tickets" && ticketTxData && (
                <TicketTransactionsTable
                  initialData={ticketTxData}
                  eventId={eventId}
                  fetchPage={loadTickets}
                />
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

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

function PayoutAccountCard({ 
  payoutConfigured, 
  organizationId 
}: { 
  payoutConfigured: boolean; 
  organizationId: string;
}) {
  return (
    <div 
      className={cn(
        "relative p-4 rounded-xl border transition-all overflow-hidden",
        payoutConfigured 
          ? "bg-tertiary-50/30 border-tertiary-100 hover:border-tertiary-200" 
          : "bg-amber-50/30 border-amber-100 hover:border-amber-200"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "size-10 rounded-full flex items-center justify-center shrink-0",
          payoutConfigured 
            ? "bg-tertiary-100/50 text-tertiary-600" 
            : "bg-amber-100/50 text-amber-600"
        )}>
          {payoutConfigured ? (
            <ShieldCheck className="size-5" />
          ) : (
            <AlertCircle className="size-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Payout Status
          </p>
          <p className={cn(
            "text-sm font-bold truncate",
            payoutConfigured ? "text-tertiary-700" : "text-amber-700"
          )}>
            {payoutConfigured ? "Account Verified" : "Verification Required"}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <Link href={`/organization/manage`}>
            <ExternalLink className="size-4" />
          </Link>
        </Button>
      </div>
      
      {/* Decorative accent */}
      <div className={cn(
        "absolute -bottom-6 -right-6 size-16 rounded-full opacity-10",
        payoutConfigured ? "bg-tertiary-600" : "bg-amber-600"
      )} />
    </div>
  );
}
