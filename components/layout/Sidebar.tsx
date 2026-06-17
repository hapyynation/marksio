'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { LogOut, ChevronLeft, ChevronRight, X, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/sidebar-context'
import { useSession } from '@/lib/hooks/use-session'
import { createClient } from '@/lib/supabase/client'
import { signOut as nextAuthSignOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useSettingsDrawer } from '@/lib/settings-drawer-context'

interface NavItem {
  href: string
  label: string
  icon: string
  badge?: number
  badgeVariant?: 'blue' | 'green' | 'amber' | 'red'
  onClick?: () => void
}

const NAV_CORE: NavItem[] = [
  { href: '/dashboard',   label: 'Dashboard',     icon: 'space_dashboard' },
  { href: '/campaigns',   label: 'Kampanyalar',    icon: 'campaign' },
  { href: '/automations', label: 'Otomasyonlar',   icon: 'bolt' },
  { href: '/live',        label: 'Canlı Takip',    icon: 'radio_button_checked' },
  { href: '/customers',   label: 'Müşteriler',     icon: 'group' },
  { href: '/segments',    label: 'Segmentler',     icon: 'donut_small' },
  { href: '/analytics',   label: 'Analitik',       icon: 'bar_chart_4_bars' },
]

const NAV_AI: NavItem[] = [
  { href: '/whatsapp', label: 'WhatsApp AI', icon: 'smart_toy' },
]

const NAV_BOTTOM: NavItem[] = [
  { href: '/plans',    label: 'Planlar',  icon: 'credit_card' },
  { href: '/settings', label: 'Ayarlar',  icon: 'settings' },
]

const BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  blue:  { bg: 'rgba(68,112,255,0.2)',  text: '#99b4ff' },
  green: { bg: 'rgba(34,201,122,0.2)',  text: '#22c97a' },
  amber: { bg: 'rgba(240,160,32,0.2)',  text: '#f0a020' },
  red:   { bg: 'rgba(232,69,69,0.2)',   text: '#e84545' },
}

const labelVariants = {
  show: { opacity: 1, x: 0, transition: { duration: 0.12, delay: 0.06 } },
  hide: { opacity: 0, x: -6, transition: { duration: 0.08 } },
}

