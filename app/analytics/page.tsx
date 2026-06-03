'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  TrendingUp, Mail, MessageSquare, ArrowUpRight, ArrowDownRight,
  Target, Sparkles, Users, ShoppingBag, Smartphone, Globe,
  BarChart3, Filter, ChevronDown, X, Send, Download,
  Lightbulb, CheckCircle, AlertTriangle, Crown, Package, Percent as PercentIcon,
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
  campaignROI: Array<{ name: string; revenue: number; type: string }>
  topProducts?: Array<{ name: string; revenue: number; orders: number; views: number; conv: number }>
  hasData: boolean
}

/* ─── Demo data ─── */
const DEMO_DATA: AnalyticsData = {
  kpis: { totalRevenue: 1842420, totalOrders: 18542, convRate: 2.81, aov: 992, emailRevenue: 842420, waRevenue: 386720 },
  funnel: [
    { label: 'Gönderilen',   value: 402125, pct: 100,  color: '#4470ff' },
    { label: 'Teslim Edilen', value: 387248, pct: 96.3, color: '#9f7afa' },
    { label: 'Açılan',       value: 124850, pct: 32.2, color: '#22c97a' },
    { label: 'Tıklanan',     value: 25842,  pct: 20.7, color: '#f0a020' },
    { label: 'Satın Alınan', value: 1856,   pct: 7.18, color: '#fb923c' },
  ],
  attribution: [
    { name: 'Otomasyonlar', value: 614280, color: '#9f7afa' },
    { name: 'Kampanyalar',  value: 542310, color: '#4470ff' },
    { name: 'WhatsApp',     value: 388720, color: '#22c97a' },
    { name: 'E-posta BC',   value: 232030, color: '#99b4ff' },
    { name: 'Diğer',        value: 67080,  color: '#3e3e54' },
  ],
  segments: {
    vip: { count: 1032, avgSpent: 12450 },
    at_risk: { count: 1713 },
    new: { count: 2356 },
  },
  channels: {
    email:    { sent: 402125, openRate: 38.6, clickRate: 7.2, convRate: 3.2, revenue: 842420, roi: 42 },
    whatsapp: { sent: 18675,  openRate: 78.9, clickRate: 45.1, convRate: 8.8, revenue: 386720, roi: 28.6 },
  },
  revenueData: [
    { month: '1 May',  email: 28000, whatsapp: 9000 },
    { month: '4 May',  email: 32000, whatsapp: 11000 },
    { month: '7 May',  email: 38000, whatsapp: 13500 },
    { month: '10 May', email: 41000, whatsapp: 15000 },
    { month: '13 May', email: 36000, whatsapp: 14000 },
    { month: '16 May', email: 44000, whatsapp: 16500 },
    { month: '19 May', email: 39000, whatsapp: 15000 },
    { month: '22 May', email: 48000, whatsapp: 18000 },
    { month: '25 May', email: 52000, whatsapp: 19000 },
    { month: '28 May', email: 58000, whatsapp: 21000 },
    { month: '31 May', email: 64280, whatsapp: 28610 },
  ],
  campaignROI: [
    { name: 'Yaz Koleksiyonu Lansmanı', revenue: 156420, type: 'email' },
    { name: 'Sepet Terk Hatırlatma',    revenue: 245680, type: 'whatsapp' },
    { name: 'Hafta Sonu Fırsatları',    revenue: 98750,  type: 'email' },
    { name: 'VIP Özel Kampanya',        revenue: 186320, type: 'whatsapp' },
    { name: 'Doğum Günü Kampanyası',    revenue: 64280,  type: 'email' },
  ],
  hasData: true,
}

