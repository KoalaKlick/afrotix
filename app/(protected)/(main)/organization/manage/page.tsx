import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
    getOrganizationById,
    getOrganizationMembers,
    getUserOrganizations,
    getUserRoleInOrganization,
    getMembershipRequests,
    getOrganizationInvitations,
} from "@/lib/dal/organization";
import { getEffectiveOrganizationId } from "@/lib/organization-utils";
import { OrgManageClient } from "@/components/organization/OrgManageClient";

export default async function OrganizationManagePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    const activeOrgId = await getEffectiveOrganizationId(user.id);

    if (!activeOrgId) {
        redirect("/dashboard");
    }

    const [organization, membersData, joinRequests, invitations] = await Promise.all([
        getOrganizationById(activeOrgId),
        getOrganizationMembers(activeOrgId),
        getMembershipRequests(activeOrgId),
        getOrganizationInvitations(activeOrgId),
    ]);

    if (!organization) redirect("/dashboard");

    return (
        <OrgManageClient
            organization={organization}
            members={membersData.members as any}
            joinRequests={joinRequests as any}
            invitations={invitations as any}
            currentUserId={user.id}
        />
    );
}
