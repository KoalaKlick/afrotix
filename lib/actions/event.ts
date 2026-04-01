/**
 * Event Server Actions
 * Server-side actions for event management
 */

"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import {
  createEventStep1Schema,
  createEventStep2Schema,
  createEventStep3Schema,
  createEventStep4Schema,
  createEventSchema,
  type CreateEventStep1Input,
  type CreateEventStep2Input,
  type CreateEventStep3Input,
  type CreateEventStep4Input,
} from "@/lib/validations/event";
import {
  createEvent,
  isEventSlugAvailable,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  getEventById,
} from "@/lib/dal/event";
import { getUserRoleInOrganization } from "@/lib/dal/organization";
import { normalizeEventStatus } from "@/lib/event-status";
import { getEffectiveOrganizationId } from "@/lib/organization-utils";
import type {
  EventType,
  EventStatus,
  VotingMode,
} from "@/lib/generated/prisma";
import { deleteStorageFile, STORAGE_BUCKETS } from "@/lib/storage-utils";
import { isVotingEventType } from "@/lib/validations/event";

// Action result type
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Validate event step 1 (title, slug, type)
 */
export async function validateEventStep1(
  formData: FormData,
): Promise<ActionResult<CreateEventStep1Input>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get active organization (falls back to first manageable org if no cookie)
  const organizationId = await getEffectiveOrganizationId(user.id);
  if (!organizationId) {
    return { success: false, error: "No active organization" };
  }

  // Parse form data
  const rawData = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    type: formData.get("type") as string,
    votingMode: (formData.get("votingMode") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
  };

  // Validate
  const result = createEventStep1Schema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  // Check slug availability
  const slugAvailable = await isEventSlugAvailable(
    organizationId,
    result.data.slug,
  );
  if (!slugAvailable) {
    return {
      success: false,
      error: "This slug is already taken",
      fieldErrors: {
        slug: ["This slug is already taken for this organization"],
      },
    };
  }

  return { success: true, data: result.data };
}

/**
 * Validate event step 2 (date & location)
 */
export async function validateEventStep2(
  formData: FormData,
): Promise<ActionResult<CreateEventStep2Input>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Parse form data
  const rawData = {
    startDate: (formData.get("startDate") as string) || undefined,
    endDate: (formData.get("endDate") as string) || undefined,
    timezone: (formData.get("timezone") as string) || "Africa/Accra",
    isVirtual: formData.get("isVirtual") === "true",
    virtualLink: (formData.get("virtualLink") as string) || undefined,
    venueName: (formData.get("venueName") as string) || undefined,
    venueAddress: (formData.get("venueAddress") as string) || undefined,
    venueCity: (formData.get("venueCity") as string) || undefined,
    venueCountry: (formData.get("venueCountry") as string) || "Ghana",
  };

  // Validate
  const result = createEventStep2Schema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  return { success: true, data: result.data };
}

/**
 * Validate event step 3 (media & settings)
 */
export async function validateEventStep3(
  formData: FormData,
): Promise<ActionResult<CreateEventStep3Input>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Parse form data
  const maxAttendeesRaw = formData.get("maxAttendees") as string;
  const rawData = {
    coverImage: (formData.get("coverImage") as string) || undefined,
    bannerImage: (formData.get("bannerImage") as string) || undefined,
    maxAttendees: maxAttendeesRaw
      ? Number.parseInt(maxAttendeesRaw, 10)
      : undefined,
    isPublic: formData.get("isPublic") !== "false",
  };

  // Validate
  const result = createEventStep3Schema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  return { success: true, data: result.data };
}

/**
 * Validate event step 4 (sponsors, socials, gallery)
 */
export async function validateEventStep4(
  formData: FormData,
): Promise<ActionResult<CreateEventStep4Input>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Parse complex fields from JSON strings
  const rawData = {
    sponsors: JSON.parse((formData.get("sponsors") as string) || "[]"),
    socialLinks: JSON.parse((formData.get("socialLinks") as string) || "[]"),
    galleryLinks: JSON.parse((formData.get("galleryLinks") as string) || "[]"),
  };

  // Validate
  const result = createEventStep4Schema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  return { success: true, data: result.data };
}

/**
 * Create a new event
 */
