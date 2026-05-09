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
import { TicketRenderer } from "@/components/shared/ticket-variants/TicketRenderer";
import { NoTicketIllustration } from "@/components/common/NoTicketIllustration";
import { TicketDownloadButton } from "@/app/(website)/ticket/view/TicketDownloadButton";
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

interface TicketStatProps {
  label: string;
  icon?: any;
  value: React.ReactNode;
  className?: string;
}

function TicketStat({ label, icon: Icon, value, className }: TicketStatProps) {
  return (
    <div className="rounded-md border p-3">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
        {Icon && <Icon className="size-3.5 text-primary" />}
        {value}
      </div>
    </div>
  );
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
          <p className="text-lg font-semibold">
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
            className="group rounded-md border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-xs"
          >
            <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-center">
              <div className="mx-auto lg:mx-0 w-full">
                <TicketRenderer
                  variant={ticket.designVariant}
                  className="max-w-lg"
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
                      : event.venueName ||
                        event.venueCity ||
                        event.venueCountry
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
                  <TicketStat
                    label="Price"
                    icon={Tag}
                    value={
                      <span className="font-semibold text-foreground">
                        {ticket.price === 0
                          ? "FREE"
                          : formatCurrency(ticket.price, ticket.currency)}
                      </span>
                    }
                  />

                  <TicketStat
                    label="Inventory"
                    icon={Users}
                    value={
                      <span>
                        {ticket.quantityTotal
                          ? `${ticket.quantitySold} / ${ticket.quantityTotal} Sold`
                          : `${ticket.quantitySold} Sold`}
                      </span>
                    }
                  />

                  <TicketStat
                    label="Sales Window"
                    icon={Calendar}
                    value={
                      <span>
                        {ticket.salesEnd
                          ? `Ends ${new Date(ticket.salesEnd).toLocaleDateString()}`
                          : "Evergreen"}
                      </span>
                    }
                  />

                  <TicketStat
                    label="Palette"
                    className="gap-2"
                    value={
                      <>
                        <span
                          className="block h-5 w-5 rounded-full border"
                          style={{
                            backgroundColor:
                              ticket.primaryColor ||
                              ticket.color ||
                              primaryColor,
                          }}
                        />
                        <span
                          className="block h-5 w-5 rounded-full border"
                          style={{
                            backgroundColor:
                              ticket.secondaryColor || secondaryColor,
                          }}
                        />
                      </>
                    }
                  />
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
                    {/* <TicketDownloadButton
                      elementId={`ticket-capture-${ticket.id}`}
                      fileName={`${event.slug}-${ticket.name}-print-ready`}
                      label="Print-Ready (High-Res)"
                      fileFormat="png"
                      variant="outline"
                      className="h-9 px-4 text-xs rounded-md"
                    /> */}
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
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-muted/5">
            <NoTicketIllustration className="size-48 mb-6 opacity-80" />
            <h4 className="text-xl font-bold uppercase tracking-tight mb-2">No Ticket Tiers Created</h4>
            <p className="text-muted-foreground text-sm max-w-xs text-center mb-6">
              You haven't set up any ticket tiers for this event yet. Create your first tier to start selling tickets.
            </p>
            {canEdit && (
              <Button
                variant="tertiary"
                size="default"
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

      {/* Hidden Export Section for Background Rendering (matches ticket view page implementation) */}
      <div 
        className="absolute top-[-9999px] left-[-9999px] pointer-events-none" 
        aria-hidden="true"
      >
        {ticketTypes.map((ticket) => (
          <div 
            key={`export-node-${ticket.id}`} 
            id={`ticket-capture-${ticket.id}`}
            className="bg-transparent p-0 w-[560px] min-w-[560px]"
          >
            <TicketRenderer
              variant={ticket.designVariant}
              exportMode={true}
              exportSide="both"
              primaryColor={ticket.primaryColor || ticket.color || primaryColor}
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
                  : event.venueName ||
                    event.venueCity ||
                    event.venueCountry
              }
              ticketCode={`TIER-${ticket.orderIdx + 1}`}
              qrPayload={`https://afrotix.com/verify/TIER-${ticket.orderIdx + 1}`}
            />
          </div>
        ))}
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
