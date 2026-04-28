import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrganizationId } from "@/lib/organization-utils";
import { getOrganizationById, getUserRoleInOrganization } from "@/lib/dal/organization";
import { EventCreationClient } from "@/components/event/EventCreationClient";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";

export default async function NewEventPage() {
    // Parent layout guarantees: authenticated, onboarding done, has org
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    const organizationId = await getEffectiveOrganizationId(user.id);
    if (!organizationId) {
        redirect("/dashboard");
    }

    // Parallelize permission check and organization fetch for slug
    const [role, organization] = await Promise.all([
        getUserRoleInOrganization(user.id, organizationId),
        getOrganizationById(organizationId),
    ]);

    if (!role) {
        redirect("/dashboard");
    }

    return (
        <>
            <PageHeader
                breadcrumbs={[
                    { label: "My Events", href: "/my-events" },
                    { label: "Create Event" },
                ]}
            />

            <div className="flex flex-1 flex-col p-4 pt-0">
                <div className="mx-auto w-full max-w-2xl">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold">Create New Event</h1>
                        <p className="text-muted-foreground mt-1">
                            Set up your event details, dates, and settings.
                        </p>
                    </div>

                    <Card className="  p-6 ">
                        <EventCreationClient organizationSlug={organization?.slug} />
                    </Card>
                </div>
            </div>
        </>
    );
}
