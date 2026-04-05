/**
 * Organization Data Access Layer (DAL)
 * Server-side database operations for organizations
 * Uses Prisma for type-safe database queries
 */

// Removed 'server-only' import to allow use in client/page components
import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { logger, logAction } from "@/lib/logger";
import { isReservedSlug } from "@/lib/validations/organization";
import type {
    Organization,
    OrganizationMember,
    OrganizationRole,
    OrganizationInvitation,
    InvitationStatus,
    MembershipRequest,
    MembershipRequestStatus
} from "@/lib/generated/prisma";

// Invitation with organization for display
export type InvitationWithOrganization = OrganizationInvitation & {
    organization: {
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
    };
};

// Invitation sent by organization (with inviter info)
export type SentInvitation = OrganizationInvitation & {
    inviter: {
        id: string;
        fullName: string | null;
        avatarUrl: string | null;
    } | null;
};

// Types for DAL operations
export type OrganizationCreateInput = {
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    tertiaryColor?: string;
    faviconUrl?: string;
    websiteUrl?: string;
    contactEmail?: string;
    createdBy: string;
};

export type OrganizationUpdateInput = Partial<Omit<OrganizationCreateInput, "createdBy">> & {
    phone?: string;
    socialLinks?: string[];
};

export type OrganizationWithRole = Organization & {
    role: OrganizationRole;
    memberCount?: number;
};

export type OrganizationSocialLink = { url: string };

export type OrganizationWithSocials = Organization & {
    socialLinks: OrganizationSocialLink[];
};

/**
 * Get organization by ID
 * Uses React cache for request deduplication
 */
export const getOrganizationById = cache(async (id: string): Promise<OrganizationWithSocials | null> => {
    try {
        return await prisma.organization.findUnique({
            where: { id },
            include: { socialLinks: true },
        }) as OrganizationWithSocials | null;
    } catch (error) {
        logger.error(error, "[DAL] Error fetching organization:");
        return null;
    }
});

/**
 * Get organization by slug
 */
export const getOrganizationBySlug = cache(async (slug: string): Promise<OrganizationWithSocials | null> => {
    try {
        return await prisma.organization.findUnique({
            where: { slug },
            include: { socialLinks: true },
        }) as OrganizationWithSocials | null;
    } catch (error) {
        return await prisma.organization.findUnique({
            where: { slug },
            include: { socialLinks: true },
        }) as OrganizationWithSocials | null;
    }
});

/**
 * Check if slug is available (not used by another org and not reserved)
 */
