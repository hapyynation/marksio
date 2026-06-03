'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, Mail, MessageSquare, Zap,
  ShoppingBag, AlertTriangle, RefreshCw, Crown, Heart, AlertOctagon,
  Flame, Circle, Plus, ChevronRight, BarChart3, Target, Activity,
  Sparkles, ArrowUpRight, ArrowDownRight, MousePointerClick, Send,
  Eye, CheckCheck, Megaphone, ArrowRight, Cpu, Globe, Link2,
  ShoppingCart, Star, Bell, Package, CheckCircle2, XCircle,
  Clock, Play, Pause, LayoutGrid, Layers, Radio, Download,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import AppShell from '@/components/layout/AppShell'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { useSession } from '@/lib/hooks/use-session'
import LiveActivityDashboard from '@/components/ui/live-activity-dashboard'
import { DashboardSkeleton } from '@/components/ui/page-skeleton'

/* ─── Types ─── */
interface RecentOpen {
  id: string; openedAt: string; channel: string
  campaign: { name: string; type: string }
  customer: { name: string; email: string; segment: string; totalSpent: number } | null
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
  kpiExtended?: {
    emailRevenue: number; waRevenue: number; automationRevenue: number; totalRevenue: number
    cartAbandonRate: number; activeSubscribers: number; waSubscribers: number
  }
}
type Tab = 'overview' | 'live'
type TimeRange = '1m' | '1w' | '24h'

/* ─── Demo enrichment ─── */
const DEMO_ATTRIBUTION = [
  { label: 'Email',      value: 84200,  color: '#99b4ff' },
  { label: 'WhatsApp',   value: 42800,  color: '#2dd4bf' },
  { label: 'Otomasyon',  value: 38600,  color: '#a78bfa' },
  { label: 'Kampanya',   value: 27100,  color: '#fb923c' },
  { label: 'Organik',    value: 9300,   color: '#34d399' },
]

const DEMO_SEGMENTS = [
  { key: 'vip',      label: 'VIP',           count: 142, pct: 11, icon: Crown,        color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.2)'   },
  { key: 'abandon',  label: 'Sepet Terk',    count: 384, pct: 31, icon: ShoppingCart, color: '#f87171', bg: 'rgba(248,113,113,0.08)',  border: 'rgba(248,113,113,0.2)'  },
  { key: 'inactive', label: 'Pasif',         count: 291, pct: 23, icon: Circle,       color: '#666680', bg: 'rgba(102,102,128,0.08)',  border: 'rgba(102,102,128,0.2)'  },
  { key: 'intent',   label: 'Yüksek Niyet',  count: 167, pct: 13, icon: Target,       color: '#a78bfa', bg: 'rgba(167,139,250,0.08)',  border: 'rgba(167,139,250,0.2)'  },
  { key: 'active30', label: 'Son 30 Gün',    count: 263, pct: 21, icon: Flame,        color: '#34d399', bg: 'rgba(52,211,153,0.08)',   border: 'rgba(52,211,153,0.2)'   },
]

const DEMO_FLOWS = [
  { name: 'Sepet Terk',    status: 'active', sent: 1240, conv: 18.4, revenue: 32400, icon: ShoppingCart, color: '#f87171' },
  { name: 'Hoş Geldin',    status: 'active', sent: 880,  conv: 24.1, revenue: 18700, icon: Heart,        color: '#34d399' },
  { name: 'Win-back',      status: 'active', sent: 540,  conv: 12.8, revenue: 11200, icon: RefreshCw,    color: '#a78bfa' },
  { name: 'Sipariş Sonrası', status: 'active', sent: 920, conv: 31.2, revenue: 24800, icon: Package,     color: '#fb923c' },
]

const DEMO_INTEGRATIONS = [
  { label: 'Shopify Bağlantısı',      ok: true,  detail: 'mystore.myshopify.com' },
  { label: 'Müşteri Senkronizasyonu', ok: true,  detail: '1,248 müşteri senkron' },
  { label: 'Ürün Senkronizasyonu',    ok: true,  detail: '384 ürün aktarıldı' },
  { label: 'Email Domain',            ok: false, detail: 'DNS doğrulaması bekleniyor' },
  { label: 'WhatsApp API',            ok: false, detail: 'Meta Business hesabı bağlı değil' },
]

const DEMO_AI_INSIGHTS = [
  { type: 'revenue', color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.15)', icon: TrendingUp,   title: 'Gelir Fırsatı', text: '384 sepet terk eden müşteri bugün hedeflense ₺28K+ potansiyel.', action: 'Kampanya Oluştur', href: '/campaigns/new' },
  { type: 'ai',      color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.15)', icon: Sparkles,    title: 'AI Önerisi', text: 'Salı 10–12 arası gönderimlerin açılma oranı %23 daha yüksek.', action: 'Planla', href: '/campaigns/new' },
  { type: 'segment', color: '#99b4ff', bg: 'rgba(153,180,255,0.08)', border: 'rgba(153,180,255,0.15)', icon: Layers,      title: 'Segment Önerisi', text: '142 VIP müşterin 60 gündür kampanya görmedi. Re-engage et.', action: 'Segment Gör', href: '/segments' },
  { type: 'risk',    color: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.15)',  icon: AlertTriangle, title: 'Risk Uyarısı', text: 'Email domain DNS doğrulaması yapılmadı, teslimatta sorun olabilir.', action: 'Ayarlar', href: '/settings' },
]

