"use server";

import { logger } from '@/lib/logger';
/**
 * Organization Server Actions
 * Handles organization creation, updates, and management
 */



import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
    createOrgStep1Schema,
    createOrgStep2Schema,
    createOrgStep3Schema,
    generateSlug,
} from "@/lib/validations/organization";
import {
    createOrganization,
    updateOrganization,
    isSlugAvailable,
    getUserOrganizations,
    getUserRoleInOrganization,
    canManageOrganization,
    getInvitationById,
    completeInvitationAcceptance,
    updateInvitationStatus,
    createMembershipRequest,
    getMembershipRequest,
    getMembershipRequests,
    updateMembershipRequestStatus,
    createOrganizationInvitation,
    updateOrganizationMemberRole,
    removeOrganizationMember,
    addOrganizationMember,
} from "@/lib/dal/organization";
import { convertToWebP } from "@/lib/image-utils";
import { setActiveOrganizationId } from "@/lib/organization-context";
import { OrganizationRole, MembershipRequestStatus } from "@/lib/generated/prisma";

// Action result type
type ActionResult<T = void> = {
    success: boolean;
    error?: string;
    data?: T;
};

// Organization form state stored in session/local storage on client
export type OrgCreationFormState = {
    name?: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
    contactEmail?: string;
    websiteUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
};

/**
 * Get current user from Supabase auth
 */
async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    return {
        id: user.id,
        email: user.email ?? "",
    };
}

/**
 * Validate Step 1: Organization name and slug
 */
export async function validateOrgStep1(
    formData: FormData
): Promise<ActionResult<{ name: string; slug: string }>> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const name = formData.get("name") as string;
    let slug = formData.get("slug") as string;

    // Auto-generate slug if empty
    if (!slug && name) {
        slug = generateSlug(name);
    }

    const result = createOrgStep1Schema.safeParse({ name, slug });
    if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] ?? "Invalid input";
        return { success: false, error: firstError };
    }

    // Check slug availability
    const slugAvailable = await isSlugAvailable(result.data.slug);
    if (!slugAvailable) {
        return { success: false, error: "This URL is already taken. Try a different one." };
    }

    return { success: true, data: result.data };
}

/**
 * Validate Step 2: Logo and description
 */
export async function validateOrgStep2(
    formData: FormData
): Promise<ActionResult<{ logoUrl?: string; description?: string }>> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const rawData = {
        logoUrl: formData.get("logoUrl") as string,
        description: formData.get("description") as string,
    };

    const result = createOrgStep2Schema.safeParse(rawData);
    if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] ?? "Invalid input";
        return { success: false, error: firstError };
    }

    return { success: true, data: result.data };
}

/**
 * Upload organization logo to Supabase Storage
 */
