import { Navbar } from '@/components/Landing/nav/NavBar';
import { OrgBrandingProvider } from '@/components/providers/OrgBrandingProvider';

export default function DashboardLayout({
    children,
}: {
    readonly children: React.ReactNode
}) {
    return (
        <OrgBrandingProvider>
            <div className="flex @container selection:bg-primary/80 selection:text-white  font-montserrat flex-col max-w-svw overflow-x-clip min-h-screen bg-[#F8F7F1] bg-brand-primary/3">
                <Navbar />
                <div className="flex flex-col ">
                    {children}
                </div>
            </div>
        </OrgBrandingProvider>
    )
}