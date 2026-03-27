"use server";

import { createClient } from "@/utils/supabase/server";
import {
    STORAGE_BUCKETS,
    deleteStorageFile,
    normalizeToPath,
} from "@/lib/storage-utils";
// import { convertToWebP } from "@/lib/image-utils";
import { logger } from "@/lib/logger";

export type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string };

export type UploadImageBucket = "events" | "avatars" | "organizations";

export interface UploadImageOptions {
    /** Storage bucket to upload into. Defaults to "events". */
    bucket?: UploadImageBucket;
    /** Sub-folder prefix inside the bucket, e.g. "covers", "templates". */
    folder?: string;
    /** WebP conversion options. Pass false to skip conversion. */
    convert?:
    | false
    | {
        quality?: number;
        maxWidth?: number;
        maxHeight?: number;
        maxSizeMB?: number;
    };
    /** Existing path (or full URL) to delete before uploading the new file. */
    oldPath?: string | null;
}

/**
 * Universal image upload action.
 * Returns the **storage path** (not the full public URL).
 * Use the client-side `getStorageUrl` helpers to derive display URLs.
 */
export async function uploadImage(
    formData: FormData,
    options: UploadImageOptions = {}
): Promise<ActionResult<{ path: string }>> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Only allow unauthenticated uploads for public nominations
    const isPublicUpload = options.folder === "nominations";
    
    if (!user && !isPublicUpload) {
        return { success: false, error: "Not authenticated" };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
        return { success: false, error: "No file provided" };
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
        return {
            success: false,
            error: "Invalid file type. Use JPEG, PNG, WebP, or GIF.",
        };
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        return { success: false, error: "File too large. Maximum size is 5MB." };
    }

    const bucket = options.bucket ?? "events";
    const storageBucket = STORAGE_BUCKETS[bucket.toUpperCase() as keyof typeof STORAGE_BUCKETS];

    try {
        // Immediate cleanup if oldPath provided
        if (options.oldPath) {
            const oldPath = normalizeToPath(options.oldPath, bucket);
            if (oldPath) {
                await deleteStorageFile(bucket, oldPath);
            }
        }

        // ── No conversion on server; file is already webp if needed ──
        let uploadFile: File = file;

        // ── Build file path ──────────────────────────────────────────────────
        const folder = options.folder ?? "uploads";
        const filename = `${Date.now()}.webp`;
        const ownerId = user?.id ?? "public";
        const filePath = `${ownerId}/${folder}/${filename}`;

        // ── Upload ───────────────────────────────────────────────────────────
        const { data, error } = await supabase.storage
            .from(storageBucket)
            .upload(filePath, uploadFile, {
                cacheControl: "3600",
                upsert: false,
                contentType: "image/webp",
            });

        if (error) {
            logger.error({ error: error.message }, "Storage upload error");
            return { success: false, error: "Failed to upload image" };
        }

        return { success: true, data: { path: data.path } };
    } catch (err) {
        logger.error({ err }, "Unexpected error uploading image");
        return { success: false, error: "Failed to upload image" };
    }
}