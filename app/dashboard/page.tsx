'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import {
  TrendingUp, Users, Mail, MessageSquare, Zap,
  ShoppingBag, AlertTriangle, RefreshCw, Crown, Heart,
  Flame, Plus, ChevronRight, BarChart3, Target, Activity,
  Sparkles, ArrowUpRight, ArrowDownRight,
  Megaphone, ArrowRight, Link2,
  ShoppingCart, Star, Package, CheckCircle2, XCircle,
  Layers, Download, AlertOctagon, CheckCheck,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { useSession } from '@/lib/hooks/use-session'
import { DashboardSkeleton } from '@/components/ui/page-skeleton'

interface RecentOpen {
  id: string; openedAt: string; channel: string
  campaign: { name: string; type: string }
  customer: { name: string; email: string; segment: string; totalSpent: number } | null
}

interface AiInsight {
  type: string; color: string; bg: string; border: string
  icon: React.ElementType; title: string; text: string; action: string; href: string
}

interface ChecklistItem {
  key: string; label: string; href: string; done: boolean
}

interface DashboardData {
  isDemo?: boolean
  stats: {
    revenue: { value: number; change: number }
    customers: { value: number; change: number; newThisMonth: number }
    campaigns: { sent: number; opened: number; clicked: number }
    cartAbandons: number
  }
  channelStats: {
    email: { sent: number; opened: number; clicked: number; openRate: number; clickRate: number; revenue: number }
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
  integrationStatus?: {
    shopify: { ok: boolean; detail: string | null }
    email: { ok: boolean; detail: string | null }
    whatsapp: { ok: boolean; detail: string | null }
    customerCount: number
  }
  kpiExtended?: {
    emailRevenue: number; waRevenue: number; automationRevenue: number; totalRevenue: number
    cartAbandonRate: number; activeSubscribers: number; waSubscribers: number; avgOrderValue: number
  }
  segments?: Array<{ id: string; name: string; count: number; color: string; icon: string }>
}

type TimeRange = '1m' | '1w' | '24h'

const TRIGGER_ICONS: Record<string, React.ElementType> = {
  cart_abandoned: ShoppingCart, customer_created: Heart,
  no_purchase_90d: RefreshCw, no_purchase_60d: RefreshCw,
  no_purchase_30d: RefreshCw, no_purchase: RefreshCw,
  order_placed: Package, order_delivered: Package, birthday: Star,
}
const TRIGGER_COLORS: Record<string, string> = {
  cart_abandoned: 'var(--danger)', customer_created: 'var(--success)',
  no_purchase_90d: 'var(--violet)', no_purchase_60d: 'var(--violet)',
  no_purchase_30d: 'var(--violet)', no_purchase: 'var(--violet)',
  order_placed: 'var(--warning)', order_delivered: 'var(--warning)', birthday: 'var(--warning)',
}
const SEGMENT_COLORS: Record<string, string> = {
  violet: '#7C3AED', blue: '#2563EB', green: '#16A34A', emerald: '#16A34A',
  amber: '#D97706', yellow: '#D97706', red: '#DC2626', pink: '#DB2777',
  teal: '#0891B2', orange: '#EA580C', gray: '#6B7280',
}
const SEGMENT_ICONS: Record<string, React.ElementType> = {
  Users, Crown, ShoppingCart, Target, Flame, Heart, Star,
  Activity, Package, AlertTriangle, Zap, Sparkles,
}

function buildInsights(d: DashboardData): AiInsight[] {
  const list: AiInsight[] = []
  if (d.stats.cartAbandons > 0) {
    list.push({
      type: 'revenue', color: 'var(--success)', bg: 'var(--success-soft)', border: 'color-mix(in srgb, var(--success) 20%, transparent)',
      icon: TrendingUp, title: 'Gelir Fırsatı',
      text: `${d.stats.cartAbandons} sepet terk eden müşteri hedeflenerek gelir kurtarılabilir.`,
      action: 'Kampanya Oluştur', href: '/campaigns/new',
    })
  }
  if (d.integrationStatus && !d.integrationStatus.email.ok) {
    list.push({
      type: 'risk', color: 'var(--warning)', bg: 'var(--warning-soft)', border: 'color-mix(in srgb, var(--warning) 20%, transparent)',
      icon: AlertTriangle, title: 'Risk Uyarısı',
      text: 'Email domain DNS doğrulaması yapılmadı, teslimatta sorun olabilir.',
      action: 'Ayarlar', href: '/settings',
    })
  }
  const topSegment = d.segments?.[0]
  if (topSegment && topSegment.count > 0) {
    list.push({
      type: 'segment', color: 'var(--primary)', bg: 'var(--primary-soft)', border: 'color-mix(in srgb, var(--primary) 20%, transparent)',
      icon: Layers, title: 'Segment Önerisi',
      text: `${topSegment.count} müşteriniz "${topSegment.name}" segmentinde. Kampanya oluşturun.`,
      action: 'Segment Gör', href: '/segments',
    })
  }
  const activeAuto = d.recentAutomations?.find(a => a.status === 'active')
  if (activeAuto && activeAuto.sent > 0) {
    list.push({
      type: 'ai', color: 'var(--violet)', bg: 'var(--violet-soft)', border: 'color-mix(in srgb, var(--violet) 20%, transparent)',
      icon: Sparkles, title: 'AI Önerisi',
      text: `"${activeAuto.name}" otomasyonu aktif çalışıyor. Dönüşüm için A/B test deneyin.`,
      action: 'Yönet', href: '/automations',
    })
  }
  return list.slice(0, 4)
}

function buildChecklist(d: DashboardData | null): ChecklistItem[] {
  return [
    { key: 'store',      label: 'Mağazanı bağla',          href: '/settings#integrations', done: d?.integrationStatus?.shopify.ok ?? false },
    { key: 'domain',     label: 'E-posta gönderimi hazır', href: '/settings?tab=email',    done: true },
    { key: 'segment',    label: 'İlk segmenti oluştur',    href: '/segments',              done: (d?.segments?.length ?? 0) > 0 },
    { key: 'campaign',   label: 'İlk kampanyayı oluştur',  href: '/campaigns/new',         done: (d?.recentCampaigns?.length ?? 0) > 0 },
    { key: 'automation', label: 'Otomasyonu aktif et',      href: '/automations',           done: d?.recentAutomations?.some(a => a.status === 'active') ?? false },
  ]
}

function buildChart(rev: DashboardData['revenueChart'], range: TimeRange, emailPct: number, waPct: number) {
  if (range === '24h') {
    return Array.from({ length: 24 }, (_, i) => ({ label: `${String(i).padStart(2, '0')}:00`, rev: 0, email: 0, wa: 0 }))
  }
  const slice = range === '1w' ? 7 : 30
  if (!rev.length) {
    return Array.from({ length: slice }, (_, i) => ({ label: `G${i + 1}`, rev: 0, email: 0, wa: 0 }))
  }
  return rev.slice(-slice).map(d => ({
    label: d.label, rev: d.value,
    email: Math.round(d.value * emailPct), wa: Math.round(d.value * waPct),
  }))
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
      <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 8, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-6" style={{ marginBottom: 4 }}>
          <span className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />
            {p.name}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function KpiCard({ label, value, sub, icon: Icon, accent, accentBg, change }: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent: string; accentBg: string; change?: number
}) {
  const positive = (change ?? 0) >= 0
  return (
    <div className="stat-card group relative cursor-default">
      <div className="flex items-start justify-between mb-4">
        <p className="label">{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: accentBg }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-1)', lineHeight: 1, marginBottom: 4 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{sub}</p>}
      {change !== undefined && change !== 0 && (
        <div className="inline-flex items-center gap-1 text-[11px] font-semibold mt-3 px-2.5 py-1 rounded-full"
          style={{
            color: positive ? 'var(--success)' : 'var(--danger)',
            background: positive ? 'var(--success-soft)' : 'var(--danger-soft)',
          }}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          %{Math.abs(change).toFixed(1)} geçen aya
        </div>
      )}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }}
      />
    </div>
  )
}

