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
import { useState } from 'react'
import { User, Mail, Lock, Phone } from 'lucide-react'
import GoogleIcon from '@/app/assert/google-icon.svg'
import Link from 'next/link'


const FormSchema = z.object({
    full_name: z.string().min(2, {
        message: 'Name must be at least 2 characters.',
    }),
    phone: z.string().min(10, {
        message: 'Please enter a valid phone number.',
    }),
    email: z.email({
        message: 'Please enter a valid email address.',
    }),
    password: z.string().min(8, {
        message: 'Password must be at least 8 characters.',
    }),
})

export default function RegisterPage() {
    const { signUp, signInWithOAuth, loading } = useAuth()
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            full_name: '',
            phone: '',
            email: '',
            password: '',
        },
    })

    async function onSubmit(data: z.infer<typeof FormSchema>) {
        try {
            setSubmitting(true)
            const { error } = await signUp({
                email: data.email,
                password: data.password,
                full_name: data.full_name,
                phone: data.phone,
            })

            if (error) {
                // Handle network errors
                if (error.message === 'Failed to fetch' || error.message.toLowerCase().includes('network')) {
                    form.setError('root', { message: 'Unable to connect. Please check your internet connection and try again.' })
                    toast.error('Unable to connect. Please check your internet connection.')
                    return
                }
                toast.error(error.message)
                form.setError('root', { message: error.message })
                return
            }

            toast.success('Account created successfully!')
            router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`)
        } catch (error) {
            console.error(error)
        } finally {
            setSubmitting(false)
        }
    }

    const handleGoogleSignIn = async () => {
        await signInWithOAuth('google')
    }

    return (
        <>
            <p className="hidden md:block text-sm text-right text-muted-foreground">
                Already have an account? <Link href="/auth/login" className=" font-semibold hover:underline text-red-500">Log In</Link>
            </p>
            <div className="w-full space-y-6 flex-1 flex flex-col justify-center">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Join the Celebration
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create your account to get started.
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input icon={<User className="size-4" />} placeholder="Full Name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input icon={<Phone className="size-4" />} placeholder="Phone Number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {form.formState.errors.root && (
                            <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
                        )}
                        <Button type="submit" className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold" disabled={submitting || loading}>
                            {submitting ? 'Creating account...' : 'Create Account'}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground -mt-3">
                            By signing up, you agree to our <a href="/terms" className="text-red-500 hover:underline">Terms & Conditions</a>
                        </p>
                    </form>
                </Form>

                <div className="relative ">
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
                    Already have an account? <a href="/auth/login" className="text-red-500 font-medium hover:underline">Log In</a>
                </p>
            </div>
        </>

    )
}
