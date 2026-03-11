import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getProfileById } from '@/lib/dal/profile'

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

    // Check onboarding status
    const profile = await getProfileById(user.id)

    // Profile doesn't exist or onboarding not completed - redirect to onboarding
    if (!profile?.onboardingCompleted) {
        redirect('/onboarding')
    }

    return <>{children}</>
}