function MetricRow({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors cursor-default"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 10%, transparent)` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500, marginBottom: 1 }}>{label}</p>
        <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>{value}</p>
        <p style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 1 }}>{sub}</p>
      </div>
    </div>
  )
}

function OnboardingBar({ onHide, checklist }: { onHide: () => void; checklist: ChecklistItem[] }) {
  const done = checklist.filter(c => c.done).length
  const total = checklist.length
  const pct = Math.round((done / total) * 100)
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--primary-soft)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
      <div className="px-5 py-3.5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 shrink-0">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="color-mix(in srgb, var(--primary) 20%, transparent)" strokeWidth="2.5" />
                  <circle cx="16" cy="16" r="12" fill="none" stroke="var(--primary)" strokeWidth="2.5"
                    strokeDasharray={2 * Math.PI * 12} strokeDashoffset={2 * Math.PI * 12 * (1 - pct / 100)}
                    strokeLinecap="round" className="transition-all duration-700" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: 'var(--primary)' }}>{done}/{total}</span>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>Kurulum Tamamlama</p>
                <p style={{ fontSize: 10, color: 'var(--text-3)' }}>%{pct} tamamlandı</p>
              </div>
            </div>
          </div>
          <button onClick={onHide} className="text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-2)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
            Gizle
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {checklist.map((item, i) => (
            <Link key={item.key} href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
              style={{
                background: item.done ? 'color-mix(in srgb, var(--success) 8%, transparent)' : 'var(--surface)',
                border: `1px solid ${item.done ? 'color-mix(in srgb, var(--success) 25%, transparent)' : 'var(--border)'}`,
              }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: item.done ? 'color-mix(in srgb, var(--success) 15%, transparent)' : 'var(--surface-2)',
                  border: `1px solid ${item.done ? 'color-mix(in srgb, var(--success) 30%, transparent)' : 'var(--border)'}`,
                }}>
                {item.done
                  ? <CheckCheck className="w-2.5 h-2.5" style={{ color: 'var(--success)' }} />
                  : <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--text-3)' }}>{i + 1}</span>
                }
              </div>
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: item.done ? 'var(--success)' : 'var(--text-1)',
                textDecoration: item.done ? 'line-through' : 'none',
              }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [timeRange, setTimeRange] = useState<TimeRange>('1m')
  const [showChecklist, setShowChecklist] = useState(true)

  const firstName = session?.user?.name?.split(' ')[0] ?? ''

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError(null)
    fetch('/api/dashboard', { signal: controller.signal })
      .then(async r => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({})) as { error?: string }
          throw new Error(`${r.status}: ${body?.error ?? 'server_error'}`)
        }
        return r.json()
      })
      .then((d: DashboardData) => { if (!d?.stats) throw new Error('invalid_data'); setData(d) })
      .catch(e => {
        if (e.name !== 'AbortError') {
          console.error('[Dashboard] API error:', e.message)
          setError('Veriler yüklenemedi')
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retryKey])

  const email = data?.channelStats?.email ?? { sent: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0, revenue: 0 }
  const wa = data?.channelStats?.whatsapp ?? { sent: 0, revenue: 0 }
  const rev = data?.revenueChart ?? []
  const totalRevenue = data?.stats?.revenue?.value ?? 0
  const campaignRev = data?.kpiExtended?.emailRevenue ?? 0
  const automationRev = data?.kpiExtended?.automationRevenue ?? 0
  const waRev = data?.kpiExtended?.waRevenue ?? wa.revenue
  const emailPct = totalRevenue > 0 ? campaignRev / totalRevenue : 0
  const waPct = totalRevenue > 0 ? waRev / totalRevenue : 0

  const chartData = useMemo(() => buildChart(rev, timeRange, emailPct, waPct), [timeRange, rev, emailPct, waPct])
  const aiInsights = useMemo(() => data ? buildInsights(data) : [], [data])
  const checklist = useMemo(() => buildChecklist(data), [data])
  const allDone = checklist.every(c => c.done)

  const channels = useMemo(() => {
    const automationSent = (data?.recentAutomations ?? []).reduce((s, a) => s + a.sent, 0)
    const automationActive = (data?.recentAutomations ?? []).some(a => a.status === 'active')
    return [
      { id: 'email', label: 'Email', Icon: Mail, sent: email.sent, metric: email.openRate > 0 ? `%${email.openRate} açılma` : '—', revenue: email.revenue, active: email.sent > 0, color: 'var(--primary)', hex: '#2D4FA6' },
      { id: 'whatsapp', label: 'WhatsApp', Icon: MessageSquare, sent: wa.sent, metric: '—', revenue: wa.revenue, active: wa.sent > 0, color: 'var(--success)', hex: '#1F9D55' },
      { id: 'auto', label: 'Otomasyon', Icon: Zap, sent: automationSent, metric: '—', revenue: automationRev, active: automationActive, color: 'var(--violet)', hex: '#6D4FC4' },
    ]
  }, [data, email, wa, automationRev])

  const attribution = useMemo(() => {
    if (!data?.kpiExtended) return []
    return [
      { label: 'Email', value: data.kpiExtended.emailRevenue, color: '#2D4FA6' },
      { label: 'WhatsApp', value: data.kpiExtended.waRevenue, color: '#1F9D55' },
      { label: 'Otomasyon', value: data.kpiExtended.automationRevenue, color: '#6D4FC4' },
    ].filter(a => a.value > 0)
  }, [data])

  const integrationItems = useMemo(() => {
    const s = data?.integrationStatus
    if (!s) return []
    return [
      { label: 'Shopify Bağlantısı', ok: s.shopify.ok, detail: s.shopify.ok ? (s.shopify.detail ?? 'Bağlı') : 'Bağlı değil' },
      { label: 'Müşteri Senkronizasyonu', ok: s.shopify.ok && s.customerCount > 0, detail: s.shopify.ok ? `${formatNumber(s.customerCount)} müşteri senkron` : 'Mağaza bağlı değil' },
      { label: 'Email Domain', ok: s.email.ok, detail: s.email.detail ? (s.email.ok ? `${s.email.detail} doğrulandı` : 'DNS doğrulaması bekleniyor') : 'Domain eklenmedi' },
      { label: 'WhatsApp API', ok: s.whatsapp.ok, detail: s.whatsapp.ok ? 'Meta Business hesabı bağlı' : 'Meta Business hesabı bağlı değil' },
    ]
  }, [data])

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })

  if (loading) return <AppShell><div className="p-6 pt-4"><DashboardSkeleton /></div></AppShell>

  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center flex-1 p-6 gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--danger-soft)' }}>
            <AlertOctagon className="w-6 h-6" style={{ color: 'var(--danger)' }} />
          </div>
          <div className="text-center">
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>Dashboard yüklenemedi</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)' }}>{error}</p>
          </div>
          <button onClick={() => setRetryKey(k => k + 1)}
            className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Tekrar Dene
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* ── Top Bar ── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 h-13 shrink-0 gap-3"
        style={{
          background: 'color-mix(in srgb, var(--bg) 90%, transparent)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          height: 52,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-3)' }}>space_dashboard</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>Genel Bakış</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            {([{ id: '24h' as TimeRange, label: '24s' }, { id: '1w' as TimeRange, label: '7g' }, { id: '1m' as TimeRange, label: '30g' }]).map(tr => (
              <button key={tr.id} onClick={() => setTimeRange(tr.id)}
                className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all"
                style={timeRange === tr.id
                  ? { background: 'var(--surface)', color: 'var(--text-1)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  : { color: 'var(--text-3)' }}>
                {tr.label}
              </button>
            ))}
          </div>

          <button className="btn-secondary hidden md:flex items-center gap-1.5 !py-1.5 !px-3 !text-[12px]">
            <Download className="w-3.5 h-3.5" /> Rapor
          </button>

          <Link href="/campaigns/new" className="btn-primary hidden md:flex items-center gap-1.5 !py-1.5 !px-3 !text-[12px]">
            <Plus className="w-3.5 h-3.5" /> Kampanya Oluştur
          </Link>
        </div>
      </div>

      <div className="p-5 md:p-6 pb-14 space-y-5 flex-1 w-full" style={{ maxWidth: 1440, marginInline: 'auto' }}>

        {/* ── Hero ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-1">
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 3 }}>{today}</p>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              {firstName ? `Merhaba, ${firstName} 👋` : 'Dashboard'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>
              Tüm pazarlama kanalların tek ekranda
            </p>
          </div>

          <div className="flex items-center gap-2">
            {data?.integration ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'var(--success-soft)', border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--success)' }}>{data.integration.shopDomain}</span>
              </div>
            ) : (
              <Link href="/settings"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span style={{ fontSize: 12, fontWeight: 500 }}>Mağaza bağla</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── Onboarding ── */}
        {!allDone && showChecklist && (
          <OnboardingBar onHide={() => setShowChecklist(false)} checklist={checklist} />
        )}

        {/* ── Primary KPI Grid ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          <KpiCard label="Toplam Gelir" value={formatCurrency(totalRevenue)} sub="son 30 gün"
            icon={TrendingUp} accent="#1F9D55" accentBg="var(--success-soft)" change={data?.stats?.revenue?.change ?? 0} />
          <KpiCard label="Kampanya Geliri" value={formatCurrency(campaignRev)} sub="email + WhatsApp"
            icon={Megaphone} accent="var(--primary)" accentBg="var(--primary-soft)" />
          <KpiCard label="Otomasyon Geliri" value={formatCurrency(automationRev)} sub="aktif flow'lardan"
            icon={Zap} accent="var(--violet)" accentBg="var(--violet-soft)" />
          <KpiCard label="WhatsApp Geliri" value={formatCurrency(waRev)} sub="mesaj dönüşümü"
            icon={MessageSquare} accent="var(--cyan)" accentBg="color-mix(in srgb, var(--cyan) 10%, transparent)" />
        </div>

        {/* ── Secondary Metrics ── */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          <MetricRow label="Müşteri Büyümesi" value={`+${data?.stats?.customers?.newThisMonth ?? 0}`} sub="bu ay yeni" icon={Users} color="#EA580C" />
          <MetricRow label="Email Tıklama Oranı" value={`%${email.clickRate}`} sub="son 30 gün" icon={Target} color="var(--primary)" />
          <MetricRow label="Sepet Terk Oranı" value={`%${data?.kpiExtended?.cartAbandonRate ?? 0}`} sub="son 30 gün" icon={ShoppingCart} color="var(--danger)" />
          <MetricRow label="Ort. Sipariş Tutarı" value={formatCurrency(data?.kpiExtended?.avgOrderValue ?? 0)} sub="müşteri başı" icon={ShoppingBag} color="var(--success)" />
          <MetricRow label="Email Abone" value={formatNumber(data?.kpiExtended?.activeSubscribers ?? 0)} sub="aktif listesi" icon={Mail} color="var(--primary)" />
          <MetricRow label="WhatsApp Abone" value={formatNumber(data?.kpiExtended?.waSubscribers ?? 0)} sub="opt-in listesi" icon={MessageSquare} color="var(--success)" />
        </div>

        {/* ── Revenue Chart + AI Intelligence ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Chart */}
          <div className="bento-card xl:col-span-2">
            <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="label">Gelir Dağılımı</p>
                <div className="flex items-center gap-4 flex-wrap mt-1.5">
                  {[
                    { color: '#1F9D55', label: 'Toplam' },
                    { color: '#2D4FA6', label: 'Email' },
                    { color: '#0284C7', label: 'WhatsApp' },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-2)' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p style={{ fontSize: 10, color: 'var(--text-3)', marginBottom: 2 }}>30g Toplam</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)', letterSpacing: '-0.03em' }}>{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
            <div className="px-4 pb-5 pt-4">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <defs>
                    {[['g-total', '#1F9D55', 0.15], ['g-email', '#2D4FA6', 0.12], ['g-wa', '#0284C7', 0.12]].map(([id, c, op]) => (
                      <linearGradient key={id as string} id={id as string} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c as string} stopOpacity={op as number} />
                        <stop offset="100%" stopColor={c as string} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false}
                    interval={chartData.length > 14 ? Math.floor(chartData.length / 6) : 0} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} width={36} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="rev" name="Toplam" stroke="#1F9D55" strokeWidth={2} fill="url(#g-total)" dot={false} activeDot={{ r: 4, fill: '#1F9D55', strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="email" name="Email" stroke="#2D4FA6" strokeWidth={1.5} fill="url(#g-email)" dot={false} activeDot={{ r: 3, fill: '#2D4FA6', strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="wa" name="WA" stroke="#0284C7" strokeWidth={1.5} fill="url(#g-wa)" dot={false} activeDot={{ r: 3, fill: '#0284C7', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Intelligence */}
          <div className="bento-card flex flex-col">
            <div className="px-5 pt-5 pb-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--violet-soft)' }}>
                <Sparkles className="w-4 h-4" style={{ color: 'var(--violet)' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>AI İçgörüler</p>
                <p style={{ fontSize: 10, color: 'var(--text-3)' }}>
                  {aiInsights.length > 0 ? `${aiInsights.length} fırsat tespit edildi` : 'Analiz ediliyor...'}
                </p>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              {aiInsights.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 py-8">
                  <Sparkles className="w-7 h-7" style={{ color: 'var(--border-2)' }} />
                  <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5 }}>
                    Daha fazla veri geldikçe AI önerileri burada görünür
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {aiInsights.map((ins, i) => {
                    const Icon = ins.icon
                    return (
                      <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl transition-colors cursor-default"
                        style={{ background: ins.bg, border: `1px solid ${ins.border}` }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `color-mix(in srgb, ${ins.color} 15%, transparent)` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: ins.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: ins.color, marginBottom: 3 }}>{ins.title}</p>
                          <p style={{ fontSize: 11.5, color: 'var(--text-1)', lineHeight: 1.5 }}>{ins.text}</p>
                          <Link href={ins.href} className="inline-flex items-center gap-1 mt-2"
                            style={{ fontSize: 11, fontWeight: 600, color: ins.color }}>
                            {ins.action} <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Marketing Channels ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Pazarlama Kanalları</h2>
              <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>Kanal bazlı performans ve gelir dağılımı</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {channels.map(ch => {
              const Icon = ch.Icon
              return (
                <div key={ch.id} className="bento-card p-5 cursor-default">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `color-mix(in srgb, ${ch.hex} 10%, transparent)` }}>
                      <Icon className="w-4 h-4" style={{ color: ch.color }} />
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                      style={{
                        background: ch.active ? `color-mix(in srgb, ${ch.hex} 10%, transparent)` : 'var(--surface-2)',
                        border: `1px solid ${ch.active ? `color-mix(in srgb, ${ch.hex} 20%, transparent)` : 'var(--border)'}`,
                      }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: ch.active ? ch.color : 'var(--text-3)' }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: ch.active ? ch.color : 'var(--text-3)' }}>
                        {ch.active ? 'Aktif' : 'Kurulmadı'}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 14 }}>{ch.label}</p>
                  <div className="space-y-2.5">
                    {[
                      { l: 'Gönderim', v: formatNumber(ch.sent) },
                      { l: 'Performans', v: ch.metric },
                      { l: 'Gelir', v: ch.revenue > 0 ? formatCurrency(ch.revenue) : '—' },
                    ].map(row => (
                      <div key={row.l} className="flex justify-between items-center" style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--text-3)' }}>{row.l}</span>
                        <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                  {!ch.active && (
                    <Link href="/settings"
                      className="flex items-center justify-center gap-1.5 mt-4 py-2 rounded-xl text-[11px] font-semibold transition-colors"
                      style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
                      <Plus className="w-3 h-3" /> Kur
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Automation + Campaigns ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Automation Health */}
          <div className="bento-card">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Otomasyon Sağlığı</h2>
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>
                  {(data?.recentAutomations ?? []).filter(a => a.status === 'active').length > 0
                    ? <><span style={{ color: 'var(--success)', fontWeight: 600 }}>{(data?.recentAutomations ?? []).filter(a => a.status === 'active').length} flow</span> aktif çalışıyor</>
                    : 'Aktif flow yok'}
                </p>
              </div>
              <Link href="/automations"
                className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                Yönet <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {(data?.recentAutomations ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                  <Zap className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Henüz otomasyon kurulmadı</p>
                <Link href="/automations" className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--primary)' }}>
                  İlk otomasyonu oluştur <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="p-3 space-y-1">
                {(data?.recentAutomations ?? []).map(flow => {
                  const Icon = TRIGGER_ICONS[flow.trigger] ?? Zap
                  const colorStr = TRIGGER_COLORS[flow.trigger] ?? 'var(--violet)'
                  const convPct = flow.sent > 0 ? ((flow.converted / flow.sent) * 100).toFixed(1) : '0'
                  return (
                    <div key={flow.id}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-default transition-colors"
                      style={{ background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `color-mix(in srgb, ${colorStr} 12%, transparent)` }}>
                        <Icon className="w-4 h-4" style={{ color: colorStr }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }} className="truncate">{flow.name}</p>
                          {flow.status === 'active' && (
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--success)' }} />
                          )}
                        </div>
                        <p style={{ fontSize: 10, color: 'var(--text-3)' }}>
                          {formatNumber(flow.sent)} gönderim · <span style={{ color: colorStr }}>%{convPct} dönüşüm</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>
                          {flow.revenue > 0 ? formatCurrency(flow.revenue) : '—'}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text-3)' }}>gelir</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Campaign Performance */}
          <div className="bento-card">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Kampanya Performansı</h2>
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>Son gönderimler</p>
              </div>
              <Link href="/campaigns"
                className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                Tümü <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {(data?.recentCampaigns ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                  <Megaphone className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Henüz kampanya gönderilmedi</p>
                <Link href="/campaigns/new" className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--primary)' }}>
                  İlk kampanyayı oluştur <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div>
                {/* Table header */}
                <div className="px-5 py-2.5 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center"
                  style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  {['Kampanya', 'Açılma', 'Tıklama', 'Gelir'].map(h => (
                    <p key={h} className="label" style={{ marginBottom: 0 }}>{h}</p>
                  ))}
                </div>
                {(data?.recentCampaigns ?? []).slice(0, 5).map(camp => {
                  const openRate = camp.sent > 0 ? ((camp.opened / camp.sent) * 100).toFixed(1) : '0'
                  const clickRate = camp.sent > 0 ? ((camp.clicked / camp.sent) * 100).toFixed(1) : '0'
                  const isEmail = camp.type === 'email'
                  return (
                    <div key={camp.id}
                      className="px-5 py-3 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center transition-colors cursor-default"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: isEmail ? 'var(--primary-soft)' : 'var(--success-soft)' }}>
                          {isEmail
                            ? <Mail className="w-3 h-3" style={{ color: 'var(--primary)' }} />
                            : <MessageSquare className="w-3 h-3" style={{ color: 'var(--success)' }} />
                          }
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }} className="truncate">{camp.name}</p>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>%{openRate}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>%{clickRate}</p>
                      <p style={{ fontSize: 12, fontWeight: 700, color: camp.revenue > 0 ? 'var(--success)' : 'var(--text-3)' }}>
                        {camp.revenue > 0 ? formatCurrency(camp.revenue) : '—'}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Segment + Revenue Attribution ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="bento-card xl:col-span-3">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Segment Anlık Görünüm</h2>
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>Müşteri dağılımı</p>
              </div>
              <Link href="/segments"
                className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                Tüm segmentler <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {(data?.segments?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                  <Target className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Henüz segment oluşturulmadı</p>
                <Link href="/segments" className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--primary)' }}>
                  İlk segmenti oluştur <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {(data?.segments ?? []).map(seg => {
                  const color = SEGMENT_COLORS[seg.color] ?? '#7C3AED'
                  const SegIcon = SEGMENT_ICONS[seg.icon] ?? Users
                  const total = (data?.segments ?? []).reduce((s, x) => s + x.count, 0)
                  const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0
                  return (
                    <Link key={seg.id} href="/segments"
                      className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                      style={{ background: `color-mix(in srgb, ${color} 6%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 18%, transparent)` }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                        <SegIcon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{seg.name}</p>
                          <span style={{ fontSize: 11, fontWeight: 700, color }}>{formatNumber(seg.count)}</span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background: 'var(--border)' }}>
                          <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 10, color, fontWeight: 600, flexShrink: 0, minWidth: 28, textAlign: 'right' }}>%{pct}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bento-card xl:col-span-2 flex flex-col">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Gelir Atıfı</h2>
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>Kanal bazlı katkı</p>
              </div>
              <Link href="/analytics"
                className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                Analitik <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {attribution.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                  <BarChart3 className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Henüz gelir verisi yok</p>
              </div>
            ) : (
              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-5 h-[130px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attribution} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} width={32} />
                      <Tooltip
                        formatter={(v: number) => formatCurrency(v)}
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text-1)' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {attribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  {attribution.map(a => (
                    <div key={a.label} className="flex items-center justify-between py-2"
                      style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-2">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{a.label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{formatCurrency(a.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Live Activity + Integration Status ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="bento-card xl:col-span-3">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--success)', boxShadow: '0 0 0 3px color-mix(in srgb, var(--success) 25%, transparent)' }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Aktivite Akışı</p>
                <span className="chip chip-green" style={{ fontSize: 9, padding: '2px 6px' }}>CANLI</span>
              </div>
              <Link href="/campaigns"
                className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                Tümü <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {(data?.recentOpens ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                  <Activity className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Kampanya gönderin, aktiviteler burada görünür</p>
                <Link href="/campaigns/new" className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: 'var(--primary)' }}>
                  İlk kampanyayı oluştur <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div>
                {(data?.recentOpens ?? []).map((open, idx) => {
                  const initials = open.customer?.name
                    ? open.customer.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                    : '?'
                  const ts = new Date(open.openedAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={open.id}
                      className="px-5 py-3.5 flex items-center gap-3.5 transition-colors cursor-default"
                      style={{ borderBottom: idx < (data?.recentOpens?.length ?? 0) - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }} className="truncate">
                          {open.customer?.name ?? 'Bilinmeyen'}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-3)' }} className="truncate">
                          {open.campaign?.name ?? '—'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>
                          {open.customer?.totalSpent ? formatCurrency(open.customer.totalSpent) : '—'}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text-3)' }}>{ts}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bento-card xl:col-span-2 flex flex-col">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Entegrasyon Durumu</h2>
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 1 }}>Bağlantı sağlığı</p>
              </div>
              <Link href="/settings"
                className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                Ayarlar <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {integrationItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-12 gap-3">
                <Link2 className="w-7 h-7" style={{ color: 'var(--text-3)' }} />
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Entegrasyon verisi yükleniyor</p>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-2 flex-1">
                  {integrationItems.map((item, i) => (
                    <div key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                      style={{
                        background: item.ok ? 'var(--success-soft)' : 'var(--danger-soft)',
                        border: `1px solid color-mix(in srgb, ${item.ok ? 'var(--success)' : 'var(--danger)'} 20%, transparent)`,
                      }}>
                      {item.ok
                        ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--success)' }} />
                        : <XCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--danger)' }} />
                      }
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 11, fontWeight: 600, color: item.ok ? 'var(--success)' : 'var(--danger)' }}>{item.label}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-3)' }} className="truncate">{item.detail}</p>
                      </div>
                      {!item.ok && (
                        <Link href="/settings"
                          style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'var(--primary-soft)', color: 'var(--primary)', flexShrink: 0 }}>
                          Kur
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4">
                  <Link href="/campaigns/new"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[12px] font-semibold transition-colors"
                    style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 15%, transparent)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--primary-soft)')}>
                    <Plus className="w-3.5 h-3.5" /> Yeni Kampanya
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="bento-card p-5">
          <p className="label mb-4">Hızlı İşlemler</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {([
              { href: '/campaigns/new', icon: Megaphone, label: 'Kampanya', sub: 'Oluştur', color: 'var(--primary)', bg: 'var(--primary-soft)' },
              { href: '/automations', icon: Zap, label: 'Otomasyon', sub: 'Oluştur', color: 'var(--violet)', bg: 'var(--violet-soft)' },
              { href: '/whatsapp', icon: MessageSquare, label: 'WhatsApp', sub: 'Gönder', color: 'var(--success)', bg: 'var(--success-soft)' },
              { href: '/segments', icon: Target, label: 'Segment', sub: 'Oluştur', color: 'var(--warning)', bg: 'var(--warning-soft)' },
              { href: '/campaigns', icon: Sparkles, label: 'Kampanyalar', sub: 'Tümünü Gör', color: 'var(--accent-color)', bg: 'var(--accent-soft)' },
              { href: '/analytics', icon: BarChart3, label: 'Rapor', sub: 'Oluştur', color: 'var(--cyan)', bg: 'color-mix(in srgb, var(--cyan) 10%, transparent)' },
            ] as const).map(item => {
              const ItemIcon = item.icon
              return (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all group"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = item.bg; e.currentTarget.style.borderColor = 'transparent' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: item.bg }}>
                    <ItemIcon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div className="text-center">
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)' }}>{item.label}</p>
                    <p style={{ fontSize: 9, color: 'var(--text-3)' }}>{item.sub}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
