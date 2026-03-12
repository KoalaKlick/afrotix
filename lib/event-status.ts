import type { EventStatus } from "@/lib/generated/prisma";

type EventLike = {
    status: string;
    isPublic?: boolean;
    startDate?: Date | string | null;
    endDate?: Date | string | null;
};

export type EventPublicationStatus = "draft" | "published";
export type EventLifecycleStatus = "draft" | "published" | "upcoming" | "ongoing" | "ended";

const LEGACY_HIDDEN_STATUSES = new Set(["draft", "cancelled"]);

function toDate(value: Date | string | null | undefined): Date | null {
    if (!value) return null;

    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

export function getEventPublicationStatus(status: string): EventPublicationStatus {
    return LEGACY_HIDDEN_STATUSES.has(status) ? "draft" : "published";
}

export function isEventPublished(status: string): boolean {
    return getEventPublicationStatus(status) === "published";
}

export function isEventPubliclyVisible(event: EventLike): boolean {
    return Boolean(event.isPublic) && isEventPublished(event.status);
}

export function canUserAccessEvent(event: EventLike, isOrganizationMember: boolean): boolean {
    return isEventPublished(event.status) && (Boolean(event.isPublic) || isOrganizationMember);
}

export function getEventLifecycleStatus(event: EventLike, now = new Date()): EventLifecycleStatus {
    if (!isEventPublished(event.status)) {
        return "draft";
    }

    const startDate = toDate(event.startDate);
    const endDate = toDate(event.endDate);

    if (endDate && endDate < now) {
        return "ended";
    }

    if (startDate && startDate > now) {
        return "upcoming";
    }

    if (startDate && startDate <= now && (!endDate || endDate >= now)) {
        return "ongoing";
    }

    return "published";
}

export function normalizeEventStatus(status: string): EventStatus {
    return isEventPublished(status) ? "published" : "draft";
}
