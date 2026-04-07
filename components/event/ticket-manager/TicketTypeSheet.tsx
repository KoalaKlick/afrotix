"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Ticket,
  Tag,
  Calendar,
  Users,
  ListFilter,
} from "lucide-react";
import { toast } from "sonner";
import {
  createTicketTypeAction,
  updateTicketTypeAction,
} from "@/lib/actions/ticket";
import type { TicketType, TicketStatus } from "@/lib/types/ticket";
import type { EventDetailEvent } from "@/lib/types/event";
import { TicketPreview } from "@/components/shared/TicketPreview";

interface TicketTypeSheetProps {
  readonly eventId: string;
  readonly event: EventDetailEvent;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly editingTicket: TicketType | null;
  readonly onCreated?: (ticket: TicketType) => void;
  readonly onUpdated?: (ticket: TicketType) => void;
}

export function TicketTypeSheet({
  eventId,
  event,
  open,
  onOpenChange,
  editingTicket,
  onCreated,
  onUpdated,
}: TicketTypeSheetProps) {
  const organization = event.organization;
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    quantityTotal: "" as string | number,
    salesStart: "",
    salesEnd: "",
    maxPerOrder: 10,
    minPerOrder: 1,
    status: "available" as TicketStatus,
    color: organization?.primaryColor || "",
    primaryColor: organization?.primaryColor || "",
    secondaryColor: organization?.secondaryColor || "",
  });
  const previewPrimary =
    formData.primaryColor ||
    formData.color ||
    organization?.primaryColor ||
    "#009A44";
  const previewSecondary =
    formData.secondaryColor || organization?.secondaryColor || "#CE1126";

  useEffect(() => {
    if (editingTicket) {
      setFormData({
        name: editingTicket.name,
        description: editingTicket.description ?? "",
        price: editingTicket.price,
        quantityTotal: editingTicket.quantityTotal ?? "",
        salesStart: editingTicket.salesStart
          ? new Date(editingTicket.salesStart).toISOString().slice(0, 16)
          : "",
        salesEnd: editingTicket.salesEnd
          ? new Date(editingTicket.salesEnd).toISOString().slice(0, 16)
          : "",
        maxPerOrder: editingTicket.maxPerOrder,
        minPerOrder: editingTicket.minPerOrder,
        status: editingTicket.status,
        color:
          editingTicket.primaryColor ||
          editingTicket.color ||
          organization?.primaryColor ||
          "",
        primaryColor:
          editingTicket.primaryColor ||
          editingTicket.color ||
          organization?.primaryColor ||
          "",
        secondaryColor:
          editingTicket.secondaryColor || organization?.secondaryColor || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        quantityTotal: "",
        salesStart: "",
        salesEnd: "",
        maxPerOrder: 10,
        minPerOrder: 1,
        status: "available",
        color: organization?.primaryColor || "",
        primaryColor: organization?.primaryColor || "",
        secondaryColor: organization?.secondaryColor || "",
      });
    }
  }, [editingTicket, organization?.primaryColor, organization?.secondaryColor]);

  async function handleSave() {
    if (!formData.name.trim()) {
      toast.error("Ticket name is required");
      return;
    }

    startTransition(async () => {
      const data = {
        ...formData,
        quantityTotal:
          formData.quantityTotal === "" ? null : Number(formData.quantityTotal),
        color: formData.primaryColor,
      };

      const result = editingTicket
        ? await updateTicketTypeAction(editingTicket.id, data)
        : await createTicketTypeAction(eventId, data);

      if (result.success) {
        toast.success(
          editingTicket ? "Ticket tier updated" : "Ticket tier created",
        );
        if (editingTicket) {
          onUpdated?.(result.data as TicketType);
        } else {
          onCreated?.(result.data as TicketType);
        }
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg gap-y-0 flex flex-col h-full bg-background/95 backdrop-blur-sm"
      >
        <SheetHeader className="shrink-0 space-y-1">
          <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Ticket className="size-5 text-primary" />
          </div>
          <SheetTitle className="text-2xl font-bold flex items-center gap-2">
            {editingTicket ? "Edit Ticket Tier" : "Create Ticket Tier"}
          </SheetTitle>
          <SheetDescription>
            Define sales settings and pricing for your tickets
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-6 pt-6 flex-1 overflow-y-auto pr-2 pb-10 scrollbar-none">
          <div className="rounded-3xl border bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Ticket Card Preview
                </p>
                <p className="text-sm text-muted-foreground">
                  Ticket visuals follow the organization look, with the tier
                  accent staying flexible.
                </p>
              </div>
            </div>
            <TicketPreview
              className="mx-auto max-w-xs"
              primaryColor={previewPrimary}
              secondaryColor={previewSecondary}
              logoUrl={organization?.logoUrl}
              flierImage={event.flierImage}
              bannerImage={event.bannerImage}
              organizationName={organization?.name}
              eventName={event.title}
              ticketType={formData.name || "General Admission"}
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
              ticketCode="AUTO-QR"
            />
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest pb-1 border-b">
              <Tag className="size-3.5" />
              Tier Details
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Ticket Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Early Bird VIP, Regular Access"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="What's included in this ticket?"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price (GHS) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground uppercase">
                    GHS
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                    className="pl-12"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Set to 0 for a free ticket
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantityTotal">Total Quantity</Label>
                <Input
                  id="quantityTotal"
                  type="number"
                  min={1}
                  value={formData.quantityTotal}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantityTotal: e.target.value,
                    }))
                  }
                  placeholder="Unlimited"
                />
                <p className="text-[10px] text-muted-foreground">
                  Leave empty for unlimited
                </p>
              </div>
            </div>
          </div>

          {/* Sales Timeline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest pb-1 border-b">
              <Calendar className="size-3.5" />
              Sales Timeline
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salesStart">Sales Start</Label>
                <Input
                  id="salesStart"
                  type="datetime-local"
                  value={formData.salesStart}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      salesStart: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salesEnd">Sales End</Label>
                <Input
                  id="salesEnd"
                  type="datetime-local"
                  value={formData.salesEnd}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      salesEnd: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Order Limits */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest pb-1 border-b">
              <Users className="size-3.5" />
              Order Limits
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPerOrder">Min. per Order</Label>
                <Input
                  id="minPerOrder"
                  type="number"
                  min={1}
                  value={formData.minPerOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minPerOrder: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPerOrder">Max. per Order</Label>
                <Input
                  id="maxPerOrder"
                  type="number"
                  min={1}
                  value={formData.maxPerOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxPerOrder: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Tier Status */}
          <div className="space-y-4 pb-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest pb-1 border-b">
              <ListFilter className="size-3.5" />
              Tier Status
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Availability</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TicketStatus) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">
                    Available (Ongoing Sales)
                  </SelectItem>
                  <SelectItem value="sold_out" className="text-red-600">
                    Sold Out
                  </SelectItem>
                  <SelectItem value="hidden">Hidden (Internal Only)</SelectItem>
                  <SelectItem value="expired" className="text-muted-foreground">
                    Expired (Sales Closed)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Brand Colors */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest pb-1 border-b">
              <Tag className="size-3.5" />
              Tier Branding
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                        primaryColor: e.target.value,
                      }))
                    }
                    className="h-10 w-16 cursor-pointer rounded-md border bg-background p-1"
                  />
                  <Input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                        primaryColor: e.target.value,
                      }))
                    }
                    className="font-mono text-xs"
                    placeholder="#hex-code"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Main accent for the ticket face.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        secondaryColor: e.target.value,
                      }))
                    }
                    className="h-10 w-16 cursor-pointer rounded-md border bg-background p-1"
                  />
                  <Input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        secondaryColor: e.target.value,
                      }))
                    }
                    className="font-mono text-xs"
                    placeholder="#hex-code"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Supports gradients, footer, and premium finish.
                </p>
              </div>
            </div>
            {(organization?.primaryColor || organization?.secondaryColor) && (
              <div className="flex flex-wrap gap-2">
                {organization?.primaryColor && (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        color: organization.primaryColor ?? "",
                        primaryColor: organization.primaryColor ?? "",
                      }))
                    }
                    className="text-[10px] uppercase font-bold"
                  >
                    Use Org Primary
                  </Button>
                )}
                {organization?.secondaryColor && (
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        secondaryColor: organization.secondaryColor ?? "",
                      }))
                    }
                    className="text-[10px] uppercase font-bold"
                  >
                    Use Org Secondary
                  </Button>
                )}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              The list card will mirror this actual ticket look so organizers
              see the product they are selling.
            </p>
          </div>
        </SheetBody>

        <SheetFooter className="shrink-0 border-t bg-muted/20">
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-primary hover:bg-primary/90 px-8"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : editingTicket ? (
              "Save Changes"
            ) : (
              "Create Tier"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
