"use client";
import { changeEventStatus, updateExistingEvent } from "@/lib/actions/event";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Pencil,
  X,
  ChevronDown,
  ExternalLink,
  EyeOff,
  Ticket,
  Vote,
  Layers,
  Megaphone,
  Settings,
  Check,
  LayoutDashboard,
  Banknote,
} from "lucide-react";
import {
  VotingManager,
  EventOverviewTab,
  DeleteEventDialog,
  EventSettingsTab,
  TicketManager,
  type VotingChartCategory,
} from "@/components/event";
import type { TicketType } from "@/lib/types/ticket";
import type { VotingCategory, VotingOption } from "@/lib/types/voting";
import type {
  EventDetailStatsData,
  VoteTrendPoint,
} from "@/lib/types/event-stats";
import type { OrganizationRole } from "@/lib/generated/prisma";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState, useTransition } from "react";
import type { EventDetailEvent, EventFormData } from "@/lib/types/event";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Removed local interface EventData and EventDetailClientProps
// Use imported types for props and state

import { getEventImageUrl } from "@/lib/image-url-utils";
import {
  getEventPublicationStatus,
  getEventLifecycleStatus,
} from "@/lib/event-status";
// Removed EventPayoutsTab import

interface EventDetailClientProps {
  readonly event: EventDetailEvent;
  readonly userRole: OrganizationRole;
  readonly votingCategories?: Array<
    Omit<VotingCategory, "votingOptions"> & {
      votingOptions: Array<
        Omit<VotingOption, "votesCount"> & { votesCount: string }
      >;
    }
  >;
  readonly eventStats: EventDetailStatsData;
  readonly voteTrend?: VoteTrendPoint[];
  readonly ticketTypes?: TicketType[];
  readonly ticketTrend?: { date: string; sales: number; revenue: number }[];
  readonly ticketTypeSales?: { id: string; name: string; sold: number; capacity: number }[];
  readonly initialVoteTransactions?: {
    transactions: Array<{
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
    }>;
    total: number;
  };
  readonly initialTicketTransactions?: {
    transactions: Array<{
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
    }>;
    total: number;
  };
}

const typeIcons: Record<string, typeof Ticket> = {
  ticketed: Ticket,
  voting: Vote,
  hybrid: Layers,
  advertisement: Megaphone,
};

