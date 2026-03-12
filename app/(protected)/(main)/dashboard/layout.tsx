import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getProfileById } from '@/lib/dal/profile'
import { getPendingInvitationsForEmail, getUserOrganizations } from '@/lib/dal/organization'

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // User should exist here (protected layout checks this)
    // But double-check for safety
    if (!user) {
        redirect('/auth/login')
    }

    const [profile, organizations, pendingInvitations] = await Promise.all([
        getProfileById(user.id),
        getUserOrganizations(user.id),
        getPendingInvitationsForEmail(user.email ?? ''),
    ])

    // Profile doesn't exist or onboarding not completed - redirect to onboarding
    if (!profile?.onboardingCompleted) {
        redirect('/onboarding')
    }

    if (organizations.length === 0) {
        if (pendingInvitations.length > 0) {
            redirect('/organization/invitations')
        }

        redirect('/organization/new?setup=true')
    }

    return <>{children}</>
}
