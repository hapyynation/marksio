'use client'

import { useSession } from '@/lib/hooks/use-session'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'
import { SettingsDrawerProvider } from '@/lib/settings-drawer-context'
import Sidebar from './Sidebar'
import SettingsDrawer from '@/components/settings/SettingsDrawer'
import ChatWidget from '@/components/ChatWidget'

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { open, setOpen, collapsed } = useSidebar()

  return (
    <div className="flex min-h-screen relative" style={{ background: 'var(--bg)' }}>
      {/* Very subtle ambient light — minimal, not distracting */}
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

      <Sidebar />

      <main className={`relative z-10 flex-1 min-h-screen flex flex-col transition-all duration-250 ${collapsed ? 'lg:ml-[58px]' : 'lg:ml-[220px]'}`}>
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
