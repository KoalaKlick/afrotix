import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/lib/dal/organization";
import { getOrgImageUrl } from "@/lib/image-url-utils";
import { BrandingSync } from "@/components/providers/BrandingSync";

interface OrgLayoutProps {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
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
            <BrandingSync logoUrl={logoUrl} name={organization.name} />
            {children}
        </>
    );
}
