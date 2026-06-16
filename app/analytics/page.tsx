'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, Mail, MessageSquare,
  Target, Sparkles, ShoppingBag, Smartphone, Globe,
  BarChart3, Filter, ChevronDown, Send, Download,
  AlertTriangle, Package, Percent as PercentIcon,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'

/* ─── Types ─── */
interface AnalyticsData {
  kpis: { totalRevenue: number; totalOrders: number; convRate: number; aov: number; emailRevenue: number; waRevenue: number }
  funnel: Array<{ label: string; value: number; pct: number; color: string }>
  attribution: Array<{ name: string; value: number; color: string }>
  segments: { vip: { count: number; avgSpent: number }; at_risk: { count: number }; new: { count: number } }
  channels: {
    email:    { sent: number; openRate: number; clickRate: number; convRate: number; revenue: number; roi: number }
    whatsapp: { sent: number; openRate: number; clickRate: number; convRate: number; revenue: number; roi: number }
  }
  revenueData: Array<{ month: string; email: number; whatsapp: number }>
  campaignROI: Array<{ name: string; revenue: number; type: string; sent: number; opened: number; clicked: number }>
  topProducts?: Array<{ name: string; revenue: number; orders: number; views: number; conv: number }>
  hasData: boolean
}

/* ─── Empty initial data (shown only while API loads) ─── */
const DEMO_DATA: AnalyticsData = {
  kpis: { totalRevenue: 0, totalOrders: 0, convRate: 0, aov: 0, emailRevenue: 0, waRevenue: 0 },
  funnel: [
    { label: 'Gönderilen',    value: 0, pct: 100, color: '#4470ff' },
    { label: 'Teslim Edilen', value: 0, pct: 0,   color: '#9f7afa' },
    { label: 'Açılan',        value: 0, pct: 0,   color: '#22c97a' },
    { label: 'Tıklanan',      value: 0, pct: 0,   color: '#f0a020' },
    { label: 'Satın Alınan',  value: 0, pct: 0,   color: '#fb923c' },
  ],
  attribution: [],
  segments: { vip: { count: 0, avgSpent: 0 }, at_risk: { count: 0 }, new: { count: 0 } },
  channels: {
    email:    { sent: 0, openRate: 0, clickRate: 0, convRate: 0, revenue: 0, roi: 0 },
    whatsapp: { sent: 0, openRate: 0, clickRate: 0, convRate: 0, revenue: 0, roi: 0 },
  },
  revenueData: [],
  campaignROI: [],
  hasData: false,
}


