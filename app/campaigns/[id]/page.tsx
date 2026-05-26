'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, FunnelChart, Funnel, LabelList,
} from 'recharts'
import {
  ArrowLeft, Mail, MessageSquare, TrendingUp, Eye, MousePointerClick,
  ShoppingBag, Calendar, Users, Zap, ChevronRight, Loader2,
  CheckCircle2, Circle, Clock, AlertCircle, Send, DollarSign,
  BarChart3, Package, Tag, Star,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { formatCurrency, formatNumber, formatDate, cn } from '@/lib/utils'

/* ── Types ──────────────────────────────────────────────────────────────── */

interface Campaign {
  id: string; name: string; type: string; status: string; segment: string
  subject?: string; previewText?: string; body?: string; cta?: string
  sent: number; opened: number; clicked: number; converted: number; revenue: number
  sentAt?: string; scheduledAt?: string; createdAt: string; tips: string[]
}

interface RevenueData {
  metrics: {
    totalRevenue: number; conversions: number; aov: number
    revenuePerRecipient: number; conversionRate: number
    sent: number; opened: number; clicked: number
  }
  revenueChart: Array<{ date: string; revenue: number; conversions: number }>
  funnel: Array<{ stage: string; value: number; pct: number }>
  topProducts: Array<{ title: string; quantity: number; revenue: number }>
  topSegments: Array<{ segment: string; count: number; revenue: number }>
}

/* ── Config ─────────────────────────────────────────────────────────────── */

const typeConfig: Record<string, { label: string; icon: typeof Mail; color: string; bg: string; bar: string }> = {
  email:    { label: 'Email',    icon: Mail,          color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', bar: '#3b82f6' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', bar: '#14b8a6' },
}
const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  completed: { label: 'Tamamlandı', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  active:    { label: 'Aktif',      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',          icon: Zap },
  scheduled: { label: 'Planlandı',  color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',       icon: Clock },
  draft:     { label: 'Taslak',     color: 'text-gray-500 bg-gray-500/10 border-gray-500/20',          icon: Circle },
}
const periodOptions = [
  { key: '7d', label: '7 Gün' },
  { key: '14d', label: '14 Gün' },
  { key: '30d', label: '30 Gün' },
]

const SEGMENT_LABELS: Record<string, string> = {
  vip: 'VIP', new: 'Yeni', loyal: 'Sadık', at_risk: 'Risk',
  cart_abandoned: 'Sepet Terk', all: 'Tüm', other: 'Diğer',
}

/* ── Custom tooltip ─────────────────────────────────────────────────────── */

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 text-xs shadow-2xl min-w-[120px]">
      <p className="font-semibold text-gray-400 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <span style={{ color: p.color }} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-bold text-white">
            {p.name.toLowerCase().includes('gelir') ? formatCurrency(p.value) : formatNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Metric card ─────────────────────────────────────────────────────────── */

function MetricCard({
  label, value, sub, icon: Icon, color, bg, grad, glow,
}: {
  label: string; value: string; sub?: string
  icon: typeof DollarSign; color: string; bg: string; grad: string; glow?: string
}) {
  return (
    <div className={cn(
      'relative bg-[#111] border rounded-2xl p-4 overflow-hidden transition-all hover:scale-[1.02]',
      glow ? `border-${glow}/20 hover:border-${glow}/35` : 'border-[#1e1e1e] hover:border-[#2a2a2a]',
    )}>
      <div className={cn('absolute top-0 left-0 right-0 h-px bg-gradient-to-r to-transparent', grad)} />
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center border mb-3', bg)}>
        <Icon className={cn('w-4 h-4', color)} />
      </div>
      <p className="text-xl font-bold text-white tracking-tight leading-none">{value}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-1">{sub}</p>}
      <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1.5">{label}</p>
    </div>
  )
}

/* ── Funnel bar ──────────────────────────────────────────────────────────── */

function FunnelBar({ stage, value, pct, color }: { stage: string; value: number; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-right shrink-0">
        <p className="text-xs font-semibold text-gray-400">{stage}</p>
      </div>
      <div className="flex-1 bg-[#1a1a1a] rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(pct, 0)}%`, background: color }}
        />
      </div>
      <div className="w-24 shrink-0">
        <span className="text-xs font-bold text-white">{formatNumber(value)}</span>
        <span className="text-[10px] text-gray-600 ml-1.5">({pct}%)</span>
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [rev, setRev] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [revLoading, setRevLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    if (!id) return
    fetch(`/api/campaigns/${id}`)
      .then(r => r.json())
      .then(d => { setCampaign(d); setLoading(false) })
      .catch(() => setLoading(false))

    fetch(`/api/campaigns/${id}/revenue`)
      .then(r => r.json())
      .then(d => { setRev(d); setRevLoading(false) })
      .catch(() => setRevLoading(false))
  }, [id])

  if (loading) return (
    <AppShell>
      <div className="flex-1 bg-[#11131c] p-4 lg:p-6 space-y-4 animate-pulse">
        <div className="relative overflow-hidden rounded-xl bg-[#1a1e2b] h-16">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl bg-[#1a1e2b] h-24">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
            </div>
          ))}
        </div>
        <div className="relative overflow-hidden rounded-xl bg-[#1a1e2b] h-64">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
        </div>
      </div>
    </AppShell>
  )
  if (!campaign) return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center text-gray-600">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Kampanya bulunamadı</p>
          <Link href="/campaigns" className="text-xs text-[#b4c5ff] hover:text-blue-300 mt-2 inline-block">← Geri dön</Link>
        </div>
      </div>
    </AppShell>
  )

  const type   = typeConfig[campaign.type]   ?? typeConfig.email
  const status = statusConfig[campaign.status] ?? statusConfig.draft
  const StatusIcon = status.icon
  const TypeIcon   = type.icon

  // Revenue metrics — prefer real attribution data, fallback to campaign fields
  const totalRevenue = rev?.metrics.totalRevenue ?? campaign.revenue
  const conversions  = rev?.metrics.conversions  ?? campaign.converted
  const aov          = rev?.metrics.aov          ?? (conversions > 0 ? totalRevenue / conversions : 0)
  const revenuePerR  = rev?.metrics.revenuePerRecipient ?? (campaign.sent > 0 ? totalRevenue / campaign.sent : 0)
  const convRate     = rev?.metrics.conversionRate ?? (campaign.sent > 0 ? ((conversions / campaign.sent) * 100) : 0)
  const openRate     = campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : '0.0'
  const clickRate    = campaign.sent > 0 ? ((campaign.clicked / campaign.sent) * 100).toFixed(1) : '0.0'

  // Filter chart data by period
  const periodDays = period === '7d' ? 7 : period === '14d' ? 14 : 30
  const chartData = (rev?.revenueChart ?? [])
    .slice(-periodDays)
    .map(d => ({
      label: d.date.slice(5), // MM-DD
      revenue: d.revenue,
      conversions: d.conversions,
    }))

  const topMetrics = [
    { label: 'Toplam Gelir',          value: formatCurrency(totalRevenue), sub: `${conversions} dönüşüm`, icon: DollarSign,        color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', grad: 'from-emerald-500/50' },
    { label: 'Ortalama Sipariş',      value: formatCurrency(aov),          sub: 'kişi başı',              icon: ShoppingBag,       color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',    grad: 'from-blue-500/50' },
    { label: 'Dönüşüm Oranı',         value: `%${convRate.toFixed(1)}`,    sub: `${conversions} alıcı`,   icon: TrendingUp,        color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20', grad: 'from-violet-500/50' },
    { label: 'Alıcı Başı Gelir',      value: formatCurrency(revenuePerR),  sub: `${campaign.sent} gönderim`, icon: BarChart3,     color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',  grad: 'from-amber-500/50' },
    { label: 'Gönderildi',            value: formatNumber(campaign.sent),  sub: undefined,                icon: Send,              color: 'text-gray-300',    bg: 'bg-[#1a1a1a] border-[#2a2a2a]',       grad: 'from-gray-500/40' },
    { label: 'Açılma Oranı',          value: `%${openRate}`,               sub: `${campaign.opened} açıldı`, icon: Eye,           color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/20',     grad: 'from-sky-500/50' },
    { label: 'Tıklanma Oranı',        value: `%${clickRate}`,              sub: `${campaign.clicked} tıklandı`, icon: MousePointerClick, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', grad: 'from-indigo-500/50' },
  ]

  const funnelData = rev?.funnel ?? [
    { stage: 'Gönderildi', value: campaign.sent,       pct: 100 },
    { stage: 'Açıldı',     value: campaign.opened,     pct: campaign.sent > 0 ? +((campaign.opened    / campaign.sent) * 100).toFixed(1) : 0 },
    { stage: 'Tıklandı',   value: campaign.clicked,    pct: campaign.sent > 0 ? +((campaign.clicked   / campaign.sent) * 100).toFixed(1) : 0 },
    { stage: 'Dönüştü',    value: conversions,         pct: +convRate.toFixed(1) },
  ]
  const funnelColors = ['#60a5fa', '#818cf8', '#a78bfa', '#34d399']

  return (
    <AppShell>
      {/* Header bar */}
      <div className="h-14 bg-[#0a0a0a] border-b border-[#1e1e1e] flex items-center px-6 gap-3 sticky top-0 z-20">
        <Link href="/campaigns" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" /> Kampanyalar
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-700 shrink-0" />
        <span className="text-sm text-gray-400 truncate">{campaign.name}</span>
        <div className="ml-auto shrink-0">
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', status.color)}>
            <StatusIcon className="w-3 h-3" />{status.label}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-5 flex-1 bg-[#0a0a0a]">

        {/* Campaign identity */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center border shrink-0', type.bg)}>
            <TypeIcon className={cn('w-6 h-6', type.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white leading-tight">{campaign.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 flex-wrap">
              <span className={cn('font-semibold', type.color)}>{type.label}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3"/>{campaign.segment}</span>
              {campaign.sentAt && <><span>·</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{formatDate(campaign.sentAt)}</span></>}
            </div>
          </div>
          {totalRevenue > 0 && (
            <div className="shrink-0 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2.5 text-right">
              <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">Gelir</p>
              <p className="text-xl font-bold text-emerald-300">{formatCurrency(totalRevenue)}</p>
            </div>
          )}
        </div>

        {/* Metric grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {topMetrics.map(m => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        {/* Revenue chart */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Gelir Analizi</h3>
                {revLoading && <Loader2 className="w-3 h-3 text-gray-600 animate-spin" />}
              </div>
              <p className="text-xs text-gray-600">Last-click attribution ile atfedilen günlük gelir</p>
            </div>
            <div className="flex items-center gap-1 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-1">
              {periodOptions.map(p => (
                <button key={p.key} onClick={() => setPeriod(p.key)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    period === p.key ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-gray-300')}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {chartData.some(d => d.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad-rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="grad-conv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false}/>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#4b5563' }} tickLine={false} axisLine={false}/>
                <YAxis yAxisId="rev" orientation="left"  tick={{ fontSize: 10, fill: '#4b5563' }} tickLine={false} axisLine={false} tickFormatter={v => `₺${v}`}/>
                <YAxis yAxisId="conv" orientation="right" tick={{ fontSize: 10, fill: '#4b5563' }} tickLine={false} axisLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area yAxisId="rev"  type="monotone" dataKey="revenue"     name="Gelir"     stroke="#10b981" strokeWidth={2} fill="url(#grad-rev)"  dot={false} activeDot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}/>
                <Area yAxisId="conv" type="monotone" dataKey="conversions" name="Dönüşüm"  stroke="#8b5cf6" strokeWidth={1.5} fill="url(#grad-conv)" dot={false} activeDot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/8 border border-emerald-500/12 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-500/40" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">Henüz gelir verisi yok</p>
                <p className="text-xs text-gray-700 mt-1">Müşteriler satın alma yaptıkça burada görünecek</p>
              </div>
            </div>
          )}
        </div>

        {/* Conversion funnel + top segments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Funnel */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-[#b4c5ff]" />
              <h3 className="text-sm font-semibold text-white">Dönüşüm Hunisi</h3>
            </div>
            <div className="space-y-4">
              {funnelData.map((f, i) => (
                <FunnelBar key={f.stage} stage={f.stage} value={f.value} pct={f.pct} color={funnelColors[i]} />
              ))}
            </div>
            {funnelData[0]?.value > 0 && (
              <div className="mt-4 pt-4 border-t border-[#1e1e1e] flex items-center justify-between text-xs">
                <span className="text-gray-600">Huniden geçiş oranı</span>
                <span className="text-emerald-400 font-bold">
                  {funnelData[3] && funnelData[0].value > 0
                    ? `%${((funnelData[3].value / funnelData[0].value) * 100).toFixed(2)}`
                    : '%0.00'}
                </span>
              </div>
            )}
          </div>

          {/* Top segments */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Star className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">En İyi Segmentler</h3>
            </div>
            {rev?.topSegments && rev.topSegments.length > 0 ? (
              <div className="space-y-3">
                {rev.topSegments.map((s, i) => (
                  <div key={s.segment} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{SEGMENT_LABELS[s.segment] ?? s.segment}</p>
                      <p className="text-[10px] text-gray-600">{s.count} dönüşüm</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">{formatCurrency(s.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-700 text-sm">
                <Users className="w-6 h-6 mb-2 opacity-30"/>
                Segment verisi bekleniyor
              </div>
            )}
          </div>
        </div>

        {/* Top products */}
        {rev?.topProducts && rev.topProducts.length > 0 && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <Package className="w-4 h-4 text-[#b4c5ff]" />
              <h3 className="text-sm font-semibold text-white">Bu Kampanyadan Satan Ürünler</h3>
            </div>
            <div className="space-y-2.5">
              {rev.topProducts.map((p, i) => {
                const maxRev = rev.topProducts[0].revenue
                return (
                  <div key={p.title} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-white truncate">{p.title}</p>
                        <span className="text-xs font-bold text-emerald-400 shrink-0">{formatCurrency(p.revenue)}</span>
                      </div>
                      <div className="bg-[#1a1a1a] rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                          style={{ width: `${maxRev > 0 ? (p.revenue / maxRev) * 100 : 0}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-600 mt-1">{p.quantity} adet satıldı</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Performance chart (opens + clicks) */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <Eye className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Açılma & Tıklanma Trendi</h3>
          </div>
          {campaign.sent > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad-o" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false}/>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#4b5563' }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#4b5563' }} tickLine={false} axisLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="conversions" name="Dönüşüm" stroke="#3b82f6" strokeWidth={1.5} fill="url(#grad-o)" dot={false} activeDot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-36 flex items-center justify-center text-gray-700 text-sm">
              <TrendingUp className="w-6 h-6 mr-2 opacity-20"/> Henüz veri yok
            </div>
          )}
        </div>

        {/* Campaign content */}
        {(campaign.subject || campaign.body) && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e1e1e]">
              <h3 className="text-sm font-semibold text-white">Kampanya İçeriği</h3>
            </div>
            <div className="p-5 space-y-4">
              {campaign.subject && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Konu Satırı</p>
                  <p className="text-sm font-semibold text-white bg-[#0d0d0d] border border-[#1e1e1e] px-4 py-3 rounded-xl">{campaign.subject}</p>
                </div>
              )}
              {campaign.body && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Mesaj</p>
                  <p className="text-sm text-gray-400 bg-[#0d0d0d] border border-[#1e1e1e] px-4 py-3 rounded-xl whitespace-pre-line leading-relaxed">{campaign.body}</p>
                </div>
              )}
              {campaign.cta && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">CTA Butonu</p>
                  <span className="inline-flex items-center px-5 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-semibold rounded-xl">{campaign.cta}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI tips */}
        {campaign.tips?.length > 0 && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-yellow-400"/>
              <h3 className="text-sm font-semibold text-white">AI Önerileri</h3>
            </div>
            <ul className="space-y-2.5">
              {campaign.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-gray-500">
                  <div className="w-5 h-5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</div>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  )
}
