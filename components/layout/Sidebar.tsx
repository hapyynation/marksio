'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/sidebar-context'
import { signOut, useSession } from 'next-auth/react'

const NAV_MAIN = [
  { href: '/dashboard',   label: 'Dashboard',     icon: 'space_dashboard' },
  { href: '/campaigns',   label: 'Kampanyalar',    icon: 'campaign' },
  { href: '/automations', label: 'Otomasyonlar',   icon: 'bolt' },
  { href: '/customers',   label: 'Müşteriler',     icon: 'group' },
  { href: '/segments',    label: 'Segmentler',     icon: 'donut_small' },
  { href: '/analytics',   label: 'Analitik',       icon: 'bar_chart_4_bars' },
  { href: '/whatsapp',    label: 'WhatsApp AI',    icon: 'smart_toy' },
]

const NAV_BOTTOM = [
  { href: '/plans',    label: 'Planlar',  icon: 'credit_card' },
  { href: '/settings', label: 'Ayarlar',  icon: 'settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { open, setOpen, collapsed, setCollapsed } = useSidebar()
  const { data: session } = useSession()

  const user = session?.user as { name?: string; storeName?: string }
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MA'

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 flex flex-col z-30 transition-all duration-250 ease-in-out',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'w-[58px]' : 'w-[220px]',
      )} style={{
        background: '#0b0b14',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>

        {/* ── Logo / Brand ── */}
        <div className={cn(
          'h-14 flex items-center shrink-0',
          'border-b',
          collapsed ? 'justify-center' : 'px-4 gap-3',
        )} style={{ borderColor: 'rgba(255,255,255,0.05)' }}>

          {!collapsed && (
            <>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--blue)', boxShadow: '0 2px 8px rgba(68,112,255,0.3)' }}>
                <span className="material-symbols-outlined icon-fill text-white" style={{ fontSize: 14 }}>
                  auto_awesome
                </span>
              </div>
              <span className="text-[14px] font-bold tracking-tight flex-1"
                style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>
                Marksio
              </span>
              <button onClick={() => setOpen(false)} className="lg:hidden p-1 rounded-md"
                style={{ color: 'var(--text-2)' }}>
                <X className="w-4 h-4" />
              </button>
            </>
          )}

          {collapsed && (
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--blue)', boxShadow: '0 2px 8px rgba(68,112,255,0.3)' }}>
              <span className="material-symbols-outlined icon-fill text-white" style={{ fontSize: 14 }}>
                auto_awesome
              </span>
            </div>
          )}
        </div>

        {/* ── Store chip ── */}
        {!collapsed && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-lg flex items-center gap-2.5 cursor-pointer group"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ background: 'rgba(68,112,255,0.12)', border: '1px solid rgba(68,112,255,0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--blue)' }}>
                storefront
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium truncate" style={{ color: '#eeeef4' }}>
                {user?.storeName || 'Demo Mağaza'}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-2)' }}>Shopify</p>
            </div>
            <div className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: 'var(--green)', boxShadow: '0 0 5px rgba(34,201,122,0.5)' }} />
          </div>
        )}

        {/* ── Main Navigation ── */}
        <nav className={cn('flex-1 overflow-y-auto py-3 space-y-0.5', collapsed ? 'px-1.5' : 'px-2')}>
          {NAV_MAIN.map(({ href, label, icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href}
                onClick={() => setOpen(false)}
                title={collapsed ? label : undefined}
                className={cn(
                  'relative flex items-center rounded-lg text-[13px] font-medium transition-all duration-150',
                  collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2',
                  active
                    ? 'text-[#eeeef4]'
                    : 'hover:bg-white/[0.04]',
                )}
                style={active ? {
                  background: 'rgba(68,112,255,0.1)',
                  color: '#eeeef4',
                } : { color: 'var(--text-2)' }}
              >
                {/* Active left indicator */}
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
                    style={{ background: 'var(--blue)' }} />
                )}
                <span className="material-symbols-outlined shrink-0"
                  style={{
                    fontSize: 17,
                    color: active ? 'var(--blue)' : 'var(--text-2)',
                    fontVariationSettings: active
                      ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                      : "'FILL' 0, 'wght' 350, 'GRAD' 0, 'opsz' 24",
                  }}>
                  {icon}
                </span>
                {!collapsed && label}
              </Link>
            )
          })}
        </nav>

        {/* ── Bottom Nav ── */}
        <div className={cn('py-2 space-y-0.5', collapsed ? 'px-1.5' : 'px-2')}
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {NAV_BOTTOM.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                onClick={() => setOpen(false)}
                title={collapsed ? label : undefined}
                className={cn(
                  'relative flex items-center rounded-lg text-[13px] font-medium transition-all duration-150',
                  collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2',
                  active ? 'text-[#eeeef4]' : 'hover:bg-white/[0.04]',
                )}
                style={active
                  ? { background: 'rgba(68,112,255,0.1)', color: '#eeeef4' }
                  : { color: 'var(--text-2)' }}
              >
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
                    style={{ background: 'var(--blue)' }} />
                )}
                <span className="material-symbols-outlined shrink-0"
                  style={{
                    fontSize: 17,
                    color: active ? 'var(--blue)' : 'var(--text-2)',
                    fontVariationSettings: active
                      ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                      : "'FILL' 0, 'wght' 350, 'GRAD' 0, 'opsz' 24",
                  }}>
                  {icon}
                </span>
                {!collapsed && label}
              </Link>
            )
          })}
        </div>

        {/* ── User ── */}
        <div className={cn('p-2', collapsed ? '' : 'px-2')}
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg group">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{
                  background: 'rgba(68,112,255,0.15)',
                  border: '1px solid rgba(68,112,255,0.25)',
                  color: '#99b4ff',
                }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold truncate" style={{ color: '#eeeef4' }}>
                  {user?.name || 'Kullanıcı'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-2)' }}>Admin</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                title="Çıkış yap"
                className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                style={{ color: 'var(--text-2)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              title="Çıkış yap"
              className="flex items-center justify-center w-full p-2.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-2)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── Collapse toggle ── */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center gap-2 py-2.5 text-[12px] font-medium transition-all"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            color: 'var(--text-2)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#eeeef4')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <><ChevronLeft className="w-3.5 h-3.5" /> <span>Küçült</span></>
          }
        </button>
      </aside>
    </>
  )
}
