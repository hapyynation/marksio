type BadgeVariant = 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'muted' | 'cyan'

interface MBadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  dot?: boolean
}

const STYLES: Record<BadgeVariant, React.CSSProperties> = {
  blue:   { background: '#DBEAFE', color: '#2563EB', border: '1px solid #BFDBFE' },
  green:  { background: '#DCFCE7', color: '#16A34A', border: '1px solid #BBF7D0' },
  amber:  { background: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A' },
  red:    { background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' },
  violet: { background: '#EDE9FE', color: '#7C3AED', border: '1px solid #DDD6FE' },
  muted:  { background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' },
  cyan:   { background: '#CFFAFE', color: '#0891B2', border: '1px solid #A5F3FC' },
}

const DOT_COLORS: Record<BadgeVariant, string> = {
  blue: '#2563EB', green: '#16A34A', amber: '#D97706', red: '#DC2626',
  violet: '#7C3AED', muted: '#9CA3AF', cyan: '#0891B2',
}

export default function MBadge({ children, variant = 'muted', dot = false }: MBadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: 9999,
        fontSize: 11.5,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        ...STYLES[variant],
      }}
    >
      {dot && (
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: DOT_COLORS[variant], flexShrink: 0 }} />
      )}
      {children}
    </span>
  )
}

export type { BadgeVariant }
