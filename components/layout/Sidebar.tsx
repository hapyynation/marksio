'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSidebar } from '@/lib/sidebar-context'
import { createClient } from '@/lib/supabase/client'
import { signOut as nextAuthSignOut } from 'next-auth/react'
import { useTheme } from '@/components/providers/ThemeProvider'

type NavItem = {
  href: string
  icon: string
  label: string
  exact?: boolean
  children?: NavItem[]
}

const NAV: NavItem[] = [
  { href: '/dashboard', icon: 'space_dashboard', label: 'Dashboard', exact: true },
  {
    href: '/email', icon: 'mail', label: 'Email',
    children: [
      { href: '/email/broadcasts', icon: 'send', label: 'Broadcasts' },
      { href: '/email/subscribers', icon: 'group', label: 'Aboneler' },
      { href: '/email/templates', icon: 'description', label: 'Şablonlar' },
      { href: '/email/ab-test', icon: 'science', label: 'A/B Test' },
      { href: '/email/domains', icon: 'dns', label: 'Domain' },
      { href: '/email/health', icon: 'monitor_heart', label: 'Sağlık' },
    ],
  },
  { href: '/campaigns', icon: 'campaign', label: 'Kampanyalar' },
  { href: '/automations', icon: 'account_tree', label: 'Otomasyonlar' },
  { href: '/customers', icon: 'group', label: 'Müşteriler' },
  { href: '/segments', icon: 'workspaces', label: 'Segmentler' },
  { href: '/analytics', icon: 'bar_chart', label: 'Analitik' },
  {
    href: '/whatsapp', icon: 'chat_bubble', label: 'WhatsApp',
    children: [
      { href: '/whatsapp/connection', icon: 'link', label: 'Bağlantı' },
      { href: '/whatsapp/broadcasts', icon: 'send', label: 'Broadcasts' },
      { href: '/whatsapp/subscribers', icon: 'group', label: 'Aboneler' },
      { href: '/whatsapp/templates', icon: 'description', label: 'Şablonlar' },
      { href: '/whatsapp/ab-test', icon: 'science', label: 'A/B Test' },
      { href: '/whatsapp/inbox', icon: 'inbox', label: 'Inbox' },
      { href: '/whatsapp/ai-assistant', icon: 'smart_toy', label: 'AI Asistan' },
      { href: '/whatsapp/health', icon: 'monitor_heart', label: 'Sağlık' },
    ],
  },
]

const BOTTOM_NAV: NavItem[] = [
  { href: '/plans', icon: 'credit_card', label: 'Plan' },
  { href: '/settings', icon: 'settings', label: 'Ayarlar' },
]

