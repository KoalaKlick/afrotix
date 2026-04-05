/**
 * Step 3: Customize - Contact and Colors
 */

"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/onboarding/FormField";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    OnboardingCard,
    OnboardingActions,
    setupPrimaryButtonClassName,
    setupTextButtonClassName,
} from "@/components/onboarding/OnboardingCard";

interface OrgStep3CustomizeProps {
    readonly defaultValues?: {
        contactEmail?: string;
        websiteUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
        tertiaryColor?: string;
    };
    readonly onSuccess?: (data: {
        contactEmail?: string;
        websiteUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
        tertiaryColor?: string;
    }) => void;
    readonly onSkip?: () => void;
}

import { PRESET_COLORS } from "@/utils/theme/constants";

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
        defaultValues?.primaryColor ?? "#02a605ff"
    );
    const [secondaryColor, setSecondaryColor] = useState(
        defaultValues?.secondaryColor ?? "#ffe100ff"
    );
    const [tertiaryColor, setTertiaryColor] = useState(
        defaultValues?.tertiaryColor ?? "#dc2626"
    );

    async function handleSubmit() {
        startTransition(async () => {
            // Validate email if provided
            if (contactEmail && !contactEmail.includes("@")) {
                setErrors({ contactEmail: "Please enter a valid email" });
                return;
            }

            // Validate URL if provided
            if (websiteUrl && !/^https?:\/\/.+/.exec(websiteUrl)) {
                setErrors({ websiteUrl: "Please enter a valid URL starting with http:// or https://" });
                return;
            }

            onSuccess?.({
                contactEmail: contactEmail || undefined,
                websiteUrl: websiteUrl || undefined,
                primaryColor,
                secondaryColor,
                tertiaryColor,
            });
        });
    }

    function handleSkip() {
        onSkip?.();
    }

    return (
        <OnboardingCard>
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
                        <div className="space-y-4">
                            <Label>Brand Colors</Label>
                            <p className="text-xs text-muted-foreground mb-4">
                                Select a primary brand color. We&apos;ll automatically handle the rest to ensure your organization looks professional.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => {
                                            setPrimaryColor(color.value);
                                            // Optional: auto-assign secondary/tertiary for a cohesive theme if not set
                                        }}
                                        className={`h-10 w-10 rounded-xl transition-all border-2 ${primaryColor === color.value
                                            ? "border-black scale-110 shadow-md"
                                            : "border-transparent hover:scale-105"
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="rounded-2xl border border-red-500/10 bg-neutral-50 p-4 shadow-none">
                            <p className="text-xs text-muted-foreground mb-2">Preview</p>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    style={{ backgroundColor: primaryColor }}
                                    className="rounded-full text-white hover:opacity-90"
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
                    <Button type="submit" disabled={isPending} className={setupPrimaryButtonClassName}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Organization"
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleSkip}
                        disabled={isPending}
                        className={setupTextButtonClassName}
                    >
                        Skip for now
                    </Button>
                </OnboardingActions>
            </form>
        </OnboardingCard>
    );
}
