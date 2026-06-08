import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

// Drop-in replacement for getServerSession(authOptions) across all API routes.
// Reads the Supabase cookie session, then finds or auto-creates the matching Prisma User.
export async function getApiSession(): Promise<ApiSession | null> {
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
      },
    })
  }

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
