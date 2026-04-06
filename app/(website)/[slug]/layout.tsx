import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrganizationBySlug } from "@/lib/dal/organization";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { BrandingSync } from "@/components/providers/BrandingSync";
import { PublicAppearanceSettings } from "@/components/shared/PublicAppearanceSettings";

interface OrgLayoutProps {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: OrgLayoutProps): Promise<Metadata> {
    const { slug } = await params;
    const organization = await getOrganizationBySlug(slug);
    if (!organization) return {};

    const faviconUrl = getOrgImageUrl(organization.faviconUrl) || getOrgImageUrl(organization.logoUrl);
    if (!faviconUrl) return {};

    return {
        icons: {
            icon: faviconUrl,
            shortcut: faviconUrl,
            apple: faviconUrl,
        },
    };
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
    const { slug } = await params;
    const organization = await getOrganizationBySlug(slug);

    if (!organization) {
        notFound();
    }

    const logoUrl = getOrgImageUrl(organization.logoUrl);

    return (
        <>
            <BrandingSync 
                logoUrl={logoUrl} 
                name={organization.name} 
                primaryColor={organization.primaryColor}
                secondaryColor={organization.secondaryColor}
                tertiaryColor={organization.tertiaryColor}
            />
            <PublicAppearanceSettings />
            {children}
        </>
    );
}
