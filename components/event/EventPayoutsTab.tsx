"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CreditCard,
  ExternalLink,
  Loader2,
  Ticket,
  Vote,
  Wallet,
  type Receipt,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAmount } from "@/lib/utils";
import type { EventDetailStatsData } from "@/lib/types/event-stats";
import type { EventDetailEvent } from "@/lib/types/event";
import Link from "next/link";
import {
  getEventTicketTransactionsAction,
  getEventVoteTransactionsAction,
} from "@/lib/actions/event";

interface VoteTransaction {
  id: string;
  voteCount: number;
  amount: number;
  currency: string;
  reference: string;
  status: string;
  voterEmail?: string;
  voterPhone?: string;
  nomineeName?: string;
  nomineeCode?: string;
  createdAt: string;
}

interface TicketTransaction {
  id: string;
  orderNumber: string;
  buyerName: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  amount: number;
  fees: number;
  currency: string;
  status: string;
  ticketCount: number;
  createdAt: string;
}

interface EventPayoutsTabProps {
  readonly event: EventDetailEvent;
  readonly eventStats: EventDetailStatsData;
  readonly initialVoteTransactions?: VoteTransaction[];
  readonly initialTicketTransactions?: TicketTransaction[];
}

const EVENT_TERTIARY_COLOR = "#FCD116";