const DEMO_CHANNELS = [
  { id: 'email',    label: 'Email',      Icon: Mail,         sent: 12400, conv: 3.8, revenue: 84200, status: 'active', color: '#99b4ff' },
  { id: 'whatsapp', label: 'WhatsApp',   Icon: MessageSquare, sent: 4800, conv: 7.2, revenue: 42800, status: 'active', color: '#2dd4bf' },
  { id: 'auto',     label: 'Otomasyon',  Icon: Zap,          sent: 3580,  conv: 21.4, revenue: 38600, status: 'active', color: '#a78bfa' },
  { id: 'push',     label: 'Web Push',   Icon: Bell,         sent: 0,     conv: 0,    revenue: 0,     status: 'inactive', color: '#666680' },
]

const CHECKLIST = [
  { key: 'store',      label: 'Mağazanı bağla',          href: '/settings#integrations', done: false },
  { key: 'domain',     label: 'Email domain doğrula',     href: '/settings#email',        done: false },
  { key: 'segment',    label: 'İlk segmenti oluştur',     href: '/segments',              done: false },
  { key: 'campaign',   label: 'İlk kampanyayı oluştur',   href: '/campaigns/new',         done: false },
  { key: 'automation', label: 'İlk otomasyonu aktif et',  href: '/automations',           done: false },
] as const

/* ─── Chart helpers ─── */
function v(i: number, s = 7) { return 0.6 + Math.abs(Math.sin(i * s + 1)) * 0.8 }
function buildChart(rev: DashboardData['revenueChart'], range: TimeRange) {
  if (range === '24h') {
    return Array.from({ length: 24 }, (_, i) => {
      const biz = i >= 8 && i <= 22
      return { label: `${String(i).padStart(2,'0')}:00`, rev: biz ? Math.round(1200 * v(i,5)) : 0, email: biz ? Math.round(800*v(i,4)) : 0, wa: biz ? Math.round(400*v(i,6)) : 0 }
    })
  }
  const slice = range === '1w' ? 7 : 30
  return (rev.length ? rev : Array.from({length:slice},(_,i)=>({label:`G${i+1}`,value:Math.round(3000+Math.random()*5000)}))).slice(-slice).map((d,i) => ({
    label: d.label, rev: d.value, email: Math.round(d.value*0.52), wa: Math.round(d.value*0.26),
  }))
}

/* ─── Tooltip ─── */
function PremiumTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{name:string;value:number;color:string}>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3.5 py-2.5 shadow-2xl" style={{ background:'#141420', border:'1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-[10px] font-semibold mb-2" style={{ color:'#666688', fontFamily:'JetBrains Mono,monospace' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-5 mb-1 last:mb-0">
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color:'#8888aa' }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background:p.color }} />{p.name}
          </span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color:'#f0f0f8', fontFamily:'JetBrains Mono,monospace' }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── KpiCard ─── */
function KpiCard({ label, value, sub, icon: Icon, accent, accentBg, change }: {
  label:string; value:string; sub?:string; icon:React.ElementType; accent:string; accentBg:string; change?:number
}) {
  const positive = (change ?? 0) >= 0
  return (
    <div className="relative rounded-2xl p-5 overflow-hidden cursor-default"
      style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', transition:'all .2s' }}
      onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 20px 60px rgba(0,0,0,0.4)'}}
      onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.025)';e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
      <div className="absolute top-0 left-4 right-4 h-px rounded-full" style={{ background:`linear-gradient(90deg,transparent,${accent}44,transparent)` }} />
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color:'#44445a' }}>{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background:accentBg }}>
          <Icon className="w-4 h-4" style={{ color:accent }} />
        </div>
      </div>
      <p className="text-[26px] font-bold tracking-tight leading-none mb-1.5" style={{ color:'#f0f0f8', letterSpacing:'-0.02em' }}>{value}</p>
      {sub && <p className="text-[11px]" style={{ color:'#44445a' }}>{sub}</p>}
      {change !== undefined && change !== 0 && (
        <div className={cn('inline-flex items-center gap-1 text-[10px] font-semibold mt-3 px-2 py-1 rounded-lg', positive ? 'text-emerald-400':'text-red-400')}
          style={{ background: positive ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)' }}>
          {positive ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
          %{Math.abs(change).toFixed(1)} geçen aya göre
        </div>
      )}
    </div>
  )
}

/* ─── Section header ─── */
function SectionHeader({ title, sub, href, hrefLabel }: { title:string; sub?:string; href?:string; hrefLabel?:string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-[13px] font-bold" style={{ color:'#eeeef4' }}>{title}</h2>
        {sub && <p className="text-[11px] mt-0.5" style={{ color:'#44445a' }}>{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-[11px] font-semibold transition-colors"
          style={{ color:'#44445a' }}
          onMouseEnter={e=>(e.currentTarget.style.color='#99b4ff')}
          onMouseLeave={e=>(e.currentTarget.style.color='#44445a')}>
          {hrefLabel ?? 'Tümü'} <ChevronRight className="w-3 h-3"/>
        </Link>
      )}
    </div>
  )
}

