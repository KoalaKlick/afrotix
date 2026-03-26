import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { getEventBySlug, getOrganizationBySlug, getVotingCategories } from "@/lib/dal"
import { canUserAccessEvent } from "@/lib/event-status"
import { getEventImageUrl } from "@/lib/image-url-utils"
import { isUserMemberOf } from "@/lib/dal/organization"
import { Section } from "@/components/Landing/shared/Section"
import { PanAfricanDivider } from "@/components/shared/PanAficDivider"
import Image from "next/image"
import { Calendar, MapPin, Clock, Vote, Trophy, Users, ChevronRight } from "lucide-react"

interface EventDetailsPageProps {
    params: Promise<{
        slug: string
        eventSlug: string
    }>
}

export default async function EventDetailsPage({ params }: Readonly<EventDetailsPageProps>) {
    const { slug: orgSlug, eventSlug } = await params
    const supabase = await createClient()

    const [{ data: { user } }, organization] = await Promise.all([
        supabase.auth.getUser(),
        getOrganizationBySlug(orgSlug),
    ])
    if (!organization) notFound()

    const event = await getEventBySlug(organization.id, eventSlug)
    if (!event) notFound()

    const isOrganizationMember = user ? await isUserMemberOf(user.id, organization.id) : false
    if (!canUserAccessEvent(event, isOrganizationMember)) notFound()

    // Fetch voting categories for voting/hybrid events
    const votingCategories = (event.type === "voting" || event.type === "hybrid")
        ? await getVotingCategories(event.id)
        : []

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
    const coverImageUrl = getEventImageUrl(event.coverImage) ?? "/landing/a.webp"

    return (
        <main className="min-h-screen">
            {/* Hero Section */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                <Image
                    src={coverImageUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />
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
            <pre>{JSON.stringify(votingCategories, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)}</pre>

            {/* Voting Categories Section - Only for voting/hybrid events */}
            {votingCategories.length > 0 && (
                <>
                    <PanAfricanDivider />
                    <Section className="py-20 bg-[#F8F7F1]">
                        <div className="max-w-6xl mx-auto px-4">
                            <div className="flex items-center gap-3 mb-12">
                                <Vote className="w-8 h-8 text-[#009A44]" />
                                <h2 className="text-3xl font-bold uppercase tracking-tight">Vote Categories.</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {votingCategories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/${orgSlug}/event/${eventSlug}/category/${category.id}`}
                                        className="group rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300"
                                        style={category.templateImage ? {
                                            background: `url(${category.templateImage}) center/cover no-repeat`,
                                            position: 'relative',
                                        } : { backgroundColor: '#fff' }}
                                    >

                                        <div className={category.templateImage ? "p-6 bg-black/40" : "p-6"}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-[#FFCD00]/20 flex items-center justify-center">
                                                        <Trophy className="w-5 h-5 text-[#FFCD00]" />
                                                    </div>
                                                    <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-[#009A44] transition-colors">
                                                        {category.name}
                                                    </h3>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-[#009A44] group-hover:translate-x-1 transition-all" />
                                            </div>
                                            {category.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                    {category.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Users className="w-4 h-4" />
                                                <span>{category.votingOptions.length} {category.votingOptions.length === 1 ? "nominee" : "nominees"}</span>
                                            </div>
                                        </div>
                                        {/* Preview of nominees */}
                                        {category.votingOptions.length > 0 && (
                                            <div className="px-6 pb-6">
                                                <div className="flex -space-x-3">
                                                    {category.votingOptions.slice(0, 5).map((nominee, idx) => {
                                                        const displayImage = nominee.imageUrl;
                                                        const displayImageUrl = getEventImageUrl(displayImage);
                                                        return (
                                                            <div
                                                                key={nominee.id}
                                                                className="relative w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-linear-to-br from-[#009A44]/20 to-[#FFCD00]/20"
                                                                style={{ zIndex: 5 - idx }}
                                                            >
                                                                {displayImageUrl ? (
                                                                    <Image
                                                                        src={displayImageUrl}
                                                                        alt={nominee.optionText}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                                        <Users className="w-4 h-4 text-muted-foreground/50" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    {category.votingOptions.length > 5 && (
                                                        <div className="relative w-10 h-10 rounded-full border-2 border-white bg-[#009A44] flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">+{category.votingOptions.length - 5}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </Section>
                </>
            )}
        </main>
    )
}
