import { FooterSection } from '@/components/Landing/sections/FooterSection';
import { Navbar } from '@/components/Landing/nav/NavBar';
import { OrgBrandingProvider } from '@/components/providers/OrgBrandingProvider';

export default function DashboardLayout({
    children,
}: {
    readonly children: React.ReactNode
}) {
    return (
        <OrgBrandingProvider>
            <div className="flex @container selection:bg-primary-500 selection:text-white  font-montserrat flex-col max-w-svw overflow-x-clip min-h-screen bg-[#F8F7F1]">
                <Navbar />
                <div className="flex flex-col ">
                    {children}
                </div>
            </div>
        </OrgBrandingProvider>
    )
}