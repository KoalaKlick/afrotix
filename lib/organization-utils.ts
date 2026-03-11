import { getActiveOrganizationId } from "@/lib/organization-context";
import { getUserOrganizations } from "@/lib/dal/organization";

/**
 * Gets the active organization ID from cookies, or falls back to the first 
 * organization the user can manage (owner/admin) if the cookie is missing.
 * Returns null if the user has no manageable organizations.
 */
export async function getEffectiveOrganizationId(userId: string): Promise<string | null> {
    const activeOrgId = await getActiveOrganizationId();

    // If we have an active org ID, return it
    if (activeOrgId) {
        return activeOrgId;
    }

    // Fallback: find the first organization they can manage
    const organizations = await getUserOrganizations(userId);
    const manageableOrg = organizations.find(
        (o: any) => o.role === "owner" || o.role === "admin"
    );

    return manageableOrg?.id ?? null;
}
