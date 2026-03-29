import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getOrganizationProfile, getMembershipRequest, getOrganizationBySlug } from "@/lib/dal/organization";
import { OrgProfileHero } from "@/components/organization/OrgProfileHero";
import { OrgEventList } from "@/components/organization/OrgEventList";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { Globe, Mail, ImageIcon, Trophy, ChevronRight } from "lucide-react";
import { getEventImageUrl, getOrgImageUrl } from "@/lib/image-url-utils";
import { getSocialPlatform, getGalleryProvider } from "@/lib/utils/event-icons";
import type { Metadata } from "next";

interface OrgProfilePageProps {
    readonly params: Promise<{ slug: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_DOMAIN_URL;
const PROJ_NAME = process.env.PROJECT_NAME;

export async function generateMetadata({ params }: OrgProfilePageProps): Promise<Metadata> {
    const { slug } = await params;
    const organization = await getOrganizationBySlug(slug);
    if (!organization) return {};

    const bannerImage = getEventImageUrl(organization.bannerUrl || organization.logoUrl) ?? "/landing/a.webp";
    const absoluteImage = bannerImage.startsWith("http") ? bannerImage : `${BASE_URL}${bannerImage}`;
    const pageUrl = `${BASE_URL}/${slug}`;
    const description = organization.description || `Member profile of ${organization.name} on ${PROJ_NAME}`;

    return {
        title: organization.name,
        description,
        openGraph: {
            title: organization.name,
            description,
            url: pageUrl,
            type: "website",
            images: [{ url: absoluteImage, width: 1200, height: 630, alt: organization.name }],
        },
        twitter: {
            card: "summary_large_image",
            title: organization.name,
            description,
            images: [absoluteImage],
        },
    };
}

export default async function OrgProfilePage({ params }: OrgProfilePageProps) {
    const { slug } = await params;

    // Parallelize organization profile and user auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const organization = await getOrganizationProfile(slug, user?.id);

    if (!organization) {
        notFound();
    }

    // Check for pending join request if logged in
    let hasPendingRequest = false;
    if (user) {
        const request = await getMembershipRequest(organization.id, user.id);
        hasPendingRequest = !!request;
    }

    return (
        <main className="min-h-screen pt-16 bg-[#F8F7F1]">
            <OrgProfileHero
                organization={organization}
                isUserAuthenticated={!!user}
                hasPendingRequest={hasPendingRequest}
            />

            <div className="max-w-6xl mx-auto px-4 pb-20 space-y-16">
                <section className="space-y-8">
                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-center">
                        Our Events.
                    </h2>
                    <PanAfricanDivider />
                    <OrgEventList events={organization.events} organizationSlug={slug} />
                </section>

                {/* Aggregated Organization Assets (Sponsors, Socials, Galleries) */}
                {(() => {
                    const allSponsors = organization.events.flatMap((e: any) => e.sponsors || []);
                    const uniqueSponsors = Array.from(new Map(allSponsors.map((s: any) => [s.name, s])).values());
                    
                    const allSocials = organization.events.flatMap((e: any) => e.socialLinks || []);
                    const uniqueSocials = Array.from(new Map(allSocials.map((s: any) => [s.url, s])).values());
                    
                    const allGalleries = organization.events.flatMap((e: any) => e.galleryLinks || []);
                    const uniqueGalleries = Array.from(new Map(allGalleries.map((g: any) => [g.url, g])).values());

                    return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-16 border-t border-dashed">
                            {/* Partners / Sponsors */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                    <Trophy className="w-5 h-5 text-[#009A44]" />
                                    Our Partners.
                                </h3>
                                {uniqueSponsors.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {uniqueSponsors.slice(0, 12).map((sponsor: any, idx: number) => (
                                            <div key={idx} className="size-12 p-1.5 border rounded-lg bg-white flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-help" title={sponsor.name}>
                                                {sponsor.logo ? (
                                                    <Image
                                                        src={getEventImageUrl(sponsor.logo) || ""}
                                                        alt={sponsor.name}
                                                        width={32}
                                                        height={32}
                                                        className="object-contain max-h-full"
                                                    />
                                                ) : (
                                                    <span className="text-[7px] font-bold text-center leading-none truncate">{sponsor.name}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">Partnering with leading brands for all our events.</p>
                                )}
                            </div>

                            {/* Aggregated Socials */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                    <Globe className="w-5 h-5 text-[#009A44]" />
                                    Global Feeds.
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {uniqueSocials.length > 0 ? (
                                        uniqueSocials.map((link: any, idx: number) => (
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
                                        ))
                                    ) : (
                                        <div className="flex items-center gap-3 text-muted-foreground opacity-50">
                                            <div className="size-10 rounded-full border border-dashed flex items-center justify-center">
                                                <ImageIcon className="size-4" />
                                            </div>
                                            <p className="text-xs italic">Stay connected for updates.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Featured Galleries */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                                    <ImageIcon className="w-5 h-5 text-[#009A44]" />
                                    Galleries.
                                </h3>
                                <div className="space-y-2">
                                    {uniqueGalleries.length > 0 ? (
                                        uniqueGalleries.slice(0, 3).map((link: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl border bg-[#F8F7F1]/50 hover:bg-white hover:shadow-md transition-all group"
                                            >
                                                <div className="size-8 rounded-lg bg-white border flex items-center justify-center shrink-0">
                                                    <div className="size-4 flex items-center justify-center">
                                                        {getGalleryProvider(link.url, "size-full").icon}
                                                    </div>
                                                </div>
                                                <p className="font-bold text-[10px] uppercase truncate">{link.name}</p>
                                                <ChevronRight className="w-3 h-3 ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                            </a>
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">Relive our event moments soon.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Organization Details Footer */}
                <section className="pt-20 border-t border-dashed space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-black uppercase tracking-tight">
                                About {organization.name}.
                            </h2>
                            <div className="prose prose-p:text-muted-foreground max-w-none text-sm leading-relaxed">
                                {organization.description ? (
                                    <div className="whitespace-pre-wrap">{organization.description}</div>
                                ) : (
                                    <p className="italic text-muted-foreground/60 leading-relaxed">
                                        Empowering the community through excellence and dedication. 
                                        Join us in our journey to create impactful events and lasting memories.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="p-6 rounded-2xl bg-white border border-dashed border-[#009A44]/20 space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[#009A44]">Organization Contacts.</h3>
                                <div className="space-y-4">
                                    {organization.websiteUrl && (
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-[#F8F7F1] flex items-center justify-center shrink-0">
                                                <Globe className="size-4 text-[#009A44]" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Official Website</p>
                                                <a href={organization.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold hover:underline truncate block">
                                                    {organization.websiteUrl}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {organization.contactEmail && (
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-[#F8F7F1] flex items-center justify-center shrink-0">
                                                <Mail className="size-4 text-[#009A44]" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Email Support</p>
                                                <a href={`mailto:${organization.contactEmail}`} className="text-xs font-semibold hover:underline truncate block">
                                                    {organization.contactEmail}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-dashed text-center space-y-4">
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-1 w-8 bg-black" />
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
                </section>
            </div>
        </main>
    );
}
