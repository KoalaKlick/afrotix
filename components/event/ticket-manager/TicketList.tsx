"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Ticket,
  Pencil,
  Trash2,
  Calendar,
  Users,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TicketTypeSheet } from "./TicketTypeSheet";
import { deleteTicketTypeAction } from "@/lib/actions/ticket";
import type { TicketType } from "@/lib/types/ticket";
import type { EventDetailEvent } from "@/lib/types/event";
import { TicketPreview } from "@/components/shared/TicketPreview";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TicketListProps {
  readonly eventId: string;
  readonly event: EventDetailEvent;
  readonly ticketTypes: TicketType[];
  readonly setTicketTypes: React.Dispatch<React.SetStateAction<TicketType[]>>;
  readonly canEdit: boolean;
}

export function TicketList({
  eventId,
  event,
  ticketTypes,
  setTicketTypes,
  canEdit,
}: TicketListProps) {
  const organization = event.organization;
  const primaryColor = organization?.primaryColor || "#009A44";
  const secondaryColor = organization?.secondaryColor || "#CE1126";
  const [, startTransition] = useTransition();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);

  function handleEdit(ticket: TicketType) {
    setEditingTicket(ticket);
    setIsSheetOpen(true);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteTicketTypeAction(id);
      if (result.success) {
        setTicketTypes((prev) => prev.filter((t) => t.id !== id));
        toast.success("Ticket tier removed");
      } else {
        toast.error(result.error);
      }
    });
  }

  const formatCurrency = (amount: number, currency: string = "GHS") => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">Ticket Tiers</h3>
          <p className="text-sm text-muted-foreground">
            {ticketTypes.length} {ticketTypes.length === 1 ? "tier" : "tiers"}{" "}
            available for {event.title}
          </p>
        </div>
        {canEdit && (
          <Button
            size="sm"
            variant="tertiary"
            onClick={() => {
              setEditingTicket(null);
              setIsSheetOpen(true);
            }}
          >
            <Plus className="size-4 mr-2" />
            Add Ticket Tier
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {ticketTypes.map((ticket) => (
          <div
            key={ticket.id}
            className="group rounded-[32px] border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
              <div className="mx-auto lg:mx-0">
                <TicketPreview
                  className="max-w-xs"
                  primaryColor={
                    ticket.primaryColor || ticket.color || primaryColor
                  }
                  secondaryColor={ticket.secondaryColor || secondaryColor}
                  logoUrl={organization?.logoUrl}
                  flierImage={event.flierImage}
                  bannerImage={event.bannerImage}
                  organizationName={organization?.name}
                  eventName={event.title}
                  ticketType={ticket.name}
                  dateTime={
                    event.startDate
                      ? new Date(event.startDate).toLocaleString("en-GH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Date to be announced"
                  }
                  venue={
                    event.isVirtual
                      ? event.virtualLink || "Virtual event"
                      : event.venueName || event.venueCity || event.venueCountry
                  }
                  ticketCode={`TIER-${ticket.orderIdx + 1}`}
                  stacked={false}
                />
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-bold">{ticket.name}</h4>
                  <Badge
                    variant={
                      ticket.status === "available" ? "default" : "secondary"
                    }
                    className={cn(
                      "text-[10px] uppercase font-bold tracking-wider",
                      ticket.status === "available" && "hover:opacity-90",
                    )}
                    style={
                      ticket.status === "available"
                        ? {
                            backgroundColor:
                              ticket.primaryColor ||
                              ticket.color ||
                              primaryColor,
                            color: "white",
                          }
                        : undefined
                    }
                  >
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </div>
                {ticket.description && (
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    {ticket.description}
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border bg-muted/20 p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Price
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Tag className="size-3.5 text-primary" />
                      <span className="font-bold text-foreground">
                        {ticket.price === 0
                          ? "FREE"
                          : formatCurrency(ticket.price, ticket.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-muted/20 p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Inventory
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="size-3.5 text-primary" />
                      <span>
                        {ticket.quantityTotal
                          ? `${ticket.quantitySold} / ${ticket.quantityTotal} Sold`
                          : `${ticket.quantitySold} Sold`}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-muted/20 p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Sales Window
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="size-3.5 text-primary" />
                      <span>
                        {ticket.salesEnd
                          ? `Ends ${new Date(ticket.salesEnd).toLocaleDateString()}`
                          : "Evergreen"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-muted/20 p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Palette
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="block h-5 w-5 rounded-full border"
                        style={{
                          backgroundColor:
                            ticket.primaryColor || ticket.color || primaryColor,
                        }}
                      />
                      <span
                        className="block h-5 w-5 rounded-full border"
                        style={{
                          backgroundColor:
                            ticket.secondaryColor || secondaryColor,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(ticket)}
                    >
                      <Pencil className="mr-2 size-4" />
                      Edit Ticket
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete Ticket Tier?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove &quot;{ticket.name}
                            &quot;?
                            {ticket.quantitySold > 0 && (
                              <span className="mt-2 block font-bold text-destructive">
                                Warning: This tier has existing sales. It will
                                be hidden instead of deleted.
                              </span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(ticket.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {ticketTypes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
            <Ticket className="size-12 text-muted-foreground opacity-20 mb-4" />
            <p className="text-muted-foreground font-medium">
              No ticket tiers created yet
            </p>
            {canEdit && (
              <Button
                variant="tertiary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setEditingTicket(null);
                  setIsSheetOpen(true);
                }}
              >
                <Plus className="size-4 mr-2" />
                Create First Ticket Tier
              </Button>
            )}
          </div>
        )}
      </div>

      <TicketTypeSheet
        eventId={eventId}
        event={event}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        editingTicket={editingTicket}
        onCreated={(newTicket: TicketType) => {
          setTicketTypes((prev) => [...prev, newTicket]);
        }}
        onUpdated={(updatedTicket: TicketType) => {
          setTicketTypes((prev) =>
            prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)),
          );
        }}
      />
    </div>
  );
}
