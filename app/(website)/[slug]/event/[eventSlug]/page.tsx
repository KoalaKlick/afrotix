import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { getEventBySlug, getOrganizationBySlug, getVotingCategories } from "@/lib/dal"
import { canUserAccessEvent } from "@/lib/event-status"
import { getEventImageUrl } from "@/lib/image-url-utils"
import { isUserMemberOf } from "@/lib/dal/organization"
import { getVisibleTicketTypesByEventId } from "@/lib/dal/ticket"
import { Section } from "@/components/Landing/shared/Section"
import { PanAfricanDivider } from "@/components/shared/PanAficDivider"
import { PoweredByFooter } from "@/components/shared/PoweredByFooter"
import { PublicTicketGrid } from "@/components/event/PublicTicketGrid"
import Image from "next/image"
import { AnimatedTooltip } from "@/components/ui/animated-tooltip"
import { format } from "date-fns"
import { ImageIcon, Trophy, ChevronRight, Calendar, MapPin, Clock, Vote, Users, ArrowLeft, Lock } from "lucide-react"
import type { Metadata } from "next"
import { PROJ_NAME } from "@/lib/const/branding"

import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";
// Types only used for type annotations

interface EventDetailsPageProps {
    params: Promise<{
        slug: string
        eventSlug: string
    }>
}

const BASE_URL = process.env.NEXT_PUBLIC_DOMAIN_URL || "https://afrotix-one.vercel.app"

