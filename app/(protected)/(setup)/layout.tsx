import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getProfileWithPromoterStatus } from '@/lib/dal/profile'
import { getUserOrganizations } from '@/lib/dal/organization'
import { AfroTixLogo } from "@/components/shared/AfroTixLogo"

export default async function SetupLayout({
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

    // Check onboarding status
    const profile = await getProfileWithPromoterStatus(user.id)
    if (!profile?.onboardingCompleted) {
        redirect('/onboarding')
    }

    // Check if user already has organizations - if so, they shouldn't be here
    const organizations = await getUserOrganizations(user.id)
    if (organizations.length > 0) {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b">
                <div className="container mx-auto px-4 py-4 flex items-center">
                    <div className="flex items-center gap-2">
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <AfroTixLogo className="size-5" />
                        </div>
                        <span className="font-semibold">AfroTix</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center py-10">
                {children}
            </main>
        </div>
    )
}
