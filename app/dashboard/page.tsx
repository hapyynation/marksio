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
  Sparkles, ArrowUpRight, ArrowDownRight, MousePointerClick, Send,
  Eye, CheckCheck, Megaphone, ArrowRight, Link2,
  ShoppingCart, Star, Package, CheckCircle2, XCircle,
  Layers, Download, AlertOctagon,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
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
  cart_abandoned: '#DC2626', customer_created: '#16A34A',
  no_purchase_90d: '#7C3AED', no_purchase_60d: '#7C3AED',
  no_purchase_30d: '#7C3AED', no_purchase: '#7C3AED',
  order_placed: '#D97706', order_delivered: '#D97706', birthday: '#D97706',
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
      type: 'revenue', color: '#16A34A', bg: 'rgba(22,163,74,0.06)', border: 'rgba(22,163,74,0.15)',
      icon: TrendingUp, title: 'Gelir Fırsatı',
      text: `${d.stats.cartAbandons} sepet terk eden müşteri hedeflenerek gelir kurtarılabilir.`,
      action: 'Kampanya Oluştur', href: '/campaigns/new',
    })
  }
  if (d.integrationStatus && !d.integrationStatus.email.ok) {
    list.push({
      type: 'risk', color: '#D97706', bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.15)',
      icon: AlertTriangle, title: 'Risk Uyarısı',
      text: 'Email domain DNS doğrulaması yapılmadı, teslimatta sorun olabilir.',
      action: 'Ayarlar', href: '/settings',
    })
  }
  const topSegment = d.segments?.[0]
  if (topSegment && topSegment.count > 0) {
    list.push({
      type: 'segment', color: '#2563EB', bg: 'rgba(37,99,235,0.06)', border: 'rgba(37,99,235,0.15)',
      icon: Layers, title: 'Segment Önerisi',
      text: `${topSegment.count} müşteriniz "${topSegment.name}" segmentinde. Kampanya oluşturun.`,
      action: 'Segment Gör', href: '/segments',
    })
  }
  const activeAuto = d.recentAutomations?.find(a => a.status === 'active')
  if (activeAuto && activeAuto.sent > 0) {
    list.push({
      type: 'ai', color: '#7C3AED', bg: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.15)',
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
    { key: 'automation', label: 'İlk otomasyonu aktif et', href: '/automations',           done: d?.recentAutomations?.some(a => a.status === 'active') ?? false },
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

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{name:string;value:number;color:string}>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3.5 py-2.5" style={{ background:'#FFFFFF', border:'1px solid #E5E7EB', boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}>
      <p style={{ fontSize:10, fontWeight:600, marginBottom:6, color:'#9CA3AF' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4" style={{ marginBottom:2 }}>
          <span className="flex items-center gap-1.5" style={{ fontSize:11, color:'#6B7280' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:p.color, display:'inline-block' }}/>{p.name}
          </span>
          <span style={{ fontSize:11, fontWeight:700, color:'#111827' }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function KpiCard({ label, value, sub, icon: Icon, accent, accentBg, change }: {
  label:string; value:string; sub?:string; icon:React.ElementType; accent:string; accentBg:string; change?:number
}) {
  const positive = (change ?? 0) >= 0
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden cursor-default"
      style={{ background:'#FFFFFF', border:'1px solid #E5E7EB', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', transition:'all .2s' }}
      onMouseEnter={e=>{e.currentTarget.style.background='#F9FAFB';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}}
      onMouseLeave={e=>{e.currentTarget.style.background='#FFFFFF';e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'}}
    >
      <div className="absolute top-0 left-4 right-4 h-px rounded-full" style={{ background:`linear-gradient(90deg,transparent,${accent}40,transparent)` }} />
      <div className="flex items-start justify-between mb-4">
        <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', color:'#9CA3AF' }}>{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background:accentBg }}>
          <Icon className="w-4 h-4" style={{ color:accent }} />
        </div>
      </div>
      <p style={{ fontSize:26, fontWeight:700, color:'#111827', letterSpacing:'-0.03em', lineHeight:1, marginBottom:4 }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:'#9CA3AF' }}>{sub}</p>}
      {change !== undefined && change !== 0 && (
        <div className={cn('inline-flex items-center gap-1 text-[10px] font-semibold mt-3 px-2 py-1 rounded-lg')}
          style={{ color: positive ? '#16A34A':'#DC2626', background: positive ? '#DCFCE7':'#FEE2E2' }}>
          {positive ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
          %{Math.abs(change).toFixed(1)} geçen aya göre
        </div>
      )}
    </div>
  )
}

function SectionHeader({ title, sub, href, hrefLabel }: { title:string; sub?:string; href?:string; hrefLabel?:string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 style={{ fontSize:13, fontWeight:600, color:'#111827' }}>{title}</h2>
        {sub && <p style={{ fontSize:11, marginTop:2, color:'#6B7280' }}>{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-[11px] font-semibold transition-colors hover:text-blue-600"
          style={{ color:'#9CA3AF' }}>
          {hrefLabel ?? 'Tümü'} <ChevronRight className="w-3 h-3"/>
        </Link>
      )}
    </div>
  )
}

function Card({ children, className, style }: { children:React.ReactNode; className?:string; style?: React.CSSProperties }) {
  return (
    <div className={cn('rounded-2xl overflow-hidden', className)}
      style={{ background:'#FFFFFF', border:'1px solid #E5E7EB', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', ...style }}>
      {children}
    </div>
  )
}

function OnboardingSection({ onHide, checklist }: { onHide:()=>void; checklist: ChecklistItem[] }) {
  const done = checklist.filter(c => c.done).length
  const total = checklist.length
  const pct = Math.round((done / total) * 100)
  const circumference = 2 * Math.PI * 16
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:'rgba(37,99,235,0.04)', border:'1px solid rgba(37,99,235,0.14)' }}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(37,99,235,0.12)" strokeWidth="3"/>
                <circle cx="20" cy="20" r="16" fill="none" stroke="#2563EB" strokeWidth="3"
                  strokeDasharray={circumference} strokeDashoffset={circumference*(1-pct/100)}
                  strokeLinecap="round" className="transition-all duration-700"/>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color:'#2563EB' }}>{done}/{total}</span>
            </div>
            <div>
              <p style={{ fontSize:13, fontWeight:600, color:'#111827' }}>Kurulum Tamamlama</p>
              <p style={{ fontSize:11, color:'#9CA3AF' }}>%{pct} tamamlandı · hızlı kur, hızlı kazan</p>
            </div>
          </div>
          <button onClick={onHide} style={{ fontSize:11, padding:'4px 10px', borderRadius:6, color:'#6B7280', background:'#F3F4F6', border:'1px solid #E5E7EB' }}>Gizle</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {checklist.map((item, i) => (
            <Link key={item.key} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
              style={{ background: item.done ? 'rgba(22,163,74,0.06)' : '#FFFFFF', border: item.done ? '1px solid rgba(22,163,74,0.2)' : '1px solid #E5E7EB' }}>
              <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0', item.done ? '' : '')}
                style={{ background: item.done ? 'rgba(22,163,74,0.15)' : '#F3F4F6', border: item.done ? '1px solid rgba(22,163,74,0.3)' : '1px solid #E5E7EB' }}>
                {item.done ? <CheckCheck className="w-2.5 h-2.5" style={{ color:'#16A34A' }}/> : <span style={{ fontSize:9, fontWeight:700, color:'#9CA3AF' }}>{i+1}</span>}
              </div>
              <span style={{ fontSize:11, fontWeight:500, color: item.done ? '#16A34A' : '#374151', textDecoration: item.done ? 'line-through' : 'none' }}>
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
      .then(r => { if (!r.ok) throw new Error('server_error'); return r.json() })
      .then((d: DashboardData) => { if (!d?.stats) throw new Error('invalid_data'); setData(d) })
      .catch(e => { if (e.name !== 'AbortError') setError('Veriler yüklenemedi') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [retryKey])

  const email = data?.channelStats?.email ?? { sent:0, opened:0, clicked:0, openRate:0, clickRate:0, revenue:0 }
  const wa    = data?.channelStats?.whatsapp ?? { sent:0, revenue:0 }
  const rev   = data?.revenueChart ?? []
  const totalRevenue  = data?.stats?.revenue?.value ?? 0
  const campaignRev   = data?.kpiExtended?.emailRevenue ?? 0
  const automationRev = data?.kpiExtended?.automationRevenue ?? 0
  const waRev         = data?.kpiExtended?.waRevenue ?? wa.revenue
  const emailPct = totalRevenue > 0 ? campaignRev / totalRevenue : 0
  const waPct    = totalRevenue > 0 ? waRev / totalRevenue : 0

  const chartData  = useMemo(() => buildChart(rev, timeRange, emailPct, waPct), [timeRange, rev, emailPct, waPct])
  const aiInsights = useMemo(() => data ? buildInsights(data) : [], [data])
  const checklist  = useMemo(() => buildChecklist(data), [data])
  const allDone    = checklist.every(c => c.done)

  const channels = useMemo(() => {
    const automationSent   = (data?.recentAutomations ?? []).reduce((s, a) => s + a.sent, 0)
    const automationActive = (data?.recentAutomations ?? []).some(a => a.status === 'active')
    return [
      { id:'email',     label:'Email',     Icon:Mail,          sent:email.sent, conv:email.openRate, revenue:email.revenue, status:(email.sent > 0 ? 'active':'inactive') as 'active'|'inactive', color:'#2563EB' },
      { id:'whatsapp',  label:'WhatsApp',  Icon:MessageSquare, sent:wa.sent,    conv:0,              revenue:wa.revenue,    status:(wa.sent > 0 ? 'active':'inactive') as 'active'|'inactive',    color:'#16A34A' },
      { id:'auto',      label:'Otomasyon', Icon:Zap,           sent:automationSent, conv:0,         revenue:automationRev, status:(automationActive ? 'active':'inactive') as 'active'|'inactive', color:'#7C3AED' },
    ]
  }, [data, email, wa, automationRev])

  const attribution = useMemo(() => {
    if (!data?.kpiExtended) return []
    return [
      { label:'Email',     value:data.kpiExtended.emailRevenue,      color:'#2563EB' },
      { label:'WhatsApp',  value:data.kpiExtended.waRevenue,         color:'#16A34A' },
      { label:'Otomasyon', value:data.kpiExtended.automationRevenue, color:'#7C3AED' },
    ].filter(a => a.value > 0)
  }, [data])

  const integrationItems = useMemo(() => {
    const s = data?.integrationStatus
    if (!s) return []
    return [
      { label:'Shopify Bağlantısı',          ok:s.shopify.ok,                        detail:s.shopify.ok ? (s.shopify.detail ?? 'Bağlı') : 'Bağlı değil' },
      { label:'Müşteri Senkronizasyonu',      ok:s.shopify.ok && s.customerCount > 0, detail:s.shopify.ok ? `${formatNumber(s.customerCount)} müşteri senkron` : 'Mağaza bağlı değil' },
      { label:'Email Domain',                 ok:s.email.ok,                          detail:s.email.detail ? (s.email.ok ? `${s.email.detail} doğrulandı` : 'DNS doğrulaması bekleniyor') : 'Domain eklenmedi' },
      { label:'WhatsApp API',                 ok:s.whatsapp.ok,                       detail:s.whatsapp.ok ? 'Meta Business hesabı bağlı' : 'Meta Business hesabı bağlı değil' },
    ]
  }, [data])

  const today = new Date().toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' })

  if (loading) return <AppShell><div className="p-6 pt-4"><DashboardSkeleton/></div></AppShell>

  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center flex-1 p-6 gap-4">
          <AlertOctagon className="w-10 h-10" style={{ color:'#DC2626' }}/>
          <p style={{ fontSize:15, fontWeight:600, color:'#111827' }}>Dashboard yüklenemedi</p>
          <p style={{ fontSize:13, color:'#6B7280' }}>{error}</p>
          <button onClick={() => setRetryKey(k => k+1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
            style={{ background:'#DBEAFE', color:'#2563EB', border:'1px solid #BFDBFE' }}>
            <RefreshCw className="w-3.5 h-3.5"/> Tekrar Dene
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 h-14 shrink-0 gap-2"
        style={{ background:'rgba(255,255,255,0.97)', backdropFilter:'blur(24px)', borderBottom:'1px solid #E5E7EB' }}>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined" style={{ fontSize:16, color:'#9CA3AF' }}>space_dashboard</span>
          <span style={{ fontSize:12, fontWeight:600, color:'#111827' }}>Genel Bakış</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background:'#F3F4F6', border:'1px solid #E5E7EB' }}>
            {([{id:'24h' as TimeRange,label:'24s'},{id:'1w' as TimeRange,label:'7g'},{id:'1m' as TimeRange,label:'30g'}]).map(tr => (
              <button key={tr.id} onClick={() => setTimeRange(tr.id)}
                className="px-3 py-1 rounded-md text-[11px] font-semibold transition-all"
                style={timeRange===tr.id ? {background:'#FFFFFF',color:'#111827',boxShadow:'0 1px 3px rgba(0,0,0,0.08)'} : {color:'#6B7280'}}>
                {tr.label}
              </button>
            ))}
          </div>
          <button className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium btn-secondary">
            <Download className="w-3.5 h-3.5"/> Raporu İndir
          </button>
          <Link href="/campaigns/new"
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold"
            style={{ background:'#2563EB', color:'#fff' }}>
            <Plus className="w-3.5 h-3.5"/> Kampanya Oluştur
          </Link>
        </div>
      </div>

      <div className="p-6 pb-12 space-y-8 flex-1 max-w-[1400px] mx-auto w-full">

        {/* Hero */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p style={{ fontSize:11, fontWeight:500, color:'#9CA3AF', marginBottom:4 }}>{today}</p>
            <div className="flex items-center gap-3 mb-1">
              <Image src="/marksio-logo.png" alt="Marksio" width={36} height={36} className="rounded-[10px]" style={{ objectFit:'contain' }}/>
              <h1 style={{ fontSize:22, fontWeight:700, color:'#111827', letterSpacing:'-0.025em' }}>
                {firstName ? `Merhaba, ${firstName}.` : 'Dashboard'}
                {' '}<span style={{ background:'linear-gradient(135deg,#2563EB,#7C3AED)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  AI Growth OS
                </span>
              </h1>
            </div>
            <p style={{ fontSize:13, color:'#6B7280' }}>Tüm pazarlama kanallarınız tek ekranda</p>
          </div>
          {data?.integration ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background:'#DCFCE7', border:'1px solid #BBF7D0' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background:'#16A34A' }}/>
              <span style={{ fontSize:12, fontWeight:500, color:'#16A34A' }}>{data.integration.shopDomain}</span>
            </div>
          ) : (
            <Link href="/settings"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:border-blue-300"
              style={{ background:'#FFFFFF', border:'1px solid #E5E7EB', color:'#6B7280' }}>
              <ShoppingBag className="w-3.5 h-3.5"/>
              <span style={{ fontSize:12, fontWeight:500 }}>Mağaza bağla</span>
            </Link>
          )}
        </div>

        {/* Onboarding checklist */}
        {!allDone && showChecklist && (
          <OnboardingSection onHide={() => setShowChecklist(false)} checklist={checklist}/>
        )}

        {/* ── 1. KPI Cards ── */}
        <section>
          <SectionHeader title="Growth Command Center" sub="Tüm gelir ve büyüme metrikleri"/>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <KpiCard label="Toplam Gelir"     value={formatCurrency(totalRevenue)}  sub="son 30 gün"        icon={TrendingUp}    accent="#16A34A" accentBg="rgba(22,163,74,0.1)"   change={data?.stats?.revenue?.change ?? 0}/>
            <KpiCard label="Kampanya Geliri"  value={formatCurrency(campaignRev)}   sub="email + WhatsApp"  icon={Megaphone}     accent="#2563EB" accentBg="rgba(37,99,235,0.1)"  change={0}/>
            <KpiCard label="Otomasyon Geliri" value={formatCurrency(automationRev)} sub="aktif flow'lardan" icon={Zap}           accent="#7C3AED" accentBg="rgba(124,58,237,0.1)" change={0}/>
            <KpiCard label="WhatsApp Geliri"  value={formatCurrency(waRev)}         sub="mesaj dönüşümü"    icon={MessageSquare} accent="#0891B2" accentBg="rgba(8,145,178,0.1)"  change={0}/>
          </div>
        </section>

        {/* ── Secondary Metrics ── */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3" style={{ marginTop: '-16px' }}>
          {([
            { label:'Müşteri Büyümesi',    value:`+${data?.stats?.customers?.newThisMonth ?? 0}`,         sub:'bu ay',               icon:Users,         color:'#EA580C', change:data?.stats?.customers?.change ?? 0 },
            { label:'Dönüşüm Oranı',       value:`%${email.clickRate}`,                                   sub:'email tıklama oranı', icon:Target,        color:'#D97706', change:0 },
            { label:'Sepet Terk Oranı',    value:`%${data?.kpiExtended?.cartAbandonRate ?? 0}`,           sub:'son 30 gün',          icon:ShoppingCart,  color:'#DC2626', change:0 },
            { label:'Ort. Sipariş Tutarı', value:formatCurrency(data?.kpiExtended?.avgOrderValue ?? 0),  sub:'müşteri başı',        icon:ShoppingBag,   color:'#16A34A', change:0 },
            { label:'Aktif Abone',         value:formatNumber(data?.kpiExtended?.activeSubscribers ?? 0), sub:'email listesi',       icon:Mail,          color:'#2563EB', change:0 },
            { label:'WhatsApp Abone',      value:formatNumber(data?.kpiExtended?.waSubscribers ?? 0),     sub:'opt-in listesi',      icon:MessageSquare, color:'#16A34A', change:0 },
          ] as const).map(m => {
            const MIcon = m.icon
            const pos = m.change >= 0
            return (
              <div key={m.label} className="flex items-center gap-3 rounded-2xl p-4 cursor-default"
                style={{ background:'#FFFFFF', border:'1px solid #E5E7EB', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background:`${m.color}12` }}>
                  <MIcon className="w-4 h-4" style={{ color:m.color }}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize:10, color:'#9CA3AF' }}>{m.label}</p>
                  <p style={{ fontSize:16, fontWeight:700, color:'#111827', letterSpacing:'-0.02em' }}>{m.value}</p>
                  <p style={{ fontSize:9, color:'#9CA3AF' }}>{m.sub}</p>
                </div>
                {m.change !== 0 && (
                  <div className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                    style={{ color:pos ? '#16A34A':'#DC2626', background:pos ? '#DCFCE7':'#FEE2E2' }}>
                    {pos ? <ArrowUpRight className="w-2.5 h-2.5"/> : <ArrowDownRight className="w-2.5 h-2.5"/>}
                    %{Math.abs(m.change)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Revenue Chart + AI ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2">
            <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4" style={{ borderBottom:'1px solid #F3F4F6' }}>
              <div>
                <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6, color:'#9CA3AF' }}>Gelir Dağılımı</p>
                <div className="flex items-center gap-4 flex-wrap">
                  {[{color:'#16A34A',label:'Toplam'},{color:'#2563EB',label:'Email'},{color:'#0891B2',label:'WhatsApp'}].map(l => (
                    <span key={l.label} className="flex items-center gap-1.5" style={{ fontSize:11, color:'#6B7280' }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:l.color, display:'inline-block' }}/> {l.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p style={{ fontSize:10, color:'#9CA3AF' }}>30 Gün Toplam</p>
                <p style={{ fontSize:16, fontWeight:700, color:'#16A34A' }}>{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
            <div className="px-4 pb-5 pt-4">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top:4, right:4, bottom:0, left:-16 }}>
                  <defs>
                    {[['grad-total','#16A34A',0.12],['grad-email','#2563EB',0.1],['grad-wa','#0891B2',0.1]].map(([id,c,op]) => (
                      <linearGradient key={id as string} id={id as string} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={c as string} stopOpacity={op as number}/>
                        <stop offset="100%" stopColor={c as string} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize:10, fill:'#9CA3AF' }} tickLine={false} axisLine={false}
                    interval={chartData.length > 14 ? Math.floor(chartData.length/6) : 0}/>
                  <YAxis tick={{ fontSize:10, fill:'#9CA3AF' }} tickLine={false} axisLine={false} width={36}/>
                  <Tooltip content={<ChartTooltip/>} cursor={{ stroke:'rgba(0,0,0,0.06)', strokeWidth:1 }}/>
                  <Area type="monotone" dataKey="rev"   name="Toplam" stroke="#16A34A" strokeWidth={1.5} fill="url(#grad-total)" dot={false} activeDot={{ r:3, fill:'#16A34A', strokeWidth:0 }}/>
                  <Area type="monotone" dataKey="email" name="Email"  stroke="#2563EB" strokeWidth={1.5} fill="url(#grad-email)" dot={false} activeDot={{ r:3, fill:'#2563EB', strokeWidth:0 }}/>
                  <Area type="monotone" dataKey="wa"    name="WA"     stroke="#0891B2" strokeWidth={1.5} fill="url(#grad-wa)"    dot={false} activeDot={{ r:3, fill:'#0891B2', strokeWidth:0 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* AI Intelligence */}
          <Card className="flex flex-col">
            <div className="px-5 pt-5 pb-4 flex items-center gap-3" style={{ borderBottom:'1px solid #F3F4F6' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background:'#EDE9FE' }}>
                <Sparkles className="w-4 h-4" style={{ color:'#7C3AED' }}/>
              </div>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:'#111827' }}>AI İçgörüler</p>
                <p style={{ fontSize:10, color:'#9CA3AF' }}>{aiInsights.length > 0 ? `${aiInsights.length} fırsat` : 'henüz içgörü yok'}</p>
              </div>
            </div>
            <div className="p-4 flex-1">
              {aiInsights.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                  <Sparkles className="w-6 h-6" style={{ color:'#D1D5DB' }}/>
                  <p style={{ fontSize:12, color:'#9CA3AF', textAlign:'center' }}>Daha fazla veri geldikçe AI önerileri burada görünür</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {aiInsights.map((ins, i) => {
                    const Icon = ins.icon
                    return (
                      <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl cursor-default transition-all"
                        style={{ background:ins.bg, border:`1px solid ${ins.border}` }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background:`${ins.color}12` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color:ins.color }}/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', color:ins.color, marginBottom:4 }}>{ins.title}</p>
                          <p style={{ fontSize:11.5, color:'#374151', lineHeight:1.5 }}>{ins.text}</p>
                          <Link href={ins.href} className="inline-flex items-center gap-1 mt-2" style={{ fontSize:10, fontWeight:600, color:ins.color }}>
                            {ins.action} <ArrowRight className="w-2.5 h-2.5"/>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Marketing Channels ── */}
        <section>
          <SectionHeader title="Pazarlama Kanalları" sub="Tüm kanallar ve performansları"/>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {channels.map(ch => {
              const Icon = ch.Icon
              const active = ch.status === 'active'
              return (
                <div key={ch.id} className="relative rounded-2xl p-5 cursor-default"
                  style={{ background:'#FFFFFF', border:`1px solid ${active ? `${ch.color}20` : '#E5E7EB'}`, transition:'all .2s', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}
                  onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}}
                  onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)'}}>
                  <div className="absolute top-0 left-4 right-4 h-px rounded-full" style={{ background:`linear-gradient(90deg,transparent,${ch.color}30,transparent)`}}/>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:`${ch.color}12` }}>
                      <Icon className="w-4 h-4" style={{ color:ch.color }}/>
                    </div>
                    <span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', padding:'3px 8px', borderRadius:9999, background:active ? `${ch.color}12` : '#F3F4F6', color:active ? ch.color : '#9CA3AF', border:`1px solid ${active ? `${ch.color}20` : '#E5E7EB'}` }}>
                      {active ? 'Aktif' : 'Kurulmadı'}
                    </span>
                  </div>
                  <p style={{ fontSize:13, fontWeight:600, color:'#111827', marginBottom:12 }}>{ch.label}</p>
                  <div className="space-y-2">
                    {[{l:'Gönderim',v:formatNumber(ch.sent),c:'#374151'},{l:'Açılma/Tıklama',v:ch.conv > 0 ? `%${ch.conv}` : '—',c:active ? ch.color : '#9CA3AF'},{l:'Gelir',v:ch.revenue > 0 ? formatCurrency(ch.revenue) : '—',c:'#16A34A'}].map(row => (
                      <div key={row.l} className="flex justify-between" style={{ fontSize:11 }}>
                        <span style={{ color:'#9CA3AF' }}>{row.l}</span>
                        <span style={{ color:row.c, fontWeight:600 }}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                  {!active && (
                    <Link href="/settings" className="flex items-center justify-center gap-1.5 mt-4 py-2 rounded-xl text-[11px] font-semibold"
                      style={{ background:'#DBEAFE', color:'#2563EB', border:'1px solid #BFDBFE' }}>
                      <Plus className="w-3 h-3"/> Kur
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Segment Snapshot + Revenue Attribution ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <Card className="xl:col-span-3">
            <div className="px-5 py-4" style={{ borderBottom:'1px solid #F3F4F6' }}>
              <SectionHeader title="Segment Anlık Görünüm" href="/segments" hrefLabel="Tüm segmentler"/>
            </div>
            {(data?.segments?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <Target className="w-7 h-7" style={{ color:'#D1D5DB' }}/>
                <p style={{ fontSize:13, color:'#9CA3AF' }}>Henüz segment oluşturulmadı</p>
                <Link href="/segments" className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color:'#2563EB' }}>
                  İlk segmenti oluştur <ArrowRight className="w-3.5 h-3.5"/>
                </Link>
              </div>
            ) : (
              <div className="p-5 space-y-2.5">
                {(data?.segments ?? []).map(seg => {
                  const color = SEGMENT_COLORS[seg.color] ?? '#7C3AED'
                  const SegIcon = SEGMENT_ICONS[seg.icon] ?? Users
                  const total = (data?.segments ?? []).reduce((s, x) => s + x.count, 0)
                  const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0
                  return (
                    <Link key={seg.id} href="/segments"
                      className="flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-80"
                      style={{ background:`${color}08`, border:`1px solid ${color}20` }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background:`${color}12` }}>
                        <SegIcon className="w-3.5 h-3.5" style={{ color }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p style={{ fontSize:12, fontWeight:600, color:'#111827' }}>{seg.name}</p>
                          <span style={{ fontSize:11, fontWeight:700, color }}>{formatNumber(seg.count)}</span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background:'#E5E7EB' }}>
                          <div className="h-1 rounded-full transition-all duration-700" style={{ width:`${pct}%`, background:color }}/>
                        </div>
                      </div>
                      <span style={{ fontSize:10, color, flexShrink:0 }}>%{pct}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="xl:col-span-2 flex flex-col">
            <div className="px-5 py-4" style={{ borderBottom:'1px solid #F3F4F6' }}>
              <SectionHeader title="Gelir Atıfı" href="/analytics"/>
            </div>
            {attribution.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-14 gap-3">
                <BarChart3 className="w-7 h-7" style={{ color:'#D1D5DB' }}/>
                <p style={{ fontSize:13, color:'#9CA3AF' }}>Henüz gelir verisi yok</p>
              </div>
            ) : (
              <div className="p-5 flex-1">
                <div className="mb-4 h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attribution} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                      <XAxis dataKey="label" tick={{ fontSize:9, fill:'#9CA3AF' }} tickLine={false} axisLine={false}/>
                      <YAxis tick={{ fontSize:9, fill:'#9CA3AF' }} tickLine={false} axisLine={false} width={32}/>
                      <Tooltip formatter={(v:number) => formatCurrency(v)} contentStyle={{ background:'#FFFFFF', border:'1px solid #E5E7EB', borderRadius:8, fontSize:11 }}/>
                      <Bar dataKey="value" radius={[4,4,0,0]}>
                        {attribution.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {attribution.map(a => (
                    <div key={a.label} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span style={{ width:8, height:8, borderRadius:'50%', background:a.color, display:'inline-block' }}/>
                        <span style={{ fontSize:12, color:'#6B7280' }}>{a.label}</span>
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:'#111827' }}>{formatCurrency(a.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ── Automation Health + Campaign Performance ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <div className="px-5 py-4" style={{ borderBottom:'1px solid #F3F4F6' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 style={{ fontSize:13, fontWeight:600, color:'#111827' }}>Otomasyon Sağlığı</h2>
                  <p style={{ fontSize:11, marginTop:2, color:'#6B7280' }}>
                    {(data?.recentAutomations ?? []).filter(a => a.status === 'active').length > 0 ? (
                      <span style={{ color:'#16A34A', fontWeight:600 }}>{(data?.recentAutomations ?? []).filter(a => a.status === 'active').length} aktif flow</span>
                    ) : 'Aktif flow yok'}{' '}çalışıyor
                  </p>
                </div>
                <Link href="/automations" className="flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-blue-600 transition-colors">
                  Yönet <ChevronRight className="w-3 h-3"/>
                </Link>
              </div>
            </div>
            {(data?.recentAutomations ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <Zap className="w-7 h-7" style={{ color:'#D1D5DB' }}/>
                <p style={{ fontSize:13, color:'#9CA3AF' }}>Henüz otomasyon kurulmadı</p>
                <Link href="/automations" className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color:'#2563EB' }}>
                  İlk otomasyonu oluştur <ArrowRight className="w-3.5 h-3.5"/>
                </Link>
              </div>
            ) : (
              <div className="p-5 space-y-3">
                {(data?.recentAutomations ?? []).map((flow) => {
                  const Icon = TRIGGER_ICONS[flow.trigger] ?? Zap
                  const color = TRIGGER_COLORS[flow.trigger] ?? '#7C3AED'
                  const convPct = flow.sent > 0 ? ((flow.converted / flow.sent) * 100).toFixed(1) : '0'
                  return (
                    <div key={flow.id} className="flex items-center gap-3 p-3.5 rounded-xl transition-all cursor-default"
                      style={{ background:'#F9FAFB', border:'1px solid #E5E7EB' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='#F3F4F6')}
                      onMouseLeave={e=>(e.currentTarget.style.background='#F9FAFB')}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background:`${color}12` }}>
                        <Icon className="w-4 h-4" style={{ color }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p style={{ fontSize:12, fontWeight:600, color:'#111827' }} className="truncate">{flow.name}</p>
                          {flow.status === 'active' && <span style={{ width:6, height:6, borderRadius:'50%', background:'#16A34A', flexShrink:0 }}/>}
                        </div>
                        <div className="flex items-center gap-3" style={{ fontSize:10, color:'#9CA3AF' }}>
                          <span>{formatNumber(flow.sent)} gönderim</span>
                          <span style={{ color }}> %{convPct} dönüşüm</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p style={{ fontSize:13, fontWeight:700, color:'#16A34A' }}>{flow.revenue > 0 ? formatCurrency(flow.revenue) : '—'}</p>
                        <p style={{ fontSize:10, color:'#9CA3AF' }}>gelir</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card>
            <div className="px-5 py-4" style={{ borderBottom:'1px solid #F3F4F6' }}>
              <SectionHeader title="Kampanya Performansı" href="/campaigns"/>
            </div>
            {(data?.recentCampaigns ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <Megaphone className="w-7 h-7" style={{ color:'#D1D5DB' }}/>
                <p style={{ fontSize:13, color:'#9CA3AF' }}>Henüz kampanya gönderilmedi</p>
                <Link href="/campaigns/new" className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color:'#2563EB' }}>
                  İlk kampanyayı oluştur <ArrowRight className="w-3.5 h-3.5"/>
                </Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor:'#F3F4F6' }}>
                {(data?.recentCampaigns ?? []).slice(0, 4).map((camp) => {
                  const openRate  = camp.sent > 0 ? ((camp.opened  / camp.sent) * 100).toFixed(1) : '0'
                  const clickRate = camp.sent > 0 ? ((camp.clicked / camp.sent) * 100).toFixed(1) : '0'
                  const isEmail   = camp.type === 'email'
                  return (
                    <div key={camp.id} className="px-5 py-3.5 flex items-center gap-3 transition-all cursor-default"
                      onMouseEnter={e=>(e.currentTarget.style.background='#F9FAFB')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: isEmail ? '#DBEAFE' : '#DCFCE7' }}>
                        {isEmail ? <Mail className="w-3.5 h-3.5" style={{ color:'#2563EB' }}/> : <MessageSquare className="w-3.5 h-3.5" style={{ color:'#16A34A' }}/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize:12, fontWeight:600, color:'#111827' }} className="truncate mb-1">{camp.name}</p>
                        <div className="flex items-center gap-3" style={{ fontSize:10, color:'#9CA3AF' }}>
                          <span>%{openRate} açılma</span>
                          <span>%{clickRate} tıklama</span>
                        </div>
                      </div>
                      <p style={{ fontSize:13, fontWeight:700, color:'#16A34A', flexShrink:0 }}>
                        {camp.revenue > 0 ? formatCurrency(camp.revenue) : '—'}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ── Quick Actions ── */}
        <div className="rounded-2xl px-5 py-4" style={{ background:'#FFFFFF', border:'1px solid #E5E7EB', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', marginBottom:12 }}>Hızlı İşlemler</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {([
              { href:'/campaigns/new',    icon:Megaphone,     label:'Yeni Kampanya', sub:'Oluştur',    color:'#2563EB', bg:'#DBEAFE' },
              { href:'/automations/new',  icon:Zap,           label:'Otomasyon',     sub:'Oluştur',    color:'#7C3AED', bg:'#EDE9FE' },
              { href:'/whatsapp',         icon:MessageSquare, label:'WhatsApp',      sub:'Gönder',     color:'#0891B2', bg:'#CFFAFE' },
              { href:'/segments',         icon:Target,        label:'Segment',       sub:'Oluştur',    color:'#16A34A', bg:'#DCFCE7' },
              { href:'/campaigns',        icon:Sparkles,      label:'Kampanyalar',   sub:'Tümünü Gör', color:'#D97706', bg:'#FEF3C7' },
              { href:'/analytics',        icon:BarChart3,     label:'Rapor',         sub:'Oluştur',    color:'#EA580C', bg:'#FFEDD5' },
            ] as const).map(item => {
              const ItemIcon = item.icon
              return (
                <Link key={item.href} href={item.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                  style={{ background:'#F9FAFB', border:'1px solid #E5E7EB' }}
                  onMouseEnter={e=>{e.currentTarget.style.background=item.bg;e.currentTarget.style.borderColor='transparent'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#F9FAFB';e.currentTarget.style.borderColor='#E5E7EB'}}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:item.bg }}>
                    <ItemIcon className="w-4 h-4" style={{ color:item.color }}/>
                  </div>
                  <div className="text-center">
                    <p style={{ fontSize:11, fontWeight:600, color:'#111827' }}>{item.label}</p>
                    <p style={{ fontSize:9, color:'#9CA3AF' }}>{item.sub}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── Activity + Integration Status ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <Card className="xl:col-span-3">
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom:'1px solid #F3F4F6' }}>
              <div className="flex items-center gap-2.5">
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#16A34A', animation:'pulse 2s infinite', display:'inline-block' }}/>
                <p style={{ fontSize:13, fontWeight:600, color:'#111827' }}>Aktivite Akışı</p>
                <span style={{ fontSize:9, fontWeight:700, padding:'2px 6px', borderRadius:4, background:'#DCFCE7', color:'#16A34A', border:'1px solid #BBF7D0' }}>LIVE</span>
              </div>
              <Link href="/campaigns" className="text-[11px] font-semibold text-gray-400 hover:text-blue-600 transition-colors">
                Tümü <ChevronRight className="w-3 h-3 inline"/>
              </Link>
            </div>
            {(data?.recentOpens ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <Activity className="w-7 h-7" style={{ color:'#D1D5DB' }}/>
                <p style={{ fontSize:13, color:'#9CA3AF' }}>Kampanya gönderin, aktiviteler burada görünür</p>
                <Link href="/campaigns/new" className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color:'#2563EB' }}>
                  İlk kampanyayı oluştur <ArrowRight className="w-3.5 h-3.5"/>
                </Link>
              </div>
            ) : (
              <div>
                {(data?.recentOpens ?? []).map((open, idx) => {
                  const initials = open.customer?.name
                    ? open.customer.name.split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase() : '?'
                  const ts = new Date(open.openedAt).toLocaleString('tr-TR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
                  return (
                    <div key={open.id}
                      className="px-5 py-3.5 flex items-center gap-3.5 transition-all cursor-default"
                      style={{ borderBottom: idx < (data?.recentOpens?.length ?? 0)-1 ? '1px solid #F3F4F6' : 'none' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='#F9FAFB')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background:'#F3F4F6', border:'1px solid #E5E7EB', color:'#6B7280' }}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize:13, fontWeight:600, color:'#111827' }} className="truncate">{open.customer?.name ?? 'Bilinmeyen'}</p>
                        <p style={{ fontSize:11, color:'#9CA3AF' }} className="truncate">{open.campaign?.name ?? '—'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p style={{ fontSize:13, fontWeight:700, color:'#16A34A' }}>
                          {open.customer?.totalSpent ? formatCurrency(open.customer.totalSpent) : '—'}
                        </p>
                        <p style={{ fontSize:10, color:'#9CA3AF' }}>{ts}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="xl:col-span-2 flex flex-col">
            <div className="px-5 py-4" style={{ borderBottom:'1px solid #F3F4F6' }}>
              <SectionHeader title="Entegrasyon Durumu" href="/settings" hrefLabel="Ayarlar"/>
            </div>
            {integrationItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-14 gap-3">
                <Link2 className="w-7 h-7" style={{ color:'#D1D5DB' }}/>
                <p style={{ fontSize:13, color:'#9CA3AF' }}>Entegrasyon verisi yükleniyor</p>
              </div>
            ) : (
              <>
                <div className="p-5 space-y-2 flex-1">
                  {integrationItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all"
                      style={{ background: item.ok ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${item.ok ? '#BBF7D0' : '#FECACA'}` }}>
                      {item.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color:'#16A34A' }}/> : <XCircle className="w-4 h-4 shrink-0" style={{ color:'#DC2626' }}/>}
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize:11, fontWeight:600, color:item.ok ? '#111827' : '#DC2626' }}>{item.label}</p>
                        <p style={{ fontSize:10, color:'#9CA3AF' }} className="truncate">{item.detail}</p>
                      </div>
                      {!item.ok && (
                        <Link href="/settings" style={{ fontSize:10, fontWeight:600, padding:'3px 8px', borderRadius:6, background:'#DBEAFE', color:'#2563EB', flexShrink:0 }}>
                          Kur
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
                <div className="px-5 pb-5">
                  <Link href="/campaigns/new"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[12px] font-semibold transition-all hover:bg-blue-50"
                    style={{ background:'#F0F6FF', color:'#2563EB', border:'1px solid #BFDBFE' }}>
                    <Plus className="w-3.5 h-3.5"/> Yeni Kampanya
                  </Link>
                </div>
              </>
            )}
          </Card>
        </div>

      </div>
    </AppShell>
  )
}