function isActive(href: string, pathname: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

function NavLink({
  item,
  collapsed,
  depth = 0,
}: {
  item: NavItem
  collapsed: boolean
  depth?: number
}) {
  const pathname = usePathname()
  const active = isActive(item.href, pathname, item.exact)
  const parentActive = item.children?.some(c => isActive(c.href, pathname)) ?? false
  const [open, setOpen] = useState(parentActive || active)

  useEffect(() => {
    if (item.children && (parentActive || isActive(item.href, pathname, item.exact))) {
      setOpen(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (item.children) {
    const anyChildActive = item.children.some(c => isActive(c.href, pathname))
    return (
      <div>
        <button
          onClick={() => !collapsed && setOpen(v => !v)}
          className="w-full flex items-center transition-colors duration-100 rounded-lg group"
          style={{
            padding: collapsed ? '8px' : '8px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? 0 : 8,
            background: anyChildActive && !open ? 'rgba(37,99,235,0.06)' : 'transparent',
            color: anyChildActive ? 'var(--text-1)' : 'var(--text-2)',
          }}
        >
          <span
            className="material-symbols-outlined flex-shrink-0 transition-colors"
            style={{ fontSize: 18, color: anyChildActive ? '#2563EB' : '#6B7280' }}
          >
            {item.icon}
          </span>
          {!collapsed && (
            <>
              <span style={{ fontSize: 13, fontWeight: anyChildActive ? 600 : 400, flex: 1, textAlign: 'left' }}>
                {item.label}
              </span>
              <span
                className="material-symbols-outlined flex-shrink-0 transition-transform duration-200"
                style={{ fontSize: 14, color: '#9CA3AF', transform: open ? 'rotate(180deg)' : 'none' }}
              >
                keyboard_arrow_down
              </span>
            </>
          )}
        </button>

        {!collapsed && (
          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ paddingLeft: 28, paddingTop: 2, paddingBottom: 2 }}>
                  {item.children.map(child => (
                    <NavLink key={child.href} item={child} collapsed={false} depth={depth + 1} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className="flex items-center transition-colors duration-100 rounded-lg relative"
      style={{
        padding: collapsed ? '8px' : depth > 0 ? '6px 10px' : '8px 10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 8,
        background: active ? 'rgba(37,99,235,0.08)' : 'transparent',
        color: active ? 'var(--text-1)' : 'var(--text-2)',
        fontWeight: active ? 600 : 400,
        textDecoration: 'none',
      }}
      title={collapsed ? item.label : undefined}
    >
      {active && !collapsed && depth === 0 && (
        <div style={{
          position: 'absolute', left: 0, top: '20%', bottom: '20%',
          width: 2, borderRadius: 1, background: '#2563EB',
        }} />
      )}
      <span
        className="material-symbols-outlined flex-shrink-0"
        style={{ fontSize: depth > 0 ? 15 : 18, color: active ? '#2563EB' : '#9CA3AF' }}
      >
        {item.icon}
      </span>
      {!collapsed && (
        <span style={{ fontSize: depth > 0 ? 12.5 : 13 }}>{item.label}</span>
      )}
    </Link>
  )
}

export default function Sidebar() {
  const { open, setOpen, collapsed, setCollapsed } = useSidebar()
  const { theme, toggle: toggleTheme } = useTheme()
  const router = useRouter()
  const [workspace, setWorkspace] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) setUserEmail(data.user.email)
    })
    fetch('/api/settings')
      .then(r => r.json())
      .then((d: { storeName?: string }) => { if (d?.storeName) setWorkspace(d.storeName) })
      .catch(() => {})
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await Promise.all([supabase.auth.signOut(), nextAuthSignOut({ redirect: false })])
    router.push('/login')
  }

  const inner = (
    <div
      className="flex flex-col h-full"
      style={{
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        width: collapsed ? 58 : 220,
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center flex-shrink-0"
        style={{
          height: 56,
          padding: collapsed ? '0 17px' : '0 14px',
          borderBottom: '1px solid var(--border)',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 8,
          overflow: 'hidden',
        }}
      >
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-lg font-black text-white"
          style={{ width: 26, height: 26, background: '#2563EB', fontSize: 12 }}
        >
          M
        </div>
        {!collapsed && (
          <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            Marksio
          </span>
        )}
      </div>

      {/* Workspace chip */}
      {!collapsed && (
        <div style={{ padding: '10px 12px 6px' }}>
          <div
            className="flex items-center gap-2 rounded-lg"
            style={{ padding: '7px 10px', background: 'var(--bg-hover)', border: '1px solid var(--border)' }}
          >
            <div
              className="flex-shrink-0 rounded-md flex items-center justify-center"
              style={{ width: 20, height: 20, background: '#DBEAFE', fontSize: 10, color: '#2563EB', fontWeight: 700 }}
            >
              {workspace ? workspace[0].toUpperCase() : 'M'}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {workspace ?? 'Mağaza Bağla'}
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#9CA3AF' }}>unfold_more</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: collapsed ? '8px 6px' : '8px 8px' }}>
        <div className="flex flex-col gap-0.5">
          {NAV.map(item => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div style={{ padding: collapsed ? '8px 6px' : '8px 8px', borderTop: '1px solid var(--border)' }}>
        <div className="flex flex-col gap-0.5 mb-2">
          {BOTTOM_NAV.map(item => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>

        {/* User row */}
        <div
          className="flex items-center rounded-lg"
          style={{
            padding: collapsed ? '8px' : '8px 10px',
            gap: 8,
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'var(--surface-2)',
          }}
        >
          <div
            className="flex-shrink-0 rounded-full flex items-center justify-center font-semibold"
            style={{ width: 26, height: 26, background: '#DBEAFE', color: '#2563EB', fontSize: 11 }}
          >
            {userEmail ? userEmail[0].toUpperCase() : 'U'}
          </div>
          {collapsed ? (
            <button
              onClick={toggleTheme}
              className="rounded-md flex items-center justify-center transition-colors"
              style={{ width: 24, height: 24, flexShrink: 0 }}
              title={theme === 'light' ? 'Karanlık Mod' : 'Aydınlık Mod'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#9CA3AF' }}>
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userEmail ?? 'Kullanıcı'}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="rounded-md flex items-center justify-center transition-colors hover:bg-gray-100"
                style={{ width: 24, height: 24, flexShrink: 0 }}
                title={theme === 'light' ? 'Karanlık Mod' : 'Aydınlık Mod'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#9CA3AF' }}>
                  {theme === 'light' ? 'dark_mode' : 'light_mode'}
                </span>
              </button>
              <button
                onClick={handleSignOut}
                className="rounded-md flex items-center justify-center transition-colors hover:bg-red-50"
                style={{ width: 24, height: 24, flexShrink: 0 }}
                title="Çıkış Yap"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#9CA3AF' }}>logout</span>
              </button>
            </>
          )}
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center mt-2 w-full rounded-lg transition-colors hover:bg-gray-50"
          style={{ height: 30, border: '1px solid var(--border)' }}
          title={collapsed ? 'Genişlet' : 'Daralt'}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14, color: '#9CA3AF', transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            chevron_left
          </span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop — animated width */}
      <motion.div
        className="hidden lg:block fixed top-0 left-0 bottom-0 z-30"
        animate={{ width: collapsed ? 58 : 220 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}
      >
        {inner}
      </motion.div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.3)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="fixed top-0 left-0 bottom-0 z-30 lg:hidden"
              style={{ width: 220 }}
            >
              {inner}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
