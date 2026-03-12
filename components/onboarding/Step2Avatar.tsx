/**
 * Step 2: Avatar - Profile Picture Upload
 * Allows users to upload or select an avatar
 */

"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Loader2, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    OnboardingCard,
    OnboardingActions,
    setupPrimaryButtonClassName,
    setupTextButtonClassName,
} from "./OnboardingCard";
import {
    saveOnboardingStep2,
    skipOnboardingStep,
    uploadAvatar,
} from "@/lib/actions/onboarding";
import { cn } from "@/lib/utils";
import { convertToWebP, isImageFile, formatFileSize } from "@/lib/image-utils";
import { getAvatarUrl } from "@/lib/image-url-utils";

interface Step2AvatarProps {
    defaultAvatarUrl?: string;
    onSuccess?: () => void;
    onSkip?: () => void;
}

export function Step2Avatar({
    defaultAvatarUrl,
    onSuccess,
    onSkip,
}: Readonly<Step2AvatarProps>) {
    const [isPending, startTransition] = useTransition();
    // Store path (not URL) - path is what gets saved to DB
    const [avatarPath, setAvatarPath] = useState(defaultAvatarUrl ?? "");
    const [previewUrl, setPreviewUrl] = useState(
        defaultAvatarUrl ? getAvatarUrl(defaultAvatarUrl) ?? "" : ""
    );
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!isImageFile(file)) {
            setError("Please select an image file");
            return;
        }

        // Validate file size (max 10MB before conversion)
        if (file.size > 10 * 1024 * 1024) {
            setError("Image must be less than 10MB");
            return;
        }

        setError(null);
        setIsUploading(true);

        try {
            // Convert to WebP with compression (avatars: 400x400, quality 0.85, max 500KB)
            const webpFile = await convertToWebP(file, {
                quality: 0.85,
                maxWidth: 400,
                maxHeight: 400,
                maxSizeMB: 0.5,
            });

            console.log(
                `[Avatar] Converted ${formatFileSize(file.size)} → ${formatFileSize(webpFile.size)}`
            );

            // Create preview from converted file
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setPreviewUrl(result);
            };
            reader.readAsDataURL(webpFile);

            // Upload converted WebP to Supabase Storage
            const formData = new FormData();
            formData.append("file", webpFile);
            // Pass old avatar path for deletion (if exists)
            if (avatarPath) {
                formData.append("oldAvatarPath", avatarPath);
            }

            const result = await uploadAvatar(formData);

            if (result.success && result.data?.path) {
                // Store the path (not URL) - this is what gets saved to DB
                setAvatarPath(result.data.path);
                // Generate URL for display
                const displayUrl = getAvatarUrl(result.data.path);
                if (displayUrl) {
                    setPreviewUrl(displayUrl);
                }
            } else {
                setError(result.error ?? "Failed to upload image");
                setPreviewUrl(defaultAvatarUrl ? getAvatarUrl(defaultAvatarUrl) ?? "" : "");
            }
        } catch {
            setError("Failed to process image");
            setPreviewUrl(defaultAvatarUrl ? getAvatarUrl(defaultAvatarUrl) ?? "" : "");
        } finally {
            setIsUploading(false);
        }
    }

    async function handleSubmit(formData: FormData) {
        if (avatarPath) {
            // Save the path (not URL) to the database
            formData.set("avatarUrl", avatarPath);
        }

        startTransition(async () => {
            const result = await saveOnboardingStep2(formData);
            if (result.success) {
                onSuccess?.();
                return;
            }

            setError(result.error ?? "Something went wrong");
        });
    }

    async function handleSkip() {
        startTransition(async () => {
            const result = await skipOnboardingStep(1);
            if (result.success) {
                onSkip?.();
                return;
            }

            setError(result.error ?? "Something went wrong");
        });
    }

    return (
        <OnboardingCard>
            <form action={handleSubmit}>
                <input
                    type="hidden"
                    name="avatarUrl"
                    value={avatarPath}
                />

                {/* Avatar preview */}
                <div className="flex flex-col items-center gap-4">
                    <button
                        type="button"
                        className={cn(
                            "relative h-32 w-32 overflow-hidden rounded-3xl",
                            "bg-muted border-2 border-dashed border-muted-foreground/25",
                            "flex items-center justify-center",
                            "transition-all duration-200",
                            "hover:border-primary/50 cursor-pointer",
                        )}
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Choose profile photo"
                    >
                        {previewUrl ? (
                            <Image
                                src={previewUrl}
                                alt="Avatar preview"
                                fill
                                unoptimized
                                sizes="128px"
                                className="object-cover"
                            />
                        ) : (
                            <User className="h-16 w-16 text-muted-foreground/50" />
                        )}

                        {/* Overlay */}
                        <div
                            className={cn(
                                "absolute inset-0 bg-black/50 flex items-center justify-center",
                                "opacity-0 hover:opacity-100 transition-opacity",
                            )}
                        >
                            {isUploading ? (
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                            ) : (
                                <Upload className="h-8 w-8 text-white" />
                            )}
                        </div>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                    />
                </div>

                {error && (
                    <p className="mt-4 text-sm text-destructive text-center">{error}</p>
                )}

                <OnboardingActions>
                    <Button
                        type="submit"
                        size="lg"
                        className={setupPrimaryButtonClassName}
                        disabled={isPending || isUploading}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Continue"
                        )}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        className={setupTextButtonClassName}
                        onClick={handleSkip}
                        disabled={isPending || isUploading}
                    >
                        Skip for now
                    </Button>
                </OnboardingActions>
            </form>
        </OnboardingCard>
    );
}
