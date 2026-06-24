'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, ReferenceLine, Legend,
} from 'recharts'

interface DailyPoint { date: string; sent: number; opened: number; clicked: number; bounced: number }
interface MetricsData {
  period: string
  domain: string | null
  summary: { sent: number; delivered: number; opened: number; clicked: number; bounced: number; complained: number; unsubscribed: number }
  rates: { deliveryRate: number; openRate: number; clickRate: number; bounceRate: number; complaintRate: number; unsubscribeRate: number }
  dailyTrend: DailyPoint[]
  health: { score: number; status: string }
}

const PERIODS = [
  { value: '7d', label: '7G' },
  { value: '30d', label: '30G' },
  { value: '90d', label: '90G' },
]

function SkeletonBlock({ w = '100%', h = 40 }: { w?: string | number; h?: number }) {
  return (
    <div style={{ width: w, height: h, borderRadius: 8, background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
  )
}

function KpiCard({
  label, value, sub, color, risk,
}: {
  label: string; value: string; sub: string; color: string; risk?: boolean
}) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${risk ? 'rgba(232,69,69,0.35)' : 'var(--border)'}`,
      borderRadius: 12,
      padding: '20px 22px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {risk && (
        <div style={{
          position: 'absolute', top: 10, right: 12,
          fontSize: 11, fontWeight: 700, color: 'var(--red)',
          background: 'rgba(232,69,69,0.12)', padding: '2px 8px', borderRadius: 20,
        }}>
          ⚠ Risk
        </div>
      )}
      <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6 }}>{sub}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-2)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          <span style={{ color: 'var(--text-2)' }}>{p.name}: </span>{p.value.toLocaleString('tr-TR')}
        </div>
      ))}
    </div>
  )
}

const RateTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-2)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>%{Number(p.value).toFixed(2)}</div>
      ))}
    </div>
  )
}

export default function MetricsPage() {
  const [data, setData] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    setLoading(true)
    setData(null)
    fetch(`/api/email/metrics?period=${period}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [period])

  const r = data?.rates
  const s = data?.summary

  const kpis = [
    { label: 'Gönderilen', value: loading ? '—' : (s?.sent ?? 0).toLocaleString('tr-TR'), sub: 'toplam e-posta', color: 'var(--text-1)', risk: false },
    { label: 'Teslim Oranı', value: loading ? '—' : `%${r?.deliveryRate ?? 0}`, sub: 'başarıyla teslim', color: 'var(--blue)', risk: false },
    { label: 'Açılma Oranı', value: loading ? '—' : `%${r?.openRate ?? 0}`, sub: 'teslim edilenden', color: 'var(--green)', risk: false },
    { label: 'Tıklanma Oranı', value: loading ? '—' : `%${r?.clickRate ?? 0}`, sub: 'açılanlardan', color: 'var(--violet)', risk: false },
    { label: 'Bounce Oranı', value: loading ? '—' : `%${r?.bounceRate ?? 0}`, sub: 'gönderilenden — limit: %4', color: (r?.bounceRate ?? 0) >= 4 ? 'var(--red)' : 'var(--amber)', risk: (r?.bounceRate ?? 0) >= 4 },
    { label: 'Şikayet Oranı', value: loading ? '—' : `%${r?.complaintRate ?? 0}`, sub: 'gönderilenden — limit: %0.08', color: (r?.complaintRate ?? 0) >= 0.08 ? 'var(--red)' : 'var(--text-1)', risk: (r?.complaintRate ?? 0) >= 0.08 },
  ]

  const trendData = data?.dailyTrend ?? []
  const bounceData = trendData.map(d => ({ date: d.date, rate: d.sent > 0 ? Number(((d.bounced / d.sent) * 100).toFixed(2)) : 0 }))

  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Metrikler</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '4px 0 0' }}>E-posta performans analizi — gerçek zamanlı veriler</p>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 4 }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                border: 'none',
                background: period === p.value ? 'rgba(68,112,255,0.18)' : 'transparent',
                color: period === p.value ? 'var(--blue)' : 'var(--text-2)',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Domain banner */}
      {!loading && data?.domain && (
        <div style={{
          background: 'rgba(68,112,255,0.07)', border: '1px solid rgba(68,112,255,0.2)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--blue)' }}>dns</span>
          <span style={{ color: 'var(--text-2)' }}>Aktif gönderim domaini:</span>
          <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{data.domain}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px' }}>
                <SkeletonBlock h={12} w={80} />
                <div style={{ marginTop: 12 }}><SkeletonBlock h={32} w={100} /></div>
                <div style={{ marginTop: 8 }}><SkeletonBlock h={10} w={120} /></div>
              </div>
            ))
          : kpis.map(k => <KpiCard key={k.label} {...k} />)
        }
      </div>

      {/* Main trend chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingLeft: 4 }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 14 }}>Gönderim Trendi</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Günlük gönderilen / açılan / tıklanan</div>
          </div>
        </div>
        {loading ? (
          <SkeletonBlock h={200} />
        ) : trendData.length === 0 ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--text-3)' }}>show_chart</span>
            <div style={{ color: 'var(--text-2)', fontSize: 13 }}>Henüz yeterli veri yok</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4470ff" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4470ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOpened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c97a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c97a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gClicked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9f7afa" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#9f7afa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-2)', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fill: 'var(--text-2)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-2)', paddingTop: 8 }} />
              <Area type="monotone" dataKey="sent" stroke="#4470ff" fill="url(#gSent)" strokeWidth={2} name="Gönderilen" dot={false} />
              <Area type="monotone" dataKey="opened" stroke="#22c97a" fill="url(#gOpened)" strokeWidth={2} name="Açılan" dot={false} />
              <Area type="monotone" dataKey="clicked" stroke="#9f7afa" fill="url(#gClicked)" strokeWidth={2} name="Tıklanan" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bounce + Complaint charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Bounce rate chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 16px' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 14, marginBottom: 4 }}>Bounce Oranı</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14 }}>
            Kırmızı çizgi: %4 risk eşiği
          </div>
          {loading ? <SkeletonBlock h={150} /> : trendData.length === 0 ? (
            <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Veri yok</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={bounceData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-2)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fill: 'var(--text-2)', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `%${v}`} />
                <Tooltip content={<RateTooltip />} />
                <ReferenceLine y={4} stroke="#e84545" strokeDasharray="4 3" strokeWidth={1.5} />
                <Line type="monotone" dataKey="rate" stroke="#f0a020" strokeWidth={2} dot={false} name="Bounce %" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Summary stats */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 16px' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 14, marginBottom: 14 }}>Özet İstatistikler</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} h={24} />)
              : [
                  { label: 'Teslim Edilen', value: s?.delivered ?? 0, color: 'var(--blue)' },
                  { label: 'Açılan', value: s?.opened ?? 0, color: 'var(--green)' },
                  { label: 'Tıklanan', value: s?.clicked ?? 0, color: 'var(--violet)' },
                  { label: 'Bounce', value: s?.bounced ?? 0, color: 'var(--amber)' },
                  { label: 'Şikayet', value: s?.complained ?? 0, color: 'var(--red)' },
                  { label: 'Abonelik İptal', value: s?.unsubscribed ?? 0, color: 'var(--text-2)' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: row.color }}>{row.value.toLocaleString('tr-TR')}</span>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* Health score bar */}
      {!loading && data?.health && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '16px 22px',
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 2 }}>Gönderici Sağlık Skoru</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: data.health.status === 'good' ? 'var(--green)' : data.health.status === 'warning' ? 'var(--amber)' : 'var(--red)' }}>
              {data.health.score ?? 100}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, transition: 'width 0.5s',
                width: `${data.health.score ?? 100}%`,
                background: data.health.status === 'good' ? 'var(--green)' : data.health.status === 'warning' ? 'var(--amber)' : 'var(--red)',
              }} />
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: data.health.status === 'good' ? 'var(--green)' : data.health.status === 'warning' ? 'var(--amber)' : 'var(--red)' }}>
            {data.health.status === 'good' ? 'İyi Durumda' : data.health.status === 'warning' ? 'Dikkat Gerekiyor' : 'Kritik'}
          </div>
        </div>
      )}
    </div>
  )
}
