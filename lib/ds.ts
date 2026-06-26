/**
 * Marksio Design System — TypeScript tokens
 * All colors reference CSS variables so they work in both light and dark mode.
 */

/* ── Color palette — CSS variable references ── */
export const colors = {
  bg:       'var(--bg)',
  surface:  'var(--surface)',
  surface2: 'var(--surface-2)',
  surface3: 'var(--surface-3)',

  text1: 'var(--text-1)',
  text2: 'var(--text-2)',
  text3: 'var(--text-3)',

  border:  'var(--border)',
  border2: 'var(--border-2)',
  border3: 'var(--border-3)',

  blue:       'var(--primary)',
  blueHover:  'var(--primary-hover)',
  blueSoft:   'var(--primary-soft)',
  blueGlow:   'var(--primary-glow)',

  green:      'var(--success)',
  greenSoft:  'var(--success-soft)',
  red:        'var(--danger)',
  redSoft:    'var(--danger-soft)',
  amber:      'var(--warning)',
  amberSoft:  'var(--warning-soft)',
  violet:     'var(--violet)',
  violetSoft: 'var(--violet-soft)',

  /* Channel colors */
  emailColor:  'var(--primary)',
  waColor:     'var(--success)',
  autoColor:   'var(--violet)',
  pushColor:   'var(--warning)',
} as const

/* ── Semantic accent presets ── */
export type AccentKey = 'blue' | 'green' | 'red' | 'amber' | 'violet' | 'teal' | 'orange'

export const accents: Record<AccentKey, { color: string; bg: string; border: string }> = {
  blue:   { color: 'var(--primary)', bg: 'var(--primary-soft)',  border: 'color-mix(in srgb, var(--primary) 25%, transparent)' },
  green:  { color: 'var(--success)', bg: 'var(--success-soft)',  border: 'color-mix(in srgb, var(--success) 25%, transparent)' },
  red:    { color: 'var(--danger)',  bg: 'var(--danger-soft)',   border: 'color-mix(in srgb, var(--danger)  25%, transparent)' },
  amber:  { color: 'var(--warning)', bg: 'var(--warning-soft)',  border: 'color-mix(in srgb, var(--warning) 25%, transparent)' },
  violet: { color: 'var(--violet)',  bg: 'var(--violet-soft)',   border: 'color-mix(in srgb, var(--violet)  25%, transparent)' },
  teal:   { color: 'var(--cyan)',    bg: 'rgba(19,194,194,0.08)', border: 'rgba(19,194,194,0.22)' },
  orange: { color: 'var(--warning)', bg: 'var(--warning-soft)',  border: 'color-mix(in srgb, var(--warning) 25%, transparent)' },
}

/* ── Card styles ── */
export const cardBase = {
  background: 'var(--bg-card)',
  border:     '1px solid var(--border)',
  boxShadow:  '0px 1px 4px rgba(0,0,0,0.06)',
} as const

export const cardHover = {
  background: 'var(--bg-card)',
  border:     '1px solid color-mix(in srgb, var(--primary) 30%, var(--border))',
  transform:  'translateY(-1px)',
  boxShadow:  '0 4px 16px rgba(22,119,255,0.10)',
} as const

/* ── Typography scale ── */
export const type = {
  label:   { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' },
  caption: { fontSize: '11px', color: 'var(--text-2)' },
  body:    { fontSize: '13px', color: 'var(--text-1)' },
  metric:  { fontSize: '26px', fontWeight: 700, letterSpacing: '-0.025em', fontFamily: "'Public Sans', 'Inter', sans-serif", color: 'var(--text-1)' },
  mono:    { fontFamily: 'JetBrains Mono, monospace' },
} as const

/* ── Spacing ── */
export const spacing = {
  pagePadding: 'p-6',
  sectionGap:  'space-y-6',
  cardPad:     'p-5',
  cardPadSm:   'p-4',
} as const

/* ── Radius ── */
export const radius = {
  sm:  'var(--radius-sm)',
  md:  'var(--radius)',
  lg:  'var(--radius-lg)',
  xl:  'var(--radius-xl)',
  xxl: 'var(--radius-xl)',
} as const

/* ── Status helpers ── */
export function statusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'sent':
    case 'success': return 'var(--success)'
    case 'draft':   return 'var(--text-2)'
    case 'paused':  return 'var(--warning)'
    case 'failed':
    case 'error':   return 'var(--danger)'
    case 'scheduled': return 'var(--primary)'
    default:        return 'var(--text-2)'
  }
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'Aktif', inactive: 'Pasif', draft: 'Taslak',
    sent: 'Gönderildi', paused: 'Duraklatıldı', failed: 'Başarısız',
    scheduled: 'Planlandı', pending: 'Bekliyor', error: 'Hata',
  }
  return map[status] ?? status
}
