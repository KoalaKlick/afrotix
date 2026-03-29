import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/utils/supabase/server"
import { getEventBySlug, getOrganizationBySlug, getVotingCategoryById } from "@/lib/dal"
import { canUserAccessEvent } from "@/lib/event-status"
import { getEventImageUrl } from "@/lib/image-url-utils"
import { isUserMemberOf } from "@/lib/dal/organization"
import { Section } from "@/components/Landing/shared/Section"
import { PanAfricanDivider } from "@/components/shared/PanAficDivider"
import { ArrowLeft, ChevronRight, Trophy, Users, Calendar, MapPin, Tag, Clock, ImageIcon } from "lucide-react"
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

const BASE_URL = process.env.NEXT_PUBLIC_DOMAIN_URL || "https://sankofa-one.vercel.app"

export async function generateMetadata({ params }: CategoryDetailPageProps): Promise<Metadata> {
    const { slug: orgSlug, eventSlug, categoryId } = await params
    const organization = await getOrganizationBySlug(orgSlug)
    if (!organization) return {}

    const event = await getEventBySlug(organization.id, eventSlug)
    if (!event) return {}

    const category = await getVotingCategoryById(categoryId, false)
    if (!category || category.eventId !== event.id) return {}

    const coverImage = getEventImageUrl(category.templateImage || event.bannerImage || event.coverImage) ?? "/landing/a.webp"
    const absoluteImage = coverImage.startsWith("http") ? coverImage : `${BASE_URL}${coverImage}`
    const pageUrl = `${BASE_URL}/${orgSlug}/event/${eventSlug}/category/${categoryId}`

    const title = `${category.name} — ${event.title}`
    const description = category.description
        ? category.description.replace(/<[^>]*>/g, "").slice(0, 200)
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

export default async function CategoryDetailPage({ params }: Readonly<CategoryDetailPageProps>) {
    const { slug: orgSlug, eventSlug, categoryId } = await params
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

    // Only voting/hybrid events have categories
    if (event.type !== "voting" && event.type !== "hybrid") notFound()

    const category = await getVotingCategoryById(categoryId, true);
    if (!category || category.eventId !== event.id) notFound()
    const coverImageUrl = getEventImageUrl(event.coverImage) ?? "/landing/a.webp"

    // Check if nominations are currently open
    const isNominationOpen = category.allowPublicNomination &&
        (!category.nominationDeadline || category.nominationDeadline > new Date())

    const startDate = event.startDate ? new Date(event.startDate) : null
    const dateStr = startDate ? startDate.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    }) : "TBA"
    const timeStr = startDate ? startDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    }) : ""

    return (
        <main className="min-h-screen">
            {/* Hero Section */}
            <div className="relative mt-20 h-[40vh] w-full overflow-hidden">
                <Image
                    src={coverImageUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/60 to-black/30" />
                <div className="absolute inset-0 flex items-end pb-8">
                    <div className="max-w-6xl mx-auto px-4 w-full">
                        <Link
                            href={`/${orgSlug}/event/${eventSlug}`}
                            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to {event.title}
                        </Link>
                        <div className="flex items-center gap-3 mb-2">
                            <Trophy className="w-6 h-6 text-[#FFCD00]" />
                            <span className="text-[#FFCD00] text-sm font-bold uppercase tracking-widest">Category</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight mb-6">
                            {category.name}
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

                        {category.description && (
                            <p className="text-white/70 mt-6 max-w-2xl text-sm">{category.description}</p>
                        )}
                        {isNominationOpen && (
                            <div className="mt-6">
                                <PublicNominationModal eventId={event.id} category={category} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PanAfricanDivider />

            {/* Nominees Section */}
            <Section maxWidth="full" className="py-16 w-full bg-[#F8F7F1] ">
                <div className="max-w-360 mx-auto px-4 @container">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <Users className="w-6 h-6 text-[#009A44]" />
                            <h2 className="text-2xl font-bold uppercase tracking-tight">Nominees</h2>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {category.votingOptions.length} {category.votingOptions.length === 1 ? "nominee" : "nominees"}
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
                        />
                    ) : (
                        <div className="text-center py-16">
                            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg">No nominees have been added to this category yet.</p>
                        </div>
                    )}
                </div>
            </Section>

            {/* Category & Event Context Footer */}
            <Section className="py-12 bg-white border-t">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-12">
                        {/* Left: About Category */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                <Trophy className="w-5 h-5 text-[#009A44]" />
                                About Category.
                            </h3>
                            <div className="prose prose-p:text-muted-foreground max-w-none text-sm leading-relaxed">
                                {category.description ? (
                                    <p className="whitespace-pre-wrap">{category.description}</p>
                                ) : (
                                    <p className="italic text-muted-foreground/60">Help your favorite nominee win by casting your vote!</p>
                                )}
                            </div>
                            <div className="pt-4 border-t border-dashed">
                                <Link
                                    href={`/${orgSlug}/event/${eventSlug}`}
                                    className="inline-flex items-center text-xs font-bold text-[#009A44] hover:underline"
                                >
                                    View full event details <ChevronRight className="w-3 h-3 ml-1" />
                                </Link>
                            </div>
                        </div>

                        {/* Center: Partners / Sponsors */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                <Trophy className="w-5 h-5 text-[#009A44]" />
                                Sponsors.
                            </h3>
                            {((event as any).sponsors?.length > 0) ? (
                                <div className="flex flex-wrap gap-3">
                                    {(event as any).sponsors.map((sponsor: any, idx: number) => (
                                        <div
                                            key={idx}
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
                            {((event as any).galleryLinks?.length > 0) && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                        <ImageIcon className="w-5 h-5 text-[#009A44]" />
                                        Galleries.
                                    </h3>
                                    <div className="space-y-2">
                                        {(event as any).galleryLinks.map((link: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl border bg-[#F8F7F1]/50 hover:bg-white hover:border-[#009A44]/30 hover:shadow-sm transition-all group"
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
                            {((event as any).socialLinks?.length > 0) && (
                                <div className="space-y-4 pt-4 border-t border-dashed">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#009A44]">Connect with Event.</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(event as any).socialLinks.map((link: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-10 h-10 rounded-full border bg-white flex items-center justify-center hover:bg-[#009A44]/10 hover:border-[#009A44] hover:text-[#009A44] transition-all"
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

                    <div className="mt-12 pt-12 border-t border-dashed text-center space-y-4">
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
