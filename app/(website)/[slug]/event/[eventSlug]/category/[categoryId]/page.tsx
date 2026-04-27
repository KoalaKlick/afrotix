import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/utils/supabase/server"
import { getEventBySlug, getOrganizationBySlug, getVotingCategoryById } from "@/lib/dal"
import type { EventSponsor, EventGalleryLink, EventSocialLink } from "@/lib/types/event"
import type { Event } from "@/lib/generated/prisma"
import { canUserAccessEvent } from "@/lib/event-status"
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils"
import { isUserMemberOf } from "@/lib/dal/organization"
import { Section } from "@/components/Landing/shared/Section"
import { PanAfricanDivider } from "@/components/shared/PanAficDivider"
import { PoweredByFooter } from "@/components/shared/PoweredByFooter"
import { ArrowLeft, ChevronRight, Trophy, Users, Calendar, MapPin, Clock, ImageIcon, Info } from "lucide-react"
import { PublicNominationModal } from "@/components/event/PublicNominationModal"
import { NomineeGrid } from "@/components/event/PublicNomineeSheet"
import type { Metadata } from "next"
import { PROJ_NAME } from "@/lib/const/branding"
import { format } from "date-fns"
import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons"

interface CategoryDetailPageProps {
    params: Promise<{
        slug: string
        eventSlug: string
        categoryId: string
    }>
}

const BASE_URL = process.env.NEXT_PUBLIC_DOMAIN_URL || "https://afrotix-one.vercel.app"

export async function generateMetadata({ params }: CategoryDetailPageProps): Promise<Metadata> {
    const { slug: orgSlug, eventSlug, categoryId } = await params
    const organization = await getOrganizationBySlug(orgSlug)
    if (!organization) return {}

    const event = await getEventBySlug(organization.id, eventSlug)
    if (!event) return {}

    const category = await getVotingCategoryById(categoryId, false)
    if (!category || category.eventId !== event.id) return {}

    const coverImage = getEventImageUrl(category.templateImage || event.bannerImage || event.flierImage) ?? "/landing/a.webp"
    const absoluteImage = coverImage.startsWith("http") ? coverImage : `${BASE_URL}${coverImage}`
    const pageUrl = `${BASE_URL}/${orgSlug}/event/${eventSlug}/category/${categoryId}`

    const title = `${category.name} — ${event.title}`
    const description = category.description
        ? category.description.replaceAll(/<[^>]*>/g, "").slice(0, 200)
        : `Vote for your favorite nominee in ${category.name} at ${event.title}`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: pageUrl,
            type: "website",
            images: [{ url: absoluteImage, width: 1200, height: 630, alt: category.name }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [absoluteImage],
        },
    }
}

type EventWithExtras = Event & {
    sponsors?: EventSponsor[];
    galleryLinks?: EventGalleryLink[];
    socialLinks?: EventSocialLink[];
};

