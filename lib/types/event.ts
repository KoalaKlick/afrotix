/**
 * Event Types & Interfaces
 */

export interface EventSponsor {
  id?: string;
  name: string;
  logo: string | null;
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
  status: string;
  votingMode?: string;
  description: string;
  startDate: string;
  endDate: string;
  timezone: string;
  isVirtual: boolean;
  virtualLink: string;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueCountry: string;
  flierImage?: string;
  bannerImage?: string;
  maxAttendees: number | null;
  isPublic: boolean;
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

export interface EventDetailOrganization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  paystackBankCode?: string | null;
  paystackAccountNumber?: string | null;
  paystackAccountName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventDetailEvent {
  id: string;
  organizationId: string;
  creatorId?: string | null;
  title: string;
  slug: string;
  type: string;
  status: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  timezone: string;
  isVirtual: boolean;
  virtualLink: string | null;
  venueName: string | null;
  venueAddress: string | null;
  venueCity: string | null;
  venueCountry: string;
  flierImage?: string | null;
  bannerImage?: string | null;
  maxAttendees?: number | null;
  isPublic: boolean;
  votingMode?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  sponsors?: (EventSponsor & { createdAt?: string; updatedAt?: string })[];
  socialLinks?: (EventSocialLink & {
    createdAt?: string;
    updatedAt?: string;
  })[];
  galleryLinks?: (EventGalleryLink & {
    createdAt?: string;
    updatedAt?: string;
  })[];
  organization: EventDetailOrganization;
}
