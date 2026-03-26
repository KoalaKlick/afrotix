/**
 * Voting Data Access Layer (DAL)
 * Server-side database operations for voting categories, options, and votes
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { logger } from "@/lib/logger";
import type {
    Prisma,
    VotingCategory,
    VotingOption,
    VotingCategoryField,
    VotingOptionFieldValue,
    VotingOptionStatus
} from "@/lib/generated/prisma";

// Types for DAL operations
export type VotingCategoryCreateInput = {
    eventId: string;
    name: string;
    description?: string;
    orderIdx?: number;
    maxVotesPerUser?: number;
    allowMultiple?: boolean;
    // Public nomination settings
    allowPublicNomination?: boolean;
    nominationDeadline?: Date;
    requireApproval?: boolean;
    templateImage?: string;
};

export type VotingCategoryUpdateInput = Partial<Omit<VotingCategoryCreateInput, "eventId">>;

export type VotingOptionCreateInput = {
    eventId: string;
    categoryId?: string;
    optionText: string;
    nomineeCode?: string;
    email?: string;
    description?: string;
    imageUrl?: string;
    orderIdx?: number;
    status?: VotingOptionStatus;
    isPublicNomination?: boolean;
    nominatedById?: string;
    nominatedByEmail?: string;
    nominatedByName?: string;
};

export type VotingOptionUpdateInput = Partial<Omit<VotingOptionCreateInput, "eventId">>;

export type VotingCategoryFieldInput = {
    categoryId: string;
    fieldName: string;
    fieldType?: string;
    fieldLabel: string;
    placeholder?: string;
    isRequired?: boolean;
    options?: string[];
    orderIdx?: number;
};

export type VotingCategoryWithOptions = VotingCategory & {
    votingOptions: VotingOption[];
    customFields?: VotingCategoryField[];
};

export type VotingOptionWithFieldValues = VotingOption & {
    fieldValues: (VotingOptionFieldValue & { field: VotingCategoryField })[];
};

/**
 * Get all voting categories for an event
 */
