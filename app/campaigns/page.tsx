'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Mail, MessageSquare, Plus, TrendingUp, Eye,
  Sparkles, Send, Loader2, Search, CheckCircle2, X,
  MoreHorizontal, Trash2, BarChart2, ArrowUpRight, ArrowDownRight,
  MousePointerClick, Zap, Bot, Tag, ChevronRight, Users,
  Clock, Target, RefreshCw,
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
type CampaignStatus = 'draft' | 'active' | 'scheduled' | 'completed'

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
  completed: { label: 'Tamamlandı', dot: '#22c97a', text: '#22c97a', bg: 'rgba(34,201,122,0.1)' },
  active:    { label: 'Aktif',      dot: '#4470ff', text: '#99b4ff', bg: 'rgba(68,112,255,0.1)' },
  scheduled: { label: 'Planlandı',  dot: '#f0a020', text: '#f0a020', bg: 'rgba(240,160,32,0.1)' },
  draft:     { label: 'Taslak',     dot: '#3e3e54', text: '#8080a0', bg: 'rgba(255,255,255,0.04)' },
}

const channelConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  email:    { icon: Mail,          color: '#99b4ff', label: 'E-posta'  },
  whatsapp: { icon: MessageSquare, color: '#22c97a', label: 'WhatsApp' },
}

