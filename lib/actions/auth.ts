"use server";

import { createClient } from "@/utils/supabase/server";
import { clearActiveOrganizationId } from "@/lib/organization-context";
import { redirect } from "next/navigation";

/**
 * Sign out the current user and wipe all session-scoped state:
 * - Supabase auth session
 * - Active organization cookie (prevents bleed-over to next account)
 */
export async function signOutAction(): Promise<void> {
    const supabase = await createClient();

    // Clear org cookie first — must happen while the request is still active
    await clearActiveOrganizationId();

    // Invalidate the Supabase session (clears auth cookies)
    await supabase.auth.signOut();

    redirect("/auth/login");
}
