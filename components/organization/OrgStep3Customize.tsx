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
    { name: "Pan-African Red", value: "#dc2626" },
    { name: "Pan-African Gold", value: "#eab308" },
    { name: "Pan-African Green", value: "#16a34a" },
    { name: "Deep Black", value: "#111827" },
    { name: "Forest", value: "#166534" },
    { name: "Clay", value: "#b45309" },
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
        defaultValues?.primaryColor ?? "#dc2626"
    );
    const secondaryColor = defaultValues?.secondaryColor ?? "#111827";

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
                                            ? "ring-2 ring-offset-2 ring-red-600 scale-110"
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
                                    className="h-10 w-16 cursor-pointer bg-neutral-50 p-1 shadow-none"
                                />
                                <Input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    placeholder="#6366f1"
                                    className="bg-neutral-50 font-mono text-sm shadow-none"
                                    maxLength={7}
                                />
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
