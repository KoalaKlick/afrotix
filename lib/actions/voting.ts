/**
 * Voting Server Actions
 * Server-side actions for managing voting categories and options
 */

"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma";
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
} from "@/lib/dal/voting";
import { getEventById } from "@/lib/dal/event";
import { getUserRoleInOrganization } from "@/lib/dal/organization";

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
        templateImage?: string;
        templateConfig?: Record<string, unknown>;
        showFinalImage?: boolean;
        allowPublicNomination?: boolean;
        nominationDeadline?: string;
        requireApproval?: boolean;
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
        templateImage?: string;
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
    });

    if (!updated) {
        return { success: false, error: "Failed to update category" };
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
        imageUrl?: string;
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
        imageUrl?: string;
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
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || undefined }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId || undefined }),
    });

    if (!updated) {
        return { success: false, error: "Failed to update nominee" };
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
export async function deleteOption(optionId: string): Promise<ActionResult> {
    const option = await getVotingOptionById(optionId);
    if (!option) {
        return { success: false, error: "Option not found" };
    }

    const check = await canEditEvent(option.eventId);
    if (!check.allowed) {
        return { success: false, error: check.error ?? "Not authorized" };
    }

    const deleted = await deleteVotingOption(optionId);
    if (!deleted) {
        return { success: false, error: "Failed to delete option" };
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

    const approved = await approveNomination(optionId);
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
        nominatedById: user?.id,
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