function NavLink({
  item,
  expanded,
  onNavigate,
}: {
  item: NavItem
  expanded: boolean
  onNavigate: () => void
}) {
  const pathname = usePathname()
  const active = pathname === item.href || pathname.startsWith(item.href + '/')
  const badge = item.badge
  const badgeStyle = badge && badge > 0 ? BADGE_STYLES[item.badgeVariant ?? 'blue'] : null

  const sharedClass = cn(
    'relative flex items-center rounded-lg text-[13px] font-medium transition-colors duration-150 overflow-hidden w-full',
    expanded ? 'gap-2.5 px-2.5 py-[7px]' : 'justify-center p-[9px]',
    !active && 'hover:bg-white/[0.04]',
  )
  const sharedStyle = active
    ? { background: 'rgba(68,112,255,0.1)', color: '#eeeef4' }
    : { color: 'var(--text-2)' }

  const inner = (
    <>
      {active && expanded && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
          style={{ background: 'var(--blue)' }} />
      )}
      <span
        className="material-symbols-outlined shrink-0"
        style={{
          fontSize: 17,
          color: active ? 'var(--blue)' : 'var(--text-2)',
          fontVariationSettings: active
            ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
            : "'FILL' 0, 'wght' 350, 'GRAD' 0, 'opsz' 24",
        }}
      >
        {item.icon}
      </span>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.span key="label" variants={labelVariants} initial="hide" animate="show" exit="hide" className="flex-1 truncate">
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {expanded && badgeStyle && badge && badge > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 min-w-[18px] text-center"
          style={{ background: badgeStyle.bg, color: badgeStyle.text }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {!expanded && badgeStyle && badge && badge > 0 && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
          style={{ background: badgeStyle.text }} />
      )}
    </>
  )

  if (item.onClick) {
    return (
      <button
        onClick={() => { item.onClick!(); onNavigate() }}
        title={!expanded ? item.label : undefined}
        className={sharedClass}
        style={sharedStyle}
      >
        {inner}
      </button>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={!expanded ? item.label : undefined}
      className={sharedClass}
      style={sharedStyle}
    >
      {inner}
    </Link>
  )
}

interface StoreInfo {
  name: string
  platform: string
  connected: boolean
}

function formatStoreName(domain: string | null | undefined): string {
  if (!domain) return ''
  const base = domain.replace(/\.myshopify\.com$/i, '').replace(/\.com$/i, '').replace(/[-_]/g, ' ')
  return base.charAt(0).toUpperCase() + base.slice(1)
}

const PLATFORM_BADGE: Record<string, { label: string; color: string }> = {
  shopify:     { label: 'S', color: '#96bf48' },
  ikas:        { label: 'İ', color: '#f0a020' },
  woocommerce: { label: 'W', color: '#7f54b3' },
}

export default function Sidebar() {
  const { open, setOpen, collapsed, setCollapsed } = useSidebar()
  const { data: session } = useSession()
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const { open: openSettingsDrawer } = useSettingsDrawer()
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)

  useEffect(() => {
    fetch('/api/integrations')
      .then(r => r.json())
      .then((d: { integrations?: Array<{ platform: string; shopDomain?: string; status: string }> }) => {
        const active = (d.integrations ?? []).find(
          i => ['shopify', 'ikas', 'woocommerce'].includes(i.platform) && i.status === 'active'
        )
        if (active) {
          setStoreInfo({
            name: formatStoreName(active.shopDomain) || 'Mağazanız',
            platform: active.platform,
            connected: true,
          })
        } else {
          setStoreInfo({ name: '', platform: '', connected: false })
        }
      })
      .catch(() => setStoreInfo({ name: '', platform: '', connected: false }))
  }, [])

  const NAV_BOTTOM_DYNAMIC: NavItem[] = [
    { href: '/plans',    label: 'Planlar',  icon: 'credit_card' },
    { href: '/settings', label: 'Ayarlar',  icon: 'settings', onClick: () => { openSettingsDrawer(); setOpen(false) } },
  ]

  // Hover temporarily expands when in permanent-collapsed mode
  const isExpanded = !collapsed || hovered

  const handleSignOut = async () => {
    // Kill both session types: NextAuth JWT and legacy Supabase OTP sessions
    const supabase = createClient()
    await Promise.all([
      supabase.auth.signOut(),
      nextAuthSignOut({ redirect: false }),
    ])
    router.push('/login')
  }

  const user = session?.user as { name?: string; storeName?: string } | undefined
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'MA'

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      <motion.aside
        animate={{ width: isExpanded ? 220 : 58 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'fixed inset-y-0 left-0 flex flex-col z-30',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        style={{
          background: '#111827',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >

        {/* ── Brand ── */}
        <div
          className={cn('h-14 flex items-center shrink-0', isExpanded ? 'px-4 gap-2.5' : 'justify-center px-2')}
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <Image
            src="/marksio-logo.png"
            alt="Marksio"
            width={28}
            height={28}
            className="rounded-[8px] shrink-0"
            style={{ objectFit: 'contain' }}
          />
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.span
                key="brand"
                variants={labelVariants}
                initial="hide"
                animate="show"
                exit="hide"
                className="text-[14.5px] font-bold flex-1 truncate"
                style={{ color: '#eeeef4', letterSpacing: '-0.025em' }}
              >
                Marksio
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.button
                key="close-btn"
                variants={labelVariants}
                initial="hide"
                animate="show"
                exit="hide"
                onClick={() => setOpen(false)}
                className="lg:hidden p-1.5 rounded-md transition-colors hover:bg-white/[0.04] shrink-0"
                style={{ color: 'var(--text-2)' }}
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── Workspace chip ── */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto', transition: { duration: 0.15, delay: 0.04 } }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.1 } }}
              className="mx-3 mt-2.5 mb-1 overflow-hidden"
            >
              {storeInfo?.connected ? (
                <button
                  onClick={() => router.push('/settings?tab=integrations')}
                  className="w-full px-2.5 py-2 rounded-[9px] flex items-center gap-2 transition-all text-left"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.055)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.055)' }}
                >
                  <div
                    className="flex items-center justify-center shrink-0 rounded-md text-[10px] font-bold"
                    style={{
                      width: 22, height: 22,
                      background: `${PLATFORM_BADGE[storeInfo.platform]?.color ?? '#4470ff'}22`,
                      border: `1px solid ${PLATFORM_BADGE[storeInfo.platform]?.color ?? '#4470ff'}44`,
                      color: PLATFORM_BADGE[storeInfo.platform]?.color ?? '#4470ff',
                    }}
                  >
                    {PLATFORM_BADGE[storeInfo.platform]?.label ?? 'M'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] font-medium truncate leading-tight" style={{ color: '#dde2f0' }}>
                      {storeInfo.name}
                    </p>
                    <p className="text-[10px] leading-tight capitalize" style={{ color: 'var(--text-3)' }}>
                      {storeInfo.platform}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--green)', boxShadow: '0 0 4px rgba(34,201,122,0.5)' }} />
                  </div>
                </button>
              ) : storeInfo !== null ? (
                <button
                  onClick={() => router.push('/settings?tab=integrations')}
                  className="w-full px-2.5 py-2 rounded-[9px] flex items-center gap-2 transition-all text-left"
                  style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(68,112,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(68,112,255,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)' }}
                >
                  <div
                    className="flex items-center justify-center shrink-0 rounded-md"
                    style={{ width: 22, height: 22, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      add
                    </span>
                  </div>
                  <p className="text-[11.5px] font-medium truncate leading-tight flex-1" style={{ color: 'var(--text-3)' }}>
                    Mağaza Bağla
                  </p>
                </button>
              ) : (
                <div className="px-2.5 py-2 rounded-[9px]" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="h-3 w-24 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main navigation ── */}
        <nav className={cn('flex-1 overflow-y-auto no-scrollbar', isExpanded ? 'px-2 pb-2' : 'px-[7px] py-2')}>
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div key="core-label" variants={labelVariants} initial="hide" animate="show" exit="hide"
                className="px-2 pt-3 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--text-3)' }}>Menü</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="space-y-0.5">
            {NAV_CORE.map(item => (
              <NavLink key={item.href} item={item} expanded={isExpanded} onNavigate={() => setOpen(false)} />
            ))}
          </div>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div key="ai-label" variants={labelVariants} initial="hide" animate="show" exit="hide"
                className="px-2 pt-4 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--text-3)' }}>AI</span>
              </motion.div>
            )}
          </AnimatePresence>
          {!isExpanded && <div className="my-2 mx-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />}
          <div className="space-y-0.5">
            {NAV_AI.map(item => (
              <NavLink key={item.href} item={item} expanded={isExpanded} onNavigate={() => setOpen(false)} />
            ))}
          </div>
        </nav>

        {/* ── Bottom nav ── */}
        <div
          className={cn('py-2 space-y-0.5', isExpanded ? 'px-2' : 'px-[7px]')}
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          {NAV_BOTTOM_DYNAMIC.map(item => (
            <NavLink key={item.href} item={item} expanded={isExpanded} onNavigate={() => setOpen(false)} />
          ))}
        </div>

        {/* ── User ── */}
        <div className="p-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {isExpanded ? (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg group cursor-pointer transition-all hover:bg-white/[0.03]">
              <div
                className="flex items-center justify-center shrink-0 rounded-full text-[11px] font-bold"
                style={{ width: 26, height: 26, background: 'rgba(68,112,255,0.14)', border: '1px solid rgba(68,112,255,0.24)', color: '#99b4ff' }}
              >
                {initials}
              </div>
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div key="user-info" variants={labelVariants} initial="hide" animate="show" exit="hide"
                    className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate leading-tight" style={{ color: '#eeeef4' }}>
                      {user?.name ?? 'Kullanıcı'}
                    </p>
                    <p className="text-[10px] leading-tight" style={{ color: 'var(--text-3)' }}>Admin</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={handleSignOut}
                title="Çıkış yap"
                className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10"
                style={{ color: 'var(--text-2)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignOut}
              title="Çıkış yap"
              className="flex items-center justify-center w-full p-[9px] rounded-lg transition-colors hover:bg-red-500/10"
              style={{ color: 'var(--text-2)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── Collapse toggle ── */}
        <button
          onClick={() => { setCollapsed(!collapsed); setHovered(false) }}
          className="hidden lg:flex items-center justify-center gap-2 py-2 text-[11px] font-medium transition-all hover:bg-white/[0.03]"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-3)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <><ChevronLeft className="w-3.5 h-3.5" /><span>Küçült</span></>}
        </button>
      </motion.aside>
    </>
  )
}
