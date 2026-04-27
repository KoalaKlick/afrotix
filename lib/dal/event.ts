// Removed 'server-only' import to allow use in client/page components
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import type {
  Event,
  EventType,
  EventStatus,
  VotingMode,
  OrderStatus,
  TicketCheckInStatus,
  TransactionStatus,
} from "@/lib/generated/prisma";
import { normalizeEventStatus } from "@/lib/event-status";
import { getUserOrganizations } from "@/lib/dal/organization";
/**
 * Get events visible to a user (public events, plus private events for orgs they are a member of)
 * For landing page or events list with user context
 */
export const getVisibleEventsForUser = cache(
  async (options?: {
    userId?: string;
    limit?: number;
    offset?: number;
    type?: EventType;
    query?: string;
  }): Promise<(Event & { organization: { slug: string; name: string } })[]> => {
    try {
      const { userId, limit = 6, offset = 0, type, query } = options ?? {};
      // If not logged in, return only public events (same as getPublicEvents)
      if (!userId) {
        return (await prisma.event.findMany({
          where: {
            isPublic: true,
            status: { notIn: ["draft", "cancelled"] },
            ...(type && { type }),
            ...(query && {
              title: {
                contains: query,
                mode: "insensitive",
              },
            }),
          },
          include: {
            organization: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
          orderBy: { startDate: "asc" },
          take: limit,
          skip: offset,
        })) as (Event & { organization: { slug: string; name: string } })[];
      }

      // If logged in, return public events and private events for orgs the user is a member of
      const orgs = await getUserOrganizations(userId);
      const orgIds = orgs.map((o) => o.id);
      if (orgIds.length === 0) {
        // User is not a member of any org, so only public events
        return (await prisma.event.findMany({
          where: {
            isPublic: true,
            status: { notIn: ["draft", "cancelled"] },
            ...(type && { type }),
            ...(query && {
              title: {
                contains: query,
                mode: "insensitive",
              },
            }),
          },
          include: {
            organization: {
              select: {
                slug: true,
                name: true,
              },
            },
          },
          orderBy: { startDate: "asc" },
          take: limit,
          skip: offset,
        })) as (Event & { organization: { slug: string; name: string } })[];
      }

      // User is a member of at least one org: show public events and private events for their orgs
      return (await prisma.event.findMany({
        where: {
          status: { notIn: ["draft", "cancelled"] },
          ...(type && { type }),
          ...(query && {
            title: {
              contains: query,
              mode: "insensitive",
            },
          }),
          OR: [
            { isPublic: true },
            { isPublic: false, organizationId: { in: orgIds } },
          ],
        },
        include: {
          organization: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
        orderBy: { startDate: "asc" },
        take: limit,
        skip: offset,
      })) as (Event & { organization: { slug: string; name: string } })[];
    } catch (error) {
      logger.error(error, "[DAL] Error fetching visible events for user:");
      return [];
    }
  },
);
import { logger, logAction } from "@/lib/logger";

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
  votingMode?: VotingMode;
  flierImage?: string | null;
  bannerImage?: string | null;
  venueName?: string;
  venueAddress?: string;
  venueCity?: string;
  venueCountry?: string;
  isVirtual?: boolean;
  virtualLink?: string;
  maxAttendees?: number;
  sponsors?: { name: string; logo?: string | null }[];
  socialLinks?: { url: string }[];
  galleryLinks?: { name: string; url: string }[];
};

export type EventUpdateInput = Partial<
  Omit<EventCreateInput, "organizationId" | "creatorId">
>;

export type EventWithStats = Event & {
  ticketsSold?: number;
  revenue?: number;
  attendeesCount?: number;
};

/**
 * Get event by ID
 * Uses React cache for request deduplication
 */
export const getEventById = cache(async (id: string) => {
  try {
    return await prisma.event.findUnique({
      where: { id },
      include: {
        sponsors: true,
        socialLinks: true,
        galleryLinks: true,
        organization: true,
      },
    });
  } catch (error) {
    logger.error(error, "[DAL] Error fetching event:");
    return null;
  }
});

/**
 * Get event by slug within an organization
 */
export type EventWithRelations = Event & {
  sponsors: { id: string; name: string; logo?: string | null }[];
  socialLinks: { id: string; url: string }[];
  galleryLinks: { id: string; name: string; url: string }[];
};

export const getEventBySlug = cache(
  async (
    organizationId: string,
    slug: string,
  ): Promise<EventWithRelations | null> => {
    try {
      return (await prisma.event.findUnique({
        where: {
          organizationId_slug: { organizationId, slug },
        },
        include: {
          sponsors: true,
          socialLinks: true,
          galleryLinks: true,
        },
      })) as EventWithRelations | null;
    } catch (error) {
      logger.error(error, "[DAL] Error fetching event by slug:");
      return null;
    }
  },
);

/**
 * Check if event slug is available within an organization
 */
export async function isEventSlugAvailable(
  organizationId: string,
  slug: string,
): Promise<boolean> {
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
export const getOrganizationEvents = cache(
  async (
    organizationId: string,
    options?: {
      status?: EventStatus;
      type?: EventType;
      limit?: number;
      offset?: number;
    },
  ): Promise<Event[]> => {
    try {
      const startTime = performance.now();
      const { status, type, limit = 50, offset = 0 } = options ?? {};

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

      logAction("getOrganizationEvents", performance.now() - startTime);

      return events;
    } catch (error) {
      logger.error(error, "[DAL] Error fetching organization events:");
      return [];
    }
  },
);

/**
 * Get upcoming events for an organization
 */
export const getUpcomingEvents = cache(
  async (organizationId: string, limit = 5): Promise<Event[]> => {
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
  },
);

/**
 * Get public events for the landing page or events list
 */
export const getPublicEvents = cache(
  async (options?: {
    limit?: number;
    offset?: number;
    type?: EventType;
    query?: string;
  }): Promise<(Event & { organization: { slug: string; name: string } })[]> => {
    try {
      const { limit = 6, offset = 0, type, query } = options ?? {};

      return (await prisma.event.findMany({
        where: {
          isPublic: true,
          status: { notIn: ["draft", "cancelled"] },
          ...(type && { type }),
          ...(query && {
            title: {
              contains: query,
              mode: "insensitive",
            },
          }),
        },
        include: {
          organization: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
        orderBy: { startDate: "asc" },
        take: limit,
        skip: offset,
      })) as (Event & { organization: { slug: string; name: string } })[];
    } catch (error) {
      logger.error(error, "[DAL] Error fetching public events:");
      return [];
    }
  },
);

/**
 * Get events created by a user
 */
export const getUserCreatedEvents = cache(
  async (userId: string, limit = 50): Promise<Event[]> => {
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
  },
);

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
    votingMode,
    description,
    startDate,
    endDate,
    timezone = "Africa/Accra",
    isPublic = true,
    flierImage,
    bannerImage,
    venueName,
    venueAddress,
    venueCity,
    venueCountry = "Ghana",
    isVirtual = false,
    virtualLink,
    maxAttendees,
  } = data;

  const startTime = performance.now();

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
      ...(votingMode && { votingMode }),
      flierImage: flierImage ?? null,
      bannerImage: bannerImage ?? null,
      venueName: venueName ?? null,
      venueAddress: venueAddress ?? null,
      venueCity: venueCity ?? null,
      venueCountry,
      isVirtual,
      virtualLink: virtualLink ?? null,
      maxAttendees: maxAttendees ?? null,
      status: "draft",
      sponsors: data.sponsors
        ? {
          create: data.sponsors.map((s) => ({
            name: s.name,
            logo: s.logo,
          })),
        }
        : undefined,
      socialLinks: data.socialLinks
        ? {
          create: data.socialLinks.map((s) => ({
            url: s.url,
          })),
        }
        : undefined,
      galleryLinks: data.galleryLinks
        ? {
          create: data.galleryLinks.map((g) => ({
            name: g.name,
            url: g.url,
          })),
        }
        : undefined,
    },
    include: {
      sponsors: true,
      socialLinks: true,
      galleryLinks: true,
    },
  });

  logAction("createEvent", performance.now() - startTime);

  return event;
}

