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

export default async function ProtectedLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // No user - redirect to login
    if (!user) {
        redirect('/auth/login')
    }

    // Email not verified - redirect to verify
    if (!user.email_confirmed_at) {
        redirect(`/auth/verify?email=${encodeURIComponent(user.email || '')}`)
    }

    // Parallelize independent data fetches
    const [profile, organizations, activeOrgId, pendingInvitations] = await Promise.all([
        getProfileWithPromoterStatus(user.id),
        getUserOrganizations(user.id),
        getActiveOrganizationId(),
        getPendingInvitationsForEmail(user.email ?? ""),
    ]);

    // Check if onboarding is complete - if not, don't show sidebar
    if (!profile?.onboardingCompleted) {
        return <>{children}</>
    }

    // Handle users with no organization - redirect to setup flow
    if (organizations.length === 0) {
        if (pendingInvitations.length > 0) {
            redirect('/organization/invitations')
        } else {
            redirect('/organization/new?setup=true')
        }
    }

    let activeOrganization = null

    // Validate active org exists and user is member
    if (activeOrgId) {
        const isValidOrg = organizations.some(org => org.id === activeOrgId)
        if (isValidOrg) {
            activeOrganization = await getOrganizationById(activeOrgId)
        }
    }

    // If no valid active org from cookie, use first organization (but don't set cookie here)
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
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
