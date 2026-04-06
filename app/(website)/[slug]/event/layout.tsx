import { OrgHeader } from "@/components/organization/OrgHeader";

interface EventLayoutProps {
    readonly children: React.ReactNode;
    readonly params: Promise<{ slug: string }>;
}

export default async function EventLayout({ children, params }: EventLayoutProps) {
    const { slug } = await params;

    return (
        <>
            <OrgHeader slug={slug} />
            {children}
        </>
    );
}
