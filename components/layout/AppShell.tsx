'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'
import { SettingsDrawerProvider, useSettingsDrawer } from '@/lib/settings-drawer-context'
import Sidebar from './Sidebar'
import SettingsDrawer from '@/components/settings/SettingsDrawer'
import ChatWidget from '@/components/ChatWidget'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { signOut as nextAuthSignOut } from 'next-auth/react'

function MobileHeader() {
  const { setOpen } = useSidebar()
  const { open: openSettingsDrawer } = useSettingsDrawer()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!menuOpen) return
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [menuOpen])

  async function handleSignOut() {
    setMenuOpen(false)
    const supabase = createClient()
    await Promise.all([supabase.auth.signOut(), nextAuthSignOut({ redirect: false })])
    router.push('/login')
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4 lg:hidden"
      style={{
        background: 'var(--bg-sidebar)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
        aria-label="Menüyü aç"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#6B7280' }}>menu</span>
      </button>

      <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', letterSpacing: '-0.02em' }}>
        Marksio
      </span>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#6B7280' }}>more_vert</span>
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-1.5 w-48 rounded-xl overflow-hidden z-50"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}
          >
            <Link href="/settings" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors"
              style={{ color: 'var(--text-1)', fontSize: 13 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-2)' }}>person</span>
              Profil &amp; Ayarlar
            </Link>
            <button onClick={() => { setMenuOpen(false); openSettingsDrawer() }}
              className="flex items-center gap-3 px-4 py-2.5 w-full text-left transition-colors"
              style={{ color: 'var(--text-1)', fontSize: 13 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-2)' }}>tune</span>
              Entegrasyonlar
            </button>
            <Link href="/plans" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors"
              style={{ color: 'var(--text-1)', fontSize: 13 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-2)' }}>credit_card</span>
              Plan &amp; Faturalama
            </Link>
            <div style={{ height: 1, background: 'var(--border)' }} />
            <button onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2.5 w-full text-left transition-colors"
              style={{ color: 'var(--red)', fontSize: 13 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--red-soft)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--red)' }}>logout</span>
              Çıkış Yap
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AuthGuard() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then((data: { onboarded?: boolean }) => {
        if (data.onboarded === false) router.replace('/onboarding')
      })
      .catch(() => {})
  }, [pathname, router])

  return null
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { open, setOpen, collapsed } = useSidebar()

  return (
    <div className="flex min-h-screen relative overflow-x-hidden" style={{ background: 'var(--bg-app)' }}>
      {open && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      <AuthGuard />
      <Sidebar />
      <MobileHeader />

      <main
        className={`relative z-10 flex-1 min-h-screen flex flex-col transition-all duration-200 pt-14 lg:pt-0 w-full overflow-x-hidden ${collapsed ? 'lg:ml-[58px]' : 'lg:ml-[220px]'}`}
        style={{ background: 'var(--bg-app)' }}
      >
        {children}
      </main>

      <SettingsDrawer />
      <ChatWidget />
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SettingsDrawerProvider>
        <AppShellInner>{children}</AppShellInner>
      </SettingsDrawerProvider>
    </SidebarProvider>
  )
}
