interface StatCardProps {
  icon: string
  iconColor?: string
  iconBg?: string
  label: string
  value: string | number
  trend?: number
  trendLabel?: string
  suffix?: string
}

export default function StatCard({ icon, iconColor = '#2563EB', iconBg = '#DBEAFE', label, value, trend, trendLabel, suffix }: StatCardProps) {
  const trendUp = trend !== undefined && trend >= 0
  return (
    <div
      className="stat-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '16px',
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 10,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 36, height: 36, background: iconBg }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: iconColor }}>{icon}</span>
        </div>
        {trend !== undefined && (
          <span
            className="flex items-center gap-1"
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: trendUp ? '#16A34A' : '#DC2626',
              background: trendUp ? '#DCFCE7' : '#FEE2E2',
              padding: '2px 7px',
              borderRadius: 20,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
              {trendUp ? 'trending_up' : 'trending_down'}
            </span>
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {value}{suffix && <span style={{ fontSize: 14, fontWeight: 500, color: '#6B7280', marginLeft: 2 }}>{suffix}</span>}
        </p>
        <p style={{ fontSize: 12.5, color: '#6B7280', marginTop: 4 }}>
          {label}
          {trendLabel && <span style={{ color: '#9CA3AF' }}> · {trendLabel}</span>}
        </p>
      </div>
    </div>
  )
}