export async function isSlugAvailable(slug: string, excludeOrgId?: string): Promise<boolean> {
    try {
        // Check if slug is reserved for system routes
        if (isReservedSlug(slug)) {
            return false;
        }

        const existing = await prisma.organization.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (!existing) return true;
        if (excludeOrgId && existing.id === excludeOrgId) return true;
        return false;
    } catch (error) {
        logger.error(error, "[DAL] Error checking slug availability:");
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
            logger.error(error, "[DAL] Error fetching user organizations:");
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
            logger.error(error, "[DAL] Error fetching user role:");
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
        const startTime = performance.now();
        return await prisma.$transaction(async (tx) => {
            // Create the organization
            const org = await tx.organization.create({
                data: {
                    name: data.name,
                    slug: data.slug,
                    description: data.description,
                    logoUrl: data.logoUrl,
                    bannerUrl: data.bannerUrl,
                    primaryColor: data.primaryColor || "#02a605ff",
                    secondaryColor: data.secondaryColor || "#ffe100ff",
                    tertiaryColor: data.tertiaryColor || "#dc2626",
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

            logAction("createOrganization", performance.now() - startTime);
            return org;
        });
    } catch (error) {
        logger.error(error, "[DAL] Error creating organization:");
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
        const { socialLinks, ...baseData } = data;

        return await prisma.$transaction(async (tx) => {
            // Update base organization fields
            const org = await tx.organization.update({
                where: { id },
                data: baseData,
            });

            // If socialLinks provided, sync them
            if (socialLinks !== undefined) {
                // Delete existing
                await tx.organizationSocialLink.deleteMany({
                    where: { organizationId: id },
                });

                // Create new ones
                if (socialLinks.length > 0) {
                    await tx.organizationSocialLink.createMany({
                        data: socialLinks.map(url => ({
                            url,
                            organizationId: id,
                        })),
                    });
                }
            }

            return org;
        });
    } catch (error) {
        logger.error(error, "[DAL] Error updating organization:");
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
        logger.error(error, "[DAL] Error deleting organization:");
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
        logger.error(error, "[DAL] Error adding organization member:");
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
        logger.error(error, "[DAL] Error updating member role:");
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
        logger.error(error, "[DAL] Error removing organization member:");
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
        logger.error(error, "[DAL] Error updating organization member role:");
        return false;
    }
}

/**
 * Get organization members with pagination
 */
export const getOrganizationMembers = cache(async (
    organizationId: string,
    options?: { page?: number; limit?: number }
) => {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    try {
        const startTime = performance.now();
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

        logAction("getOrganizationMembers", performance.now() - startTime);

        return {
            members,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        logger.error(error, "[DAL] Error fetching organization members:");
        return { members: [], total: 0, page: 1, totalPages: 0 };
    }
});

/**
 * Get pending invitations for an email
 */
export const getPendingInvitationsForEmail = cache(async (email: string): Promise<InvitationWithOrganization[]> => {
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
        logger.error(error, "[DAL] Error fetching pending invitations:");
        return [];
    }
});

/**
 * Get invitations sent by an organization
 */
export const getOrganizationInvitations = cache(async (organizationId: string): Promise<SentInvitation[]> => {
    try {
        return await prisma.organizationInvitation.findMany({
            where: {
                organizationId,
            },
            include: {
                inviter: {
                    select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching organization invitations:");
        return [];
    }
});

/**
 * Get invitation by ID
 */
export const getInvitationById = cache(async (id: string): Promise<OrganizationInvitation | null> => {
    try {
        return await prisma.organizationInvitation.findUnique({
            where: { id },
            include: {
                organization: true,
            },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching invitation by ID:");
        return null;
    }
});

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
        logger.error(error, "[DAL] Error updating invitation status:");
        return null;
    }
}

/**
 * Delete an invitation
 */
export async function deleteInvitation(id: string): Promise<boolean> {
    try {
        await prisma.organizationInvitation.delete({
            where: { id },
        });
        return true;
    } catch (error) {
        logger.error(error, "[DAL] Error deleting invitation:");
        return false;
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
        logger.error(error, "[DAL] Error completing invitation acceptance:");
        return false;
    }
}

/**
 * Get organization profile with viewer-visible published events.
 * Public visitors only see public events; organization members also see private published events.
 */
export const getOrganizationProfile = cache(async (slug: string, viewerUserId?: string) => {
    try {
        return await prisma.organization.findUnique({
            where: {
                slug, 
            },
            include: {
                socialLinks: true,
                events: {
                    where: {
                        status: { notIn: ["draft", "cancelled"] },
                        ...(viewerUserId
                            ? {
                                OR: [
                                    { isPublic: true },
                                    {
                                        organization: {
                                            members: {
                                                some: { userId: viewerUserId },
                                            },
                                        },
                                    },
                                ],
                            }
                            : { isPublic: true }),
                    },
                    include: {
                        sponsors: true,
                        galleryLinks: true,
                        socialLinks: true,
                    },
                    orderBy: { startDate: "asc" },
                },
                _count: {
                    select: { members: true },
                },
            },
        });
    } catch (error) {
        logger.error(error, "[DAL] Error fetching organization profile:");
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
        logger.error(error, "[DAL] Error creating membership request:");
        return null;
    }
}

export const getMembershipRequest = cache(async (organizationId: string, userId: string): Promise<MembershipRequest | null> => {
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
        logger.error(error, "[DAL] Error fetching membership request:");
        return null;
    }
});

/**
 * Handle membership requests (admin side)
 */
export const getMembershipRequests = cache(async (organizationId: string): Promise<MembershipRequest[]> => {
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
        logger.error(error, "[DAL] Error fetching membership requests:");
        return [];
    }
});

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
        logger.error(error, "[DAL] Error updating membership request status:");
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
        logger.error(error, "[DAL] Error creating invitation:");
        return null;
    }
}