export const getVotingCategories = cache(async (eventId: string, includeCustomFields = false): Promise<VotingCategoryWithOptions[]> => {
    try {
        return await prisma.votingCategory.findMany({
            where: { eventId },
            include: {
                votingOptions: {
                    where: { status: "approved" },
                    orderBy: { orderIdx: "asc" },
                },
                ...(includeCustomFields && {
                    customFields: {
                        orderBy: { orderIdx: "asc" },
                    },
                }),
            },
            orderBy: { orderIdx: "asc" },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching voting categories:");
        return [];
    }
});

/**
 * Get a single voting category by ID
 */
export const getVotingCategoryById = cache(async (id: string, includeCustomFields = false): Promise<VotingCategoryWithOptions | null> => {
    try {
        return await prisma.votingCategory.findUnique({
            where: { id },
            include: {
                votingOptions: {
                    where: { status: "approved" },
                    orderBy: { orderIdx: "asc" },
                },
                ...(includeCustomFields && {
                    customFields: {
                        orderBy: { orderIdx: "asc" },
                    },
                }),
            },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching voting category:");
        return null;
    }
});

/**
 * Create a new voting category
 */
export async function createVotingCategory(data: VotingCategoryCreateInput): Promise<VotingCategory | null> {
    try {
        // Get max orderIdx for the event
        const maxOrder = await prisma.votingCategory.aggregate({
            where: { eventId: data.eventId },
            _max: { orderIdx: true },
        });

        return await prisma.votingCategory.create({
            data: {
                ...data,
                orderIdx: data.orderIdx ?? (maxOrder._max.orderIdx ?? -1) + 1,
            },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error creating voting category:");
        return null;
    }
}

/**
 * Update a voting category
 */
export async function updateVotingCategory(id: string, data: VotingCategoryUpdateInput): Promise<VotingCategory | null> {
    try {
        return await prisma.votingCategory.update({
            where: { id },
            data,
        });
    } catch (error) {
        logger.error(error, "[DAL] Error updating voting category:");
        return null;
    }
}

/**
 * Delete a voting category
 */
export async function deleteVotingCategory(id: string): Promise<boolean> {
    try {
        await prisma.votingCategory.delete({
            where: { id },
        });
        return true;
    } catch (error) {
        logger.error(error, "[DAL] Error deleting voting category:");
        return false;
    }
}

/**
 * Get all voting options for an event 
 */
export const getVotingOptions = cache(async (eventId: string): Promise<VotingOption[]> => {
    try {
        return await prisma.votingOption.findMany({
            where: { eventId },
            orderBy: { orderIdx: "asc" },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching voting options:");
        return [];
    }
});

/**
 * Get voting options for a specific category
 */
export const getVotingOptionsByCategory = cache(async (categoryId: string): Promise<VotingOption[]> => {
    try {
        return await prisma.votingOption.findMany({
            where: { categoryId },
            orderBy: { orderIdx: "asc" },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching voting options by category:");
        return [];
    }
});

/**
 * Get a single voting option by ID
 */
export const getVotingOptionById = cache(async (id: string): Promise<VotingOption | null> => {
    try {
        return await prisma.votingOption.findUnique({
            where: { id },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching voting option:");
        return null;
    }
});

/**
 * Create a new voting option
 */
export async function createVotingOption(data: VotingOptionCreateInput): Promise<VotingOption | null> {
    try {
        // Get max orderIdx for the category (or event if no category)
        const maxOrder = await prisma.votingOption.aggregate({
            where: data.categoryId
                ? { categoryId: data.categoryId }
                : { eventId: data.eventId, categoryId: null },
            _max: { orderIdx: true },
        });

        return await prisma.votingOption.create({
            data: {
                ...data,
                orderIdx: data.orderIdx ?? (maxOrder._max.orderIdx ?? -1) + 1,
            },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error creating voting option:");
        return null;
    }
}

/**
 * Update a voting option
 */
export async function updateVotingOption(id: string, data: VotingOptionUpdateInput): Promise<VotingOption | null> {
    try {
        return await prisma.votingOption.update({
            where: { id },
            data,
        });
    } catch (error) {
        logger.error(error, "[DAL] Error updating voting option:");
        return null;
    }
}

/**
 * Delete a voting option
 */
export async function deleteVotingOption(id: string): Promise<boolean> {
    try {
        await prisma.votingOption.delete({
            where: { id },
        });
        return true;
    } catch (error) {
        logger.error(error, "[DAL] Error deleting voting option:");
        return false;
    }
}

/**
 * Get vote counts for an event/category
 */
export const getVoteCounts = cache(async (eventId: string, categoryId?: string): Promise<{ optionId: string; count: bigint }[]> => {
    try {
        const options = await prisma.votingOption.findMany({
            where: categoryId ? { categoryId } : { eventId },
            select: {
                id: true,
                votesCount: true,
            },
        });

        return options.map(opt => ({
            optionId: opt.id,
            count: opt.votesCount,
        }));
    } catch (error) {
        logger.error(error, "[DAL] Error fetching vote counts:");
        return [];
    }
});

/**
 * Reorder voting categories
 */
export async function reorderVotingCategories(categoryIds: string[]): Promise<boolean> {
    try {
        await prisma.$transaction(
            categoryIds.map((id, index) =>
                prisma.votingCategory.update({
                    where: { id },
                    data: { orderIdx: index },
                })
            )
        );
        return true;
    } catch (error) {
        logger.error(error, "[DAL] Error reordering voting categories:");
        return false;
    }
}

/**
 * Reorder voting options within a category
 */
export async function reorderVotingOptions(optionIds: string[]): Promise<boolean> {
    try {
        await prisma.$transaction(
            optionIds.map((id, index) =>
                prisma.votingOption.update({
                    where: { id },
                    data: { orderIdx: index },
                })
            )
        );
        return true;
    } catch (error) {
        logger.error(error, "[DAL] Error reordering voting options:");
        return false;
    }
}

// ============================================
// Custom Fields CRUD
// ============================================

/**
 * Get custom fields for a category
 */
export const getCategoryCustomFields = cache(async (categoryId: string): Promise<VotingCategoryField[]> => {
    try {
        return await prisma.votingCategoryField.findMany({
            where: { categoryId },
            orderBy: { orderIdx: "asc" },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching custom fields:");
        return [];
    }
});

/**
 * Create a custom field for a category
 */
export async function createCustomField(data: VotingCategoryFieldInput): Promise<VotingCategoryField | null> {
    try {
        const maxOrder = await prisma.votingCategoryField.aggregate({
            where: { categoryId: data.categoryId },
            _max: { orderIdx: true },
        });

        return await prisma.votingCategoryField.create({
            data: {
                ...data,
                orderIdx: data.orderIdx ?? (maxOrder._max.orderIdx ?? -1) + 1,
            },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error creating custom field:");
        return null;
    }
}

/**
 * Update a custom field
 */
export async function updateCustomField(id: string, data: Partial<VotingCategoryFieldInput>): Promise<VotingCategoryField | null> {
    try {
        return await prisma.votingCategoryField.update({
            where: { id },
            data,
        });
    } catch (error) {
        logger.error(error, "[DAL] Error updating custom field:");
        return null;
    }
}

/**
 * Delete a custom field
 */
export async function deleteCustomField(id: string): Promise<boolean> {
    try {
        await prisma.votingCategoryField.delete({
            where: { id },
        });
        return true;
    } catch (error) {
        logger.error(error, "[DAL] Error deleting custom field:");
        return false;
    }
}

/**
 * Reorder custom fields
 */
export async function reorderCustomFields(fieldIds: string[]): Promise<boolean> {
    try {
        await prisma.$transaction(
            fieldIds.map((id, index) =>
                prisma.votingCategoryField.update({
                    where: { id },
                    data: { orderIdx: index },
                })
            )
        );
        return true;
    } catch (error) {
        logger.error(error, "[DAL] Error reordering custom fields:");
        return false;
    }
}

// ============================================
// Field Values CRUD
// ============================================

/**
 * Set field values for a voting option
 */
export async function setOptionFieldValues(
    optionId: string,
    values: { fieldId: string; value: string }[]
): Promise<boolean> {
    try {
        await prisma.$transaction(
            values.map(({ fieldId, value }) =>
                prisma.votingOptionFieldValue.upsert({
                    where: { optionId_fieldId: { optionId, fieldId } },
                    create: { optionId, fieldId, value },
                    update: { value },
                })
            )
        );
        return true;
    } catch (error) {
        logger.error(error, "[DAL] Error setting field values:");
        return false;
    }
}

/**
 * Get field values for a voting option
 */
export const getOptionFieldValues = cache(async (optionId: string): Promise<(VotingOptionFieldValue & { field: VotingCategoryField })[]> => {
    try {
        return await prisma.votingOptionFieldValue.findMany({
            where: { optionId },
            include: { field: true },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching field values:");
        return [];
    }
});

// ============================================
// Nominee Code Generation
// ============================================

/**
 * Generate initials-based prefix from nominee name
 * - Takes first letter of each name part
 * - If only 2 parts, adds second letter of last name
 * - Always returns 3 uppercase letters
 */
function generateNomineePrefix(nomineeName: string): string {
    const parts = nomineeName.trim().split(/\s+/).filter(p => p.length > 0);

    if (parts.length === 0) {
        return "NOM"; // Fallback
    }

    // Get initials from each part
    const initials = parts.map(p => p[0].toUpperCase());

    if (initials.length >= 3) {
        // Use first 3 initials
        return initials.slice(0, 3).join("");
    } else if (initials.length === 2) {
        // 2 parts: add second letter of last name
        const lastName = parts[1];
        const thirdChar = lastName.length > 1 ? lastName[1].toUpperCase() : "X";
        return initials.join("") + thirdChar;
    } else {
        // Single name: use first 3 letters
        const name = parts[0].toUpperCase();
        return name.length >= 3 ? name.slice(0, 3) : name.padEnd(3, "X");
    }
}

/**
 * Generate a unique nominee code for an event based on nominee name
 */
export async function generateNomineeCode(eventId: string, nomineeName: string): Promise<string> {
    try {
        const prefix = generateNomineePrefix(nomineeName);

        // Find existing options with same prefix to determine next number
        const options = await prisma.votingOption.findMany({
            where: {
                eventId,
                nomineeCode: { startsWith: prefix },
            },
            select: { nomineeCode: true },
        });

        let maxNumber = 0;
        const regex = new RegExp(String.raw`^${prefix}(\d+)$`);
        for (const opt of options) {
            if (opt.nomineeCode) {
                const match = regex.exec(opt.nomineeCode);
                if (match) {
                    const num = Number.parseInt(match[1], 10);
                    if (num > maxNumber) maxNumber = num;
                }
            }
        }

        const nextNumber = maxNumber + 1;
        return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
    } catch (error) {
        logger.error(error, "[DAL] Error generating nominee code:");
        // Fallback to timestamp-based code
        return `NOM${Date.now().toString().slice(-6)}`;
    }
}

// ============================================
// Public Nominations
// ============================================

/**
 * Get pending nominations for a category (admin approval queue)
 */
export const getPendingNominations = cache(async (categoryId: string): Promise<VotingOptionWithFieldValues[]> => {
    try {
        return await prisma.votingOption.findMany({
            where: {
                categoryId,
                status: "pending",
            },
            include: {
                fieldValues: {
                    include: { field: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching pending nominations:");
        return [];
    }
});

/**
 * Approve a nomination
 */
export async function approveNomination(id: string): Promise<VotingOption | null> {
    try {
        return await prisma.votingOption.update({
            where: { id },
            data: { status: "approved" },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error approving nomination:");
        return null;
    }
}

/**
 * Reject a nomination
 */
export async function rejectNomination(id: string): Promise<VotingOption | null> {
    try {
        return await prisma.votingOption.update({
            where: { id },
            data: { status: "rejected" },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error rejecting nomination:");
        return null;
    }
}

/**
 * Submit a public nomination
 */
export async function submitPublicNomination(data: {
    eventId: string;
    categoryId: string;
    optionText: string;
    email?: string;
    description?: string;
    imageUrl?: string;
    nominatedByEmail?: string;
    nominatedByName?: string;
    nominatedById?: string;
    fieldValues?: { fieldId: string; value: string }[];
}): Promise<VotingOption | null> {
    try {
        const { fieldValues, ...optionData } = data;

        // Generate nominee code from name
        const nomineeCode = await generateNomineeCode(data.eventId, data.optionText);

        // Create the option with pending status
        const option = await prisma.votingOption.create({
            data: {
                ...optionData,
                nomineeCode,
                status: "pending",
                isPublicNomination: true,
            },
        });

        // Set field values if provided
        if (fieldValues && fieldValues.length > 0) {
            await setOptionFieldValues(option.id, fieldValues);
        }

        return option;
    } catch (error) {
        logger.error(error, "[DAL] Error submitting public nomination:");
        return null;
    }
}

/**
 * Get categories allowing public nominations for an event
 */
export const getPublicNominationCategories = cache(async (eventId: string): Promise<VotingCategoryWithOptions[]> => {
    try {
        const now = new Date();
        return await prisma.votingCategory.findMany({
            where: {
                eventId,
                allowPublicNomination: true,
                OR: [
                    { nominationDeadline: null },
                    { nominationDeadline: { gte: now } },
                ],
            },
            include: {
                votingOptions: {
                    where: { status: "approved" },
                    orderBy: { orderIdx: "asc" },
                },
                customFields: {
                    orderBy: { orderIdx: "asc" },
                },
            },
            orderBy: { orderIdx: "asc" },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching public nomination categories:");
        return [];
    }
});