function formatWhen(value: string) {
  return new Date(value).toLocaleString("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  readonly icon: typeof Receipt;
  readonly title: string;
  readonly description: string;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-background shadow-sm">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export function EventPayoutsTab({
  event,
  eventStats,
  initialVoteTransactions = [],
  initialTicketTransactions = [],
}: EventPayoutsTabProps) {
  const isTicketed = event.type === "ticketed" || event.type === "hybrid";
  const isVoting = event.type === "voting" || event.type === "hybrid";
  const [activeTab, setActiveTab] = useState<"setup" | "tickets" | "votes">(
    "setup",
  );
  const [voteTransactions, setVoteTransactions] = useState<VoteTransaction[]>(
    initialVoteTransactions,
  );
  const [ticketTransactions, setTicketTransactions] = useState<
    TicketTransaction[]
  >(initialTicketTransactions);
  const [loadingVotes, setLoadingVotes] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const payoutConfigured = Boolean(
    event.organization.paystackAccountNumber &&
      event.organization.paystackAccountName &&
      event.organization.paystackBankCode,
  );

  const grossRevenue = eventStats.revenue;
  const summaryCards = useMemo(() => {
    return [
      {
        label: "Gross Revenue",
        value: formatAmount(grossRevenue),
        icon: Wallet,
        accent: event.organization.primaryColor || "#009A44",
      },
      {
        label: "Ticket Orders",
        value: eventStats.totalOrders.toLocaleString(),
        icon: Ticket,
        accent: event.organization.secondaryColor || "#CE1126",
      },
      {
        label: "Votes Processed",
        value: eventStats.totalVotes.toLocaleString(),
        icon: Vote,
        accent: EVENT_TERTIARY_COLOR,
      },
    ];
  }, [
    event.organization.primaryColor,
    event.organization.secondaryColor,
    eventStats.totalOrders,
    eventStats.totalVotes,
    grossRevenue,
  ]);

  async function refreshTicketTransactions() {
    if (loadingTickets) return;
    setLoadingTickets(true);
    try {
      const result = await getEventTicketTransactionsAction(event.id, { limit: 10 });
      setTicketTransactions(result.transactions as TicketTransaction[]);
    } finally {
      setLoadingTickets(false);
    }
  }

  async function refreshVoteTransactions() {
    if (loadingVotes) return;
    setLoadingVotes(true);
    try {
      const result = await getEventVoteTransactionsAction(event.id, { page: 1, limit: 10 });
      setVoteTransactions(result.transactions as VoteTransaction[]);
    } finally {
      setLoadingVotes(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border bg-card">
        <div
          className="border-b px-6 py-5"
          style={{
            backgroundImage: `linear-gradient(135deg, ${event.organization.primaryColor || "#009A44"}14 0%, ${event.organization.secondaryColor || "#CE1126"}12 60%, ${EVENT_TERTIARY_COLOR}14 100%)`,
          }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="gap-1.5 bg-background/80">
                  <Banknote className="size-3.5" />
                  Payouts
                </Badge>
                <Badge
                  variant={payoutConfigured ? "default" : "secondary"}
                  className="gap-1.5"
                >
                  <CreditCard className="size-3.5" />
                  {payoutConfigured ? "Account Ready" : "Setup Needed"}
                </Badge>
              </div>
              <h3 className="text-2xl font-black tracking-tight">
                Event Payouts & Transactions
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Keep payout setup in one place and monitor ticket purchases plus
                vote payments without mixing it into ticket editing.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-6 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border bg-background px-4 py-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {card.label}
                </span>
                <div
                  className="flex size-10 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `${card.accent}18`,
                    color: card.accent,
                  }}
                >
                  <card.icon className="size-5" />
                </div>
              </div>
              <p className="text-2xl font-black">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "setup" | "tickets" | "votes")
        }
        className="space-y-4"
      >
        <TabsList
          variant="afro"
          className={`grid w-full ${isTicketed && isVoting ? "grid-cols-3" : "grid-cols-2"}`}
        >
          <TabsTrigger value="setup" className="gap-2">
            <CreditCard className="size-4" />
            Payout Setup
          </TabsTrigger>
          {isTicketed && (
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="size-4" />
              Ticket Transactions
            </TabsTrigger>
          )}
          {isVoting && (
            <TabsTrigger value="votes" className="gap-2">
              <Vote className="size-4" />
              Vote Transactions
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <CreditCard className="size-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Payout Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Payout setup stays under organization settings. Use the
                      button below to review or update the account for all
                      events.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Badge
                    variant={payoutConfigured ? "default" : "secondary"}
                    className="px-3 py-1"
                  >
                    {payoutConfigured
                      ? "Connected for payouts"
                      : "No payout account connected"}
                  </Badge>
                  {event.organization.paystackAccountName && (
                    <Badge variant="outline" className="px-3 py-1">
                      {event.organization.paystackAccountName}
                    </Badge>
                  )}
                  {event.organization.paystackAccountNumber && (
                    <Badge variant="outline" className="px-3 py-1">
                      {event.organization.paystackAccountNumber}
                    </Badge>
                  )}
                </div>
              </div>

              <Button asChild className="shrink-0">
                <Link href="/organization/manage">
                  <ExternalLink className="mr-2 size-4" />
                  Check Payout Account
                </Link>
              </Button>
            </div>
          </div>
        </TabsContent>

        {isTicketed && (
          <TabsContent value="tickets">
            {loadingTickets ? (
              <div className="flex min-h-56 items-center justify-center rounded-2xl border bg-card">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : ticketTransactions.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="No ticket transactions yet"
                description="Paid ticket orders for this event will appear here once guests begin purchasing."
              />
            ) : (
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Recent Ticket Orders</h4>
                    <p className="text-sm text-muted-foreground">
                      Latest successful purchases for this event.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshTicketTransactions}
                    disabled={loadingTickets}
                  >
                    {loadingTickets ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Tickets</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticketTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {transaction.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {transaction.buyerName || "Guest checkout"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {transaction.buyerEmail ||
                                transaction.buyerPhone ||
                                "No contact"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{transaction.ticketCount}</TableCell>
                        <TableCell className="font-mono">
                          {formatAmount(
                            transaction.amount,
                            transaction.currency,
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatWhen(transaction.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        )}

        {isVoting && (
          <TabsContent value="votes">
            {loadingVotes ? (
              <div className="flex min-h-56 items-center justify-center rounded-2xl border bg-card">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : voteTransactions.length === 0 ? (
              <EmptyState
                icon={Vote}
                title="No vote transactions yet"
                description="Vote purchases will be listed here so the team can audit payment flow for this event."
              />
            ) : (
              <div className="rounded-2xl border bg-card p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Recent Vote Payments</h4>
                    <p className="text-sm text-muted-foreground">
                      Latest completed vote purchases for this event.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshVoteTransactions}
                    disabled={loadingVotes}
                  >
                    {loadingVotes ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Votes</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Nominee</TableHead>
                      <TableHead className="text-right">When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voteTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {transaction.reference}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {transaction.voterEmail ||
                                transaction.voterPhone ||
                                "Anonymous buyer"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {transaction.status}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{transaction.voteCount}</TableCell>
                        <TableCell className="font-mono">
                          {formatAmount(
                            transaction.amount,
                            transaction.currency,
                          )}
                        </TableCell>
                        <TableCell>
                          {transaction.nomineeName ||
                            transaction.nomineeCode ||
                            "Not captured"}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatWhen(transaction.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
