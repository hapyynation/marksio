import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

export async function getApiSession(): Promise<ApiSession | null> {
  // Strategy 1: NextAuth credentials session (email/password logins)
  // getServerSession uses NextAuth's internal machinery with the correct JOSE salt,
  // which is more reliable than calling decode() directly.
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email as string } })
      if (user) {
        console.log('[Auth] OK via getServerSession:', user.email)
        return buildApiSession(user)
      }
      console.error('[Auth] NextAuth session valid but user not in DB:', session.user.email)
    }
  } catch (err) {
    console.error('[Auth] getServerSession failed:', err)
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