export async function uploadOrgLogo(
    formData: FormData
): Promise<ActionResult<{ url: string }>> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
        return { success: false, error: "No file provided" };
    }

    // Convert to WebP for optimization
    let processedFile: File;
    try {
        processedFile = await convertToWebP(file, {
            quality: 0.85,
            maxWidth: 400,
            maxHeight: 400,
            maxSizeMB: 0.5,
        });
    } catch {
        // Fall back to original if conversion fails
        processedFile = file;
    }

    // Upload to Supabase Storage
    const supabase = await createClient();

    // Use user ID as first folder to match RLS policy
    const fileName = `temp-${Date.now()}.webp`;
    const filePath = `${user.id}/logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("organizations")
        .upload(filePath, processedFile, {
            contentType: "image/webp",
            upsert: true,
        });

    if (uploadError) {
        logger.error(uploadError, "[Action] Logo upload error:");
        return { success: false, error: "Failed to upload logo" };
    }

    // Get public URL
    const {
        data: { publicUrl },
    } = supabase.storage.from("organizations").getPublicUrl(filePath);

    return { success: true, data: { url: publicUrl } };
}

/**
 * Create organization (final step)
 */
export async function createNewOrganization(
    formData: FormData
): Promise<ActionResult<{ id: string; slug: string }>> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    // Extract all form data
    const data = {
        name: formData.get("name") as string,
        slug: formData.get("slug") as string,
        description: (formData.get("description") as string) || undefined,
        logoUrl: (formData.get("logoUrl") as string) || undefined,
        contactEmail: (formData.get("contactEmail") as string) || undefined,
        websiteUrl: (formData.get("websiteUrl") as string) || undefined,
        primaryColor: (formData.get("primaryColor") as string) || undefined,
        secondaryColor: (formData.get("secondaryColor") as string) || undefined,
    };

    // Validate step 1 data (required)
    const step1Result = createOrgStep1Schema.safeParse({
        name: data.name,
        slug: data.slug,
    });

    if (!step1Result.success) {
        const errors = step1Result.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0] ?? "Invalid input";
        return { success: false, error: firstError };
    }

    // Check slug availability again
    const slugAvailable = await isSlugAvailable(data.slug);
    if (!slugAvailable) {
        return { success: false, error: "This URL is already taken" };
    }

    // Create organization
    const org = await createOrganization({
        ...data,
        createdBy: user.id,
    });

    if (!org) {
        return { success: false, error: "Failed to create organization" };
    }

    // Set as active organization
    await setActiveOrganizationId(org.id);

    revalidatePath("/dashboard");
    revalidatePath("/promoter");

    return { success: true, data: { id: org.id, slug: org.slug } };
}

/**
 * Update existing organization
 */
export async function updateExistingOrganization(
    orgId: string,
    formData: FormData
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    // Check permission
    const canManage = await canManageOrganization(user.id, orgId);
    if (!canManage) {
        return { success: false, error: "You don't have permission to edit this organization" };
    }

    const data = {
        name: (formData.get("name") as string) || undefined,
        slug: (formData.get("slug") as string) || undefined,
        description: formData.get("description") as string,
        logoUrl: formData.get("logoUrl") as string,
        bannerUrl: formData.get("bannerUrl") as string,
        contactEmail: formData.get("contactEmail") as string,
        websiteUrl: formData.get("websiteUrl") as string,
        primaryColor: formData.get("primaryColor") as string,
        secondaryColor: formData.get("secondaryColor") as string,
    };

    // Check slug availability if changing
    if (data.slug) {
        const slugAvailable = await isSlugAvailable(data.slug, orgId);
        if (!slugAvailable) {
            return { success: false, error: "This URL is already taken" };
        }
    }

    const updated = await updateOrganization(orgId, data);
    if (!updated) {
        return { success: false, error: "Failed to update organization" };
    }

    revalidatePath(`/promoter/${updated.slug}`);
    revalidatePath("/dashboard");

    return { success: true };
}

/**
 * Get user's organizations (for switcher)
 */
export async function fetchUserOrganizations() {
    const user = await getCurrentUser();
    if (!user) {
        return [];
    }

    return getUserOrganizations(user.id);
}

/**
 * Generate unique slug suggestion
 */
export async function generateUniqueSlug(
    name: string
): Promise<ActionResult<{ slug: string }>> {
    let baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Try up to 10 variations
    while (counter <= 10) {
        const available = await isSlugAvailable(slug);
        if (available) {
            return { success: true, data: { slug } };
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    // Generate random suffix as fallback
    slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
    return { success: true, data: { slug } };
}

/**
 * Switch active organization
 * Sets the active org in cookie and revalidates the layout
 */
export async function switchOrganization(
    organizationId: string
): Promise<ActionResult> {
    logger.info({ data: organizationId }, "[switchOrganization] Switching to org:");

    const user = await getCurrentUser();
    if (!user) {
        logger.info("[switchOrganization] Not authenticated");
        return { success: false, error: "Not authenticated" };
    }

    // Verify user is a member of this organization
    const role = await getUserRoleInOrganization(user.id, organizationId);
    logger.info({ data: role }, "[switchOrganization] User role:");
    if (!role) {
        return { success: false, error: "You are not a member of this organization" };
    }

    // Set active organization in cookie
    await setActiveOrganizationId(organizationId);
    logger.info({ data: organizationId }, "[switchOrganization] Cookie set for org:");

    // Revalidate to refresh the layout with new org context
    revalidatePath("/", "layout");

    return { success: true };
}

/**
 * Accept organization invitation
 */
export async function acceptOrgInvitation(
    invitationId: string
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    // Get invitation
    const invitation = await getInvitationById(invitationId);
    if (!invitation) {
        return { success: false, error: "Invitation not found" };
    }

    // Verify invitation is for this user
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
        return { success: false, error: "This invitation was sent to a different email address" };
    }

    if (invitation.status !== "pending") {
        return { success: false, error: `This invitation has already been ${invitation.status}` };
    }

    // Check expiration if applicable
    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
        await updateInvitationStatus(invitationId, "expired");
        return { success: false, error: "This invitation has expired" };
    }

    // Complete acceptance
    const success = await completeInvitationAcceptance(
        invitationId,
        user.id,
        invitation.organizationId,
        invitation.role
    );

    if (!success) {
        return { success: false, error: "Failed to accept invitation" };
    }

    // Set as active organization
    await setActiveOrganizationId(invitation.organizationId);

    revalidatePath("/dashboard");
    revalidatePath("/(protected)", "layout");

    return { success: true };
}

/**
 * Decline organization invitation
 */
export async function declineOrgInvitation(
    invitationId: string
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    // Get invitation
    const invitation = await getInvitationById(invitationId);
    if (!invitation) {
        return { success: false, error: "Invitation not found" };
    }

    // Verify invitation is for this user
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
        return { success: false, error: "This invitation was sent to a different email address" };
    }

    if (invitation.status !== "pending") {
        return { success: false, error: `This invitation is already ${invitation.status}` };
    }

    const updated = await updateInvitationStatus(invitationId, "declined");
    if (!updated) {
        return { success: false, error: "Failed to decline invitation" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/(protected)", "layout");
    return { success: true };
}

/**
 * Request to join an organization
 */
export async function requestToJoinOrganization(
    organizationId: string,
    message?: string
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    // Check if already a member
    const role = await getUserRoleInOrganization(user.id, organizationId);
    if (role) {
        return { success: false, error: "You are already a member of this organization" };
    }

    // Check if a request is already pending
    const existingRequest = await getMembershipRequest(organizationId, user.id);
    if (existingRequest) {
        return { success: false, error: "You already have a pending request for this organization" };
    }

    const request = await createMembershipRequest({
        organizationId,
        userId: user.id,
        message,
    });

    if (!request) {
        return { success: false, error: "Failed to submit request" };
    }

    // Revalidate the organization profile page
    revalidatePath("/[slug]", "page");

    return { success: true };
}

/**
 * Invite a new member
 */
export async function inviteMember(
    organizationId: string,
    email: string,
    role: OrganizationRole
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const canManage = await canManageOrganization(user.id, organizationId);
    if (!canManage) return { success: false, error: "Insufficient permissions" };

    const invitation = await createOrganizationInvitation({
        organizationId,
        inviterId: user.id,
        email,
        role,
    });

    if (!invitation) return { success: false, error: "Failed to create invitation" };

    revalidatePath("/organization/manage");
    return { success: true };
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
    organizationId: string,
    userId: string,
    role: OrganizationRole
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const canManage = await canManageOrganization(user.id, organizationId);
    if (!canManage) return { success: false, error: "Insufficient permissions" };

    const success = await updateOrganizationMemberRole(organizationId, userId, role);
    if (!success) return { success: false, error: "Failed to update role" };

    revalidatePath("/organization/manage");
    return { success: true };
}

/**
 * Remove a member from the organization
 */
export async function removeMember(
    organizationId: string,
    userId: string
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };

    // Cannot remove yourself (should use leave organization instead)
    if (user.id === userId) return { success: false, error: "Cannot remove yourself. Use 'Leave Organization' instead." };

    const canManage = await canManageOrganization(user.id, organizationId);
    if (!canManage) return { success: false, error: "Insufficient permissions" };

    const success = await removeOrganizationMember(organizationId, userId);
    if (!success) return { success: false, error: "Failed to remove member" };

    revalidatePath("/organization/manage");
    return { success: true };
}

/**
 * Approve or reject a membership request
 */
export async function resolveMembershipRequest(
    requestId: string,
    organizationId: string,
    targetUserId: string,
    action: "approve" | "reject"
): Promise<ActionResult> {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const canManage = await canManageOrganization(user.id, organizationId);
    if (!canManage) return { success: false, error: "Insufficient permissions" };

    const status: MembershipRequestStatus = action === "approve" ? "approved" : "rejected";

    if (action === "approve") {
        const request = await updateMembershipRequestStatus(requestId, status, user.id);
        if (!request) return { success: false, error: "Failed to update request" };

        const existingRole = await getUserRoleInOrganization(targetUserId, organizationId);
        if (!existingRole) {
            await addOrganizationMember(organizationId, targetUserId, "member");
        }
    } else {
        const request = await updateMembershipRequestStatus(requestId, status, user.id);
        if (!request) return { success: false, error: "Failed to update request" };
    }

    revalidatePath("/organization/manage");
    revalidatePath(`/[slug]`, "page");

    return { success: true };
}
