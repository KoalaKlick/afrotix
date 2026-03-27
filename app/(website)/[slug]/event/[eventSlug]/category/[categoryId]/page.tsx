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
import { ArrowLeft, Trophy, Users, Vote } from "lucide-react"
import { PublicNominationModal } from "@/components/event/PublicNominationModal"

interface CategoryDetailPageProps {
    params: Promise<{
        slug: string
        eventSlug: string
        categoryId: string
    }>
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

    const category = await getVotingCategoryById(categoryId, true)
    if (!category || category.eventId !== event.id) notFound()
    const coverImageUrl = getEventImageUrl(event.coverImage) ?? "/landing/a.webp"

    // Check if nominations are currently open
    const isNominationOpen = category.allowPublicNomination && 
        (!category.nominationDeadline || category.nominationDeadline > new Date())

    return (
        <main className="min-h-screen">
            {/* Hero Section */}
            <div className="relative h-[40vh] w-full overflow-hidden">
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
                        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
                            {category.name}
                        </h1>
                        {category.description && (
                            <p className="text-white/70 mt-3 max-w-2xl">{category.description}</p>
                        )}
                        {isNominationOpen && (
                            <div className="mt-4">
                                <PublicNominationModal eventId={event.id} category={category} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PanAfricanDivider />

            {/* Nominees Section */}
            <Section className="py-16 bg-[#F8F7F1]">
                <div className="max-w-6xl mx-auto px-4">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {category.votingOptions.map((nominee) => {
                                const displayImage = nominee.imageUrl;
                                const displayImageUrl = getEventImageUrl(displayImage);
                                return (
                                    <div
                                        key={nominee.id}
                                        className="group bg-white rounded-3xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300"
                                    >
                                        <div className="relative aspect-4/5 bg-linear-to-br from-[#009A44]/10 to-[#FFCD00]/10">
                                            {displayImageUrl ? (
                                                <Image
                                                    src={displayImageUrl}
                                                    alt={nominee.optionText}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Users className="w-16 h-16 text-muted-foreground/20" />
                                                </div>
                                            )}
                                            {/* Vote overlay on hover */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    className="bg-[#009A44] text-white font-bold uppercase py-3 px-6 rounded-xl hover:bg-[#009A44]/90 transition-colors tracking-widest text-xs inline-flex items-center gap-2"
                                                >
                                                    <Vote className="w-4 h-4" />
                                                    Vote
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-bold text-lg">{nominee.optionText}</h3>
                                            {nominee.nomineeCode && (
                                                <p className="text-xs text-[#009A44] font-mono font-semibold mt-1">
                                                    {nominee.nomineeCode}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg">No nominees have been added to this category yet.</p>
                        </div>
                    )}
                </div>
            </Section>

            {/* Voting Info Footer */}
            {category.votingOptions.length > 0 && (
                <>
                    <PanAfricanDivider />
                    <Section className="py-12 bg-white">
                        <div className="max-w-6xl mx-auto px-4 text-center">
                            <p className="text-sm text-muted-foreground uppercase tracking-widest mb-2">
                                {category.allowMultiple
                                    ? `You can vote for up to ${category.maxVotesPerUser} nominees`
                                    : "Select your favorite nominee"
                                }
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Powered by Sankofa Event Management System
                            </p>
                        </div>
                    </Section>
                </>
            )}
        </main>
    )
}
