import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { getToken } from 'next-auth/jwt'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
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

// Checks NextAuth session first, then Supabase session.
export async function getApiSession(): Promise<ApiSession | null> {
  // 1a. NextAuth via getServerSession (recommended for App Router route handlers)
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email as string } })
      if (user) return buildApiSession(user)
    }
  } catch (err) {
    console.error('[Auth] getServerSession failed:', err)
  }

  // 1b. NextAuth JWT fallback via raw cookie (handles edge cases / cached sessions)
  try {
    const headersList = headers()
    const cookieHeader = headersList.get('cookie') ?? ''
    const token = await getToken({
      req: { headers: { cookie: cookieHeader } } as Parameters<typeof getToken>[0]['req'],
      secret: process.env.NEXTAUTH_SECRET!,
      secureCookie: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
    })
    if (token?.email) {
      const user = await prisma.user.findUnique({ where: { email: token.email as string } })
      if (user) return buildApiSession(user)
    }
  } catch (err) {
    console.error('[Auth] NextAuth getToken failed:', err)
  }

  // 2. Supabase session fallback (OTP / magic-link logins)
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
      // getUser() makes a network call to Supabase; if it fails, fall back to local
      // session decoding (getSession). Less secure but avoids hard failures.
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
