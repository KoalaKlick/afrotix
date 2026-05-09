import { Section } from '@/components/Landing/shared/Section'
import { getPublicEvents } from '@/lib/dal/event'
import type { EventType } from '@/lib/generated/prisma'
import { PROJ_NAME } from '@/lib/const/branding'
import type { Metadata } from 'next'
import { EventsPageClient } from '@/components/event/core/EventsPageClient'
import type { DbEvent } from '@/components/Landing/sections/revamp-events'

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `Events | ${PROJ_NAME}`,
        description: 'Explore upcoming Pan-African events and cultural festivals.',
    }
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
        <Section className="py-20 min-h-screen bg-[#F8F7F1]">
            <div className="max-w-6xl mx-auto px-4">
                <EventsPageClient events={events as DbEvent[]} q={q} type={type} />
            </div>
        </Section>
    )
}
