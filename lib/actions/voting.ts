/**
 * Voting Server Actions
 * Server-side actions for managing voting categories and options
 */

"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { generateDeletionCode } from "@/lib/utils";
import {
    createVotingCategory,
    updateVotingCategory,
    deleteVotingCategory,
    createVotingOption,
    updateVotingOption,
    deleteVotingOption,
    getVotingCategoryById,
    getVotingOptionById,
    reorderVotingCategories,
    reorderVotingOptions,
    createCustomField,
    updateCustomField,
    deleteCustomField,
    reorderCustomFields,
    setOptionFieldValues,
    approveNomination,
    rejectNomination,
    submitPublicNomination,
    generateNomineeCode,
    hasVotedInCategory,
} from "@/lib/dal/voting";
import { getEventById } from "@/lib/dal/event";
import { getUserRoleInOrganization } from "@/lib/dal/organization";
import { deleteStorageFile, STORAGE_BUCKETS } from "@/lib/storage-utils";

// Action result type
type ActionResult<T = void> =
    | { success: true; data: T }
    | { success: false; error: string };

/**
 * Helper to check if user can edit event
 */
async function canEditEvent(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { allowed: false, error: "Not authenticated" };
    }

    const event = await getEventById(eventId);
    if (!event) {
        return { allowed: false, error: "Event not found" };
    }

    const role = await getUserRoleInOrganization(user.id, event.organizationId);
    if (!role || role === "member") {
        return { allowed: false, error: "Not authorized" };
    }

    return { allowed: true, event, user };
}

// ===================
// CATEGORY ACTIONS
// ===================

/**
 * Create a new voting category
 */
export async function createCategory(
    eventId: string,
    data: {
        name: string;
        description?: string;
        maxVotesPerUser?: number;
        allowMultiple?: boolean;
        templateImage?: string | null;
        templateConfig?: Record<string, unknown>;
        showFinalImage?: boolean;
        allowPublicNomination?: boolean;
        nominationDeadline?: string;
        requireApproval?: boolean;
        showTotalVotesPublicly?: boolean;
        nominationPrice?: number;
        votePrice?: number;
    }
): Promise<ActionResult<{ id: string }>> {
    const check = await canEditEvent(eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    if (!data.name?.trim()) {
        return { success: false, error: "Category name is required" };
    }

    const category = await createVotingCategory({
        eventId,
        name: data.name.trim(),
        description: data.description?.trim(),
        maxVotesPerUser: data.maxVotesPerUser ?? 1,
        allowMultiple: data.allowMultiple ?? false,
        allowPublicNomination: data.allowPublicNomination ?? false,
        nominationDeadline: data.nominationDeadline ? new Date(data.nominationDeadline) : undefined,
        requireApproval: data.requireApproval ?? true,
        templateImage: data.templateImage,
        templateConfig: data.templateConfig,
        showFinalImage: data.showFinalImage,
        showTotalVotesPublicly: data.showTotalVotesPublicly,
        nominationPrice: data.nominationPrice,
        votePrice: data.votePrice,
    });

    if (!category) {
        return { success: false, error: "Failed to create category" };
    }

    revalidatePath(`/my-events/${eventId}`);
    return { success: true, data: { id: category.id } };
}

/**
 * Update a voting category
 */
export async function updateCategory(
    categoryId: string,
    data: {
        name?: string;
        description?: string;

        maxVotesPerUser?: number;
        allowMultiple?: boolean;
        allowPublicNomination?: boolean;
        nominationDeadline?: string | null;
        requireApproval?: boolean;
        templateImage?: string | null;
        templateConfig?: Record<string, unknown>;
        showFinalImage?: boolean;
        showTotalVotesPublicly?: boolean;
        nominationPrice?: number;
        votePrice?: number;
    }
): Promise<ActionResult<{ id: string }>> {
    const category = await getVotingCategoryById(categoryId);
    if (!category) {
        return { success: false, error: "Category not found" };
    }

    const check = await canEditEvent(category.eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    if (data.name !== undefined && !data.name.trim()) {
        return { success: false, error: "Category name cannot be empty" };
    }

    const updated = await updateVotingCategory(categoryId, {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || undefined }),
        ...(data.maxVotesPerUser !== undefined && { maxVotesPerUser: data.maxVotesPerUser }),
        ...(data.allowMultiple !== undefined && { allowMultiple: data.allowMultiple }),
        ...(data.allowPublicNomination !== undefined && { allowPublicNomination: data.allowPublicNomination }),
        ...(data.nominationDeadline !== undefined && {
            nominationDeadline: data.nominationDeadline ? new Date(data.nominationDeadline) : undefined
        }),
        ...(data.requireApproval !== undefined && { requireApproval: data.requireApproval }),
        ...(data.templateImage !== undefined && { templateImage: data.templateImage }),
        ...(data.templateConfig !== undefined && { templateConfig: data.templateConfig }),
        ...(data.showFinalImage !== undefined && { showFinalImage: data.showFinalImage }),
        ...(data.showTotalVotesPublicly !== undefined && { showTotalVotesPublicly: data.showTotalVotesPublicly }),
        ...(data.nominationPrice !== undefined && { nominationPrice: data.nominationPrice }),
        ...(data.votePrice !== undefined && { votePrice: data.votePrice }),
    });

    if (!updated) {
        return { success: false, error: "Failed to update category" };
    }

    // Cleanup old template image if it changed
    if (data.templateImage !== undefined && category.templateImage && category.templateImage !== data.templateImage) {
        await deleteStorageFile(STORAGE_BUCKETS.EVENTS, category.templateImage);
    }

    revalidatePath(`/my-events/${category.eventId}`);
    return { success: true, data: { id: updated.id } };
}

