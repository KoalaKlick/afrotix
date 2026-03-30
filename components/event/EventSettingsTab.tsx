"use client";
import { Image as SharedImage } from "@/components/shared/image/avatar";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Eye,
    EyeOff,
    Loader2,
    MapPin,
    Pencil,
    Users,
    Video,
    Plus,
    Trash2,
    Share2,
    Image as ImageIcon,
    Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useImageUpload } from "@/lib/hooks/use-image-upload";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { MAX_SPONSORS, MAX_GALLERY_LINKS } from "@/lib/const/event";
import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";
import Link from "next/link";
import { Card } from "../ui/card";
import type {
    EventFormData,
    EventOriginalData,
    EventSponsor
} from "@/lib/types/event";



interface EventSettingsTabProps {
    readonly formData: EventFormData;
    readonly setFormData: React.Dispatch<React.SetStateAction<EventFormData>>;
    readonly event: EventOriginalData;
    readonly editingField: string | null;
    readonly setEditingField: (field: string | null) => void;
    readonly canEdit: boolean;
    readonly isPending: boolean;
    readonly saveField: (fieldName: string, value: unknown) => void;
    readonly saveMultipleFields: (fields: Record<string, unknown>) => void;
}


export function EventSettingsTab({
    formData,
    setFormData,
    event,
    editingField,
    setEditingField,
    canEdit,
    isPending,
    saveField,
    saveMultipleFields,
}: EventSettingsTabProps) {
    const isPrivate = !formData.isPublic;


    // Modal States
    const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
    const [selectedSponsor, setSelectedSponsor] = useState<EventSponsor | null>(null);

    const [socialModalOpen, setSocialModalOpen] = useState(false);
    const [selectedSocial, setSelectedSocial] = useState<NonNullable<EventFormData["socialLinks"]>[number] | null>(null);

    const [galleryModalOpen, setGalleryModalOpen] = useState(false);
    const [selectedGallery, setSelectedGallery] = useState<NonNullable<EventFormData["galleryLinks"]>[number] | null>(null);

    return (
            <div className="space-y-6">
                {/* Description */}
                <Card className="rounded-md p-6">
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
                </Card>
                {/* Date & Time */}
                <Card className="rounded-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Date & Time</h3>
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
                                    placeholder="Africa/Accra"
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
                        <div className="grid gap-4 sm:grid-cols-3">
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
                </Card>
            {/* Location */}
            <Card className="rounded-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Location</h3>
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
                                            placeholder="Accra"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Country</Label>
                                        <Input
                                            value={formData.venueCountry}
                                            onChange={(e) => setFormData(prev => ({ ...prev, venueCountry: e.target.value }))}
                                            placeholder="Ghana"
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
            </Card>

            {/* Visibility & Capacity */}
            <Card className="rounded-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Visibility & Capacity</h3>
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
                        <div className="space-y-3">
                            <Label>Event Visibility</Label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                                    className={cn(
                                        "flex-1 flex items-center gap-3 p-4 rounded-md border-2 transition-all",
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
                                        "flex-1 flex items-center gap-3 p-4 rounded-md border-2 transition-all",
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

                        <div className="space-y-2">
                            <Label>Maximum Attendees</Label>
                            <Input
                                type="number"
                                value={formData.maxAttendees ?? ""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData(prev => ({
                                        ...prev,
                                        maxAttendees: val === "" ? null : Number(val)
                                    }));
                                }}
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
                                        maxAttendees: event.maxAttendees ?? null,
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
                ) : editingField !== "settings" && (
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
            </Card>

            {/* Sponsors Section */}
            <Card className="rounded-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Plus className="size-4 text-primary" />
                            Sponsors
                        </h3>
                        <p className="text-xs text-muted-foreground">Showcase organizations supporting your event</p>
                    </div>
                    {canEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSelectedSponsor(null);
                                setSponsorModalOpen(true);
                            }}
                            disabled={isPending || (formData.sponsors?.length ?? 0) >= MAX_SPONSORS}
                        >
                            <Plus className="size-4 mr-2" />
                            Add Sponsor
                        </Button>
                    )}
                </div>

                <div className="flex gap-4 flex-wrap">
                    {(formData.sponsors ?? []).map((sponsor) => (
                        <div key={sponsor.id} className="group w-fit relative p-4 rounded-md border bg-card hover:border-primary/50 transition-all flex flex-col items-center gap-4 text-center">
                            <div className="size-16 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                                {sponsor.logo ? (
                                    <SharedImage
                                        src={getEventImageUrl(sponsor.logo) ?? ""}
                                        alt={sponsor.name}
                                        width={64}
                                        height={64}
                                        className="object-contain p-2"
                                    />
                                ) : (
                                    <ImageIcon className="size-6 text-muted-foreground opacity-20" />
                                )}
                            </div>
                            <h4 className="text-sm font-bold truncate w-full">{sponsor.name}</h4>

                            {canEdit && (
                                <div className="flex gap-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-7 rounded-md bg-background/80 backdrop-blur-sm"
                                        onClick={() => {
                                            setSelectedSponsor(() => sponsor);
                                            setSponsorModalOpen(true);
                                        }}
                                    >
                                        <Pencil className="size-3" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-7 rounded-md bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
                                        onClick={() => {
                                            const newSponsors = (formData.sponsors ?? []).filter(s => s.id !== sponsor.id);
                                            setFormData(prev => ({ ...prev, sponsors: newSponsors }));
                                            saveField("sponsors", newSponsors);
                                        }}
                                    >
                                        <Trash2 className="size-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                    {(formData.sponsors?.length ?? 0) === 0 && (
                        <div className="col-span-full py-8 border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground gap-2 bg-muted/20">
                            <ImageIcon className="size-8 opacity-20" />
                            <p className="text-sm">No sponsors added yet</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Social Links Section */}
            <Card className="rounded-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Share2 className="size-4 text-primary" />
                            Organization Socials
                        </h3>
                        <p className="text-xs text-muted-foreground">Keep your attendees connected</p>
                    </div>
                    {canEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedSocial(null); setSocialModalOpen(true); }}
                            disabled={isPending}
                        >
                            <Plus className="size-4 mr-2" />
                            Add Link
                        </Button>
                    )}
                </div>

                <div className="flex flex-wrap gap-3">
                    {(formData.socialLinks ?? []).map((link) => {
                        const platform = getSocialPlatform(link.url, "size-4");
                        return (
                            <Link
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                key={link.id}
                                className="flex items-center gap-3 p-3 border rounded-md bg-muted/50 max-w-70"
                            >
                                <div className="size-9 rounded-md bg-background border flex items-center justify-center shrink-0">
                                    {platform.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        {platform.name}
                                    </p>
                                    <p className="text-xs italic truncate max-w-35">{link.url}</p>
                                </div>
                                {canEdit && (
                                    <div className="flex gap-1 ml-auto">
                                        <Button
                                            variant="ghost" size="icon" className="size-7"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setSelectedSocial(link);
                                                setSocialModalOpen(true);
                                            }}
                                        >
                                            <Pencil className="size-3" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const newLinks = (formData.socialLinks ?? []).filter(l => l.id !== link.id);
                                                setFormData(prev => ({ ...prev, socialLinks: newLinks }));
                                                saveField("socialLinks", newLinks);
                                            }}
                                        >
                                            <Trash2 className="size-3" />
                                        </Button>
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                    {(formData.socialLinks?.length ?? 0) === 0 && (
                        <div className="w-full py-4 text-center text-sm text-muted-foreground italic bg-muted/20 rounded-lg border border-dashed">
                            No social links added yet
                        </div>
                    )}
                </div>
            </Card>

            {/* Photo Gallery Section */}
            <Card className="rounded-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                        <h3 className="font-semibold flex items-center gap-2">
                            <ImageIcon className="size-4 text-primary" />
                            Photo Gallery Links
                        </h3>
                        <p className="text-xs text-muted-foreground">Share links to event photos (Google Drive, Pixieset, etc.)</p>
                    </div>
                    {canEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedGallery(null); setGalleryModalOpen(true); }}
                            disabled={isPending || (formData.galleryLinks?.length ?? 0) >= MAX_GALLERY_LINKS}
                        >
                            <Plus className="size-4 mr-2" />
                            Add Gallery
                        </Button>
                    )}
                </div>

                <div className="flex flex-wrap gap-3">
                    {(formData.galleryLinks ?? []).map((link) => {
                        const provider = getGalleryProvider(link.url, "size-4");
                        return (
                            <Link
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                key={link.id}
                                className="flex items-center gap-3 p-3 border rounded-md bg-muted/50 max-w-70"
                            >
                                <div className="size-9 rounded-md bg-background border flex items-center justify-center shrink-0">
                                    {provider.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        {link.name}
                                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase">
                                            {provider.name}
                                        </span>
                                    </p>
                                    <p className="text-xs italic truncate max-w-35">{link.url}</p>
                                </div>
                                {canEdit && (
                                    <div className="flex gap-1 ml-auto">
                                        <Button
                                            variant="ghost" size="icon" className="size-7"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setSelectedGallery(link);
                                                setGalleryModalOpen(true);
                                            }}
                                        >
                                            <Pencil className="size-3" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const newLinks = (formData.galleryLinks ?? []).filter(l => l.id !== link.id);
                                                setFormData(prev => ({ ...prev, galleryLinks: newLinks }));
                                                saveField("galleryLinks", newLinks);
                                            }}
                                        >
                                            <Trash2 className="size-3" />
                                        </Button>
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                    {(formData.galleryLinks?.length ?? 0) === 0 && (
                        <div className="w-full py-4 text-center text-sm text-muted-foreground italic bg-muted/20 rounded-lg border border-dashed">
                            No gallery links added yet
                        </div>
                    )}
                </div>
            </Card>

            {/* --- Modals --- */}

            <SponsorDialog
                open={sponsorModalOpen}
                onOpenChange={setSponsorModalOpen}
                sponsor={selectedSponsor ? { id: String(selectedSponsor.id ?? ''), name: selectedSponsor.name, logo: selectedSponsor.logo } : null}
                onSave={(sponsorData) => {
                    let newSponsors: NonNullable<EventFormData["sponsors"]> = [];
                    if (selectedSponsor) {
                        newSponsors = (formData.sponsors ?? []).map(s => s.id === selectedSponsor.id ? { ...sponsorData, id: s.id } : s);
                    } else {
                        newSponsors = [...(formData.sponsors ?? []), { ...sponsorData, id: `new-${Date.now()}` }];
                    }
                    setFormData(prev => ({ ...prev, sponsors: newSponsors }));
                    saveField("sponsors", newSponsors);
                    setSponsorModalOpen(false);
                }}
                isPending={isPending}
            />

            <SocialLinkDialog
                open={socialModalOpen}
                onOpenChange={setSocialModalOpen}
                link={selectedSocial ? { id: String(selectedSocial.id ?? ''), url: selectedSocial.url } : null}
                onSave={(url) => {
                    let newLinks: NonNullable<EventFormData["socialLinks"]> = [];
                    if (selectedSocial) {
                        newLinks = (formData.socialLinks ?? []).map(l => l.id === selectedSocial?.id ? { id: l.id, url } : l);
                    } else {
                        newLinks = [...(formData.socialLinks ?? []), { id: `new-${Date.now()}`, url }];
                    }
                    setFormData(prev => ({ ...prev, socialLinks: newLinks }));
                    saveField("socialLinks", newLinks);
                    setSocialModalOpen(false);
                }}
                isPending={isPending}
            />

            <GalleryLinkDialog
                open={galleryModalOpen}
                onOpenChange={setGalleryModalOpen}
                link={selectedGallery ? { id: String(selectedGallery.id ?? ''), name: selectedGallery.name, url: selectedGallery.url } : null}
                onSave={(galleryData) => {
                    let newLinks: NonNullable<EventFormData["galleryLinks"]> = [];
                    if (selectedGallery) {
                        newLinks = (formData.galleryLinks ?? []).map(l => l.id === selectedGallery?.id ? { ...galleryData, id: l.id } : l);
                    } else {
                        newLinks = [...(formData.galleryLinks ?? []), { ...galleryData, id: `new-${Date.now()}` }];
                    }
                    setFormData(prev => ({ ...prev, galleryLinks: newLinks }));
                    saveField("galleryLinks", newLinks);
                    setGalleryModalOpen(false);
                }}
                isPending={isPending}
            />
        </div>
    );
}

// --- Dialog Components ---

function SponsorDialog({
    open,
    onOpenChange,
    sponsor,
    onSave,
    isPending
}: Readonly<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sponsor: { id: string; name: string; logo: string | null } | null;
    onSave: (data: { name: string; logo: string | null }) => void;
    isPending: boolean;
}>) {
    const [name, setName] = useState(sponsor?.name ?? "");
    const [logo, setLogo] = useState(sponsor?.logo ?? null);

    // Sync with props when opening for edit
    useEffect(() => {
        if (open) {
            setName(sponsor?.name ?? "");
            setLogo(sponsor?.logo ?? null);
        }
    }, [open, sponsor]);

    const { isUploading, upload } = useImageUpload({
        bucket: "events",
        folder: "sponsors",
        convertOptions: { quality: 0.8, maxWidth: 400, maxHeight: 400, maxSizeMB: 1 },
    });

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const path = await upload(file);
            if (path) setLogo(path);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{sponsor ? "Edit Sponsor" : "Add Sponsor"}</DialogTitle>
                    <DialogDescription>
                        Display the organization supporting your event.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative size-24 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                            {logo ? (
                                <SharedImage
                                    src={getEventImageUrl(logo) ?? ""}
                                    alt="Preview"
                                    width={96}
                                    height={96}
                                    className="size-full object-contain p-2"
                                />
                            ) : (
                                <ImageIcon className="size-8 text-muted-foreground opacity-20" />
                            )}
                            <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                {isUploading ? (
                                    <Loader2 className="size-6 text-white animate-spin" />
                                ) : (
                                    <Upload className="size-6 text-white" />
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading || isPending} />
                            </label>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Logo (Click to upload)</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Sponsor Name</Label>
                        <Input
                            placeholder="e.g., Google"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={() => onSave({ name, logo })}
                        disabled={!name || isPending}
                    >
                        {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                        Save Sponsor
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Shared validation helper for URLs
function validateSocial(val: string) {
    if (/\s/.test(val)) return "URLs cannot contain spaces";
    if (val.includes("...")) return "URLs cannot contain ellipses (...)";
    return null;
}

function SocialLinkDialog({
    open,
    onOpenChange,
    link,
    onSave,
    isPending
}: Readonly<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    link: { id: string; url: string } | null;
    onSave: (url: string) => void;
    isPending: boolean;
}>) {
    const [url, setUrl] = useState(link?.url ?? "");
    const [error, setError] = useState<string | null>(null);



    const handleUrlChange = (val: string) => {
        setUrl(val);
        setError(validateSocial(val));
    };

    // Sync with props
    useEffect(() => {
        if (open) {
            setUrl(link?.url ?? "");
            setError(null);
        }
    }, [open, link]);

    const platform = getSocialPlatform(url, "size-4");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{link ? "Edit Social Link" : "Add Social Link"}</DialogTitle>
                    <DialogDescription>
                        Add a link to your organization's social media.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label>Social URL</Label>
                        <div className="relative">
                            <Input
                                placeholder="https://t.me/organization"
                                value={url}
                                onChange={(e) => handleUrlChange(e.target.value)}
                                className={cn("pl-10", error && "border-destructive focus-visible:ring-destructive")}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                {platform.icon}
                            </div>
                        </div>
                        {error && (
                            <p className="text-[10px] font-bold uppercase text-destructive tracking-widest">{error}</p>
                        )}
                    </div>

                    {url && (
                        <div className="p-4 rounded-md bg-muted/50 border flex items-center gap-3">
                            <div className="size-10 rounded-md bg-background flex items-center justify-center border shadow-sm">
                                {platform.icon}
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-muted-foreground">{platform.name} detected</p>
                                <p className="text-sm truncate max-w-50">{url}</p>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={() => onSave(url)}
                        disabled={!url || !!error || isPending}
                    >
                        {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                        Save Link
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function GalleryLinkDialog({
    open,
    onOpenChange,
    link,
    onSave,
    isPending
}: Readonly<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    link: { id: string; name: string; url: string } | null;
    onSave: (data: { name: string; url: string }) => void;
    isPending: boolean;
}>) {
    const [name, setName] = useState(link?.name ?? "");
    const [url, setUrl] = useState(link?.url ?? "");
    const [error, setError] = useState<string | null>(null);

    // Validation helper (reuse validateSocial logic)
    const validateGallery = validateSocial;

    const handleUrlChange = (val: string) => {
        setUrl(val);
        setError(validateGallery(val));
    };

    // Sync with props
    useEffect(() => {
        if (open) {
            setName(link?.name ?? "");
            setUrl(link?.url ?? "");
            setError(null);
        }
    }, [open, link]);

    const provider = getGalleryProvider(url, "size-4");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{link ? "Edit Gallery" : "Add Gallery"}</DialogTitle>
                    <DialogDescription>
                        Link to photo albums from Google Drive, Pixieset, etc.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Display Label</Label>
                        <Input
                            placeholder="e.g., Official Photos"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Gallery URL</Label>
                        <div className="relative">
                            <Input
                                placeholder="https://drive.google.com/..."
                                value={url}
                                onChange={(e) => handleUrlChange(e.target.value)}
                                className={cn("pl-10", error && "border-destructive focus-visible:ring-destructive")}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                {provider.icon}
                            </div>
                        </div>
                        {error && (
                            <p className="text-[10px] font-bold uppercase text-destructive tracking-widest">{error}</p>
                        )}
                    </div>

                    {url && (
                        <div className="p-4 rounded-md bg-muted/50 border flex items-center gap-3">
                            <div className="size-10 rounded-lg bg-background flex items-center justify-center border shadow-sm">
                                {provider.icon}
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-muted-foreground">{provider.name} detected</p>
                                <p className="text-sm truncate max-w-50">{url}</p>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={() => onSave({ name, url })}
                        disabled={!name || !url || !!error || isPending}
                    >
                        {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                        Save Gallery
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
