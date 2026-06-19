'use client'

import { useEffect, useState } from 'react'

interface HealthData {
  score: number | null
  status: string
  rates: {
    bounceRate: number
    complaintRate: number
    openRate: number
    deliveryRate: number
    unsubscribeRate: number
  }
  recommendations: string[]
  lastCalculated: string | null
}

const REC_ICONS: Record<string, string> = {
  bounce:    'remove_circle',
  complaint: 'thumb_down',
  open:      'mark_email_unread',
  delivery:  'send',
  default:   'lightbulb',
}

function GaugeArc({ score, color }: { score: number; color: string }) {
  const r = 90
  const cx = 110; const cy = 110
  const startAngle = -210
  const sweep = 240
  const clampedScore = Math.max(0, Math.min(100, score))
  const filledAngle = (clampedScore / 100) * sweep

  function polar(angle: number) {
    const rad = (angle * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function arc(startDeg: number, endDeg: number) {
    const s = polar(startDeg); const e = polar(endDeg)
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  return (
    <svg width={220} height={160} viewBox="0 0 220 160">
      {/* Track */}
      <path d={arc(startAngle, startAngle + sweep)} fill="none" stroke="#E5E7EB" strokeWidth={14} strokeLinecap="round" />
      {/* Fill */}
      {clampedScore > 0 && (
        <path d={arc(startAngle, startAngle + filledAngle)} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color}66)` }} />
      )}
      {/* Score text */}
      <text x={cx} y={cy + 8} textAnchor="middle" fill={color} fontSize={38} fontWeight={800} fontFamily="system-ui">{score}</text>
      <text x={cx} y={cy + 28} textAnchor="middle" fill="var(--text-2)" fontSize={12}>/ 100</text>
    </svg>
  )
}

function MetricCard({ label, value, target, isGood, color }: { label: string; value: string; target: string; isGood: boolean; color: string }) {
  return (
    <div style={{
      background: 'var(--surface)', border: `1px solid ${isGood ? 'var(--border)' : 'rgba(232,69,69,0.2)'}`,
      borderRadius: 12, padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{label}</div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isGood ? 'var(--green)' : 'var(--red)', boxShadow: isGood ? '0 0 6px var(--green)' : '0 0 6px var(--red)' }} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Hedef: {target}</div>
    </div>
  )
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/email/health')
      .then(r => r.json())
      .then((d: unknown) => setData(d as HealthData))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const score = data?.score ?? 100
  const status = data?.status ?? 'good'
  const scoreColor = status === 'good' ? '#22c97a' : status === 'warning' ? '#f0a020' : '#e84545'
  const statusLabel = status === 'good' ? 'Mükemmel' : status === 'warning' ? 'Dikkat Gerekiyor' : 'Kritik'

  const delivery    = data?.rates?.deliveryRate  ?? null
  const openRate    = data?.rates?.openRate      ?? null
  const bounceRate  = data?.rates?.bounceRate    ?? null
  const complRate   = data?.rates?.complaintRate ?? null

  const metrics = [
    { label: 'Teslim Oranı',  value: delivery   != null ? `%${delivery.toFixed(1)}`    : '%—',  target: '> %95',   isGood: (delivery   ?? 100) >= 95,   color: (delivery   ?? 100) >= 95  ? 'var(--blue)'  : 'var(--red)' },
    { label: 'Açılma Oranı',  value: openRate   != null ? `%${openRate.toFixed(1)}`    : '%—',  target: '> %15',   isGood: (openRate   ??   0) >= 15,   color: (openRate   ??   0) >= 15  ? 'var(--green)' : 'var(--red)' },
    { label: 'Bounce Oranı',  value: bounceRate != null ? `%${bounceRate.toFixed(2)}`  : '%—',  target: '< %2',    isGood: (bounceRate ??   0) <   2,   color: (bounceRate ??   0) <   2  ? 'var(--amber)' : 'var(--red)' },
    { label: 'Şikayet Oranı', value: complRate  != null ? `%${complRate.toFixed(3)}`   : '%—',  target: '< %0.1',  isGood: (complRate  ??   0) < 0.1,   color: (complRate  ??   0) < 0.1  ? 'var(--text-1)': 'var(--red)' },
  ]

  const recs = data?.recommendations ?? []

  return (
    <div style={{ padding: '32px', maxWidth: 1000, margin: '0 auto' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Sağlık Skoru</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '4px 0 0' }}>E-posta gönderici itibarınız ve öneriler</p>
      </div>

      {/* Main gauge card */}
      <div style={{
        background: 'var(--surface)', border: `1px solid ${status === 'good' ? 'rgba(34,201,122,0.2)' : status === 'warning' ? 'rgba(240,160,32,0.2)' : 'rgba(232,69,69,0.2)'}`,
        borderRadius: 16, padding: '28px 32px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          {loading ? (
            <div style={{ width: 220, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          ) : (
            <GaugeArc score={score} color={scoreColor} />
          )}
          <div style={{ marginTop: -8, fontSize: 15, fontWeight: 700, color: scoreColor }}>{statusLabel}</div>
          {data?.lastCalculated && (
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
              Son: {new Date(data.lastCalculated).toLocaleDateString('tr-TR')}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7, marginBottom: 16 }}>
            {data?.score == null
              ? 'İlk kampanyanızı gönderdikten sonra sağlık skoru hesaplanacak. Şu an temiz bir başlangıç skorunuz var.'
              : status === 'good'
              ? 'Harika! Gönderici itibarınız mükemmel durumda. Bounce ve şikayet oranlarınız düşük, açılma oranınız sağlıklı.'
              : status === 'warning'
              ? 'Bazı metrikleriniz dikkat gerektiriyor. Aşağıdaki önerileri inceleyerek iyileştirmeler yapabilirsiniz.'
              : 'Gönderici itibarınız kritik seviyede. Acil önlem alınmazsa e-postalarınız spam klasörüne düşebilir.'
            }
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Bounce',   val: bounceRate ?? 0, limit: 4,   format: (v: number) => `%${v.toFixed(2)}` },
              { label: 'Şikayet', val: complRate  ?? 0, limit: 0.1, format: (v: number) => `%${v.toFixed(3)}` },
              { label: 'Açılma',  val: openRate   ?? 0, limit: 15,  format: (v: number) => `%${v.toFixed(1)}`, invert: true },
            ].map(({ label, val, limit, format, invert }) => {
              const good = invert ? val >= limit : val < limit
              return (
                <div key={label} style={{ padding: '6px 12px', borderRadius: 8, background: good ? 'rgba(34,201,122,0.08)' : 'rgba(232,69,69,0.08)', border: `1px solid ${good ? 'rgba(34,201,122,0.2)' : 'rgba(232,69,69,0.2)'}` }}>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: good ? 'var(--green)' : 'var(--red)' }}>{format(val)}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ width: 80, height: 12, borderRadius: 4, background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                </div>
                <div style={{ width: 80, height: 28, borderRadius: 6, background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            ))
          : metrics.map(m => <MetricCard key={m.label} {...m} />)
        }
      </div>

      {/* Recommendations */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 14px' }}>Öneriler</h2>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[140, 100, 120].map((w, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 13, width: `${w}px`, borderRadius: 4, background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            ))}
          </div>
        ) : recs.length === 0 ? (
          <div style={{ background: 'rgba(34,201,122,0.05)', border: '1px solid rgba(34,201,122,0.2)', borderRadius: 12, padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(34,201,122,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: 'var(--green)' }}>check_circle</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: 14, marginBottom: 2 }}>Mükemmel Durumdasınız</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Tüm metrikler hedef aralıkta. Henüz herhangi bir öneri yok.</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recs.map((rec, i) => {
              const isBounce    = rec.toLowerCase().includes('geri dönüş') || rec.toLowerCase().includes('bounce')
              const isComplaint = rec.toLowerCase().includes('şikayet')
              const isOpen      = rec.toLowerCase().includes('açılma')
              const iconKey     = isBounce ? 'bounce' : isComplaint ? 'complaint' : isOpen ? 'open' : 'default'
              const iconColors  = { bounce: '#f0a020', complaint: '#e84545', open: '#4470ff', delivery: '#22c97a', default: '#9f7afa' }
              const iconColor   = iconColors[iconKey]

              return (
                <div key={i} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '16px 18px',
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${iconColor}18`, border: `1px solid ${iconColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: iconColor }}>{REC_ICONS[iconKey]}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>{rec}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
