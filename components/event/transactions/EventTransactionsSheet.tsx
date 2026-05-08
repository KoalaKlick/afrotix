"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoteTransactionsTable } from "./VoteTransactionsTable";
import { NominationTransactionsTable } from "./NominationTransactionsTable";
import { TicketTransactionsTable } from "./TicketTransactionsTable";
import {
  Loader2,
  Hash,
  Ticket as TicketIcon,
  Vote as VoteIcon,
} from "lucide-react";
import {
  getEventNominationTransactionsAction,
  getEventTicketTransactionsAction,
  getEventVoteTransactionsAction,
} from "@/lib/actions/event";

interface EventTransactionsSheetProps {
  eventId: string;
  isVotingType: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "votes" | "tickets" | "nominations";
  initialVoteTransactions?: { transactions: any[]; total: number };
  initialTicketTransactions?: { transactions: any[]; total: number };
}

export function EventTransactionsSheet({
  eventId,
  isVotingType,
  open,
  onOpenChange,
  defaultType = "votes",
  initialVoteTransactions = { transactions: [], total: 0 },
  initialTicketTransactions = { transactions: [], total: 0 },
}: EventTransactionsSheetProps) {
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
  const [breakdownType, setBreakdownType] = useState<
    "votes" | "tickets" | "nominations"
  >(defaultType);

  // Sync default type when opened
  useEffect(() => {
    if (open) {
      setBreakdownType(defaultType);
    }
  }, [open, defaultType]);

  const [ticketTxData, setTicketTxData] = useState<any>(
    initialTicketTransactions.total > 0 ? initialTicketTransactions : null,
  );
  const [voteTxData, setVoteTxData] = useState<any>(
    initialVoteTransactions.total > 0 ? initialVoteTransactions : null,
  );
  const [nomTxData, setNomTxData] = useState<any>(null);

  const loadVotes = useCallback(
    async (options: any) => {
      setIsLoadingBreakdown(true);
      try {
        const data = await getEventVoteTransactionsAction(eventId, options);
        setVoteTxData(data);
        return data;
      } finally {
        setIsLoadingBreakdown(false);
      }
    },
    [eventId],
  );

  const loadTickets = useCallback(
    async (options: any) => {
      setIsLoadingBreakdown(true);
      try {
        const data = await getEventTicketTransactionsAction(eventId, options);
        setTicketTxData(data);
        return data;
      } finally {
        setIsLoadingBreakdown(false);
      }
    },
    [eventId],
  );

  const loadNominations = useCallback(
    async (options: any) => {
      setIsLoadingBreakdown(true);
      try {
        const data = await getEventNominationTransactionsAction(
          eventId,
          options,
        );
        setNomTxData(data);
        return data;
      } finally {
        setIsLoadingBreakdown(false);
      }
    },
    [eventId],
  );

  // When breakdown opens, load the appropriate data if null
  useEffect(() => {
    if (!open) return;

    if (breakdownType === "votes" && !voteTxData) {
      loadVotes({ page: 1 });
    } else if (breakdownType === "tickets" && !ticketTxData) {
      loadTickets({ page: 1 });
    } else if (breakdownType === "nominations" && !nomTxData) {
      loadNominations({ page: 1 });
    }
  }, [
    open,
    breakdownType,
    voteTxData,
    ticketTxData,
    nomTxData,
    loadVotes,
    loadTickets,
    loadNominations,
  ]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        variant="afro"
        className="w-full sm:max-w-3xl flex flex-col h-full p-0"
      >
        <SheetHeader className="shrink-0 px-6 py-6 border-b">
          <SheetTitle className="flex items-center gap-2 text-2xl">
            {breakdownType === "votes" && (
              <>
                <VoteIcon className="size-6 text-primary" />
                Vote Transactions
              </>
            )}
            {breakdownType === "nominations" && (
              <>
                <Hash className="size-6 text-primary" />
                Nomination Transactions
              </>
            )}
            {breakdownType === "tickets" && (
              <>
                <TicketIcon className="size-6 text-primary" />
                Ticket Transactions
              </>
            )}
          </SheetTitle>
          <SheetDescription>
            {breakdownType === "votes" &&
              "View a detailed list of all successful vote purchases for this event."}
            {breakdownType === "nominations" &&
              "View a detailed list of all successful nomination fee payments for this event."}
            {breakdownType === "tickets" &&
              "View a detailed list of all ticket orders and purchases for this event."}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="flex-1 overflow-y-auto px-6 py-6">
          <Tabs
            value={breakdownType}
            onValueChange={(val) => setBreakdownType(val as any)}
            className="space-y-6"
          >
            {isVotingType && (
              <TabsList
                variant="afro"
                className="grid grid-cols-2 lg:w-[400px]"
              >
                <TabsTrigger
                  value="votes"
                  className="gap-1.5 whitespace-nowrap"
                >
                  <VoteIcon className="size-4" />
                  Votes
                </TabsTrigger>
                <TabsTrigger
                  value="nominations"
                  className="gap-1.5 whitespace-nowrap"
                >
                  <Hash className="size-4" />
                  Nominations
                </TabsTrigger>
              </TabsList>
            )}

            <div className="relative min-h-[400px]">
              {isLoadingBreakdown &&
                !voteTxData &&
                !ticketTxData &&
                !nomTxData && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground bg-background/80 z-10">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm font-medium animate-pulse">
                      Fetching transaction history...
                    </p>
                  </div>
                )}

              <TabsContent value="votes" className="mt-0 outline-none">
                {voteTxData && (
                  <VoteTransactionsTable
                    initialData={voteTxData}
                    eventId={eventId}
                    fetchPage={loadVotes}
                  />
                )}
              </TabsContent>

              <TabsContent value="nominations" className="mt-0 outline-none">
                {nomTxData && (
                  <NominationTransactionsTable
                    initialData={nomTxData}
                    eventId={eventId}
                    fetchPage={loadNominations}
                  />
                )}
              </TabsContent>

              <TabsContent value="tickets" className="mt-0 outline-none">
                {ticketTxData && (
                  <TicketTransactionsTable
                    initialData={ticketTxData}
                    eventId={eventId}
                    fetchPage={loadTickets}
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