export async function createNewEvent(
  formData: FormData,
): Promise<ActionResult<{ id: string; title: string; slug: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get active organization (falls back to first manageable org if no cookie)
  const organizationId = await getEffectiveOrganizationId(user.id);
  if (!organizationId) {
    return { success: false, error: "No active organization" };
  }

  // Check user has permission (must be owner, admin, or member)
  const role = await getUserRoleInOrganization(user.id, organizationId);
  if (!role) {
    return {
      success: false,
      error: "Not authorized to create events in this organization",
    };
  }

  // Parse all form data
  const maxAttendeesRaw = formData.get("maxAttendees") as string;
  const rawData = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    type: formData.get("type") as string,
    votingMode: (formData.get("votingMode") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    startDate: (formData.get("startDate") as string) || undefined,
    endDate: (formData.get("endDate") as string) || undefined,
    timezone: (formData.get("timezone") as string) || "Africa/Accra",
    isVirtual: formData.get("isVirtual") === "true",
    virtualLink: (formData.get("virtualLink") as string) || undefined,
    venueName: (formData.get("venueName") as string) || undefined,
    venueAddress: (formData.get("venueAddress") as string) || undefined,
    venueCity: (formData.get("venueCity") as string) || undefined,
    venueCountry: (formData.get("venueCountry") as string) || "Ghana",
    coverImage: (formData.get("coverImage") as string) || undefined,
    bannerImage: (formData.get("bannerImage") as string) || undefined,
    maxAttendees: maxAttendeesRaw
      ? Number.parseInt(maxAttendeesRaw, 10)
      : undefined,
    isPublic: formData.get("isPublic") !== "false",
    sponsors: JSON.parse((formData.get("sponsors") as string) || "[]"),
    socialLinks: JSON.parse((formData.get("socialLinks") as string) || "[]"),
    galleryLinks: JSON.parse((formData.get("galleryLinks") as string) || "[]"),
  };

  // Validate
  const result = createEventSchema.safeParse(rawData);
  if (!result.success) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  // Check slug availability
  const slugAvailable = await isEventSlugAvailable(
    organizationId,
    result.data.slug,
  );
  if (!slugAvailable) {
    return {
      success: false,
      error: "This slug is already taken",
      fieldErrors: {
        slug: ["This slug is already taken for this organization"],
      },
    };
  }

  try {
    // Create the event
    const event = await createEvent({
      organizationId,
      creatorId: user.id,
      title: result.data.title,
      slug: result.data.slug,
      type: result.data.type as EventType,
      votingMode: (result.data.votingMode as VotingMode) || undefined,
      description: result.data.description,
      startDate: result.data.startDate,
      endDate: result.data.endDate,
      timezone: result.data.timezone,
      isVirtual: result.data.isVirtual,
      virtualLink: result.data.virtualLink,
      venueName: result.data.venueName,
      venueAddress: result.data.venueAddress,
      venueCity: result.data.venueCity,
      venueCountry: result.data.venueCountry,
      coverImage: result.data.coverImage,
      bannerImage: result.data.bannerImage,
      maxAttendees: result.data.maxAttendees ?? undefined,
      isPublic: result.data.isPublic,
      sponsors: result.data.sponsors,
      socialLinks: result.data.socialLinks,
      galleryLinks: result.data.galleryLinks,
    });

    // Revalidate paths
    revalidatePath("/my-events");
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: event.id,
        title: event.title,
        slug: event.slug,
      },
    };
  } catch (error) {
    console.error("[Action] Error creating event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

/**
 * Update an existing event
 */
export async function updateExistingEvent(
  eventId: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Get event to check organization
  const event = await getEventById(eventId);
  if (!event) {
    return { success: false, error: "Event not found" };
  }

  // Check user has permission
  const role = await getUserRoleInOrganization(user.id, event.organizationId);
  if (!role) {
    return { success: false, error: "Not authorized to update this event" };
  }

  // Parse form data for updates
  const updates: Record<string, unknown> = {};

  const fields = [
    "title",
    "description",
    "startDate",
    "endDate",
    "timezone",
    "venueName",
    "venueAddress",
    "venueCity",
    "venueCountry",
    "virtualLink",
    "coverImage",
    "bannerImage",
    "sponsors",
    "socialLinks",
    "galleryLinks",
  ];

  for (const field of fields) {
    const value = formData.get(field);
    if (value !== null) {
      // Special handling for JSON fields
      if (
        field === "sponsors" ||
        field === "socialLinks" ||
        field === "galleryLinks"
      ) {
        try {
          updates[field] = JSON.parse(value as string);
        } catch (e) {
          console.error(`Failed to parse ${field} JSON`, e);
        }
      } else {
        // Convert empty string to null to allow clearing fields (Prisma uses null to clear)
        updates[field] = value === "" ? null : value;
      }
    }
  }

  // Handle boolean and number fields
  if (formData.has("isVirtual")) {
    updates.isVirtual = formData.get("isVirtual") === "true";
  }
  if (formData.has("isPublic")) {
    updates.isPublic = formData.get("isPublic") !== "false";
  }
  // Block votingMode changes after creation
  if (formData.has("votingMode")) {
    return {
      success: false,
      error: "Voting mode cannot be changed after event creation",
    };
  }
  if (formData.has("maxAttendees")) {
    const val = formData.get("maxAttendees") as string;
    updates.maxAttendees = val ? Number.parseInt(val, 10) : null;
  }

  try {
    const updated = await updateEvent(eventId, updates);
    if (!updated) {
      return { success: false, error: "Failed to update event" };
    }

    // Cleanup old images if they changed
    if (
      updates.coverImage !== undefined &&
      event.coverImage &&
      event.coverImage !== updates.coverImage
    ) {
      await deleteStorageFile(STORAGE_BUCKETS.EVENTS, event.coverImage);
    }
    if (
      updates.bannerImage !== undefined &&
      event.bannerImage &&
      event.bannerImage !== updates.bannerImage
    ) {
      await deleteStorageFile(STORAGE_BUCKETS.EVENTS, event.bannerImage);
    }

    revalidatePath(`/my-events/${eventId}`);
    revalidatePath("/my-events");

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("[Action] Error updating event:", error);
    return { success: false, error: "Failed to update event" };
  }
}

/**
 * Publish an event
 */
export async function publishEvent(
  eventId: string,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const event = await getEventById(eventId);
  if (!event) {
    return { success: false, error: "Event not found" };
  }

  // Check user has permission (must be owner or admin)
  const role = await getUserRoleInOrganization(user.id, event.organizationId);
  if (!role || role === "member") {
    return { success: false, error: "Not authorized to publish events" };
  }

  try {
    const updated = await updateEventStatus(
      eventId,
      "published" as EventStatus,
    );
    if (!updated) {
      return { success: false, error: "Failed to publish event" };
    }

    revalidatePath(`/my-events/${eventId}`);
    revalidatePath("/my-events");

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("[Action] Error publishing event:", error);
    return { success: false, error: "Failed to publish event" };
  }
}

/**
 * Cancel an event
 */
export async function cancelEvent(
  eventId: string,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const event = await getEventById(eventId);
  if (!event) {
    return { success: false, error: "Event not found" };
  }

  // Check user has permission (must be owner or admin)
  const role = await getUserRoleInOrganization(user.id, event.organizationId);
  if (!role || role === "member") {
    return { success: false, error: "Not authorized to cancel events" };
  }

  try {
    const updated = await updateEventStatus(
      eventId,
      "cancelled" as EventStatus,
    );
    if (!updated) {
      return { success: false, error: "Failed to cancel event" };
    }

    revalidatePath(`/my-events/${eventId}`);
    revalidatePath("/my-events");

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("[Action] Error cancelling event:", error);
    return { success: false, error: "Failed to cancel event" };
  }
}

/**
 * Change event status to any value
 */
export async function changeEventStatus(
  eventId: string,
  status: string,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate status
  const validStatuses = ["draft", "published"];
  if (!validStatuses.includes(status)) {
    return { success: false, error: "Invalid status" };
  }

  const event = await getEventById(eventId);
  if (!event) {
    return { success: false, error: "Event not found" };
  }

  // Check user has permission (must be owner or admin)
  const role = await getUserRoleInOrganization(user.id, event.organizationId);
  if (!role || role === "member") {
    return { success: false, error: "Not authorized to change event status" };
  }

  try {
    const updated = await updateEventStatus(
      eventId,
      normalizeEventStatus(status),
    );
    if (!updated) {
      return { success: false, error: "Failed to change event status" };
    }

    revalidatePath(`/my-events/${eventId}`);
    revalidatePath("/my-events");

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("[Action] Error changing event status:", error);
    return { success: false, error: "Failed to change event status" };
  }
}

/**
 * Delete an event
 */
export async function deleteExistingEvent(
  eventId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const event = await getEventById(eventId);
  if (!event) {
    return { success: false, error: "Event not found" };
  }

  // Check user has permission (must be owner or admin)
  const role = await getUserRoleInOrganization(user.id, event.organizationId);
  if (!role || role === "member") {
    return { success: false, error: "Not authorized to delete events" };
  }

  // Only allow deleting draft events
  if (event.status !== "draft") {
    return { success: false, error: "Only draft events can be deleted" };
  }

  try {
    const deleted = await deleteEvent(eventId);
    if (!deleted) {
      return { success: false, error: "Failed to delete event" };
    }

    // Cleanup storage
    if (event.coverImage) {
      await deleteStorageFile(STORAGE_BUCKETS.EVENTS, event.coverImage);
    }
    if (event.bannerImage) {
      await deleteStorageFile(STORAGE_BUCKETS.EVENTS, event.bannerImage);
    }

    revalidatePath("/my-events");
    revalidatePath("/dashboard");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[Action] Error deleting event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}
import {
  getEventTicketTransactions,
  getEventVoteTransactions,
} from "@/lib/dal/event";

/**
 * Get paginated vote transactions for an event (Server Action)
 */
export async function getEventVoteTransactionsAction(
  eventId: string,
  page = 1,
  limit = 10,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const event = await getEventById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  // Check user has permission
  const role = await getUserRoleInOrganization(user.id, event.organizationId);
  if (!role) {
    throw new Error("Not authorized");
  }

  const offset = (page - 1) * limit;
  return await getEventVoteTransactions(eventId, { limit, offset });
}

/**
 * Get recent successful ticket transactions for an event.
 */
export async function getEventTicketTransactionsAction(
  eventId: string,
  limit = 10,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const event = await getEventById(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  const role = await getUserRoleInOrganization(user.id, event.organizationId);
  if (!role) {
    throw new Error("Not authorized");
  }

  return await getEventTicketTransactions(eventId, limit);
}
