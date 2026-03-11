/**
 * Step 3: Customize - Contact and Colors
 */

"use client";

import { useState, useTransition } from "react";
import { Palette, Loader2, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/onboarding/FormField";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    OnboardingCard,
    OnboardingHeader,
    OnboardingActions,
} from "@/components/onboarding/OnboardingCard";

interface OrgStep3CustomizeProps {
    readonly defaultValues?: {
        contactEmail?: string;
        websiteUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
    };
    readonly onSuccess?: (data: {
        contactEmail?: string;
        websiteUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
    }) => void;
    readonly onSkip?: () => void;
}

const PRESET_COLORS = [
    { name: "Purple", value: "#6366f1" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" },
    { name: "Orange", value: "#f97316" },
    { name: "Pink", value: "#ec4899" },
    { name: "Red", value: "#ef4444" },
];

export function OrgStep3Customize({
    defaultValues,
    onSuccess,
    onSkip,
}: OrgStep3CustomizeProps) {
    const [isPending, startTransition] = useTransition();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [contactEmail, setContactEmail] = useState(defaultValues?.contactEmail ?? "");
    const [websiteUrl, setWebsiteUrl] = useState(defaultValues?.websiteUrl ?? "");
    const [primaryColor, setPrimaryColor] = useState(
        defaultValues?.primaryColor ?? "#6366f1"
    );
    const [secondaryColor, setSecondaryColor] = useState(
        defaultValues?.secondaryColor ?? "#1e293b"
    );

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            // Validate email if provided
            if (contactEmail && !contactEmail.includes("@")) {
                setErrors({ contactEmail: "Please enter a valid email" });
                return;
            }

            // Validate URL if provided
            if (websiteUrl && !websiteUrl.match(/^https?:\/\/.+/)) {
                setErrors({ websiteUrl: "Please enter a valid URL starting with http:// or https://" });
                return;
            }

            onSuccess?.({
                contactEmail: contactEmail || undefined,
                websiteUrl: websiteUrl || undefined,
                primaryColor,
                secondaryColor,
            });
        });
    }

    function handleSkip() {
        onSkip?.();
    }

    return (
        <OnboardingCard>
            <OnboardingHeader
                title="Customize Your Organization"
                description="Add contact info and customize your brand colors."
                icon={<Palette className="h-6 w-6 text-primary" />}
            />

            <form action={handleSubmit}>
                <div className="space-y-6">
                    {/* Contact Info */}
                    <div className="space-y-4">
                        <FormField
                            label="Contact Email"
                            name="contactEmail"
                            type="email"
                            placeholder="events@example.com"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            error={errors.contactEmail}
                            hint="Public email for attendee inquiries"
                            icon={<Mail className="h-4 w-4" />}
                        />

                        <FormField
                            label="Website"
                            name="websiteUrl"
                            type="url"
                            placeholder="https://yourbrand.com"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            error={errors.websiteUrl}
                            hint="Your organization's website (optional)"
                            icon={<Globe className="h-4 w-4" />}
                        />
                    </div>

                    {/* Brand Colors */}
                    <div className="space-y-4">
                        <div>
                            <Label>Brand Color</Label>
                            <p className="text-xs text-muted-foreground mb-2">
                                Used for buttons and accents on your event pages
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setPrimaryColor(color.value)}
                                        className={`h-8 w-8 rounded-full transition-all ${primaryColor === color.value
                                                ? "ring-2 ring-offset-2 ring-primary scale-110"
                                                : "hover:scale-105"
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="color"
                                    name="primaryColor"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="h-10 w-16 p-1 cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    placeholder="#6366f1"
                                    className="font-mono text-sm"
                                    maxLength={7}
                                />
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="p-4 rounded-lg border bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-2">Preview</p>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    style={{ backgroundColor: primaryColor }}
                                    className="text-white hover:opacity-90"
                                >
                                    Get Tickets
                                </Button>
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: primaryColor }}
                                >
                                    Event Title
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {errors.form && (
                    <p className="mt-4 text-sm text-destructive text-center">
                        {errors.form}
                    </p>
                )}

                <OnboardingActions>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleSkip}
                        disabled={isPending}
                    >
                        Skip for now
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Organization"
                        )}
                    </Button>
                </OnboardingActions>
            </form>
        </OnboardingCard>
    );
}
