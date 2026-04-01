import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getUserRoleInOrganization } from "@/lib/dal/organization";
import {
  getEventById,
  getEventDetailStats,
  getEventTicketTransactions,
  getEventVoteTransactions,
  getVoteTrend,
} from "@/lib/dal/event";
import { getVotingCategories } from "@/lib/dal/voting";
import { normalizeFieldType } from "@/lib/types/voting";
import { getTicketTypesByEventId } from "@/lib/dal/ticket";
import { EventDetailClient } from "@/components/event/EventDetailClient";
import { PageHeader } from "@/components/shared/page-header";
import type { EventDetailEvent } from "@/lib/types/event";

interface EventDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

function serializeEventForDetail(
  event: NonNullable<Awaited<ReturnType<typeof getEventById>>>,
): EventDetailEvent {
  return {
    ...event,
    startDate: event.startDate?.toISOString() ?? null,
    endDate: event.endDate?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    publishedAt: event.publishedAt?.toISOString() ?? null,
    organization: {
      ...event.organization,
      createdAt: event.organization.createdAt.toISOString(),
      updatedAt: event.organization.updatedAt.toISOString(),
    },
    sponsors: event.sponsors?.map((sponsor) => ({
      ...sponsor,
      createdAt: sponsor.createdAt.toISOString(),
      updatedAt: sponsor.updatedAt.toISOString(),
    })),
    socialLinks: event.socialLinks?.map((social) => ({
      ...social,
      createdAt: social.createdAt.toISOString(),
      updatedAt: social.updatedAt.toISOString(),
    })),
    galleryLinks: event.galleryLinks?.map((gallery) => ({
      ...gallery,
      createdAt: gallery.createdAt.toISOString(),
      updatedAt: gallery.updatedAt.toISOString(),
    })),
  };
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // Get voting categories, event stats, and tickets in parallel
  const [votingCategories, eventStats, voteTrend, ticketTypes, voteTransactions, ticketTransactions] =
    await Promise.all([
      event.type === "voting" || event.type === "hybrid"
        ? getVotingCategories(event.id, true, true)
        : Promise.resolve([]),
      getEventDetailStats(event.id),
      event.type === "voting" || event.type === "hybrid"
        ? getVoteTrend(event.id)
        : Promise.resolve([]),
      event.type === "ticketed" || event.type === "hybrid"
        ? getTicketTypesByEventId(event.id)
        : Promise.resolve([]),
      event.type === "voting" || event.type === "hybrid"
        ? getEventVoteTransactions(event.id, { limit: 10, offset: 0 })
        : Promise.resolve({ transactions: [], total: 0 }),
      event.type === "ticketed" || event.type === "hybrid"
        ? getEventTicketTransactions(event.id, 10)
        : Promise.resolve({ transactions: [] }),
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
          event={serializeEventForDetail(event)}
          userRole={role}
          eventStats={eventStats}
          voteTrend={voteTrend}
          votingCategories={votingCategories.map((cat) => ({
            ...cat,
            nominationPrice: Number(cat.nominationPrice) || 0,
            votePrice: Number(cat.votePrice) || 0,
            customFields: cat.customFields?.map((field) => ({
              ...field,
              fieldType: normalizeFieldType(field.fieldType),
            })),
            votingOptions: cat.votingOptions.map((opt) => ({
              ...opt,
              votesCount: opt.votesCount.toString(), // Convert BigInt to string
            })),
          }))}
          initialVoteTransactions={voteTransactions.transactions}
          initialTicketTransactions={ticketTransactions.transactions}
          ticketTypes={ticketTypes.map((t) => ({
            ...t,
            price: Number(t.price),
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
            salesStart: t.salesStart?.toISOString() ?? null,
            salesEnd: t.salesEnd?.toISOString() ?? null,
          }))}
        />
      </div>
    </>
  );
}
