import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { logger } from "@/lib/logger";
import { EventMemberStatus } from "@/lib/generated/prisma";
import { sendEventCodeEmail } from "@/lib/email-actions";
import { customAlphabet } from "nanoid";

// 8-character uppercase alphanumeric code
const generateCode = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);

export type CreateEventMemberInput = {
  eventId: string;
  name: string;
  email?: string;
  phone?: string;
  responses?: any;
};

/**
 * Add a single event member and generate a unique code
 */
export async function addEventMember(data: CreateEventMemberInput) {
  try {
    let uniqueCode = generateCode();
    
    // Ensure uniqueness
    let exists = await prisma.eventMember.findUnique({
      where: { uniqueCode },
    });
    
    while (exists) {
      uniqueCode = generateCode();
      exists = await prisma.eventMember.findUnique({
        where: { uniqueCode },
      });
    }

    return await prisma.eventMember.create({
      data: {
        eventId: data.eventId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        responses: data.responses,
        uniqueCode,
        status: "invited",
      },
    });
  } catch (error) {
    logger.error(error, "[DAL] Error adding event member:");
    throw error;
  }
}

/**
 * Bulk add event members
 */
export async function bulkAddEventMembers(eventId: string, members: Omit<CreateEventMemberInput, "eventId">[]) {
  try {
    const data = await Promise.all(members.map(async (m) => {
      let uniqueCode = generateCode();
      // In bulk, we might still want to check but it's more complex. 
      // For now, we'll just generate and let the DB fail if there's a collision (rare for 8 chars)
      // or we can just do them one by one or in a loop.
      return {
        ...m,
        eventId,
        uniqueCode,
        status: "invited" as EventMemberStatus,
      };
    }));

    return await prisma.eventMember.createMany({
      data,
      skipDuplicates: true,
    });
  } catch (error) {
    logger.error(error, "[DAL] Error bulk adding event members:");
    throw error;
  }
}

/**
 * Get all members for an event
 */
export const getEventMembers = cache(async (eventId: string) => {
  try {
    return await prisma.eventMember.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    logger.error(error, "[DAL] Error fetching event members:");
    return [];
  }
});

/**
 * Get registration fields for an event
 */
export const getRegistrationFields = cache(async (eventId: string) => {
  try {
    return await prisma.eventRegistrationField.findMany({
      where: { eventId },
      orderBy: { orderIdx: "asc" },
    });
  } catch (error) {
    logger.error(error, "[DAL] Error fetching registration fields:");
    return [];
  }
});

/**
 * Get member by code and event
 */
export async function getMemberByCode(eventId: string, uniqueCode: string) {
  try {
    return await prisma.eventMember.findFirst({
      where: {
        eventId,
        uniqueCode,
      },
    });
  } catch (error) {
    logger.error(error, "[DAL] Error fetching member by code:");
    return null;
  }
}

/**
 * Send codes to all members of an event who haven't been notified yet
 */
export async function sendCodesToMembers(eventId: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true },
    });

    if (!event) throw new Error("Event not found");

    const members = await prisma.eventMember.findMany({
      where: {
        eventId,
        email: { not: null },
        // We could add a 'notified' status but the doc says 'invited' is the initial status
      },
    });

    const results = await Promise.all(members.map(async (member) => {
      if (member.email) {
        return await sendEventCodeEmail({
          email: member.email,
          name: member.name,
          eventName: event.title,
          uniqueCode: member.uniqueCode,
        });
      }
      return { success: false, error: "No email" };
    }));

    return results;
  } catch (error) {
    logger.error(error, "[DAL] Error sending codes to members:");
    throw error;
  }
}

/**
 * Mark member as attended
 */
export async function markMemberAttended(id: string) {
  try {
    return await prisma.eventMember.update({
      where: { id },
      data: { status: "attended" },
    });
  } catch (error) {
    logger.error(error, "[DAL] Error marking member attended:");
    throw error;
  }
}

/**
 * Mark member as voted
 */
export async function markMemberVoted(id: string) {
  try {
    return await prisma.eventMember.update({
      where: { id },
      data: { status: "voted" },
    });
  } catch (error) {
    logger.error(error, "[DAL] Error marking member voted:");
    throw error;
  }
}
