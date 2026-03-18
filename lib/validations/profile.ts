/**
 * Profile & Onboarding Validation Schemas
 * Using Zod for type-safe validation
 */

import { z } from "zod";

// Username validation - alphanumeric, underscores, 3-30 chars
export const usernameSchema = z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
    );

// Full name validation
export const fullNameSchema = z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, and hyphens");

// Avatar URL/path validation (optional, accepts storage paths or full URLs)
export const avatarUrlSchema = z.string().optional().or(z.literal(""));

// Step 1: Welcome - Username selection (fullName already collected at registration)
export const onboardingStep1Schema = z.object({
    username: usernameSchema,
});

// Step 2: Avatar upload (optional)
export const onboardingStep2Schema = z.object({
    avatarUrl: avatarUrlSchema,
});

// Step 3: Referral code (optional)
export const onboardingStep3Schema = z.object({
    referralCode: z
        .string()
        .max(20, "Referral code must be at most 20 characters")
        .optional()
        .or(z.literal("")),
});

// Complete onboarding schema (all steps combined)
export const completeOnboardingSchema = z.object({
    fullName: fullNameSchema,
    username: usernameSchema,
    avatarUrl: avatarUrlSchema,
    referralCode: z.string().optional().or(z.literal("")),
});

// Profile update schema (for later profile edits)
export const updateProfileSchema = z.object({
    fullName: fullNameSchema.optional(),
    username: usernameSchema.optional(),
    avatarUrl: avatarUrlSchema,
});

// Type exports
export type OnboardingStep1Data = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Data = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3Data = z.infer<typeof onboardingStep3Schema>;
export type CompleteOnboardingData = z.infer<typeof completeOnboardingSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;

// Onboarding steps configuration
export const ONBOARDING_STEPS = [
    { id: 1, title: "Welcome", description: "Let's set up your profile" },
    { id: 2, title: "Avatar", description: "Add a profile picture" },
    { id: 3, title: "Referral", description: "Got a referral code?" },
] as const;

export const TOTAL_ONBOARDING_STEPS = ONBOARDING_STEPS.length;
