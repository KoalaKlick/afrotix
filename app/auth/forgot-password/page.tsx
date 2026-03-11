'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { useAuth } from '@/hooks/use-auth'
import { useState, Suspense, useEffect } from 'react'
import { Loader2, ArrowLeft, AlertCircle, Mail } from 'lucide-react'
import Link from 'next/link'
import { OTPVerificationIllustration } from '@/components/auth/OTPVerificationIllustration'

const EmailSchema = z.object({
    email: z.email({ message: 'Please enter a valid email address.' }),
})

const OtpSchema = z.object({
    otp: z.string().length(6, { message: 'Please enter the 6-digit code.' }),
})

type Step = 'email' | 'otp-verify'

function ForgotPasswordContent() {
    const { sendRecoveryOtp, verifyOtp, loading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const expired = searchParams.get('expired') === 'true'
    const [step, setStep] = useState<Step>('email')
    const [email, setEmail] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [resending, setResending] = useState(false)
    const [cooldown, setCooldown] = useState<number | null>(null)

    const emailForm = useForm<z.infer<typeof EmailSchema>>({
        resolver: zodResolver(EmailSchema),
        defaultValues: { email: '' },
    })

    const otpForm = useForm<z.infer<typeof OtpSchema>>({
        resolver: zodResolver(OtpSchema),
        defaultValues: { otp: '' },
    })

    async function onEmailSubmit(data: z.infer<typeof EmailSchema>) {
        setSubmitting(true)
        setEmail(data.email)

        const { error } = await sendRecoveryOtp(data.email)
        if (error) {
            // Handle network errors
            if (error.message === 'Failed to fetch' || error.message.toLowerCase().includes('network')) {
                emailForm.setError('root', { message: 'Unable to connect. Please check your internet connection and try again.' })
                setSubmitting(false)
                return
            }
            const match = /(\d+)\s*second/.exec(error.message)
            if (match) {
                setCooldown(Number.parseInt(match[1], 10))
            } else {
                emailForm.setError('root', { message: error.message })
            }
            setSubmitting(false)
            return
        }
        toast.success('Verification code sent to your email!')
        setStep('otp-verify')
        setSubmitting(false)
    }

    async function handleResend() {
        if (!email || cooldown !== null) return
        setResending(true)
        otpForm.clearErrors('root')

        const { error } = await sendRecoveryOtp(email)
        if (error) {
            const match = /(\d+)\s*second/.exec(error.message)
            if (match) {
                setCooldown(Number.parseInt(match[1], 10))
            } else {
                toast.error(error.message)
                otpForm.setError('root', { message: error.message })
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

    async function onOtpSubmit(data: z.infer<typeof OtpSchema>) {
        setSubmitting(true)
        const { error } = await verifyOtp(email, data.otp, 'recovery')
        if (error) {
            toast.error(error.message)
            otpForm.setError('root', { message: error.message })
            setSubmitting(false)
            return
        }
        toast.success('Code verified successfully!')
        router.push('/auth/reset-password')
    }

    // Step: OTP verification
    if (step === 'otp-verify') {
        return (
            <div className="w-full max-w-sm space-y-6 flex flex-col justify-center flex-1 ">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <OTPVerificationIllustration className="h-24 w-24" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">Enter Verification Code</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        We sent a 6-digit code to<strong className="block mt-1">{email}</strong>
                    </p>
                </div>

                <Form {...otpForm}>
                    <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                        <FormField
                            control={otpForm.control}
                            name="otp"
                            render={({ field }) => (
                                <FormItem className="flex flex-col items-center">
                                    <FormControl>
                                        <InputOTP maxLength={6} {...field}>
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
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {otpForm.formState.errors.root && (
                            <p className="text-sm text-center text-destructive">
                                {otpForm.formState.errors.root.message}
                            </p>
                        )}
                        <Button type="submit" className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold" disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Verify Code
                        </Button>
                    </form>
                </Form>

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
                    <Button variant="ghost" className="flex-1 rounded-full" onClick={() => setStep('email')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Different email
                    </Button>
                </div>
            </div>
        )
    }

    // Step: Enter email
    return (
        <>
            <p className="hidden md:block text-sm text-right text-muted-foreground">
                Remember your password? <Link href="/auth/login" className="font-semibold hover:underline text-red-500">Sign In</Link>
            </p>
            <div className="w-full space-y-6 flex-1 flex flex-col justify-center">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Forgot Password</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Enter your email to receive a verification code.
                    </p>
                </div>

                <div className="space-y-4">
                    {expired && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <p className="text-sm text-amber-600">Session expired. Please request a new code.</p>
                        </div>
                    )}

                    {cooldown !== null && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <p className="text-sm text-amber-600">Please wait {cooldown}s before requesting another code.</p>
                        </div>
                    )}

                    <Form {...emailForm}>
                        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4 md:space-y-6">
                            <FormField
                                control={emailForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input icon={<Mail className="size-4" />} placeholder="Email Address" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {emailForm.formState.errors.root && (
                                <p className="text-sm text-destructive">
                                    {emailForm.formState.errors.root.message}
                                </p>
                            )}
                            <Button type="submit" className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold" disabled={submitting || loading || cooldown !== null}>
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {cooldown === null ? 'Send Code' : `Resend in ${cooldown}s`}
                            </Button>
                        </form>
                    </Form>
                </div>

                <p className="md:hidden text-sm text-center text-muted-foreground">
                    Remember your password?{' '}
                    <Link href="/auth/login" className="text-red-500 font-medium hover:underline">Sign in</Link>
                </p>
            </div>
        </>
    )
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
            <ForgotPasswordContent />
        </Suspense>
    )
}
