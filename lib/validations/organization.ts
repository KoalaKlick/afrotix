/**
 * Organization Validation Schemas
 * Using Zod for type-safe validation
 */

import { z } from "zod";

/**
 * Reserved slugs that cannot be used for organizations
 * These match existing routes and common system paths
 */
export const RESERVED_SLUGS = [
    // Website routes
    "contact",
    "events",
    "about",
    "help",
    "support",
    "terms",
    "privacy",
    "blog",
    "news",
    "pricing",
    "features",
    "faq",

    // Auth routes
    "auth",
    "login",
    "register",
    "signup",
    "signin",
    "logout",
    "signout",
    "callback",
    "verify",
    "reset-password",
    "forgot-password",
    "confirmed",

    // Protected/app routes
    "dashboard",
    "settings",
    "profile",
    "account",
    "organization",
    "organizations",
    "org",
    "my-events",
    "promoter",
    "admin",
    "api",

    // System/common
    "app",
    "static",
    "assets",
    "public",
    "www",
    "mail",
    "email",
    "cdn",
    "img",
    "images",
    "js",
    "css",
    "fonts",
    "new",
    "create",
    "edit",
    "delete",
    "manage",
    "invite",
    "invitations",
    "join",
    "leave",
    "search",
    "explore",
    "discover",
    "home",
    "index",
    "404",
    "500",
    "error",
] as const;

export type ReservedSlug = (typeof RESERVED_SLUGS)[number];

/**
 * Check if a slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
    return RESERVED_SLUGS.includes(slug.toLowerCase() as ReservedSlug);
}

// Organization name validation
export const organizationNameSchema = z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be at most 100 characters")
    .regex(
        /^[a-zA-Z0-9\s&'-]+$/,
        "Organization name can only contain letters, numbers, spaces, &, ', and hyphens",
    );

// Slug validation - URL-friendly identifier
export const organizationSlugSchema = z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug must be at most 50 characters")
    .regex(
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
    )
    .refine((slug) => !isReservedSlug(slug), {
        message: "This slug is reserved and cannot be used",
    });

// Description validation (optional)
export const organizationDescriptionSchema = z
    .string()
    .max(5000, "Description must be at most 5000 characters")
    .optional()
    .or(z.literal(""));

// Storage path validation (for uploaded images stored in Supabase)
export const storagePathSchema = z
    .string()
    .optional()
    .or(z.literal(""));

// URL validation (for actual URLs like website links)
export const urlSchema = z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal(""));

// Color validation (hex format)
export const colorSchema = z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional();

// Email validation (optional)
export const organizationEmailSchema = z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal(""));

// Step 1: Basic info - Name and slug
export const createOrgStep1Schema = z.object({
    name: organizationNameSchema,
    slug: organizationSlugSchema,
});

// Step 2: Branding - Logo and description
export const createOrgStep2Schema = z.object({
    logoUrl: storagePathSchema,
    description: organizationDescriptionSchema,
});

// Step 3: Contact & customize (optional)
export const createOrgStep3Schema = z.object({
    contactEmail: organizationEmailSchema,
    websiteUrl: urlSchema,
    primaryColor: colorSchema,
    secondaryColor: colorSchema,
});

// Complete organization creation schema (used during onboarding)
export const createOrganizationSchema = z.object({
    name: organizationNameSchema,
    slug: organizationSlugSchema,
    description: organizationDescriptionSchema,
    logoUrl: storagePathSchema,
});

// Update organization schema
export const updateOrganizationSchema = z.object({
    name: organizationNameSchema.optional(),
    slug: organizationSlugSchema.optional(),
    description: organizationDescriptionSchema,
    logoUrl: storagePathSchema,
    bannerUrl: storagePathSchema,
    faviconUrl: storagePathSchema,
    contactEmail: organizationEmailSchema,
    websiteUrl: urlSchema,
    primaryColor: colorSchema,
    secondaryColor: colorSchema,
    phone: z.string().optional().or(z.literal("")),
    socialLinks: z.array(z.string().url("Invalid social URL")).optional(),
});

// Type exports
export type CreateOrgStep1Data = z.infer<typeof createOrgStep1Schema>;
export type CreateOrgStep2Data = z.infer<typeof createOrgStep2Schema>;
export type CreateOrganizationData = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationData = z.infer<typeof updateOrganizationSchema>;

// Organization creation steps configuration
export const ORG_CREATION_STEPS = [
    { id: 1, title: "Basic Info", description: "Name your organization" },
    { id: 2, title: "Branding", description: "Add logo and description" },
] as const;

export const TOTAL_ORG_CREATION_STEPS = ORG_CREATION_STEPS.length;

// Helper to generate slug from name
export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);
}
