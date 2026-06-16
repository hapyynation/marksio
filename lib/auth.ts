import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth-options'
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
    /** plan downgraded to 'free' when planStatus is expired or past_due */
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

// Checks NextAuth JWT (email+password) first, then falls back to Supabase (OTP / legacy).
export async function getApiSession(): Promise<ApiSession | null> {
  // 1. NextAuth session (email+password login)
  try {
    const nextSession = await getServerSession(authOptions)
    if (nextSession?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: nextSession.user.email } })
      if (user) return buildApiSession(user)
    }
  } catch { /* fall through */ }

  // 2. Supabase session (OTP login / existing sessions)
  const cookieStore = await cookies()
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

  const { data: { user: supaUser } } = await supabase.auth.getUser()
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
        emailVerified: true, // Supabase already verified this email
      },
    })
  } else if (!user.emailVerified) {
    // Supabase session means Supabase verified the email — sync that to Prisma
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    })
  }

  return buildApiSession(user)
}

// Legacy client-side helpers (kept for compatibility)
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
