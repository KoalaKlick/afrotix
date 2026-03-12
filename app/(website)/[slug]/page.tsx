import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getOrganizationProfile, getMembershipRequest } from "@/lib/dal/organization";
import { OrgProfileHero } from "@/components/organization/OrgProfileHero";
import { OrgEventList } from "@/components/organization/OrgEventList";
import { PanAfricanDivider } from "@/components/shared/PanAficDivider";

interface OrgProfilePageProps {
    readonly params: Promise<{ slug: string }>;
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

            <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
                <section className="space-y-8">
                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-center">
                        Our Events.
                    </h2>
                    <PanAfricanDivider />
                    <OrgEventList events={organization.events} organizationSlug={slug} />
                </section>
            </div>
        </main>
    );
}
