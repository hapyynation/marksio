'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, Megaphone, ShoppingCart, Mail,
  MessageSquare, Phone, Zap, ArrowRight, Sparkles, Loader2,
  ShoppingBag, AlertTriangle, RefreshCw, MousePointerClick, Crown,
  Heart, AlertOctagon, Flame, Circle, MailOpen, Plus, ChevronRight,
  BarChart3, Target, Bell, Activity,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import LiveActivityDashboard from '@/components/ui/live-activity-dashboard'

interface RecentOpen {
  id: string
  openedAt: string
  channel: string
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

const segmentConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  vip:      { label: 'VIP',    icon: Crown,        color: 'text-blue-300',    bg: 'bg-blue-500/15 border-blue-500/30' },
  loyal:    { label: 'Sadık',  icon: Heart,        color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  at_risk:  { label: 'Riskli', icon: AlertOctagon, color: 'text-red-300',     bg: 'bg-red-500/15 border-red-500/30' },
  new:      { label: 'Yeni',   icon: Flame,        color: 'text-cyan-300',    bg: 'bg-cyan-500/15 border-cyan-500/30' },
  inactive: { label: 'Pasif',  icon: Circle,       color: 'text-gray-400',    bg: 'bg-gray-500/15 border-gray-500/30' },
}

const campaignStatusLabel: Record<string, string> = {
  completed: 'Tamamlandı', active: 'Aktif', scheduled: 'Planlandı', draft: 'Taslak',
}
const campaignStatusColor: Record<string, string> = {
  completed: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  active:    'text-blue-300 bg-blue-500/10 border-blue-500/20',
  scheduled: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  draft:     'text-gray-400 bg-gray-500/10 border-gray-500/20',
}
const campaignTypeIcon: Record<string, React.ElementType> = { email: Mail, sms: Phone, whatsapp: MessageSquare }
const campaignTypeBg: Record<string, string> = {
  email:    'bg-blue-500/15 text-blue-300',
  sms:      'bg-emerald-500/15 text-emerald-300',
  whatsapp: 'bg-teal-500/15 text-teal-300',
}

function StatCard({ label, value, change, icon: Icon, accent }: {
  label: string; value: string; change: number
  icon: React.ElementType; accent: { bar: string; icon: string; glow: string }
}) {
  const positive = change >= 0
  return (
    <div className="relative bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 hover:border-[#2a2a2a] transition-all duration-200 overflow-hidden group">
      <div className={cn('absolute top-0 left-0 right-0 h-px', accent.bar)} />
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-[0.12em]">{label}</p>
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', accent.icon)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight mb-2">{value}</p>
      {change !== 0 && (
        <div className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full',
          positive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10')}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change).toFixed(1)}% geçen ay
        </div>
      )}
      <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none', accent.glow)} />
    </div>
  )
}

function ChannelRow({ icon: Icon, iconBg, label, sent, openRate, clickRate, revenue }: {
  icon: React.ElementType; iconBg: string; label: string
  sent: number; openRate?: number; clickRate?: number; revenue: number
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#141414] transition-colors">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-gray-600 mt-0.5">{formatNumber(sent)} gönderildi</p>
      </div>
      {openRate !== undefined && (
        <div className="text-center hidden sm:block">
          <p className="text-sm font-bold text-white">%{openRate}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">Açıldı</p>
        </div>
      )}
      {clickRate !== undefined && (
        <div className="text-center hidden sm:block">
          <p className="text-sm font-bold text-white">%{clickRate}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">Tıklandı</p>
        </div>
      )}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-emerald-400">{formatCurrency(revenue)}</p>
        <p className="text-[10px] text-gray-600 mt-0.5">Gelir</p>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 text-xs shadow-2xl backdrop-blur">
      <p className="font-semibold text-gray-400 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span className="text-gray-500">{p.name}</span>
          <span className="font-bold text-white">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const quickActions = [
  { label: 'Email Kampanyası',  icon: Mail,        href: '/campaigns/new?type=email',    color: 'text-blue-400',    bg: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20' },
  { label: 'SMS Kampanyası',    icon: Phone,       href: '/campaigns/new?type=sms',      color: 'text-emerald-400', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20' },
  { label: 'WhatsApp Mesajı',  icon: MessageSquare, href: '/campaigns/new?type=whatsapp', color: 'text-teal-400',    bg: 'bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20' },
  { label: 'Otomasyon Kur',    icon: Zap,         href: '/automations/new',              color: 'text-violet-400',  bg: 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20' },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'live'>('overview')

  const firstName = session?.user?.name?.split(' ')[0] ?? 'Hoş geldin'

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { if (d?.stats) setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AppShell>
        <Header title="Dashboard" subtitle="Mağazanızın pazarlama performansı" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      </AppShell>
    )
  }

  const noIntegration = !data?.integration

  return (
    <AppShell>
      <Header
        title="Dashboard"
        subtitle="Mağazanızın pazarlama performansı"
        action={{ label: 'Kampanya Oluştur', href: '/campaigns/new' }}
      />

      {/* Tab bar */}
      <div className="border-b border-[#1e1e1e] bg-[#0a0a0a] px-6 flex items-center gap-1 sticky top-0 z-10">
        {[
          { key: 'overview', label: 'Genel Bakış', icon: BarChart3 },
          { key: 'live',     label: 'Canlı Takip', icon: Activity, dot: true },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as 'overview' | 'live')}
              className={cn('flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all -mb-px',
                activeTab === tab.key
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-gray-600 hover:text-gray-300 hover:border-[#2a2a2a]')}>
              <Icon className="w-4 h-4"/>
              {tab.label}
              {tab.dot && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"/>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === 'live' && (
        <div className="p-4 lg:p-6 flex-1 bg-[#0a0a0a]">
          <LiveActivityDashboard/>
        </div>
      )}

      {activeTab === 'overview' && (
      <div className="p-4 lg:p-6 space-y-5 flex-1 bg-[#0a0a0a]">

        {/* Hero strip */}
        <div className="relative bg-gradient-to-r from-blue-950/40 via-[#111] to-[#111] border border-[#1e1e1e] rounded-2xl px-6 py-5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-600 font-medium mb-1">Merhaba, {firstName} 👋</p>
              <h2 className="text-xl font-bold text-white">
                {data?.stats?.revenue.value ? (
                  <>Bu ay <span className="text-blue-400">{formatCurrency(data?.stats?.revenue?.value ?? 0)}</span> gelir elde edildi</>
                ) : (
                  <>Kampanyanızı oluşturun ve büyümeye başlayın</>
                )}
              </h2>
              {data?.stats?.revenue.change !== 0 && (
                <p className={cn('text-sm mt-1 font-medium', (data?.stats?.revenue.change ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {(data?.stats?.revenue.change ?? 0) >= 0 ? '↑' : '↓'} Geçen aya göre %{Math.abs(data?.stats?.revenue.change ?? 0).toFixed(1)} {(data?.stats?.revenue.change ?? 0) >= 0 ? 'artış' : 'düşüş'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {quickActions.map(a => (
                <Link key={a.href} href={a.href}
                  className={cn('flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all', a.bg, a.color)}>
                  <a.icon className="w-3.5 h-3.5" />
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Integration banner */}
        {noIntegration && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-300">Mağazanız bağlı değil</p>
              <p className="text-xs text-amber-400/70 mt-0.5">Gerçek sipariş ve müşteri verisi için Shopify mağazanızı bağlayın.</p>
            </div>
            <Link href="/settings" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0">
              <ShoppingBag className="w-3.5 h-3.5" /> Bağla
            </Link>
          </div>
        )}

        {data?.integration && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <p className="text-sm text-emerald-300">
              <span className="font-semibold">{data.integration.shopDomain}</span> bağlı
              {data.integration.lastSyncAt && (
                <span className="text-emerald-500/60 font-normal ml-2">
                  · Son sync: {new Date(data.integration.lastSyncAt).toLocaleString('tr-TR')}
                </span>
              )}
            </p>
            <Link href="/settings" className="ml-auto text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 shrink-0">
              <RefreshCw className="w-3 h-3" /> Senkronize Et
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <StatCard
            label="Aylık Gelir"
            value={formatCurrency(data?.stats?.revenue.value ?? 0)}
            change={data?.stats?.revenue.change ?? 0}
            icon={TrendingUp}
            accent={{ bar: 'bg-gradient-to-r from-blue-500/60 to-transparent', icon: 'bg-blue-600/20 text-blue-400', glow: 'bg-gradient-to-br from-blue-600/5 to-transparent' }}
          />
          <StatCard
            label="Toplam Müşteri"
            value={formatNumber(data?.stats?.customers.value ?? 0)}
            change={data?.stats?.customers.change ?? 0}
            icon={Users}
            accent={{ bar: 'bg-gradient-to-r from-emerald-500/60 to-transparent', icon: 'bg-emerald-600/20 text-emerald-400', glow: 'bg-gradient-to-br from-emerald-600/5 to-transparent' }}
          />
          <StatCard
            label="Gönderilen Mesaj"
            value={formatNumber(data?.stats?.campaigns.sent ?? 0)}
            change={0}
            icon={Megaphone}
            accent={{ bar: 'bg-gradient-to-r from-violet-500/60 to-transparent', icon: 'bg-violet-600/20 text-violet-400', glow: 'bg-gradient-to-br from-violet-600/5 to-transparent' }}
          />
          <StatCard
            label="Sepet Terk"
            value={formatNumber(data?.stats.cartAbandons ?? 0)}
            change={0}
            icon={ShoppingCart}
            accent={{ bar: 'bg-gradient-to-r from-amber-500/60 to-transparent', icon: 'bg-amber-600/20 text-amber-400', glow: 'bg-gradient-to-br from-amber-600/5 to-transparent' }}
          />
        </div>

        {/* Chart + Recent Opens */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* Revenue chart */}
          <div className="xl:col-span-3 bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-white">Gelir Trendi</h3>
                <p className="text-xs text-gray-600 mt-0.5">Son 30 gün</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Gelir
              </div>
            </div>
            {(data?.revenueChart ?? []).some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={data?.revenueChart ?? []} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="grad-blue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#4b5563' }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: '#4b5563' }} tickLine={false} axisLine={false} tickFormatter={v => `₺${v}`} width={45} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" name="Gelir" stroke="#3b82f6" strokeWidth={1.5} fill="url(#grad-blue)" dot={false} activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-gray-700">
                <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Henüz gelir verisi yok</p>
                <p className="text-xs mt-1 text-gray-700">Shopify bağlandıktan sonra görünecek</p>
              </div>
            )}
          </div>

          {/* Kanal performansı */}
          <div className="xl:col-span-2 bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Kanal Performansı</h3>
              </div>
              <Link href="/analytics" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                Detaylar <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-[#151515]">
              <ChannelRow
                icon={Mail}
                iconBg="bg-blue-600/20 text-blue-400"
                label="Email"
                sent={data?.channelStats?.email.sent ?? 0}
                openRate={data?.channelStats?.email.openRate ?? 0}
                clickRate={data?.channelStats?.email.clickRate ?? 0}
                revenue={data?.channelStats?.email.revenue ?? 0}
              />
              <ChannelRow
                icon={Phone}
                iconBg="bg-emerald-600/20 text-emerald-400"
                label="SMS"
                sent={data?.channelStats?.sms.sent ?? 0}
                revenue={data?.channelStats?.sms.revenue ?? 0}
              />
              <ChannelRow
                icon={MessageSquare}
                iconBg="bg-teal-600/20 text-teal-400"
                label="WhatsApp"
                sent={data?.channelStats?.whatsapp.sent ?? 0}
                revenue={data?.channelStats?.whatsapp.revenue ?? 0}
              />
            </div>
          </div>
        </div>

        {/* Recent Opens */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Son Aktiviteler</h3>
            </div>
            <Link href="/campaigns" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
              Tümünü gör <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {(data?.recentOpens ?? []).length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-700">
              <MailOpen className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium text-gray-600">Henüz aktivite yok</p>
              <p className="text-xs mt-1">Email kampanyaları gönderildikten sonra burada görünecek</p>
            </div>
          ) : (
            <div className="divide-y divide-[#151515]">
              {(data?.recentOpens ?? []).map((open) => {
                const seg = segmentConfig[open.customer?.segment ?? 'inactive'] ?? segmentConfig.inactive
                const SegIcon = seg.icon
                const initials = open.customer?.name
                  ? open.customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  : '?'
                return (
                  <div key={open.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[#141414] transition-colors">
                    <div className="w-9 h-9 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white truncate">
                          {open.customer?.name ?? 'Bilinmeyen Müşteri'}
                        </p>
                        {open.customer?.segment && (
                          <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border', seg.bg, seg.color)}>
                            <SegIcon className="w-2.5 h-2.5" />
                            {seg.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">
                        {open.campaign?.name ?? '—'}
                        {open.customer?.email && <span className="text-gray-700"> · {open.customer.email}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-400">
                        {open.customer?.totalSpent ? formatCurrency(open.customer.totalSpent) : '—'}
                      </p>
                      <p className="text-[11px] text-gray-600">
                        {new Date(open.openedAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Son Kampanyalar */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">Son Kampanyalar</h3>
              </div>
              <Link href="/campaigns" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
                Tümünü gör <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {(data?.recentCampaigns ?? []).length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-700">
                <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium text-gray-600">Henüz kampanya yok</p>
                <Link href="/campaigns/new" className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center gap-1">
                  <Plus className="w-3 h-3" /> İlk kampanyayı oluştur
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#151515]">
                {(data?.recentCampaigns ?? []).map(camp => {
                  const Icon = campaignTypeIcon[camp.type] ?? Mail
                  const openRate = camp.sent > 0 ? Math.round((camp.opened / camp.sent) * 100) : 0
                  return (
                    <div key={camp.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[#141414] transition-colors">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', campaignTypeBg[camp.type] ?? campaignTypeBg.email)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{camp.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {camp.sent > 0 ? `${formatNumber(camp.sent)} gönderildi` : 'Taslak'}
                          {openRate > 0 && <span className="ml-1.5 text-blue-400">%{openRate} açıldı</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-emerald-400">{formatCurrency(camp.revenue)}</p>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold border', campaignStatusColor[camp.status] ?? campaignStatusColor.draft)}>
                          {campaignStatusLabel[camp.status] ?? camp.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Otomasyonlar */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Aktif Otomasyonlar</h3>
              </div>
              <Link href="/automations" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
                Tümünü gör <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {(data?.recentAutomations ?? []).length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-700">
                <Zap className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium text-gray-600">Henüz otomasyon yok</p>
                <Link href="/automations/new" className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-flex items-center gap-1">
                  <Plus className="w-3 h-3" /> İlk otomasyonu oluştur
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#151515]">
                {(data?.recentAutomations ?? []).map(auto => (
                  <div key={auto.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-[#141414] transition-colors">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                      auto.status === 'active' ? 'bg-blue-600/15 text-blue-400' : 'bg-[#1e1e1e] text-gray-600')}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{auto.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{auto.trigger}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-400">{formatCurrency(auto.revenue)}</p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold border',
                        auto.status === 'active'
                          ? 'text-blue-300 bg-blue-500/10 border-blue-500/20'
                          : 'text-gray-500 bg-gray-500/10 border-gray-500/20')}>
                        {auto.status === 'active' ? 'Aktif' : 'Taslak'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
      )}
    </AppShell>
  )
}
