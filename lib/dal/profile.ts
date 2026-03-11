/**
 * Profile Data Access Layer (DAL)
 * Server-side database operations for user profiles
 * Uses Prisma for type-safe database queries
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import type { Profile } from "@/lib/generated/prisma";

// Types for DAL operations
export type ProfileCreateInput = {
    id: string;
    email: string;
    fullName?: string;
    username?: string;
    avatarUrl?: string;
    referralCodeUsed?: string;
};

export type ProfileUpdateInput = {
    fullName?: string;
    username?: string;
    avatarUrl?: string;
    onboardingStep?: number;
    onboardingCompleted?: boolean;
    referredBy?: string;
    referralCodeUsed?: string;
};

/**
 * Get profile by user ID
 * Uses React cache for request deduplication
 */
export const getProfileById = cache(async (id: string): Promise<Profile | null> => {
    try {
        return await prisma.profile.findUnique({
            where: { id },
        });
    } catch (error) {
        console.error("[DAL] Error fetching profile:", error);
        return null;
    }
});

/**
 * Get profile with promoter status
 * Used for sidebar to determine if promoter features should be shown
 */
export type ProfileWithPromoterStatus = Profile & { isPromoter: boolean };

export const getProfileWithPromoterStatus = cache(
    async (id: string): Promise<ProfileWithPromoterStatus | null> => {
        try {
            const profile = await prisma.profile.findUnique({
                where: { id },
                include: { promoter: { select: { id: true } } },
            });

            if (!profile) return null;

            return {
                ...profile,
                isPromoter: !!profile.promoter,
            };
        } catch (error) {
            console.error("[DAL] Error fetching profile with promoter status:", error);
            return null;
        }
    }
);

/**
 * Get profile by email
 */
export const getProfileByEmail = cache(async (email: string): Promise<Profile | null> => {
    try {
        return await prisma.profile.findUnique({
            where: { email },
        });
    } catch (error) {
        console.error("[DAL] Error fetching profile by email:", error);
        return null;
    }
});

/**
 * Get profile by username
 */
export const getProfileByUsername = cache(async (username: string): Promise<Profile | null> => {
    try {
        return await prisma.profile.findUnique({
            where: { username },
        });
    } catch (error) {
        console.error("[DAL] Error fetching profile by username:", error);
        return null;
    }
});

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    try {
        const existing = await prisma.profile.findUnique({
            where: { username },
            select: { id: true },
        });

        if (!existing) return true;
        if (excludeUserId && existing.id === excludeUserId) return true;
        return false;
    } catch (error) {
        console.error("[DAL] Error checking username availability:", error);
        return false;
    }
}

/**
 * Create a new profile
 */
export async function createProfile(data: ProfileCreateInput): Promise<Profile | null> {
    try {
        return await prisma.profile.create({
            data: {
                id: data.id,
                email: data.email,
                fullName: data.fullName,
                username: data.username,
                avatarUrl: data.avatarUrl,
                referralCodeUsed: data.referralCodeUsed,
                onboardingStep: 0,
                onboardingCompleted: false,
            },
        });
    } catch (error) {
        console.error("[DAL] Error creating profile:", error);
        return null;
    }
}

/**
 * Update profile
 */
export async function updateProfile(
    id: string,
    data: ProfileUpdateInput,
): Promise<Profile | null> {
    try {
        return await prisma.profile.update({
            where: { id },
            data,
        });
    } catch (error) {
        console.error("[DAL] Error updating profile:", error);
        return null;
    }
}

/**
 * Update onboarding step
 */
export async function updateOnboardingStep(
    id: string,
    step: number,
): Promise<Profile | null> {
    try {
        return await prisma.profile.update({
            where: { id },
            data: { onboardingStep: step },
        });
    } catch (error) {
        console.error("[DAL] Error updating onboarding step:", error);
        return null;
    }
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(
    id: string,
    data: {
        fullName: string;
        username: string;
        avatarUrl?: string;
    },
): Promise<Profile | null> {
    try {
        return await prisma.profile.update({
            where: { id },
            data: {
                ...data,
                onboardingCompleted: true,
                onboardingStep: 3, // Final step
            },
        });
    } catch (error) {
        console.error("[DAL] Error completing onboarding:", error);
        return null;
    }
}

/**
 * Get onboarding status
 */
export async function getOnboardingStatus(id: string): Promise<{
    completed: boolean;
    step: number;
} | null> {
    try {
        const profile = await prisma.profile.findUnique({
            where: { id },
            select: {
                onboardingCompleted: true,
                onboardingStep: true,
            },
        });

        if (!profile) return null;

        return {
            completed: profile.onboardingCompleted,
            step: profile.onboardingStep,
        };
    } catch (error) {
        console.error("[DAL] Error getting onboarding status:", error);
        return null;
    }
}

/**
 * Apply referral code to profile
 */
export async function applyReferralCode(
    profileId: string,
    referralCode: string,
    promoterId: string,
): Promise<Profile | null> {
    try {
        return await prisma.profile.update({
            where: { id: profileId },
            data: {
                referralCodeUsed: referralCode,
                referredBy: promoterId,
            },
        });
    } catch (error) {
        console.error("[DAL] Error applying referral code:", error);
        return null;
    }
}

/**
 * Ensure profile exists - creates if not found
 * Used during onboarding when profile may not exist yet
 */
export async function ensureProfile(
    id: string,
    email: string,
    fullName?: string,
): Promise<Profile | null> {
    try {
        // Try to find existing profile
        const existing = await prisma.profile.findUnique({
            where: { id },
        });

        if (existing) return existing;

        // Create new profile if it doesn't exist
        return await prisma.profile.create({
            data: {
                id,
                email,
                fullName,
                onboardingStep: 0,
                onboardingCompleted: false,
            },
        });
    } catch (error) {
        console.error("[DAL] Error ensuring profile:", error);
        return null;
    }
}
