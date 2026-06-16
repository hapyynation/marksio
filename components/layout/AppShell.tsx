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

// ─── Mobile Header ─────────────────────────────────────────────────────────────
function MobileHeader() {
  const { setOpen } = useSidebar()
  const { open: openSettingsDrawer } = useSettingsDrawer()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!menuOpen) return
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
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
        background: 'rgba(8,8,15,0.97)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Hamburger — opens full-screen sidebar overlay */}
      <button
        onClick={() => setOpen(true)}
        className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', touchAction: 'manipulation' }}
        aria-label="Menüyü aç"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#eeeef4' }}>menu</span>
      </button>

      {/* Logo — center */}
      <span style={{ fontSize: 15, fontWeight: 700, color: '#eeeef4', letterSpacing: '-0.025em' }}>
        Marksio
      </span>

      {/* 3-dots menu — always visible */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
          style={{
            background: menuOpen ? 'rgba(68,112,255,0.12)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${menuOpen ? 'rgba(68,112,255,0.3)' : 'rgba(255,255,255,0.09)'}`,
            touchAction: 'manipulation',
          }}
          aria-label="Daha fazla"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#eeeef4' }}>more_vert</span>
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden"
            style={{
              background: '#0f0f1a',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
              zIndex: 60,
            }}
          >
            <Link
              href="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3"
              style={{ color: '#c8c8e0', fontSize: 14 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17, color: '#8080a0' }}>person</span>
              Profil &amp; Ayarlar
            </Link>
            <button
              onClick={() => { setMenuOpen(false); openSettingsDrawer() }}
              className="flex items-center gap-3 px-4 py-3 w-full text-left"
              style={{ color: '#c8c8e0', fontSize: 14 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17, color: '#8080a0' }}>tune</span>
              Entegrasyonlar
            </button>
            <Link
              href="/plans"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3"
              style={{ color: '#c8c8e0', fontSize: 14 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17, color: '#8080a0' }}>credit_card</span>
              Plan &amp; Faturalama
            </Link>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 w-full text-left"
              style={{ color: '#e84545', fontSize: 14 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17, color: '#e84545' }}>logout</span>
              Çıkış Yap
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Auth Guard ────────────────────────────────────────────────────────────────
function AuthGuard() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then((data: { onboarded?: boolean }) => {
        if (data.onboarded === false) {
          router.replace('/onboarding')
        }
      })
      .catch(() => {/* network error — don't block */})
  }, [pathname, router])

  return null
}

// ─── Shell Inner ───────────────────────────────────────────────────────────────
function AppShellInner({ children }: { children: React.ReactNode }) {
  const { open, setOpen, collapsed } = useSidebar()

  return (
    <div className="flex min-h-screen relative overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      {/* Ambient light */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[400px] opacity-40"
          style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(68,112,255,0.04) 0%, transparent 70%)' }} />
      </div>

      {/* Mobile sidebar overlay — closes on backdrop tap */}
      {open && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      <AuthGuard />
      <Sidebar />
      <MobileHeader />

      {/* pt-14 on mobile offsets the fixed header; no bottom padding (bottom nav removed) */}
      <main className={`relative z-10 flex-1 min-h-screen flex flex-col transition-all duration-250 pt-14 lg:pt-0 w-full overflow-x-hidden ${collapsed ? 'lg:ml-[58px]' : 'lg:ml-[220px]'}`}>
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
