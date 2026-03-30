import { NextRequest, NextResponse } from "next/server";
import { getEffectiveOrganizationId } from "@/lib/organization-utils";
import { getUserRoleInOrganization, getOrganizationById } from "@/lib/dal/organization";
import { getOrganizationEvents, getOrganizationEventStats } from "@/lib/dal/event";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
    const { userId } = await req.json();
    if (!userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const orgId = await getEffectiveOrganizationId(userId);
    if (!orgId) {
        return NextResponse.json({ error: "No organization found" }, { status: 404 });
    }

    const [role, events, stats, organization] = await Promise.all([
        getUserRoleInOrganization(userId, orgId),
        getOrganizationEvents(orgId),
        getOrganizationEventStats(orgId),
        getOrganizationById(orgId),
    ]);

    if (!role) {
        return NextResponse.json({ error: "No role found" }, { status: 403 });
    }

    return NextResponse.json({ events, stats, organization });
}
