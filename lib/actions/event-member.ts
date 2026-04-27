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

/**
 * Add a member to an event
 */
export async function addEventMemberAction(eventId: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    if (!name) throw new Error("Name is required");

    await addEventMember({
      eventId,
      name,
      email: email || undefined,
      phone: phone || undefined,
    });

    revalidatePath(`/dashboard/events/${eventId}/members`);
    return { success: true };
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
    revalidatePath(`/dashboard/events/${eventId}/members`);
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
