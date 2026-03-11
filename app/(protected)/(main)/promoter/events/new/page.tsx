import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrganizationId } from "@/lib/organization-utils";
import { getOrganizationById, getUserRoleInOrganization } from "@/lib/dal/organization";
import { EventCreationClient } from "./EventCreationClient";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default async function NewEventPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Get active organization
    const organizationId = await getEffectiveOrganizationId(user.id);
    if (!organizationId) {
        redirect("/organization/new?setup=true");
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
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/promoter/events">Events</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Create Event</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 pt-0">
                <div className="mx-auto w-full max-w-2xl">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold">Create New Event</h1>
                        <p className="text-muted-foreground mt-1">
                            Set up your event details, dates, and settings.
                        </p>
                    </div>

                    <div className="bg-card border rounded-xl p-6 shadow-sm">
                        <EventCreationClient organizationSlug={organization?.slug} />
                    </div>
                </div>
            </div>
        </>
    );
}
