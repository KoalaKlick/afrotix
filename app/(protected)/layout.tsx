import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getProfileWithPromoterStatus } from '@/lib/dal/profile'
import { getUserOrganizations, getOrganizationById } from '@/lib/dal/organization'
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

    // Fetch profile with promoter status for sidebar
    const profile = await getProfileWithPromoterStatus(user.id)

    // Check if onboarding is complete - if not, don't show sidebar
    if (!profile?.onboardingCompleted) {
        return <>{children}</>
    }

    // Fetch user's organizations
    const organizations = await getUserOrganizations(user.id)

    // Get current path to avoid redirect loop
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || ''
    const isOnOrgCreation = pathname.includes('/organization/new')

    // User must belong to at least one organization
    // Redirect to create org if they have none (but not if already on org creation page)
    if (organizations.length === 0 && !isOnOrgCreation) {
        redirect('/organization/new?setup=true')
    }

    // Get active organization from cookie
    const activeOrgId = await getActiveOrganizationId()
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

    // For org creation page during initial setup, show minimal layout
    if (isOnOrgCreation && organizations.length === 0) {
        return <>{children}</>
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
                isPromoter={profile?.isPromoter ?? false}
            />
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}
