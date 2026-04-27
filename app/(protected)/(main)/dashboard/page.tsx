import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getProfileStats } from "@/lib/dal/profile";
import { getUserOrganizations, getOrganizationById } from "@/lib/dal/organization";
import { getOrganizationEventStats, getOngoingEvents, getRecentOrders, getMonthlyRevenue } from "@/lib/dal/event";
import { getActiveOrganizationId } from "@/lib/organization-context";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import type { EventStatsData } from "@/components/event/EventStats";

export default async function DashboardPage() {
  // Parent layout guarantees: authenticated, onboarding done, has org
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [organizations, activeOrgId] = await Promise.all([
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

  const orgId = activeOrganization?.id;

  // Fetch all dashboard data in parallel
  const [eventStats, profileStats, ongoingEvents, recentOrders, revenueData] =
    await Promise.all([
      orgId ? getOrganizationEventStats(orgId) : null,
      getProfileStats(user.id),
      orgId ? getOngoingEvents(orgId) : [],
      orgId ? getRecentOrders(orgId, 8) : [],
      orgId ? getMonthlyRevenue(orgId, 6) : [],
    ]);

  const stats: EventStatsData = eventStats ?? {
    total: 0, published: 0, draft: 0, ongoing: 0, ended: 0, cancelled: 0, upcoming: 0,
    byType: { voting: 0, ticketed: 0, hybrid: 0, standard: 0 },
    totalTicketsSold: 0, totalRevenue: 0, totalAttendees: 0, totalVotes: 0,
  };

  const serializedOrders = recentOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    buyerName: o.buyerName,
    buyerEmail: (o as any).payment?.email || "",
    total: Number(o.subtotal || 0),
    currency: (o as any).payment?.currency || "GHS",
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    event: { title: o.event.title },
  }));

  const serializedOngoing = ongoingEvents.map((e) => ({
    id: e.id,
    title: e.title,
    type: e.type,
    flierImage: e.flierImage,
    venueName: e.venueName,
    startDate: e.startDate?.toISOString() ?? null,
  }));

  return (
    <DashboardContent
      stats={stats}
      profileStats={profileStats}
      ongoingEvents={serializedOngoing}
      recentOrders={serializedOrders}
      revenueData={revenueData}
    />
  );
}