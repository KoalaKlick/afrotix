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
  ImageIcon,
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
import { useRef, useState, useTransition } from "react";
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
import { convertToWebP } from "@/lib/image-utils";
import { uploadImage } from "@/lib/actions/upload-image";
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
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingFlier, setIsUploadingFlier] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const flierInputRef = useRef<HTMLInputElement>(null);

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
    flierImage: event.flierImage ?? "",
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
  const flierDisplayUrl = getEventImageUrl(formData.flierImage);
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

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be less than 10MB"); return; }

    setIsUploadingBanner(true);
    try {
      const optimizedFile = await convertToWebP(file, { quality: 1, maxWidth: 1920, maxHeight: 600, maxSizeMB: 1 });
      const fd = new FormData();
      fd.set("file", optimizedFile);
      const result = await uploadImage(fd, {
        bucket: "events",
        folder: "banners",
        oldPath: formData.bannerImage || null,
      });
      if (result.success && result.data) {
        setFormData((prev: EventFormData) => ({ ...prev, bannerImage: result.data.path }));
        await saveField("bannerImage", result.data.path);
        toast.success("Banner uploaded!");
      } else {
        toast.error(result.success ? "Failed to upload banner" : result.error);
      }
    } catch {
      toast.error("Failed to upload banner");
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  }

  async function handleFlierUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }

    setIsUploadingFlier(true);
    try {
      const optimizedFile = await convertToWebP(file, { quality: 1, maxWidth: 800, maxHeight: 800, maxSizeMB: 0.5 });
      const fd = new FormData();
      fd.set("file", optimizedFile);
      const result = await uploadImage(fd, {
        bucket: "events",
        folder: "fliers",
        oldPath: formData.flierImage || null,
      });
      if (result.success && result.data) {
        setFormData((prev: EventFormData) => ({ ...prev, flierImage: result.data.path }));
        await saveField("flierImage", result.data.path);
        toast.success("Flier image uploaded!");
      } else {
        toast.error(result.success ? "Failed to upload flier image" : result.error);
      }
    } catch {
      toast.error("Failed to upload flier image");
    } finally {
      setIsUploadingFlier(false);
      if (flierInputRef.current) flierInputRef.current.value = "";
    }
  }

  function handleRemoveBanner() {
    setFormData((prev: EventFormData) => ({ ...prev, bannerImage: "" }));
    saveField("bannerImage", "");
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  }

  function handleRemoveFlier() {
    setFormData((prev: EventFormData) => ({ ...prev, flierImage: "" }));
    saveField("flierImage", "");
    if (flierInputRef.current) flierInputRef.current.value = "";
  }

  const TypeIcon = typeIcons[event.type] ?? Ticket;

  return (
    <div className="space-y-6 @container">
      {/* Header Section */}
      <div className="bg-card border rounded-xl overflow-hidden">
        {/* Hidden file inputs */}
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={handleBannerUpload}
          className="hidden"
        />
        <input
          ref={flierInputRef}
          type="file"
          accept="image/*"
          onChange={handleFlierUpload}
          className="hidden"
        />

        {/* Banner */}
        <div className="relative h-32 sm:h-48 bg-linear-to-r from-primary/20 to-primary/5 group/banner">
          {formData.bannerImage && bannerDisplayUrl ? (
            <>
              <Image
                src={bannerDisplayUrl}
                alt="Banner"
                fill
                className="object-cover"
                unoptimized
              />
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isUploadingBanner}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    {isUploadingBanner ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : (
                      <div className="flex flex-col items-center text-white">
                        <Pencil className="h-6 w-6 mb-1" />
                        <span className="text-sm font-medium">Change Banner</span>
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveBanner}
                    className="absolute top-2 right-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-sm hover:bg-destructive/90 z-10 opacity-0 group-hover/banner:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )}
            </>
          ) : null}
          {!formData.bannerImage && canEdit && (
            <button
              type="button"
              className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => bannerInputRef.current?.click()}
              disabled={isUploadingBanner}
            >
              {isUploadingBanner ? (
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload banner</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Recommended 1920x600px</p>
                </>
              )}
            </button>
          )}
        </div>

        {/* Event Info */}
        <div className="p-6 -mt-12 relative">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            {/* Flier Image */}
            <div className="relative shrink-0">
              <div className="size-24 sm:size-32 overflow-clip p-4 rounded-xl border-4 border-background bg-muted shadow-lg group/flier">
                {formData.flierImage && flierDisplayUrl && (
                  <>
                    <Image
                      src={flierDisplayUrl}
                      alt={event.title}
                      fill
                      className="object-cover rounded-xl"
                      unoptimized
                    />
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => flierInputRef.current?.click()}
                          disabled={isUploadingFlier}
                          className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover/flier:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        >
                          {isUploadingFlier ? (
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                          ) : (
                            <Pencil className="h-5 w-5 text-white" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveFlier}
                          className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90 z-10 opacity-0 group-hover/flier:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </>
                )}
                {!(formData.flierImage && flierDisplayUrl) && canEdit && (
                  <button
                    type="button"
                    className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors rounded-xl"
                    onClick={() => flierInputRef.current?.click()}
                    disabled={isUploadingFlier}
                  >
                    {isUploadingFlier ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <TypeIcon className="size-10 text-muted-foreground" />
                    )}
                  </button>
                )}
                {!(formData.flierImage && flierDisplayUrl) && !canEdit && (
                  <div className="w-full h-full flex items-center justify-center">
                    <TypeIcon className="size-10 text-muted-foreground" />
                  </div>
                )}
              </div>
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
