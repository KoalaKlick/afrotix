
"use client";


import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Loader2,
    Upload,
    Pencil,
    Check,
    X,
    ChevronDown,
    ExternalLink,
    EyeOff,
    Ticket,
    Vote,
    Layers,
    Megaphone,
    Settings,
    UploadCloud
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    updateExistingEvent,
    uploadEventImage,
    changeEventStatus
} from "@/lib/actions/event";
import { getEventImageUrl } from "@/lib/image-url-utils";
import {
    getEventPublicationStatus,
    getEventLifecycleStatus
} from "@/lib/event-status";
import { convertToWebP } from "@/lib/image-utils";
import type { OrganizationRole } from "@/lib/generated/prisma";
import type {
    EventDetailStatsData,
    VoteTrendPoint
} from "@/lib/types/event-stats";
import type {
    CustomField,
    VotingCategory,
    VotingOption,
    VotingOptionStatus,
    FieldValue
} from "@/lib/types/voting";
import {
    VotingManager,
    EventOverviewTab,
    DeleteEventDialog,
    EventSettingsTab,
    VotingBarChart,
    type VotingChartCategory
} from "@/components/event";

// --- Types ---

interface EventData {
    id: string;
    title: string;
    slug: string;
    type: string;
    status: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    timezone: string;
    isVirtual: boolean;
    virtualLink: string | null;
    venueName: string | null;
    venueAddress: string | null;
    venueCity: string | null;
    venueCountry: string;
    coverImage?: string | null;
    bannerImage?: string | null;
    maxAttendees?: number | null;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string | null;
}


type VotingOptionStatus = "pending" | "approved" | "rejected";

interface FieldValue {
    fieldId: string;
    value: string;
}

interface VotingOption {
    id: string;
    optionText: string;
    nomineeCode: string | null;
    email: string | null;
    description: string | null;
    imageUrl: string | null;
    finalImage: string | null;
    status: VotingOptionStatus;
    isPublicNomination: boolean;
    nominatedByName: string | null;
    votesCount: number;
    orderIdx: number;
    fieldValues?: FieldValue[];
}

interface VotingCategory {
    id: string;
    name: string;
    description: string | null;
    maxVotesPerUser: number;
    allowMultiple: boolean;
    templateImage: string | null;
    templateConfig: unknown;
    showFinalImage: boolean;
    allowPublicNomination: boolean;
    nominationDeadline: string | Date | null;
    requireApproval: boolean;
    orderIdx: number;
    votingOptions: VotingOption[];
    customFields?: CustomField[];
}

interface EventDetailClientProps {
    readonly event: EventData;
    readonly organizationSlug?: string;
    readonly userRole: OrganizationRole;
    readonly votingCategories?: VotingCategory[];
    readonly eventStats: EventDetailStatsData;
    readonly voteTrend?: VoteTrendPoint[];
}

const typeIcons: Record<string, typeof Ticket> = {
    ticketed: Ticket,
    voting: Vote,
    hybrid: Layers,
    advertisement: Megaphone,
};

