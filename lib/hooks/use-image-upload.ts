"use client";

import { useState } from "react";
import { toast } from "sonner";
import { convertToWebP } from "@/lib/image-utils";
import { uploadImage } from "@/lib/actions/upload-image";
import type { UploadImageBucket } from "@/lib/actions/upload-image";

type ConvertOptions = Parameters<typeof convertToWebP>[1];

interface UseImageUploadOptions {
    /** Storage bucket (defaults to "events"). */
    bucket?: UploadImageBucket;
    /** Sub-folder inside the bucket, e.g. "templates", "nominees", "events". */
    folder?: string;
    /** Options forwarded to convertToWebP (quality, maxWidth, maxHeight, maxSizeMB). */
    convertOptions?: ConvertOptions;
    /** Show toast on error (defaults to true). */
    showErrorToast?: boolean;
}

interface UseImageUploadReturn {
    isUploading: boolean;
    /**
     * Convert file to WebP, upload via the unified `uploadImage` action, 
     * and return the storage path. Returns `null` on failure.
     */
    upload: (file: File, oldPath?: string | null) => Promise<string | null>;
}

/**
 * Shared hook for converting an image to WebP and uploading it via the
 * unified `uploadImage` server action.
 *
 * @example
 * const { isUploading, upload } = useImageUpload({
 *   bucket: "events",
 *   folder: "templates",
 *   convertOptions: { quality: 0.85, maxWidth: 1200, maxHeight: 630, maxSizeMB: 2 },
 * });
 *
 * const path = await upload(file);
 * if (path) setForm(prev => ({ ...prev, templateImage: path }));
 */
export function useImageUpload({
    bucket = "events",
    folder = "uploads",
    convertOptions,
    showErrorToast = true,
}: UseImageUploadOptions = {}): UseImageUploadReturn {
    const [isUploading, setIsUploading] = useState(false);

    async function upload(file: File, oldPath?: string | null): Promise<string | null> {
        setIsUploading(true);
        try {
            const optimizedFile = await convertToWebP(file, convertOptions);

            const formData = new FormData();
            formData.set("file", optimizedFile);

            const result = await uploadImage(formData, {
                bucket,
                folder,
                oldPath, // Pass the old path for deletion
            });

            if (result.success) {
                return result.data.path;
            }

            if (showErrorToast) toast.error(result.error);
            return null;
        } catch {
            if (showErrorToast) toast.error("Failed to upload image");
            return null;
        } finally {
            setIsUploading(false);
        }
    }

    return { isUploading, upload };
}
