import { Ticket, Vote, Layers, Megaphone } from "lucide-react";
import type { OrganizationRole } from "@/lib/generated/prisma";

export interface EventData {
    id: string;
    title: string;
    slug: string;
    type: string;
    status: string;
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
    coverImage?: string | null;
    bannerImage?: string | null;
    maxAttendees?: number | null;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string | null;
}

export type VotingOptionStatus = "pending" | "approved" | "rejected";

export interface FieldValue {
    fieldId: string;
    value: string;
}

export interface VotingOption {
    id: string;
    optionText: string;
    nomineeCode: string | null;
    email: string | null;
    description: string | null;
    imageUrl: string | null;
    finalImage: string | null;
    status: VotingOptionStatus;
    isPublicNomination: boolean;
    nominatedByName: string | null;
    votesCount: number;
    orderIdx: number;
    fieldValues?: FieldValue[];
}

export interface VotingCategory {
    id: string;
    name: string;
    description: string | null;
    maxVotesPerUser: number;
    allowMultiple: boolean;
    templateImage: string | null;
    templateConfig: unknown;
    showFinalImage: boolean;
    allowPublicNomination: boolean;
    nominationDeadline: string | Date | null;
    requireApproval: boolean;
    orderIdx: number;
    votingOptions: VotingOption[];
}

export interface EventDetailClientProps {
    readonly event: EventData;
    readonly organizationSlug?: string;
    readonly userRole: OrganizationRole;
    readonly votingCategories?: VotingCategory[];
}

export interface EventFormData {
    title: string;
    slug: string;
    status: string;
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
    coverImage: string;
    bannerImage: string;
    maxAttendees: string;
    isPublic: boolean;
}

export const typeIcons: Record<string, typeof Ticket> = {
    ticketed: Ticket,
    voting: Vote,
    hybrid: Layers,
    advertisement: Megaphone,
};

export const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    ongoing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    ended: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};
