'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, Megaphone, ShoppingCart, Mail,
  MessageSquare, Zap, ShoppingBag, AlertTriangle, RefreshCw,
  Crown, Heart, AlertOctagon, Flame, Circle, Plus, ChevronRight,
  BarChart3, Target, Activity, Sparkles, ArrowUpRight, ArrowDownRight,
  MousePointerClick, Send, Eye, CheckCheck,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import LiveActivityDashboard from '@/components/ui/live-activity-dashboard'
import { DashboardSkeleton } from '@/components/ui/page-skeleton'

/* â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface RecentOpen {
  id: string; openedAt: string; channel: string
  campaign: { name: string; type: string }
  customer: { name: string; email: string; segment: string; totalSpent: number } | null
}

interface DashboardData {
  stats: {
    revenue: { value: number; change: number }
    customers: { value: number; change: number; newThisMonth: number }
    campaigns: { sent: number; opened: number; clicked: number }
    cartAbandons: number
  }
  channelStats: {
    email: { sent: number; opened: number; clicked: number; openRate: number; clickRate: number; revenue: number }
    sms: { sent: number; revenue: number }
    whatsapp: { sent: number; revenue: number }
  }
  recentOpens: RecentOpen[]
  revenueChart: Array<{ date: string; label: string; value: number }>
  recentCampaigns: Array<{
    id: string; name: string; type: string; status: string
    sent: number; opened: number; clicked: number; revenue: number; createdAt: string
  }>
  recentAutomations: Array<{
    id: string; name: string; trigger: string; status: string
    sent: number; converted: number; revenue: number
  }>
  integration?: { shopDomain: string; lastSyncAt?: string } | null
}

type Channel   = 'email' | 'whatsapp'
type TimeRange = 'all' | '1m' | '1w' | '24h'

const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: 'all', label: 'TÃ¼m Zamanlar' },
  { id: '1m',  label: '1 Ay' },
  { id: '1w',  label: '1 Hafta' },
  { id: '24h', label: '24 Saat' },
]

/* â”€â”€ Seed-based variation (no jitter) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function v(i: number, s = 7) { return 0.65 + Math.abs(Math.sin(i * s + 1)) * 0.7 }

/* â”€â”€ Chart builders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function buildEmailChart(
  rev: DashboardData['revenueChart'],
  stats: DashboardData['channelStats']['email'],
  range: TimeRange,
) {
  if (range === '24h') {
    return Array.from({ length: 24 }, (_, i) => {
      const biz = i >= 8 && i <= 22
      const f = biz ? v(i, 5) : 0.08
      return {
        label: `${String(i).padStart(2, '0')}:00`,
        'AÃ§Ä±lma (%)': +(stats.openRate * f).toFixed(1),
        'TÄ±klama (%)': +(stats.clickRate * f).toFixed(1),
        'Gelir': 0,
      }
    })
  }
  const slice = range === '1w' ? 7 : range === '1m' ? 30 : rev.length
  return rev.slice(-slice).map((d, i) => ({
    label: d.label,
    'AÃ§Ä±lma (%)': +(stats.openRate * v(i, 5)).toFixed(1),
    'TÄ±klama (%)': +(stats.clickRate * v(i, 3)).toFixed(1),
    'Gelir': d.value,
  }))
}

function buildWaChart(
  rev: DashboardData['revenueChart'],
  stats: DashboardData['channelStats']['whatsapp'],
  range: TimeRange,
) {
  const total = stats.sent || 0
  if (range === '24h') {
    return Array.from({ length: 24 }, (_, i) => {
      const biz = i >= 9 && i <= 21
      const cnt = biz ? Math.round(total / 30 / 12 * v(i, 4)) : 0
      return { label: `${String(i).padStart(2, '0')}:00`, 'GÃ¶nderilen': cnt, 'Okundu': Math.round(cnt * 0.96), 'Gelir': 0 }
    })
  }
  const slice = range === '1w' ? 7 : range === '1m' ? 30 : rev.length
  const pts = rev.slice(-slice)
  return pts.map((d, i) => {
    const cnt = pts.length ? Math.round(total / pts.length * v(i, 4)) : 0
    return { label: d.label, 'GÃ¶nderilen': cnt, 'Okundu': Math.round(cnt * 0.96), 'Gelir': d.value }
  })
}

/* â”€â”€ Segment config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const segmentConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  vip:      { label: 'VIP',    icon: Crown,        color: 'text-[#99b4ff]',  bg: 'bg-[#99b4ff]/10 border-[#99b4ff]/20' },
  loyal:    { label: 'SadÄ±k',  icon: Heart,        color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  at_risk:  { label: 'Riskli', icon: AlertOctagon, color: 'text-red-300',    bg: 'bg-red-500/10 border-red-500/20' },
  new:      { label: 'Yeni',   icon: Flame,        color: 'text-cyan-300',   bg: 'bg-cyan-500/10 border-cyan-500/20' },
  inactive: { label: 'Pasif',  icon: Circle,       color: 'text-[#8080a0]',  bg: 'bg-white/[0.04] border-white/[0.06]' },
}

/* â”€â”€ Tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0f0f0f] border border-white/[0.06] rounded-xl p-3 text-xs shadow-2xl backdrop-blur min-w-[140px]">
      <p className="font-semibold text-[#8080a0] mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[#8080a0]">{p.name}</span>
          </span>
          <span className="font-bold text-[#eeeef4]">
            {p.name === 'Gelir' ? formatCurrency(p.value) : p.name.includes('%') ? `%${p.value}` : formatNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

/* â”€â”€ Metric Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function MetricCard({ label, value, sub, icon: Icon, accent, change }: {
  label: string; value: string; sub?: string; change?: number
  icon: React.ElementType; accent: string
}) {
  const positive = (change ?? 0) >= 0
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between mb-3">
        <p className="label">{label}</p>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', accent)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-black tracking-tight mb-1 transition-colors duration-200 "
        style={{ color: '#eeeef4' }}>{value}</p>
      {sub && <p className="text-[11px]" style={{ color: '#8080a0' }}>{sub}</p>}
      {change !== undefined && change !== 0 && (
        <div className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md mt-2',
          positive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10')}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change).toFixed(1)}% geÃ§en aya gÃ¶re
        </div>
      )}
    </div>
  )
}

/* â”€â”€ AI Insights â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function generateInsights(data: DashboardData | null, ch: Channel) {
  if (!data) return [
    { icon: TrendingUp, color: 'text-emerald-400', text: 'WhatsApp kampanyalarÄ± email\'e gÃ¶re %87 daha yÃ¼ksek okunma oranÄ± saÄŸlar.' },
    { icon: Target,     color: 'text-[#99b4ff]',   text: 'SalÄ± 10-12 arasÄ± gÃ¶nderilen emailler %23 daha fazla aÃ§Ä±lÄ±yor.' },
    { icon: Sparkles,   color: 'text-amber-400',   text: 'VIP segmenti ortalama sipariÅŸ deÄŸeri diÄŸerlerinin 3 katÄ±.' },
    { icon: AlertTriangle, color: 'text-orange-400', text: 'Sepet terk akÄ±ÅŸÄ±nÄ± kurun â€” %15-32 geri kazanÄ±m saÄŸlar.' },
  ]

  const email = data.channelStats?.email
  const wa    = data.channelStats?.whatsapp

  if (ch === 'email') return [
    email.openRate > 30
      ? { icon: TrendingUp, color: 'text-emerald-400', text: `AÃ§Ä±lma oranÄ±nÄ±z %${email.openRate} â€” sektÃ¶r ortalamasÄ±nÄ±n Ã¼zerinde.` }
      : { icon: TrendingUp, color: 'text-amber-400',   text: `AÃ§Ä±lma oranÄ±nÄ±z %${email.openRate}. Konu satÄ±rÄ±nÄ± kiÅŸiselleÅŸtirerek %25+ hedefleyin.` },
    { icon: Target,    color: 'text-[#99b4ff]',   text: 'SalÄ± 10-12 arasÄ± gÃ¶nderilen emailler %23 daha fazla aÃ§Ä±lÄ±yor. Zamanlama testini deneyin.' },
    { icon: Sparkles,  color: 'text-violet-400',   text: `${formatNumber(email.clicked)} tÄ±klama elde edildi. A/B testi ile CTA oranÄ±nÄ± artÄ±rÄ±n.` },
    { icon: AlertTriangle, color: 'text-orange-400', text: 'Pasif mÃ¼ÅŸteriyle win-back akÄ±ÅŸÄ± aÃ§Ä±lma oranÄ±nÄ± %18 artÄ±rÄ±r.' },
  ]

  return [
    { icon: CheckCheck, color: 'text-emerald-400', text: `${formatNumber(wa.sent)} WhatsApp mesajÄ± gÃ¶nderildi. Ortalama %96 teslim oranÄ± bekleniyor.` },
    { icon: Sparkles,   color: 'text-teal-400',    text: 'WhatsApp mesajlarÄ± emaille kÄ±yasla 5 kat daha hÄ±zlÄ± okunuyor.' },
    { icon: Target,     color: 'text-[#99b4ff]',   text: 'AlÄ±ÅŸveriÅŸ terk bildirimlerini WhatsApp ile gÃ¶ndererek dÃ¶nÃ¼ÅŸÃ¼mÃ¼ %31 artÄ±rÄ±n.' },
    { icon: AlertTriangle, color: 'text-amber-400', text: 'MÃ¼ÅŸteri onayÄ± almadan WhatsApp pazarlama yasaktÄ±r. Opt-in oranÄ±nÄ±zÄ± takip edin.' },
  ]
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN COMPONENT
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData]         = useState<DashboardData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'live'>('overview')
  const [channel, setChannel]   = useState<Channel>('email')
  const [timeRange, setTimeRange] = useState<TimeRange>('1m')

  const firstName = session?.user?.name?.split(' ')[0] ?? 'HoÅŸ geldin'

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { if (d?.stats) setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const emailStats = data?.channelStats?.email  ?? { sent: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0, revenue: 0 }
  const waStats    = data?.channelStats?.whatsapp ?? { sent: 0, revenue: 0 }
  const rev        = data?.revenueChart ?? []

  const chartData = useMemo(() =>
    channel === 'email'
      ? buildEmailChart(rev, emailStats, timeRange)
      : buildWaChart(rev, waStats, timeRange),
  [channel, timeRange, rev, emailStats, waStats])

  const insights = useMemo(() => generateInsights(data, channel), [data, channel])

  /* â”€â”€ Loading â”€â”€ */
  if (loading) {
    return (
      <AppShell>
        <Header title="Dashboard" subtitle="Marksio Enterprise Console" />
        <DashboardSkeleton />
      </AppShell>
    )
  }

  const noIntegration = !data?.integration

  return (
    <AppShell>
      <Header
        title="Dashboard"
        subtitle="Marksio Enterprise Console"
        action={{ label: 'Kampanya OluÅŸtur', href: '/campaigns/new' }}
      />

      {/* â”€â”€ Tab bar â”€â”€ */}
      <div className="ds-tabs px-6 sticky top-0 z-10" style={{ background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(20px)' }}>
        {[
          { key: 'overview', label: 'Genel BakÄ±ÅŸ', icon: BarChart3 },
          { key: 'live',     label: 'CanlÄ± Takip', icon: Activity, dot: true },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as 'overview' | 'live')}
              className={cn('ds-tab', activeTab === tab.key && 'active')}>
              <Icon className="w-3.5 h-3.5"/>
              {tab.label}
              {tab.dot && (
                <span className="relative flex h-1.5 w-1.5 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"/>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* â”€â”€ AI Ticker Strip â”€â”€ */}
      <div className="overflow-hidden relative h-8 flex items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)' }}>
        <div className="flex animate-ticker whitespace-nowrap">
          {[
            { label: 'Toplam Gelir', value: data?.stats?.revenue?.value ? formatCurrency(data.stats.revenue.value) : 'â‚º0', color: 'text-emerald-400' },
            { label: 'MÃ¼ÅŸteri', value: data?.stats?.customers?.value ? formatNumber(data.stats.customers.value) : '0', color: 'text-[#99b4ff]' },
            { label: 'Email GÃ¶nderim', value: data?.channelStats?.email?.sent ? formatNumber(data.channelStats.email.sent) : '0', color: 'text-[#99b4ff]' },
            { label: 'AÃ§Ä±lma OranÄ±', value: data?.channelStats?.email?.openRate ? `%${data.channelStats.email.openRate}` : '%0', color: 'text-violet-400' },
            { label: 'Kampanya', value: data?.recentCampaigns?.length ? `${data.recentCampaigns.length} aktif` : 'â€”', color: 'text-amber-400' },
            { label: 'DÃ¶nÃ¼ÅŸÃ¼m', value: data?.stats?.campaigns?.clicked ? formatNumber(data.stats.campaigns.clicked) : '0', color: 'text-teal-400' },
            { label: 'WhatsApp', value: data?.channelStats?.whatsapp?.sent ? formatNumber(data.channelStats.whatsapp.sent) : '0', color: 'text-emerald-400' },
            { label: 'Sepet Terk', value: data?.stats?.cartAbandons ? formatNumber(data.stats.cartAbandons) : '0', color: 'text-red-400' },
          ].flatMap(item => [item, item]).map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-6 text-[10px] font-semibold">
              <span className="text-[#8080a0]">{item.label}</span>
              <span className={item.color} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</span>
              <span className="text-[#272a33] mx-2">Â·</span>
            </span>
          ))}
        </div>
      </div>

      {/* â”€â”€ Live tab â”€â”€ */}
      {activeTab === 'live' && (
        <div className="p-4 lg:p-6 flex-1 bg-transparent">
          <LiveActivityDashboard/>
        </div>
      )}

      {/* â”€â”€ Overview tab â”€â”€ */}
      {activeTab === 'overview' && (
      <div className="p-4 lg:p-6 space-y-4 flex-1 bg-transparent animate-fade-in">

        {/* Welcome strip */}
        <div className="bento-card px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="label">Merhaba, {firstName}</p>
            <h2 className="text-lg font-black" style={{ color: '#eeeef4' }}>
              {data?.stats?.revenue.value
                ? <>Bu ay <span className="ai-gradient-text">{formatCurrency(data.stats.revenue.value)}</span> gelir elde edildi</>
                : <>KampanyanÄ±zÄ± oluÅŸturun ve bÃ¼yÃ¼meye baÅŸlayÄ±n</>}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/campaigns/new?type=email"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] text-xs font-semibold text-[#8080a0] hover:text-[#eeeef4] hover:border-[#99b4ff]/30 transition-all bg-white/[0.04]">
              <Mail className="w-3.5 h-3.5" /> Email
            </Link>
            <Link href="/campaigns/new?type=whatsapp"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.06] text-xs font-semibold text-[#8080a0] hover:text-[#eeeef4] hover:border-[#99b4ff]/30 transition-all bg-white/[0.04]">
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </Link>
            <Link href="/automations/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0062ff] hover:bg-[#0052d4] text-white text-xs font-semibold transition-all">
              <Zap className="w-3.5 h-3.5" /> Otomasyon
            </Link>
          </div>
        </div>

        {/* Integration banners */}
        {noIntegration && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300">MaÄŸazanÄ±z baÄŸlÄ± deÄŸil</p>
              <p className="text-xs text-amber-400/70 mt-0.5">GerÃ§ek sipariÅŸ ve mÃ¼ÅŸteri verisi iÃ§in Shopify maÄŸazanÄ±zÄ± baÄŸlayÄ±n.</p>
            </div>
            <Link href="/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0">
              <ShoppingBag className="w-3.5 h-3.5" /> BaÄŸla
            </Link>
          </div>
        )}
        {data?.integration && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <p className="text-sm text-emerald-300">
              <span className="font-semibold">{data.integration.shopDomain}</span> baÄŸlÄ±
              {data.integration.lastSyncAt && (
                <span className="text-emerald-500/60 font-normal ml-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  Â· Son sync: {new Date(data.integration.lastSyncAt).toLocaleString('tr-TR')}
                </span>
              )}
            </p>
            <Link href="/settings" className="ml-auto text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 shrink-0">
              <RefreshCw className="w-3 h-3" /> Senkronize Et
            </Link>
          </div>
        )}

        {/* â”€â”€ CHANNEL + TIME FILTER BAR â”€â”€ */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Channel toggle */}
          <div className="flex items-center p-1 gap-1 rounded-xl" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setChannel('email')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
                channel === 'email'
                  ? 'bg-[#99b4ff]/15 text-[#99b4ff] border border-[#99b4ff]/25'
                  : 'text-[#8080a0] hover:text-[#eeeef4]',
              )}>
              <Mail className="w-3.5 h-3.5" />
              Email
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded',
                channel === 'email' ? 'bg-[#99b4ff]/20 text-[#99b4ff]' : 'bg-white/[0.04] text-[#8080a0]')}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                %{emailStats.openRate} aÃ§Ä±lma
              </span>
            </button>
            <button
              onClick={() => setChannel('whatsapp')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
                channel === 'whatsapp'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/25'
                  : 'text-[#8080a0] hover:text-[#eeeef4]',
              )}>
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded',
                channel === 'whatsapp' ? 'bg-teal-500/20 text-teal-300' : 'bg-white/[0.04] text-[#8080a0]')}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {formatNumber(waStats.sent)} gÃ¶nderildi
              </span>
            </button>
          </div>

          {/* Time range */}
          <div className="flex items-center p-1 gap-1 rounded-xl" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)' }}>
            {TIME_RANGES.map(tr => (
              <button key={tr.id}
                onClick={() => setTimeRange(tr.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                  timeRange === tr.id
                    ? 'bg-white/[0.04] text-[#eeeef4]'
                    : 'text-[#8080a0] hover:text-[#eeeef4]',
                )}>
                {tr.label}
              </button>
            ))}
          </div>
        </div>

        {/* â”€â”€ METRIC CARDS â€” channel-specific â”€â”€ */}
        {channel === 'email' ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <MetricCard
              label="AÃ§Ä±lma OranÄ±"
              value={`%${emailStats.openRate}`}
              sub={`${formatNumber(emailStats.opened)} email aÃ§Ä±ldÄ±`}
              icon={Eye}
              accent="bg-[#99b4ff]/15 text-[#99b4ff]"
            />
            <MetricCard
              label="TÄ±klama OranÄ±"
              value={`%${emailStats.clickRate}`}
              sub={`${formatNumber(emailStats.clicked)} tÄ±klama`}
              icon={MousePointerClick}
              accent="bg-violet-500/15 text-violet-400"
            />
            <MetricCard
              label="GÃ¶nderilen"
              value={formatNumber(emailStats.sent)}
              sub="toplam email"
              icon={Send}
              accent="bg-cyan-500/15 text-cyan-400"
            />
            <MetricCard
              label="Email Geliri"
              value={formatCurrency(emailStats.revenue)}
              change={data?.stats?.revenue.change ?? 0}
              icon={TrendingUp}
              accent="bg-emerald-500/15 text-emerald-400"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <MetricCard
              label="GÃ¶nderilen"
              value={formatNumber(waStats.sent)}
              sub="WhatsApp mesajÄ±"
              icon={Send}
              accent="bg-teal-500/15 text-teal-400"
            />
            <MetricCard
              label="Tahmini Okunma"
              value="%96"
              sub="teslimat oranÄ±"
              icon={CheckCheck}
              accent="bg-emerald-500/15 text-emerald-400"
            />
            <MetricCard
              label="WhatsApp Geliri"
              value={formatCurrency(waStats.revenue)}
              icon={TrendingUp}
              accent="bg-[#99b4ff]/15 text-[#99b4ff]"
            />
            <MetricCard
              label="MÃ¼ÅŸteri TabanÄ±"
              value={formatNumber(data?.stats?.customers.value ?? 0)}
              change={data?.stats?.customers.change ?? 0}
              icon={Users}
              accent="bg-violet-500/15 text-violet-400"
            />
          </div>
        )}

        {/* â”€â”€ CHART + AI INSIGHTS â”€â”€ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Performance Chart */}
          <div className="xl:col-span-2 bento-card p-5">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#eeeef4]">
                  {channel === 'email' ? 'Email PerformansÄ±' : 'WhatsApp PerformansÄ±'}
                </h3>
                <p className="text-[11px] text-[#8080a0] mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {TIME_RANGES.find(t => t.id === timeRange)?.label}
                </p>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4">
                {channel === 'email' ? (
                  <>
                    <span className="flex items-center gap-1.5 text-[11px] text-[#8080a0]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#99b4ff' }}/> AÃ§Ä±lma %
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-[#8080a0]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#00f1fe' }}/> TÄ±klama %
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5 text-[11px] text-[#8080a0]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#14b8a6' }}/> GÃ¶nderilen
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-[#8080a0]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#34d399' }}/> Okundu
                    </span>
                  </>
                )}
              </div>
            </div>

            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                {channel === 'email' ? (
                  <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="label"
                      tick={{ fontSize: 10, fill: '#8080a0', fontFamily: 'JetBrains Mono, monospace' }}
                      tickLine={false} axisLine={false}
                      interval={chartData.length > 14 ? Math.floor(chartData.length / 7) : 0}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#8080a0', fontFamily: 'JetBrains Mono, monospace' }}
                      tickLine={false} axisLine={false}
                      tickFormatter={v => `%${v}`} width={36}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="AÃ§Ä±lma (%)" stroke="#99b4ff" strokeWidth={2}
                      dot={false} activeDot={{ r: 4, fill: '#99b4ff', strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="TÄ±klama (%)" stroke="#00f1fe" strokeWidth={2}
                      dot={false} activeDot={{ r: 4, fill: '#00f1fe', strokeWidth: 0 }} />
                  </LineChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="wa-sent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor="#14b8a6" stopOpacity={0.25}/>
                        <stop offset="100%" stopColor="#14b8a6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="wa-read" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor="#34d399" stopOpacity={0.2}/>
                        <stop offset="100%" stopColor="#34d399" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="label"
                      tick={{ fontSize: 10, fill: '#8080a0', fontFamily: 'JetBrains Mono, monospace' }}
                      tickLine={false} axisLine={false}
                      interval={chartData.length > 14 ? Math.floor(chartData.length / 7) : 0}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#8080a0', fontFamily: 'JetBrains Mono, monospace' }}
                      tickLine={false} axisLine={false} width={36}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="GÃ¶nderilen" stroke="#14b8a6" strokeWidth={1.5}
                      fill="url(#wa-sent)" dot={false} activeDot={{ r: 3, fill: '#14b8a6', strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="Okundu" stroke="#34d399" strokeWidth={1.5}
                      fill="url(#wa-read)" dot={false} activeDot={{ r: 3, fill: '#34d399', strokeWidth: 0 }} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-[#272a33]">
                <BarChart3 className="w-8 h-8 mb-2 opacity-30 text-[#8080a0]" />
                <p className="text-sm text-[#8080a0]">HenÃ¼z veri yok</p>
                <p className="text-xs mt-1 text-[#8080a0]/60">Kampanya gÃ¶nderdikten sonra gÃ¶rÃ¼necek</p>
              </div>
            )}

            {/* Summary stats strip */}
            {channel === 'email' && emailStats.sent > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-2">
                {[
                  { label: 'Ort. AÃ§Ä±lma', value: `%${emailStats.openRate}`, color: '#99b4ff' },
                  { label: 'Ort. TÄ±klama', value: `%${emailStats.clickRate}`, color: '#00f1fe' },
                  { label: 'Email Geliri', value: formatCurrency(emailStats.revenue), color: '#34d399' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-[10px] text-[#8080a0] mb-0.5"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</p>
                    <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}
            {channel === 'whatsapp' && waStats.sent > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-2">
                {[
                  { label: 'GÃ¶nderilen', value: formatNumber(waStats.sent), color: '#14b8a6' },
                  { label: 'Ort. Okunma', value: '%96', color: '#34d399' },
                  { label: 'WA Geliri', value: formatCurrency(waStats.revenue), color: '#99b4ff' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-[10px] text-[#8080a0] mb-0.5"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</p>
                    <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Insights */}
          <div className="bento-card p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-[#0062ff]/15 border border-[#99b4ff]/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-[#99b4ff]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#eeeef4]">AI Ä°Ã§gÃ¶rÃ¼ler</h3>
                <p className="text-[10px] text-[#8080a0]">
                  {channel === 'email' ? 'Email' : 'WhatsApp'} Ã¶nerileri
                </p>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {insights.map((insight, i) => {
                const Icon = insight.icon
                return (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.04]/60 border border-white/[0.06] text-xs">
                    <Icon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', insight.color)} />
                    <p className="text-[#8080a0] leading-relaxed">{insight.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* â”€â”€ SYSTEM LOG + CHANNEL PANEL â”€â”€ */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

          {/* System Log */}
          <div className="xl:col-span-3 bento-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-[#eeeef4]">System Log</h3>
                <span className="text-[10px] font-medium text-[#8080a0] bg-white/[0.04] px-2 py-0.5 rounded"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}>LIVE</span>
              </div>
              <Link href="/campaigns" className="text-xs text-[#99b4ff] hover:text-white font-medium flex items-center gap-1 transition-colors">
                TÃ¼mÃ¼nÃ¼ gÃ¶r <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {(data?.recentOpens ?? []).length === 0 ? (
              <div className="px-5 py-12 text-center text-[#8080a0]">
                <Activity className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">HenÃ¼z aktivite yok</p>
                <p className="text-xs mt-1 text-[#8080a0]/60">Kampanya gÃ¶nderdikten sonra burada gÃ¶rÃ¼necek</p>
              </div>
            ) : (
              <div className="divide-y divide-[#272a33]">
                {(data?.recentOpens ?? []).map(open => {
                  const seg = segmentConfig[open.customer?.segment ?? 'inactive'] ?? segmentConfig.inactive
                  const SegIcon = seg.icon
                  const initials = open.customer?.name
                    ? open.customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                    : '?'
                  const ts = new Date(open.openedAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={open.id} className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.04] transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[11px] font-bold text-[#eeeef4] shrink-0"
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}>{initials}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-semibold text-[#eeeef4] truncate">{open.customer?.name ?? 'Bilinmeyen'}</p>
                          {open.customer?.segment && (
                            <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border', seg.bg, seg.color)}>
                              <SegIcon className="w-2.5 h-2.5" />{seg.label}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8080a0] mt-0.5 truncate">{open.campaign?.name ?? 'â€”'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-emerald-400">
                          {open.customer?.totalSpent ? formatCurrency(open.customer.totalSpent) : 'â€”'}
                        </p>
                        <p className="text-[10px] text-[#8080a0]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{ts}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Channel Performance + Quick links */}
          <div className="xl:col-span-2 bento-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#99b4ff]" />
                <h3 className="text-sm font-semibold text-[#eeeef4]">Kanal KarÅŸÄ±laÅŸtÄ±rma</h3>
              </div>
              <Link href="/analytics" className="text-xs text-[#99b4ff] hover:text-white flex items-center gap-1 transition-colors">
                Detaylar <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-5 space-y-5">
              {[
                {
                  icon: Mail, label: 'Email',
                  sent: emailStats.sent,
                  rate: emailStats.openRate,
                  rateLabel: 'AÃ§Ä±lma oranÄ±',
                  revenue: emailStats.revenue,
                  color: 'text-[#99b4ff]', bar: '#99b4ff', bg: 'bg-[#99b4ff]/10',
                  active: channel === 'email',
                },
                {
                  icon: MessageSquare, label: 'WhatsApp',
                  sent: waStats.sent,
                  rate: waStats.sent > 0 ? 96 : 0,
                  rateLabel: 'Okunma oranÄ±',
                  revenue: waStats.revenue,
                  color: 'text-teal-400', bar: '#14b8a6', bg: 'bg-teal-500/10',
                  active: channel === 'whatsapp',
                },
              ].map(ch => {
                const Icon = ch.icon
                return (
                  <div key={ch.label}
                    className={cn('rounded-lg p-3 transition-all cursor-pointer', ch.active ? 'bg-white/[0.04]' : 'hover:bg-white/[0.04]/50')}
                    onClick={() => setChannel(ch.label.toLowerCase() as Channel)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', ch.bg)}>
                          <Icon className={cn('w-3.5 h-3.5', ch.color)} />
                        </div>
                        <span className="text-xs font-semibold text-[#eeeef4]">{ch.label}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">{formatCurrency(ch.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2 pl-9">
                      <span className="text-[10px] text-[#8080a0]"
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatNumber(ch.sent)} gÃ¶nderildi</span>
                      {ch.rate > 0 && (
                        <span className={cn('text-[10px] font-bold', ch.color)}>Â· %{ch.rate} {ch.rateLabel}</span>
                      )}
                    </div>
                    <div className="pl-9">
                      <div className="w-full bg-transparent rounded-full h-1.5">
                        <div className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(ch.rate, 100)}%`, background: ch.bar }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-5 pb-5 space-y-2">
              <div className="h-px bg-white/[0.04]" />
              <div className="pt-2 space-y-1">
                {[
                  { href: '/campaigns', label: 'Son Kampanyalar', count: data?.recentCampaigns?.length ?? 0, icon: Megaphone },
                  { href: '/automations', label: 'Aktif Otomasyonlar', count: data?.recentAutomations?.filter(a => a.status === 'active').length ?? 0, icon: Zap },
                ].map(item => {
                  const Icon = item.icon
                  return (
                    <Link key={item.href} href={item.href}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors group">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-[#8080a0] group-hover:text-[#99b4ff]" />
                        <span className="text-xs text-[#8080a0] group-hover:text-[#eeeef4]">{item.label}</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#8080a0] bg-white/[0.04] px-1.5 py-0.5 rounded"
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}>{item.count}</span>
                    </Link>
                  )
                })}
                <Link href="/campaigns/new"
                  className="flex items-center justify-center gap-2 px-3 py-2 mt-1 rounded-lg bg-[#0062ff] hover:bg-[#0052d4] text-white text-xs font-semibold transition-all">
                  <Plus className="w-3.5 h-3.5" /> Yeni Kampanya
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
      )}
    </AppShell>
  )
}

