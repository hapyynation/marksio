'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context'
import Sidebar from './Sidebar'
import ChatWidget from '@/components/ChatWidget'
import { Sparkles } from 'lucide-react'

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { open, setOpen, collapsed } = useSidebar()

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {open && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}
      <Sidebar />
      <main className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-56'}`}>
        {children}
      </main>
      <ChatWidget />
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  // Unauthenticated ise redirect beklenirken hiçbir şey gösterme
  if (status === 'unauthenticated') return null

  return (
    <SidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  )
}
