import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrganizationId } from "@/lib/organization-utils";
import { getUserRoleInOrganization, getOrganizationById } from "@/lib/dal/organization";
import { getOrganizationEvents, getOrganizationEventStats } from "@/lib/dal/event";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EventsList } from "@/components/event/EventsList";
import { CustomizableEventStats } from "@/components/event";

export default async function MyEventsPage() {
    // Parent layout guarantees: authenticated, onboarding done, has org
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    const organizationId = await getEffectiveOrganizationId(user.id);
    if (!organizationId) {
        redirect("/dashboard");
    }

    const role = await getUserRoleInOrganization(user.id, organizationId);
    if (!role) {
        redirect("/dashboard");
    }

    const [events, stats, organization] = await Promise.all([
        getOrganizationEvents(organizationId),
        getOrganizationEventStats(organizationId),
        getOrganizationById(organizationId),
    ]);

    return (
        <>
            <PageHeader breadcrumbs={[{ label: "My Events" }]} />

            <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">My Events</h1>
                        <p className="text-muted-foreground">
                            Manage your events and track performance
                        </p>
                    </div>
                    <Button variant='tertiary' size='sm' asChild>
                        <Link href="/my-events/new">
                            <Plus className="mr-2 size-4" />
                            Create Event
                        </Link>
                    </Button>
                </div>

                {/* Stats Overview */}
                <CustomizableEventStats stats={stats} />

                {/* Events List */}
                {events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="flex size-16 items-center justify-center rounded-full bg-muted mb-4">
                            <Calendar className="size-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No events yet</h2>
                        <p className="text-muted-foreground mb-6 max-w-sm">
                            Create your first event to start selling tickets and engaging your audience.
                        </p>
                        <Button asChild size="lg">
                            <Link href="/my-events/new">
                                <Plus className="mr-2 size-4" />
                                Create Your First Event
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <EventsList events={events} organizationSlug={organization?.slug} />
                )}
            </div>
        </>
    );
}
