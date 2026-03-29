/**
 * Event Constants
 * Centralized settings for event-related configurations
 */

export const MAX_SPONSORS = 10;
export const MAX_GALLERY_LINKS = 2;
export const MAX_SOCIAL_LINKS = 5;

export const SOCIAL_PLATFORMS = {
    WHATSAPP: "whatsapp",
    TELEGRAM: "telegram",
    FACEBOOK: "facebook",
    X: "x",
    INSTAGRAM: "instagram",
} as const;

export const PHOTO_PROVIDERS = {
    GOOGLE_DRIVE: "google_drive",
    PIXIESET: "pixieset",
    TELEGRAM: "telegram",
    DROPBOX: "dropbox",
    GENERIC: "generic",
} as const;
