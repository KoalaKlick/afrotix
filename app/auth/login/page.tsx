'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useSearchParams, useRouter } from 'next/navigation'
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
import { useAuth } from '@/hooks/use-auth'
import { useState, Suspense } from 'react'
import { Loader2, Mail, Lock } from 'lucide-react'
import GoogleIcon from '@/app/assert/google-icon.svg'
import Link from 'next/link'
import { EmailVerifiedIllustration } from '@/components/auth/EmailVerifiedIllustration'

const FormSchema = z.object({
    email: z.email({
        message: 'Please enter a valid email address.',
    }),
    password: z.string().min(1, {
        message: 'Password is required.',
    }),
})

function LoginForm() {
    const { signInWithPassword, signInWithOAuth, loading } = useAuth()
    const searchParams = useSearchParams()
    const router = useRouter()
    const verified = searchParams.get('verified') === 'true'
    const [submitting, setSubmitting] = useState(false)
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setSubmitting(true)
        const { error } = await signInWithPassword({
            email: data.email,
            password: data.password,
        })
        setSubmitting(false)

        if (error) {
            // Handle network errors
            if (error.message === 'Failed to fetch' || error.message.toLowerCase().includes('network')) {
                form.setError('root', { message: 'Unable to connect. Please check your internet connection and try again.' })
                return
            }

            // Check if email is not confirmed (status 400 with specific message/code)
            const isEmailNotConfirmed =
                error.code === 'email_not_confirmed' ||
                error.message.toLowerCase().includes('email not confirmed')

            if (isEmailNotConfirmed) {
                router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`)
                return
            }
            toast.error(error.message)
            form.setError('root', { message: error.message })
            return
        }

        toast.success('Welcome back!')
    }

    const handleGoogleSignIn = async () => {
        await signInWithOAuth('google')
    }

    return (
        <div className="space-y-6">
            {verified && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
                    <EmailVerifiedIllustration className="size-24 text-green-500" />
                    <p className="text-sm text-green-600">Email verified! You can now log in.</p>
                </div>
            )}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                    <FormField
                        control={form.control}
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
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input icon={<Lock className="size-4" />} type="password" placeholder="Password" {...field} />
                                </FormControl>
                                <div className="flex justify-end">
                                    <Link
                                        href="/auth/forgot-password"
                                        className="text-xs text-muted-foreground hover:text-primary underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {form.formState.errors.root && (
                        <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
                    )}
                    <Button type="submit" className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold" disabled={submitting || loading}>
                        {submitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>
            </Form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>

            <Button variant="outline" type="button" className="w-full rounded-full shadow-none bg-neutral-50" onClick={handleGoogleSignIn} disabled={loading}>
                <GoogleIcon className="mr-2 h-4 w-4" />
                Google
            </Button>

            <p className="md:hidden text-sm text-center text-muted-foreground">
                Don't have an account? <Link href="/auth/register" className="text-red-500 font-medium hover:underline">Sign up</Link>
            </p>
        </div>
    )
}

export default function LoginPage() {
    return (
        <>
            <p className="hidden md:block text-sm text-right text-muted-foreground">
                Don't have an account? <Link href="/auth/register" className="font-semibold hover:underline text-red-500">Sign Up</Link>
            </p>
            <div className="w-full space-y-6 flex-1 flex flex-col justify-center">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sign in to continue discovering events.
                    </p>
                </div>
                <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </>
    )
}
