import { Section } from '@/components/Landing/shared/Section'
import { EventCard } from '@/components/Landing/sections/revamp-events'
import { getPublicEvents } from '@/lib/dal/event'
import { EventsFilter } from '@/components/event/EventsFilter'
import type { EventType } from '@/lib/generated/prisma'

export const metadata = {
    title: 'Events | Sankofa',
    description: 'Explore upcoming Pan-African events and cultural festivals.',
}

interface EventsPageProps {
    searchParams: Promise<{
        q?: string
        type?: string
    }>
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
    const { q, type } = await searchParams

    const events = await getPublicEvents({
        limit: 50,
        query: q,
        type: type as EventType
    })

    return (
        <Section className="py-20 min-h-screen">
            <div className="max-w-6xl mx-auto px-4">
                <header className="mb-12">
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight mb-4">
                        All Events.
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        Discover the best Pan-African events, festivals, and cultural gatherings across the globe.
                    </p>
                </header>

                <EventsFilter />

                {events.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <EventCard key={event.id} item={event} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-[#F8F7F1]/50 rounded-3xl border border-dashed border-[#E5E5E5]">
                        <p className="text-xl font-medium text-muted-foreground">
                            {q || type ? "No events match your filters." : "No public events found at the moment."}
                        </p>
                        <p className="text-sm mt-2">
                            {q || type ? "Try adjusting your search or filters." : "Check back later for exciting updates!"}
                        </p>
                    </div>
                )}
            </div>
        </Section>
    )
}
