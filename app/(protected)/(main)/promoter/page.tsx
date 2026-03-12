import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrganizationId } from "@/lib/organization-utils";
import { getUserRoleInOrganization, getOrganizationById } from "@/lib/dal/organization";
import { getOrganizationEventStats, getUpcomingEvents } from "@/lib/dal/event";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, TrendingUp, Ticket, Users, DollarSign, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/dashboard";

export default async function PromoterHubPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const organizationId = await getEffectiveOrganizationId(user.id);
    if (!organizationId) {
        redirect("/organization/new?setup=true");
    }

    const role = await getUserRoleInOrganization(user.id, organizationId);
    if (!role) {
        redirect("/dashboard");
    }

    const [eventStats, upcomingEvents, organization] = await Promise.all([
        getOrganizationEventStats(organizationId),
        getUpcomingEvents(organizationId, 3),
        getOrganizationById(organizationId),
    ]);

    return (
        <>
            <PageHeader breadcrumbs={[{ label: "Promoter Hub" }]} />

            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
                {/* Welcome Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Promoter Hub</h1>
                        <p className="text-muted-foreground">
                            Manage your events for {organization?.name ?? "your organization"}
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/my-events/new">
                            <Plus className="mr-2 size-4" />
                            Create Event
                        </Link>
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatsCard
                        title="Total Events"
                        value={eventStats.total.toString()}
                        description={`${eventStats.published} published`}
                        icon={Calendar}
                    />
                    <StatsCard
                        title="Tickets Sold"
                        value="0"
                        description="Across all events"
                        icon={Ticket}
                    />
                    <StatsCard
                        title="Revenue"
                        value="£0"
                        description="Total earnings"
                        icon={DollarSign}
                    />
                    <StatsCard
                        title="Attendees"
                        value="0"
                        description="Total check-ins"
                        icon={Users}
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Link
                        href="/my-events/new"
                        className="bg-primary text-primary-foreground rounded-xl p-6 hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="size-8 mb-3" />
                        <h3 className="font-semibold">Create Event</h3>
                        <p className="text-sm opacity-90">Set up a new event</p>
                    </Link>
                    <Link
                        href="/my-events"
                        className="bg-card border rounded-xl p-6 hover:bg-muted/50 transition-colors"
                    >
                        <Calendar className="size-8 mb-3 text-primary" />
                        <h3 className="font-semibold">Manage Events</h3>
                        <p className="text-sm text-muted-foreground">View all your events</p>
                    </Link>
                    <Link
                        href="/promoter/checkin"
                        className="bg-card border rounded-xl p-6 hover:bg-muted/50 transition-colors"
                    >
                        <Users className="size-8 mb-3 text-primary" />
                        <h3 className="font-semibold">Check-In</h3>
                        <p className="text-sm text-muted-foreground">Scan tickets at the door</p>
                    </Link>
                    <Link
                        href="/promoter/analytics"
                        className="bg-card border rounded-xl p-6 hover:bg-muted/50 transition-colors"
                    >
                        <TrendingUp className="size-8 mb-3 text-primary" />
                        <h3 className="font-semibold">Analytics</h3>
                        <p className="text-sm text-muted-foreground">View performance data</p>
                    </Link>
                </div>

                {/* Upcoming Events */}
                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold">Upcoming Events</h2>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/my-events">
                                View All
                                <ArrowRight className="ml-2 size-4" />
                            </Link>
                        </Button>
                    </div>

                    {upcomingEvents.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="size-10 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-muted-foreground">No upcoming events</p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                                Create an event to see it here
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingEvents.map((event) => (
                                <Link
                                    key={event.id}
                                    href={`/my-events/${event.id}`}
                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors -mx-3"
                                >
                                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Calendar className="size-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{event.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {event.startDate
                                                ? new Date(event.startDate).toLocaleDateString("en-US", {
                                                    weekday: "short",
                                                    month: "short",
                                                    day: "numeric",
                                                })
                                                : "Date TBD"}
                                        </p>
                                    </div>
                                    <ArrowRight className="size-4 text-muted-foreground" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
