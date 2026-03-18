import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getProfileWithPromoterStatus } from '@/lib/dal/profile'
import { getUserOrganizations, getOrganizationById, getPendingInvitationsForEmail } from '@/lib/dal/organization'
import { getActiveOrganizationId } from '@/lib/organization-context'
import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

export default async function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    // Parent layout guarantees: authenticated, email verified, onboarding done, has org
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    const [profile, organizations, activeOrgId, pendingInvitations] = await Promise.all([
        getProfileWithPromoterStatus(user.id),
        getUserOrganizations(user.id),
        getActiveOrganizationId(),
        getPendingInvitationsForEmail(user.email ?? ""),
    ]);

    let activeOrganization = null

    if (activeOrgId) {
        const isValidOrg = organizations.some(org => org.id === activeOrgId)
        if (isValidOrg) {
            activeOrganization = await getOrganizationById(activeOrgId)
        }
    }

    if (!activeOrganization && organizations.length > 0) {
        activeOrganization = await getOrganizationById(organizations[0].id)
    }

    return (
        <SidebarProvider>
            <AppSidebar
                user={{
                    name: profile?.fullName ?? user.user_metadata?.full_name ?? "User",
                    email: user.email ?? "",
                    avatar: profile?.avatarUrl ?? "",
                }}
                organizations={organizations}
                activeOrganization={activeOrganization}
                pendingInvitations={pendingInvitations}
            />
            <SidebarInset className="overflow-hidden font-poppins">
                <div className="relative min-h-screen pt-20 flex-1">
                 <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-secondary-600/30 via-transparent to-green-600/30" />
                    <div className="relative z-10 flex min-h-screen flex-col">
                        {children}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
