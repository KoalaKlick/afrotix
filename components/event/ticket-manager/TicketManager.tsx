"use client";

import { useState } from "react";
import { Ticket } from "lucide-react";
import { TicketList } from "./TicketList";
import type { TicketType } from "@/lib/types/ticket";
import type { EventDetailEvent } from "@/lib/types/event";

interface TicketManagerProps {
  readonly event: EventDetailEvent;
  readonly ticketTypes: TicketType[];
  readonly canEdit: boolean;
}

export function TicketManager({
  event,
  ticketTypes: initialTicketTypes,
  canEdit,
}: TicketManagerProps) {
  const [ticketTypes, setTicketTypes] = useState(initialTicketTypes);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
          <Ticket className="size-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Ticket Editing</h3>
          <p className="text-sm text-muted-foreground">
            Manage ticket tiers here. Billing stays in the main sidebar, while
            payouts now live in the event-level payouts tab.
          </p>
        </div>
      </div>

      <TicketList
        eventId={event.id}
        event={event}
        ticketTypes={ticketTypes}
        setTicketTypes={setTicketTypes}
        canEdit={canEdit}
      />
    </div>
  );
}
