/**
 * Event Step 3: Media & Settings
 * Cover image, banner, capacity, and visibility
 */

"use client";

import { useState, useTransition, useRef, useMemo, type ChangeEvent, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Image as ImageIcon, Upload, X, Eye, EyeOff, Users, CheckCircle } from "lucide-react";
import { useImageUpload } from "@/lib/hooks/use-image-upload";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { ActionResult } from "@/lib/actions/upload-image";
import { ConfirmDiscardDialog } from "@/components/common/ConfirmDiscardDialog";

interface EventStep3Props {
    readonly initialData: {
        coverImage?: string;
        bannerImage?: string;
        maxAttendees?: number | null;
        isPublic?: boolean;
    } | null;
    readonly onSuccess: (data: {
        coverImage?: string;
        bannerImage?: string;
        maxAttendees?: number | null;
        isPublic: boolean;
    }) => void;
    readonly onBack: () => void;
    readonly onSkip: () => void;
}

export function EventStep3MediaSettings({ initialData, onSuccess, onBack, onSkip }: EventStep3Props) {
    const [isPending, startTransition] = useTransition();
    const [coverImage, setCoverImage] = useState(initialData?.coverImage ?? "");
    const [bannerImage, setBannerImage] = useState(initialData?.bannerImage ?? "");
    const [maxAttendees, setMaxAttendees] = useState<string>(
        initialData?.maxAttendees?.toString() ?? ""
    );
    const [isPublic, setIsPublic] = useState(initialData?.isPublic ?? true);
    const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
    const [pendingBannerFile, setPendingBannerFile] = useState<File | null>(null);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
    const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);
    const [showDiscardDialog, setShowDiscardDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<"back" | "skip" | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const isPrivate = !isPublic;

    const coverInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const { isUploading: isUploadingCover, upload: runUploadCover } = useImageUpload({
        bucket: "events",
        folder: "events",
        convertOptions: { quality: 0.85, maxWidth: 1200, maxHeight: 630, maxSizeMB: 2 },
    });
    const { isUploading: isUploadingBanner, upload: runUploadBanner } = useImageUpload({
        bucket: "events",
        folder: "events",
        convertOptions: { quality: 0.85, maxWidth: 1920, maxHeight: 400, maxSizeMB: 2 },
    });
    const isUploading = isUploadingCover || isUploadingBanner;

    // Generate display URLs from paths or previews
    const coverDisplayPreview = coverPreviewUrl || getEventImageUrl(coverImage);
    const bannerDisplayPreview = bannerPreviewUrl || getEventImageUrl(bannerImage);

    const isDirty = useMemo(() => {
        return (
            pendingCoverFile !== null ||
            pendingBannerFile !== null ||
            maxAttendees !== (initialData?.maxAttendees?.toString() ?? "") ||
            isPublic !== (initialData?.isPublic ?? true) ||
            coverImage !== (initialData?.coverImage ?? "") ||
            bannerImage !== (initialData?.bannerImage ?? "")
        );
    }, [pendingCoverFile, pendingBannerFile, maxAttendees, isPublic, coverImage, bannerImage, initialData]);

    const handleBack = () => {
        if (isDirty) {
            setPendingAction("back");
            setShowDiscardDialog(true);
        } else {
            onBack();
        }
    };

    const handleSkip = () => {
        if (isDirty) {
            setPendingAction("skip");
            setShowDiscardDialog(true);
        } else {
            onSkip();
        }
    };

    async function handleImageUpload(file: File, type: "cover" | "banner") {
        setErrors({});
        const url = URL.createObjectURL(file);
        if (type === "cover") {
            setPendingCoverFile(file);
            if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
            setCoverPreviewUrl(url);
        } else {
            setPendingBannerFile(file);
            if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl);
            setBannerPreviewUrl(url);
        }
    }

    function handleFileChange(e: ChangeEvent<HTMLInputElement>, type: "cover" | "banner") {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file, type);
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrors({});

        startTransition(async () => {
            let finalCoverImage = coverImage;
            let finalBannerImage = bannerImage;

            // Upload pending images if they exist
            if (pendingCoverFile) {
                const path = await runUploadCover(pendingCoverFile);
                if (path) finalCoverImage = path;
                else return; // Error toast handled by hook
            }

            if (pendingBannerFile) {
                const path = await runUploadBanner(pendingBannerFile);
                if (path) finalBannerImage = path;
                else return; // Error toast handled by hook
            }

            onSuccess({
                coverImage: finalCoverImage,
                bannerImage: finalBannerImage,
                maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : null,
                isPublic,
            });

            setPendingCoverFile(null);
            setPendingBannerFile(null);
            if (coverPreviewUrl) {
                URL.revokeObjectURL(coverPreviewUrl);
                setCoverPreviewUrl(null);
            }
            if (bannerPreviewUrl) {
                URL.revokeObjectURL(bannerPreviewUrl);
                setBannerPreviewUrl(null);
            }
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Image */}
            <div className="space-y-3">
                <Label>Cover Image</Label>
                <p className="text-sm text-muted-foreground">
                    This image will be displayed on your event page (recommended: 1200x630px)
                </p>

                <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => handleFileChange(e, "cover")}
                    className="hidden"
                />

                {(coverImage || coverPreviewUrl) ? (
                    <div className="relative rounded-xl overflow-hidden border aspect-video">
                        <img
                            src={(coverDisplayPreview || undefined) as string | undefined}
                            alt="Cover"
                            className="object-cover w-full h-full"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setCoverImage("");
                                setPendingCoverFile(null);
                                if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
                                setCoverPreviewUrl(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full aspect-video rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="size-8 animate-spin" />
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="size-8" />
                                <span>Click to upload cover image</span>
                                <span className="text-xs">JPEG, PNG, WebP or GIF (max 5MB)</span>
                            </>
                        )}
                    </button>
                )}
                {errors.cover && (
                    <p className="text-sm text-destructive">{errors.cover[0]}</p>
                )}
            </div>

            {/* Banner Image */}
            <div className="space-y-3">
                <Label>Banner Image (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                    Wide banner for event header (recommended: 1920x400px)
                </p>

                <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => handleFileChange(e, "banner")}
                    className="hidden"
                />

                {(bannerImage || bannerPreviewUrl) ? (
                    <div className="relative rounded-xl overflow-hidden border h-32">
                        <img
                            src={(bannerDisplayPreview || undefined) as string | undefined}
                            alt="Banner"
                            className="object-cover w-full h-full"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setBannerImage("");
                                setPendingBannerFile(null);
                                if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl);
                                setBannerPreviewUrl(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full h-32 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors"
                    >
                        <ImageIcon className="size-6" />
                        <span className="text-sm">Upload banner (optional)</span>
                    </button>
                )}
                {errors.banner && (
                    <p className="text-sm text-destructive">{errors.banner[0]}</p>
                )}
            </div>

            {/* Max Attendees */}
            <div className="space-y-2">
                <Label htmlFor="maxAttendees">Maximum Attendees (Optional)</Label>
                <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    <Input
                        id="maxAttendees"
                        type="number"
                        min="1"
                        max="100000"
                        value={maxAttendees}
                        onChange={(e) => setMaxAttendees(e.target.value)}
                        placeholder="No limit"
                        className="flex-1"
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Leave empty for unlimited capacity
                </p>
            </div>

            {/* Visibility */}
            <div className="space-y-3">
                <Label>Event Visibility</Label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setIsPublic(true)}
                        className={cn(
                            "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                            isPublic
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-muted-foreground/30"
                        )}
                    >
                        <Eye className={cn("size-5", isPublic ? "text-primary" : "text-muted-foreground")} />
                        <span className="font-medium">Public</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsPublic(false)}
                        className={cn(
                            "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                            isPrivate
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-muted-foreground/30"
                        )}
                    >
                        <EyeOff className={cn("size-5", isPrivate ? "text-primary" : "text-muted-foreground")} />
                        <span className="font-medium">Private</span>
                    </button>
                </div>
                <p className="text-xs text-muted-foreground">
                    {isPublic
                        ? "Anyone can find and view your event"
                        : "Only organization members can view this event"}
                </p>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
                <Button type="button" variant="ghost" onClick={handleBack}>
                    <ArrowLeft className="mr-2 size-4" />
                    Back
                </Button>

                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleSkip}>
                        Skip for Now
                    </Button>
                    <Button type="submit" disabled={isPending || isUploading}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 size-4" />
                                Create Event
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <ConfirmDiscardDialog
                open={showDiscardDialog}
                onOpenChange={setShowDiscardDialog}
                onConfirm={() => {
                    setShowDiscardDialog(false);
                    if (pendingAction === "back") onBack();
                    else if (pendingAction === "skip") onSkip();
                    setPendingAction(null);
                }}
            />
        </form>
    );
}
