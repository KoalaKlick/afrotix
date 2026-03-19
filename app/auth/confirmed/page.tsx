'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { EmailVerifiedIllustration } from '@/components/auth/EmailVerifiedIllustration'

export default function EmailConfirmedPage() {
    const router = useRouter()

    return (
        <div className="w-full max-w-sm space-y-6 flex flex-col md:text-center justify-center flex-1 ">
            <div className="flex justify-center">
                <EmailVerifiedIllustration className="size-24 text-green-500" />
            </div>
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Email Confirmed!</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Your email has been successfully verified.
                </p>
            </div>
            <p className="text-sm text-muted-foreground">
                You can close this tab and return to where you were signing up,
                or continue to setup from here.
            </p>
            <Button
                className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold" onClick={() => router.push('/setup/onboarding')}
            >
                Continue Setup
            </Button>
        </div>
    )
}
