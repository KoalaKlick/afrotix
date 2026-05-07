"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { updateProfile, isUsernameAvailable } from "@/lib/dal/profile";
import {
    STORAGE_BUCKETS,
    deleteStorageFile,
    normalizeToPath,
} from "@/lib/storage-utils";
import { logger } from "@/lib/logger";

type ActionResult<T = void> = {
    success: boolean;
    error?: string;
    data?: T;
};

async function getCurrentUserId(): Promise<string | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
}

/**
 * Upload avatar for the current user and return the storage path.
 * Re-uses the same bucket/logic as onboarding upload.
 */
export async function uploadUserAvatar(
    formData: FormData,
): Promise<ActionResult<{ path: string }>> {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const file = formData.get("file") as File;
    if (!file || file.size === 0) return { success: false, error: "No file provided" };

    if (!file.type.startsWith("image/")) return { success: false, error: "Please select an image file" };
    if (file.size > 5 * 1024 * 1024) return { success: false, error: "Image must be less than 5MB" };

    const oldAvatarPathOrUrl = formData.get("oldAvatarPath") as string | null;

    const supabase = await createClient();

    if (oldAvatarPathOrUrl) {
        const oldPath = normalizeToPath(oldAvatarPathOrUrl, STORAGE_BUCKETS.AVATARS);
        if (oldPath) {
            const del = await deleteStorageFile(STORAGE_BUCKETS.AVATARS, oldPath);
            if (!del.success) {
                logger.warn({ oldPath, error: del.error }, "Failed to delete old avatar");
            }
        }
    }

    const filePath = `${userId}/${Date.now()}.webp`;

    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (error) {
        logger.error({ error: error.message }, "[Upload] Avatar storage error");
        return { success: false, error: "Failed to upload image" };
    }

    return { success: true, data: { path: data.path } };
}

/**
 * Update user profile fields (fullName, username, phone, momoNumber, momoNetwork, avatarUrl).
 */
export async function updateUserProfile(
    formData: FormData,
): Promise<ActionResult> {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: "Not authenticated" };

    const fullName = (formData.get("fullName") as string)?.trim() || undefined;
    const username = (formData.get("username") as string)?.trim() || undefined;
    const momoNumber = (formData.get("momoNumber") as string)?.trim() || undefined;
    const momoNetwork = (formData.get("momoNetwork") as string)?.trim() || undefined;
    const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || undefined;

    // Validate username uniqueness if changed
    if (username) {
        const available = await isUsernameAvailable(username, userId);
        if (!available) {
            return { success: false, error: "Username is already taken" };
        }
        // Basic format validation
        if (!/^[a-z0-9_]{3,30}$/.test(username)) {
            return { success: false, error: "Username must be 3–30 lowercase alphanumeric characters or underscores" };
        }
    }

    const updated = await updateProfile(userId, {
        fullName,
        username,
        momoNumber,
        momoNetwork,
        avatarUrl,
    });

    if (!updated) return { success: false, error: "Failed to save profile" };

    revalidatePath("/", "layout");
    return { success: true };
}
