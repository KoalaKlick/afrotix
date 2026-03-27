/**
 * Branding constants for the application
 */
export const PROJ_NAME = process.env.NEXT_PUBLIC_PROJ_NAME || process.env.PROJ_NAME || "Afrotix";

export const DOMAIN_NAME = process.env.NEXT_PUBLIC_DOMAIN_URL 
    ? new URL(process.env.NEXT_PUBLIC_DOMAIN_URL).hostname 
    : "afrotix.com";
