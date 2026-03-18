import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getProfileWithPromoterStatus } from '@/lib/dal/profile'
import { getUserOrganizations, getPendingInvitationsForEmail } from '@/lib/dal/organization'

const SETUP_ROUTES = ['/onboarding', '/organization/new', '/organization/invitations']

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
    const isOnSetupRoute = SETUP_ROUTES.some(r => pathname.startsWith(r))

    const [profile, organizations, pendingInvitations] = await Promise.all([
        getProfileWithPromoterStatus(user.id),
        getUserOrganizations(user.id),
        getPendingInvitationsForEmail(user.email ?? ''),
    ])

    const needsOnboarding = !profile?.onboardingCompleted
    const hasOrganization = organizations.length > 0

    if (needsOnboarding) {
        // Must complete onboarding first
        if (!pathname.startsWith('/onboarding')) {
            redirect('/onboarding')
        }
    } else if (!hasOrganization) {
        // Onboarding done but needs an organization
        if (!isOnSetupRoute) {
            if (pendingInvitations.length > 0) {
                redirect('/organization/invitations')
            }
            redirect('/onboarding')
        }
    } else if (isOnSetupRoute) {
        // Fully set up — shouldn't be on setup routes
        redirect('/dashboard')
    }

    return <>{children}</>
}
