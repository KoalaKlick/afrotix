/**
 * Event Detail Client Component
 * View and edit event details
 */

"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Calendar,
    Clock,
    MapPin,
    Video,
    Users,
    Eye,
    EyeOff,
    Pencil,
    Check,
    X,
    Trash2,
    Upload,
    Loader2,
    ExternalLink,
    Ticket,
    Vote,
    Layers,
    Megaphone,
    ChevronDown,
} from "lucide-react";
import {
    updateExistingEvent,
    deleteExistingEvent,
    uploadEventImage,
    changeEventStatus,
} from "@/lib/actions/event";
import { convertToWebP } from "@/lib/image-utils";
import { getEventLifecycleStatus, getEventPublicationStatus } from "@/lib/event-status";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { VotingManager } from "@/components/event";
import type { OrganizationRole } from "@/lib/generated/prisma";
import type { CustomField } from "@/lib/types/voting";

interface EventData {
    id: string;
    title: string;
    slug: string;
    type: string;
    status: string;
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    timezone: string;
    isVirtual: boolean;
    virtualLink?: string | null;
    venueName?: string | null;
    venueAddress?: string | null;
    venueCity?: string | null;
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

export function EventDetailClient({ event, organizationSlug, userRole, votingCategories = [] }: EventDetailClientProps) {
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

    const coverInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

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
    const isPrivate = !formData.isPublic;

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

    async function handleDelete() {
        startTransition(async () => {
            const result = await deleteExistingEvent(event.id);
            if (result.success) {
                toast.success("Event deleted");
                router.push("/my-events");
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
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="size-4 mr-2" />
                                            Delete
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the event
                                                and all associated data.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDelete}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Delete Event
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className={cn(
                    "grid w-full",
                    (event.type === "voting" || event.type === "hybrid") ? "grid-cols-5" : "grid-cols-4"
                )}>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    {(event.type === "voting" || event.type === "hybrid") && (
                        <TabsTrigger value="voting">Voting</TabsTrigger>
                    )}
                    <TabsTrigger value="datetime">Date & Time</TabsTrigger>
                    <TabsTrigger value="location">Location</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Description</h3>
                            {canEdit && editingField !== "description" && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingField("description")}
                                >
                                    <Pencil className="size-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                        </div>

                        {editingField === "description" ? (
                            <div className="space-y-4">
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe your event..."
                                    rows={6}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, description: event.description ?? "" }));
                                            setEditingField(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => saveField("description", formData.description)}
                                        disabled={isPending}
                                    >
                                        {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground whitespace-pre-wrap">
                                {formData.description || "No description provided."}
                            </p>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-card border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <Calendar className="size-4" />
                                Created
                            </div>
                            <p className="font-medium">
                                {new Date(event.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="bg-card border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <Clock className="size-4" />
                                Updated
                            </div>
                            <p className="font-medium">
                                {new Date(event.updatedAt).toLocaleDateString()}
                            </p>
                        </div>
                        {event.publishedAt && (
                            <div className="bg-card border rounded-xl p-4">
                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                    <Check className="size-4" />
                                    Published
                                </div>
                                <p className="font-medium">
                                    {new Date(event.publishedAt).toLocaleDateString()}
                                </p>
                            </div>
                        )}
                        <div className="bg-card border rounded-xl p-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                <Users className="size-4" />
                                Capacity
                            </div>
                            <p className="font-medium">
                                {formData.maxAttendees || "Unlimited"}
                            </p>
                        </div>
                    </div>
                </TabsContent>

                {/* Voting Tab - Only for voting/hybrid events */}
                {(event.type === "voting" || event.type === "hybrid") && (
                    <TabsContent value="voting" className="space-y-4">
                        <div className="bg-card border rounded-xl p-6">
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

                {/* Date & Time Tab */}
                <TabsContent value="datetime" className="space-y-4">
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Event Schedule</h3>
                            {canEdit && editingField !== "datetime" && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingField("datetime")}
                                >
                                    <Pencil className="size-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                        </div>

                        {editingField === "datetime" ? (
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Start Date & Time</Label>
                                        <Input
                                            type="datetime-local"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date & Time</Label>
                                        <Input
                                            type="datetime-local"
                                            value={formData.endDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Timezone</Label>
                                    <Input
                                        value={formData.timezone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                                        placeholder="Africa/Lagos"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
                                                endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
                                                timezone: event.timezone,
                                            }));
                                            setEditingField(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => saveMultipleFields({
                                            startDate: formData.startDate || undefined,
                                            endDate: formData.endDate || undefined,
                                            timezone: formData.timezone,
                                        })}
                                        disabled={isPending}
                                    >
                                        {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Starts</p>
                                    <p className="font-medium">
                                        {formData.startDate
                                            ? new Date(formData.startDate).toLocaleString()
                                            : "Not set"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Ends</p>
                                    <p className="font-medium">
                                        {formData.endDate
                                            ? new Date(formData.endDate).toLocaleString()
                                            : "Not set"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Timezone</p>
                                    <p className="font-medium">{formData.timezone}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Location Tab */}
                <TabsContent value="location" className="space-y-4">
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Event Location</h3>
                            {canEdit && editingField !== "location" && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingField("location")}
                                >
                                    <Pencil className="size-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                        </div>

                        {editingField === "location" ? (
                            <div className="space-y-4">
                                {/* Virtual Toggle */}
                                <div className="flex items-center gap-4">
                                    <Label>Event Type</Label>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={formData.isVirtual ? "outline" : "default"}
                                            onClick={() => setFormData(prev => ({ ...prev, isVirtual: false }))}
                                        >
                                            <MapPin className="size-4 mr-2" />
                                            Physical
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={formData.isVirtual ? "default" : "outline"}
                                            onClick={() => setFormData(prev => ({ ...prev, isVirtual: true }))}
                                        >
                                            <Video className="size-4 mr-2" />
                                            Virtual
                                        </Button>
                                    </div>
                                </div>

                                {formData.isVirtual ? (
                                    <div className="space-y-2">
                                        <Label>Virtual Link</Label>
                                        <Input
                                            type="url"
                                            value={formData.virtualLink}
                                            onChange={(e) => setFormData(prev => ({ ...prev, virtualLink: e.target.value }))}
                                            placeholder="https://zoom.us/j/..."
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Venue Name</Label>
                                            <Input
                                                value={formData.venueName}
                                                onChange={(e) => setFormData(prev => ({ ...prev, venueName: e.target.value }))}
                                                placeholder="e.g., Eko Convention Center"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Address</Label>
                                            <Input
                                                value={formData.venueAddress}
                                                onChange={(e) => setFormData(prev => ({ ...prev, venueAddress: e.target.value }))}
                                                placeholder="123 Main Street"
                                            />
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>City</Label>
                                                <Input
                                                    value={formData.venueCity}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, venueCity: e.target.value }))}
                                                    placeholder="Lagos"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Country</Label>
                                                <Input
                                                    value={formData.venueCountry}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, venueCountry: e.target.value }))}
                                                    placeholder="Nigeria"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                isVirtual: event.isVirtual,
                                                virtualLink: event.virtualLink ?? "",
                                                venueName: event.venueName ?? "",
                                                venueAddress: event.venueAddress ?? "",
                                                venueCity: event.venueCity ?? "",
                                                venueCountry: event.venueCountry,
                                            }));
                                            setEditingField(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => saveMultipleFields({
                                            isVirtual: formData.isVirtual,
                                            virtualLink: formData.virtualLink || undefined,
                                            venueName: formData.venueName || undefined,
                                            venueAddress: formData.venueAddress || undefined,
                                            venueCity: formData.venueCity || undefined,
                                            venueCountry: formData.venueCountry,
                                        })}
                                        disabled={isPending}
                                    >
                                        {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {formData.isVirtual ? (
                                    <div className="flex items-start gap-3">
                                        <Video className="size-5 text-primary mt-0.5" />
                                        <div>
                                            <p className="font-medium">Virtual Event</p>
                                            {formData.virtualLink ? (
                                                <a
                                                    href={formData.virtualLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    {formData.virtualLink}
                                                </a>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No link provided</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="size-5 text-primary mt-0.5" />
                                        <div>
                                            {formData.venueName ? (
                                                <>
                                                    <p className="font-medium">{formData.venueName}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {[formData.venueAddress, formData.venueCity, formData.venueCountry]
                                                            .filter(Boolean)
                                                            .join(", ") || "Address not provided"}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-muted-foreground">Location not set</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                    <div className="bg-card border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">Event Settings</h3>
                            {canEdit && editingField !== "settings" && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingField("settings")}
                                >
                                    <Pencil className="size-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                        </div>

                        {editingField === "settings" ? (
                            <div className="space-y-6">
                                {/* Visibility */}
                                <div className="space-y-3">
                                    <Label>Event Visibility</Label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                                            className={cn(
                                                "flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                                formData.isPublic
                                                    ? "border-primary bg-primary/5"
                                                    : "border-muted hover:border-muted-foreground/30"
                                            )}
                                        >
                                            <Eye className={cn("size-5", formData.isPublic ? "text-primary" : "text-muted-foreground")} />
                                            <div className="text-left">
                                                <p className="font-medium">Public</p>
                                                <p className="text-xs text-muted-foreground">Anyone can discover this event</p>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                                            className={cn(
                                                "flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                                isPrivate
                                                    ? "border-primary bg-primary/5"
                                                    : "border-muted hover:border-muted-foreground/30"
                                            )}
                                        >
                                            <EyeOff className={cn("size-5", isPrivate ? "text-primary" : "text-muted-foreground")} />
                                            <div className="text-left">
                                                <p className="font-medium">Private</p>
                                                <p className="text-xs text-muted-foreground">Only organization members can view this event</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Max Attendees */}
                                <div className="space-y-2">
                                    <Label>Maximum Attendees</Label>
                                    <Input
                                        type="number"
                                        value={formData.maxAttendees}
                                        onChange={(e) => setFormData(prev => ({ ...prev, maxAttendees: e.target.value }))}
                                        placeholder="Leave empty for unlimited"
                                        min={1}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave empty for unlimited capacity
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                isPublic: event.isPublic,
                                                maxAttendees: event.maxAttendees?.toString() ?? "",
                                            }));
                                            setEditingField(null);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => saveMultipleFields({
                                            isPublic: formData.isPublic,
                                            maxAttendees: formData.maxAttendees || undefined,
                                        })}
                                        disabled={isPending}
                                    >
                                        {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                                        Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    {formData.isPublic ? (
                                        <Eye className="size-5 text-green-600" />
                                    ) : (
                                        <EyeOff className="size-5 text-yellow-600" />
                                    )}
                                    <div>
                                        <p className="font-medium">
                                            {formData.isPublic ? "Public Event" : "Private Event"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {formData.isPublic
                                                ? "This event is visible to everyone"
                                                : "This event is only visible to organization members"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Users className="size-5 text-primary" />
                                    <div>
                                        <p className="font-medium">
                                            {formData.maxAttendees || "Unlimited"} Capacity
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Maximum number of attendees
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
