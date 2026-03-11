/**
 * Organization Validation Schemas
 * Using Zod for type-safe validation
 */

import { z } from "zod";

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
    );

// Description validation (optional)
export const organizationDescriptionSchema = z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .or(z.literal(""));

// URL validation (optional)
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
    logoUrl: urlSchema,
    description: organizationDescriptionSchema,
});

// Step 3: Contact & customize (optional)
export const createOrgStep3Schema = z.object({
    contactEmail: organizationEmailSchema,
    websiteUrl: urlSchema,
    primaryColor: colorSchema,
    secondaryColor: colorSchema,
});

// Complete organization creation schema
export const createOrganizationSchema = z.object({
    name: organizationNameSchema,
    slug: organizationSlugSchema,
    description: organizationDescriptionSchema,
    logoUrl: urlSchema,
    contactEmail: organizationEmailSchema,
    websiteUrl: urlSchema,
    primaryColor: colorSchema,
    secondaryColor: colorSchema,
});

// Update organization schema
export const updateOrganizationSchema = z.object({
    name: organizationNameSchema.optional(),
    slug: organizationSlugSchema.optional(),
    description: organizationDescriptionSchema,
    logoUrl: urlSchema,
    bannerUrl: urlSchema,
    faviconUrl: urlSchema,
    contactEmail: organizationEmailSchema,
    websiteUrl: urlSchema,
    primaryColor: colorSchema,
    secondaryColor: colorSchema,
});

// Type exports
export type CreateOrgStep1Data = z.infer<typeof createOrgStep1Schema>;
export type CreateOrgStep2Data = z.infer<typeof createOrgStep2Schema>;
export type CreateOrgStep3Data = z.infer<typeof createOrgStep3Schema>;
export type CreateOrganizationData = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationData = z.infer<typeof updateOrganizationSchema>;

// Organization creation steps configuration
export const ORG_CREATION_STEPS = [
    { id: 1, title: "Basic Info", description: "Name your organization" },
    { id: 2, title: "Branding", description: "Add logo and description" },
    { id: 3, title: "Customize", description: "Contact and colors" },
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
