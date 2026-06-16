'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Mail, MessageSquare, Plus, TrendingUp, Eye,
  Sparkles, Send, Loader2, Search, CheckCircle2, X,
  Trash2, BarChart2, ArrowUpRight, ArrowDownRight,
  MousePointerClick, Zap, Bot, Tag, ChevronRight, Users,
  Clock, Target, RefreshCw, Copy, FileEdit, Ban, PlayCircle,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface AiSuggestion {
  title: string
  text: string
  action: string
  color: string
  icon: string
  href: string
}

const ICON_MAP: Record<string, React.ElementType> = {
  mail: Mail, zap: Zap, users: Users, trending_up: TrendingUp,
  target: Target, clock: Clock,
}

type CampaignType = 'email' | 'whatsapp'
type CampaignStatus = 'draft' | 'active' | 'scheduled' | 'completed' | 'sending' | 'failed'
type FilterTab = 'all' | 'email' | 'whatsapp' | 'draft' | 'scheduled' | 'completed'

interface Campaign {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  segment: string
  subject?: string
  body: string
  sent: number
  opened: number
  clicked: number
  converted: number
  revenue: number
  createdAt: string
  scheduledAt?: string
  isAi?: boolean
}

const statusConfig: Record<CampaignStatus, { label: string; dot: string; text: string; bg: string }> = {
  completed: { label: 'Gönderildi',    dot: '#22c97a', text: '#22c97a', bg: 'rgba(34,201,122,0.1)'  },
  active:    { label: 'Aktif',         dot: '#4470ff', text: '#99b4ff', bg: 'rgba(68,112,255,0.1)'  },
  scheduled: { label: 'Zamanlandı',   dot: '#f0a020', text: '#f0a020', bg: 'rgba(240,160,32,0.1)'  },
  sending:   { label: 'Gönderiliyor', dot: '#4470ff', text: '#99b4ff', bg: 'rgba(68,112,255,0.08)' },
  failed:    { label: 'Başarısız',    dot: '#e84545', text: '#e84545', bg: 'rgba(232,69,69,0.1)'   },
  draft:     { label: 'Taslak',       dot: '#3e3e54', text: '#8080a0', bg: 'rgba(255,255,255,0.04)' },
}

const channelConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  email:    { icon: Mail,          color: '#99b4ff', label: 'E-posta'  },
  whatsapp: { icon: MessageSquare, color: '#22c97a', label: 'WhatsApp' },
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',       label: 'Tümü'       },
  { key: 'email',     label: 'E-posta'    },
  { key: 'whatsapp',  label: 'WhatsApp'   },
  { key: 'draft',     label: 'Taslak'     },
  { key: 'scheduled', label: 'Zamanlandı' },
  { key: 'completed', label: 'Gönderildi' },
]

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-[13px] font-semibold"
      style={{ background: type === 'success' ? 'rgba(34,201,122,0.12)' : 'rgba(232,69,69,0.12)', border: `1px solid ${type === 'success' ? 'rgba(34,201,122,0.25)' : 'rgba(232,69,69,0.25)'}`, color: type === 'success' ? '#22c97a' : '#e84545', backdropFilter: 'blur(20px)' }}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  )
}

