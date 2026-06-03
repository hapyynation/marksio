'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SessionUser {
  id: string
  email?: string
  name?: string
  storeName?: string
  plan?: string
}

interface SessionData {
  user: SessionUser
}

export function useSession() {
  const [data, setData] = useState<SessionData | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    const supabase = createClient()

    const buildData = (user: { id: string; email?: string; user_metadata?: Record<string, unknown> }): SessionData => ({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name as string | undefined,
        storeName: user.user_metadata?.store_name as string | undefined,
        plan: (user.user_metadata?.plan as string | undefined) ?? 'free',
      },
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setData(buildData(session.user))
        setStatus('authenticated')
      } else {
        setStatus('unauthenticated')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setData(buildData(session.user))
        setStatus('authenticated')
      } else {
        setData(null)
        setStatus('unauthenticated')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { data, status }
}
