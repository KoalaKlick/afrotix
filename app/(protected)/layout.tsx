import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getProfileWithPromoterStatus } from '@/lib/dal/profile'
import { getUserOrganizations, getPendingInvitationsForEmail } from '@/lib/dal/organization'
import { getOnboardingRedirect } from '@/lib/services/onboarding'

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

    const [profile, organizations, pendingInvitations] = await Promise.all([
        getProfileWithPromoterStatus(user.id),
        getUserOrganizations(user.id),
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

    return <>{children}</>
}
