'use client'

/**
 * Marksio UI Primitives
 * Core reusable components for all pages.
 * Import: import { MCard, MKpiCard, MSectionHeader, MBadge, MEmptyState, MPageHeader } from '@/components/ui/primitives'
 */

import { cn } from '@/lib/utils'
import { cardBase, cardHover, accents, type, statusColor, statusLabel, colors, type AccentKey } from '@/lib/ds'
import { ArrowUpRight, ArrowDownRight, ChevronRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

/* ────────────────────────────────────────────────
   MCard — standard card shell
──────────────────────────────────────────────── */
export function MCard({
  children,
  className,
  style,
  hover = false,
  onClick,
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
      className={cn('rounded-2xl overflow-hidden', className, hover || onClick ? 'cursor-pointer' : '')}
      style={{
        ...cardBase,
        transition: 'all 0.2s',
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
   MCardHeader — card header with divider
──────────────────────────────────────────────── */
export function MCardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-4', className)} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {children}
    </div>
  )
}

/* ────────────────────────────────────────────────
   MSectionHeader — section title + optional link
──────────────────────────────────────────────── */
export function MSectionHeader({
  title,
  sub,
  href,
  hrefLabel = 'Tümü',
  action,
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
        <h2 className="text-[13px] font-bold" style={{ color: colors.text1 }}>{title}</h2>
        {sub && <p className="text-[11px] mt-0.5" style={{ color: colors.text3 }}>{sub}</p>}
      </div>
      {action ?? (href && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-[11px] font-semibold transition-colors"
          style={{ color: colors.text3 }}
          onMouseEnter={e => (e.currentTarget.style.color = colors.emailColor)}
          onMouseLeave={e => (e.currentTarget.style.color = colors.text3)}
        >
          {hrefLabel} <ChevronRight className="w-3 h-3" />
        </Link>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────
   MKpiCard — metric display card
──────────────────────────────────────────────── */
export function MKpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = 'blue',
  change,
  className,
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
      className={cn('relative rounded-2xl p-5 overflow-hidden cursor-default', className)}
      style={{ ...cardBase, transition: 'all .2s', ...(hovered ? cardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute top-0 left-4 right-4 h-px rounded-full"
        style={{ background: `linear-gradient(90deg,transparent,${a.color}44,transparent)` }} />

      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: colors.text3 }}>{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: a.bg }}>
          <Icon className="w-4 h-4" style={{ color: a.color }} />
        </div>
      </div>

      <p className="text-[26px] font-bold tracking-tight leading-none mb-1.5"
        style={{ color: colors.text1, letterSpacing: '-0.025em' }}>
        {value}
      </p>

      {sub && <p className="text-[11px]" style={{ color: colors.text3 }}>{sub}</p>}

      {change !== undefined && change !== 0 && (
        <div
          className={cn('inline-flex items-center gap-1 text-[10px] font-semibold mt-3 px-2 py-1 rounded-lg',
            positive ? 'text-emerald-400' : 'text-red-400')}
          style={{ background: positive ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)' }}
        >
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          %{Math.abs(change).toFixed(1)}
        </div>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────
   MBadge — status/type badge
──────────────────────────────────────────────── */
export function MBadge({
  label,
  accent,
  status,
  dot = false,
  className,
}: {
  label?: string
  accent?: AccentKey
  status?: string
  dot?: boolean
  className?: string
}) {
  const resolvedLabel = label ?? (status ? statusLabel(status) : '')
  const color = accent ? accents[accent].color : (status ? statusColor(status) : colors.text2)
  const bg    = accent ? accents[accent].bg    : `${color}18`

  return (
    <span
      className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', className)}
      style={{ background: bg, color, border: `1px solid ${color}28` }}
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
  icon: Icon,
  title,
  sub,
  action,
  actionHref,
}: {
  icon: React.ElementType
  title: string
  sub?: string
  action?: string
  actionHref?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <Icon className="w-5 h-5" style={{ color: colors.text3 }} />
      </div>
      <div className="text-center">
        <p className="text-[13px] font-semibold" style={{ color: colors.text2 }}>{title}</p>
        {sub && <p className="text-[12px] mt-0.5" style={{ color: colors.text3 }}>{sub}</p>}
      </div>
      {action && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold"
          style={{ color: colors.emailColor }}
        >
          {action} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────
   MPageHeader — sticky page title bar
──────────────────────────────────────────────── */
export function MPageHeader({
  title,
  sub,
  icon: Icon,
  actions,
  tabs,
  activeTab,
  onTabChange,
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
        background: 'rgba(8,8,15,0.9)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
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
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                  style={active
                    ? { background: 'rgba(255,255,255,0.07)', color: colors.text1 }
                    : { color: colors.text3 }}
                >
                  {TabIcon && <TabIcon className="w-3.5 h-3.5" />}
                  {tab.label}
                  {tab.pulse && (
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: colors.blueSoft }}>
                <Icon className="w-4 h-4" style={{ color: colors.emailColor }} />
              </div>
            )}
            <div>
              <h1 className="text-[14px] font-bold" style={{ color: colors.text1 }}>{title}</h1>
              {sub && <p className="text-[11px]" style={{ color: colors.text3 }}>{sub}</p>}
            </div>
          </div>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   MButton — primary/secondary button
──────────────────────────────────────────────── */
export function MButton({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  className,
  disabled,
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  onClick?: () => void
  className?: string
  disabled?: boolean
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: 'rgba(68,112,255,0.15)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.25)' },
    secondary: { background: 'rgba(255,255,255,0.04)', color: colors.text2, border: '1px solid rgba(255,255,255,0.08)' },
    ghost:     { background: 'transparent', color: colors.text2, border: '1px solid transparent' },
    danger:    { background: 'rgba(232,69,69,0.1)', color: colors.red, border: `1px solid rgba(232,69,69,0.2)` },
  }
  const hoverStyles: Record<string, React.CSSProperties> = {
    primary:   { background: 'rgba(68,112,255,0.25)', color: '#c4d4ff', borderColor: 'rgba(68,112,255,0.4)' },
    secondary: { background: 'rgba(255,255,255,0.07)', color: colors.text1, borderColor: 'rgba(255,255,255,0.12)' },
    ghost:     { background: 'rgba(255,255,255,0.04)', color: colors.text1 },
    danger:    { background: 'rgba(232,69,69,0.18)', color: colors.red },
  }
  const sizeClass = { sm: 'text-[11px] px-3 py-1.5 rounded-lg', md: 'text-[12px] px-3.5 py-2 rounded-xl', lg: 'text-[13px] px-4 py-2.5 rounded-xl' }

  const [hovered, setHovered] = useState(false)

  const cls = cn('inline-flex items-center gap-1.5 font-semibold transition-all', sizeClass[size], className, disabled ? 'opacity-40 pointer-events-none' : '')
  const style = { ...styles[variant], ...(hovered ? hoverStyles[variant] : {}) }

  if (href) {
    return (
      <Link href={href} className={cls} style={style}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {children}
      </Link>
    )
  }
  return (
    <button className={cls} style={style} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {children}
    </button>
  )
}

/* ────────────────────────────────────────────────
   MStatRow — inline metric row inside cards
──────────────────────────────────────────────── */
export function MStatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12px]" style={{ color: colors.text3 }}>{label}</span>
      <span className="text-[12px] font-bold"
        style={{ color: color ?? colors.text1, fontFamily: 'JetBrains Mono, monospace' }}>
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
    <div className="flex items-start gap-3 p-3.5 rounded-xl"
      style={{ background: a.bg, border: `1px solid ${a.border}` }}>
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${a.color}18` }}>
        <Icon className="w-3.5 h-3.5" style={{ color: a.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: a.color }}>{title}</p>
        <p className="text-[11.5px] leading-relaxed" style={{ color: '#aaaacc' }}>{text}</p>
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
   MProgressBar — labeled progress bar
──────────────────────────────────────────────── */
export function MProgressBar({
  label,
  value,
  max = 100,
  color = '#4470ff',
  showPct = true,
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
        <span style={{ color: colors.text2 }}>{label}</span>
        {showPct && <span style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>%{pct.toFixed(0)}</span>}
      </div>
      <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────
   MPremiumTooltip — recharts custom tooltip
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
    <div className="rounded-xl px-3.5 py-2.5 shadow-2xl"
      style={{ background: '#141420', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-[10px] font-semibold mb-2"
        style={{ color: '#666688', fontFamily: 'JetBrains Mono, monospace' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-5 mb-1 last:mb-0">
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#8888aa' }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="text-[11px] font-bold tabular-nums"
            style={{ color: '#f0f0f8', fontFamily: 'JetBrains Mono, monospace' }}>
            {formatter ? formatter(p.name, p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}
