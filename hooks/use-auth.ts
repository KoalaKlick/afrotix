'use client'

import { createClient } from '@/utils/supabase/client'
import { buildAuthCallbackUrl } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function useAuth() {
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            () => setLoading(false)
        )
        return () => subscription.unsubscribe()
    }, [supabase.auth])

    const signInWithPassword = async ({ email, password }: { email: string, password: string }) => {
        await supabase.auth.signOut()
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (!error && data.user) {
            router.push('/dashboard')
        }
        return { error }
    }

    const signUp = async ({ email, password, full_name, phone }: { email: string, password: string, full_name: string, phone: string }) => {
        await supabase.auth.signOut()
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name, phone },
                emailRedirectTo: buildAuthCallbackUrl('signup'),
            },
        })
        return { error }
    }

    const signInWithOAuth = async (provider: 'google') => {
        await supabase.auth.signOut()
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: buildAuthCallbackUrl() },
        })
        return { error }
    }

    const sendRecoveryOtp = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        return { error }
    }

    const verifyOtp = async (email: string, token: string, type: 'email' | 'recovery' = 'email') => {
        const { data, error } = await supabase.auth.verifyOtp({ email, token, type })
        return { data, error }
    }

    const updatePassword = async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        return { error }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    return {
        loading,
        signInWithPassword,
        signUp,
        signInWithOAuth,
        sendRecoveryOtp,
        verifyOtp,
        updatePassword,
        signOut,
    }
}
