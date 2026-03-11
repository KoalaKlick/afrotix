/**
 * Organization Data Access Layer (DAL)
 * Server-side database operations for organizations
 * Uses Prisma for type-safe database queries
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import type { Organization, OrganizationMember, OrganizationRole } from "@/lib/generated/prisma";

// Types for DAL operations
export type OrganizationCreateInput = {
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    faviconUrl?: string;
    websiteUrl?: string;
    contactEmail?: string;
    createdBy: string;
};

export type OrganizationUpdateInput = Partial<Omit<OrganizationCreateInput, "createdBy">>;

export type OrganizationWithRole = Organization & {
    role: OrganizationRole;
    memberCount?: number;
};

/**
 * Get organization by ID
 * Uses React cache for request deduplication
 */
export const getOrganizationById = cache(async (id: string): Promise<Organization | null> => {
    try {
        return await prisma.organization.findUnique({
            where: { id },
        });
    } catch (error) {
        console.error("[DAL] Error fetching organization:", error);
        return null;
    }
});

/**
 * Get organization by slug
 */
export const getOrganizationBySlug = cache(async (slug: string): Promise<Organization | null> => {
    try {
        return await prisma.organization.findUnique({
            where: { slug },
        });
    } catch (error) {
        console.error("[DAL] Error fetching organization by slug:", error);
        return null;
    }
});

/**
 * Check if slug is available
 */
export async function isSlugAvailable(slug: string, excludeOrgId?: string): Promise<boolean> {
    try {
        const existing = await prisma.organization.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (!existing) return true;
        if (excludeOrgId && existing.id === excludeOrgId) return true;
        return false;
    } catch (error) {
        console.error("[DAL] Error checking slug availability:", error);
        return false;
    }
}

/**
 * Get all organizations for a user (where they are a member)
 */
export const getUserOrganizations = cache(
    async (userId: string): Promise<OrganizationWithRole[]> => {
        try {
            const memberships = await prisma.organizationMember.findMany({
                where: { userId },
                include: {
                    organization: {
                        include: {
                            _count: {
                                select: { members: true },
                            },
                        },
                    },
                },
                orderBy: { joinedAt: "asc" },
            });

            return memberships.map((m) => ({
                ...m.organization,
                role: m.role,
                memberCount: m.organization._count.members,
            }));
        } catch (error) {
            console.error("[DAL] Error fetching user organizations:", error);
            return [];
        }
    }
);

/**
 * Get user's role in an organization
 */
export const getUserRoleInOrganization = cache(
    async (userId: string, organizationId: string): Promise<OrganizationRole | null> => {
        try {
            const membership = await prisma.organizationMember.findUnique({
                where: {
                    organizationId_userId: {
                        organizationId,
                        userId,
                    },
                },
                select: { role: true },
            });

            return membership?.role ?? null;
        } catch (error) {
            console.error("[DAL] Error fetching user role:", error);
            return null;
        }
    }
);

/**
 * Check if user is a member of an organization
 */
export async function isUserMemberOf(userId: string, organizationId: string): Promise<boolean> {
    const role = await getUserRoleInOrganization(userId, organizationId);
    return role !== null;
}

/**
 * Check if user is owner/admin of an organization
 */
export async function canManageOrganization(
    userId: string,
    organizationId: string
): Promise<boolean> {
    const role = await getUserRoleInOrganization(userId, organizationId);
    return role === "owner" || role === "admin";
}

/**
 * Create a new organization and add creator as owner
 */
export async function createOrganization(data: OrganizationCreateInput): Promise<Organization | null> {
    try {
        return await prisma.$transaction(async (tx) => {
            // Create the organization
            const org = await tx.organization.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                    description: data.description,
                    logoUrl: data.logoUrl,
                    bannerUrl: data.bannerUrl,
                    primaryColor: data.primaryColor || "#6366f1",
                    secondaryColor: data.secondaryColor || "#1e293b",
                    faviconUrl: data.faviconUrl,
                    websiteUrl: data.websiteUrl,
                    contactEmail: data.contactEmail,
                    createdBy: data.createdBy,
                },
            });

            // Add creator as owner
            await tx.organizationMember.create({
                data: {
                    organizationId: org.id,
                    userId: data.createdBy,
                    role: "owner",
                },
            });

            return org;
        });
    } catch (error) {
        console.error("[DAL] Error creating organization:", error);
        return null;
    }
}

/**
 * Update organization
 */
export async function updateOrganization(
    id: string,
    data: OrganizationUpdateInput
): Promise<Organization | null> {
    try {
        return await prisma.organization.update({
            where: { id },
            data,
        });
    } catch (error) {
        console.error("[DAL] Error updating organization:", error);
        return null;
    }
}

/**
 * Delete organization (only owner can delete)
 */
export async function deleteOrganization(id: string): Promise<boolean> {
    try {
        await prisma.organization.delete({
            where: { id },
        });
        return true;
    } catch (error) {
        console.error("[DAL] Error deleting organization:", error);
        return false;
    }
}

/**
 * Add member to organization
 */
export async function addOrganizationMember(
    organizationId: string,
    userId: string,
    role: OrganizationRole = "member"
): Promise<OrganizationMember | null> {
    try {
        return await prisma.organizationMember.create({
            data: {
                organizationId,
                userId,
                role,
            },
        });
    } catch (error) {
        console.error("[DAL] Error adding organization member:", error);
        return null;
    }
}

/**
 * Update member role
 */
export async function updateMemberRole(
    organizationId: string,
    userId: string,
    role: OrganizationRole
): Promise<OrganizationMember | null> {
    try {
        return await prisma.organizationMember.update({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId,
                },
            },
            data: { role },
        });
    } catch (error) {
        console.error("[DAL] Error updating member role:", error);
        return null;
    }
}

/**
 * Remove member from organization
 */
export async function removeOrganizationMember(
    organizationId: string,
    userId: string
): Promise<boolean> {
    try {
        await prisma.organizationMember.delete({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId,
                },
            },
        });
        return true;
    } catch (error) {
        console.error("[DAL] Error removing organization member:", error);
        return false;
    }
}

/**
 * Get organization members with pagination
 */
export async function getOrganizationMembers(
    organizationId: string,
    options?: { page?: number; limit?: number }
) {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    try {
        const [members, total] = await Promise.all([
            prisma.organizationMember.findMany({
                where: { organizationId },
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            avatarUrl: true,
                            username: true,
                        },
                    },
                },
                orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
                skip,
                take: limit,
            }),
            prisma.organizationMember.count({
                where: { organizationId },
            }),
        ]);

        return {
            members,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        console.error("[DAL] Error fetching organization members:", error);
        return { members: [], total: 0, page: 1, totalPages: 0 };
    }
}
