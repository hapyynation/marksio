'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Megaphone, Zap, Users, BarChart3,
  Settings, Sparkles, ChevronRight, X, LogOut, PieChart, CreditCard,
  ChevronsRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/sidebar-context'
import { signOut, useSession } from 'next-auth/react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Kampanyalar', icon: Megaphone },
  { href: '/automations', label: 'Otomasyonlar', icon: Zap },
  { href: '/customers', label: 'Müşteriler', icon: Users },
  { href: '/segments', label: 'Segmentler', icon: PieChart },
  { href: '/analytics', label: 'Analitik', icon: BarChart3 },
  { href: '/plans', label: 'Planlar', icon: CreditCard },
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

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 bg-[#0a0a0a] border-r border-[#1e1e1e] flex flex-col z-30 transition-all duration-300',
      'lg:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      collapsed ? 'w-16' : 'w-56'
    )}>
      {/* Logo */}
      <div className="h-14 flex items-center px-3 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 shrink-0 rounded-lg bg-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-white tracking-tight truncate">Marksio</span>
          )}
        </div>
        <button onClick={() => setOpen(false)} className="lg:hidden text-gray-600 hover:text-gray-400 p-1 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Store pill */}
      {!collapsed && (
        <div className="mx-3 mt-4 mb-2 px-3 py-2.5 rounded-lg bg-[#111] border border-[#222] flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-300 leading-none truncate max-w-[110px]">
              {user?.storeName || 'Demo Mağaza'}
            </p>
            <p className="text-[11px] text-gray-600 mt-0.5">Shopify · TR</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-2" />
        </div>
      )}

      {collapsed && <div className="mt-4 mb-2 mx-auto w-2 h-2 rounded-full bg-emerald-500" />}

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                collapsed ? 'justify-center px-2' : '',
                active
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                  : 'text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-200'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-blue-400' : 'text-gray-600 group-hover:text-gray-400')} />
              {!collapsed && label}
              {!collapsed && active && <ChevronRight className="w-3 h-3 ml-auto text-blue-500/60" />}
            </Link>
          )
        })}
      </nav>

      {/* AI CTA */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <Link
            href="/campaigns/new"
            onClick={() => setOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            AI Kampanya Oluştur
          </Link>
        </div>
      )}

      {/* Settings + User */}
      <div className="border-t border-[#1e1e1e] px-2 py-3">
        <Link
          href="/settings"
          onClick={() => setOpen(false)}
          title={collapsed ? 'Ayarlar' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            collapsed ? 'justify-center px-2' : '',
            pathname === '/settings'
              ? 'bg-blue-600/10 text-blue-400'
              : 'text-gray-500 hover:bg-[#1a1a1a] hover:text-gray-200'
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && 'Ayarlar'}
        </Link>

        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center text-blue-300 text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-300 truncate">{user?.name || 'Kullanıcı'}</p>
              <p className="text-[11px] text-gray-600 truncate">Admin</p>
            </div>
            <button onClick={handleLogout} title="Çıkış yap" className="text-gray-600 hover:text-red-400 transition-colors p-1">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {collapsed && (
          <button onClick={handleLogout} title="Çıkış yap" className="flex items-center justify-center w-full py-2 text-gray-600 hover:text-red-400 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center border-t border-[#1e1e1e] py-3 text-gray-600 hover:text-gray-300 hover:bg-[#111] transition-colors"
      >
        <ChevronsRight className={cn('w-4 h-4 transition-transform duration-300', collapsed ? '' : 'rotate-180')} />
        {!collapsed && <span className="text-xs ml-2 font-medium">Küçült</span>}
      </button>
    </aside>
  )
}
