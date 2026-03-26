import "server-only"
import type { Profile } from "@/lib/generated/prisma"
import type { OrganizationWithRole, InvitationWithOrganization } from "@/lib/dal/organization"

export const SETUP_ROUTES = [
    '/setup/onboarding',
    '/setup/organization/new',
    '/setup/organization/invitations'
]

interface OnboardingStateParams {
    user: {
        id: string
        email?: string
        email_confirmed_at?: string
    }
    profile: Profile | null
    organizations: OrganizationWithRole[]
    pendingInvitations: InvitationWithOrganization[]
    pathname: string
}

/**
 * Determines where a user should be redirected based on their onboarding and organization status.
 * Returns the destination URL if a redirect is needed, otherwise null.
 */
export function getOnboardingRedirect({
    user,
    profile,
    organizations,
    pendingInvitations,
    pathname
}: OnboardingStateParams): string | null {
    // 1. Email Verification Check
    if (!user.email_confirmed_at) {
        const verifyPath = `/auth/verify?email=${encodeURIComponent(user.email || '')}`
        return pathname.startsWith('/auth/verify') ? null : verifyPath
    }

    const isOnSetupRoute = SETUP_ROUTES.some(r => pathname.startsWith(r))
    const needsOnboarding = !profile?.onboardingCompleted
    const hasOrganization = organizations.length > 0
    const hasUsername = !!profile?.username

    // Fallback: If user has an organization and a username, they have effectively completed onboarding
    const canSkipOnboarding = needsOnboarding && hasOrganization && hasUsername

    // 2. Profile Onboarding Check
    if (needsOnboarding && !canSkipOnboarding) {
        // If not on onboarding page, send them there
        if (!pathname.startsWith('/setup/onboarding')) {
            return '/setup/onboarding'
        }
        return null // Already on the right track
    }

    // 3. Organization Setup Check
    if (!hasOrganization) {
        // If they have invitations, send them to the invitations tab
        if (pendingInvitations.length > 0) {
            if (pathname !== '/setup/organization/invitations') {
                return '/setup/organization/invitations'
            }
            return null
        }

        // Otherwise, they must create an organization
        if (pathname !== '/setup/organization/new') {
            return '/setup/organization/new'
        }
        return null
    }

    // 4. Cleanup: If fully set up but still on a setup route, go to dashboard
    if (isOnSetupRoute) {
        return '/dashboard'
    }

    return null // No redirect needed
}
