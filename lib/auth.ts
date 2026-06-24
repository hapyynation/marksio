import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { getEffectivePlan } from '@/lib/plan-limits'

export interface ApiSession {
  user: {
    id: string
    email: string
    name: string
    storeName: string
    plan: string
    planStatus: string
    effectivePlan: string
    onboarded: boolean
  }
}

function buildApiSession(user: {
  id: string; email: string; name: string; storeName: string
  plan: string; planStatus: string; onboarded: boolean
}): ApiSession {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      storeName: user.storeName,
      plan: user.plan,
      planStatus: user.planStatus,
      effectivePlan: getEffectivePlan(user.plan, user.planStatus),
      onboarded: user.onboarded,
    },
  }
}

// NextAuth uses the cookie name as the JOSE encryption salt.
// Both variants must be tried: VERCEL always uses __Secure- prefix (HTTPS),
// but local dev and older sessions may use the plain name.
const NEXTAUTH_COOKIE_VARIANTS = [
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
] as const

export async function getApiSession(): Promise<ApiSession | null> {
  // Strategy 1: Read NextAuth JWT directly from the request cookies.
  // Using cookies() is more reliable than getServerSession in App Router route handlers
  // because it directly accesses the Next.js request context without intermediate layers.
  try {
    const cookieStore = cookies()

    for (const cookieName of NEXTAUTH_COOKIE_VARIANTS) {
      const tokenValue = cookieStore.get(cookieName)?.value
      if (!tokenValue) continue

      // Construct a minimal fake request containing only this cookie so that
      // getToken doesn't get confused by other cookies in the jar.
      // Explicit cookieName ensures getToken uses the correct JOSE salt.
      const token = await getToken({
        req: {
          headers: { cookie: `${cookieName}=${tokenValue}` },
        } as Parameters<typeof getToken>[0]['req'],
        secret: process.env.NEXTAUTH_SECRET!,
        cookieName,
        secureCookie: cookieName.startsWith('__Secure-'),
      })

      if (token?.email) {
        const user = await prisma.user.findUnique({ where: { email: token.email as string } })
        if (user) {
          console.log(`[Auth] OK via NextAuth cookie: ${cookieName}`)
          return buildApiSession(user)
        }
        console.error('[Auth] NextAuth token valid but user not in DB:', token.email)
      }
    }
  } catch (err) {
    console.error('[Auth] NextAuth cookie strategy failed:', err)
  }

  // Strategy 2: Supabase session (OTP / magic-link logins)
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: { user: supaUser }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('[Auth] Supabase getUser error:', error.message)
      // getUser() makes a network call; fall back to local JWT decode (getSession).
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } })
        if (user) return buildApiSession(user)
      }
      return null
    }

    if (!supaUser?.email) return null

    let user = await prisma.user.findUnique({ where: { email: supaUser.email } })

    if (!user) {
      const name = (supaUser.user_metadata?.name as string | undefined)
        || supaUser.email.split('@')[0]
      user = await prisma.user.create({
        data: {
          email: supaUser.email,
          name,
          storeName: (supaUser.user_metadata?.store_name as string | undefined) || name,
          password: '',
          emailVerified: true,
        },
      })
    } else if (!user.emailVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      })
    }

    return buildApiSession(user)
  } catch (err) {
    console.error('[Auth] Supabase session failed:', err)
    return null
  }
}

// ── Legacy client-side helpers (kept for compatibility) ───────────────────────
export interface AuthUser {
  name: string
  email: string
  storeName: string
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const u = localStorage.getItem('marksio_user')
    return u ? (JSON.parse(u) as AuthUser) : null
  } catch {
    return null
  }
}

export function setUser(user: AuthUser): void {
  localStorage.setItem('marksio_user', JSON.stringify(user))
}

export function clearUser(): void {
  localStorage.removeItem('marksio_user')
}