export default async function CategoryDetailPage({ params }: Readonly<CategoryDetailPageProps>) {
    const { slug: orgSlug, eventSlug, categoryId } = await params
    const supabase = await createClient()

    const [{ data: { user } }, organization] = await Promise.all([
        supabase.auth.getUser(),
        getOrganizationBySlug(orgSlug),
    ])
    if (!organization) notFound()

    const event = await getEventBySlug(organization.id, eventSlug) as EventWithExtras
    if (!event) notFound()

    const isOrganizationMember = user ? await isUserMemberOf(user.id, organization.id) : false
    if (!canUserAccessEvent(event, isOrganizationMember)) notFound()

    // Only voting/hybrid events have categories
    if (event.type !== "voting" && event.type !== "hybrid") notFound()

    const category = await getVotingCategoryById(categoryId, true)
    if (!category || category.eventId !== event.id) notFound()

    const heroImageUrl = getEventImageUrl(event.bannerImage) || getEventImageUrl(event.flierImage) || "/landing/a.webp"
    const orgLogoUrl = getOrgImageUrl(organization.logoUrl)

    // Check if nominations are currently open
    const isNominationOpen =
        category.allowPublicNomination &&
        (!category.nominationDeadline || category.nominationDeadline > new Date())

    const startDate = event.startDate ? new Date(event.startDate) : null
    const dateStr = startDate
        ? startDate.toLocaleDateString("en-US", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
        })
        : "TBA"
    const timeStr = startDate
        ? startDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        })
        : ""

    return (
        <main className="min-h-screen">
            {/* Hero Section — image fills the container, content overlays at the bottom */}
            <div className="relative h-[52vh] min-h-[380px] w-full overflow-hidden">
                <Image
                    src={heroImageUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                />
                {/* Gradient: strong at bottom so all text is readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />

                {/* Overlay content */}
                <div className="absolute inset-0 flex flex-col justify-end pb-8">
                    <div className="max-w-7xl mx-auto px-4 w-full">
                        {/* Back link with org logo */}
                        <div className="flex items-center gap-4 mb-5">
                            {orgLogoUrl && (
                                <Link href={`/${orgSlug}`}>
                                    <Image
                                        src={orgLogoUrl}
                                        alt={organization.name}
                                       width={40}
                                    height={40}
                                    className="rounded-md border bg-primary-50/20  border-white/20 object-cover"
                                    unoptimized
                                    />
                                </Link>
                            )}
                            <Link
                                href={`/${orgSlug}/event/${eventSlug}`}
                                className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to {event.title}
                            </Link>
                        </div>

                        {/* Category label */}
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-5 h-5 text-brand-secondary" />
                            <span className="text-brand-secondary text-xs font-bold uppercase tracking-widest">
                                Category
                            </span>
                        </div>

                        {/* Category name */}
                        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-5">
                            {category.name}
                        </h1>

                        {/* Event Schedule Pills */}
                        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                            <div className="flex flex-wrap gap-3 items-center ">
                                <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white">
                                    <Calendar className="w-3.5 h-3.5 text-brand-secondary" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-bold text-white/50 leading-none mb-0.5">
                                            Date
                                        </span>
                                        <span className="text-xs font-bold leading-none">{dateStr}</span>
                                    </div>
                                </div>

                                {timeStr && (
                                    <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white">
                                        <Clock className="w-3.5 h-3.5 text-brand-secondary" />
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase font-bold text-white/50 leading-none mb-0.5">
                                                Time
                                            </span>
                                            <span className="text-xs font-bold leading-none">{timeStr}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white">
                                    <MapPin className="w-3.5 h-3.5 text-brand-secondary" />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-bold text-white/50 leading-none mb-0.5">
                                            Venue
                                        </span>
                                        <span className="text-xs font-bold leading-none truncate max-w-[150px]">
                                            {event.venueName || "TBA"}
                                        </span>
                                    </div>
                                </div>

                                {event.endDate && (
                                    <div className="flex items-center gap-2.5 bg-brand-tertiary/20 backdrop-blur-md border border-brand-tertiary/40 rounded-full px-4 py-2 text-white">
                                        <Calendar className="w-3.5 h-3.5 text-brand-secondary" />
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase font-bold text-white/50 leading-none mb-0.5">
                                                Ends On
                                            </span>
                                            <span className="text-xs font-bold leading-none">
                                                {format(new Date(event.endDate), "MMM d, yyyy")}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action row: About Category anchor + Nomination button */}
                            <div className="flex flex-wrap items-center gap-3 justify-between ">
                                {/* About Category — smooth scroll anchor */}
                                <a
                                    href="#about-category"
                                    className="inline-flex items-center gap-2 border border-white/30 hover:border-white/60 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all duration-200"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                    About Category
                                </a>

                                {isNominationOpen && (
                                    <PublicNominationModal eventId={event.id} category={category} />
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <PanAfricanDivider />

            {/* Nominees Section */}
            <Section maxWidth="7xl" className="py-16 w-full bg-sepia-50">
                <div className="max-w-360 mx-auto @container">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <Users className="w-6 h-6 text-brand-primary" />
                            <h2 className="text-2xl font-bold uppercase tracking-tight">Nominees</h2>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {category.votingOptions.length}{" "}
                            {category.votingOptions.length === 1 ? "nominee" : "nominees"}
                        </span>
                    </div>

                    {category.votingOptions.length > 0 ? (
                        <NomineeGrid
                            nominees={category.votingOptions}
                            votePrice={Number(category.votePrice)}
                            eventId={event.id}
                            categoryId={category.id}
                            isPublic={event.isPublic}
                            showTotalVotesPublicly={category.showTotalVotesPublicly}
                            orgSlug={orgSlug}
                            eventSlug={eventSlug}
                            votingMode={event.votingMode as "internal" | "general"}
                        />
                    ) : (
                        <div className="text-center py-16">
                            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg">
                                No nominees have been added to this category yet.
                            </p>
                        </div>
                    )}
                </div>
            </Section>

            {/* Category & Event Context Footer */}
                        <PanAfricanDivider />
            <Section maxWidth="7xl" className="py-12 bg-white border-t">
                <div className=" mx-auto ">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-12">
                        {/* Left: About Category — anchor target */}
                        <div id="about-category" className="space-y-6 scroll-mt-24">
                            <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                <Trophy className="w-5 h-5 text-brand-primary" />
                                About Category.
                            </h3>
                            <div className="prose prose-p:text-muted-foreground max-w-none text-sm leading-relaxed">
                                {category.description ? (
                                    <p className="whitespace-pre-wrap">{category.description}</p>
                                ) : (
                                    <p className="italic text-muted-foreground/60">
                                        Help your favorite nominee win by casting your vote!
                                    </p>
                                )}
                            </div>
                            <div className="pt-4 border-t border-dashed">
                                <Link
                                    href={`/${orgSlug}/event/${eventSlug}/#details`}
                                    className="inline-flex items-center text-xs font-bold text-brand-primary hover:underline"
                                >
                                    View full event details <ChevronRight className="w-3 h-3 ml-1" />
                                </Link>
                            </div>
                        </div>

                        {/* Center: Partners / Sponsors */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                <Trophy className="w-5 h-5 text-brand-primary" />
                                Sponsors.
                            </h3>
                            {Array.isArray(event.sponsors) && event.sponsors.length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                    {event.sponsors.map((sponsor) => (
                                        <div
                                            key={sponsor.id}
                                            className="relative h-12 w-20 border bg-white flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-help"
                                            title={sponsor.name}
                                        >
                                            {sponsor.logo ? (
                                                <Image
                                                    src={getEventImageUrl(sponsor.logo) || ""}
                                                    alt={sponsor.name}
                                                    fill
                                                    className="object-contain"
                                                />
                                            ) : (
                                                <span className="text-[7px] font-bold text-center leading-none truncate px-1">
                                                    {sponsor.name}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">Partnering for excellence.</p>
                            )}
                        </div>

                        {/* Right: Galleries & Socials */}
                        <div className="space-y-8">
                            {/* Galleries */}
                            {Array.isArray(event.galleryLinks) && event.galleryLinks.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                        <ImageIcon className="w-5 h-5 text-brand-primary" />
                                        Galleries.
                                    </h3>
                                    <div className="space-y-2">
                                        {event.galleryLinks.map((link) => (
                                            <a
                                                key={link.id}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl border bg-sepia-50/50 hover:bg-white hover:border-brand-primary/30 hover:shadow-sm transition-all group"
                                            >
                                                <div className="size-8 rounded-lg bg-white border flex items-center justify-center shrink-0">
                                                    <div className="size-4 flex items-center justify-center">
                                                        {getGalleryProvider(link.url, "size-full").icon}
                                                    </div>
                                                </div>
                                                <p className="font-bold text-[10px] uppercase truncate">{link.name}</p>
                                                <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Socials */}
                            {Array.isArray(event.socialLinks) && event.socialLinks.length > 0 && (
                                <div className="space-y-4 pt-4 border-t border-dashed">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary">
                                        Event Socials.
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {event.socialLinks.map((link) => (
                                            <a
                                                key={link.id}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-full border bg-white flex items-center justify-center hover:bg-brand-primary/10 hover:border-brand-primary hover:text-brand-primary transition-all"
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
                    </div>

               
                </div>
            </Section>     <PoweredByFooter />
        </main>
    )
}