function ActionBtn({ onClick, disabled, variant, children }: { onClick: () => void; disabled?: boolean; variant?: 'default' | 'danger' | 'primary'; children: React.ReactNode }) {
  const styles = {
    default: { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: '#8080a0', hover: 'rgba(255,255,255,0.09)' },
    danger:  { bg: 'rgba(232,69,69,0.08)',   border: 'rgba(232,69,69,0.2)',   color: '#e84545', hover: 'rgba(232,69,69,0.14)'    },
    primary: { bg: 'rgba(68,112,255,0.1)',   border: 'rgba(68,112,255,0.25)', color: '#99b4ff', hover: 'rgba(68,112,255,0.18)'   },
  }
  const s = styles[variant ?? 'default']
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40 shrink-0"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
      onMouseEnter={e => (e.currentTarget.style.background = s.hover)}
      onMouseLeave={e => (e.currentTarget.style.background = s.bg)}>
      {children}
    </button>
  )
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([])
  const [aiLoading, setAiLoading] = useState(false)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCampaigns(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fetchAiSuggestions = useCallback(async (data: Campaign[]) => {
    setAiLoading(true)
    const sent    = data.reduce((s, c) => s + c.sent, 0)
    const opened  = data.reduce((s, c) => s + c.opened, 0)
    const clicked = data.reduce((s, c) => s + c.clicked, 0)
    const rev     = data.reduce((s, c) => s + c.revenue, 0)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const res = await fetch('/api/ai/campaign-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          campaigns: data,
          openRate:  sent > 0 ? ((opened  / sent) * 100).toFixed(1) : '0',
          clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : '0',
          totalRevenue: rev,
          totalSent: sent,
        }),
      })
      const suggestions = await res.json()
      if (Array.isArray(suggestions)) setAiSuggestions(suggestions)
      else setAiSuggestions([])
    } catch {
      setAiSuggestions([])
    } finally {
      clearTimeout(timeout)
      setAiLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading && campaigns.length > 0) fetchAiSuggestions(campaigns)
  }, [loading, campaigns, fetchAiSuggestions])

  const handleSend = async (id: string) => {
    setSendingId(id)
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'active' as CampaignStatus, sent: c.sent + (data.sent ?? 0) } : c))
        showToast(`${data.sent ?? 0} kişiye gönderildi.`)
      } else showToast(data.error ?? 'Gönderim başarısız.', 'error')
    } catch { showToast('Gönderim başarısız.', 'error') }
    finally { setSendingId(null) }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (res.ok) { setCampaigns(prev => prev.filter(c => c.id !== id)); showToast('Kampanya silindi.') }
      else showToast('Silme başarısız.', 'error')
    } catch { showToast('Silme başarısız.', 'error') }
    finally { setDeletingId(null) }
  }

  const filtered = campaigns.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (activeTab === 'email')     return c.type === 'email'
    if (activeTab === 'whatsapp')  return c.type === 'whatsapp'
    if (activeTab === 'draft')     return c.status === 'draft'
    if (activeTab === 'scheduled') return c.status === 'scheduled'
    if (activeTab === 'completed') return c.status === 'completed'
    return true
  })

  const totalSent      = campaigns.reduce((s, c) => s + c.sent, 0)
  const totalOpened    = campaigns.reduce((s, c) => s + c.opened, 0)
  const totalClicked   = campaigns.reduce((s, c) => s + c.clicked, 0)
  const totalRevenue   = campaigns.reduce((s, c) => s + c.revenue, 0)
  const openRate  = totalSent > 0 ? ((totalOpened  / totalSent) * 100).toFixed(1) : '0'
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0'

  const nowDate          = new Date()
  const startOfThisMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1)
  const startOfLastMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1)
  const thisMonthC = campaigns.filter(c => new Date(c.createdAt) >= startOfThisMonth)
  const lastMonthC = campaigns.filter(c => { const d = new Date(c.createdAt); return d >= startOfLastMonth && d < startOfThisMonth })
  const thisMSent    = thisMonthC.reduce((s, c) => s + c.sent, 0)
  const lastMSent    = lastMonthC.reduce((s, c) => s + c.sent, 0)
  const thisMOpened  = thisMonthC.reduce((s, c) => s + c.opened, 0)
  const lastMOpened  = lastMonthC.reduce((s, c) => s + c.opened, 0)
  const thisMClicked = thisMonthC.reduce((s, c) => s + c.clicked, 0)
  const lastMClicked = lastMonthC.reduce((s, c) => s + c.clicked, 0)
  const thisMRev     = thisMonthC.reduce((s, c) => s + c.revenue, 0)
  const lastMRev     = lastMonthC.reduce((s, c) => s + c.revenue, 0)

  function momPct(curr: number, prev: number): number | null {
    if (prev === 0) return null
    return +((curr - prev) / prev * 100).toFixed(1)
  }
  function momRatePP(cSent: number, cVal: number, pSent: number, pVal: number): number | null {
    if (pSent === 0) return null
    const cRate = cSent > 0 ? cVal / cSent * 100 : 0
    const pRate = pVal / pSent * 100
    return +(cRate - pRate).toFixed(1)
  }

  const kpiChanges = {
    campaigns: momPct(thisMonthC.length, lastMonthC.length),
    sent:      momPct(thisMSent,  lastMSent),
    openRate:  momRatePP(thisMSent, thisMOpened,  lastMSent, lastMOpened),
    clickRate: momRatePP(thisMSent, thisMClicked, lastMSent, lastMClicked),
    revenue:   momPct(thisMRev, lastMRev),
  }

  return (
    <AppShell>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 md:px-6 h-14 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,15,0.95)', backdropFilter: 'blur(24px)' }}>
        <div>
          <h1 className="text-[15px] md:text-[16px] font-bold" style={{ color: '#eeeef4' }}>Kampanyalar</h1>
          <p className="text-[11px] hidden sm:block" style={{ color: '#44445a' }}>E-posta ve WhatsApp kampanyalarınızı oluşturun, yönetin ve analiz edin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/campaigns/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
            style={{ background: '#4470ff', color: '#fff' }}>
            <Plus className="w-3.5 h-3.5" /> Yeni Kampanya
          </Link>
        </div>
      </div>

      {/* Mobile FAB */}
      <Link href="/campaigns/new"
        className="fixed bottom-6 right-4 z-30 md:hidden w-14 h-14 flex items-center justify-center rounded-full shadow-2xl"
        style={{ background: '#4470ff', touchAction: 'manipulation' }}>
        <Plus className="w-6 h-6 text-white" />
      </Link>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── KPI cards ── */}
          <div className="px-4 md:px-6 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
            {[
              { label: 'Toplam Kampanya', value: String(campaigns.length),   icon: BarChart2,         color: '#99b4ff', bg: 'rgba(153,180,255,0.1)', change: kpiChanges.campaigns },
              { label: 'Gönderilen',      value: formatNumber(totalSent),    icon: Send,              color: '#4470ff', bg: 'rgba(68,112,255,0.1)',  change: kpiChanges.sent      },
              { label: 'Açılma Oranı',    value: `%${openRate}`,             icon: Eye,               color: '#22c97a', bg: 'rgba(34,201,122,0.1)', change: kpiChanges.openRate  },
              { label: 'Tıklama Oranı',   value: `%${clickRate}`,            icon: MousePointerClick, color: '#9f7afa', bg: 'rgba(159,122,250,0.1)', change: kpiChanges.clickRate },
              { label: 'Gelir',           value: formatCurrency(totalRevenue), icon: TrendingUp,      color: '#22c97a', bg: 'rgba(34,201,122,0.1)', change: kpiChanges.revenue   },
            ].map(kpi => {
              const Icon     = kpi.icon
              const hasChange = kpi.change !== null
              const positive  = hasChange && kpi.change! >= 0
              return (
                <div key={kpi.label} className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold" style={{ color: '#44445a' }}>{kpi.label}</p>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                    </div>
                  </div>
                  <p className="text-[22px] font-bold leading-none mb-2" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>{kpi.value}</p>
                  {hasChange ? (
                    <div className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md', positive ? 'text-emerald-400' : 'text-red-400')}
                      style={{ background: positive ? 'rgba(34,201,122,0.08)' : 'rgba(232,69,69,0.08)' }}>
                      {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      %{Math.abs(kpi.change!)} geçen 30 güne göre
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ color: '#3e3e54', background: 'rgba(255,255,255,0.03)' }}>
                      — geçen ay verisi yok
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Filter bar ── */}
          <div className="px-4 md:px-6 py-2 flex items-center gap-3 shrink-0 overflow-x-auto no-scrollbar"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>

            {/* Tab filters */}
            <div className="flex items-center p-0.5 gap-0.5 rounded-xl shrink-0"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {FILTER_TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                  style={activeTab === tab.key ? { background: 'rgba(255,255,255,0.08)', color: '#eeeef4' } : { color: '#44445a' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: '#44445a' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Kampanya ara..."
                className="pl-8 pr-3 py-1.5 text-base md:text-[12px] rounded-xl outline-none w-40 md:w-52"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4', fontSize: 16 }} />
            </div>

            <span className="ml-auto text-[11px] shrink-0" style={{ color: '#33334a', fontFamily: 'JetBrains Mono, monospace' }}>
              {filtered.length} kampanya
            </span>
          </div>

          {/* ── Campaign list ── */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 space-y-2.5 max-w-5xl">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 rounded-md w-48" style={{ background: 'rgba(255,255,255,0.06)' }} />
                        <div className="h-2.5 rounded-md w-64" style={{ background: 'rgba(255,255,255,0.04)' }} />
                      </div>
                      <div className="h-6 w-20 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    </div>
                    <div className="h-2.5 rounded-md w-3/4" style={{ background: 'rgba(255,255,255,0.03)' }} />
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(68,112,255,0.08)', border: '1.5px dashed rgba(68,112,255,0.25)' }}>
                    <Send className="w-6 h-6" style={{ color: '#99b4ff' }} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold mb-1" style={{ color: '#eeeef4' }}>
                      {search || activeTab !== 'all' ? 'Filtreyle eşleşen kampanya bulunamadı' : 'Henüz kampanya oluşturmadınız'}
                    </p>
                    <p className="text-[12px]" style={{ color: '#44445a' }}>
                      {search || activeTab !== 'all' ? 'Filtreleri temizleyerek tüm kampanyaları görün' : 'AI destekli ilk kampanyanızı oluşturmak için başlayın'}
                    </p>
                  </div>
                  {!search && activeTab === 'all' && (
                    <Link href="/campaigns/new" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold"
                      style={{ background: '#4470ff', color: '#fff' }}>
                      <Plus className="w-4 h-4" /> Yeni Kampanya
                    </Link>
                  )}
                </div>
              ) : filtered.map(campaign => {
                const ch    = channelConfig[campaign.type] ?? channelConfig.email
                const sc    = statusConfig[campaign.status] ?? statusConfig.draft
                const ChIcon = ch.icon
                const openR  = campaign.sent > 0 ? (campaign.opened  / campaign.sent * 100) : 0
                const clickR = campaign.sent > 0 ? (campaign.clicked / campaign.sent * 100) : 0
                const dateStr = campaign.status === 'scheduled' && campaign.scheduledAt
                  ? new Date(campaign.scheduledAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : new Date(campaign.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })

                return (
                  <div key={campaign.id} className="rounded-2xl p-4 transition-all"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>

                    {/* Row 1: icon + name + status + date */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${ch.color}15`, border: `1px solid ${ch.color}20` }}>
                        <ChIcon className="w-4 h-4" style={{ color: ch.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => router.push(`/campaigns/${campaign.id}`)}
                            className="text-[13px] font-semibold truncate text-left hover:underline"
                            style={{ color: '#eeeef4', maxWidth: 280 }}>
                            {campaign.name}
                          </button>
                          {campaign.isAi && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold shrink-0"
                              style={{ background: 'rgba(159,122,250,0.12)', color: '#9f7afa', border: '1px solid rgba(159,122,250,0.2)' }}>
                              <Sparkles className="w-2.5 h-2.5" /> AI
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                          style={{ background: sc.bg, color: sc.text }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                          {sc.label}
                        </div>
                        <span className="hidden sm:block text-[11px]" style={{ color: '#44445a', fontFamily: 'JetBrains Mono, monospace' }}>
                          {dateStr}
                        </span>
                      </div>
                    </div>

                    {/* Row 2: subject/body preview */}
                    <p className="text-[12px] mb-3 truncate pl-12"
                      style={{ color: '#55556a' }}>
                      {campaign.type === 'email'
                        ? `konu: ${campaign.subject ?? '(konu yok)'}`
                        : `mesaj: ${campaign.body?.slice(0, 80) ?? ''}${(campaign.body?.length ?? 0) > 80 ? '…' : ''}`}
                    </p>

                    {/* Row 3: stats + actions */}
                    <div className="flex items-center justify-between gap-3 pl-12">
                      {/* Stats */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {campaign.sent > 0 ? (
                          <>
                            <span className="text-[11px]" style={{ color: '#55556a' }}>
                              📧 {formatNumber(campaign.sent)} gönderildi
                            </span>
                            <span className="text-[11px]" style={{ color: '#55556a' }}>
                              👁 {formatNumber(campaign.opened)} açıldı ({openR.toFixed(0)}%)
                            </span>
                            {campaign.clicked > 0 && (
                              <span className="text-[11px]" style={{ color: '#55556a' }}>
                                🖱 {formatNumber(campaign.clicked)} tıklandı ({clickR.toFixed(0)}%)
                              </span>
                            )}
                            {campaign.revenue > 0 && (
                              <span className="text-[11px] font-bold" style={{ color: '#22c97a' }}>
                                💰 {formatCurrency(campaign.revenue)}
                              </span>
                            )}
                          </>
                        ) : campaign.status === 'scheduled' ? (
                          <span className="text-[11px]" style={{ color: '#55556a' }}>
                            👥 {campaign.segment}
                          </span>
                        ) : campaign.status === 'draft' ? (
                          <span className="text-[11px]" style={{ color: '#55556a' }}>
                            📝 Taslak — henüz gönderilmedi
                          </span>
                        ) : null}
                      </div>

                      {/* Action buttons by status */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {(campaign.status === 'completed' || campaign.status === 'active') && (
                          <>
                            <ActionBtn onClick={() => router.push(`/campaigns/${campaign.id}`)} variant="default">
                              <BarChart2 className="w-3 h-3" /> Rapor
                            </ActionBtn>
                            <ActionBtn onClick={() => showToast('Kampanya kopyalama yakında geliyor.')} variant="default">
                              <Copy className="w-3 h-3" /> Kopyala
                            </ActionBtn>
                          </>
                        )}
                        {campaign.status === 'scheduled' && (
                          <>
                            <ActionBtn onClick={() => router.push(`/campaigns/${campaign.id}`)} variant="primary">
                              <FileEdit className="w-3 h-3" /> Düzenle
                            </ActionBtn>
                            <ActionBtn onClick={() => handleDelete(campaign.id)} disabled={deletingId === campaign.id} variant="danger">
                              {deletingId === campaign.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />} İptal
                            </ActionBtn>
                          </>
                        )}
                        {campaign.status === 'draft' && (
                          <>
                            <ActionBtn onClick={() => router.push(`/campaigns/${campaign.id}`)} variant="primary">
                              <PlayCircle className="w-3 h-3" /> Devam Et
                            </ActionBtn>
                            <ActionBtn onClick={() => handleDelete(campaign.id)} disabled={deletingId === campaign.id} variant="danger">
                              {deletingId === campaign.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Sil
                            </ActionBtn>
                          </>
                        )}
                        {campaign.status === 'sending' && (
                          <ActionBtn onClick={() => router.push(`/campaigns/${campaign.id}`)} variant="default">
                            <Eye className="w-3 h-3" /> Detay
                          </ActionBtn>
                        )}
                        {campaign.status === 'failed' && (
                          <>
                            <ActionBtn onClick={() => handleSend(campaign.id)} disabled={sendingId === campaign.id} variant="primary">
                              {sendingId === campaign.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Yeniden Dene
                            </ActionBtn>
                            <ActionBtn onClick={() => handleDelete(campaign.id)} disabled={deletingId === campaign.id} variant="danger">
                              {deletingId === campaign.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Sil
                            </ActionBtn>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div className="h-4" />
            </div>
          </div>
        </div>

        {/* ── AI Önerileri panel — desktop only ── */}
        <div className="hidden lg:flex w-[300px] shrink-0 flex-col border-l overflow-hidden"
          style={{ background: '#0d0d1a', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(159,122,250,0.15)', border: '1px solid rgba(159,122,250,0.25)' }}>
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>AI Önerileri</p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(68,112,255,0.15)', color: '#99b4ff' }}>Groq</span>
              </div>
            </div>
            <button onClick={() => fetchAiSuggestions(campaigns)} disabled={aiLoading}
              className="p-1.5 rounded-lg transition-all disabled:opacity-40"
              style={{ color: '#44445a' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              title="Yenile">
              <RefreshCw className={`w-3 h-3 ${aiLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-auto space-y-3">
            <p className="text-[11px]" style={{ color: '#44445a' }}>
              {aiLoading ? 'Groq AI kampanyalarınızı analiz ediyor…' : 'Kampanya verilerinize göre kişisel öneriler.'}
            </p>

            {aiLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-3.5 rounded-xl animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <div className="h-3 rounded-md w-24" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                  <div className="space-y-1.5 mb-3">
                    <div className="h-2.5 rounded w-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
                    <div className="h-2.5 rounded w-4/5" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  </div>
                  <div className="h-6 rounded-lg w-24" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              ))
            ) : aiSuggestions.length > 0 ? (
              aiSuggestions.map((s, i) => {
                const Icon = ICON_MAP[s.icon] ?? Sparkles
                const href = s.href === '/ai-studio' ? '/campaigns/new' : (s.href ?? '/campaigns/new')
                return (
                  <Link key={i} href={href}
                    className="block p-3.5 rounded-xl transition-all cursor-pointer"
                    style={{ background: `${s.color}10`, border: `1px solid ${s.color}20` }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${s.color}1e`; e.currentTarget.style.borderColor = `${s.color}40` }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${s.color}10`; e.currentTarget.style.borderColor = `${s.color}20` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                      </div>
                      <p className="text-[11px] font-bold leading-tight" style={{ color: s.color }}>{s.title}</p>
                    </div>
                    <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: '#8080a0' }}>{s.text}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg"
                      style={{ background: `${s.color}18`, color: s.color }}>
                      {s.action} <ChevronRight className="w-3 h-3" />
                    </span>
                  </Link>
                )
              })
            ) : (
              <div className="py-6 text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(159,122,250,0.08)', border: '1px solid rgba(159,122,250,0.15)' }}>
                  <Bot className="w-4 h-4 text-violet-400" />
                </div>
                <p className="text-[11px] font-medium mb-1" style={{ color: '#44445a' }}>AI analiz hazır değil</p>
                <button onClick={() => fetchAiSuggestions(campaigns)}
                  className="text-[10px] font-semibold" style={{ color: '#9f7afa', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Tekrar dene
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
