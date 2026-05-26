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
    <div className="flex min-h-screen bg-[#10131c] relative overflow-hidden">
      {/* Ambient background light leaks */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] bg-[#b3c5ff]/[0.04] rounded-full blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[50%] h-[50%] bg-[#d0bcff]/[0.03] rounded-full blur-[100px]" />
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}
      <Sidebar />
      <main className={`relative z-10 flex-1 min-h-screen flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[60px]' : 'lg:ml-[220px]'}`}>
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