/* ─── Helpers ─── */
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2.5 shadow-2xl" style={{ background: '#141420', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-[10px] font-semibold mb-2" style={{ color: '#44445a', fontFamily: 'monospace' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#8080a0' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />{p.name}
          </span>
          <span className="text-[11px] font-bold" style={{ color: '#eeeef4', fontFamily: 'monospace' }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Analytics AI Panel (computed from real data) ─── */
function AnalyticsAiPanel({ data, aiInput, setAiInput }: { data: AnalyticsData; aiInput: string; setAiInput: (v: string) => void }) {
  const insights: Array<{ icon: React.ElementType; color: string; title: string; text: string }> = []

  if (data.channels.email.openRate > 0) {
    insights.push({
      icon: Mail, color: '#99b4ff',
      title: 'E-posta Performansı',
      text: `E-posta açılma oranınız %${data.channels.email.openRate}. Tıklama oranı: %${data.channels.email.clickRate}.`,
    })
  }
  if (data.segments.vip.count > 0 && data.segments.vip.avgSpent > 0) {
    insights.push({
      icon: TrendingUp, color: '#22c97a',
      title: 'VIP Segment Fırsatı',
      text: `${data.segments.vip.count} VIP müşteriniz var. Ortalama harcama: ${formatCurrency(data.segments.vip.avgSpent)}.`,
    })
  }
  if (data.segments.at_risk.count > 0) {
    insights.push({
      icon: ShoppingBag, color: '#f0a020',
      title: 'Riskli Müşteriler',
      text: `${data.segments.at_risk.count} müşteri alışveriş yapmayı bıraktı. Win-back kampanyası oluşturun.`,
    })
  }
  if (data.kpis.convRate > 0) {
    insights.push({
      icon: Target, color: '#9f7afa',
      title: 'Dönüşüm Oranı',
      text: `Genel dönüşüm oranınız %${data.kpis.convRate}. Hedefleme iyileştirmesiyle artırılabilir.`,
    })
  }

  const atRiskCount = data.segments.at_risk.count
  const vipPotential = data.segments.vip.count > 0 && data.segments.vip.avgSpent > 0
    ? data.segments.vip.count * data.segments.vip.avgSpent * 0.1
    : 0

  return (
    <div className="p-4 flex-1 overflow-auto space-y-3">
      <p className="text-[12px]" style={{ color: '#44445a' }}>Öne Çıkan İçgörüler</p>
      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
          <Sparkles className="w-6 h-6" style={{ color: '#33334a' }} />
          <p className="text-[12px]" style={{ color: '#44445a' }}>
            Yeterli veri birikince AI önerileri burada görünecek.
          </p>
        </div>
      ) : insights.map((ins, i) => {
        const Icon = ins.icon
        return (
          <div key={i} className="p-3.5 rounded-xl cursor-default transition-all"
            style={{ background: `${ins.color}08`, border: `1px solid ${ins.color}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ins.color}18` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: ins.color }} />
              </div>
              <p className="text-[11px] font-bold" style={{ color: ins.color }}>{ins.title}</p>
            </div>
            <p className="text-[11.5px] leading-relaxed" style={{ color: '#8080a0' }}>{ins.text}</p>
          </div>
        )
      })}

      {(atRiskCount > 0 || vipPotential > 0) && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 }}>
          <p className="text-[11px] font-semibold mb-2.5" style={{ color: '#44445a' }}>Önerilen Aksiyonlar</p>
          <div className="space-y-2">
            {atRiskCount > 0 && (
              <div className="flex items-start justify-between gap-2 p-3 rounded-xl cursor-default"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[11px]" style={{ color: '#8080a0' }}>Riskli segmentleri canlandırın</p>
                <span className="text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded-lg whitespace-nowrap"
                  style={{ background: 'rgba(232,69,69,0.15)', color: '#e84545' }}>
                  {atRiskCount} kritik
                </span>
              </div>
            )}
            {vipPotential > 0 && (
              <div className="flex items-start justify-between gap-2 p-3 rounded-xl cursor-default"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[11px]" style={{ color: '#8080a0' }}>VIP segmentine özel kampanya gönderin</p>
                <span className="text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded-lg whitespace-nowrap"
                  style={{ background: 'rgba(34,201,122,0.15)', color: '#22c97a' }}>
                  {formatCurrency(vipPotential)} potansiyel
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <input
            value={aiInput}
            onChange={e => setAiInput(e.target.value)}
            placeholder="Analitik sorularınızı sorun..."
            className="flex-1 bg-transparent text-[12px] outline-none"
            style={{ color: '#eeeef4' }}
          />
          <button className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#4470ff' }}>
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(DEMO_DATA)
  const [loading, setLoading] = useState(true)
  const [channelFilter, setChannelFilter] = useState('all')
  const [aiInput, setAiInput] = useState('')

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
  const dateRangeLabel = `${thirtyDaysAgo.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { if (d?.kpis) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const kpis = [
    { label: 'Toplam Gelir',         value: data.kpis.totalRevenue > 0 ? formatCurrency(data.kpis.totalRevenue) : '—',     icon: TrendingUp,    color: '#22c97a', bg: 'rgba(34,201,122,0.1)' },
    { label: 'Toplam Sipariş',       value: data.kpis.totalOrders > 0 ? formatNumber(data.kpis.totalOrders) : '—',         icon: ShoppingBag,   color: '#4470ff', bg: 'rgba(68,112,255,0.1)' },
    { label: 'E-posta Geliri',       value: data.kpis.emailRevenue > 0 ? formatCurrency(data.kpis.emailRevenue) : '—',     icon: Mail,          color: '#99b4ff', bg: 'rgba(153,180,255,0.1)' },
    { label: 'WhatsApp Geliri',      value: data.kpis.waRevenue > 0 ? formatCurrency(data.kpis.waRevenue) : '—',           icon: MessageSquare, color: '#22c97a', bg: 'rgba(34,201,122,0.1)' },
    { label: 'Ort. Sipariş Değeri',  value: data.kpis.aov > 0 ? formatCurrency(data.kpis.aov) : '—',                      icon: Target,        color: '#f0a020', bg: 'rgba(240,160,32,0.1)' },
    { label: 'Dönüşüm Oranı',        value: data.kpis.convRate > 0 ? `%${data.kpis.convRate}` : '—',                      icon: PercentIcon,   color: '#9f7afa', bg: 'rgba(159,122,250,0.1)' },
  ]

  const CHANNEL_TABS = [
    { key: 'all',      label: 'Tümü'    },
    { key: 'email',    label: 'E-posta' },
    { key: 'whatsapp', label: 'WhatsApp'},
  ]

  return (
    <AppShell>
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 h-14 shrink-0 gap-2"
        style={{ background: 'rgba(8,8,15,0.95)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h1 className="text-[15px] md:text-[16px] font-bold" style={{ color: '#eeeef4' }}>Analitik</h1>
          <p className="text-[11px] hidden sm:block" style={{ color: '#44445a' }}>Pazarlama performansınızı analiz edin ve büyüme fırsatlarını keşfedin.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-[11px]">📅</span> {dateRangeLabel}
            <ChevronDown className="w-3 h-3" />
          </button>
          <button className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
            Önceki 30 gün ile karşılaştır <ChevronDown className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
            style={{ background: '#4470ff', color: '#fff' }}>
            <Download className="w-3.5 h-3.5" /> Raporu Dışa Aktar
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Main content ── */}
        <div className="flex-1 overflow-auto p-5 space-y-5">

          {/* ── Channel filter tabs ── */}
          <div className="flex items-center gap-1 flex-wrap">
            {CHANNEL_TABS.map(tab => (
              <button key={tab.key} onClick={() => setChannelFilter(tab.key)}
                className="px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                style={channelFilter === tab.key
                  ? { background: 'rgba(68,112,255,0.12)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.25)' }
                  : { background: 'rgba(255,255,255,0.03)', color: '#44445a', border: '1px solid rgba(255,255,255,0.06)' }}>
                {tab.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px]"
                style={{ background: 'rgba(255,255,255,0.03)', color: '#44445a', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Filter className="w-3 h-3" /> Segment <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px]"
                style={{ background: 'rgba(255,255,255,0.03)', color: '#44445a', border: '1px solid rgba(255,255,255,0.06)' }}>
                Tümü <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px]"
                style={{ background: 'rgba(255,255,255,0.03)', color: '#44445a', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Filter className="w-3 h-3" /> Filtrele
              </button>
            </div>
          </div>

          {/* ── 6 KPI cards ── */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {kpis.map(kpi => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="rounded-2xl p-4 relative overflow-hidden cursor-default transition-all"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}>
                  <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg,transparent,${kpi.color}44,transparent)` }} />
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#44445a' }}>{kpi.label}</p>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: kpi.bg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                    </div>
                  </div>
                  <p className="text-[22px] font-bold leading-none" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>
                    {loading ? <span className="inline-block h-6 w-24 rounded skeleton" /> : kpi.value}
                  </p>
                </div>
              )
            })}
          </div>

          {/* ── Revenue Trend + Channel Distribution ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Revenue Trend */}
            <div className="xl:col-span-2 rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <h3 className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>Gelir Trendi</h3>
                  <div className="flex items-center gap-4 mt-1">
                    {[{ color: '#99b4ff', label: 'Toplam Gelir' }, { color: '#22c97a', label: 'E-posta Geliri' }].map(l => (
                      <span key={l.label} className="flex items-center gap-1.5 text-[10px]" style={{ color: '#8080a0' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: l.color }} /> {l.label}
                      </span>
                    ))}
                  </div>
                </div>
                <select className="text-[11px] px-2.5 py-1 rounded-xl outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                  <option>Tümü</option>
                  <option>E-posta</option>
                  <option>WhatsApp</option>
                </select>
              </div>
              <div className="px-3 py-4">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.revenueData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="g-email" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#99b4ff" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#99b4ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g-wa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c97a" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#22c97a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#44445a', fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#44445a' }} tickLine={false} axisLine={false} tickFormatter={v => `₺${(v / 1000).toFixed(0)}k`} width={38} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="email" name="E-posta" stroke="#99b4ff" strokeWidth={1.5} fill="url(#g-email)" dot={false} activeDot={{ r: 3, fill: '#99b4ff', strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="whatsapp" name="WhatsApp" stroke="#22c97a" strokeWidth={1.5} fill="url(#g-wa)" dot={false} activeDot={{ r: 3, fill: '#22c97a', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Channel distribution donut */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>Kanal Bazlı Gelir Dağılımı</h3>
                <button className="text-[11px] mt-0.5 font-semibold" style={{ color: '#44445a' }}>Tümünü Gör →</button>
              </div>
              <div className="p-4 relative">
                <div className="h-36 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.attribution} cx="50%" cy="50%" innerRadius={44} outerRadius={62} dataKey="value" strokeWidth={0}>
                        {data.attribution.map((_, i) => <Cell key={i} fill={data.attribution[i].color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: '#141420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-[16px] font-bold" style={{ color: '#eeeef4', fontFamily: 'monospace' }}>{formatCurrency(data.kpis.totalRevenue)}</p>
                      <p className="text-[9px]" style={{ color: '#44445a' }}>Toplam Gelir</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mt-2">
                  {data.attribution.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.color }} />
                        <span style={{ color: '#8080a0' }}>{a.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: '#eeeef4', fontFamily: 'monospace' }}>{formatCurrency(a.value)}</span>
                        <span style={{ color: a.color, fontFamily: 'monospace' }}>%{((a.value / data.kpis.totalRevenue) * 100).toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Funnel + Campaign Performance ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Funnel */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>Funnel Analizi</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                    style={{ background: 'rgba(153,180,255,0.1)', color: '#99b4ff', border: '1px solid rgba(153,180,255,0.15)' }}>E-posta</span>
                </div>
                <select className="text-[11px] px-2 py-1 rounded-xl outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                  <option>E-posta</option>
                  <option>WhatsApp</option>
                </select>
              </div>
              <div className="p-5 space-y-2">
                {data.funnel.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-28 shrink-0">
                      <p className="text-[12px] font-medium" style={{ color: '#eeeef4' }}>{step.label}</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-5 rounded-md overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="h-5 rounded-md transition-all duration-700"
                          style={{ width: `${step.pct}%`, background: `${step.color}`, opacity: 0.75 }} />
                      </div>
                    </div>
                    <div className="w-24 shrink-0 text-right">
                      <span className="text-[11px] font-bold" style={{ color: '#eeeef4', fontFamily: 'monospace' }}>{formatNumber(step.value)}</span>
                      <span className="text-[10px] ml-1.5" style={{ color: step.color }}>%{step.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign Performance */}
            <div className="rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>Kampanya Performansı</h3>
                <Link href="/campaigns" className="text-[11px] font-semibold flex items-center gap-1" style={{ color: '#44445a' }}>
                  Tüm Kampanyaları Gör →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['KAMPANYA', 'GÖNDERİLEN', 'AÇILMA ORANI', 'TIKLANMA', 'GELİR'].map(col => (
                        <th key={col} className="text-left px-4 py-2.5 text-[9px] font-semibold tracking-wider whitespace-nowrap"
                          style={{ color: '#3e3e54' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaignROI.map((camp, i) => {
                      const isEmail = camp.type === 'email'
                      const openRate = camp.sent > 0 ? (camp.opened / camp.sent * 100).toFixed(1) : null
                      const clickRate = camp.sent > 0 ? (camp.clicked / camp.sent * 100).toFixed(1) : null
                      return (
                        <tr key={i} className="transition-all cursor-default"
                          style={{ borderBottom: i < data.campaignROI.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: isEmail ? 'rgba(153,180,255,0.1)' : 'rgba(34,201,122,0.1)' }}>
                                {isEmail ? <Mail className="w-3 h-3" style={{ color: '#99b4ff' }} /> : <MessageSquare className="w-3 h-3" style={{ color: '#22c97a' }} />}
                              </div>
                              <span className="text-[12px] font-medium truncate max-w-[130px]" style={{ color: '#eeeef4' }}>{camp.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[11px]" style={{ color: '#8080a0', fontFamily: 'monospace' }}>
                            {camp.sent > 0 ? formatNumber(camp.sent) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {openRate ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                  <div className="h-1.5 rounded-full" style={{ width: `${Math.min(parseFloat(openRate), 100)}%`, background: '#99b4ff' }} />
                                </div>
                                <span className="text-[11px] shrink-0" style={{ color: '#99b4ff', fontFamily: 'monospace' }}>%{openRate}</span>
                              </div>
                            ) : <span style={{ color: '#33334a' }}>—</span>}
                          </td>
                          <td className="px-4 py-3 text-[11px]" style={{ color: '#9f7afa', fontFamily: 'monospace' }}>
                            {clickRate ? `%${clickRate}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-[12px] font-bold" style={{ color: '#22c97a', fontFamily: 'monospace' }}>
                            {camp.revenue > 0 ? formatCurrency(camp.revenue) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Device Breakdown ── */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>Cihaz Bazlı Performans</h3>
              <button className="text-[11px] font-semibold" style={{ color: '#44445a' }}>Detayları Gör →</button>
            </div>
            <div className="p-5 grid grid-cols-3 gap-4">
              {[
                { device: 'Mobil',    icon: Smartphone, pct: 68.4, count: 156250, color: '#4470ff' },
                { device: 'Masaüstü', icon: Globe,      pct: 27.1, count: 61930,  color: '#22c97a' },
                { device: 'Tablet',   icon: Target,     pct: 4.5,  count: 10270,  color: '#9f7afa' },
              ].map(d => {
                const Icon = d.icon
                return (
                  <div key={d.device} className="flex items-center gap-4">
                    <div className="h-28 w-28 relative shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[{ value: d.pct }, { value: 100 - d.pct }]} cx="50%" cy="50%" innerRadius={32} outerRadius={44} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                            <Cell fill={d.color} />
                            <Cell fill="rgba(255,255,255,0.04)" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-[14px] font-bold" style={{ color: '#eeeef4' }}>%{d.pct}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                        <p className="text-[12px] font-semibold" style={{ color: '#eeeef4' }}>{d.device}</p>
                      </div>
                      <p className="text-[11px]" style={{ color: '#44445a' }}>{formatNumber(d.count)} ziyaretçi</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Top Products ── */}
          <div className="rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>Top 10 Ürün Performansı</h3>
              <button className="text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#44445a', border: '1px solid rgba(255,255,255,0.08)' }}>
                Gelire Göre ↓
              </button>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['#', 'ÜRÜN', 'GELİR', 'SİPARİŞ', 'GÖRÜNTÜLEME', 'DÖNÜŞÜM'].map(col => (
                    <th key={col} className="text-left px-4 py-2.5 text-[9px] font-semibold tracking-wider" style={{ color: '#3e3e54' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              {(data.topProducts?.length ?? 0) > 0 && (
                <tbody>
                  {(data.topProducts ?? []).map((p, i) => (
                    <tr key={i} className="transition-all cursor-default"
                      style={{ borderBottom: i < (data.topProducts?.length ?? 0) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-4 py-3 text-[11px] font-bold" style={{ color: '#44445a' }}>{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.15)' }}>
                            <Package className="w-3.5 h-3.5" style={{ color: '#99b4ff' }} />
                          </div>
                          <span className="text-[12px] font-medium" style={{ color: '#eeeef4' }}>{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-bold" style={{ color: '#22c97a', fontFamily: 'monospace' }}>{formatCurrency(p.revenue)}</td>
                      <td className="px-4 py-3 text-[11px]" style={{ color: '#8080a0', fontFamily: 'monospace' }}>{formatNumber(p.orders)}</td>
                      <td className="px-4 py-3 text-[11px]" style={{ color: '#8080a0', fontFamily: 'monospace' }}>{formatNumber(p.views)}</td>
                      <td className="px-4 py-3 text-[11px] font-semibold" style={{ color: '#9f7afa' }}>%{p.conv}</td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
            </div>
            {(data.topProducts?.length ?? 0) === 0 && (
              <div className="py-8 text-center">
                <p className="text-[12px]" style={{ color: '#44445a' }}>Sipariş verisi bulunmuyor</p>
              </div>
            )}
            {(data.topProducts?.length ?? 0) > 0 && (
              <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button className="text-[11px] font-semibold" style={{ color: '#44445a' }}>Tüm Ürünleri Gör →</button>
              </div>
            )}
          </div>

        </div>

        {/* ── AI Analiz Asistanı — desktop only ── */}
        <div className="hidden lg:flex w-[320px] shrink-0 flex-col border-l overflow-hidden"
          style={{ background: '#0d0d1a', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(159,122,250,0.15)', border: '1px solid rgba(159,122,250,0.25)' }}>
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>AI Analiz Asistanı</p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(68,112,255,0.15)', color: '#99b4ff' }}>Beta</span>
              </div>
            </div>
          </div>

          <AnalyticsAiPanel data={data} aiInput={aiInput} setAiInput={setAiInput} />
        </div>
      </div>
    </AppShell>
  )
}