export async function generateMetadata({ params }: EventDetailsPageProps): Promise<Metadata> {
    const { slug: orgSlug, eventSlug } = await params
    const organization = await getOrganizationBySlug(orgSlug)
    if (!organization) return {}

    const event = await getEventBySlug(organization.id, eventSlug)
    if (!event) return {}

    const coverImage = getEventImageUrl(event.bannerImage || event.coverImage) ?? "/landing/a.webp"
    const absoluteImage = coverImage.startsWith("http") ? coverImage : `${BASE_URL}${coverImage}`
    const pageUrl = `${BASE_URL}/${orgSlug}/event/${eventSlug}`
    const description = event.description
        ? event.description.replaceAll(/<[^>]*>/g, "").slice(0, 200)
        : `${event.title} — powered by ${PROJ_NAME}`

    return {
        title: event.title,
        description,
        openGraph: {
            title: event.title,
            description,
            url: pageUrl,
            type: "website",
            images: [{ url: absoluteImage, width: 1200, height: 630, alt: event.title }],
        },
        twitter: {
            card: "summary_large_image",
            title: event.title,
            description,
            images: [absoluteImage],
        },
    }
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

    const [votingCategories, ticketTypes] = await Promise.all([
        (event.type === "voting" || event.type === "hybrid")
            ? getVotingCategories(event.id)
            : Promise.resolve([]),
        (event.type === "ticketed" || event.type === "hybrid")
            ? getVisibleTicketTypesByEventId(event.id, isOrganizationMember)
            : Promise.resolve([]),
    ])

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
                    <div className="max-w-7xl mx-auto px-6 w-full">
                        <Link
                            href={`/${orgSlug}/`}
                            className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-5 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to {orgSlug}
                        </Link><br/>
                        <div className="inline-block items-center bg-brand-primary-600 text-white text-xs font-bold uppercase py-1 px-3 rounded-sm mb-4 tracking-widest">
                            {event.type.toUpperCase()}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-6">
                            {event.title}
                        </h1>

                        {/* Event Schedule Bar */}
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white">
                                <Calendar className="w-4 h-4 text-secondary" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-white/60 leading-none mb-1">Date</span>
                                    <span className="text-xs font-bold leading-none">{dateStr}</span>
                                </div>
                            </div>

                            {timeStr && (
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white">
                                    <Clock className="w-4 h-4 text-secondary" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-white/60 leading-none mb-1">Time</span>
                                        <span className="text-xs font-bold leading-none">{timeStr}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white">
                                <MapPin className="w-4 h-4 text-secondary" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-white/60 leading-none mb-1">Venue</span>
                                    <span className="text-xs font-bold leading-none truncate max-w-37.5">{event.venueName || "TBA"}</span>
                                </div>
                            </div>

                            {event.endDate && (
                                <div className="flex items-center gap-2.5 bg-brand-tertiary/20 backdrop-blur-md border border-brand-tertiary/40 rounded-full px-4 py-2 text-white">
                                    <Calendar className="w-4 h-4 text-brand-tertiary" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-white/60 leading-none mb-1">Ends On</span>
                                        <span className="text-xs font-bold leading-none">{format(new Date(event.endDate), "MMM d, yyyy")}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <PanAfricanDivider />

            {/* Voting Categories Section - Only for voting/hybrid events */}
            {votingCategories.length > 0 && (
                <>
                    <PanAfricanDivider />
                    <Section maxWidth="7xl" className="py-20 bg-[#F8F7F1  bg-secondary/5">
                        <div className=" ">
                            <div className="flex items-center gap-3 mb-12">
                                <Vote className="w-8 h-8 text-secondary" />
                                <h2 className="text-3xl font-bold uppercase tracking-tight">Vote Categories.</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {votingCategories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/${orgSlug}/event/${eventSlug}/category/${category.id}`}
                                        className="group flex flex-col rounded-md border bg-card shadow-sm hover:shadow-xl transition-all duration-300 relative"
                                    >
                                        {category.templateImage && (
                                            <div className="relative w-full h-48 shrink-0 overflow-hidden bg-muted rounded-t-md">
                                                <Image
                                                    src={getEventImageUrl(category.templateImage) || ''}
                                                    alt={category.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                    unoptimized
                                                />
                                            </div>
                                        )}
                                        <div className={`p-6 flex flex-col flex-1 bg-white ${category.templateImage ? 'rounded-b-2xl' : 'rounded-2xl'}`}>
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                        <Trophy className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-2 mt-1">
                                                        {category.name}
                                                    </h3>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                                </div>
                                            </div>

                                            {!category.templateImage && category.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                                                    {category.description}
                                                </p>
                                            )}

                                            <div className="mt-auto">
                                                {!category.templateImage && (
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                                        <Users className="w-4 h-4" />
                                                        <span>{category.votingOptions.length} {category.votingOptions.length === 1 ? "nominee" : "nominees"}</span>
                                                    </div>
                                                )}

                                                {/* Preview of nominees */}
                                                {category.votingOptions.length > 0 && (
                                                    <div className="flex flex-row items-center mt-1 pt-1 mb-1">
                                                        <AnimatedTooltip
                                                            items={category.votingOptions.slice(0, 5).map((nominee) => ({
                                                                id: nominee.id,
                                                                name: nominee.optionText,
                                                                designation: nominee.nomineeCode || "Nominee",
                                                                image: getEventImageUrl(nominee.imageUrl),
                                                            }))}
                                                        />
                                                        {category.votingOptions.length > 5 && (
                                                            <div className="relative w-10 h-10 ml-2 rounded-full border-2 border-white bg-brand-secondary-500 flex items-center justify-center shrink-0 z-40">
                                                                <span className="text-white text-xs font-bold">+{category.votingOptions.length - 5}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </Section>
                </>
            )}

            {ticketTypes.length > 0 && (
                <>
                    <PanAfricanDivider />
                    <Section maxWidth="7xl" className="py-20 bg-white">
                        <div className="space-y-10">
                            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-brand-primary">
                                        <span>Ticket Tiers</span>
                                        {!event.isPublic && (
                                            <>
                                                <span className="text-[#009A44]/40">•</span>
                                                <Lock className="size-3.5" />
                                                <span>Internal Event</span>
                                            </>
                                        )}
                                    </div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight">Choose Your Access.</h2>
                                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                        {isOrganizationMember
                                            ? "You can also see member-only hidden tiers for internal events and organizer access."
                                            : "Guests only see externally available ticket tiers here."}
                                    </p>
                                </div>
                            </div>

                            <PublicTicketGrid
                                tickets={ticketTypes.map((ticket) => ({
                                    ...ticket,
                                    price: Number(ticket.price),
                                    salesEnd:
                                        ticket.salesEnd instanceof Date
                                            ? ticket.salesEnd.toISOString()
                                            : ticket.salesEnd ?? null,
                                }))}
                                orgSlug={orgSlug}
                                eventSlug={eventSlug}
                                event={{
                                    id: event.id,
                                    organizationId: event.organizationId,
                                    title: event.title,
                                    coverImage: event.coverImage,
                                    bannerImage: event.bannerImage,
                                    isVirtual: event.isVirtual,
                                    virtualLink: event.virtualLink,
                                    venueName: event.venueName,
                                    venueCity: event.venueCity,
                                    venueCountry: event.venueCountry,
                                    startDate:
                                        event.startDate instanceof Date
                                            ? event.startDate.toISOString()
                                            : event.startDate ?? null,
                                }}
                                organization={{
                                    name: organization.name,
                                    logoUrl: organization.logoUrl,
                                    primaryColor: organization.primaryColor,
                                    secondaryColor: organization.secondaryColor,
                                }}
                            />
                        </div>
                    </Section>
                </>
            )}

            {/* Event Details & Footer Section */}
            <Section maxWidth="7xl" className="py-20 bg-white border-t">
                <div className=" mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                        {/* Left: About */}
                        <div className="md:col-span-2 space-y-8" id="details">
                            <div className="space-y-4" >
                                <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                    About the Event.
                                </h2>
                                <div className="prose prose-p:text-muted-foreground max-w-none text-sm leading-relaxed">
                                    {event.description ? (
                                        <p className="whitespace-pre-wrap">{event.description}</p>
                                    ) : (
                                        <p className="italic">No description provided for this event.</p>
                                    )}
                                </div>
                            </div>

                            {/* Social Links nested here for mobile, but visible on all */}
                            {(event.socialLinks?.length > 0) && (
                                <div className="space-y-4 pt-4 border-t border-dashed">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary">Event Socials.</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {event.socialLinks.map((link) => (
                                            <a
                                                key={link.id}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-full border bg-sepia-50/50 flex items-center justify-center hover:bg-brand-primary/10 hover:border-brand-primary hover:text-brand-primary transition-all"
                                                title={link.url}
                                            >
                                                <div className="size-5 flex items-center justify-center">
                                                    {getSocialPlatform(link.url, "size-full").icon}
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Gallery & Official links */}
                        <div className="space-y-12">
                            {/* Gallery Links */}
                            {(event.galleryLinks?.length > 0) && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                        <ImageIcon className="w-5 h-5 text-brand-primary" />
                                        Galleries.
                                    </h3>
                                    <div className="space-y-3">
                                        {event.galleryLinks.map((link) => (
                                            <a
                                                key={link.id}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl border bg-sepia-50 hover:bg-white hover:shadow-lg transition-all group"
                                            >
                                                <div className="size-8 rounded-lg bg-white border flex items-center justify-center shrink-0">
                                                    <div className="size-4 flex items-center justify-center">
                                                        {getGalleryProvider(link.url, "size-full").icon}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-[11px] uppercase truncate">{link.name}</p>
                                                </div>
                                                <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Official Sponsors area (if small) */}
                            {(event.sponsors?.length > 0) && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                        <Trophy className="w-5 h-5 text-brand-primary" />
                                        Sponsors.
                                    </h3>
                                    <div className="flex flex-wrap gap-4">
                                        {event.sponsors.map((sponsor) => (
                                            <div key={sponsor.id} className="size-12 p-2 border rounded-xl bg-white flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-help" title={sponsor.name}>
                                                {sponsor.logo ? (
                                                    <Image
                                                        src={getEventImageUrl(sponsor.logo) || ""}
                                                        alt={sponsor.name}
                                                        width={32}
                                                        height={32}
                                                        className="object-contain max-h-full"
                                                    />
                                                ) : (
                                                    <span className="text-[8px] font-bold text-center leading-tight truncate">{sponsor.name}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Section>                    <PoweredByFooter />

        </main>
    )
}
