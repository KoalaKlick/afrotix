import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getProfileWithPromoterStatus } from '@/lib/dal/profile'
import { getPendingInvitationsForEmail, getUserOrganizations } from '@/lib/dal/organization'
import AfricaMap from '@/components/auth/AfricaMap'
import { AfroTixLogo } from "@/components/shared/AfroTixLogo"
import Link from 'next/link'

export default async function SetupLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const pathname = (await headers()).get('x-pathname') ?? ''
    const isOnboardingRoute = pathname.startsWith('/onboarding')
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
        if (!isOnboardingRoute) {
            redirect('/onboarding')
        }
    } else if (isOnboardingRoute) {
        const [organizations, pendingInvitations] = await Promise.all([
            getUserOrganizations(user.id),
            getPendingInvitationsForEmail(user.email ?? ''),
        ])

        if (organizations.length > 0) {
            redirect('/dashboard')
        }

        if (pendingInvitations.length > 0) {
            redirect('/organization/invitations')
        }

        redirect('/organization/new?setup=true')
    }

    // Check if user already has organizations - if so, they shouldn't be here
    const organizations = await getUserOrganizations(user.id)
    if (organizations.length > 0) {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen bg-background flex flex-col lg:flex-row font-poppins">
            <div className="relative w-full lg:w-1/2 h-65 lg:h-screen overflow-hidden shadow bg-secondary-50">
                <AfricaMap
                    images={["/landing/g.webp", "/landing/b.webp", "/landing/h.webp"]}
                    interval={9000}
                    showHoverColor={true}
                    showTransitionColor={false}
                />

                <div className="absolute top-1/2 left-6 right-6 lg:space-y-6 max-w-[12rem] sm:max-w-[15rem] md:max-w-xs pointer-events-none">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="pointer-events-auto">
                            <AfroTixLogo className="w-32 sm:w-38 md:w-40 lg:w-48 h-auto border border-black" />
                        </Link>
                    </div>
                    <span className="mt-2 text-sm  inline-block bg-secondary-50 font-medium text-foreground/80">
                        Finish your <span className="text-primary-500">profile</span> and <span className="text-secondary-500">organization setup</span> before you head into the dashboard.
                    </span>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center px-4 py-10 lg:px-16">
                <div className="w-full max-w-md h-full flex flex-col justify-center">
                    {children}
                </div>
            </div>
        </div>
    )
}
