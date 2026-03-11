/**
 * Event Creation Client Component
 * Manages the multi-step event creation flow
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    EventCreationProgress,
    EventStep1BasicInfo,
    EventStep2DateLocation,
    EventStep3MediaSettings,
    EventCreationComplete,
} from "@/components/event";
import { createNewEvent } from "@/lib/actions/event";
import { TOTAL_EVENT_CREATION_STEPS } from "@/lib/validations/event";

// Form state type
type EventFormData = {
    title: string;
    slug: string;
    type: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    timezone?: string;
    isVirtual?: boolean;
    virtualLink?: string;
    venueName?: string;
    venueAddress?: string;
    venueCity?: string;
    venueCountry?: string;
    coverImage?: string;
    bannerImage?: string;
    maxAttendees?: number | null;
    isPublic?: boolean;
};

interface EventCreationClientProps {
    readonly organizationSlug?: string;
}

export function EventCreationClient({ organizationSlug }: EventCreationClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Partial<EventFormData>>({});
    const [createdEvent, setCreatedEvent] = useState<{
        id: string;
        title: string;
        slug: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Step 1 success - save basic info, move to step 2
    function handleStep1Success(data: { title: string; slug: string; type: string; description?: string }) {
        setFormData((prev) => ({ ...prev, ...data }));
        setCurrentStep(1);
    }

    // Step 2 success - save date & location, move to step 3
    function handleStep2Success(data: {
        startDate?: string;
        endDate?: string;
        timezone: string;
        isVirtual: boolean;
        virtualLink?: string;
        venueName?: string;
        venueAddress?: string;
        venueCity?: string;
        venueCountry?: string;
    }) {
        setFormData((prev) => ({ ...prev, ...data }));
        setCurrentStep(2);
    }

    function handleStep2Skip() {
        setCurrentStep(2);
    }

    // Step 3 success - create event
    function handleStep3Success(data: {
        coverImage?: string;
        bannerImage?: string;
        maxAttendees?: number | null;
        isPublic: boolean;
    }) {
        const finalData = { ...formData, ...data };
        setFormData(finalData);
        createEvent(finalData as EventFormData);
    }

    function handleStep3Skip() {
        createEvent({ ...formData, isPublic: true } as EventFormData);
    }

    // Create the event
    async function createEvent(data: EventFormData) {
        startTransition(async () => {
            const formDataObj = new FormData();
            formDataObj.set("title", data.title);
            formDataObj.set("slug", data.slug);
            formDataObj.set("type", data.type);
            if (data.description) formDataObj.set("description", data.description);
            if (data.startDate) formDataObj.set("startDate", data.startDate);
            if (data.endDate) formDataObj.set("endDate", data.endDate);
            if (data.timezone) formDataObj.set("timezone", data.timezone);
            formDataObj.set("isVirtual", String(data.isVirtual ?? false));
            if (data.virtualLink) formDataObj.set("virtualLink", data.virtualLink);
            if (data.venueName) formDataObj.set("venueName", data.venueName);
            if (data.venueAddress) formDataObj.set("venueAddress", data.venueAddress);
            if (data.venueCity) formDataObj.set("venueCity", data.venueCity);
            if (data.venueCountry) formDataObj.set("venueCountry", data.venueCountry);
            if (data.coverImage) formDataObj.set("coverImage", data.coverImage);
            if (data.bannerImage) formDataObj.set("bannerImage", data.bannerImage);
            if (data.maxAttendees) formDataObj.set("maxAttendees", String(data.maxAttendees));
            formDataObj.set("isPublic", String(data.isPublic ?? true));

            const result = await createNewEvent(formDataObj);

            if (result.success) {
                setCreatedEvent(result.data);
                setCurrentStep(3); // Show completion screen
            } else {
                setError(result.error);
            }
        });
    }

    function handleBack() {
        setCurrentStep((prev) => Math.max(0, prev - 1));
    }

    // Show completion screen
    if (createdEvent) {
        return (
            <EventCreationComplete
                event={createdEvent}
                organizationSlug={organizationSlug}
            />
        );
    }

    return (
        <div className="space-y-8">
            {/* Progress indicator */}
            <EventCreationProgress
                currentStep={currentStep}
                totalSteps={TOTAL_EVENT_CREATION_STEPS}
            />

            {/* Error message */}
            {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                </div>
            )}

            {/* Step content */}
            {currentStep === 0 && (
                <EventStep1BasicInfo
                    initialData={formData}
                    onSuccess={handleStep1Success}
                />
            )}

            {currentStep === 1 && (
                <EventStep2DateLocation
                    initialData={formData}
                    onSuccess={handleStep2Success}
                    onBack={handleBack}
                    onSkip={handleStep2Skip}
                />
            )}

            {currentStep === 2 && (
                <EventStep3MediaSettings
                    initialData={formData}
                    onSuccess={handleStep3Success}
                    onBack={handleBack}
                    onSkip={handleStep3Skip}
                />
            )}
        </div>
    );
}
