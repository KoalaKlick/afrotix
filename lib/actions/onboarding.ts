/**
 * Onboarding Server Actions
 * Handles form submissions for the onboarding flow
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
    onboardingStep1Schema,
    onboardingStep2Schema,
    onboardingStep3Schema,
    TOTAL_ONBOARDING_STEPS,
} from "@/lib/validations/profile";
import {
    updateProfile,
    isUsernameAvailable,
    applyReferralCode,
    ensureProfile,
} from "@/lib/dal/profile";
import { validateReferralCode } from "@/lib/dal/promoter";
import {
    STORAGE_BUCKETS,
    deleteStorageFile,
    normalizeToPath,
} from "@/lib/storage-utils";
import { logger } from "@/lib/logger";

// Action result type
type ActionResult<T = void> = {
    success: boolean;
    error?: string;
    data?: T;
};

/**
 * Get current user from Supabase auth
 */
async function getCurrentUser(): Promise<{
    id: string;
    email: string;
    fullName?: string;
} | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    return {
        id: user.id,
        email: user.email ?? "",
        fullName: user.user_metadata?.full_name,
    };
}

/**
 * Step 1: Save basic profile info (name & username)
 */
export async function saveOnboardingStep1(
    formData: FormData,
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    // Ensure profile exists (create if needed)
    const profile = await ensureProfile(user.id, user.email, user.fullName);
    if (!profile) {
        return { success: false, error: "Failed to initialize profile" };
    }

    // Parse and validate form data
    const rawData = {
        username: formData.get("username") as string,
    };

    const result = onboardingStep1Schema.safeParse(rawData);
    if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] ?? "Invalid input";
        return { success: false, error: firstError };
    }

    // Check username availability
    const usernameAvailable = await isUsernameAvailable(result.data.username, user.id);
    if (!usernameAvailable) {
        return { success: false, error: "Username is already taken" };
    }

    // Update profile
    const updated = await updateProfile(user.id, {
        username: result.data.username,
        onboardingStep: 1,
    });

    if (!updated) {
        return { success: false, error: "Failed to save profile" };
    }

    revalidatePath("/onboarding");
    return { success: true };
}

/**
 * Upload avatar to Supabase Storage
 * @param formData - Form data containing the file and optional old avatar path
 * @returns The storage path (not full URL) of the uploaded avatar
 */
export async function uploadAvatar(
    formData: FormData,
): Promise<ActionResult<{ path: string }>> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
        return { success: false, error: "No file provided" };
    }

    // Get old avatar path/URL if provided (for deletion)
    const oldAvatarPathOrUrl = formData.get("oldAvatarPath") as string | null;

    // Validate file type
    if (!file.type.startsWith("image/")) {
        return { success: false, error: "Please select an image file" };
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: "Image must be less than 5MB" };
    }

    const supabase = await createClient();

    // Delete old avatar if exists
    if (oldAvatarPathOrUrl) {
        const oldPath = normalizeToPath(oldAvatarPathOrUrl, STORAGE_BUCKETS.AVATARS);
        if (oldPath) {
            const deleteResult = await deleteStorageFile(STORAGE_BUCKETS.AVATARS, oldPath);
            if (!deleteResult.success) {
                logger.warn({ oldPath, error: deleteResult.error }, "Failed to delete old avatar, continuing with upload");
            }
        }
    }

    // Generate unique filename with .webp extension (file should already be converted)
    const filePath = `${user.id}/${Date.now()}.webp`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
        });

    if (error) {
        logger.error({ error: error.message }, "[Upload] Storage error");
        return { success: false, error: "Failed to upload image" };
    }

    // Return the path (not the full URL)
    return { success: true, data: { path: data.path } };
}

/**
 * Step 2: Save avatar URL
 */
export async function saveOnboardingStep2(
    formData: FormData,
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }
    const userId = user.id;

    const rawData = {
        avatarUrl: formData.get("avatarUrl") as string || undefined,
    };

    const result = onboardingStep2Schema.safeParse(rawData);
    if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] ?? "Invalid input";
        return { success: false, error: firstError };
    }

    const updated = await updateProfile(userId, {
        avatarUrl: result.data.avatarUrl || undefined,
        onboardingStep: 2,
    });

    if (!updated) {
        return { success: false, error: "Failed to save avatar" };
    }

    revalidatePath("/onboarding");
    return { success: true };
}

/**
 * Step 3: Apply referral code and complete onboarding
 */
export async function saveOnboardingStep3(
    formData: FormData,
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }
    const userId = user.id;

    const rawData = {
        referralCode: formData.get("referralCode") as string || undefined,
    };

    const result = onboardingStep3Schema.safeParse(rawData);
    if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] ?? "Invalid input";
        return { success: false, error: firstError };
    }

    // If referral code provided, validate and apply
    if (result.data.referralCode?.trim()) {
        const validation = await validateReferralCode(result.data.referralCode);
        if (!validation.valid) {
            return { success: false, error: validation.message };
        }

        if (validation.promoterId) {
            await applyReferralCode(userId, result.data.referralCode, validation.promoterId);
        }
    }

    // Mark onboarding as complete
    const updated = await updateProfile(userId, {
        onboardingStep: TOTAL_ONBOARDING_STEPS,
        onboardingCompleted: true,
    });

    if (!updated) {
        return { success: false, error: "Failed to complete onboarding" };
    }

    revalidatePath("/onboarding");
    revalidatePath("/dashboard");
    return { success: true };
}

/**
 * Skip current step (for optional steps like avatar, referral)
 */
export async function skipOnboardingStep(
    currentStep: number,
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }
    const userId = user.id;

    const nextStep = currentStep + 1;
    const isLastStep = nextStep >= TOTAL_ONBOARDING_STEPS;

    const updated = await updateProfile(userId, {
        onboardingStep: nextStep,
        onboardingCompleted: isLastStep,
    });

    if (!updated) {
        return { success: false, error: "Failed to skip step" };
    }

    revalidatePath("/onboarding");
    return { success: true };
}

/**
 * Check username availability (for real-time validation)
 */
export async function checkUsernameAvailability(
    username: string,
): Promise<ActionResult<{ available: boolean }>> {
    const user = await getCurrentUser();

    // Validate format first
    const validation = onboardingStep1Schema.shape.username.safeParse(username);
    if (!validation.success) {
        return {
            success: false,
            error: validation.error.issues[0]?.message ?? "Invalid username",
        };
    }

    const available = await isUsernameAvailable(username, user?.id);
    return { success: true, data: { available } };
}

/**
 * Complete onboarding and redirect through the setup router
 */
export async function finishOnboarding(): Promise<void> {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/auth/login");
    }

    await updateProfile(user.id, {
        onboardingCompleted: true,
        onboardingStep: TOTAL_ONBOARDING_STEPS,
    });

    revalidatePath("/onboarding");
    revalidatePath("/dashboard");
    redirect("/onboarding");
}