/* ─── Card shell ─── */
function Card({ children, className, style }: { children:React.ReactNode; className?:string; style?: React.CSSProperties }) {
  return (
    <div className={cn('rounded-2xl overflow-hidden', className)}
      style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', ...style }}>
      {children}
    </div>
  )
}

/* ─── Onboarding ─── */
function OnboardingSection({ onHide }: { onHide:()=>void }) {
  const done = CHECKLIST.filter(c => c.done).length
  const total = CHECKLIST.length
  const pct = Math.round((done / total) * 100)
  const circumference = 2 * Math.PI * 16
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:'rgba(68,112,255,0.04)', border:'1px solid rgba(68,112,255,0.14)' }}>
      <div className="absolute top-0 inset-x-0 h-px" style={{ background:'linear-gradient(90deg,transparent,rgba(68,112,255,0.5),transparent)' }}/>
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 shrink-0">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(68,112,255,0.12)" strokeWidth="3"/>
                <circle cx="20" cy="20" r="16" fill="none" stroke="#4470ff" strokeWidth="3"
                  strokeDasharray={circumference} strokeDashoffset={circumference*(1-pct/100)}
                  strokeLinecap="round" className="transition-all duration-700"/>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color:'#4470ff' }}>{done}/{total}</span>
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color:'#eeeef4' }}>Kurulum Tamamlama</p>
              <p className="text-[11px]" style={{ color:'#55556a' }}>%{pct} tamamlandı · hızlı kur, hızlı kazan</p>
            </div>
          </div>
          <button onClick={onHide} className="text-[11px] px-2.5 py-1 rounded-lg" style={{ color:'#55556a', background:'rgba(255,255,255,0.04)' }}>Gizle</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {CHECKLIST.map((item, i) => (
            <Link key={item.key} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
              style={{ background: item.done ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.03)', border: item.done ? '1px solid rgba(52,211,153,0.15)' : '1px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={e=>{ if(!item.done) e.currentTarget.style.borderColor='rgba(68,112,255,0.3)' }}
              onMouseLeave={e=>{ if(!item.done) e.currentTarget.style.borderColor='rgba(255,255,255,0.06)' }}>
              <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0', item.done ? 'bg-emerald-500/20 border border-emerald-500/40' : 'border border-white/[0.12]')}>
                {item.done ? <CheckCheck className="w-2.5 h-2.5 text-emerald-400"/> : <span className="text-[9px] font-bold" style={{ color:'#44445a' }}>{i+1}</span>}
              </div>
              <span className="text-[11px] font-medium leading-tight" style={{ color: item.done ? '#34d399' : '#aaaacc', textDecoration: item.done ? 'line-through' : 'none' }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Main ─── */
export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [timeRange, setTimeRange] = useState<TimeRange>('1m')
  const [showChecklist, setShowChecklist] = useState(true)

  const firstName = session?.user?.name?.split(' ')[0] ?? ''

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { if (d?.stats) setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const email = data?.channelStats?.email ?? { sent:0, opened:0, clicked:0, openRate:0, clickRate:0, revenue:0 }
  const wa    = data?.channelStats?.whatsapp ?? { sent:0, revenue:0 }
  const rev   = data?.revenueChart ?? []

  const chartData = useMemo(() => buildChart(rev, timeRange), [timeRange, rev])

  const totalRevenue   = data?.stats?.revenue?.value ?? 202000
  const campaignRev    = data ? Math.round(totalRevenue * 0.42) : 84840
  const automationRev  = data ? Math.round(totalRevenue * 0.19) : 38380
  const waRev          = wa.revenue || Math.round(totalRevenue * 0.21)
  const customerCount  = data?.stats?.customers?.value ?? 1248
  const convRate       = 3.8

  const today = new Date().toLocaleDateString('tr-TR', { weekday:'long', day:'numeric', month:'long' })

  if (loading) {
    return <AppShell><div className="p-6 pt-4"><DashboardSkeleton/></div></AppShell>
  }

  return (
    <AppShell>
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 h-14 shrink-0"
        style={{ background:'rgba(10,10,15,0.9)', backdropFilter:'blur(24px)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-1">
          {([
            { key:'overview' as Tab, label:'Genel Bakış', icon:LayoutGrid },
            { key:'live'     as Tab, label:'Canlı',       icon:Radio,  pulse:true },
          ]).map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                style={active ? { background:'rgba(255,255,255,0.07)', color:'#eeeef4' } : { color:'#55556a' }}>
                <Icon className="w-3.5 h-3.5"/>
                {tab.label}
                {'pulse' in tab && tab.pulse && (
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                    <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500"/>
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg" style={{ background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.06)' }}>
            {([{id:'24h' as TimeRange,label:'24s'},{id:'1w' as TimeRange,label:'7g'},{id:'1m' as TimeRange,label:'30g'}]).map(tr => (
              <button key={tr.id} onClick={() => setTimeRange(tr.id)}
                className="px-3 py-1 rounded-md text-[11px] font-semibold transition-all"
                style={timeRange===tr.id ? {background:'rgba(255,255,255,0.08)',color:'#eeeef4'} : {color:'#44445a'}}>
                {tr.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{ background:'rgba(255,255,255,0.04)', color:'#8080a0', border:'1px solid rgba(255,255,255,0.08)' }}>
            <Download className="w-3.5 h-3.5"/> Raporu İndir
          </button>
          <Link href="/campaigns/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
            style={{ background:'#4470ff', color:'#fff' }}>
            <Plus className="w-3.5 h-3.5"/> Kampanya Oluştur
          </Link>
        </div>
      </div>

      {/* ── Live tab ── */}
      {activeTab === 'live' && <div className="p-6 flex-1"><LiveActivityDashboard/></div>}

      {/* ── Overview tab ── */}
      {activeTab === 'overview' && (
        <div className="p-6 pb-12 space-y-8 flex-1 max-w-[1400px] mx-auto w-full">

          {/* Hero */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-medium mb-1" style={{ color:'#33334a' }}>{today}</p>
              <div className="flex items-center gap-3 mb-1">
                <Image src="/marksio-logo.png" alt="Marksio" width={36} height={36} className="rounded-[10px]" style={{ objectFit:'contain' }}/>
                <h1 className="text-[24px] font-bold leading-tight" style={{ color:'#eeeef4', letterSpacing:'-0.025em' }}>
                  {firstName ? `Merhaba, ${firstName}.` : 'Dashboard'}
                  {' '}<span style={{ background:'linear-gradient(135deg,#4470ff,#00d4ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                    AI Growth OS
                  </span>
                </h1>
              </div>
              <p className="text-[13px] mt-1" style={{ color:'#44445a' }}>Tüm pazarlama kanallarınız tek ekranda</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {data?.isDemo && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background:'rgba(251,146,60,0.08)', border:'1px solid rgba(251,146,60,0.2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"/>
                  <span className="text-[11px] font-medium" style={{ color:'#fb923c' }}>Demo Veri</span>
                </div>
              )}
              {data?.integration ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background:'rgba(52,211,153,0.06)', border:'1px solid rgba(52,211,153,0.15)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
                  <span className="text-[12px] font-medium" style={{ color:'#34d399' }}>{data.integration.shopDomain}</span>
                </div>
              ) : (
                <Link href="/settings"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
                  style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', color:'#55556a' }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(68,112,255,0.3)')}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.07)')}>
                  <ShoppingBag className="w-3.5 h-3.5"/>
                  <span className="text-[12px] font-medium">Mağaza bağla</span>
                </Link>
              )}
            </div>
          </div>

          {/* Onboarding */}
          {data?.isDemo && showChecklist && <OnboardingSection onHide={() => setShowChecklist(false)}/>}

          {/* ── 1. Growth Command Center ── */}
          <section>
            <SectionHeader title="Growth Command Center" sub="Tüm gelir ve büyüme metrikleri"/>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <KpiCard label="Toplam Gelir"      value={formatCurrency(totalRevenue)}     sub="son 30 gün"           icon={TrendingUp}       accent="#34d399" accentBg="rgba(52,211,153,0.1)"    change={data?.stats?.revenue?.change ?? 12.4}/>
              <KpiCard label="Kampanya Geliri"   value={formatCurrency(campaignRev)}      sub="email + WhatsApp"     icon={Megaphone}        accent="#99b4ff" accentBg="rgba(153,180,255,0.1)"  change={8.1}/>
              <KpiCard label="Otomasyon Geliri"  value={formatCurrency(automationRev)}    sub="aktif flow'lardan"    icon={Zap}              accent="#a78bfa" accentBg="rgba(167,139,250,0.1)"  change={21.3}/>
              <KpiCard label="WhatsApp Geliri"   value={formatCurrency(waRev)}            sub="mesaj dönüşümü"       icon={MessageSquare}    accent="#2dd4bf" accentBg="rgba(45,212,191,0.1)"   change={15.7}/>
            </div>
          </section>

          {/* ── 1b. Secondary Metrics Row ── */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3" style={{ marginTop: '-16px' }}>
            {[
              { label: 'Müşteri Büyümesi',   value: `+${data?.stats?.customers?.newThisMonth ?? 94}`,    sub: 'bu ay',                  icon: Users,        color: '#fb923c', change: data?.stats?.customers?.change ?? 7.2 },
              { label: 'Dönüşüm Oranı',      value: `%${convRate}`,                                       sub: 'tüm kanallar ortalaması', icon: Target,       color: '#f59e0b', change: 0.4 },
              { label: 'Sepet Terk Oranı',    value: `%${data?.kpiExtended?.cartAbandonRate ?? 68.7}`,     sub: 'son 30 gün',              icon: ShoppingCart, color: '#e84545', change: -5.3, negative: true },
              { label: 'Ort. Sipariş Tutarı', value: formatCurrency(data?.stats?.revenue?.value ? Math.round((data?.kpiExtended?.totalRevenue || data?.stats?.revenue?.value || 202000) / Math.max(data?.stats?.customers?.value ?? 1248, 1)) : 1342), sub: 'müşteri başı', icon: ShoppingBag, color: '#22c97a', change: 8.7 },
              { label: 'Aktif Abone',         value: formatNumber(data?.kpiExtended?.activeSubscribers ?? (email.sent ? Math.round(email.sent * 0.85) : 12842)), sub: 'email listesi',   icon: Mail,          color: '#99b4ff', change: 9.1 },
              { label: 'WhatsApp Abone',      value: formatNumber(data?.kpiExtended?.waSubscribers     ?? (wa.sent ? Math.round(wa.sent * 0.72) : 5892)),         sub: 'opt-in listesi',  icon: MessageSquare, color: '#22c97a', change: 11.4 },
            ].map(m => {
              const MIcon = m.icon
              const pos = (m as { negative?: boolean }).negative ? false : m.change >= 0
              return (
                <div key={m.label} className="flex items-center gap-3 rounded-2xl p-4 cursor-default"
                  style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${m.color}15` }}>
                    <MIcon className="w-4 h-4" style={{ color: m.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px]" style={{ color: '#44445a' }}>{m.label}</p>
                    <p className="text-[16px] font-bold leading-tight" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>{m.value}</p>
                    <p className="text-[9px]" style={{ color: '#33334a' }}>{m.sub}</p>
                  </div>
                  <div className={cn('text-right shrink-0')}>
                    <div className={cn('inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md', pos ? 'text-emerald-400' : 'text-red-400')}
                      style={{ background: pos ? 'rgba(34,201,122,0.08)' : 'rgba(232,69,69,0.08)' }}>
                      {pos ? <ArrowUpRight className="w-2.5 h-2.5"/> : <ArrowDownRight className="w-2.5 h-2.5"/>}
                      %{Math.abs(m.change)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Revenue Chart + AI Intelligence ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color:'#44445a' }}>Gelir Dağılımı</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    {[{color:'#34d399',label:'Toplam'},{color:'#99b4ff',label:'Email'},{color:'#2dd4bf',label:'WhatsApp'}].map(l => (
                      <span key={l.label} className="flex items-center gap-1.5 text-[11px]" style={{ color:'#8888aa' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background:l.color }}/> {l.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px]" style={{ color:'#44445a' }}>30 Gün Toplam</p>
                  <p className="text-[16px] font-bold" style={{ color:'#34d399', fontFamily:'JetBrains Mono,monospace' }}>{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
              <div className="px-4 pb-5 pt-4">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top:4, right:4, bottom:0, left:-16 }}>
                    <defs>
                      {[['grad-total','#34d399',0.15],['grad-email','#99b4ff',0.12],['grad-wa','#2dd4bf',0.1]].map(([id,c,op]) => (
                        <linearGradient key={id as string} id={id as string} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={c as string} stopOpacity={op as number}/>
                          <stop offset="100%" stopColor={c as string} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <XAxis dataKey="label" tick={{ fontSize:10, fill:'#44445a', fontFamily:'JetBrains Mono,monospace' }} tickLine={false} axisLine={false}
                      interval={chartData.length > 14 ? Math.floor(chartData.length/6) : 0}/>
                    <YAxis tick={{ fontSize:10, fill:'#44445a', fontFamily:'JetBrains Mono,monospace' }} tickLine={false} axisLine={false} width={36}/>
                    <Tooltip content={<PremiumTooltip/>} cursor={{ stroke:'rgba(255,255,255,0.06)', strokeWidth:1 }}/>
                    <Area type="monotone" dataKey="rev"   name="Toplam" stroke="#34d399" strokeWidth={1.5} fill="url(#grad-total)" dot={false} activeDot={{ r:3, fill:'#34d399', strokeWidth:0 }}/>
                    <Area type="monotone" dataKey="email" name="Email"  stroke="#99b4ff" strokeWidth={1.5} fill="url(#grad-email)" dot={false} activeDot={{ r:3, fill:'#99b4ff', strokeWidth:0 }}/>
                    <Area type="monotone" dataKey="wa"    name="WA"     stroke="#2dd4bf" strokeWidth={1.5} fill="url(#grad-wa)"    dot={false} activeDot={{ r:3, fill:'#2dd4bf', strokeWidth:0 }}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* ── 2. AI Intelligence Panel ── */}
            <Card className="flex flex-col">
              <div className="px-5 pt-5 pb-4 flex items-center gap-3" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div className="relative w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background:'rgba(167,139,250,0.12)', border:'1px solid rgba(167,139,250,0.2)' }}>
                  <Sparkles className="w-4 h-4 text-violet-400"/>
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-400 border-2" style={{ borderColor:'#0a0a0f' }}/>
                </div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color:'#eeeef4' }}>AI İçgörüler</p>
                  <p className="text-[10px]" style={{ color:'#44445a' }}>güncel · 4 fırsat</p>
                </div>
              </div>
              <div className="p-4 space-y-2.5 flex-1">
                {DEMO_AI_INSIGHTS.map((ins, i) => {
                  const Icon = ins.icon
                  return (
                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl cursor-default transition-all"
                      style={{ background:ins.bg, border:`1px solid ${ins.border}` }}>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background:`${ins.color}18` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color:ins.color }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color:ins.color }}>{ins.title}</p>
                        <p className="text-[11.5px] leading-relaxed" style={{ color:'#aaaacc' }}>{ins.text}</p>
                        <Link href={ins.href} className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold" style={{ color:ins.color }}>
                          {ins.action} <ArrowRight className="w-2.5 h-2.5"/>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* ── 3. Marketing Channels Overview ── */}
          <section>
            <SectionHeader title="Pazarlama Kanalları" sub="Tüm kanallar ve performansları"/>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {DEMO_CHANNELS.map(ch => {
                const Icon = ch.Icon
                const isActive = ch.status === 'active'
                return (
                  <div key={ch.id} className="relative rounded-2xl p-5 cursor-default"
                    style={{ background:'rgba(255,255,255,0.025)', border:`1px solid ${isActive ? `${ch.color}20` : 'rgba(255,255,255,0.06)'}`, transition:'all .2s' }}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow=`0 16px 48px rgba(0,0,0,0.3)`}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none'}}>
                    <div className="absolute top-0 left-4 right-4 h-px rounded-full" style={{ background:`linear-gradient(90deg,transparent,${ch.color}44,transparent)` }}/>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:`${ch.color}15` }}>
                        <Icon className="w-4.5 h-4.5" style={{ color:ch.color }}/>
                      </div>
                      <span className={cn('text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full',
                        isActive ? '' : '')}
                        style={isActive ? { background:`${ch.color}15`, color:ch.color } : { background:'rgba(255,255,255,0.04)', color:'#44445a' }}>
                        {isActive ? 'Aktif' : 'Kurulmadı'}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold mb-3" style={{ color:'#eeeef4' }}>{ch.label}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px]">
                        <span style={{ color:'#44445a' }}>Gönderim</span>
                        <span style={{ color:'#aaaacc', fontFamily:'JetBrains Mono,monospace' }}>{formatNumber(ch.sent)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span style={{ color:'#44445a' }}>Dönüşüm</span>
                        <span style={{ color: isActive ? ch.color : '#44445a', fontFamily:'JetBrains Mono,monospace' }}>{ch.conv > 0 ? `%${ch.conv}` : '—'}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span style={{ color:'#44445a' }}>Gelir</span>
                        <span className="font-bold" style={{ color:'#34d399', fontFamily:'JetBrains Mono,monospace' }}>{ch.revenue > 0 ? formatCurrency(ch.revenue) : '—'}</span>
                      </div>
                    </div>
                    {!isActive && (
                      <Link href="/settings"
                        className="flex items-center justify-center gap-1.5 mt-4 py-2 rounded-xl text-[11px] font-semibold transition-all"
                        style={{ background:'rgba(68,112,255,0.08)', color:'#99b4ff', border:'1px solid rgba(68,112,255,0.2)' }}>
                        <Plus className="w-3 h-3"/> Kur
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* ── 4 & 5: Segmentation + Revenue Attribution ── */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            {/* Segmentation Snapshot */}
            <Card className="xl:col-span-3">
              <div className="px-5 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <SectionHeader title="Segment Anlık Görünüm" href="/segments" hrefLabel="Tüm segmentler"/>
              </div>
              <div className="p-5 space-y-2.5">
                {DEMO_SEGMENTS.map(seg => {
                  const Icon = seg.icon
                  return (
                    <Link key={seg.key} href="/segments"
                      className="flex items-center gap-3 p-3 rounded-xl transition-all"
                      style={{ background:seg.bg, border:`1px solid ${seg.border}` }}
                      onMouseEnter={e=>(e.currentTarget.style.opacity='0.85')}
                      onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background:`${seg.color}18` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color:seg.color }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[12px] font-semibold" style={{ color:'#eeeef4' }}>{seg.label}</p>
                          <span className="text-[11px] font-bold" style={{ color:seg.color, fontFamily:'JetBrains Mono,monospace' }}>{formatNumber(seg.count)}</span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background:'rgba(255,255,255,0.06)' }}>
                          <div className="h-1 rounded-full transition-all duration-700" style={{ width:`${seg.pct}%`, background:seg.color }}/>
                        </div>
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color:seg.color, fontFamily:'JetBrains Mono,monospace' }}>%{seg.pct}</span>
                    </Link>
                  )
                })}
              </div>
            </Card>

            {/* Revenue Attribution */}
            <Card className="xl:col-span-2 flex flex-col">
              <div className="px-5 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <SectionHeader title="Gelir Atıfı" href="/analytics"/>
              </div>
              <div className="p-5 flex-1">
                <div className="mb-4 h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={DEMO_ATTRIBUTION} margin={{ top:0, right:0, bottom:0, left:-20 }}>
                      <XAxis dataKey="label" tick={{ fontSize:9, fill:'#44445a', fontFamily:'JetBrains Mono,monospace' }} tickLine={false} axisLine={false}/>
                      <YAxis tick={{ fontSize:9, fill:'#44445a' }} tickLine={false} axisLine={false} width={32}/>
                      <Tooltip formatter={(v:number) => formatCurrency(v)} contentStyle={{ background:'#141420', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:11 }}/>
                      <Bar dataKey="value" radius={[4,4,0,0]}>
                        {DEMO_ATTRIBUTION.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {DEMO_ATTRIBUTION.map(a => (
                    <div key={a.label} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background:a.color }}/>
                        <span className="text-[12px]" style={{ color:'#aaaacc' }}>{a.label}</span>
                      </div>
                      <span className="text-[12px] font-bold" style={{ color:'#f0f0f8', fontFamily:'JetBrains Mono,monospace' }}>{formatCurrency(a.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* ── 6 & 7: Automation Health + Campaign Performance ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Automation Health */}
            <Card>
              <div className="px-5 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[13px] font-bold" style={{ color:'#eeeef4' }}>Otomasyon Sağlığı</h2>
                    <p className="text-[11px] mt-0.5" style={{ color:'#44445a' }}>
                      <span className="text-emerald-400 font-semibold">{DEMO_FLOWS.length} aktif flow</span> çalışıyor
                    </p>
                  </div>
                  <Link href="/automations" className="flex items-center gap-1 text-[11px] font-semibold" style={{ color:'#44445a' }}
                    onMouseEnter={e=>(e.currentTarget.style.color='#99b4ff')}
                    onMouseLeave={e=>(e.currentTarget.style.color='#44445a')}>
                    Yönet <ChevronRight className="w-3 h-3"/>
                  </Link>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {DEMO_FLOWS.map((flow, i) => {
                  const Icon = flow.icon
                  return (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl transition-all cursor-default"
                      style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.04)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background:`${flow.color}15` }}>
                        <Icon className="w-4 h-4" style={{ color:flow.color }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[12px] font-semibold truncate" style={{ color:'#eeeef4' }}>{flow.name}</p>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"/>
                        </div>
                        <div className="flex items-center gap-3 text-[10px]" style={{ color:'#44445a' }}>
                          <span style={{ fontFamily:'JetBrains Mono,monospace' }}>{formatNumber(flow.sent)} gönderim</span>
                          <span style={{ color:flow.color, fontFamily:'JetBrains Mono,monospace' }}>%{flow.conv} dönüşüm</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold" style={{ color:'#34d399', fontFamily:'JetBrains Mono,monospace' }}>{formatCurrency(flow.revenue)}</p>
                        <p className="text-[10px]" style={{ color:'#44445a' }}>gelir</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Campaign Performance */}
            <Card>
              <div className="px-5 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <SectionHeader title="Kampanya Performansı" href="/campaigns"/>
              </div>
              <div className="divide-y" style={{ borderColor:'rgba(255,255,255,0.04)' }}>
                {(data?.recentCampaigns?.length ? data.recentCampaigns : [
                  { id:'1', name:'VIP Yaz İndirimi',      type:'email',     status:'sent', sent:2840, opened:1138, clicked:284, revenue:42800, createdAt: new Date().toISOString() },
                  { id:'2', name:'Sepet Hatırlatma WA',    type:'whatsapp',  status:'sent', sent:1240, opened:1190, clicked:372, revenue:28600, createdAt: new Date().toISOString() },
                  { id:'3', name:'Yeni Ürün Duyurusu',     type:'email',     status:'sent', sent:5200, opened:1716, clicked:390, revenue:18400, createdAt: new Date().toISOString() },
                  { id:'4', name:'Win-back Kampanyası',     type:'email',     status:'sent', sent:820,  opened:238,  clicked:58,  revenue:9200,  createdAt: new Date().toISOString() },
                ]).slice(0,4).map((camp, i) => {
                  const openRate  = camp.sent > 0 ? ((camp.opened/camp.sent)*100).toFixed(1) : '0'
                  const clickRate = camp.sent > 0 ? ((camp.clicked/camp.sent)*100).toFixed(1) : '0'
                  const aiScore   = Math.round(60 + Math.random()*35)
                  const isEmail   = camp.type === 'email'
                  return (
                    <div key={camp.id} className="px-5 py-3.5 flex items-center gap-3 transition-all cursor-default"
                      onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: isEmail ? 'rgba(153,180,255,0.1)' : 'rgba(45,212,191,0.1)' }}>
                        {isEmail ? <Mail className="w-3.5 h-3.5" style={{ color:'#99b4ff' }}/> : <MessageSquare className="w-3.5 h-3.5 text-teal-400"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate mb-1" style={{ color:'#eeeef4' }}>{camp.name}</p>
                        <div className="flex items-center gap-3 text-[10px]" style={{ color:'#44445a', fontFamily:'JetBrains Mono,monospace' }}>
                          <span>%{openRate} açılma</span>
                          <span>%{clickRate} tıklama</span>
                          <span className="flex items-center gap-1" style={{ color:'#a78bfa' }}>
                            <Sparkles className="w-2.5 h-2.5"/> {aiScore}
                          </span>
                        </div>
                      </div>
                      <p className="text-[13px] font-bold shrink-0" style={{ color:'#34d399', fontFamily:'JetBrains Mono,monospace' }}>{formatCurrency(camp.revenue)}</p>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* ── Hızlı İşlemler ── */}
          <div className="rounded-2xl px-5 py-4" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[11px] font-semibold mb-3" style={{ color:'#44445a' }}>Hızlı İşlemler</p>
            <div className="grid grid-cols-6 gap-2">
              {[
                { href:'/campaigns/new',   icon:Megaphone,     label:'Yeni Kampanya', sub:'Oluştur',    color:'#99b4ff', bg:'rgba(153,180,255,0.1)' },
                { href:'/automations/new', icon:Zap,           label:'Otomasyon',     sub:'Oluştur',    color:'#a78bfa', bg:'rgba(167,139,250,0.1)' },
                { href:'/whatsapp',        icon:MessageSquare, label:'WhatsApp Mesajı', sub:'Gönder',   color:'#2dd4bf', bg:'rgba(45,212,191,0.1)'  },
                { href:'/segments',        icon:Target,        label:'Segment',       sub:'Oluştur',    color:'#34d399', bg:'rgba(52,211,153,0.1)'  },
                { href:'/ai-studio',       icon:Sparkles,      label:'AI Studio',     sub:'Görsel Oluştur', color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
                { href:'/analytics',       icon:BarChart3,     label:'Rapor',         sub:'Oluştur',    color:'#fb923c', bg:'rgba(251,146,60,0.1)'  },
              ].map(item => {
                const ItemIcon = item.icon
                return (
                  <Link key={item.href} href={item.href}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                    style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e=>{e.currentTarget.style.background=item.bg;e.currentTarget.style.borderColor=`${item.color}25`}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.02)';e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'}}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:item.bg }}>
                      <ItemIcon className="w-4 h-4" style={{ color:item.color }}/>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-semibold" style={{ color:'#eeeef4' }}>{item.label}</p>
                      <p className="text-[9px]" style={{ color:'#44445a' }}>{item.sub}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* ── 8 & 9: Integration Status + Activity ── */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
            {/* Activity Feed */}
            <Card className="xl:col-span-3">
              <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                  <p className="text-[13px] font-semibold" style={{ color:'#eeeef4' }}>Aktivite Akışı</p>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ background:'rgba(52,211,153,0.1)', color:'#34d399', border:'1px solid rgba(52,211,153,0.2)' }}>LIVE</span>
                </div>
                <Link href="/campaigns" className="text-[11px] font-semibold" style={{ color:'#44445a' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='#99b4ff')}
                  onMouseLeave={e=>(e.currentTarget.style.color='#44445a')}>
                  Tümü <ChevronRight className="w-3 h-3 inline"/>
                </Link>
              </div>
              {(data?.recentOpens ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <Activity className="w-7 h-7" style={{ color:'#33334a' }}/>
                  <p className="text-[13px]" style={{ color:'#44445a' }}>Kampanya gönderin, aktiviteler burada görünür</p>
                  <Link href="/campaigns/new" className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color:'#99b4ff' }}>
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
                        style={{ borderBottom: idx < (data?.recentOpens?.length ?? 0)-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                        onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)', color:'#8888aa', fontFamily:'JetBrains Mono,monospace' }}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate" style={{ color:'#eeeef4' }}>{open.customer?.name ?? 'Bilinmeyen'}</p>
                          <p className="text-[11px] truncate" style={{ color:'#44445a' }}>{open.campaign?.name ?? '—'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[13px] font-bold" style={{ color:'#34d399', fontFamily:'JetBrains Mono,monospace' }}>
                            {open.customer?.totalSpent ? formatCurrency(open.customer.totalSpent) : '—'}
                          </p>
                          <p className="text-[10px]" style={{ color:'#33334a', fontFamily:'JetBrains Mono,monospace' }}>{ts}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Integration Status */}
            <Card className="xl:col-span-2 flex flex-col">
              <div className="px-5 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <SectionHeader title="Entegrasyon Durumu" href="/settings" hrefLabel="Ayarlar"/>
              </div>
              <div className="p-5 space-y-2 flex-1">
                {DEMO_INTEGRATIONS.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all"
                    style={{ background: item.ok ? 'rgba(52,211,153,0.04)' : 'rgba(248,113,113,0.04)', border: `1px solid ${item.ok ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)'}` }}>
                    {item.ok
                      ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400"/>
                      : <XCircle className="w-4 h-4 shrink-0 text-red-400"/>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold" style={{ color:item.ok ? '#eeeef4' : '#f87171' }}>{item.label}</p>
                      <p className="text-[10px] truncate" style={{ color:'#44445a' }}>{item.detail}</p>
                    </div>
                    {!item.ok && (
                      <Link href="/settings" className="text-[10px] font-semibold shrink-0 px-2 py-1 rounded-lg" style={{ background:'rgba(68,112,255,0.1)', color:'#99b4ff' }}>
                        Kur
                      </Link>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <Link href="/campaigns/new"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[12px] font-semibold transition-all"
                  style={{ background:'rgba(68,112,255,0.1)', color:'#99b4ff', border:'1px solid rgba(68,112,255,0.2)' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(68,112,255,0.18)';e.currentTarget.style.borderColor='rgba(68,112,255,0.35)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(68,112,255,0.1)';e.currentTarget.style.borderColor='rgba(68,112,255,0.2)'}}>
                  <Plus className="w-3.5 h-3.5"/> Yeni Kampanya
                </Link>
              </div>
            </Card>
          </div>

        </div>
      )}
    </AppShell>
  )
}
