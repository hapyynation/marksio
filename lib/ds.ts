/**
 * Marksio Design System — TypeScript tokens
 * Single source of truth for all component styling.
 * CSS variables defined in app/globals.css.
 */

/* ── Color palette ── */
export const colors = {
  bg:       '#08080f',
  surface:  '#0f0f1a',
  surface2: '#171726',
  surface3: '#1f1f32',

  text1: '#eeeef4',
  text2: '#8080a0',
  text3: '#3e3e54',

  border:  'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)',
  border3: 'rgba(255,255,255,0.18)',

  blue:       '#4470ff',
  blueHover:  '#2e5be8',
  blueSoft:   'rgba(68,112,255,0.12)',
  blueGlow:   'rgba(68,112,255,0.20)',

  green:      '#22c97a',
  greenSoft:  'rgba(34,201,122,0.12)',
  red:        '#e84545',
  redSoft:    'rgba(232,69,69,0.12)',
  amber:      '#f0a020',
  amberSoft:  'rgba(240,160,32,0.12)',
  violet:     '#9f7afa',
  violetSoft: 'rgba(159,122,250,0.12)',

  /* Channel colors */
  emailColor:  '#99b4ff',
  waColor:     '#2dd4bf',
  autoColor:   '#a78bfa',
  pushColor:   '#fb923c',
} as const

/* ── Semantic accent presets ── */
export type AccentKey = 'blue' | 'green' | 'red' | 'amber' | 'violet' | 'teal' | 'orange'

export const accents: Record<AccentKey, { color: string; bg: string; border: string }> = {
  blue:   { color: '#99b4ff', bg: 'rgba(153,180,255,0.08)', border: 'rgba(153,180,255,0.18)' },
  green:  { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.18)'  },
  red:    { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.18)' },
  amber:  { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.18)'  },
  violet: { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.18)' },
  teal:   { color: '#2dd4bf', bg: 'rgba(45,212,191,0.08)',  border: 'rgba(45,212,191,0.18)'  },
  orange: { color: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.18)'  },
}

/* ── Card styles ── */
export const cardBase = {
  background: 'rgba(255,255,255,0.025)',
  border:     '1px solid rgba(255,255,255,0.07)',
} as const

export const cardHover = {
  background: 'rgba(255,255,255,0.04)',
  border:     '1px solid rgba(255,255,255,0.12)',
  transform:  'translateY(-1px)',
  boxShadow:  '0 20px 60px rgba(0,0,0,0.4)',
} as const

/* ── Typography scale ── */
export const type = {
  label:   { fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.text3 },
  caption: { fontSize: '11px', color: colors.text2 },
  body:    { fontSize: '13px', color: colors.text1 },
  metric:  { fontSize: '26px', fontWeight: 700, letterSpacing: '-0.025em', fontFamily: 'Inter, sans-serif', color: colors.text1 },
  mono:    { fontFamily: 'JetBrains Mono, monospace' },
} as const

/* ── Spacing ── */
export const spacing = {
  pagePadding: 'p-6',
  sectionGap:  'space-y-8',
  cardPad:     'p-5',
  cardPadSm:   'p-4',
} as const

/* ── Radius ── */
export const radius = {
  sm:  '6px',
  md:  '10px',
  lg:  '14px',
  xl:  '16px',
  xxl: '20px',
} as const

/* ── Status helpers ── */
export function statusColor(status: string): string {
  switch (status) {
    case 'active':
    case 'sent':
    case 'success': return colors.green
    case 'draft':   return colors.text2
    case 'paused':  return colors.amber
    case 'failed':
    case 'error':   return colors.red
    case 'scheduled': return '#60a5fa'
    default:        return colors.text2
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
