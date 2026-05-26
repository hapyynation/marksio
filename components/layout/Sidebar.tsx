'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, X, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/sidebar-context'
import { signOut, useSession } from 'next-auth/react'

const nav = [
  { href: '/dashboard',   label: 'Dashboard',   icon: 'dashboard' },
  { href: '/campaigns',   label: 'Kampanyalar',  icon: 'campaign' },
  { href: '/automations', label: 'Otomasyonlar', icon: 'bolt' },
  { href: '/customers',   label: 'Müşteriler',   icon: 'group' },
  { href: '/segments',    label: 'Segmentler',   icon: 'pie_chart' },
  { href: '/analytics',   label: 'Analitik',     icon: 'bar_chart' },
  { href: '/plans',       label: 'Planlar',      icon: 'credit_card' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { open, setOpen, collapsed, setCollapsed } = useSidebar()
  const { data: session } = useSession()

  const user = session?.user as { name?: string; storeName?: string }
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'YE'

  async function handleLogout() {
    await signOut({ callbackUrl: '/login' })
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setOpen(false)} />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 flex flex-col z-30 transition-all duration-300 ease-in-out',
        'border-r border-white/[0.05]',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'w-[60px]' : 'w-[220px]'
      )} style={{ background: '#1c1b1b' }}>

        {/* Logo */}
        <div className={cn(
          'h-16 flex items-center border-b border-white/[0.05]',
          collapsed ? 'justify-center px-2' : 'px-5 gap-3'
        )}>
          <div className="relative w-8 h-8 shrink-0 rounded-xl flex items-center justify-center overflow-hidden btn-gradient">
            <span className="material-symbols-outlined icon-fill text-white" style={{ fontSize: 16 }}>auto_awesome</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <span className="text-sm font-black" style={{ color: '#e5e2e1', fontFamily: 'Inter, sans-serif' }}>Marksio</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
                <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#8c90a1' }}>Pro Plan</span>
              </div>
            </div>
          )}
          <button onClick={() => setOpen(false)} className="lg:hidden p-1 rounded-lg" style={{ color: '#8c90a1' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Store pill */}
        {!collapsed && (
          <div className="mx-3 mt-3 mb-1 px-3 py-2.5 rounded-xl flex items-center gap-2.5"
            style={{ background: '#131313', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(0,241,254,0.08)', border: '1px solid rgba(0,241,254,0.15)' }}>
              <span className="material-symbols-outlined icon-fill" style={{ fontSize: 14, color: '#00f1fe' }}>storefront</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold truncate max-w-[90px]" style={{ color: '#e5e2e1' }}>
                {user?.storeName || 'Demo Mağaza'}
              </p>
              <p className="text-[9px] uppercase tracking-wider" style={{ color: '#8c90a1' }}>Shopify · TR</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
              style={{ boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)} title={collapsed ? label : undefined}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200',
                  collapsed && 'justify-center px-2',
                  active ? 'text-[#00f1fe]' : 'text-[#8c90a1] hover:bg-white/[0.03] hover:text-[#c4c8d4]',
                )}
                style={active ? {
                  background: 'rgba(0,241,254,0.06)',
                  borderRight: '2px solid #00f1fe',
                  boxShadow: 'inset 0 0 20px rgba(0,241,254,0.04), 0 0 15px rgba(180,197,255,0.08)',
                } : undefined}
              >
                <span className={cn('material-symbols-outlined shrink-0', active && 'icon-fill')}
                  style={{
                    fontSize: 18,
                    color: active ? '#00f1fe' : '#8c90a1',
                    textShadow: active ? '0 0 10px rgba(0,241,254,0.5)' : 'none',
                  }}>
                  {icon}
                </span>
                {!collapsed && label}
              </Link>
            )
          })}
        </nav>

        {/* AI Copilot CTA */}
        {!collapsed && (
          <div className="px-3 pb-3">
            <Link href="/campaigns/new" onClick={() => setOpen(false)}
              className="btn-gradient w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white shadow-[0_0_15px_rgba(0,241,254,0.12)]">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>smart_toy</span>
              AI Kampanya
            </Link>
          </div>
        )}
        {collapsed && (
          <div className="px-2 pb-3">
            <Link href="/campaigns/new" title="AI Kampanya"
              className="btn-gradient w-full flex items-center justify-center py-3 rounded-xl text-white">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>smart_toy</span>
            </Link>
          </div>
        )}

        {/* Settings + User */}
        <div className="px-2 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/settings" onClick={() => setOpen(false)} title={collapsed ? 'Ayarlar' : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
              collapsed && 'justify-center px-2',
              pathname === '/settings' ? 'text-[#00f1fe]' : 'text-[#8c90a1] hover:bg-white/[0.03] hover:text-[#c4c8d4]'
            )}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings</span>
            {!collapsed && 'Ayarlar'}
          </Link>

          {!collapsed && (
            <div className="flex items-center gap-2.5 px-3 py-2 mt-0.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{ background: 'rgba(0,241,254,0.08)', border: '1px solid rgba(0,241,254,0.15)', color: '#00f1fe' }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: '#e5e2e1' }}>{user?.name || 'Kullanıcı'}</p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: '#8c90a1' }}>Admin</p>
              </div>
              <button onClick={handleLogout} title="Çıkış"
                className="p-1.5 rounded-lg transition-colors text-[#8c90a1] hover:text-red-400 hover:bg-red-500/[0.08]">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {collapsed && (
            <button onClick={handleLogout} title="Çıkış"
              className="flex items-center justify-center w-full py-2 mt-0.5 rounded-lg transition-colors"
              style={{ color: '#8c90a1' }}>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center py-3 text-xs font-semibold gap-1.5 transition-all text-[#8c90a1] hover:text-[#e5e2e1] hover:bg-white/[0.02]"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <ChevronsRight className={cn('w-3.5 h-3.5 transition-transform duration-300', collapsed ? '' : 'rotate-180')} />
          {!collapsed && 'Küçült'}
        </button>
      </aside>
    </>
  )
}