const statusColors: Record<string, string> = {
  draft:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  published:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  upcoming: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  ongoing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ended: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export function EventDetailClient({
  event,
  userRole,
  votingCategories = [],
  eventStats,
  voteTrend = [],
  ticketTrend = [],
  ticketTypeSales = [],
  ticketTypes = [],
  initialVoteTransactions = { transactions: [], total: 0 },
  initialTicketTransactions = { transactions: [], total: 0 },
}: EventDetailClientProps) {
  const { organization } = event;
  const organizationSlug = organization?.slug;
  const hasPaymentAccount = !!organization?.paystackAccountNumber;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);

  // Editable fields state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: event.title,
    slug: event.slug,
    type: event.type,
    status: event.status,
    description: event.description ?? "",
    startDate: event.startDate
      ? new Date(event.startDate).toISOString().slice(0, 16)
      : "",
    endDate: event.endDate
      ? new Date(event.endDate).toISOString().slice(0, 16)
      : "",
    timezone: event.timezone,
    isVirtual: event.isVirtual,
    virtualLink: event.virtualLink ?? "",
    venueName: event.venueName ?? "",
    venueAddress: event.venueAddress ?? "",
    venueCity: event.venueCity ?? "",
    venueCountry: event.venueCountry,
    coverImage: event.coverImage ?? "",
    bannerImage: event.bannerImage ?? "",
    maxAttendees: event.maxAttendees ?? null,
    isPublic: event.isPublic,
    sponsors: event.sponsors ?? [],
    socialLinks: event.socialLinks ?? [],
    galleryLinks: event.galleryLinks ?? [],
  });

  const canEdit = userRole === "owner" || userRole === "admin";

  const canDelete = canEdit && event.status === "draft";
  const publicEventUrl = organizationSlug
    ? `/${organizationSlug}/event/${event.slug}`
    : null;
  const publicationStatus = getEventPublicationStatus(formData.status);
  const lifecycleStatus = getEventLifecycleStatus({
    status: formData.status,
    startDate: formData.startDate || null,
    endDate: formData.endDate || null,
  });
  const canViewPublicPage = Boolean(
    publicEventUrl && formData.isPublic && publicationStatus === "published",
  );

  // Save multiple fields at once
  async function saveMultipleFields(fields: Record<string, unknown>) {
    const formDataObj = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null) {
        const type = typeof value;
        if (type === "string" || type === "number" || type === "boolean") {
          formDataObj.set(key, String(value));
        } else if (type === "object") {
          // Only serialize plain objects or arrays
          if (
            Array.isArray(value) ||
            Object.prototype.toString.call(value) === "[object Object]"
          ) {
            try {
              formDataObj.set(key, JSON.stringify(value));
            } catch {
              // skip non-serializable values
            }
          }
        }
        // skip all other types (function, symbol, etc.)
      }
    }

    startTransition(async () => {
      const result = await updateExistingEvent(event.id, formDataObj);
      if (result.success) {
        toast.success("Changes saved");
        setEditingField(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  // Generate display URLs from paths
  const coverDisplayUrl = getEventImageUrl(formData.coverImage);
  const bannerDisplayUrl = getEventImageUrl(formData.bannerImage);

  // Save a single field
  async function saveField(fieldName: string, value: unknown) {
    const formDataObj = new FormData();
    const type = typeof value;
    if (type === "string" || type === "number" || type === "boolean") {
      formDataObj.set(fieldName, String(value));
    } else if (value !== null && value !== undefined) {
      try {
        formDataObj.set(fieldName, JSON.stringify(value));
      } catch {
        // skip non-serializable values
      }
    }

    startTransition(async () => {
      const result = await updateExistingEvent(event.id, formDataObj);
      if (result.success) {
        toast.success("Changes saved");
        setEditingField(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  // Removed unused handleFormSubmit

  // Image upload handler
  // Removed unused handleImageUpload

  // Removed unused handleFileChange

  // Status change handler
  async function handleStatusChange(newStatus: string) {
    if (newStatus === formData.status) return;

    if (newStatus === "published" && !hasPaymentAccount) {
      setShowPaymentPrompt(true);
      return;
    }

    startTransition(async () => {
      const result = await changeEventStatus(event.id, newStatus);
      if (result.success) {
        setFormData((prev: EventFormData) => ({ ...prev, status: newStatus }));
        toast.success(`Status changed to ${newStatus}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const TypeIcon = typeIcons[event.type] ?? Ticket;

  return (
    <div className="space-y-6 @container">
      {/* Header Section */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {/* Banner */}
        <div className="relative h-32 sm:h-48 bg-linear-to-r from-primary/20 to-primary/5">
          {formData.bannerImage && bannerDisplayUrl && (
            <Image
              src={bannerDisplayUrl}
              alt="Banner"
              fill
              className="object-cover"
              unoptimized
            />
          )}
          {/* Image upload disabled: input and button removed */}
        </div>

        {/* Event Info */}
        <div className="p-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            {/* Cover Image */}
            <div className="relative shrink-0">
              <div className="size-24 sm:size-32 overflow-clip p-4  rounded-xl border-4 border-background bg-muted shadow-lg">
                {formData.coverImage && coverDisplayUrl ? (
                  <Image
                    src={coverDisplayUrl}
                    alt={event.title}
                    fill
                    className="object-cover rounded-xl"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TypeIcon className="size-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              {/* Image upload disabled: input and button removed */}
            </div>

            {/* Title & Status */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={statusColors[publicationStatus]}>
                  {publicationStatus}
                </Badge>
                <Badge className={statusColors[lifecycleStatus]}>
                  {lifecycleStatus}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <TypeIcon className="size-3" />
                  {event.type}
                </Badge>
                {!formData.isPublic && (
                  <Badge variant="secondary" className="gap-1">
                    <EyeOff className="size-3" />
                    Private
                  </Badge>
                )}
              </div>

              {editingField === "title" ? (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev: EventFormData) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="text-xl font-bold"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => saveField("title", formData.title)}
                    disabled={isPending}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setFormData((prev: EventFormData) => ({
                        ...prev,
                        title: event.title,
                      }));
                      setEditingField(null);
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  className={cn(
                    "text-2xl font-bold truncate",
                    canEdit && "cursor-pointer hover:text-primary/80",
                  )}
                  onClick={() => canEdit && setEditingField("title")}
                >
                  {formData.title}
                  {canEdit && (
                    <Pencil className="inline-block size-4 ml-2 text-muted-foreground" />
                  )}
                </button>
              )}

              <p className="text-sm text-muted-foreground mt-1">
                /{event.slug}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Created {new Date(event.createdAt).toLocaleDateString()}
                {" · "}
                Updated {new Date(event.updatedAt).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Status Selector */}
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      className="gap-2"
                    >
                      {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      <span className="capitalize">{publicationStatus}</span>
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("draft")}
                      className={
                        publicationStatus === "draft" ? "bg-accent" : ""
                      }
                    >
                      Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("published")}
                      className={
                        publicationStatus === "published" ? "bg-accent" : ""
                      }
                    >
                      Published
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {canViewPublicPage && publicEventUrl && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={publicEventUrl} target="_blank">
                    <ExternalLink className="size-4 mr-2" />
                    View Public Page
                  </Link>
                </Button>
              )}

              {canDelete && <DeleteEventDialog eventId={event.id} />}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList
          variant="afro"
          className={cn(
            "grid w-full",
            (() => {
              let cols = 2; // Overview + Settings
              if (event.type === "voting" || event.type === "hybrid") cols++;
              if (event.type === "ticketed" || event.type === "hybrid") cols++;
              return `grid-cols-${cols}`;
            })(),
          )}
        >
          <TabsTrigger value="overview" className="gap-1.5">
            <LayoutDashboard className="size-4" />
            Overview
          </TabsTrigger>
          {(event.type === "voting" || event.type === "hybrid") && (
            <TabsTrigger value="voting" className="gap-1.5">
              <Vote className="size-4" />
              Voting
            </TabsTrigger>
          )}
          {(event.type === "ticketed" || event.type === "hybrid") && (
            <TabsTrigger value="ticketing" className="gap-1.5">
              <Ticket className="size-4" />
              Tickets
            </TabsTrigger>
          )}
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="size-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <EventOverviewTab
            event={event}
            eventStats={eventStats}
            voteTrend={voteTrend}
            ticketTrend={ticketTrend}
            ticketTypeSales={ticketTypeSales}
            initialVoteTransactions={initialVoteTransactions}
            initialTicketTransactions={initialTicketTransactions}
            votingCategories={votingCategories.map(
              (cat): VotingChartCategory => ({
                id: cat.id,
                name: cat.name,
                votingOptions: cat.votingOptions.map((opt) => ({
                  id: opt.id,
                  optionText: opt.optionText,
                  votesCount: Number(opt.votesCount),
                  imageUrl: opt.imageUrl,
                })),
              }),
            )}
          />
        </TabsContent>

        {/* Removed Payouts TabContent */}

        {/* Voting Tab */}
        {(event.type === "voting" || event.type === "hybrid") && (
          <TabsContent value="voting" className="space-y-4">
            <div className="">
              <VotingManager
                eventId={event.id}
                categories={votingCategories.map((cat) => ({
                  ...cat,
                  nominationPrice: cat.nominationPrice,
                  votePrice: cat.votePrice,
                  votingOptions: cat.votingOptions.map((opt) => ({
                    ...opt,
                    votesCount: BigInt(opt.votesCount),
                  })),
                }))}
                canEdit={canEdit}
                votingMode={event.votingMode}
              />
            </div>
          </TabsContent>
        )}

        {/* Ticketing Tab */}
        {(event.type === "ticketed" || event.type === "hybrid") && (
          <TabsContent value="ticketing" className="space-y-4">
            <TicketManager
              event={event}
              ticketTypes={ticketTypes}
              canEdit={canEdit}
            />
          </TabsContent>
        )}
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <EventSettingsTab
            formData={formData}
            setFormData={setFormData}
            event={event}
            editingField={editingField}
            setEditingField={setEditingField}
            canEdit={canEdit}
            isPending={isPending}
            saveField={saveField}
            saveMultipleFields={saveMultipleFields}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog open={showPaymentPrompt} onOpenChange={setShowPaymentPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Payout Details Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to set up an organization payout account (Mobile Money or
              Bank Account) before you can publish an event. This ensures you
              can receive earnings from ticket sales or votes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push("/organization/manage")}
            >
              Setup Payout Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
