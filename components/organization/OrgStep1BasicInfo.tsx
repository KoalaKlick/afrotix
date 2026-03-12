/**
 * Step 1: Basic Info - Organization Name and Slug
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import { Building2, Globe, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/onboarding/FormField";
import {
    OnboardingCard,
    OnboardingActions,
    setupPrimaryButtonClassName,
} from "@/components/onboarding/OnboardingCard";
import { validateOrgStep1 } from "@/lib/actions/organization";
import { generateSlug } from "@/lib/validations/organization";
import { useDebounce } from "@/hooks/use-debounce";

interface OrgStep1BasicInfoProps {
    readonly defaultValues?: {
        name?: string;
        slug?: string;
    };
    readonly onSuccess?: (data: { name: string; slug: string }) => void;
    readonly isInitialSetup?: boolean;
}

export function OrgStep1BasicInfo({
    defaultValues,
    onSuccess,
    isInitialSetup: _isInitialSetup = false,
}: OrgStep1BasicInfoProps) {
    const [isPending, startTransition] = useTransition();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [name, setName] = useState(defaultValues?.name ?? "");
    const [slug, setSlug] = useState(defaultValues?.slug ?? "");
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
    const [slugStatus, setSlugStatus] = useState<
        "idle" | "checking" | "available" | "taken" | "invalid"
    >("idle");

    const debouncedSlug = useDebounce(slug, 500);

    // Auto-generate slug from name
    useEffect(() => {
        if (!isSlugManuallyEdited && name) {
            setSlug(generateSlug(name));
        }
    }, [name, isSlugManuallyEdited]);

    // Check slug availability when it changes
    useEffect(() => {
        if (!debouncedSlug || debouncedSlug.length < 2) {
            setSlugStatus("idle");
            return;
        }

        setSlugStatus("checking");

        // Check via the server action
        const formData = new FormData();
        formData.set("name", name);
        formData.set("slug", debouncedSlug);

        validateOrgStep1(formData).then((result) => {
            if (result.success) {
                setSlugStatus("available");
                setErrors((prev) => {
                    const { slug: _, ...rest } = prev;
                    return rest;
                });
            } else if (result.error?.includes("URL")) {
                setSlugStatus("taken");
                setErrors((prev) => ({ ...prev, slug: result.error ?? "URL taken" }));
            } else {
                setSlugStatus("invalid");
                setErrors((prev) => ({ ...prev, slug: result.error ?? "Invalid" }));
            }
        });
    }, [debouncedSlug, name]);

    function handleSlugChange(value: string) {
        setSlug(value.toLowerCase().replaceAll(/[^a-z0-9-]/g, ""));
        setIsSlugManuallyEdited(true);
    }

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await validateOrgStep1(formData);
            if (result.success && result.data) {
                onSuccess?.(result.data);
            } else {
                setErrors({ form: result.error ?? "Something went wrong" });
            }
        });
    }

    const slugIcon = () => {
        switch (slugStatus) {
            case "checking":
                return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
            case "available":
                return <Check className="h-4 w-4 text-green-500" />;
            case "taken":
            case "invalid":
                return <X className="h-4 w-4 text-destructive" />;
            default:
                return null;
        }
    };

    return (
        <OnboardingCard>
            <form action={handleSubmit}>
                <div className="space-y-4">
                    <FormField
                        label="Organization Name"
                        name="name"
                        type="text"
                        placeholder="Afro Beats Events"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={errors.name}
                        hint="The name of your organization or brand"
                        icon={<Building2 className="h-4 w-4" />}
                        required
                        autoFocus
                    />

                    <FormField
                        label="Organization URL"
                        name="slug"
                        type="text"
                        placeholder="afro-beats-events"
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        error={errors.slug}
                        hint={`afrotix.com/${slug || "your-org"}`}
                        icon={<Globe className="h-4 w-4" />}
                        suffix={slugIcon()}
                        required
                    />
                </div>

                {errors.form && (
                    <p className="mt-4 text-sm text-destructive text-center">
                        {errors.form}
                    </p>
                )}

                <OnboardingActions>
                    <Button
                        type="submit"
                        className={setupPrimaryButtonClassName}
                        disabled={isPending || slugStatus === "taken" || slugStatus === "checking"}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            "Continue"
                        )}
                    </Button>
                </OnboardingActions>
            </form>
        </OnboardingCard>
    );
}