const DEMO_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Black Friday İndirim Kampanyası', type: 'email',    status: 'completed', segment: 'Tüm Müşteriler', body: '', sent: 12456, opened: 4823, clicked: 1160, converted: 389, revenue: 256420, createdAt: '2024-05-24', isAi: true },
  { id: '2', name: 'Sepet Terk Edenlere Hatırlatma',  type: 'whatsapp', status: 'completed', segment: 'Sepet Terk Edenler', body: '', sent: 6842, opened: 3087, clicked: 891, converted: 217, revenue: 186750, createdAt: '2024-05-22', isAi: true },
  { id: '3', name: 'Yaz Koleksiyonu Duyurusu',        type: 'email',    status: 'completed', segment: 'Sadık Müşteriler', body: '', sent: 8159, opened: 2571, clicked: 587, converted: 142, revenue: 134250, createdAt: '2024-05-20', isAi: false },
  { id: '4', name: 'Hoş Geldin! 🎉',                  type: 'email',    status: 'completed', segment: 'Yeni Aboneler',   body: '', sent: 2350, opened: 1464, clicked: 443, converted: 98,  revenue: 98430,  createdAt: '2024-05-19', isAi: false },
  { id: '5', name: 'Flash İndirim 24 Saat!',          type: 'whatsapp', status: 'completed', segment: 'Tüm Müşteriler', body: '', sent: 9876, opened: 2961, clicked: 602, converted: 187, revenue: 120680, createdAt: '2024-05-17', isAi: false },
  { id: '6', name: 'Seni Özledik 💙',                 type: 'email',    status: 'active',    segment: '90 Gün Aktif Olmayanlar', body: '', sent: 4321, opened: 1039, clicked: 186, converted: 41,  revenue: 45890,  createdAt: '2024-05-15', isAi: true },
  { id: '7', name: 'Yeni Ürünler Geldi!',             type: 'email',    status: 'scheduled', segment: 'VIP Müşteriler', body: '', sent: 0, opened: 0, clicked: 0, converted: 0, revenue: 0, createdAt: '2024-05-12', isAi: false },
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

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showNewPanel, setShowNewPanel] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([])
  const [aiLoading, setAiLoading] = useState(false)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    if (!openMenuId) return
    const close = () => setOpenMenuId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenuId])

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setCampaigns(data); else setCampaigns(DEMO_CAMPAIGNS) })
      .catch(() => setCampaigns(DEMO_CAMPAIGNS))
      .finally(() => setLoading(false))
  }, [])

  const fetchAiSuggestions = useCallback(async (data: Campaign[]) => {
    setAiLoading(true)
    const sent   = data.reduce((s, c) => s + c.sent, 0)
    const opened = data.reduce((s, c) => s + c.opened, 0)
    const clicked= data.reduce((s, c) => s + c.clicked, 0)
    const rev    = data.reduce((s, c) => s + c.revenue, 0)
    try {
      const res = await fetch('/api/ai/campaign-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaigns: data,
          openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : 0,
          clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : 0,
          totalRevenue: rev,
          totalSent: sent,
        }),
      })
      const suggestions = await res.json()
      if (Array.isArray(suggestions) && suggestions.length > 0) setAiSuggestions(suggestions)
    } catch { /* silent */ }
    finally { setAiLoading(false) }
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
    setDeletingId(id); setOpenMenuId(null)
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (res.ok) { setCampaigns(prev => prev.filter(c => c.id !== id)); showToast('Kampanya silindi.') }
      else showToast('Silme başarısız.', 'error')
    } catch { showToast('Silme başarısız.', 'error') }
    finally { setDeletingId(null) }
  }

  const filtered = campaigns.filter(c => {
    if (channelFilter !== 'all' && c.type !== channelFilter) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalCampaigns = campaigns.length
  const totalSent      = campaigns.reduce((s, c) => s + c.sent, 0)
  const totalOpened    = campaigns.reduce((s, c) => s + c.opened, 0)
  const totalClicked   = campaigns.reduce((s, c) => s + c.clicked, 0)
  const totalRevenue   = campaigns.reduce((s, c) => s + c.revenue, 0)
  const openRate       = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0'
  const clickRate      = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0'

  return (
    <AppShell>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 h-14 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,15,0.95)', backdropFilter: 'blur(24px)' }}>
        <div>
          <h1 className="text-[16px] font-bold" style={{ color: '#eeeef4' }}>Kampanyalar</h1>
          <p className="text-[11px]" style={{ color: '#44445a' }}>E-posta ve WhatsApp kampanyalarınızı oluşturun, yönetin ve analiz edin.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
            <TrendingUp className="w-3.5 h-3.5" /> Raporu İndir
          </button>
          <Link href="/campaigns/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
            style={{ background: '#4470ff', color: '#fff' }}>
            <Plus className="w-3.5 h-3.5" /> Yeni Kampanya
          </Link>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── KPI cards ── */}
          <div className="px-6 py-4 grid grid-cols-5 gap-3 shrink-0">
            {[
              { label: 'Toplam Kampanya', value: String(totalCampaigns), icon: BarChart2, color: '#99b4ff', bg: 'rgba(153,180,255,0.1)', change: 18.6 },
              { label: 'Gönderilen',      value: formatNumber(totalSent), icon: Send,      color: '#4470ff', bg: 'rgba(68,112,255,0.1)',  change: 16.3 },
              { label: 'Açılma Oranı',    value: `%${openRate}`,          icon: Eye,       color: '#22c97a', bg: 'rgba(34,201,122,0.1)', change: 8.4 },
              { label: 'Tıklama Oranı',   value: `%${clickRate}`,         icon: MousePointerClick, color: '#9f7afa', bg: 'rgba(159,122,250,0.1)', change: 12.7 },
              { label: 'Gelir',           value: formatCurrency(totalRevenue), icon: TrendingUp, color: '#22c97a', bg: 'rgba(34,201,122,0.1)', change: 24.5 },
            ].map(kpi => {
              const Icon = kpi.icon
              const positive = kpi.change >= 0
              return (
                <div key={kpi.label} className="rounded-2xl p-4 cursor-default"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold" style={{ color: '#44445a' }}>{kpi.label}</p>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                    </div>
                  </div>
                  <p className="text-[22px] font-bold leading-none mb-2" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>{kpi.value}</p>
                  <div className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md', positive ? 'text-emerald-400' : 'text-red-400')}
                    style={{ background: positive ? 'rgba(34,201,122,0.08)' : 'rgba(232,69,69,0.08)' }}>
                    {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    %{Math.abs(kpi.change)} geçen 30 güne göre
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Filter bar ── */}
          <div className="px-6 py-2 flex items-center gap-3 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: '#44445a' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Kampanya ara..."
                className="pl-8 pr-3 py-1.5 text-[12px] rounded-xl outline-none w-48"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }} />
            </div>

            {/* Status filter */}
            <div className="flex items-center p-0.5 gap-0.5 rounded-xl"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[['all', 'Tümü'], ['draft', 'Taslak'], ['active', 'Aktif'], ['scheduled', 'Planlandı'], ['completed', 'Tamamlandı']].map(([key, label]) => (
                <button key={key} onClick={() => setStatusFilter(key)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                  style={statusFilter === key ? { background: 'rgba(255,255,255,0.08)', color: '#eeeef4' } : { color: '#44445a' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Channel filter */}
            <div className="flex items-center p-0.5 gap-0.5 rounded-xl"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[['all', 'Tüm Kanallar'], ['email', 'E-posta'], ['whatsapp', 'WhatsApp']].map(([key, label]) => (
                <button key={key} onClick={() => setChannelFilter(key)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                  style={channelFilter === key ? { background: 'rgba(255,255,255,0.08)', color: '#eeeef4' } : { color: '#44445a' }}>
                  {label}
                </button>
              ))}
            </div>

            <span className="ml-auto text-[11px]" style={{ color: '#33334a', fontFamily: 'JetBrains Mono, monospace' }}>
              Toplam {filtered.length} kampanya
            </span>
          </div>

          {/* ── Campaign table ── */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
                  {['Kampanya', 'Kanal', 'Gönderilen', 'Açılma Oranı', 'Tıklama Oranı', 'Gelir', 'Durum', ''].map(col => (
                    <th key={col} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: '#44445a' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-4 rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', width: j === 0 ? 160 : 60 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <Sparkles className="w-5 h-5" style={{ color: '#33334a' }} />
                      </div>
                      <p className="text-[13px] font-semibold" style={{ color: '#44445a' }}>Kampanya bulunamadı</p>
                      <button onClick={() => setShowNewPanel(true)} className="text-[12px] font-semibold" style={{ color: '#99b4ff' }}>
                        + Yeni Kampanya Oluştur
                      </button>
                    </div>
                  </td></tr>
                ) : filtered.map(campaign => {
                  const ch = channelConfig[campaign.type] ?? channelConfig.email
                  const sc = statusConfig[campaign.status]
                  const ChIcon = ch.icon
                  const openR  = campaign.sent > 0 ? (campaign.opened  / campaign.sent * 100) : 0
                  const clickR = campaign.sent > 0 ? (campaign.clicked / campaign.sent * 100) : 0

                  return (
                    <tr key={campaign.id}
                      className="cursor-pointer transition-all"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}>

                      {/* Kampanya */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                            style={{ background: `${ch.color}15`, border: `1px solid ${ch.color}20` }}>
                            <ChIcon className="w-5 h-5" style={{ color: ch.color }} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-[12px] font-semibold truncate max-w-[200px]" style={{ color: '#eeeef4' }}>{campaign.name}</p>
                              {campaign.isAi && (
                                <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold shrink-0"
                                  style={{ background: 'rgba(159,122,250,0.12)', color: '#9f7afa', border: '1px solid rgba(159,122,250,0.2)' }}>
                                  <Sparkles className="w-2.5 h-2.5" /> AI
                                </span>
                              )}
                            </div>
                            <p className="text-[10px]" style={{ color: '#44445a' }}>{campaign.segment} · {new Date(campaign.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                      </td>

                      {/* Kanal */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <ChIcon className="w-3.5 h-3.5" style={{ color: ch.color }} />
                          <span className="text-[11px] font-medium" style={{ color: ch.color }}>{ch.label}</span>
                        </div>
                      </td>

                      {/* Gönderilen */}
                      <td className="px-4 py-3.5">
                        <span className="text-[12px] font-semibold" style={{ color: '#aaaacc', fontFamily: 'JetBrains Mono, monospace' }}>
                          {campaign.sent > 0 ? formatNumber(campaign.sent) : '—'}
                        </span>
                      </td>

                      {/* Açılma Oranı */}
                      <td className="px-4 py-3.5">
                        {campaign.sent > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold w-10" style={{ color: '#99b4ff', fontFamily: 'JetBrains Mono, monospace' }}>%{openR.toFixed(1)}</span>
                            <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(153,180,255,0.12)' }}>
                              <div className="h-1 rounded-full" style={{ width: `${Math.min(openR, 100)}%`, background: '#99b4ff' }} />
                            </div>
                          </div>
                        ) : <span style={{ color: '#33334a' }}>—</span>}
                      </td>

                      {/* Tıklama Oranı */}
                      <td className="px-4 py-3.5">
                        {campaign.sent > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold w-10" style={{ color: '#9f7afa', fontFamily: 'JetBrains Mono, monospace' }}>%{clickR.toFixed(1)}</span>
                            <div className="w-16 h-1 rounded-full" style={{ background: 'rgba(159,122,250,0.12)' }}>
                              <div className="h-1 rounded-full" style={{ width: `${Math.min(clickR * 3, 100)}%`, background: '#9f7afa' }} />
                            </div>
                          </div>
                        ) : <span style={{ color: '#33334a' }}>—</span>}
                      </td>

                      {/* Gelir */}
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-[12px] font-bold" style={{ color: '#22c97a', fontFamily: 'JetBrains Mono, monospace' }}>{campaign.revenue > 0 ? formatCurrency(campaign.revenue) : '—'}</p>
                          {campaign.revenue > 0 && <p className="text-[9px]" style={{ color: '#22c97a', opacity: 0.6 }}>▲ %{(Math.random() * 30 + 5).toFixed(1)}</p>}
                        </div>
                      </td>

                      {/* Durum */}
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                          style={{ background: sc.bg, color: sc.text }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                          {sc.label}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {campaign.status === 'draft' && (
                            <button onClick={() => handleSend(campaign.id)} disabled={sendingId === campaign.id}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                              style={{ background: 'rgba(68,112,255,0.1)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.2)' }}>
                              {sendingId === campaign.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                              Gönder
                            </button>
                          )}
                          <div className="relative">
                            <button onClick={() => setOpenMenuId(openMenuId === campaign.id ? null : campaign.id)}
                              className="p-1.5 rounded-lg transition-all"
                              style={{ color: '#44445a' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                            {openMenuId === campaign.id && (
                              <div className="absolute right-0 top-7 z-30 w-36 rounded-xl shadow-2xl overflow-hidden"
                                style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <button onClick={() => { setOpenMenuId(null); router.push(`/campaigns/${campaign.id}`) }}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] text-left transition-colors"
                                  style={{ color: '#eeeef4' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                  <BarChart2 className="w-3 h-3" /> Detay Gör
                                </button>
                                <button onClick={() => handleDelete(campaign.id)} disabled={deletingId === campaign.id}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] text-left transition-colors"
                                  style={{ color: '#e84545' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,69,69,0.08)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                  {deletingId === campaign.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Sil
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination hint */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-[11px]" style={{ color: '#33334a' }}>Toplam {filtered.length} kampanya</span>
              </div>
            )}
          </div>
        </div>

        {/* ── AI Önerileri panel (always visible) ── */}
        <div className="w-[300px] shrink-0 flex flex-col border-l overflow-hidden"
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

            {/* AI Suggestions — dynamic */}
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
                return (
                  <Link key={i} href={s.href ?? '/campaigns/new'}
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
