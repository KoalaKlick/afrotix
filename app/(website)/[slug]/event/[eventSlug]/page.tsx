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
import { Calendar, MapPin, Clock, Vote, Trophy, Users, ChevronRight, Share2, ExternalLink, Instagram, Facebook, Twitter, MessageCircle, Send, ImageIcon } from "lucide-react"
import type { Metadata } from "next"
import { PROJ_NAME } from "@/lib/const/branding"

// Helper to get icon for social links
const getSocialIcon = (url: string) => {
    const lowercaseUrl = url.toLowerCase();
    if (lowercaseUrl.includes("instagram.com")) return <Instagram className="w-5 h-5" />;
    if (lowercaseUrl.includes("facebook.com")) return <Facebook className="w-5 h-5" />;
    if (lowercaseUrl.includes("twitter.com") || lowercaseUrl.includes("x.com")) return <Twitter className="w-5 h-5" />;
    if (lowercaseUrl.includes("wa.me") || lowercaseUrl.includes("whatsapp.com")) return <MessageCircle className="w-5 h-5" />;
    if (lowercaseUrl.includes("t.me") || lowercaseUrl.includes("telegram.org")) return <Send className="w-5 h-5" />;
    return <Share2 className="w-5 h-5" />;
};

// Helper to get icon for gallery links
const getGalleryIcon = (url: string) => {
    const lowercaseUrl = url.toLowerCase();
    if (lowercaseUrl.includes("drive.google.com")) return <div className="w-6 h-6 flex items-center justify-center font-bold text-lg text-blue-500">Δ</div>; // Simple representation
    if (lowercaseUrl.includes("pixieset.com")) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (lowercaseUrl.includes("dropbox.com")) return <div className="w-6 h-6 text-blue-600 font-bold">Db</div>;
    return <ExternalLink className="w-5 h-5 text-muted-foreground" />;
};

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
                                            <div className="relative w-full h-48 shrink-0 overflow-hidden bg-muted rounded-t-2xl">
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

            {/* Sponsors, Socials & Gallery Section */}
            <Section className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Left Column: Description & Socials */}
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-3">
                                    About the Event.
                                </h2>
                                <div className="prose prose-p:text-muted-foreground max-w-none">
                                    {event.description ? (
                                        <p className="whitespace-pre-wrap">{event.description}</p>
                                    ) : (
                                        <p className="italic">No description provided for this event.</p>
                                    )}
                                </div>
                            </div>

                            {/* Social Links */}
                            {((event as any).socialLinks?.length > 0) && (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#009A44]">Connect with us.</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {(event as any).socialLinks.map((link: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-12 h-12 rounded-full border bg-white flex items-center justify-center hover:bg-[#009A44]/10 hover:border-[#009A44] hover:text-[#009A44] transition-all"
                                                title={link.url}
                                            >
                                                {getSocialIcon(link.url)}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Gallery Links */}
                            {((event as any).galleryLinks?.length > 0) && (
                                <div className="space-y-6 pt-4">
                                    <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                        <ImageIcon className="w-6 h-6 text-[#009A44]" />
                                        Photo Gallery.
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {(event as any).galleryLinks.map((link: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-4 p-4 rounded-xl border bg-[#F8F7F1] hover:bg-white hover:shadow-lg transition-all group"
                                            >
                                                <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center shrink-0">
                                                    {getGalleryIcon(link.url)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm uppercase truncate">{link.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">View photos</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Sponsors */}
                        <div className="space-y-12">
                            {((event as any).sponsors?.length > 0) ? (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-center md:text-left bg-black text-white inline-block px-4 py-1">
                                        Our Sponsors.
                                    </h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 items-center">
                                        {(event as any).sponsors.map((sponsor: any, idx: number) => (
                                            <div key={idx} className="group relative aspect-square flex flex-col items-center justify-center p-4 grayscale hover:grayscale-0 transition-all duration-500 border border-transparent hover:border-muted-foreground/10 hover:bg-muted/5 rounded-2xl">
                                                {sponsor.logo ? (
                                                    <div className="relative w-full h-full">
                                                        <Image
                                                            src={getEventImageUrl(sponsor.logo) || ""}
                                                            alt={sponsor.name}
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-xl">
                                                        <span className="text-[10px] font-bold uppercase text-muted-foreground/60 text-center px-1">
                                                            {sponsor.name}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border px-3 py-1 rounded-full shadow-sm">
                                                    <p className="text-[10px] font-bold uppercase truncate whitespace-nowrap">
                                                        {sponsor.name}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center md:items-start text-center md:text-left text-muted-foreground p-12 bg-[#F8F7F1]/50 rounded-[40px] border border-dashed border-muted-foreground/20">
                                    <Trophy className="w-12 h-12 mb-4 opacity-10" />
                                    <h3 className="text-xl font-bold uppercase mb-2">Want to sponsor?</h3>
                                    <p className="text-sm">Reach out to the organization to support this event and get featured here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Section>
        </main>
    )
}
