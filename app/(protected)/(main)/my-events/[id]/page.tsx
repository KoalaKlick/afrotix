import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getUserRoleInOrganization, getOrganizationById } from "@/lib/dal/organization";
import { getEventById, getEventDetailStats, getVoteTrend } from "@/lib/dal/event";
import { getVotingCategories } from "@/lib/dal/voting";
import { normalizeFieldType } from "@/lib/types/voting";
import { EventDetailClient } from "@/components/event/EventDetailClient";
import { PageHeader } from "@/components/shared/page-header";

interface EventDetailPageProps {
    readonly params: Promise<{ id: string }>;
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

    // Get voting categories and event stats in parallel
    const [votingCategories, eventStats, voteTrend] = await Promise.all([
        (event.type === "voting" || event.type === "hybrid")
            ? getVotingCategories(event.id, true, true)
            : Promise.resolve([]),
        getEventDetailStats(event.id),
        (event.type === "voting" || event.type === "hybrid")
            ? getVoteTrend(event.id)
            : Promise.resolve([]),
    ]);

    return (
        <>
            <PageHeader
                breadcrumbs={[
                    { label: "My Events", href: "/my-events" },
                    { label: event.title, className: "max-w-[200px] truncate" },
                ]}
            />

            <div className="flex flex-1 flex-col p-4 pt-0">
                <EventDetailClient
                    event={{
                        id: event.id,
                        title: event.title,
                        slug: event.slug,
                        type: event.type,
                        status: event.status,
                        description: event.description,
                        startDate: event.startDate?.toISOString() ?? null,
                        endDate: event.endDate?.toISOString() ?? null,
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
                        votingMode: (event as any).votingMode,
                        createdAt: event.createdAt.toISOString(),
                        updatedAt: event.updatedAt.toISOString(),
                        publishedAt: event.publishedAt?.toISOString() ?? null,
                        sponsors: (event as any).sponsors?.map((s: any) => ({
                            id: s.id,
                            name: s.name,
                            logo: s.logo,
                        })),
                        socialLinks: (event as any).socialLinks?.map((s: any) => ({
                            id: s.id,
                            url: s.url,
                        })),
                        galleryLinks: (event as any).galleryLinks?.map((g: any) => ({
                            id: g.id,
                            name: g.name,
                            url: g.url,
                        })),
                    }}
                    organizationSlug={organization?.slug}
                    hasPaymentAccount={!!organization?.paystackAccountNumber}
                    userRole={role}
                    eventStats={eventStats}
                    voteTrend={voteTrend}
                    votingCategories={votingCategories.map(cat => ({
                        ...cat,
                        nominationPrice: Number(cat.nominationPrice) || 0,
                        votePrice: Number(cat.votePrice) || 0,
                        customFields: cat.customFields?.map(field => ({
                            ...field,
                            fieldType: normalizeFieldType(field.fieldType),
                        })),
                        votingOptions: cat.votingOptions.map(opt => ({
                            ...opt,
                            votesCount: BigInt(opt.votesCount),
                        })),
                    }))}
                />
            </div>
        </>
    );
}
