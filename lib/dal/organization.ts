/**
 * Organization Data Access Layer (DAL)
 * Server-side database operations for organizations
 * Uses Prisma for type-safe database queries
 */

import "server-only";
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { logger } from "@/lib/logger";
import type {
    Organization,
    OrganizationMember,
    OrganizationRole,
    OrganizationInvitation,
    InvitationStatus,
    MembershipRequest,
    MembershipRequestStatus,
    Event
} from "@/lib/generated/prisma";

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
        logger.error("[DAL] Error fetching organization:", error);
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
        logger.error("[DAL] Error fetching organization by slug:", error);
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
        logger.error("[DAL] Error checking slug availability:", error);
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
            logger.error("[DAL] Error fetching user organizations:", error);
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
            logger.error("[DAL] Error fetching user role:", error);
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
        logger.error("[DAL] Error creating organization:", error);
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
        logger.error("[DAL] Error updating organization:", error);
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
        logger.error("[DAL] Error deleting organization:", error);
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
        logger.error("[DAL] Error adding organization member:", error);
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
        logger.error("[DAL] Error updating member role:", error);
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
        logger.error("[DAL] Error removing organization member:", error);
        return false;
    }
}

/**
 * Update member role in organization
 */
export async function updateOrganizationMemberRole(
    organizationId: string,
    userId: string,
    role: OrganizationRole
): Promise<boolean> {
    try {
        await prisma.organizationMember.update({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId,
                },
            },
            data: { role },
        });
        return true;
    } catch (error) {
        logger.error("[DAL] Error updating organization member role:", error);
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
        logger.error("[DAL] Error fetching organization members:", error);
        return { members: [], total: 0, page: 1, totalPages: 0 };
    }
}

/**
 * Get pending invitations for an email
 */
export async function getPendingInvitationsForEmail(email: string): Promise<OrganizationInvitation[]> {
    try {
        return await prisma.organizationInvitation.findMany({
            where: {
                email,
                status: "pending",
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } },
                ],
            },
            include: {
                organization: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        logoUrl: true,
                    },
                },
            },
        });
    } catch (error) {
        logger.error("[DAL] Error fetching pending invitations:", error);
        return [];
    }
}

/**
 * Get invitation by ID
 */
export async function getInvitationById(id: string): Promise<OrganizationInvitation | null> {
    try {
        return await prisma.organizationInvitation.findUnique({
            where: { id },
            include: {
                organization: true,
            },
        });
    } catch (error) {
        logger.error("[DAL] Error fetching invitation by ID:", error);
        return null;
    }
}

/**
 * Update invitation status
 */
export async function updateInvitationStatus(
    id: string,
    status: InvitationStatus
): Promise<OrganizationInvitation | null> {
    try {
        return await prisma.organizationInvitation.update({
            where: { id },
            data: {
                status,
                respondedAt: new Date(),
            },
        });
    } catch (error) {
        logger.error("[DAL] Error updating invitation status:", error);
        return null;
    }
}

/**
 * Accept an invitation (transaction)
 */
export async function completeInvitationAcceptance(
    invitationId: string,
    userId: string,
    organizationId: string,
    role: OrganizationRole
): Promise<boolean> {
    try {
        await prisma.$transaction(async (tx) => {
            // Add member
            await tx.organizationMember.create({
                data: {
                    organizationId,
                    userId,
                    role,
                },
            });

            // Update invitation
            await tx.organizationInvitation.update({
                where: { id: invitationId },
                data: {
                    status: "accepted",
                    respondedAt: new Date(),
                },
            });
        });
        return true;
    } catch (error) {
        logger.error("[DAL] Error completing invitation acceptance:", error);
        return false;
    }
}

/**
 * Get organization profile with public events
 */
export const getOrganizationProfile = cache(async (slug: string) => {
    try {
        return await prisma.organization.findUnique({
            where: { slug },
            include: {
                events: {
                    where: {
                        status: "published",
                        isPublic: true,
                    },
                    orderBy: { startDate: "asc" },
                },
                _count: {
                    select: { members: true },
                },
            },
        });
    } catch (error) {
        logger.error("[DAL] Error fetching organization profile:", error);
        return null;
    }
});

/**
 * Handle membership requests
 */
export async function createMembershipRequest(data: {
    organizationId: string;
    userId: string;
    message?: string;
}): Promise<MembershipRequest | null> {
    try {
        return await prisma.membershipRequest.create({
            data: {
                organizationId: data.organizationId,
                userId: data.userId,
                message: data.message,
                status: "pending",
            },
        });
    } catch (error) {
        logger.error("[DAL] Error creating membership request:", error);
        return null;
    }
}

export async function getMembershipRequest(organizationId: string, userId: string): Promise<MembershipRequest | null> {
    try {
        return await prisma.membershipRequest.findUnique({
            where: {
                organizationId_userId_status: {
                    organizationId,
                    userId,
                    status: "pending",
                },
            },
        });
    } catch (error) {
        logger.error("[DAL] Error fetching membership request:", error);
        return null;
    }
}

/**
 * Handle membership requests (admin side)
 */
export async function getMembershipRequests(organizationId: string): Promise<MembershipRequest[]> {
    try {
        return await prisma.membershipRequest.findMany({
            where: {
                organizationId,
                status: "pending",
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    } catch (error) {
        logger.error("[DAL] Error fetching membership requests:", error);
        return [];
    }
}

export async function updateMembershipRequestStatus(
    requestId: string,
    status: MembershipRequestStatus,
    resolvedBy: string
): Promise<MembershipRequest | null> {
    try {
        return await prisma.membershipRequest.update({
            where: { id: requestId },
            data: {
                status,
                resolvedAt: new Date(),
                resolvedBy,
            },
        });
    } catch (error) {
        logger.error("[DAL] Error updating membership request status:", error);
        return null;
    }
}

/**
 * Create organization invitation
 */
export async function createOrganizationInvitation(data: {
    organizationId: string;
    inviterId: string;
    email: string;
    role: OrganizationRole;
}): Promise<OrganizationInvitation | null> {
    try {
        return await prisma.organizationInvitation.create({
            data: {
                organizationId: data.organizationId,
                inviterId: data.inviterId,
                email: data.email.toLowerCase(),
                role: data.role,
                status: "pending",
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });
    } catch (error) {
        logger.error("[DAL] Error creating invitation:", error);
        return null;
    }
}
