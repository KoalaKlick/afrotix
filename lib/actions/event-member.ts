"use server";

import { revalidatePath } from "next/cache";
import { 
  addEventMember, 
  bulkAddEventMembers, 
  getEventMembers, 
  sendCodesToMembers,
  getMemberByCode,
  markMemberAttended,
  markMemberVoted
} from "@/lib/dal/event-member";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

/**
 * Add a member to an event
 */
export async function addEventMemberAction(data: { 
    eventId: string; 
    name: string; 
    email?: string; 
    phone?: string;
    responses?: any;
}) {
  try {
    const { eventId, name, email, phone, responses } = data;

    if (!name) throw new Error("Name is required");

    const member = await addEventMember({
      eventId,
      name,
      email,
      phone,
      responses
    });

    revalidatePath(`/my-events/${eventId}`);
    return { success: true, data: member };
  } catch (error) {
    logger.error(error, "[Action] Error adding event member:");
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Bulk add members from a list
 */
export async function bulkAddEventMembersAction(eventId: string, members: { name: string; email?: string; phone?: string }[]) {
  try {
    await bulkAddEventMembers(eventId, members);
    revalidatePath(`/my-events/${eventId}`);
    return { success: true };
  } catch (error) {
    logger.error(error, "[Action] Error bulk adding event members:");
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send codes to all members
 */
export async function sendCodesAction(eventId: string) {
  try {
    await sendCodesToMembers(eventId);
    return { success: true };
  } catch (error) {
    logger.error(error, "[Action] Error sending codes:");
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send code to a specific member
 */
export async function sendSingleCodeAction(memberId: string) {
  try {
    const member = await prisma.eventMember.findUnique({
      where: { id: memberId },
      include: { event: true }
    });

    if (!member) throw new Error("Member not found");
    if (!member.email) throw new Error("Member has no email address");

    const { sendEventCodeEmail } = await import("@/lib/email-actions");
    await sendEventCodeEmail({
      email: member.email,
      name: member.name,
      eventName: member.event.title,
      uniqueCode: member.uniqueCode,
    });

    return { success: true };
  } catch (error) {
    logger.error(error, "[Action] Error sending single code:");
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Verify code and mark attendance
 */
export async function markAttendanceAction(eventId: string, uniqueCode: string) {
  try {
    const member = await getMemberByCode(eventId, uniqueCode);
    if (!member) return { success: false, error: "Invalid code" };

    await markMemberAttended(member.id);
    return { success: true, memberName: member.name };
  } catch (error) {
    logger.error(error, "[Action] Error marking attendance:");
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Verify code for voting
 */
export async function verifyVotingCodeAction(eventId: string, uniqueCode: string) {
  try {
    const member = await getMemberByCode(eventId, uniqueCode);
    if (!member) return { success: false, error: "Invalid code" };
    
    if (member.status === "voted") {
        return { success: false, error: "This code has already been used for voting" };
    }

    return { success: true, memberId: member.id, memberName: member.name };
  } catch (error) {
    logger.error(error, "[Action] Error verifying voting code:");
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Public registration for an event
 */
export async function publicRegisterAction(data: { 
    eventId: string; 
    name: string; 
    email: string; 
    phone?: string;
    responses?: any;
}) {
  try {
    const { eventId, name, email, phone } = data;

    if (!name || !email) throw new Error("Name and Email are required");

    // Check event
    const event = await prisma.event.findUnique({ 
        where: { id: eventId }, 
        select: { title: true, status: true } 
    });

    if (!event) throw new Error("Event not found");
    if (event.status === "cancelled") throw new Error("This event has been cancelled");
    if (event.status === "draft") throw new Error("This event is not yet open for registration");

    // Check if already registered by email
    const existingEmail = await prisma.eventMember.findFirst({
        where: { eventId, email }
    });

    if (existingEmail) {
        return { success: false, error: "This email is already registered for this event." };
    }

    // Check if already registered by phone
    if (phone) {
        const existingPhone = await prisma.eventMember.findFirst({
            where: { eventId, phone }
        });

        if (existingPhone) {
            return { success: false, error: "This phone number is already registered for this event." };
        }
    }

    const member = await addEventMember({
      eventId,
      name,
      email,
      phone,
      responses: data.responses,
    });

    // Send email immediately
    if (event) {
        const { sendEventCodeEmail } = await import("@/lib/email-actions");
        await sendEventCodeEmail({
            email,
            name,
            eventName: event.title,
            uniqueCode: member.uniqueCode,
        });
    }

    return { 
        success: true, 
        data: {
            name: member.name,
            uniqueCode: member.uniqueCode
        } 
    };
  } catch (error) {
    logger.error(error, "[Action] Error in public registration:");
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Add a custom registration field
 */
export async function addRegistrationFieldAction(data: { 
    eventId: string; 
    label: string; 
    type: string; 
    isRequired: boolean;
    options?: string[];
    placeholder?: string;
}) {
  try {
    const field = await prisma.eventRegistrationField.create({
      data: {
        ...data,
        orderIdx: 0, // Should calculate max and increment
      }
    });

    revalidatePath(`/my-events/${data.eventId}`);
    return { success: true, data: field };
  } catch (error) {
    logger.error(error, "[Action] Error adding registration field:");
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete a registration field
 */
export async function deleteRegistrationFieldAction(eventId: string, fieldId: string) {
  try {
    await prisma.eventRegistrationField.delete({
      where: { id: fieldId }
    });

    revalidatePath(`/my-events/${eventId}`);
    return { success: true };
  } catch (error) {
    logger.error(error, "[Action] Error deleting registration field:");
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update an event member
 */
export async function updateEventMemberAction(id: string, eventId: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    status?: any;
    responses?: any;
}) {
    try {
        const member = await prisma.eventMember.update({
            where: { id },
            data: {
                ...data,
                email: data.email || null,
                phone: data.phone || null,
            }
        });

        revalidatePath(`/my-events/${eventId}`);
        return { success: true, data: member };
    } catch (error) {
        logger.error(error, "[Action] Error updating event member:");
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Delete an event member
 */
export async function deleteEventMemberAction(id: string, eventId: string) {
    try {
        await prisma.eventMember.delete({
            where: { id }
        });

        revalidatePath(`/my-events/${eventId}`);
        return { success: true };
    } catch (error) {
        logger.error(error, "[Action] Error deleting event member:");
        return { success: false, error: (error as Error).message };
    }
}