const TOP_PRODUCTS = [
  { name: 'Premium T-Shirt',  revenue: 125420, orders: 1248, views: 8452, conv: 4.32 },
  { name: 'Oversize Hoodie',  revenue: 98750,  orders: 872,  views: 6125, conv: 3.78 },
  { name: 'Denim Jean',       revenue: 87230,  orders: 739,  views: 5812, conv: 3.21 },
  { name: 'Sneaker',          revenue: 76880,  orders: 612,  views: 4965, conv: 3.11 },
  { name: 'Kanvas Çanta',     revenue: 45610,  orders: 412,  views: 3250, conv: 2.45 },
]

const AI_INSIGHTS = [
  { icon: TrendingUp, color: '#22c97a', title: 'Gelir artış trendi', text: 'Son 7 günde geliriniz %24.7 arttı. Bu performansı devam ettirerek aylık hedefinizin %18 üzerinde olacaksınız.' },
  { icon: ShoppingBag, color: '#f0a020', title: 'Sepet terk fırsatı', text: 'Sepet terk oranınız %68.4. Otomasyonlarınızı iyileştirerek ₺124.560 ek gelir kazanabilirsiniz.' },
  { icon: Mail, color: '#99b4ff', title: 'E-posta performansı', text: 'E-posta açılma oranınız sektör ortalamasının %23 üzerinde. Harika gidiyorsunuz! 🎉' },
]

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

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(DEMO_DATA)
  const [loading, setLoading] = useState(true)
  const [channelFilter, setChannelFilter] = useState('all')
  const [aiInput, setAiInput] = useState('')

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { if (d?.kpis) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const kpis = [
    { label: 'Toplam Gelir',         value: formatCurrency(data.kpis.totalRevenue),   change: 24.7, icon: TrendingUp,    color: '#22c97a', bg: 'rgba(34,201,122,0.1)' },
    { label: 'Toplam Sipariş',       value: formatNumber(data.kpis.totalOrders),       change: 18.2, icon: ShoppingBag,   color: '#4470ff', bg: 'rgba(68,112,255,0.1)' },
    { label: 'E-posta Geliri',       value: formatCurrency(data.kpis.emailRevenue),    change: 28.4, icon: Mail,          color: '#99b4ff', bg: 'rgba(153,180,255,0.1)' },
    { label: 'WhatsApp Geliri',      value: formatCurrency(data.kpis.waRevenue),       change: 31.7, icon: MessageSquare, color: '#22c97a', bg: 'rgba(34,201,122,0.1)' },
    { label: 'Ort. Sipariş Değeri',  value: formatCurrency(data.kpis.aov),             change: 57.6, icon: Target,        color: '#f0a020', bg: 'rgba(240,160,32,0.1)' },
    { label: 'Dönüşüm Oranı',        value: `%${data.kpis.convRate}`,                  change: 14.5, icon: PercentIcon,   color: '#9f7afa', bg: 'rgba(159,122,250,0.1)' },
  ]

  const CHANNEL_TABS = [
    { key: 'all',       label: 'Tümü'    },
    { key: 'email',     label: 'E-posta' },
    { key: 'whatsapp',  label: 'WhatsApp'},
    { key: 'push',      label: 'Push'    },
    { key: 'web',       label: 'Web'     },
  ]

  return (
    <AppShell>
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 h-14 shrink-0"
        style={{ background: 'rgba(8,8,15,0.95)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h1 className="text-[16px] font-bold" style={{ color: '#eeeef4' }}>Analitik</h1>
          <p className="text-[11px]" style={{ color: '#44445a' }}>Pazarlama performansınızı analiz edin ve büyüme fırsatlarını keşfedin.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-[11px]">📅</span> 31 May 2026 - 31 May 2026
            <ChevronDown className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
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
              const pos = kpi.change >= 0
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
                  <p className="text-[22px] font-bold leading-none mb-2" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>
                    {loading ? <span className="inline-block h-6 w-24 rounded skeleton" /> : kpi.value}
                  </p>
                  <div className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md', pos ? 'text-emerald-400' : 'text-red-400')}
                    style={{ background: pos ? 'rgba(34,201,122,0.08)' : 'rgba(232,69,69,0.08)' }}>
                    {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    %{Math.abs(kpi.change)} önceki 30 güne göre
                  </div>
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
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>Kampanya Performansı</h3>
                <Link href="/campaigns" className="text-[11px] font-semibold flex items-center gap-1" style={{ color: '#44445a' }}>
                  Tüm Kampanyaları Gör →
                </Link>
              </div>
              <div className="overflow-hidden">
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
                          <td className="px-4 py-3 text-[11px]" style={{ color: '#8080a0', fontFamily: 'monospace' }}>{formatNumber(Math.floor(camp.revenue / 3.8))}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                <div className="h-1.5 rounded-full" style={{ width: `${Math.random() * 40 + 20}%`, background: '#99b4ff' }} />
                              </div>
                              <span className="text-[11px] shrink-0" style={{ color: '#99b4ff', fontFamily: 'monospace' }}>%{(Math.random() * 20 + 30).toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[11px]" style={{ color: '#9f7afa', fontFamily: 'monospace' }}>%{(Math.random() * 8 + 4).toFixed(1)}</td>
                          <td className="px-4 py-3 text-[12px] font-bold" style={{ color: '#22c97a', fontFamily: 'monospace' }}>{formatCurrency(camp.revenue)}</td>
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
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>Top 10 Ürün Performansı</h3>
              <button className="text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#44445a', border: '1px solid rgba(255,255,255,0.08)' }}>
                Gelire Göre ↓
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['#', 'ÜRÜN', 'GELİR', 'SİPARİŞ', 'GÖRÜNTÜLEME', 'DÖNÜŞÜM'].map(col => (
                    <th key={col} className="text-left px-4 py-2.5 text-[9px] font-semibold tracking-wider" style={{ color: '#3e3e54' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.topProducts?.length ? data.topProducts : TOP_PRODUCTS).map((p, i) => (
                  <tr key={i} className="transition-all cursor-default"
                    style={{ borderBottom: i < (data.topProducts?.length || TOP_PRODUCTS.length) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
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
            </table>
            <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button className="text-[11px] font-semibold" style={{ color: '#44445a' }}>Tüm Ürünleri Gör →</button>
            </div>
          </div>

        </div>

        {/* ── AI Analiz Asistanı ── */}
        <div className="w-[320px] shrink-0 flex flex-col border-l overflow-hidden"
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
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,165,0,0.1)', color: '#f0a020', border: '1px solid rgba(240,160,32,0.2)' }}>3 yeni</span>
          </div>

          <div className="p-4 flex-1 overflow-auto space-y-3">
            <p className="text-[12px]" style={{ color: '#44445a' }}>Öne Çıkan İçgörüler</p>
            {AI_INSIGHTS.map((ins, i) => {
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
                  <button className="mt-2 text-[10px] font-semibold flex items-center gap-1" style={{ color: ins.color }}>
                    İncele →
                  </button>
                </div>
              )
            })}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 }}>
              <p className="text-[11px] font-semibold mb-2.5" style={{ color: '#44445a' }}>AI Önerilen Aksiyonlar</p>
              <div className="space-y-2">
                {[
                  { text: 'Düşük performanslı segmentleri canlandırın', badge: '2 kritik', badgeColor: '#e84545' },
                  { text: 'VIP segmentine özel kampanya gönderin', badge: '₺38.960 potansiyel', badgeColor: '#22c97a' },
                ].map((a, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 p-3 rounded-xl cursor-default"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[11px]" style={{ color: '#8080a0' }}>{a.text}</p>
                    <button className="text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded-lg whitespace-nowrap"
                      style={{ background: `${a.badgeColor}15`, color: a.badgeColor }}>
                      {a.badge}
                    </button>
                  </div>
                ))}
              </div>
              <button className="mt-2 text-[11px] font-semibold" style={{ color: '#44445a' }}>Tüm Önerileri Gör →</button>
            </div>
          </div>

          {/* Chat */}
          <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
      </div>
    </AppShell>
  )
}
