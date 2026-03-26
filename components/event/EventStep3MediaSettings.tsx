/**
 * Event Step 3: Media & Settings
 * Cover image, banner, capacity, and visibility
 */

"use client";

import { useState, useTransition, useRef, type ChangeEvent, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Image as ImageIcon, Upload, X, Eye, EyeOff, Users, CheckCircle } from "lucide-react";
import { useImageUpload } from "@/lib/hooks/use-image-upload";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface EventStep3Props {
    readonly initialData?: {
        coverImage?: string;
        bannerImage?: string;
        maxAttendees?: number | null;
        isPublic?: boolean;
    };
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
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const isPrivate = !isPublic;

    const coverInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const { isUploading: isUploadingCover, upload: uploadCover } = useImageUpload({
        bucket: "events",
        folder: "events",
        convertOptions: { quality: 0.85, maxWidth: 1200, maxHeight: 630, maxSizeMB: 2 },
    });
    const { isUploading: isUploadingBanner, upload: uploadBanner } = useImageUpload({
        bucket: "events",
        folder: "events",
        convertOptions: { quality: 0.85, maxWidth: 1920, maxHeight: 400, maxSizeMB: 2 },
    });
    const isUploading = isUploadingCover || isUploadingBanner;

    // Generate display URLs from paths
    const coverDisplayUrl = getEventImageUrl(coverImage);
    const bannerDisplayUrl = getEventImageUrl(bannerImage);

    async function handleImageUpload(file: File, type: "cover" | "banner") {
        setErrors({});
        const uploader = type === "cover" ? uploadCover : uploadBanner;
        const oldPath = type === "cover" ? coverImage : bannerImage;

        const path = await uploader(file, oldPath || null);
        if (path) {
            if (type === "cover") setCoverImage(path);
            else setBannerImage(path);
        } else {
            setErrors({ [type]: ["Failed to upload image"] });
        }
    }

    function handleFileChange(e: ChangeEvent<HTMLInputElement>, type: "cover" | "banner") {
        const file = e.target.files?.[0];
        if (file) {
            handleImageUpload(file, type);
        }
    }

    function handleSubmit(e: Parameters<NonNullable<ComponentProps<"form">["onSubmit"]>>[0]) {
        e.preventDefault();
        setErrors({});

        startTransition(() => {
            onSuccess({
                coverImage: coverImage || undefined,
                bannerImage: bannerImage || undefined,
                maxAttendees: maxAttendees ? Number.parseInt(maxAttendees, 10) : null,
                isPublic,
            });
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

                {coverImage && coverDisplayUrl ? (
                    <div className="relative rounded-xl overflow-hidden border aspect-video">
                        <Image
                            src={coverDisplayUrl}
                            alt="Cover"
                            fill
                            className="object-cover"
                            unoptimized
                        />
                        <button
                            type="button"
                            onClick={() => setCoverImage("")}
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

                {bannerImage && bannerDisplayUrl ? (
                    <div className="relative rounded-xl overflow-hidden border h-32">
                        <Image
                            src={bannerDisplayUrl}
                            alt="Banner"
                            fill
                            className="object-cover"
                            unoptimized
                        />
                        <button
                            type="button"
                            onClick={() => setBannerImage("")}
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
                <Button type="button" variant="ghost" onClick={onBack}>
                    <ArrowLeft className="mr-2 size-4" />
                    Back
                </Button>

                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onSkip}>
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
        </form>
    );
}
