import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/onboarding',
  '/auth/callback',
  '/unsubscribe',
  '/api/auth',
  '/api/track',
  '/api/cron',
  '/api/integrations/shopify/callback',
  '/api/integrations/shopify/auth',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'))
}

function isOnboardingRequired(pathname: string): boolean {
  const exempt = ['/onboarding', '/verify-email', '/api/']
  return !exempt.some(p => pathname === p || pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes handle auth themselves
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check NextAuth session first (email+password login)
  const nextToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  let supabaseResponse = NextResponse.next({ request })
  let supabaseUser: { email?: string } | null = null

  // Only hit Supabase if no NextAuth session (avoids double latency)
  if (!nextToken) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    supabaseUser = user
  }

  const isAuthenticated = !!(nextToken || supabaseUser)

  // Root redirect
  if (pathname === '/') {
    return NextResponse.redirect(new URL(isAuthenticated ? '/dashboard' : '/login', request.url))
  }

  // Authenticated user visiting auth pages → dashboard
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Unauthenticated visiting protected route → login
  if (!isAuthenticated && !isPublicPath(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Onboarding gate
  if (isAuthenticated && isOnboardingRequired(pathname)) {
    const onboardedCookie = request.cookies.get('marksio_onboarded')?.value
    if (!onboardedCookie) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
