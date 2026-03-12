import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getProfileById } from "@/lib/dal/profile";
import { getPendingInvitationsForEmail, getUserOrganizations, getOrganizationById } from "@/lib/dal/organization";
import { getActiveOrganizationId } from "@/lib/organization-context";
import { DashboardContent } from "./DashboardContent";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [profile, organizations, activeOrgId, pendingInvitations] = await Promise.all([
    getProfileById(user.id),
    getUserOrganizations(user.id),
    getActiveOrganizationId(),
    getPendingInvitationsForEmail(user.email ?? ""),
  ]);

  // Redirect to onboarding if not complete
  if (!profile?.onboardingCompleted) {
    redirect("/onboarding");
  }

  if (organizations.length === 0) {
    if (pendingInvitations.length > 0) {
      redirect("/organization/invitations");
    }

    redirect("/organization/new?setup=true");
  }

  let activeOrganization = null;
  if (activeOrgId) {
    const isValidOrg = organizations.some((org) => org.id === activeOrgId);
    if (isValidOrg) {
      activeOrganization = await getOrganizationById(activeOrgId);
    }
  }
  if (!activeOrganization && organizations.length > 0) {
    activeOrganization = await getOrganizationById(organizations[0].id);
  }

  // Placeholder stats until event metrics are wired into the dashboard.
  const stats = {
    totalEvents: 0,
    ticketsSold: 0,
    revenue: 0,
    attendees: 0,
  };

  return (
    <DashboardContent
      user={{
        id: user.id,
        email: user.email ?? "",
        fullName: user.user_metadata?.full_name ?? profile?.fullName ?? "",
        avatarUrl: profile?.avatarUrl ?? "",
      }}
      activeOrganization={activeOrganization}
      stats={stats}
    />
  );
}