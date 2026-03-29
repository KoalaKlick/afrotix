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
import { AnimatedTooltip } from "@/components/ui/animated-tooltip"
import { format } from "date-fns"
import { Globe, Mail, ImageIcon, Trophy, ChevronRight, Calendar, MapPin, Clock, Vote, Users, Share2, ExternalLink, Instagram, Facebook, Twitter, MessageCircle, Send, Tag } from "lucide-react"
import type { Metadata } from "next"
import { PROJ_NAME } from "@/lib/const/branding"

import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";

interface EventDetailsPageProps {
    params: Promise<{
        slug: string
        eventSlug: string
    }>
}

const BASE_URL = process.env.NEXT_PUBLIC_DOMAIN_URL || "https://sankofa-one.vercel.app"

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
        ? event.description.replace(/<[^>]*>/g, "").slice(0, 200)
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
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-6">
                            {event.title}
                        </h1>
                        
                        {/* Event Schedule Bar */}
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white">
                                <Calendar className="w-4 h-4 text-[#FFCD00]" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-white/60 leading-none mb-1">Date</span>
                                    <span className="text-xs font-bold leading-none">{dateStr}</span>
                                </div>
                            </div>
                            
                            {timeStr && (
                                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white">
                                    <Clock className="w-4 h-4 text-[#FFCD00]" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold text-white/60 leading-none mb-1">Time</span>
                                        <span className="text-xs font-bold leading-none">{timeStr}</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white">
                                <MapPin className="w-4 h-4 text-[#FFCD00]" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-white/60 leading-none mb-1">Venue</span>
                                    <span className="text-xs font-bold leading-none truncate max-w-[150px]">{event.venueName || "TBA"}</span>
                                </div>
                            </div>

                            {event.endDate && (
                                <div className="flex items-center gap-3 bg-[#CE1126]/20 backdrop-blur-md border border-[#CE1126]/40 rounded-full px-4 py-2 text-white">
                                    <Calendar className="w-4 h-4 text-[#FFCD00]" />
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
                                                    <div className="w-10 h-10 rounded-xl bg-[#009A44]/10 flex items-center justify-center shrink-0">
                                                        <Trophy className="w-5 h-5 text-[#009A44]" />
                                                    </div>
                                                    <h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-[#009A44] transition-colors line-clamp-2 mt-1">
                                                        {category.name}
                                                    </h3>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-[#009A44]/10 transition-colors">
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#009A44] group-hover:translate-x-0.5 transition-all" />
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
                                                                id: nominee.id as string,
                                                                name: nominee.optionText,
                                                                designation: nominee.nomineeCode || "Nominee",
                                                                image: getEventImageUrl(nominee.imageUrl),
                                                            }))} 
                                                        />
                                                        {category.votingOptions.length > 5 && (
                                                            <div className="relative w-10 h-10 ml-2 rounded-full border-2 border-white bg-tertiary-600 flex items-center justify-center shrink-0 z-40">
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

            {/* Event Details & Footer Section */}
            <Section className="py-20 bg-white border-t">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                        {/* Left: About */}
                        <div className="md:col-span-2 space-y-8">
                            <div className="space-y-4">
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
                            {((event as any).socialLinks?.length > 0) && (
                                <div className="space-y-4 pt-4 border-t border-dashed">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#009A44]">Organization Contacts.</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {(event as any).socialLinks.map((link: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-full border bg-[#F8F7F1]/50 flex items-center justify-center hover:bg-[#009A44]/10 hover:border-[#009A44] hover:text-[#009A44] transition-all"
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
                            {((event as any).galleryLinks?.length > 0) && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                        <ImageIcon className="w-5 h-5 text-[#009A44]" />
                                        Galleries.
                                    </h3>
                                    <div className="space-y-3">
                                        {(event as any).galleryLinks.map((link: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl border bg-[#F8F7F1] hover:bg-white hover:shadow-lg transition-all group"
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
                            {((event as any).sponsors?.length > 0) && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                        <Trophy className="w-5 h-5 text-[#009A44]" />
                                        Sponsors.
                                    </h3>
                                    <div className="flex flex-wrap gap-4">
                                        {(event as any).sponsors.slice(0, 6).map((sponsor: any, idx: number) => (
                                            <div key={idx} className="size-12 p-2 border rounded-xl bg-white flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-help" title={sponsor.name}>
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

                    <div className="mt-20 pt-12 border-t border-dashed text-center space-y-4">
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-1 w-8 bg-red-600" />
                            <div className="h-1 w-8 bg-yellow-400" />
                            <div className="h-1 w-8 bg-green-600" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-1">
                                Powered by Afrotix Event Management System
                            </p>
                            <p className="text-[9px] text-muted-foreground/60 italic">
                                &copy; {new Date().getFullYear()} {PROJ_NAME}. All Rights Reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </Section>
        </main>
    )
}
