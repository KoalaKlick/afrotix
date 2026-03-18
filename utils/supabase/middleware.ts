import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // Refresh session - this is needed for Supabase cookie management
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Add pathname header for server components
    response.headers.set('x-pathname', pathname)

    // Protected routes - redirect to login if not authenticated
    const protectedPrefixes = ['/dashboard', '/promoter', '/my-events', '/onboarding', '/organization']
    if (!user && protectedPrefixes.some(prefix => pathname.startsWith(prefix))) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Auth pages - redirect to dashboard if already authenticated
    // Exclude callback, reset-password (needs session), and confirmed pages
    const authPagesForRedirect = ['/auth/login', '/auth/register', '/auth/forgot-password']
    if (user && authPagesForRedirect.some(page => pathname.startsWith(page))) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
}
