import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getProfileWithPromoterStatus } from '@/lib/dal/profile'
import { getUserOrganizations, getOrganizationById, getPendingInvitationsForEmail } from '@/lib/dal/organization'
import { getActiveOrganizationId } from '@/lib/organization-context'
import { getOnboardingRedirect } from '@/lib/services/onboarding'
import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

export default async function ProtectedRootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    if (!user.email_confirmed_at) {
        redirect(`/auth/verify?email=${encodeURIComponent(user.email || '')}`)
    }

    const pathname = (await headers()).get('x-pathname') ?? ''

    // Fetch all foundational data ONCE
    const [profile, organizations, activeOrgId, pendingInvitations] = await Promise.all([
        getProfileWithPromoterStatus(user.id),
        getUserOrganizations(user.id),
        getActiveOrganizationId(),
        getPendingInvitationsForEmail(user.email ?? ''),
    ])

    const redirectPath = getOnboardingRedirect({
        user: {
            id: user.id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
        },
        profile,
        organizations,
        pendingInvitations,
        pathname,
    })

    if (redirectPath && pathname !== redirectPath) {
        redirect(redirectPath)
    }

    // Determine active organization for the sidebar
    let activeOrganization = null;
    if (activeOrgId) {
        activeOrganization = organizations.find(org => org.id === activeOrgId) || null;
    }
    if (!activeOrganization && organizations.length > 0) {
        activeOrganization = organizations[0];
    }

    // Should we show the sidebar? (Not on onboarding pages)
    const showSidebar = !pathname.startsWith('/setup');

    if (!showSidebar) {
        return <>{children}</>;
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
    );
}
