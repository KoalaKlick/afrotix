import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    // Preserved through the email verification redirect (e.g. /invite?token=xxx)
    const next = searchParams.get('next')

    const supabase = await createClient()

    // Handle PKCE flow (code-based)
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // If a next URL was embedded in the redirect, honour it
            if (next) {
                return redirectTo(request, origin, next)
            }
            // Determine redirect based on type
            let redirectUrl = '/dashboard' // Default for OAuth login
            if (type === 'recovery') {
                redirectUrl = '/auth/reset-password'
            } else if (type === 'signup') {
                redirectUrl = '/auth/confirmed'
            }
            return redirectTo(request, origin, redirectUrl)
        }

        // PKCE errors - redirect gracefully based on type
        if (type === 'signup') {
            return NextResponse.redirect(`${origin}/auth/login?verified=true`)
        }
        if (type === 'recovery') {
            return NextResponse.redirect(`${origin}/auth/forgot-password?expired=true`)
        }
    }

    // Handle token_hash flow (older email format)
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email',
        })
        if (!error) {
            if (next) {
                return redirectTo(request, origin, next)
            }
            const redirectUrl = type === 'recovery' ? '/auth/reset-password' : '/auth/confirmed'
            return redirectTo(request, origin, redirectUrl)
        }

        // Token errors - redirect gracefully
        if (type === 'recovery') {
            return NextResponse.redirect(`${origin}/auth/forgot-password?expired=true`)
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

function redirectTo(request: Request, origin: string, path: string) {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'

    if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${path}`)
    }
    if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${path}`)
    }
    return NextResponse.redirect(`${origin}${path}`)
}

