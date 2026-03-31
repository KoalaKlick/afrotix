/**
 * Step 2: Branding - Logo and Description
 */

"use client";

import { useState, useTransition, useRef } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    OnboardingCard,
    OnboardingActions,
    setupPrimaryButtonClassName,
    setupTextButtonClassName,
} from "@/components/onboarding/OnboardingCard";
import { uploadOrgLogo, validateOrgStep2 } from "@/lib/actions/organization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { convertToWebP } from "@/lib/image-utils";
import { getOrgImageUrl } from "@/lib/image-url-utils";

interface OrgStep2BrandingProps {
    readonly defaultValues?: {
        logoUrl?: string;
        description?: string;
    };
    readonly orgName: string;
    readonly onSuccess?: (data: { logoUrl?: string; description?: string }) => void;
    readonly onSkip?: () => void;
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function OrgStep2Branding({
    defaultValues,
    orgName,
    onSuccess,
    onSkip,
}: OrgStep2BrandingProps) {
    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [logoUrl, setLogoUrl] = useState(defaultValues?.logoUrl ?? "");
    const [description, setDescription] = useState(defaultValues?.description ?? "");

    // Generate display URL from path
    const logoDisplayUrl = getOrgImageUrl(logoUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setErrors({ logo: "Please select an image file" });
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setErrors({ logo: "Image must be less than 5MB" });
            return;
        }

        setIsUploading(true);
        setErrors({});

        try {
            // Convert to WebP for optimization
            const optimizedFile = await convertToWebP(file, {
                quality: 1,
                maxWidth: 400,
                maxHeight: 400,
                maxSizeMB: 0.5,
            });

            const formData = new FormData();
            formData.set("file", optimizedFile);

            // Pass old logo path for deletion
            if (logoUrl) {
                formData.set("oldLogoPath", logoUrl);
            }

            const result = await uploadOrgLogo(formData);

            if (result.success && result.data) {
                setLogoUrl(result.data.path);
            } else {
                setErrors({ logo: result.error ?? "Upload failed" });
            }
        } catch (error) {
            console.error("Logo upload error:", error);
            setErrors({ logo: "Failed to upload logo" });
        } finally {
            setIsUploading(false);
        }
    }

    function handleRemoveLogo() {
        setLogoUrl("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            formData.set("logoUrl", logoUrl);
            formData.set("description", description);

            const result = await validateOrgStep2(formData);
            if (result.success) {
                onSuccess?.({ logoUrl, description });
            } else {
                setErrors({ form: result.error ?? "Something went wrong" });
            }
        });
    }

    function handleSkip() {
        onSkip?.();
    }

    return (
        <OnboardingCard>
            <form action={handleSubmit}>
                <div className="space-y-6">
                    {/* Logo Upload */}
                    <div className="space-y-3">
                        <Label>Organization Logo</Label>
                        <div className="space-y-3">
                            <div className="relative inline-flex">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    aria-label="Choose organization logo"
                                    className="group relative overflow-hidden rounded-3xl border-2 border-dashed border-muted-foreground/25 bg-muted transition-all duration-200 hover:border-primary/50 disabled:cursor-not-allowed"
                                >
                                    <Avatar className="h-24 w-24 rounded-3xl">
                                        <AvatarImage src={logoDisplayUrl ?? undefined} alt={orgName} />
                                        <AvatarFallback className="rounded-3xl bg-primary/10 text-lg font-semibold text-primary">
                                            {getInitials(orgName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        {isUploading ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                                        ) : (
                                            <ImagePlus className="h-6 w-6 text-white" />
                                        )}
                                    </div>
                                </button>
                                {logoUrl && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveLogo}
                                        className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90"
                                        aria-label="Remove organization logo"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="logo-upload"
                            />
                            <p className="text-xs text-muted-foreground">
                                PNG, JPG or WEBP. Max 5MB.
                            </p>
                        </div>
                        {errors.logo && (
                            <p className="text-xs text-destructive">{errors.logo}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Tell people about your organization..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            maxLength={500}
                            className="resize-none bg-neutral-50 shadow-none"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {description.length}/500
                        </p>
                    </div>
                </div>

                {errors.form && (
                    <p className="mt-4 text-sm text-destructive text-center">
                        {errors.form}
                    </p>
                )}

                <OnboardingActions>
                    <Button
                        type="submit"
                        disabled={isPending || isUploading}
                        className={setupPrimaryButtonClassName}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Continue"
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
