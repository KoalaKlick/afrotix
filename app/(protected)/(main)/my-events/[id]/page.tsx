import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getEffectiveOrganizationId } from "@/lib/organization-utils";
import { getUserRoleInOrganization, getOrganizationById } from "@/lib/dal/organization";
import { getEventById } from "@/lib/dal/event";
import { getVotingCategories } from "@/lib/dal/voting";
import { EventDetailClient } from "./EventDetailClient";
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

interface EventDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Get the event
    const event = await getEventById(id);
    if (!event) {
        notFound();
    }

    // Verify user has access to this event's organization
    const role = await getUserRoleInOrganization(user.id, event.organizationId);
    if (!role) {
        redirect("/my-events");
    }

    // Get organization for public link
    const organization = await getOrganizationById(event.organizationId);

    // Get voting categories for voting/hybrid events
    const votingCategories = (event.type === "voting" || event.type === "hybrid")
        ? await getVotingCategories(event.id)
        : [];

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
                                <BreadcrumbLink href="/my-events">My Events</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="max-w-[200px] truncate">
                                    {event.title}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <div className="flex flex-1 flex-col p-4 pt-0">
                <EventDetailClient
                    event={{
                        id: event.id,
                        title: event.title,
                        slug: event.slug,
                        type: event.type,
                        status: event.status,
                        description: event.description,
                        startDate: event.startDate?.toISOString(),
                        endDate: event.endDate?.toISOString(),
                        timezone: event.timezone,
                        isVirtual: event.isVirtual,
                        virtualLink: event.virtualLink,
                        venueName: event.venueName,
                        venueAddress: event.venueAddress,
                        venueCity: event.venueCity,
                        venueCountry: event.venueCountry,
                        coverImage: event.coverImage,
                        bannerImage: event.bannerImage,
                        maxAttendees: event.maxAttendees,
                        isPublic: event.isPublic,
                        createdAt: event.createdAt.toISOString(),
                        updatedAt: event.updatedAt.toISOString(),
                        publishedAt: event.publishedAt?.toISOString(),
                    }}
                    organizationSlug={organization?.slug}
                    userRole={role}
                    votingCategories={votingCategories.map(cat => ({
                        ...cat,
                        votingOptions: cat.votingOptions.map(opt => ({
                            ...opt,
                            votesCount: Number(opt.votesCount),
                        })),
                    }))}
                />
            </div>
        </>
    );
}
