import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getProfileById } from "@/lib/dal/profile";
import { getUserOrganizations, getOrganizationById } from "@/lib/dal/organization";
import { getOrganizationEventStats } from "@/lib/dal/event";
import { getActiveOrganizationId } from "@/lib/organization-context";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function DashboardPage() {
  // Parent layout guarantees: authenticated, onboarding done, has org
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [profile, organizations, activeOrgId] = await Promise.all([
    getProfileById(user.id),
    getUserOrganizations(user.id),
    getActiveOrganizationId(),
  ]);

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

  // Fetch real event stats for the active organization
  const eventStats = activeOrganization
    ? await getOrganizationEventStats(activeOrganization.id)
    : null;

  const stats = {
    totalEvents: eventStats?.total ?? 0,
    ticketsSold: eventStats?.totalTicketsSold ?? 0,
    revenue: eventStats?.totalRevenue ?? 0,
    attendees: eventStats?.totalAttendees ?? 0,
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