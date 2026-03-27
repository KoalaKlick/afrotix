/**
 * Client-side utilities for generating image URLs from storage paths
 * These run in the browser and use the public Supabase URL
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Storage bucket names
 */
export const BUCKETS = {
    AVATARS: "avatars",
    EVENTS: "events",
    ORGANIZATIONS: "organizations",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/**
 * Check if a value is a full URL or just a path
 */
export function isFullUrl(pathOrUrl: string | null | undefined): boolean {
    if (!pathOrUrl) return false;
    return pathOrUrl.startsWith("http://") || 
           pathOrUrl.startsWith("https://") ||
           pathOrUrl.startsWith("blob:") ||
           pathOrUrl.startsWith("data:");
}

/**
 * Generate a public URL from a storage path or return as-is if already a URL
 * @param bucket - The storage bucket name
 * @param pathOrUrl - The file path within the bucket, or an existing URL
 * @returns The complete public URL, or null if path is empty
 */
export function getStorageUrl(
    bucket: BucketName,
    pathOrUrl: string | null | undefined
): string | null {
    if (!pathOrUrl) return null;

    // If already a full URL, return as-is (backwards compatibility)
    if (isFullUrl(pathOrUrl)) {
        return pathOrUrl;
    }

    if (!SUPABASE_URL) {
        console.warn("NEXT_PUBLIC_SUPABASE_URL is not defined");
        return null;
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${pathOrUrl}`;
}

/**
 * Convenience function for avatar URLs
 */
export function getAvatarUrl(pathOrUrl: string | null | undefined): string | null {
    return getStorageUrl(BUCKETS.AVATARS, pathOrUrl);
}

/**
 * Convenience function for event image URLs
 */
export function getEventImageUrl(pathOrUrl: string | null | undefined): string | null {
    return getStorageUrl(BUCKETS.EVENTS, pathOrUrl);
}

export function getCategoryTemplateImageUrl(pathOrUrl: string | null | undefined): string | null {
    return getStorageUrl(BUCKETS.EVENTS, pathOrUrl);
}

/**
 * Convenience function for organization image URLs (logo/banner)
 */
export function getOrgImageUrl(pathOrUrl: string | null | undefined): string | null {
    return getStorageUrl(BUCKETS.ORGANIZATIONS, pathOrUrl);
}

/**
 * Extract the path from a full URL (useful for migration from old format)
 * @param fullUrl - The complete public URL from Supabase
 * @param bucket - The storage bucket name
 * @returns The extracted path, or null if extraction fails
 */
export function extractPathFromUrl(
    fullUrl: string | null | undefined,
    bucket: BucketName
): string | null {
    if (!fullUrl) return null;

    // If not a URL, assume it's already a path
    if (!isFullUrl(fullUrl)) {
        return fullUrl;
    }

    try {
        // Pattern: /storage/v1/object/public/{bucket}/{path}
        const pattern = new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`);
        const match = pattern.exec(fullUrl);

        if (match?.[1]) {
            return decodeURIComponent(match[1]);
        }

        return null;
    } catch (error) {
        console.error("Error extracting path from URL", { fullUrl, bucket, error });
        return null;
    }
}
