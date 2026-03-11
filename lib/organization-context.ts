import { cookies } from "next/headers";

const ACTIVE_ORG_COOKIE = "active_organization_id";

/**
 * Get the active organization ID from cookies (server-side)
 */
export async function getActiveOrganizationId(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;
}

/**
 * Set the active organization ID in cookies (server-side)
 */
export async function setActiveOrganizationId(orgId: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, orgId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
    });
}

/**
 * Clear the active organization cookie (server-side)
 */
export async function clearActiveOrganizationId(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(ACTIVE_ORG_COOKIE);
}
