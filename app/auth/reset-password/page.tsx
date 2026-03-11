'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
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
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, KeyRound, Lock } from 'lucide-react'
import { PasswordSuccessSVG } from '@/components/auth/PasswordSuccessSVG'
import { PasswordRefreshIllustration } from '@/components/auth/PasswordRefreshIllustration'

const FormSchema = z.object({
    password: z.string().min(8, {
        message: 'Password must be at least 8 characters.',
    }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export default function ResetPasswordPage() {
    const { updatePassword, loading } = useAuth()
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [checking, setChecking] = useState(true)
    const [hasSession, setHasSession] = useState(false)
    const [success, setSuccess] = useState(false)

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    })

    useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            setHasSession(!!session)
            setChecking(false)
        }
        checkSession()
    }, [])

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        setSubmitting(true)
        const { error } = await updatePassword(data.password)
        setSubmitting(false)

        if (error) {
            toast.error(error.message)
            form.setError('root', { message: error.message })
            return
        }

        toast.success('Password updated successfully!')
        setSuccess(true)
    }

    if (checking) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        )
    }

    if (!hasSession) {
        return (
            <div className="w-full text-center space-y-4 flex-1 flex flex-col justify-center">
                <h1 className="text-2xl font-semibold tracking-tight">Session Expired</h1>
                <p className="text-sm text-muted-foreground">
                    Your reset link has expired or is invalid. Please request a new one.
                </p>
                <Button onClick={() => router.push('/auth/forgot-password')} className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
                    Request New Reset Link
                </Button>
            </div>
        )
    }

    if (success) {
        return (
            <div className="w-full text-center space-y-4 flex-1 flex flex-col justify-center">
                <div className="flex justify-center">
                    <PasswordSuccessSVG className="h-24 w-24" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Password Updated!</h1>
                <p className="text-sm text-muted-foreground">
                    Your password has been successfully reset.
                </p>
                <Button onClick={() => router.push('/auth/login')} className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
                    Sign In
                </Button>
            </div>
        )
    }

    return (
        <div className="w-full space-y-6 flex-1 flex flex-col justify-center">
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <PasswordRefreshIllustration className="size-24 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
                <p className="mt-1 text-sm text-muted-foreground">Enter your new password below.</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input icon={<Lock className="size-4" />} type="password" placeholder="New Password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input icon={<Lock className="size-4" />} type="password" placeholder="Confirm Password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {form.formState.errors.root && (
                        <p className="text-sm text-center text-destructive">
                            {form.formState.errors.root.message}
                        </p>
                    )}
                    <Button type="submit" className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold" disabled={submitting || loading}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Update Password
                    </Button>
                </form>
            </Form>
        </div>
    )
}
