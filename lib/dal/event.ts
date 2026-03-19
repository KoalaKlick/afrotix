import { logger } from '@/lib/logger';
/**
 * Event Data Access Layer (DAL)
 * Server-side database operations for events
 * Uses Prisma for type-safe database queries
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import type { Event, EventType, EventStatus } from "@/lib/generated/prisma";
import { normalizeEventStatus } from "@/lib/event-status";

// Types for DAL operations
export type EventCreateInput = {
    organizationId: string;
    creatorId: string;
    title: string;
    slug: string;
    type: EventType;
    description?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    timezone?: string;
    isPublic?: boolean;
    coverImage?: string;
    bannerImage?: string;
    venueName?: string;
    venueAddress?: string;
    venueCity?: string;
    venueCountry?: string;
    isVirtual?: boolean;
    virtualLink?: string;
    maxAttendees?: number;
};

export type EventUpdateInput = Partial<Omit<EventCreateInput, "organizationId" | "creatorId">>;

export type EventWithStats = Event & {
    ticketsSold?: number;
    revenue?: number;
    attendeesCount?: number;
};

/**
 * Get event by ID
 * Uses React cache for request deduplication
 */
export const getEventById = cache(async (id: string): Promise<Event | null> => {
    try {
        return await prisma.event.findUnique({
            where: { id },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching event:");
        return null;
    }
});

/**
 * Get event by slug within an organization
 */
export const getEventBySlug = cache(async (organizationId: string, slug: string): Promise<Event | null> => {
    try {
        return await prisma.event.findUnique({
            where: {
                organizationId_slug: { organizationId, slug },
            },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching event by slug:");
        return null;
    }
});

/**
 * Check if event slug is available within an organization
 */
export async function isEventSlugAvailable(organizationId: string, slug: string): Promise<boolean> {
    try {
        const existing = await prisma.event.findUnique({
            where: {
                organizationId_slug: { organizationId, slug },
            },
            select: { id: true },
        });
        return !existing;
    } catch (error) {
        logger.error(error, "[DAL] Error checking event slug:");
        return false;
    }
}

/**
 * Get events by organization
 */
export const getOrganizationEvents = cache(async (
    organizationId: string,
    options?: {
        status?: EventStatus;
        type?: EventType;
        limit?: number;
        offset?: number;
    }
): Promise<Event[]> => {
    try {
        const { status, type, limit = 50, offset = 0 } = options ?? {};

        logger.info({ organizationId, status, type, limit, offset }, "[DAL] Fetching organization events");

        const events = await prisma.event.findMany({
            where: {
                organizationId,
                ...(status && { status }),
                ...(type && { type }),
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
        });

        logger.info({ count: events.length, organizationId }, "[DAL] Found events");

        return events;
    } catch (error) {
        logger.error(error, "[DAL] Error fetching organization events:");
        return [];
    }
});

/**
 * Get upcoming events for an organization
 */
export const getUpcomingEvents = cache(async (
    organizationId: string,
    limit = 5
): Promise<Event[]> => {
    try {
        return await prisma.event.findMany({
            where: {
                organizationId,
                status: { notIn: ["draft", "cancelled"] },
                startDate: { gte: new Date() },
            },
            orderBy: { startDate: "asc" },
            take: limit,
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching upcoming events:");
        return [];
    }
});

/**
 * Get public events for the landing page or events list
 */
export const getPublicEvents = cache(async (options?: {
    limit?: number;
    offset?: number;
    type?: EventType;
    query?: string;
}): Promise<(Event & { organization: { slug: string; name: string } })[]> => {
    try {
        const { limit = 6, offset = 0, type, query } = options ?? {};

        return await prisma.event.findMany({
            where: {
                isPublic: true,
                status: { notIn: ["draft", "cancelled"] },
                ...(type && { type }),
                ...(query && {
                    title: {
                        contains: query,
                        mode: 'insensitive',
                    },
                }),
            },
            include: {
                organization: {
                    select: {
                        slug: true,
                        name: true,
                    }
                }
            },
            orderBy: { startDate: "asc" },
            take: limit,
            skip: offset,
        }) as (Event & { organization: { slug: string; name: string } })[];
    } catch (error) {
        logger.error(error, "[DAL] Error fetching public events:");
        return [];
    }
});

/**
 * Get events created by a user
 */
export const getUserCreatedEvents = cache(async (
    userId: string,
    limit = 50
): Promise<Event[]> => {
    try {
        return await prisma.event.findMany({
            where: { creatorId: userId },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching user created events:");
        return [];
    }
});

/**
 * Create new event
 */
export async function createEvent(data: EventCreateInput): Promise<Event> {
    const {
        organizationId,
        creatorId,
        title,
        slug,
        type,
        description,
        startDate,
        endDate,
        timezone = "Africa/Lagos",
        isPublic = true,
        coverImage,
        bannerImage,
        venueName,
        venueAddress,
        venueCity,
        venueCountry = "Nigeria",
        isVirtual = false,
        virtualLink,
        maxAttendees,
    } = data;

    logger.info({ organizationId, creatorId, title, slug, type, isPublic }, "[DAL] Creating event");

    const event = await prisma.event.create({
        data: {
            organizationId,
            creatorId,
            title,
            slug,
            type,
            description: description ?? null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            timezone,
            isPublic,
            coverImage: coverImage ?? null,
            bannerImage: bannerImage ?? null,
            venueName: venueName ?? null,
            venueAddress: venueAddress ?? null,
            venueCity: venueCity ?? null,
            venueCountry,
            isVirtual,
            virtualLink: virtualLink ?? null,
            maxAttendees: maxAttendees ?? null,
            status: "draft",
        },
    });

    logger.info({ eventId: event.id, organizationId: event.organizationId }, "[DAL] Event created");

    return event;
}

/**
 * Update event
 */
export async function updateEvent(id: string, data: EventUpdateInput): Promise<Event | null> {
    try {
        return await prisma.event.update({
            where: { id },
            data: {
                ...data,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
            },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error updating event:");
        return null;
    }
}

/**
 * Update event status
 */
export async function updateEventStatus(id: string, status: EventStatus): Promise<Event | null> {
    try {
        const normalizedStatus = normalizeEventStatus(status);
        const updateData: { status: EventStatus; publishedAt?: Date } = { status: normalizedStatus };

        // If publishing, set publishedAt
        if (normalizedStatus === "published") {
            updateData.publishedAt = new Date();
        }

        return await prisma.event.update({
            where: { id },
            data: updateData,
        });
    } catch (error) {
        logger.error(error, "[DAL] Error updating event status:");
        return null;
    }
}

/**
 * Delete event
 */
export async function deleteEvent(id: string): Promise<boolean> {
    try {
        await prisma.event.delete({
            where: { id },
        });
        return true;
    } catch (error) {
        logger.error(error, "[DAL] Error deleting event:");
        return false;
    }
}

/**
 * Get event statistics for an organization
 */



export const getOrganizationEventStats = cache(async (organizationId: string) => {
    try {
        logger.info({ organizationId }, "[DAL] Fetching event stats for organization");

        const now = new Date();

        // Run all queries in parallel for performance
        const [
            total,
            published,
            draft,
            ongoing,
            ended,
            cancelled,
            upcoming,
            votingCount,
            ticketedCount,
            hybridCount,
            advertisementCount,
            ticketStats,
            voteCount,
            mostAttended,
            nextUpcoming,
            recentEnded,
        ] = await Promise.all([
            // Basic counts
            prisma.event.count({ where: { organizationId } }),
            prisma.event.count({ where: { organizationId, status: { notIn: ["draft", "cancelled"] } } }),
            prisma.event.count({ where: { organizationId, status: "draft" } }),
            prisma.event.count({ where: {
                organizationId,
                status: { notIn: ["draft", "cancelled"] },
                startDate: { lte: now },
                OR: [{ endDate: null }, { endDate: { gte: now } }],
            } }),
            prisma.event.count({ where: {
                organizationId,
                status: { notIn: ["draft", "cancelled"] },
                endDate: { lt: now },
            } }),
            prisma.event.count({ where: { organizationId, status: "cancelled" } }),
            // Upcoming: published events with future start date
            prisma.event.count({
                where: {
                    organizationId,
                    status: { notIn: ["draft", "cancelled"] },
                    startDate: { gt: now },
                },
            }),

            // By type
            prisma.event.count({ where: { organizationId, type: "voting" } }),
            prisma.event.count({ where: { organizationId, type: "ticketed" } }),
            prisma.event.count({ where: { organizationId, type: "hybrid" } }),
            prisma.event.count({ where: { organizationId, type: "advertisement" } }),

            // Ticket/Revenue aggregation
            prisma.ticketOrder.aggregate({
                where: {
                    event: { organizationId },
                    status: { in: ["paid", "confirmed"] },
                },
                _sum: { total: true },
                _count: true,
            }),

            // Total votes across all events
            prisma.vote.count({
                where: { event: { organizationId } },
            }),

            // Most attended event (by ticket count)
            prisma.event.findFirst({
                where: { organizationId },
                orderBy: { tickets: { _count: "desc" } },
                select: {
                    id: true,
                    title: true,
                    _count: { select: { tickets: true } },
                },
            }),

            // Next upcoming event
            prisma.event.findFirst({
                where: {
                    organizationId,
                    status: { notIn: ["draft", "cancelled"] },
                    startDate: { gt: now },
                },
                orderBy: { startDate: "asc" },
                select: { id: true, title: true, startDate: true },
            }),

            // Most recent ended event
            prisma.event.findFirst({
                where: {
                    organizationId,
                    status: { notIn: ["draft", "cancelled"] },
                    endDate: { lt: now },
                },
                orderBy: { endDate: "desc" },
                select: { id: true, title: true, endDate: true },
            }),
        ]);

        // Get total checked-in attendees
        const totalAttendees = await prisma.ticket.count({
            where: {
                event: { organizationId },
                checkInStatus: "checked_in",
            },
        });

        const upcomingEventHighlight = nextUpcoming?.startDate
            ? {
                id: nextUpcoming.id,
                title: nextUpcoming.title,
                startDate: nextUpcoming.startDate,
            }
            : undefined;

        const recentEventHighlight = recentEnded?.endDate
            ? {
                id: recentEnded.id,
                title: recentEnded.title,
                endDate: recentEnded.endDate,
            }
            : undefined;

        const stats = {
            // Basic counts
            total,
            published,
            draft,
            ongoing,
            ended,
            cancelled,
            upcoming,

            // By event type
            byType: {
                voting: votingCount,
                ticketed: ticketedCount,
                hybrid: hybridCount,
                advertisement: advertisementCount,
            },

            // Engagement metrics
            totalTicketsSold: ticketStats._count,
            totalRevenue: Number(ticketStats._sum.total ?? 0),
            totalAttendees,
            totalVotes: voteCount,

            // Highlights
            mostAttendedEvent:
                mostAttended && mostAttended._count.tickets > 0
                    ? {
                        id: mostAttended.id,
                        title: mostAttended.title,
                        attendees: mostAttended._count.tickets,
                    }
                    : undefined,
            upcomingEvent: upcomingEventHighlight,
            recentEvent: recentEventHighlight,
        };

        logger.info({ organizationId, total, published, draft, ongoing }, "[DAL] Event stats");

        return stats;
    } catch (error) {
        logger.error(error, "[DAL] Error fetching event stats:");
        return {
            total: 0,
            published: 0,
            draft: 0,
            ongoing: 0,
            ended: 0,
            cancelled: 0,
            upcoming: 0,
            byType: { voting: 0, ticketed: 0, hybrid: 0, advertisement: 0 },
            totalTicketsSold: 0,
            totalRevenue: 0,
            totalAttendees: 0,
            totalVotes: 0,
        };
    }
});

/**
 * Generate unique slug for event
 */
export async function generateUniqueEventSlug(organizationId: string, baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (!(await isEventSlugAvailable(organizationId, slug))) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}