const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    upcoming: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
    ongoing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    ended: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export function EventDetailClient({ event, organizationSlug, userRole, votingCategories = [], eventStats, voteTrend = [] }: EventDetailClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);

    // Editable fields state
    const [editingField, setEditingField] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: event.title,
        slug: event.slug,
        status: event.status,
        description: event.description ?? "",
        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
        timezone: event.timezone,
        isVirtual: event.isVirtual,
        virtualLink: event.virtualLink ?? "",
        venueName: event.venueName ?? "",
        venueAddress: event.venueAddress ?? "",
        venueCity: event.venueCity ?? "",
        venueCountry: event.venueCountry,
        coverImage: event.coverImage ?? "",
        bannerImage: event.bannerImage ?? "",
        maxAttendees: event.maxAttendees?.toString() ?? "",
        isPublic: event.isPublic,
    });
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

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
    const canViewPublicPage = Boolean(publicEventUrl && formData.isPublic && publicationStatus === "published");

    // Generate display URLs from paths
    const coverDisplayUrl = getEventImageUrl(formData.coverImage);
    const bannerDisplayUrl = getEventImageUrl(formData.bannerImage);

    // Save a single field
    async function saveField(fieldName: string, value: unknown) {
        const formDataObj = new FormData();
        formDataObj.set(fieldName, String(value));

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

    // Save multiple fields at once
    async function saveMultipleFields(fields: Record<string, unknown>) {
        const formDataObj = new FormData();
        for (const [key, value] of Object.entries(fields)) {
            if (value !== undefined && value !== null) {
                formDataObj.set(key, String(value));
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

    // Image upload handler
    async function handleImageUpload(file: File, type: "cover" | "banner") {
        setIsUploading(true);

        try {
            const optimizedFile = await convertToWebP(file, {
                quality: 0.85,
                maxWidth: type === "cover" ? 1200 : 1920,
                maxHeight: type === "cover" ? 630 : 400,
                maxSizeMB: 2,
            });

            const uploadFormData = new FormData();
            uploadFormData.set("file", optimizedFile);

            // Pass old image path for deletion
            const oldImagePath = type === "cover" ? formData.coverImage : formData.bannerImage;
            if (oldImagePath) {
                uploadFormData.set("oldImagePath", oldImagePath);
            }

            const result = await uploadEventImage(uploadFormData, type);
            if (result.success) {
                const fieldName = type === "cover" ? "coverImage" : "bannerImage";
                setFormData(prev => ({ ...prev, [fieldName]: result.data.path }));

                // Save to database directly
                const saveFormData = new FormData();
                saveFormData.set(fieldName, result.data.path);
                const saveResult = await updateExistingEvent(event.id, saveFormData);

                if (saveResult.success) {
                    toast.success(`${type === "cover" ? "Cover" : "Banner"} image updated`);
                } else {
                    toast.error(saveResult.error);
                }
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "banner") {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file, type);
        }
        // Reset input so same file can be selected again
        e.target.value = "";
    }

    // Status change handler
    async function handleStatusChange(newStatus: string) {
        if (newStatus === formData.status) return;

        startTransition(async () => {
            const result = await changeEventStatus(event.id, newStatus);
            if (result.success) {
                setFormData(prev => ({ ...prev, status: newStatus }));
                toast.success(`Status changed to ${newStatus}`);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        });
    }

    const TypeIcon = typeIcons[event.type] ?? Ticket;

    return (
        <div className="space-y-6">
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
                    {canEdit && (
                        <>
                            <input
                                ref={bannerInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={(e) => handleFileChange(e, "banner")}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => bannerInputRef.current?.click()}
                                disabled={isUploading || isPending}
                                className="absolute bottom-3 right-3 z-10 px-3 py-1.5 rounded-lg bg-black/50 text-white text-sm hover:bg-black/70 transition-colors flex items-center gap-2"
                            >
                                {isUploading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Upload className="size-4" />
                                )}
                                Change Banner
                            </button>
                        </>
                    )}
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
                            {canEdit && (
                                <>
                                    <input
                                        ref={coverInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        onChange={(e) => handleFileChange(e, "cover")}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => coverInputRef.current?.click()}
                                        disabled={isUploading || isPending}
                                        className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <Pencil className="size-4" />
                                        )}
                                    </button>
                                </>
                            )}
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
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
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
                                            setFormData(prev => ({ ...prev, title: event.title }));
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
                                        canEdit && "cursor-pointer hover:text-primary/80"
                                    )}
                                    onClick={() => canEdit && setEditingField("title")}
                                >
                                    {formData.title}
                                    {canEdit && <Pencil className="inline-block size-4 ml-2 text-muted-foreground" />}
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
                                            className={publicationStatus === "draft" ? "bg-accent" : ""}
                                        >
                                            Draft
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => handleStatusChange("published")}
                                            className={publicationStatus === "published" ? "bg-accent" : ""}
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

                            {canDelete && (
                                <DeleteEventDialog eventId={event.id} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList variant="afro" className={cn(
                    "grid w-full",
                    (event.type === "voting" || event.type === "hybrid") ? "grid-cols-3" : "grid-cols-2"
                )}>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    {(event.type === "voting" || event.type === "hybrid") && (
                        <TabsTrigger value="voting">Voting</TabsTrigger>
                    )}
                    <TabsTrigger value="settings" className="gap-1.5">
                        <Settings className="size-4" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <EventOverviewTab
                        eventStats={eventStats}
                        eventType={event.type}
                        voteTrend={voteTrend}
                        votingCategories={votingCategories.map((cat): VotingChartCategory => ({
                            id: cat.id,
                            name: cat.name,
                            votingOptions: cat.votingOptions.map(opt => ({
                                id: opt.id,
                                optionText: opt.optionText,
                                votesCount: opt.votesCount,
                                imageUrl: opt.imageUrl,
                                finalImage: opt.finalImage,
                            })),
                        }))}
                    />
                </TabsContent>

                {/* Voting Tab */}
                {(event.type === "voting" || event.type === "hybrid") && (
                    <TabsContent value="voting" className="space-y-4">
                        <div className="">
                            <VotingManager
                                eventId={event.id}
                                categories={votingCategories.map(cat => ({
                                    ...cat,
                                    votingOptions: cat.votingOptions.map(opt => ({
                                        ...opt,
                                        votesCount: BigInt(opt.votesCount),
                                    })),
                                }))}
                                canEdit={canEdit}
                            />
                        </div>
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
        </div>
    );
}


