'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface Campaign {
  sent: number
  opened: number
  clicked: number
  converted: number
  revenue: number
}

interface RevenueData {
  metrics: {
    totalRevenue: number
    conversions: number
    aov: number
    revenuePerRecipient: number
    conversionRate: number
  }
  revenueChart: Array<{ date: string; revenue: number; conversions: number }>
  funnel: Array<{ stage: string; value: number; pct: number }>
  topProducts: Array<{ title: string; quantity: number; revenue: number }>
}

const ChartTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 text-xs shadow-lg">
      <p className="font-semibold text-[#374151] mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-[#111827]">
            {p.name === 'Gelir' ? formatCurrency(p.value) : formatNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsPanel({ campaign, rev, revLoading }: {
  campaign: Campaign
  rev: RevenueData | null
  revLoading: boolean
}) {
  const openRate = campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : '0.0'
  const clickRate = campaign.sent > 0 ? ((campaign.clicked / campaign.sent) * 100).toFixed(1) : '0.0'
  const conversions = rev?.metrics.conversions ?? campaign.converted
  const totalRevenue = rev?.metrics.totalRevenue ?? campaign.revenue
  const convRate = campaign.sent > 0 ? ((conversions / campaign.sent) * 100).toFixed(1) : '0.0'

  const stats = [
    { label: 'Gönderildi',      value: formatNumber(campaign.sent),     sub: 'kişi',                              color: '#2563EB' },
    { label: 'Açılma Oranı',    value: `%${openRate}`,                  sub: `${formatNumber(campaign.opened)} açıldı`,  color: '#16A34A' },
    { label: 'Tıklanma Oranı',  value: `%${clickRate}`,                 sub: `${formatNumber(campaign.clicked)} tıklandı`, color: '#7C3AED' },
    { label: 'Dönüşüm',         value: `%${convRate}`,                  sub: `${conversions} sipariş`,            color: '#EA580C' },
    { label: 'Atfedilen Gelir', value: formatCurrency(totalRevenue),    sub: 'son-tıklama',                      color: '#0F766E' },
  ]

  const chartData = (rev?.revenueChart ?? []).slice(-30).map(d => ({
    label: d.date.slice(5),
    Gelir: d.revenue,
    Dönüşüm: d.conversions,
  }))

  const funnelData = rev?.funnel ?? [
    { stage: 'Gönderildi', value: campaign.sent,    pct: 100 },
    { stage: 'Açıldı',     value: campaign.opened,  pct: campaign.sent > 0 ? +((campaign.opened  / campaign.sent) * 100).toFixed(1) : 0 },
    { stage: 'Tıklandı',   value: campaign.clicked, pct: campaign.sent > 0 ? +((campaign.clicked / campaign.sent) * 100).toFixed(1) : 0 },
    { stage: 'Dönüştü',    value: conversions,      pct: +convRate },
  ]
  const funnelColors = ['#2563EB', '#7C3AED', '#16A34A', '#F59E0B']

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm">
            <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mb-2">{s.label}</p>
            <p className="text-[28px] font-bold leading-none mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] text-[#9CA3AF]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue & conversion chart */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-[13px] font-semibold text-[#111827]">Gelir & Dönüşüm Trendi</h3>
          {revLoading && <Loader2 className="w-3 h-3 text-[#9CA3AF] animate-spin" />}
        </div>
        {chartData.some(d => d.Gelir > 0 || d.Dönüşüm > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gRevL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gConvL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false}/>
              <YAxis yAxisId="rev"  orientation="left"  tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false} tickFormatter={v => `₺${v}`}/>
              <YAxis yAxisId="conv" orientation="right" tick={{ fontSize: 10, fill: '#9CA3AF' }} tickLine={false} axisLine={false}/>
              <Tooltip content={<ChartTooltip/>}/>
              <Area yAxisId="rev"  type="monotone" dataKey="Gelir"    stroke="#2563EB" strokeWidth={2}   fill="url(#gRevL)"  dot={false} activeDot={{ r: 3 }}/>
              <Area yAxisId="conv" type="monotone" dataKey="Dönüşüm" stroke="#16A34A" strokeWidth={1.5} fill="url(#gConvL)" dot={false} activeDot={{ r: 3 }}/>
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-44 flex items-center justify-center text-[13px] text-[#9CA3AF]">
            Henüz veri yok — kampanya gönderildikten sonra burada görünecek
          </div>
        )}
      </div>

      {/* Funnel */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
        <h3 className="text-[13px] font-semibold text-[#111827] mb-4">Dönüşüm Hunisi</h3>
        <div className="space-y-3">
          {funnelData.map((f, i) => (
            <div key={f.stage} className="flex items-center gap-3">
              <div className="w-20 text-right shrink-0">
                <p className="text-[12px] font-medium text-[#374151]">{f.stage}</p>
              </div>
              <div className="flex-1 bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(f.pct, 0)}%`, background: funnelColors[i] }}
                />
              </div>
              <div className="w-28 shrink-0 flex items-center gap-1.5">
                <span className="text-[12px] font-bold text-[#111827]">{formatNumber(f.value)}</span>
                <span className="text-[10px] text-[#9CA3AF]">(%{f.pct})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
