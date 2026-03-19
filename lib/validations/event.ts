/**
 * Event Validation Schemas
 * Using Zod for type-safe validation
 */

import { z } from "zod";

// Event title validation
export const eventTitleSchema = z
    .string()
    .min(3, "Event title must be at least 3 characters")
    .max(200, "Event title must be at most 200 characters");

// Slug validation - URL-friendly identifier
export const eventSlugSchema = z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug must be at most 100 characters")
    .regex(
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
    );

// Description validation (optional)
export const eventDescriptionSchema = z
    .string()
    .max(5000, "Description must be at most 5000 characters")
    .optional()
    .or(z.literal(""));

// Event type enum
export const eventTypeSchema = z.enum(["voting", "ticketed", "advertisement", "hybrid"], {
    error: "Please select a valid event type",
});

// Storage path validation (for uploaded images stored in Supabase)
export const storagePathSchema = z
    .string()
    .optional()
    .or(z.literal(""));

// URL validation (for actual URLs like virtual meeting links)
export const urlSchema = z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal(""));

// Date validation
export const eventDateSchema = z
    .string()
    .datetime({ message: "Invalid date format" })
    .or(z.date())
    .optional();

// Venue validation
export const venueNameSchema = z
    .string()
    .max(200, "Venue name must be at most 200 characters")
    .optional()
    .or(z.literal(""));

export const venueAddressSchema = z
    .string()
    .max(500, "Venue address must be at most 500 characters")
    .optional()
    .or(z.literal(""));

export const venueCitySchema = z
    .string()
    .max(100, "City must be at most 100 characters")
    .optional()
    .or(z.literal(""));

export const venueCountrySchema = z
    .string()
    .max(100, "Country must be at most 100 characters")
    .default("Nigeria");

// Max attendees validation
export const maxAttendeesSchema = z
    .number()
    .int()
    .min(1, "Must have at least 1 attendee")
    .max(100000, "Maximum 100,000 attendees")
    .optional()
    .nullable();

// Timezone validation
export const timezoneSchema = z
    .string()
    .default("Africa/Lagos");

// Step 1: Basic info - Title, type, and slug
export const createEventStep1Schema = z.object({
    title: eventTitleSchema,
    slug: eventSlugSchema,
    type: eventTypeSchema,
    description: eventDescriptionSchema,
});

// Step 2: Date & Location
export const createEventStep2Schema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    timezone: timezoneSchema,
    isVirtual: z.boolean().default(false),
    virtualLink: urlSchema,
    venueName: venueNameSchema,
    venueAddress: venueAddressSchema,
    venueCity: venueCitySchema,
    venueCountry: venueCountrySchema,
});

// Step 3: Media & Settings
export const createEventStep3Schema = z.object({
    coverImage: storagePathSchema,
    bannerImage: storagePathSchema,
    maxAttendees: z.coerce.number().int().min(1).max(100000).optional().nullable(),
    isPublic: z.boolean().default(true),
});

// Complete event creation schema
export const createEventSchema = z.object({
    title: eventTitleSchema,
    slug: eventSlugSchema,
    type: eventTypeSchema,
    description: eventDescriptionSchema,
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    timezone: timezoneSchema,
    isVirtual: z.boolean().default(false),
    virtualLink: urlSchema,
    venueName: venueNameSchema,
    venueAddress: venueAddressSchema,
    venueCity: venueCitySchema,
    venueCountry: venueCountrySchema,
    coverImage: storagePathSchema,
    bannerImage: storagePathSchema,
    maxAttendees: z.coerce.number().int().min(1).max(100000).optional().nullable(),
    isPublic: z.boolean().default(true),
});

// Type exports
export type CreateEventStep1Input = z.infer<typeof createEventStep1Schema>;
export type CreateEventStep2Input = z.infer<typeof createEventStep2Schema>;
export type CreateEventStep3Input = z.infer<typeof createEventStep3Schema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;

// Constants
export const TOTAL_EVENT_CREATION_STEPS = 3;

// Event types for UI display
export const EVENT_TYPES = [
    {
        value: "ticketed" as const,
        label: "Ticketed Event",
        description: "Sell tickets to your event",
        icon: "Ticket",
    },
    {
        value: "voting" as const,
        label: "Voting Event",
        description: "Run polls or award shows with voting",
        icon: "Vote",
    },
    {
        value: "hybrid" as const,
        label: "Hybrid Event",
        description: "Combine tickets with voting",
        icon: "Layers",
    },
    {
        value: "advertisement" as const,
        label: "Advertisement",
        description: "Promote your event or business",
        icon: "Megaphone",
    },
] as const;
