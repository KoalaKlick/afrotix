import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getOrganizationProfile, getMembershipRequest, getOrganizationBySlug } from "@/lib/dal/organization";
import { OrgProfileHero } from "@/components/organization/OrgProfileHero";
import { EventsSection } from "@/components/Landing/sections/revamp-events";
import { Section } from "@/components/Landing/shared/Section";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";
import { PoweredByFooter } from "@/components/shared/PoweredByFooter";
import { Globe, Mail, Trophy, Phone } from "lucide-react";
import { getEventImageUrl } from "@/lib/image-url-utils";
import { getSocialPlatform } from "@/lib/utils/event-icons";
import type { Metadata } from "next";
import Image from "next/image";
import parse from 'html-react-parser';
import { EventSocialLink, EventSponsor } from "@/lib/generated/prisma";

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
        <main className="min-h-screen">
            <OrgProfileHero
                organization={organization}
                isUserAuthenticated={!!user}
                hasPendingRequest={hasPendingRequest}
            />

            <PanAfricanDivider />

            <EventsSection
                title="Our Events."
                useBrand
                items={organization.events.map((e) => ({
                    ...e,
                    organization: { slug, name: organization.name },
                }))}
            />

                {/* Organization Details Footer */}
                
            <PanAfricanDivider />

            <Section maxWidth="7xl" className="py-12 bg-white border-t">
                    {(() => {
                        const allSponsors = organization.events.flatMap((e: any) => e.sponsors || []);
                        const uniqueSponsors = Array.from(new Map(allSponsors.map((s: any) => [s.name, s])).values());

                        return (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                                {/* Column 1: Our Partners (Aggregated from events) */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                        <Trophy className="w-5 h-5 text-brand-primary" />
                                        Our Partners.
                                    </h3>
                                    {uniqueSponsors.length > 0 ? (
                                        <div className="flex flex-wrap gap-2.5">
                                            {uniqueSponsors.slice(0, 15).map((sponsor: EventSponsor, idx: number) => (
                                                <div key={sponsor.id} className="size-10 p-1.5 border rounded-lg bg-white flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-help" title={sponsor.name}>
                                                    {sponsor.logo ? (
                                                        <Image
                                                            src={getEventImageUrl(sponsor.logo) || ""}
                                                            alt={sponsor.name}
                                                            width={28}
                                                            height={28}
                                                            className="object-contain max-h-full"
                                                        />
                                                    ) : (
                                                        <span className="text-[6px] font-bold text-center leading-none truncate uppercase tracking-tighter">{sponsor.name}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic leading-relaxed">Partnering with leading brands for event excellence.</p>
                                    )}
                                </div>

                                {/* Column 2: About Organization */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-black uppercase tracking-tight">
                                        About {organization.name}.
                                    </h3>
                                    <div className="prose prose-sm prose-p:text-muted-foreground prose-headings:text-foreground prose-li:text-muted-foreground max-w-none text-xs leading-relaxed">
                                            {organization.description ? (
                                              <div className="">
                                                {parse(organization.description)}
                                              </div>
                                        ) : (
                                            <p className="italic text-muted-foreground/60">
                                                Dedicated to delivering exceptional events and fostering community engagement through innovation and excellence.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Column 3: Connect with Us (Contacts & Socials) */}
                                <div className="space-y-8">
                                    <h3 className="text-xl font-black uppercase tracking-tight">Connect with Us.</h3>
                                    <div className="space-y-4">
                                        {organization.websiteUrl && (
                                            <div className="flex items-center gap-3 group">
                                                <Globe className="size-4 text-brand-primary group-hover:scale-110 transition-transform" />
                                                <a href={organization.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold tracking-widest hover:text-brand-primary transition-colors truncate">
                                                    {organization.websiteUrl}
                                                </a>
                                            </div>
                                        )}
                                        {organization.contactEmail && (
                                            <div className="flex items-center gap-3 group">
                                                <Mail className="size-4 text-brand-primary group-hover:scale-110 transition-transform" />
                                                <a href={`mailto:${organization.contactEmail}`} className="text-xs font-bold tracking-widest hover:text-brand-primary transition-colors truncate">
                                                    {organization.contactEmail}
                                                </a>
                                            </div>
                                        )}
                                        {(organization as any).phone && (
                                            <div className="flex items-center gap-3 group">
                                                <Phone className="size-4 text-brand-primary group-hover:scale-110 transition-transform" />
                                                <span className="text-xs font-bold uppercase tracking-widest">
                                                    {(organization as any).phone}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dedicated Social Links */}
                                    {(organization as any).socialLinks?.length > 0 && (
                                        <div className="pt-6 border-t border-dashed flex flex-wrap gap-2">
                                            {(organization as any).socialLinks.map((link: EventSocialLink, idx: number) => (
                                                <a
                                                    key={link.id}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-10 h-10 rounded-full border bg-white flex items-center justify-center hover:bg-brand-primary/10 hover:border-brand-primary hover:text-brand-primary transition-all shadow-sm"
                                                    title={link.url}
                                                >
                                                    <div className="size-5 flex items-center justify-center">
                                                        {getSocialPlatform(link.url, "size-full").icon}
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
            </Section>

         <PoweredByFooter />

        </main>
    );
}
