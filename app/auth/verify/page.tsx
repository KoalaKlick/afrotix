'use client'

import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { OTPVerificationIllustration } from "@/components/auth/OTPVerificationIllustration"
import { EmailVerifiedIllustration } from "@/components/auth/EmailVerifiedIllustration"

function VerificationContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [email] = useState(searchParams.get('email') || '')
    const [otp, setOtp] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [resending, setResending] = useState(false)
    const [cooldown, setCooldown] = useState<number | null>(null)
    const [verified, setVerified] = useState(false)

    const handleVerify = async () => {
        if (otp.length !== 6) {
            setError('Please enter the 6-digit code')
            return
        }

        setSubmitting(true)
        setError('')

        const supabase = createClient()
        const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email',
        })

        if (error) {
            toast.error(error.message)
            setError(error.message)
            setSubmitting(false)
            return
        }

        toast.success('Email verified successfully!')
        setVerified(true)
        setTimeout(() => router.push('/setup/onboarding'), 1500)
    }

    const handleResend = async () => {
        if (!email || cooldown !== null) return
        setResending(true)
        setError('')
        const supabase = createClient()
        const { error } = await supabase.auth.resend({ type: 'signup', email })
        if (error) {
            const match = /(\d+)\s*second/.exec(error.message)
            if (match) {
                setCooldown(Number.parseInt(match[1], 10))
            } else {
                toast.error(error.message)
                setError(error.message)
            }
        } else {
            toast.success('Verification code resent!')
        }
        setResending(false)
    }

    useEffect(() => {
        if (cooldown === null) return
        const interval = setInterval(() => {
            setCooldown((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval)
                    return null
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [cooldown])

    if (verified) {
        return (
            <div className="w-full text-center space-y-4 flex-1 flex flex-col justify-center">
                <div className="flex justify-center">
                    <EmailVerifiedIllustration className="size-24 text-green-500" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Email Verified!</h1>
                <p className="text-sm text-muted-foreground">Redirecting to setup...</p>
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
        )
    }

    return (
        <div className="w-full space-y-6 flex-1 flex flex-col justify-center">
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <OTPVerificationIllustration className="h-24 w-24" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Verify Your Email</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Enter the 6-digit code sent to
                    {email && <strong className=""> {email}</strong>}
                </p>
            </div>

            <div className="space-y-4">
                <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} className="rounded-r-none!" />
                        </InputOTPGroup>
                        <span className="text-muted-foreground/50">-</span>
                        <InputOTPGroup>
                            <InputOTPSlot index={3} className="rounded-l-none!" />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                        </InputOTPGroup>
                    </InputOTP>
                </div>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <p className="text-sm text-destructive text-center">{error}</p>
                    </div>
                )}

                <Button className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold" onClick={handleVerify} disabled={submitting || otp.length !== 6}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Verify Email
                </Button>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-full"
                        onClick={handleResend}
                        disabled={resending || cooldown !== null}
                    >
                        {resending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {cooldown === null ? 'Resend Code' : `Resend in ${cooldown}s`}
                    </Button>
                    <Button variant="ghost" className="flex-1 rounded-full" onClick={() => router.push('/auth/login')}>
                        Back to Login
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function VerificationPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
            <VerificationContent />
        </Suspense>
    )
}