/**
 * Update event
 */
export async function updateEvent(
  id: string,
  data: EventUpdateInput,
): Promise<Event | null> {
  try {
    const { sponsors, socialLinks, galleryLinks, startDate, endDate, ...rest } =
      data;

    return await prisma.event.update({
      where: { id },
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        sponsors: sponsors
          ? {
            deleteMany: {},
            create: sponsors.map((s) => ({
              name: s.name,
              logo: s.logo,
            })),
          }
          : undefined,
        socialLinks: socialLinks
          ? {
            deleteMany: {},
            create: socialLinks.map((s) => ({
              url: s.url,
            })),
          }
          : undefined,
        galleryLinks: galleryLinks
          ? {
            deleteMany: {},
            create: galleryLinks.map((g) => ({
              name: g.name,
              url: g.url,
            })),
          }
          : undefined,
      },
      include: {
        sponsors: true,
        socialLinks: true,
        galleryLinks: true,
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
export async function updateEventStatus(
  id: string,
  status: EventStatus,
): Promise<Event | null> {
  try {
    const normalizedStatus = normalizeEventStatus(status);
    const updateData: { status: EventStatus; publishedAt?: Date } = {
      status: normalizedStatus,
    };

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
export const getOrganizationEventStats = cache(
  async (organizationId: string) => {
    try {
      const startTime = performance.now();

      const now = new Date();

      // Run consolidated queries in parallel
      const [
        statusTypeGroups,
        activeEvents,
        ticketStats,
        voteRevenueResult,
        voteCountResult,
        mostAttended,
        nextUpcoming,
        recentEnded,
        totalAttendees,
        totalTicketsSold
      ] = await Promise.all([
        // 1. Consolidated counts by status and type
        prisma.event.groupBy({
          by: ["status", "type"],
          where: { organizationId },
          _count: true,
        }),
        // 2. Fetch dates for temporal filtering (ongoing, ended, upcoming)
        prisma.event.findMany({
          where: {
            organizationId,
            status: { notIn: ["draft", "cancelled"] },
          },
          select: { id: true, startDate: true, endDate: true },
        }),
        // 3. Ticket/Revenue aggregation
        prisma.ticketOrder.aggregate({
          where: {
            event: { organizationId },
            status: { in: ["paid", "confirmed"] },
          },
          _sum: { subtotal: true },
          _count: true,
        }),
        // 4. Vote Revenue aggregation (from completed payments related to votes)
        prisma.payment.aggregate({
          where: {
            status: "completed",
            votes: { some: { event: { organizationId } } }
          },
          _sum: { amount: true },
        }),
        // 5. Total votes across all events (sum of voteCount)
        prisma.vote.aggregate({
          where: { event: { organizationId } },
          _sum: { voteCount: true },
        }),
        // 5. Most attended event
        prisma.event.findFirst({
          where: { organizationId },
          orderBy: { tickets: { _count: "desc" } },
          select: {
            id: true,
            title: true,
            _count: { select: { tickets: true } },
          },
        }),
        // 6. Next upcoming event
        prisma.event.findFirst({
          where: {
            organizationId,
            status: { notIn: ["draft", "cancelled"] },
            startDate: { gt: now },
          },
          orderBy: { startDate: "asc" },
          select: { id: true, title: true, startDate: true },
        }),
        // 7. Most recent ended event
        prisma.event.findFirst({
          where: {
            organizationId,
            status: { notIn: ["draft", "cancelled"] },
            endDate: { lt: now },
          },
          orderBy: { endDate: "desc" },
          select: { id: true, title: true, endDate: true },
        }),
        // 8. Total checked-in attendees
        prisma.ticket.count({
          where: {
            event: { organizationId },
            checkInStatus: "checked_in",
          },
        }),
        // 9. Total tickets sold (actual tickets, not orders)
        prisma.ticket.count({
          where: {
            event: { organizationId },
            order: { status: { in: ["paid", "confirmed"] } },
          },
        }),
      ]);

      const ticketRevenue = Number(ticketStats._sum.subtotal ?? 0);
      const voteRevenue = Number(voteRevenueResult._sum.amount ?? 0);
      const totalRevenue = ticketRevenue + voteRevenue;

      // Process grouped counts in memory
      let total = 0;
      let draft = 0;
      let cancelled = 0;
      const byType = { voting: 0, ticketed: 0, hybrid: 0, standard: 0 };

      for (const group of statusTypeGroups) {
        const count = group._count;
        total += count;
        if (group.status === "draft") draft += count;
        if (group.status === "cancelled") cancelled += count;

        if (group.type in byType) {
          byType[group.type as keyof typeof byType] += count;
        }
      }

      // Process active events temporal status in memory
      let ongoing = 0;
      let ended = 0;
      let upcoming = 0;
      const published = activeEvents.length;

      for (const event of activeEvents) {
        const start = event.startDate;
        const end = event.endDate;

        if (start && start > now) {
          upcoming++;
        } else if (start && start <= now && (!end || end >= now)) {
          ongoing++;
        } else if (end && end < now) {
          ended++;
        }
      }

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
        total,
        published,
        draft,
        ongoing,
        ended,
        cancelled,
        upcoming,
        byType,
        totalTicketsSold,
        totalRevenue,
        totalAttendees,
        totalVotes: Number(voteCountResult._sum.voteCount ?? 0),
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

      logAction("getOrganizationEventStats", performance.now() - startTime);

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
        byType: { voting: 0, ticketed: 0, hybrid: 0, standard: 0 },
        totalTicketsSold: 0,
        totalRevenue: 0,
        totalAttendees: 0,
        totalVotes: 0,
      };
    }
  },
);

/**
 * Generate unique slug for event
 */
export async function generateUniqueEventSlug(
  organizationId: string,
  baseSlug: string,
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (!(await isEventSlugAvailable(organizationId, slug))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Get ongoing events for an organization (started but not ended)
 */
export const getOngoingEvents = cache(
  async (organizationId: string): Promise<Event[]> => {
    try {
      const now = new Date();
      return await prisma.event.findMany({
        where: {
          organizationId,
          status: { notIn: ["draft", "cancelled"] },
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        orderBy: { startDate: "asc" },
      });
    } catch (error) {
      logger.error(error, "[DAL] Error fetching ongoing events:");
      return [];
    }
  },
);

/**
 * Get recent ticket orders for an organization
 */
export const getRecentOrders = cache(
  async (organizationId: string, limit = 10) => {
    try {
      return await prisma.ticketOrder.findMany({
        where: { event: { organizationId } },
        include: {
          event: { select: { title: true } },
          payment: {
            select: {
              email: true,
              currency: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
    } catch (error) {
      logger.error(error, "[DAL] Error fetching recent orders:");
      return [];
    }
  },
);

/**
 * Get monthly revenue data for the last N months for charts
 */
export const getMonthlyRevenue = cache(
  async (organizationId: string, months = 6) => {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months + 1);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const orders = await prisma.ticketOrder.findMany({
        where: {
          event: { organizationId },
          status: { in: ["paid", "confirmed"] },
          createdAt: { gte: startDate },
        },
        select: {
          subtotal: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      });

      // Group by month
      const monthlyData: Record<string, number> = {};
      const now = new Date();
      for (let i = 0; i < months; i++) {
        const d = new Date(
          now.getFullYear(),
          now.getMonth() - (months - 1 - i),
          1,
        );
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyData[key] = 0;
      }

      for (const order of orders) {
        const d = new Date(order.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (key in monthlyData) {
          monthlyData[key] += Number(order.subtotal);
        }
      }

      return Object.entries(monthlyData).map(([month, revenue]) => ({
        month,
        revenue,
      }));
    } catch (error) {
      logger.error(error, "[DAL] Error fetching monthly revenue:");
      return [];
    }
  },
);

/**
 * Get stats for a single event (detail page)
 */
export const getEventDetailStats = cache(async (eventId: string) => {
  try {
    const paidStatuses: OrderStatus[] = ["paid", "confirmed"];
    const checkedIn: TicketCheckInStatus = "checked_in";

    const [
      ticketsSold,
      ticketRevenueResult,
      voteRevenueResult,
      checkIns,
      totalVotes,
      totalOrders,
      totalCategories,
      totalNominees,
      ticketTypes,
      event,
    ] = await Promise.all([
      prisma.ticket.count({
        where: { eventId, order: { status: { in: paidStatuses } } },
      }),
      prisma.ticketOrder.aggregate({
        where: { eventId, status: { in: paidStatuses } },
        _sum: { subtotal: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: "completed",
          votes: { some: { eventId } }
        },
        _sum: { amount: true },
      }),
      prisma.ticket.count({
        where: { eventId, checkInStatus: checkedIn },
      }),
      prisma.vote.aggregate({
        where: { eventId },
        _sum: { voteCount: true },
        _count: { _all: true },
      }),
      prisma.ticketOrder.count({
        where: { eventId, status: { in: paidStatuses } },
      }),
      prisma.votingCategory.count({ where: { eventId } }),
      prisma.votingOption.count({ where: { eventId, status: "approved" } }),
      prisma.ticketType.count({ where: { eventId } }),
      prisma.event.findUnique({
        where: { id: eventId },
        select: { maxAttendees: true },
      }),
    ]);

    const ticketRevenue = Number(ticketRevenueResult._sum.subtotal ?? 0);
    const voteRevenue = Number(voteRevenueResult._sum.amount ?? 0);
    const totalRevenue = ticketRevenue + voteRevenue;

    const totalVoteSum = Number((totalVotes as any)._sum.voteCount ?? 0);
    const totalVoteCount = (totalVotes as any)._count._all ?? 0;

    // DEBUG LOG
    logger.debug(
      { eventId, sum: totalVoteSum, count: totalVoteCount },
      `[DEBUG] Vote Aggregation | Sum: ${totalVoteSum}, Count: ${totalVoteCount}`,
    );

    return {
      ticketsSold,
      revenue: totalRevenue,
      checkIns,
      totalVotes: totalVoteSum,
      totalOrders,
      totalCategories,
      totalNominees,
      ticketTypes,
      capacity: event?.maxAttendees ?? null,
    };
  } catch (error) {
    logger.error(error, "[DAL] Error fetching event detail stats:");
    return {
      ticketsSold: 0,
      revenue: 0,
      checkIns: 0,
      totalVotes: 0,
      totalOrders: 0,
      totalCategories: 0,
      totalNominees: 0,
      ticketTypes: 0,
      capacity: null,
    };
  }
});

/**
 * Get vote timestamps for an event (for trend charts)
 */
export const getVoteTrend = cache(
  async (eventId: string): Promise<{ date: string; votes: number }[]> => {
    try {
      const votes = await prisma.vote.findMany({
        where: { eventId },
        select: { createdAt: true, voteCount: true },
        orderBy: { createdAt: "asc" },
      });

      // Debug log raw results
      if (votes.length > 0) {
        const sample = votes.slice(0, 3);
        logger.debug(
          { eventId, totalRecords: votes.length, sample },
          `[DEBUG] Vote Trend | Found ${votes.length} records. Sample: ${JSON.stringify(sample)}`,
        );
      }

      // Group votes by date (YYYY-MM-DD)
      const grouped = new Map<string, number>();
      let debugSum = 0;
      for (const vote of votes) {
        const dateKey = vote.createdAt.toISOString().slice(0, 10);
        const qty = Number(vote.voteCount);
        grouped.set(dateKey, (grouped.get(dateKey) ?? 0) + qty);
        debugSum += qty;
      }

      logger.debug(
        { eventId, groupedSum: debugSum, recordCount: votes.length },
        `[DEBUG] Vote Trend Completion | Grouped Sum: ${debugSum}, Record Count: ${votes.length}`,
      );

      // Fill in missing dates between first and last vote
      if (grouped.size === 0) return [];

      const sortedDates = [...grouped.keys()].sort();
      const start = new Date(sortedDates[0]);
      const end = new Date(sortedDates[sortedDates.length - 1]);
      const result: { date: string; votes: number }[] = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        result.push({ date: key, votes: grouped.get(key) ?? 0 });
      }

      return result;
    } catch (error) {
      logger.error(error, "[DAL] Error fetching vote trend:");
      return [];
    }
  },
);

/**
 * Get ticket sales timestamps for an event (for trend charts)
 */
export const getTicketTrend = cache(
  async (eventId: string): Promise<{ date: string; sales: number; revenue: number }[]> => {
    try {
      const orders = await prisma.ticketOrder.findMany({
        where: { eventId, status: { in: ["paid", "confirmed"] } },
        select: {
          createdAt: true,
          subtotal: true,
          tickets: { select: { id: true } }
        },
        orderBy: { createdAt: "asc" },
      });

      if (orders.length === 0) return [];

      const grouped = new Map<string, { sales: number; revenue: number }>();
      for (const order of orders) {
        const dateKey = order.createdAt.toISOString().slice(0, 10);
        const current = grouped.get(dateKey) ?? { sales: 0, revenue: 0 };
        grouped.set(dateKey, {
          sales: current.sales + order.tickets.length,
          revenue: current.revenue + Number(order.subtotal),
        });
      }

      const sortedDates = [...grouped.keys()].sort();
      const start = new Date(sortedDates[0]);
      const end = new Date(sortedDates[sortedDates.length - 1]);
      const result: { date: string; sales: number; revenue: number }[] = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        const data = grouped.get(key) ?? { sales: 0, revenue: 0 };
        result.push({ date: key, ...data });
      }

      return result;
    } catch (error) {
      logger.error(error, "[DAL] Error fetching ticket trend:");
      return [];
    }
  },
);

/**
 * Get ticket sales by type for an event
 */
export const getTicketTypeSales = cache(
  async (eventId: string) => {
    try {
      const ticketTypes = await prisma.ticketType.findMany({
        where: { eventId },
        select: {
          id: true,
          name: true,
          quantityTotal: true,
          _count: {
            select: {
              tickets: {
                where: {
                  order: {
                    status: { in: ["paid", "confirmed"] }
                  }
                }
              }
            }
          }
        },
        orderBy: { name: "asc" },
      });

      return ticketTypes.map(tt => ({
        id: tt.id,
        name: tt.name,
        capacity: tt.quantityTotal ?? 0,
        sold: tt._count.tickets
      }));
    } catch (error) {
      logger.error(error, "[DAL] Error fetching ticket type sales:");
      return [];
    }
  }
);

/**
 * Get paginated vote transactions for an event (ANONYMIZED)
 * Never returns voter identity or which nominee was voted for.
 */
export const getEventVoteTransactions = cache(
  async (
    eventId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: TransactionStatus;
      search?: string;
      sortBy?: string;
      sortDir?: "asc" | "desc";
    },
  ) => {
    try {
      const { limit = 10, offset = 0, status = "completed", search, sortBy = "createdAt", sortDir = "desc" } = options ?? {};

      const where: any = {
        eventId,
        payment: { status },
      };

      if (search) {
        where.OR = [
          { voterEmail: { contains: search, mode: 'insensitive' } },
          { voterPhone: { contains: search, mode: 'insensitive' } },
          { payment: { reference: { contains: search, mode: 'insensitive' } } },
          { option: { optionText: { contains: search, mode: 'insensitive' } } },
          { option: { nomineeCode: { contains: search, mode: 'insensitive' } } },
        ];
      }

      let orderBy: any = {};
      if (sortBy === "amount") {
        orderBy = { payment: { amount: sortDir } };
      } else if (sortBy === "voteCount") {
        orderBy = { voteCount: sortDir };
      } else {
        orderBy = { [sortBy]: sortDir };
      }

      const votes = await prisma.vote.findMany({
        where,
        select: {
          id: true,
          voteCount: true,
          createdAt: true,
          payment: {
            select: {
              amount: true,
              currency: true,
              reference: true,
              status: true,
              email: true,
            },
          },
          voterEmail: true,
          voterPhone: true,
          option: {
            select: {
              optionText: true,
              nomineeCode: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      });

      const total = await prisma.vote.count({ where });

      return {
        transactions: votes.map((v) => ({
          id: v.id,
          voteCount: v.voteCount,
          amount: Number(v.payment?.amount || 0),
          currency: v.payment?.currency || "GHS",
          reference: v.payment?.reference || "",
          status: v.payment?.status || "unknown",
          voterEmail: v.voterEmail || v.payment?.email || undefined,
          voterPhone: v.voterPhone || undefined,
          nomineeName: v.option?.optionText || undefined,
          nomineeCode: v.option?.nomineeCode || undefined,
          createdAt: v.createdAt.toISOString(),
        })),
        total,
      };
    } catch (error) {
      logger.error(error, "[DAL] Error fetching vote transactions:");
      return { transactions: [], total: 0 };
    }
  },
);

/**
 * Get recent successful ticket transactions for an event.
 */
export const getEventTicketTransactions = cache(
  async (
    eventId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: OrderStatus[];
      search?: string;
      sortBy?: string;
      sortDir?: "asc" | "desc";
    },
  ) => {
    try {
      const { limit = 10, offset = 0, status = ["paid", "confirmed"], search, sortBy = "createdAt", sortDir = "desc" } = options ?? {};

      const where: any = {
        eventId,
        status: { in: status },
      };

      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { buyerName: { contains: search, mode: 'insensitive' } },
          { buyerPhone: { contains: search, mode: 'insensitive' } },
          { payment: { email: { contains: search, mode: 'insensitive' } } },
        ];
      }

      let orderBy: any = {};
      if (sortBy === "amount" || sortBy === "subtotal") {
        orderBy = { subtotal: sortDir };
      } else {
        orderBy = { [sortBy]: sortDir };
      }

      const orders = await prisma.ticketOrder.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          buyerName: true,
          buyerPhone: true,
          subtotal: true,
          fees: true,
          status: true,
          createdAt: true,
          payment: {
            select: {
              email: true,
              currency: true,
            },
          },
          tickets: {
            select: { id: true },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      });

      const total = await prisma.ticketOrder.count({ where });

      return {
        transactions: orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          buyerName: order.buyerName,
          buyerEmail: order.payment?.email || null,
          buyerPhone: order.buyerPhone,
          amount: Number(order.subtotal),
          fees: Number(order.fees),
          currency: order.payment?.currency || "GHS",
          status: order.status,
          ticketCount: order.tickets.length,
          createdAt: order.createdAt.toISOString(),
        })),
        total,
      };
    } catch (error) {
      logger.error(error, "[DAL] Error fetching ticket transactions:");
      return { transactions: [], total: 0 };
    }
  },
);
