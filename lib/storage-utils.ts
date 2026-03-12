import { createClient } from "@/utils/supabase/server";
import { logger } from "./logger";

/**
 * Storage bucket names used in the application
 */
export const STORAGE_BUCKETS = {
    AVATARS: "avatars",
    EVENTS: "events",
    ORGANIZATIONS: "organizations",
} as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

/**
 * Extract the storage path from a full Supabase public URL
 * @param fullUrl - The complete public URL from Supabase
 * @param bucket - The storage bucket name
 * @returns The extracted path, or null if extraction fails
 * 
 * @example
 * extractPathFromUrl(
 *   "https://xxx.supabase.co/storage/v1/object/public/avatars/user123/profile.webp",
 *   "avatars"
 * ) // Returns "user123/profile.webp"
 */
export function extractPathFromUrl(fullUrl: string | null | undefined, bucket: StorageBucket): string | null {
    if (!fullUrl) return null;

    try {
        // Pattern: /storage/v1/object/public/{bucket}/{path}
        const pattern = new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`);
        const match = pattern.exec(fullUrl);

        if (match?.[1]) {
            return decodeURIComponent(match[1]);
        }

        // Alternative: Check if it's already just a path (no URL prefix)
        if (!fullUrl.startsWith("http") && !fullUrl.startsWith("/storage")) {
            return fullUrl;
        }

        return null;
    } catch (error) {
        logger.error({ fullUrl, bucket, error }, "Error extracting path from URL");
        return null;
    }
}

/**
 * Generate a public URL from a storage path
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @returns The complete public URL
 */
export async function getPublicUrl(bucket: StorageBucket, path: string): Promise<string> {
    const supabase = await createClient();
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

/**
 * Generate a public URL synchronously (using environment variable)
 * Use this when you don't need to await the Supabase client
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @returns The complete public URL
 */
export function getPublicUrlSync(bucket: StorageBucket, path: string | null | undefined): string | null {
    if (!path) return null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Delete a file from Supabase storage
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket (not the full URL)
 * @returns Object with success status and optional error
 */
export async function deleteStorageFile(
    bucket: StorageBucket,
    path: string | null | undefined
): Promise<{ success: boolean; error?: string }> {
    if (!path) {
        return { success: true }; // Nothing to delete
    }

    try {
        const supabase = await createClient();
        const { error } = await supabase.storage.from(bucket).remove([path]);

        if (error) {
            logger.error({ bucket, path, error: error.message }, "Error deleting storage file");
            return { success: false, error: error.message };
        }

        logger.info({ bucket, path }, "Successfully deleted storage file");
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error({ bucket, path, error: errorMessage }, "Exception deleting storage file");
        return { success: false, error: errorMessage };
    }
}

/**
 * Delete old image and upload new one - handles the common pattern of updating images
 * @param bucket - The storage bucket name
 * @param oldPath - The old file path to delete (can be null/undefined)
 * @param newFile - The new file to upload
 * @param newPath - The path for the new file
 * @returns Object with success status, new path, and optional error
 */
export async function replaceStorageFile(
    bucket: StorageBucket,
    oldPath: string | null | undefined,
    newFile: File | Blob,
    newPath: string
): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
        const supabase = await createClient();

        // Delete old file first (if exists and differs from new path)
        if (oldPath && oldPath !== newPath) {
            const deleteResult = await deleteStorageFile(bucket, oldPath);
            if (!deleteResult.success) {
                logger.warn({ bucket, oldPath, error: deleteResult.error }, "Failed to delete old file, continuing with upload");
                // Continue with upload even if delete fails
            }
        }

        // Upload new file
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(newPath, newFile, {
                cacheControl: "3600",
                upsert: true, // Allow overwriting if path is the same
            });

        if (uploadError) {
            logger.error({ bucket, newPath, error: uploadError.message }, "Error uploading new file");
            return { success: false, error: uploadError.message };
        }

        logger.info({ bucket, oldPath, newPath }, "Successfully replaced storage file");
        return { success: true, path: newPath };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error({ bucket, oldPath, newPath, error: errorMessage }, "Exception replacing storage file");
        return { success: false, error: errorMessage };
    }
}

/**
 * Check if a path is a full URL or just a storage path
 */
export function isFullUrl(pathOrUrl: string | null | undefined): boolean {
    if (!pathOrUrl) return false;
    return pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://");
}

/**
 * Normalize a path or URL to just the path
 * If it's a full URL, extract the path. If it's already a path, return as-is.
 */
export function normalizeToPath(pathOrUrl: string | null | undefined, bucket: StorageBucket): string | null {
    if (!pathOrUrl) return null;

    if (isFullUrl(pathOrUrl)) {
        return extractPathFromUrl(pathOrUrl, bucket);
    }

    return pathOrUrl;
}
