'use client'

import { cn } from '@/lib/utils'
import { cardBase, cardHover, accents, statusColor, statusLabel, colors, type AccentKey } from '@/lib/ds'
import { ArrowUpRight, ArrowDownRight, ChevronRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

/* ────────────────────────────────────────────────
   MCard — standard card shell (Mantis MainCard)
──────────────────────────────────────────────── */
export function MCard({
  children, className, style, hover = false, onClick,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  hover?: boolean
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      className={cn('rounded-lg overflow-hidden', className, hover || onClick ? 'cursor-pointer' : '')}
      style={{
        ...cardBase,
        transition: 'all 0.15s',
        ...(hovered && hover ? cardHover : {}),
        ...style,
      }}
      onMouseEnter={() => (hover || onClick) && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

/* ────────────────────────────────────────────────
   MCardHeader — card header with Mantis divider
──────────────────────────────────────────────── */
export function MCardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-4', className)} style={{ borderBottom: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

/* ────────────────────────────────────────────────
   MSectionHeader — section title + optional link
──────────────────────────────────────────────── */
export function MSectionHeader({
  title, sub, href, hrefLabel = 'Tümü', action,
}: {
  title: string
  sub?: string
  href?: string
  hrefLabel?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>{title}</h2>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</p>}
      </div>
      {action ?? (href && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-[11px] font-medium transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          {hrefLabel} <ChevronRight className="w-3 h-3" />
        </Link>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────
   MKpiCard — Mantis AnalyticEcommerce style
──────────────────────────────────────────────── */
export function MKpiCard({
  label, value, sub, icon: Icon, accent = 'blue', change, className,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: AccentKey
  change?: number
  className?: string
}) {
  const a = accents[accent]
  const [hovered, setHovered] = useState(false)
  const positive = (change ?? 0) >= 0

  return (
    <div
      className={cn('relative rounded-lg p-5 overflow-hidden cursor-default', className)}
      style={{ ...cardBase, transition: 'all .15s', ...(hovered ? cardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-medium" style={{ color: 'var(--text-2)' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: a.bg }}>
          <Icon className="w-4 h-4" style={{ color: a.color }} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <p className="text-[26px] font-bold leading-none" style={{ color: 'var(--text-1)', letterSpacing: '-0.025em' }}>
          {value}
        </p>
        {change !== undefined && change !== 0 && (
          <span
            className={cn('inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full')}
            style={{
              color: positive ? 'var(--success)' : 'var(--danger)',
              background: positive ? 'var(--success-soft)' : 'var(--danger-soft)',
            }}
          >
            {positive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            %{Math.abs(change).toFixed(1)}
          </span>
        )}
      </div>

      {sub && <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{sub}</p>}
    </div>
  )
}

/* ────────────────────────────────────────────────
   MBadge — status/type badge
──────────────────────────────────────────────── */
export function MBadge({
  label, accent, status, dot = false, className,
}: {
  label?: string
  accent?: AccentKey
  status?: string
  dot?: boolean
  className?: string
}) {
  const resolvedLabel = label ?? (status ? statusLabel(status) : '')
  const color = accent ? accents[accent].color : (status ? statusColor(status) : 'var(--text-2)')
  const bg    = accent ? accents[accent].bg    : `color-mix(in srgb, ${color} 10%, transparent)`
  const border = accent ? accents[accent].border : `color-mix(in srgb, ${color} 20%, transparent)`

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', className)}
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />}
      {resolvedLabel}
    </span>
  )
}

/* ────────────────────────────────────────────────
   MEmptyState — consistent empty states
──────────────────────────────────────────────── */
export function MEmptyState({
  icon: Icon, title, sub, action, actionHref,
}: {
  icon: React.ElementType
  title: string
  sub?: string
  action?: string
  actionHref?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <Icon className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
      </div>
      <div className="text-center">
        <p className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>{title}</p>
        {sub && <p className="text-[12px] mt-1" style={{ color: 'var(--text-3)' }}>{sub}</p>}
      </div>
      {action && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
          style={{ color: 'var(--primary)' }}
        >
          {action} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────
   MPageHeader — sticky page title bar (Mantis AppBar style)
──────────────────────────────────────────────── */
export function MPageHeader({
  title, sub, icon: Icon, actions, tabs, activeTab, onTabChange,
}: {
  title: string
  sub?: string
  icon?: React.ElementType
  actions?: React.ReactNode
  tabs?: Array<{ key: string; label: string; icon?: React.ElementType; pulse?: boolean }>
  activeTab?: string
  onTabChange?: (key: string) => void
}) {
  return (
    <div
      className="sticky top-0 z-20 px-6 shrink-0"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex items-center justify-between h-14">
        {tabs ? (
          <div className="flex items-center gap-1">
            {tabs.map(tab => {
              const TabIcon = tab.icon
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange?.(tab.key)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[12px] font-semibold transition-all"
                  style={active
                    ? { background: 'var(--primary-soft)', color: 'var(--primary)' }
                    : { color: 'var(--text-3)', background: 'transparent' }}
                >
                  {TabIcon && <TabIcon className="w-3.5 h-3.5" />}
                  {tab.label}
                  {tab.pulse && (
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--success)' }} />
                      <span className="relative inline-flex rounded-full w-1.5 h-1.5" style={{ background: 'var(--success)' }} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-soft)' }}>
                <Icon className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              </div>
            )}
            <div>
              <h1 className="text-[14px] font-semibold" style={{ color: 'var(--text-1)' }}>{title}</h1>
              {sub && <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{sub}</p>}
            </div>
          </div>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   MButton — Mantis contained/outlined/ghost button
──────────────────────────────────────────────── */
export function MButton({
  children, variant = 'primary', size = 'md', href, onClick, className, disabled,
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  const classMap: Record<string, string> = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    ghost:     'btn-ghost',
    danger:    'btn-danger',
  }
  const sizeClass = {
    sm: 'text-[11px] px-3 py-1.5',
    md: 'text-[12px] px-3.5 py-2',
    lg: 'text-[13px] px-4 py-2.5',
  }

  const cls = cn(
    'inline-flex items-center gap-1.5 font-medium transition-all',
    classMap[variant],
    sizeClass[size],
    className,
    disabled ? 'opacity-40 pointer-events-none' : '',
  )

  if (href) return <Link href={href} className={cls}>{children}</Link>
  return <button className={cls} onClick={onClick} disabled={disabled}>{children}</button>
}

/* ────────────────────────────────────────────────
   MStatRow — inline metric row inside cards
──────────────────────────────────────────────── */
export function MStatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>{label}</span>
      <span className="text-[12px] font-semibold" style={{ color: color ?? 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace' }}>
        {value}
      </span>
    </div>
  )
}

/* ────────────────────────────────────────────────
   MAiInsight — colored AI insight card
──────────────────────────────────────────────── */
export function MAiInsight({
  type,
  title,
  text,
  action,
  actionHref,
}: {
  type: 'revenue' | 'ai' | 'risk' | 'segment'
  title: string
  text: string
  action?: string
  actionHref?: string
}) {
  const map = {
    revenue: accents.green,
    ai:      accents.violet,
    risk:    accents.amber,
    segment: accents.blue,
  }
  const icons = {
    revenue: ArrowUpRight,
    ai:      AlertTriangle,
    risk:    AlertTriangle,
    segment: ChevronRight,
  }
  const a = map[type]
  const Icon = icons[type]

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-lg"
      style={{ background: a.bg, border: `1px solid ${a.border}` }}>
      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `color-mix(in srgb, ${a.color} 15%, var(--surface))` }}>
        <Icon className="w-3.5 h-3.5" style={{ color: a.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: a.color }}>{title}</p>
        <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--text-1)' }}>{text}</p>
        {action && actionHref && (
          <Link href={actionHref} className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold" style={{ color: a.color }}>
            {action} <ChevronRight className="w-2.5 h-2.5" />
          </Link>
        )}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   MProgressBar — Mantis LinearProgress style
──────────────────────────────────────────────── */
export function MProgressBar({
  label, value, max = 100, color = 'var(--primary)', showPct = true,
}: {
  label: string
  value: number
  max?: number
  color?: string
  showPct?: boolean
}) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span style={{ color: 'var(--text-2)' }}>{label}</span>
        {showPct && <span style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>%{pct.toFixed(0)}</span>}
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   MPremiumTooltip — recharts custom tooltip (Mantis style)
──────────────────────────────────────────────── */
export function MPremiumTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  formatter?: (name: string, value: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3.5 py-2.5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
      <p className="text-[10px] font-semibold mb-2"
        style={{ color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-5 mb-1 last:mb-0">
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-2)' }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="text-[11px] font-bold tabular-nums"
            style={{ color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace' }}>
            {formatter ? formatter(p.name, p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}
