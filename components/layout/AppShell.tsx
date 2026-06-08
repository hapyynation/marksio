'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'
import { SettingsDrawerProvider } from '@/lib/settings-drawer-context'
import Sidebar from './Sidebar'
import SettingsDrawer from '@/components/settings/SettingsDrawer'
import ChatWidget from '@/components/ChatWidget'
import Link from 'next/link'

const BOTTOM_NAV = [
  { href: '/dashboard',   icon: 'space_dashboard', label: 'Ana Sayfa'   },
  { href: '/campaigns',   icon: 'campaign',         label: 'Kampanyalar' },
  { href: '/automations', icon: 'bolt',             label: 'Otomasyon'   },
  { href: '/customers',   icon: 'group',            label: 'Müşteriler'  },
  { href: '/ai-studio',   icon: 'auto_awesome',     label: 'AI Stüdyo'   },
]

function MobileBottomNav() {
  const pathname = usePathname()
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch lg:hidden"
      style={{
        background: 'rgba(8,8,15,0.97)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {BOTTOM_NAV.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-all"
            style={{ color: active ? '#4470ff' : '#44445a', touchAction: 'manipulation' }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 22,
                fontVariationSettings: active ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 350",
              }}
            >
              {item.icon}
            </span>
            <span className="text-[9px] font-semibold leading-none">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function MobileHeader() {
  const { setOpen } = useSidebar()
  return (
    <div
      className="fixed top-0 left-0 right-0 h-14 z-40 flex items-center px-4 gap-3 lg:hidden"
      style={{
        background: 'rgba(8,8,15,0.97)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <button
        onClick={() => setOpen(true)}
        className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', touchAction: 'manipulation' }}
        aria-label="Menüyü aç"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#eeeef4' }}>menu</span>
      </button>
      <span className="text-[15px] font-bold" style={{ color: '#eeeef4', letterSpacing: '-0.025em' }}>Marksio</span>
    </div>
  )
}

function AuthGuard() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then((data: { emailVerified?: boolean; onboarded?: boolean }) => {
        if (data.emailVerified === false) {
          router.replace('/verify-email')
        } else if (data.onboarded === false) {
          router.replace('/onboarding')
        }
      })
      .catch(() => {/* network error — don't block */})
  }, [pathname, router])

  return null
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { open, setOpen, collapsed } = useSidebar()

  return (
    <div className="flex min-h-screen relative overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      {/* Ambient light */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[400px] opacity-40"
          style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(68,112,255,0.04) 0%, transparent 70%)' }} />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)} />
      )}

      <AuthGuard />
      <Sidebar />
      <MobileHeader />

      {/* pt-14 on mobile offsets the fixed mobile header; pb-16 offsets the bottom nav */}
      <main className={`relative z-10 flex-1 min-h-screen flex flex-col transition-all duration-250 pt-14 lg:pt-0 pb-16 lg:pb-0 ${collapsed ? 'lg:ml-[58px]' : 'lg:ml-[220px]'}`}>
        {children}
      </main>

      <MobileBottomNav />
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
