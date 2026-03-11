import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
    getOrganizationById,
    getOrganizationMembers,
    getUserOrganizations,
    getUserRoleInOrganization,
    getMembershipRequests,
} from "@/lib/dal/organization";
import { getEffectiveOrganizationId } from "@/lib/organization-utils";
import { OrgManageClient } from "./OrgManageClient";

export default async function OrganizationManagePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    const activeOrgId = await getEffectiveOrganizationId(user.id);

    if (!activeOrgId) {
        redirect("/dashboard");
    }

    const [organization, membersData, joinRequests] = await Promise.all([
        getOrganizationById(activeOrgId),
        getOrganizationMembers(activeOrgId),
        getMembershipRequests(activeOrgId),
    ]);

    if (!organization) redirect("/dashboard");

    return (
        <OrgManageClient
            organization={organization}
            members={membersData.members as any}
            joinRequests={joinRequests as any}
            currentUserId={user.id}
        />
    );
}
