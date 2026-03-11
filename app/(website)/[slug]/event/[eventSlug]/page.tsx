import { notFound } from "next/navigation"
import { getEventBySlug, getOrganizationBySlug } from "@/lib/dal"
import { Section } from "@/components/Landing/shared/Section"
import { PanAfricanDivider } from "@/components/shared/PanAficDivider"
import Image from "next/image"
import { Calendar, MapPin, Clock, Tag } from "lucide-react"

interface EventDetailsPageProps {
    params: Promise<{
        slug: string
        eventSlug: string
    }>
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
    const { slug: orgSlug, eventSlug } = await params

    const organization = await getOrganizationBySlug(orgSlug)
    if (!organization) notFound()

    const event = await getEventBySlug(organization.id, eventSlug)
    if (!event || !event.isPublic || event.status !== "published") notFound()

    const startDate = event.startDate ? new Date(event.startDate) : null
    const dateStr = startDate ? startDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    }) : "TBA"
    const timeStr = startDate ? startDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    }) : ""

    return (
        <main className="min-h-screen">
            {/* Hero Section */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                <Image
                    src={event.coverImage || "/landing/a.webp"}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex items-end pb-12">
                    <div className="max-w-6xl mx-auto px-4 w-full">
                        <div className="inline-flex items-center bg-[#009A44] text-white text-xs font-bold uppercase py-1 px-3 rounded-sm mb-4 tracking-widest">
                            {event.type.toUpperCase()}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-4">
                            {event.title}
                        </h1>
                        <div className="flex flex-wrap gap-6 text-white/80 text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#FFCD00]" />
                                {dateStr}
                            </div>
                            {timeStr && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-[#FFCD00]" />
                                    {timeStr}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#FFCD00]" />
                                {event.venueName || "TBA"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PanAfricanDivider />

            {/* Content Section */}
            <Section className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2">
                            <h2 className="text-2xl font-bold uppercase mb-6 tracking-tight">About this event.</h2>
                            <div className="prose prose-lg max-w-none text-muted-foreground whitespace-pre-wrap">
                                {event.description || "No description provided for this event."}
                            </div>
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-[#F8F7F1] p-8 rounded-3xl border sticky top-24">
                                <h3 className="text-xl font-bold uppercase mb-6 tracking-tight">Organizer.</h3>
                                <div className="flex items-center gap-4 mb-8">
                                    {organization.logoUrl && (
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden border">
                                            <Image
                                                src={organization.logoUrl}
                                                alt={organization.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold text-lg leading-tight">{organization.name}</p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Sankofa Verified</p>
                                    </div>
                                </div>
                                <button className="w-full bg-black text-white font-bold uppercase py-4 rounded-xl hover:bg-black/90 transition-colors tracking-widest text-xs">
                                    Book Tickets
                                </button>
                                <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-tighter">
                                    Powered by Sankofa Event Management System
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>
        </main>
    )
}
