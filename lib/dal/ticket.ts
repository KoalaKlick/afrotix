import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

/**
 * Get all ticket types for an event
 */
export async function getTicketTypesByEventId(eventId: string) {
  try {
    return await prisma.ticketType.findMany({
      where: { eventId },
      orderBy: { orderIdx: "asc" },
    });
  } catch (error) {
    console.error("[DAL] Error getting ticket types:", error);
    return [];
  }
}

export async function getVisibleTicketTypesByEventId(
  eventId: string,
  isOrganizationMember: boolean,
) {
  try {
    return await prisma.ticketType.findMany({
      where: {
        eventId,
        status: {
          in: isOrganizationMember
            ? ["available", "sold_out", "hidden"]
            : ["available", "sold_out"],
        },
      },
      orderBy: { orderIdx: "asc" },
    });
  } catch (error) {
    console.error("[DAL] Error getting visible ticket types:", error);
    return [];
  }
}

/**
 * Get a ticket type by ID
 */
export async function getTicketTypeById(id: string) {
  try {
    return await prisma.ticketType.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error("[DAL] Error getting ticket type:", error);
    return null;
  }
}

/**
 * Create a new ticket type
 */
export async function createTicketType(data: {
  eventId: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  quantityTotal?: number | null;
  salesStart?: Date | null;
  salesEnd?: Date | null;
  maxPerOrder?: number;
  minPerOrder?: number;
  orderIdx?: number;
  color?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}) {
  try {
    return await prisma.ticketType.create({
      data: {
        eventId: data.eventId,
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency || "GHS",
        quantityTotal: data.quantityTotal,
        salesStart: data.salesStart,
        salesEnd: data.salesEnd,
        maxPerOrder: data.maxPerOrder || 10,
        minPerOrder: data.minPerOrder || 1,
        orderIdx: data.orderIdx || 0,
        color: data.color || "",
        primaryColor: data.primaryColor || "",
        secondaryColor: data.secondaryColor || "",
      },
    });
  } catch (error) {
    console.error("[DAL] Error creating ticket type:", error);
    return null;
  }
}

/**
 * Update an existing ticket type
 */
export async function updateTicketType(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    price?: number;
    currency?: string;
    quantityTotal?: number | null;
    salesStart?: Date | null;
    salesEnd?: Date | null;
    maxPerOrder?: number;
    minPerOrder?: number;
    status?: any; // To avoid enum issues
    orderIdx?: number;
    color?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  },
) {
  try {
    return await prisma.ticketType.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("[DAL] Error updating ticket type:", error);
    return null;
  }
}

/**
 * Delete a ticket type
 */
export async function deleteTicketType(id: string) {
  try {
    // Only allow deletion if no tickets are sold yet
    const ticketType = await prisma.ticketType.findUnique({
      where: { id },
      select: { quantitySold: true },
    });

    if (!ticketType) return false;
    if (ticketType.quantitySold > 0) {
      // Instead of deleting, just hide it
      await prisma.ticketType.update({
        where: { id },
        data: { status: "hidden" as any },
      });
      return true;
    }

    await prisma.ticketType.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error("[DAL] Error deleting ticket type:", error);
    return false;
  }
}

/**
 * Reorder ticket types
 */
export async function reorderTicketTypes(ticketTypeIds: string[]) {
  try {
    await prisma.$transaction(
      ticketTypeIds.map((id, idx) =>
        prisma.ticketType.update({
          where: { id },
          data: { orderIdx: idx },
        }),
      ),
    );
    return true;
  } catch (error) {
    console.error("[DAL] Error reordering ticket types:", error);
    return false;
  }
}
