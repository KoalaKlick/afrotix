"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Eye,
    EyeOff,
    Loader2,
    Lock,
    MapPin,
    Pencil,
    Users,
    Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isVotingEventType } from "@/lib/validations/event";

interface EventFormData {
    title: string;
    slug: string;
    status: string;
    description: string;
    startDate: string;
    endDate: string;
    timezone: string;
    isVirtual: boolean;
    virtualLink: string;
    venueName: string;
    venueAddress: string;
    venueCity: string;
    venueCountry: string;
    coverImage: string;
    bannerImage: string;
    isPublic: boolean;
    maxAttendees: string;
}

interface EventOriginalData {
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
    isPublic: boolean;
    maxAttendees?: number | null;
    type?: string;
}

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
    const isVotingEvent = isVotingEventType(event.type ?? "");

    return (
        <div className="space-y-6">
            {/* Description */}
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

            {/* Date & Time */}
            <div className="bg-card border rounded-xl p-6">
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
            </div>

            {/* Location */}
            <div className="bg-card border rounded-xl p-6">
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

            {/* Visibility & Capacity */}
            <div className="bg-card border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Visibility & Capacity</h3>
                    {canEdit && editingField !== "settings" && !isVotingEvent && (
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

                {/* Voting events: locked mode display */}
                {isVotingEvent && (
                    <div className="space-y-4 mb-4">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/80 border border-blue-100">
                            <Lock className="size-5 text-blue-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium text-blue-900">
                                    {formData.isPublic ? "Public Voting" : "Internal Voting"}
                                </p>
                                <p className="text-xs text-blue-700 mt-0.5">
                                    {formData.isPublic
                                        ? "Anyone can vote · Paid voting only (min GHS 0.10) · Vote counts shown publicly"
                                        : "Organization members only · Can be free · Only participation status shown"}
                                </p>
                                <p className="text-[10px] text-blue-500 mt-1.5 font-medium">
                                    Voting mode cannot be changed after event creation
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {editingField === "settings" && !isVotingEvent ? (
                    <div className="space-y-6">
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
                ) : editingField !== "settings" && (
                    <div className="space-y-4">
                        {!isVotingEvent && (
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
                        )}
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
        </div>
    );
}

