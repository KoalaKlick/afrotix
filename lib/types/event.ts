/**
 * Event Types & Interfaces
 */

export interface EventSponsor {
    id?: string;
    name: string;
    logo?: string | null;
}

export interface EventSocialLink {
    id?: string;
    url: string;
}

export interface EventGalleryLink {
    id?: string;
    name: string;
    url: string;
}

export interface EventFormData {
    title: string;
    slug: string;
    type: string;
    status?: string;
    votingMode?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    timezone?: string;
    isVirtual?: boolean;
    virtualLink?: string;
    venueName?: string;
    venueAddress?: string;
    venueCity?: string;
    venueCountry?: string;
    coverImage?: string;
    bannerImage?: string;
    maxAttendees?: number | null;
    isPublic?: boolean;
    sponsors?: EventSponsor[];
    socialLinks?: EventSocialLink[];
    galleryLinks?: EventGalleryLink[];
}

export interface EventOriginalData {
    description?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    timezone: string;
    isVirtual: boolean;
    virtualLink?: string | null;
    venueName?: string | null;
    venueAddress?: string | null;
    venueCity?: string | null;
    venueCountry: string;
    isPublic: boolean;
    maxAttendees?: number | null;
    type?: string;
    sponsors?: EventSponsor[];
    socialLinks?: EventSocialLink[];
    galleryLinks?: EventGalleryLink[];
}
