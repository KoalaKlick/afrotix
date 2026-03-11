/**
 * Event Step 2: Date & Location
 * Start/end dates, venue, and virtual settings
 */

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2, MapPin, Video, Globe } from "lucide-react";
import { validateEventStep2 } from "@/lib/actions/event";
import { cn } from "@/lib/utils";

interface EventStep2Props {
    readonly initialData?: {
        startDate?: string;
        endDate?: string;
        timezone?: string;
        isVirtual?: boolean;
        virtualLink?: string;
        venueName?: string;
        venueAddress?: string;
        venueCity?: string;
        venueCountry?: string;
    };
    readonly onSuccess: (data: {
        startDate?: string;
        endDate?: string;
        timezone: string;
        isVirtual: boolean;
        virtualLink?: string;
        venueName?: string;
        venueAddress?: string;
        venueCity?: string;
        venueCountry?: string;
    }) => void;
    readonly onBack: () => void;
    readonly onSkip: () => void;
}

// Common African timezones
const TIMEZONES = [
    { value: "Africa/Lagos", label: "West Africa Time (WAT)" },
    { value: "Africa/Nairobi", label: "East Africa Time (EAT)" },
    { value: "Africa/Johannesburg", label: "South Africa Time (SAST)" },
    { value: "Africa/Cairo", label: "Egypt Time (EET)" },
    { value: "Europe/London", label: "UK Time (GMT/BST)" },
    { value: "America/New_York", label: "US Eastern (EST/EDT)" },
];

export function EventStep2DateLocation({ initialData, onSuccess, onBack, onSkip }: EventStep2Props) {
    const [isPending, startTransition] = useTransition();
    const [isVirtual, setIsVirtual] = useState(initialData?.isVirtual ?? false);
    const [startDate, setStartDate] = useState(initialData?.startDate ?? "");
    const [endDate, setEndDate] = useState(initialData?.endDate ?? "");
    const [timezone, setTimezone] = useState(initialData?.timezone ?? "Africa/Lagos");
    const [virtualLink, setVirtualLink] = useState(initialData?.virtualLink ?? "");
    const [venueName, setVenueName] = useState(initialData?.venueName ?? "");
    const [venueAddress, setVenueAddress] = useState(initialData?.venueAddress ?? "");
    const [venueCity, setVenueCity] = useState(initialData?.venueCity ?? "");
    const [venueCountry, setVenueCountry] = useState(initialData?.venueCountry ?? "Nigeria");
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErrors({});

        const formData = new FormData();
        if (startDate) formData.set("startDate", new Date(startDate).toISOString());
        if (endDate) formData.set("endDate", new Date(endDate).toISOString());
        formData.set("timezone", timezone);
        formData.set("isVirtual", String(isVirtual));
        if (virtualLink) formData.set("virtualLink", virtualLink);
        if (venueName) formData.set("venueName", venueName);
        if (venueAddress) formData.set("venueAddress", venueAddress);
        if (venueCity) formData.set("venueCity", venueCity);
        formData.set("venueCountry", venueCountry);

        startTransition(async () => {
            const result = await validateEventStep2(formData);
            if (result.success) {
                onSuccess({
                    startDate: startDate ? new Date(startDate).toISOString() : undefined,
                    endDate: endDate ? new Date(endDate).toISOString() : undefined,
                    timezone: result.data.timezone,
                    isVirtual: result.data.isVirtual,
                    virtualLink: result.data.virtualLink,
                    venueName: result.data.venueName,
                    venueAddress: result.data.venueAddress,
                    venueCity: result.data.venueCity,
                    venueCountry: result.data.venueCountry,
                });
            } else {
                setErrors(result.fieldErrors ?? {});
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Format Toggle */}
            <div className="space-y-3">
                <Label>Event Format</Label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setIsVirtual(false)}
                        className={cn(
                            "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                            !isVirtual
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-muted-foreground/30"
                        )}
                    >
                        <MapPin className={cn("size-5", !isVirtual ? "text-primary" : "text-muted-foreground")} />
                        <span className="font-medium">In-Person</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsVirtual(true)}
                        className={cn(
                            "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                            isVirtual
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-muted-foreground/30"
                        )}
                    >
                        <Video className={cn("size-5", isVirtual ? "text-primary" : "text-muted-foreground")} />
                        <span className="font-medium">Virtual</span>
                    </button>
                </div>
            </div>

            {/* Date & Time */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date & Time</Label>
                    <Input
                        id="startDate"
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={errors.startDate ? "border-destructive" : ""}
                    />
                    {errors.startDate && (
                        <p className="text-sm text-destructive">{errors.startDate[0]}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="endDate">End Date & Time</Label>
                    <Input
                        id="endDate"
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className={errors.endDate ? "border-destructive" : ""}
                    />
                    {errors.endDate && (
                        <p className="text-sm text-destructive">{errors.endDate[0]}</p>
                    )}
                </div>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                            {tz.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Virtual Link (if virtual) */}
            {isVirtual && (
                <div className="space-y-2">
                    <Label htmlFor="virtualLink">Virtual Event Link</Label>
                    <div className="flex items-center gap-2">
                        <Globe className="size-4 text-muted-foreground" />
                        <Input
                            id="virtualLink"
                            type="url"
                            value={virtualLink}
                            onChange={(e) => setVirtualLink(e.target.value)}
                            placeholder="https://zoom.us/j/..."
                            className={cn("flex-1", errors.virtualLink ? "border-destructive" : "")}
                        />
                    </div>
                    {errors.virtualLink && (
                        <p className="text-sm text-destructive">{errors.virtualLink[0]}</p>
                    )}
                </div>
            )}

            {/* Venue Details (if in-person) */}
            {!isVirtual && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="venueName">Venue Name</Label>
                        <Input
                            id="venueName"
                            value={venueName}
                            onChange={(e) => setVenueName(e.target.value)}
                            placeholder="e.g., Eko Convention Center"
                            className={errors.venueName ? "border-destructive" : ""}
                        />
                        {errors.venueName && (
                            <p className="text-sm text-destructive">{errors.venueName[0]}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="venueAddress">Address</Label>
                        <Input
                            id="venueAddress"
                            value={venueAddress}
                            onChange={(e) => setVenueAddress(e.target.value)}
                            placeholder="Street address"
                            className={errors.venueAddress ? "border-destructive" : ""}
                        />
                        {errors.venueAddress && (
                            <p className="text-sm text-destructive">{errors.venueAddress[0]}</p>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="venueCity">City</Label>
                            <Input
                                id="venueCity"
                                value={venueCity}
                                onChange={(e) => setVenueCity(e.target.value)}
                                placeholder="e.g., Lagos"
                                className={errors.venueCity ? "border-destructive" : ""}
                            />
                            {errors.venueCity && (
                                <p className="text-sm text-destructive">{errors.venueCity[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="venueCountry">Country</Label>
                            <Input
                                id="venueCountry"
                                value={venueCountry}
                                onChange={(e) => setVenueCountry(e.target.value)}
                                placeholder="e.g., Nigeria"
                                className={errors.venueCountry ? "border-destructive" : ""}
                            />
                            {errors.venueCountry && (
                                <p className="text-sm text-destructive">{errors.venueCountry[0]}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4">
                <Button type="button" variant="ghost" onClick={onBack}>
                    <ArrowLeft className="mr-2 size-4" />
                    Back
                </Button>

                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onSkip}>
                        Skip for Now
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            <>
                                Continue
                                <ArrowRight className="ml-2 size-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
}
