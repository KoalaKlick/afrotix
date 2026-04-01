"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createTicketType,
  updateTicketType as dalUpdateTicketType,
  deleteTicketType as dalDeleteTicketType,
  getTicketTypeById,
  reorderTicketTypes as dalReorderTicketTypes,
} from "@/lib/dal/ticket";
import { getEventById } from "@/lib/dal/event";
import { getUserRoleInOrganization } from "@/lib/dal/organization";
import type { TicketStatus, TicketType } from "@/lib/types/ticket";

// Action result type
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Helper to check if user can edit event
 */
async function canEditEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, error: "Not authenticated" };
  }

  const event = await getEventById(eventId);
  if (!event) {
    return { allowed: false, error: "Event not found" };
  }

  const role = await getUserRoleInOrganization(user.id, event.organizationId);
  if (!role || (role !== "owner" && role !== "admin")) {
    return { allowed: false, error: "Not authorized" };
  }

  return { allowed: true, event, user };
}

/**
 * Create a new ticket type
 */
export async function createTicketTypeAction(
  eventId: string,
  data: {
    name: string;
    description?: string;
    price: number;
    quantityTotal?: number | null;
    salesStart?: string | null;
    salesEnd?: string | null;
    maxPerOrder?: number;
    minPerOrder?: number;
    color?: string;
    primaryColor?: string;
    secondaryColor?: string;
  },
): Promise<ActionResult<{ id: string }>> {
  const check = await canEditEvent(eventId);
  if (!check.allowed) {
    return { success: false, error: check.error ?? "Not authorized" };
  }

  if (!data.name?.trim()) {
    return { success: false, error: "Ticket name is required" };
  }

  const ticketType = await createTicketType({
    eventId,
    name: data.name.trim(),
    description: data.description?.trim(),
    price: data.price,
    quantityTotal: data.quantityTotal,
    salesStart: data.salesStart ? new Date(data.salesStart) : null,
    salesEnd: data.salesEnd ? new Date(data.salesEnd) : null,
    maxPerOrder: data.maxPerOrder,
    minPerOrder: data.minPerOrder,
    color: data.color,
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
  });

  if (!ticketType) {
    return { success: false, error: "Failed to create ticket type" };
  }

  revalidatePath(`/my-events/${eventId}`);
  return {
    success: true,
    data: {
      ...ticketType,
      price: Number(ticketType.price),
      createdAt: ticketType.createdAt.toISOString(),
      updatedAt: ticketType.updatedAt.toISOString(),
      salesStart: ticketType.salesStart?.toISOString() ?? null,
      salesEnd: ticketType.salesEnd?.toISOString() ?? null,
    } as TicketType,
  };
}

/**
 * Update a ticket type
 */
export async function updateTicketTypeAction(
  ticketTypeId: string,
  data: {
    name?: string;
    description?: string | null;
    price?: number;
    quantityTotal?: number | null;
    salesStart?: string | null;
    salesEnd?: string | null;
    maxPerOrder?: number;
    minPerOrder?: number;
    status?: TicketStatus;
    color?: string;
    primaryColor?: string;
    secondaryColor?: string;
  },
): Promise<ActionResult<{ id: string }>> {
  const ticketType = await getTicketTypeById(ticketTypeId);
  if (!ticketType) {
    return { success: false, error: "Ticket type not found" };
  }

  const check = await canEditEvent(ticketType.eventId);
  if (!check.allowed) {
    return { success: false, error: check.error ?? "Not authorized" };
  }

  const updated = await dalUpdateTicketType(ticketTypeId, {
    ...(data.name && { name: data.name.trim() }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.price !== undefined && { price: data.price }),
    ...(data.quantityTotal !== undefined && {
      quantityTotal: data.quantityTotal,
    }),
    ...(data.salesStart !== undefined && {
      salesStart: data.salesStart ? new Date(data.salesStart) : null,
    }),
    ...(data.salesEnd !== undefined && {
      salesEnd: data.salesEnd ? new Date(data.salesEnd) : null,
    }),
    ...(data.maxPerOrder !== undefined && { maxPerOrder: data.maxPerOrder }),
    ...(data.minPerOrder !== undefined && { minPerOrder: data.minPerOrder }),
    ...(data.status && { status: data.status as any }),
    ...(data.color !== undefined && { color: data.color }),
    ...(data.primaryColor !== undefined && { primaryColor: data.primaryColor }),
    ...(data.secondaryColor !== undefined && {
      secondaryColor: data.secondaryColor,
    }),
  });

  if (!updated) {
    return { success: false, error: "Failed to update ticket type" };
  }

  revalidatePath(`/my-events/${ticketType.eventId}`);
  return {
    success: true,
    data: {
      ...updated,
      price: Number(updated.price),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      salesStart: updated.salesStart?.toISOString() ?? null,
      salesEnd: updated.salesEnd?.toISOString() ?? null,
    } as TicketType,
  };
}

/**
 * Delete a ticket type
 */
export async function deleteTicketTypeAction(
  ticketTypeId: string,
): Promise<ActionResult> {
  const ticketType = await getTicketTypeById(ticketTypeId);
  if (!ticketType) {
    return { success: false, error: "Ticket type not found" };
  }

  const check = await canEditEvent(ticketType.eventId);
  if (!check.allowed) {
    return { success: false, error: check.error ?? "Not authorized" };
  }

  const result = await dalDeleteTicketType(ticketTypeId);
  if (!result) {
    return { success: false, error: "Failed to delete ticket type" };
  }

  revalidatePath(`/my-events/${ticketType.eventId}`);
  return { success: true, data: undefined };
}

/**
 * Reorder ticket types
 */
export async function reorderTicketTypesAction(
  eventId: string,
  ticketTypeIds: string[],
): Promise<ActionResult> {
  const check = await canEditEvent(eventId);
  if (!check.allowed) {
    return { success: false, error: check.error ?? "Not authorized" };
  }

  const result = await dalReorderTicketTypes(ticketTypeIds);
  if (!result) {
    return { success: false, error: "Failed to reorder ticket types" };
  }

  revalidatePath(`/my-events/${eventId}`);
  return { success: true, data: undefined };
}