/**
 * Delete a voting category
 */
export async function deleteCategory(categoryId: string): Promise<ActionResult> {
    const category = await getVotingCategoryById(categoryId);
    if (!category) {
        return { success: false, error: "Category not found" };
    }

    const check = await canEditEvent(category.eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    const deleted = await deleteVotingCategory(categoryId);
    if (!deleted) {
        return { success: false, error: "Failed to delete category" };
    }

    // Cleanup storage
    if (category.templateImage) {
        await deleteStorageFile(STORAGE_BUCKETS.EVENTS, category.templateImage);
    }

    revalidatePath(`/my-events/${category.eventId}`);
    return { success: true, data: undefined };
}

/**
 * Reorder voting categories
 */
export async function reorderCategories(
    eventId: string,
    categoryIds: string[]
): Promise<ActionResult> {
    const check = await canEditEvent(eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    const success = await reorderVotingCategories(categoryIds);
    if (!success) {
        return { success: false, error: "Failed to reorder categories" };
    }

    revalidatePath(`/my-events/${eventId}`);
    return { success: true, data: undefined };
}

// ===================
// OPTION ACTIONS
// ===================

/**
 * Create a new voting option (nominee)
 */
export async function createOption(
    eventId: string,
    data: {
        categoryId?: string;
        optionText: string;
        nomineeCode?: string;
        email?: string;
        description?: string;
        imageUrl?: string | null;
        fieldValues?: { fieldId: string; value: string }[];
    }
): Promise<ActionResult<{ id: string; nomineeCode: string }>> {
    const check = await canEditEvent(eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    if (!data.optionText?.trim()) {
        return { success: false, error: "Nominee name is required" };
    }

    // Generate nominee code from name if not provided
    const nomineeCode = data.nomineeCode || await generateNomineeCode(eventId, data.optionText.trim());

    const option = await createVotingOption({
        eventId,
        categoryId: data.categoryId,
        optionText: data.optionText.trim(),
        nomineeCode,
        email: data.email?.trim(),
        description: data.description?.trim(),
        imageUrl: data.imageUrl,
    });

    if (!option) {
        return { success: false, error: "Failed to create nominee" };
    }

    // Set custom field values if provided
    if (data.fieldValues && data.fieldValues.length > 0) {
        await setOptionFieldValues(option.id, data.fieldValues);
    }

    revalidatePath(`/my-events/${eventId}`);
    return { success: true, data: { id: option.id, nomineeCode } };
}

/**
 * Update a voting option
 */
export async function updateOption(
    optionId: string,
    data: {
        optionText?: string;
        nomineeCode?: string;
        email?: string;
        description?: string;
        imageUrl?: string | null;
        categoryId?: string;
        fieldValues?: { fieldId: string; value: string }[];
    }
): Promise<ActionResult<{ id: string; nomineeCode: string | null }>> {
    const option = await getVotingOptionById(optionId);
    if (!option) {
        return { success: false, error: "Option not found" };
    }

    const check = await canEditEvent(option.eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    if (data.optionText !== undefined && !data.optionText.trim()) {
        return { success: false, error: "Nominee name cannot be empty" };
    }

    const updated = await updateVotingOption(optionId, {
        ...(data.optionText && { optionText: data.optionText.trim() }),
        ...(data.nomineeCode !== undefined && { nomineeCode: data.nomineeCode?.trim() || undefined }),
        ...(data.email !== undefined && { email: data.email?.trim() || undefined }),
        ...(data.description !== undefined && { description: data.description?.trim() || undefined }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId || undefined }),
    });

    if (!updated) {
        return { success: false, error: "Failed to update nominee" };
    }

    // Cleanup old image if it changed
    if (data.imageUrl !== undefined && option.imageUrl && option.imageUrl !== data.imageUrl) {
        await deleteStorageFile(STORAGE_BUCKETS.EVENTS, option.imageUrl);
    }

    // Update custom field values if provided
    if (data.fieldValues && data.fieldValues.length > 0) {
        await setOptionFieldValues(optionId, data.fieldValues);
    }

    revalidatePath(`/my-events/${option.eventId}`);
    return { success: true, data: { id: updated.id, nomineeCode: updated.nomineeCode } };
}

/**
 * Delete a voting option
 */
export async function deleteOption(optionId: string, deletionCode?: string): Promise<ActionResult> {
    const option = await getVotingOptionById(optionId);
    if (!option) {
        return { success: false, error: "Option not found" };
    }

    const check = await canEditEvent(option.eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    // Check if category has a price
    if (option.categoryId) {
        const category = await prisma.votingCategory.findUnique({
            where: { id: option.categoryId },
            select: { nominationPrice: true },
        });

        if (category && Number(category.nominationPrice) > 0) {
            // This is a paid nominee. If there's a deletionCode in DB, we must match it.
            const opt = option as any;
            if (opt.deletionCode) {
                if (!deletionCode) {
                    return { success: false, error: "Deletion code is required for paid nominees" };
                }
                if (opt.deletionCode !== deletionCode) {
                    return { success: false, error: "Invalid deletion code. Please ask the nominee for the code sent to their email." };
                }
            }
        }
    }

    const deleted = await deleteVotingOption(optionId);
    if (!deleted) {
        return { success: false, error: "Failed to delete nominee" };
    }

    // Cleanup storage
    if (option.imageUrl) {
        await deleteStorageFile(STORAGE_BUCKETS.EVENTS, option.imageUrl);
    }

    revalidatePath(`/my-events/${option.eventId}`);
    return { success: true, data: undefined };
}

/**
 * Reorder voting options
 */
export async function reorderOptionsAction(
    eventId: string,
    optionIds: string[]
): Promise<ActionResult> {
    const check = await canEditEvent(eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    const success = await reorderVotingOptions(optionIds);
    if (!success) {
        return { success: false, error: "Failed to reorder options" };
    }

    revalidatePath(`/my-events/${eventId}`);
    return { success: true, data: undefined };
}



// ===================
// CUSTOM FIELD ACTIONS
// ===================

/**
 * Create a custom field for a category
 */
export async function createCategoryField(
    categoryId: string,
    data: {
        fieldName: string;
        fieldType?: string;
        fieldLabel: string;
        placeholder?: string;
        isRequired?: boolean;
        options?: string[];
    }
): Promise<ActionResult<{ id: string }>> {
    const category = await getVotingCategoryById(categoryId);
    if (!category) {
        return { success: false, error: "Category not found" };
    }

    const check = await canEditEvent(category.eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    if (!data.fieldName?.trim() || !data.fieldLabel?.trim()) {
        return { success: false, error: "Field name and label are required" };
    }

    const field = await createCustomField({
        categoryId,
        fieldName: data.fieldName.trim(),
        fieldType: data.fieldType || "text",
        fieldLabel: data.fieldLabel.trim(),
        placeholder: data.placeholder?.trim(),
        isRequired: data.isRequired ?? false,
        options: data.options ?? [],
    });

    if (!field) {
        return { success: false, error: "Failed to create field" };
    }

    revalidatePath(`/my-events/${category.eventId}`);
    return { success: true, data: { id: field.id } };
}

/**
 * Update a custom field
 */
export async function updateCategoryField(
    fieldId: string,
    categoryId: string,
    data: {
        fieldName?: string;
        fieldType?: string;
        fieldLabel?: string;
        placeholder?: string;
        isRequired?: boolean;
        options?: string[];
    }
): Promise<ActionResult<{ id: string }>> {
    const category = await getVotingCategoryById(categoryId);
    if (!category) {
        return { success: false, error: "Category not found" };
    }

    const check = await canEditEvent(category.eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    const updated = await updateCustomField(fieldId, data);
    if (!updated) {
        return { success: false, error: "Failed to update field" };
    }

    revalidatePath(`/my-events/${category.eventId}`);
    return { success: true, data: { id: updated.id } };
}

/**
 * Delete a custom field
 */
export async function deleteCategoryField(
    fieldId: string,
    categoryId: string
): Promise<ActionResult> {
    const category = await getVotingCategoryById(categoryId);
    if (!category) {
        return { success: false, error: "Category not found" };
    }

    const check = await canEditEvent(category.eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    const deleted = await deleteCustomField(fieldId);
    if (!deleted) {
        return { success: false, error: "Failed to delete field" };
    }

    revalidatePath(`/my-events/${category.eventId}`);
    return { success: true, data: undefined };
}

/**
 * Reorder custom fields
 */
export async function reorderCategoryFields(
    categoryId: string,
    fieldIds: string[]
): Promise<ActionResult> {
    const category = await getVotingCategoryById(categoryId);
    if (!category) {
        return { success: false, error: "Category not found" };
    }

    const check = await canEditEvent(category.eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    const success = await reorderCustomFields(fieldIds);
    if (!success) {
        return { success: false, error: "Failed to reorder fields" };
    }

    revalidatePath(`/my-events/${category.eventId}`);
    return { success: true, data: undefined };
}

// ===================
// NOMINATION ACTIONS
// ===================

/**
 * Approve a pending nomination
 */
export async function approveNominationAction(
    optionId: string
): Promise<ActionResult<{ id: string }>> {
    const option = await getVotingOptionById(optionId);
    if (!option) {
        return { success: false, error: "Nomination not found" };
    }

    const check = await canEditEvent(option.eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    // Check if category has a price
    let deletionCode = undefined;
    if (option.categoryId) {
        const category = await getVotingCategoryById(option.categoryId);
        if (category && Number(category.nominationPrice) > 0) {
            deletionCode = generateDeletionCode();
        }
    }

    const approved = await updateVotingOption(optionId, { 
        status: "approved" as any,
        ...(deletionCode && { deletionCode })
    });
    
    if (!approved) {
        return { success: false, error: "Failed to approve nomination" };
    }

    revalidatePath(`/my-events/${option.eventId}`);
    return { success: true, data: { id: approved.id } };
}

/**
 * Reject a pending nomination
 */
export async function rejectNominationAction(
    optionId: string
): Promise<ActionResult> {
    const option = await getVotingOptionById(optionId);
    if (!option) {
        return { success: false, error: "Nomination not found" };
    }

    const check = await canEditEvent(option.eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    const rejected = await rejectNomination(optionId);
    if (!rejected) {
        return { success: false, error: "Failed to reject nomination" };
    }

    revalidatePath(`/my-events/${option.eventId}`);
    return { success: true, data: undefined };
}

/**
 * Submit a public nomination (no auth required, but can track if logged in)
 */
export async function submitPublicNominationAction(
    data: {
        eventId: string;
        categoryId: string;
        optionText: string;
        email?: string;
        description?: string;
        imageUrl?: string;
        nominatorEmail?: string;
        nominatorName?: string;
        fieldValues?: { fieldId: string; value: string }[];
    }
): Promise<ActionResult<{ id: string; nomineeCode: string }>> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!data.optionText?.trim()) {
        return { success: false, error: "Nominee name is required" };
    }

    // Verify category allows public nominations
    const category = await getVotingCategoryById(data.categoryId);
    if (!category) {
        return { success: false, error: "Category not found" };
    }

    if (!category.allowPublicNomination) {
        return { success: false, error: "This category does not accept public nominations" };
    }

    // Check nomination deadline
    if (category.nominationDeadline && new Date() > category.nominationDeadline) {
        return { success: false, error: "Nomination deadline has passed" };
    }

    const nomination = await submitPublicNomination({
        eventId: data.eventId,
        categoryId: data.categoryId,
        optionText: data.optionText.trim(),
        email: data.email?.trim(),
        description: data.description?.trim(),
        imageUrl: data.imageUrl,
        nominatedById: user?.is_anonymous ? undefined : user?.id,
        nominatedByEmail: data.nominatorEmail?.trim() || user?.email,
        nominatedByName: data.nominatorName?.trim(),
        fieldValues: data.fieldValues,
    });

    if (!nomination) {
        return { success: false, error: "Failed to submit nomination" };
    }

    return {
        success: true,
        data: {
            id: nomination.id,
            nomineeCode: nomination.nomineeCode || ""
        }
    };
}


/**
 * Revalidate public voting paths (e.g., after payment success)
 */
export async function revalidatePublicVoting(
    slug: string,
    eventSlug: string,
    categoryId?: string
): Promise<ActionResult> {
    try {
        revalidatePath(`/${slug}/event/${eventSlug}`);
        if (categoryId) {
            revalidatePath(`/${slug}/event/${eventSlug}/category/${categoryId}`);
        }
        return { success: true, data: undefined };
    } catch (error) {
        console.error("[Action] Error revalidating public paths:", error);
        return { success: false, error: "Failed to revalidate" };
    }
}

/**
 * Get internal vote participation for a category (Action)
 */
export async function getInternalVoteParticipationAction(
    eventId: string,
    categoryId: string
): Promise<ActionResult<any[]>> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const event = await getEventById(eventId);
    if (!event) {
        return { success: false, error: "Event not found" };
    }

    const role = await getUserRoleInOrganization(user.id, event.organizationId);
    if (!role) {
        return { success: false, error: "Not authorized" };
    }

    try {
        const { getInternalVoteParticipation } = await import("@/lib/dal/voting");
        const participants = await getInternalVoteParticipation(eventId, categoryId);
        return { success: true, data: participants };
    } catch (error) {
        console.error("[Action] Error fetching participation:", error);
        return { success: false, error: "Failed to fetch participation" };
    }
}

/**
 * Check if the current authenticated user has already voted in a category.
 */
/**
 * Check if a user or event member has already voted in a category.
 */
export async function checkVoteStatusAction(categoryId: string, uniqueCode?: string): Promise<ActionResult<{ hasVoted: boolean }>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let eventMemberId: string | undefined;
        if (uniqueCode) {
            const member = await prisma.eventMember.findUnique({
                where: { uniqueCode },
                select: { id: true }
            });
            eventMemberId = member?.id;
        }

        const hasVoted = await hasVotedInCategory(categoryId, { 
            voterId: user?.id, 
            eventMemberId 
        });
        
        return { success: true, data: { hasVoted } };
    } catch (error) {
        console.error("[Action] Error checking vote status:", error);
        return { success: false, error: "Failed to check vote status" };
    }
}
/**
 * Cast a vote using an Event Member unique code.
 */
export async function castMemberVote(
    data: {
        eventId: string;
        categoryId: string;
        optionId: string;
        uniqueCode: string;
    }
): Promise<ActionResult<{ id: string }>> {
    try {
        const { eventId, categoryId, optionId, uniqueCode } = data;

        // Verify member code
        const member = await prisma.eventMember.findFirst({
            where: {
                eventId,
                uniqueCode,
            },
        });

        if (!member) {
            return { success: false, error: "Invalid unique code" };
        }

        // Get category to check maxVotesPerUser
        const category = await getVotingCategoryById(categoryId);
        if (!category) {
            return { success: false, error: "Category not found" };
        }

        // Check how many times this member has voted in this category
        const existingVoteCount = await prisma.vote.count({
            where: {
                categoryId,
                eventMemberId: member.id,
            },
        });

        if (existingVoteCount >= category.maxVotesPerUser) {
            return { success: false, error: `This code has already been used for ${category.maxVotesPerUser} vote(s) in this category` };
        }

        // Create vote record
        const vote = await prisma.vote.create({
            data: {
                eventId,
                categoryId,
                optionId,
                eventMemberId: member.id,
                voterEmail: member.email,
                voteCount: 1,
            },
        });

        // Increment the nominee's vote count
        await prisma.votingOption.update({
            where: { id: optionId },
            data: { votesCount: { increment: 1 } },
        });

        // Update member status to 'voted' if not already
        if (member.status !== "voted") {
            await prisma.eventMember.update({
                where: { id: member.id },
                data: { status: "voted" },
            });
        }

        // Revalidate admin paths
        revalidatePath(`/dashboard/events/${eventId}`);
        
        // Revalidate public paths
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: { organization: { select: { slug: true } } },
        });
        
        if (event) {
            revalidatePath(`/${event.organization.slug}/event/${event.slug}`);
            revalidatePath(`/${event.organization.slug}/event/${event.slug}/category/${categoryId}`);
        }

        return { success: true, data: { id: vote.id } };
    } catch (error) {
        console.error("[Action] Error casting member vote:", error);
        return { success: false, error: "Failed to cast vote" };
    }
}
