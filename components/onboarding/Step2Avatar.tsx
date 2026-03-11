/**
 * Step 2: Avatar - Profile Picture Upload
 * Allows users to upload or select an avatar
 */

"use client";

import { useState, useTransition, useRef } from "react";
import { Camera, Loader2, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    OnboardingCard,
    OnboardingHeader,
    OnboardingActions,
} from "./OnboardingCard";
import {
    saveOnboardingStep2,
    skipOnboardingStep,
    uploadAvatar,
} from "@/lib/actions/onboarding";
import { cn } from "@/lib/utils";
import { convertToWebP, isImageFile, formatFileSize } from "@/lib/image-utils";

interface Step2AvatarProps {
    defaultAvatarUrl?: string;
    onSuccess?: () => void;
    onSkip?: () => void;
}

export function Step2Avatar({
    defaultAvatarUrl,
    onSuccess,
    onSkip,
}: Step2AvatarProps) {
    const [isPending, startTransition] = useTransition();
    const [avatarUrl, setAvatarUrl] = useState(defaultAvatarUrl ?? "");
    const [previewUrl, setPreviewUrl] = useState(defaultAvatarUrl ?? "");
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

            const result = await uploadAvatar(formData);

            if (result.success && result.data?.url) {
                setAvatarUrl(result.data.url);
            } else {
                setError(result.error ?? "Failed to upload image");
                setPreviewUrl(defaultAvatarUrl ?? "");
            }
        } catch {
            setError("Failed to process image");
            setPreviewUrl(defaultAvatarUrl ?? "");
        } finally {
            setIsUploading(false);
        }
    }

    async function handleSubmit(formData: FormData) {
        if (avatarUrl) {
            formData.set("avatarUrl", avatarUrl);
        }

        startTransition(async () => {
            const result = await saveOnboardingStep2(formData);
            if (!result.success) {
                setError(result.error ?? "Something went wrong");
            } else {
                onSuccess?.();
            }
        });
    }

    async function handleSkip() {
        startTransition(async () => {
            const result = await skipOnboardingStep(1);
            if (!result.success) {
                setError(result.error ?? "Something went wrong");
            } else {
                onSkip?.();
            }
        });
    }

    return (
        <OnboardingCard>
            <OnboardingHeader
                title="Add a Profile Picture"
                description="Help others recognize you with a profile photo"
                icon={<Camera className="h-6 w-6 text-primary" />}
            />

            <form action={handleSubmit}>
                <input
                    type="hidden"
                    name="avatarUrl"
                    value={avatarUrl}
                />

                {/* Avatar preview */}
                <div className="flex flex-col items-center gap-4">
                    <div
                        className={cn(
                            "relative h-32 w-32 rounded-full overflow-hidden",
                            "bg-muted border-2 border-dashed border-muted-foreground/25",
                            "flex items-center justify-center",
                            "transition-all duration-200",
                            "hover:border-primary/50 cursor-pointer",
                        )}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Avatar preview"
                                className="h-full w-full object-cover"
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
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                    />

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4" />
                                Choose Photo
                            </>
                        )}
                    </Button>
                </div>

                {error && (
                    <p className="mt-4 text-sm text-destructive text-center">{error}</p>
                )}

                <OnboardingActions>
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
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
                        size="lg"
                        className="w-full"
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
