'use client'

import { useState, useEffect } from 'react'
import {
  Mail, MessageSquare, Plus, TrendingUp, Eye, ShoppingBag,
  Calendar, Clock, Sparkles, Send, Loader2, Zap,
  ShoppingCart, Gift, UserPlus, ArrowUpRight,
  Crown, Flame, Search, SlidersHorizontal, CheckCircle2, Circle,
  BarChart2, Copy,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { formatCurrency, formatNumber, formatDate, cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

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
  cta?: string
  sent: number
  opened: number
  clicked: number
  converted: number
  revenue: number
  createdAt: string
  scheduledAt?: string
}

const typeConfig: Record<CampaignType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  email:    { label: 'Email',    icon: Mail,          color: 'text-[#b4c5ff]',  bg: 'bg-[#b4c5ff]/10 border-[#b4c5ff]/20' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
}

const statusConfig: Record<CampaignStatus, { label: string; badge: string; dot: string; icon: React.ElementType }> = {
  completed: { label: 'Tamamlandı', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', icon: CheckCircle2 },
  active:    { label: 'Aktif',      badge: 'bg-[#0062ff]/10 text-[#b4c5ff] border-[#b4c5ff]/20',      dot: 'bg-[#b4c5ff] animate-pulse', icon: Circle },
  scheduled: { label: 'Planlandı',  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       dot: 'bg-amber-400', icon: Clock },
  draft:     { label: 'Taslak',     badge: 'bg-[#272a33] text-[#8b95a8] border-[#272a33]',             dot: 'bg-[#8b95a8]', icon: Circle },
}

const segmentLabel: Record<string, string> = {
  vip: 'VIP', loyal: 'Sadık', at_risk: 'Risk', new: 'Yeni', inactive: 'Pasif', all: 'Tümü',
}

const triggerDefs = [
  { key: 'cart_abandoned', icon: ShoppingCart, label: 'Sepet Terk',    desc: '2 saat içinde', color: 'text-[#b4c5ff]', bg: 'bg-[#b4c5ff]/10' },
  { key: 'signup',         icon: UserPlus,     label: 'Yeni Kayıt',    desc: 'Bugün',         color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { key: 'birthday',       icon: Gift,         label: 'Doğum Günleri', desc: 'Bu hafta',      color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  { key: 'vip_reward',     icon: Crown,        label: 'VIP Ödül',      desc: 'Cuma günü',     color: 'text-teal-400',   bg: 'bg-teal-500/10' },
  { key: 'win_back',       icon: Flame,        label: 'Win-Back',      desc: '14 gün sonra',  color: 'text-red-400',    bg: 'bg-red-500/10' },
]

function getCardGradient(type: CampaignType, status: CampaignStatus): string {
  if (status === 'completed') return 'linear-gradient(135deg, #0a1f0a 0%, #0d1f14 100%)'
  if (status === 'active') return 'linear-gradient(135deg, #001038 0%, #0a1628 100%)'
  if (status === 'scheduled') return 'linear-gradient(135deg, #1a1200 0%, #161400 100%)'
  if (type === 'whatsapp') return 'linear-gradient(135deg, #001a18 0%, #0d1f1e 100%)'
  return 'linear-gradient(135deg, #0a0f2a 0%, #0d1228 100%)'
}

const typeFilters: { key: string; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'email', label: 'Email' },
  { key: 'whatsapp', label: 'WhatsApp' },
]

const statusFilters: { key: string; label: string }[] = [
  { key: 'all', label: 'Tüm Durumlar' },
  { key: 'draft', label: 'Taslak' },
  { key: 'active', label: 'Aktif' },
  { key: 'completed', label: 'Tamamlandı' },
  { key: 'scheduled', label: 'Planlandı' },
]

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [triggerCounts, setTriggerCounts] = useState<Record<string, number>>({})

  const now = new Date()
  const calendarMonth = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
  const today = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCampaigns(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => { if (data.triggerCounts) setTriggerCounts(data.triggerCounts) })
      .catch(() => {})
  }, [])

  const handleSend = async (id: string) => {
    setSendingId(id)
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'active', sent: c.sent + data.sent } : c))
        alert(`✓ ${data.sent} kişiye gönderildi.`)
      } else {
        alert(`Hata: ${data.error}`)
      }
    } catch {
      alert('Gönderim başarısız.')
    } finally {
      setSendingId(null)
    }
  }

  function handleAiGenerate() {
    if (!aiPrompt.trim()) return
    router.push(`/campaigns/new?prompt=${encodeURIComponent(aiPrompt)}`)
  }

  const filtered = campaigns.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0)
  const totalConverted = campaigns.reduce((s, c) => s + c.converted, 0)

  return (
    <AppShell>
      <Header
        title="Campaign Studio"
        subtitle="Tüm pazarlama kampanyalarınız"
        actions={[
          { label: 'Template Library', href: '/campaigns/templates', variant: 'secondary' },
          { label: '+ Yeni Kampanya', href: '/campaigns/new' },
        ]}
      />

      <div className="flex-1 flex flex-col bg-[#11131c] animate-fade-in">

        {/* AI Prompt Bar */}
        <div className="border-b border-[#272a33] px-6 py-4 bg-[#1d1f28]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 bg-[#272a33] border border-[#272a33] rounded-lg px-3 py-2.5 focus-within:border-[#b4c5ff]/40 transition-all">
              <Sparkles className="w-4 h-4 text-[#b4c5ff] shrink-0" />
              <input
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
                placeholder="AI ile kampanya oluştur: 'VIP müşterilerime sepet terk emaili yaz, %20 indirim teklif et...'"
                className="flex-1 bg-transparent text-sm text-[#e2e8f8] placeholder-[#8b95a8] focus:outline-none"
              />
            </div>
            <button
              onClick={handleAiGenerate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0062ff] hover:bg-[#0052d4] text-white text-sm font-semibold transition-all whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Oluştur
            </button>
            <Link href="/campaigns/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#272a33] hover:bg-[#b4c5ff]/10 text-[#e2e8f8] text-sm font-semibold transition-all whitespace-nowrap border border-[#272a33] hover:border-[#b4c5ff]/30">
              <Plus className="w-3.5 h-3.5" />
              Boş
            </Link>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Stats Row */}
            <div className="px-6 py-4 grid grid-cols-3 gap-4 border-b border-[#272a33]">
              {[
                { label: 'Toplam Gelir',    value: formatCurrency(totalRevenue), icon: TrendingUp,  color: 'text-[#b4c5ff]',  bg: 'bg-[#b4c5ff]/10' },
                { label: 'Toplam Gönderim', value: formatNumber(totalSent),      icon: Eye,         color: 'text-violet-400', bg: 'bg-violet-500/10' },
                { label: 'Dönüşüm',        value: formatNumber(totalConverted),  icon: ShoppingBag, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', item.bg)}>
                    <item.icon className={cn('w-4 h-4', item.color)} />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#8b95a8] font-medium">{item.label}</p>
                    <p className="text-base font-bold text-[#e2e8f8]">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-[#272a33] flex items-center gap-3 flex-wrap bg-[#191b24]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8b95a8]" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Kampanya ara..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-[#272a33] border border-[#272a33] rounded-lg text-[#e2e8f8] placeholder-[#8b95a8] w-44 focus:outline-none focus:border-[#b4c5ff]/40 transition"
                />
              </div>
              <div className="flex items-center gap-1 bg-[#272a33] border border-[#272a33] rounded-lg p-1">
                {typeFilters.map(f => (
                  <button key={f.key} onClick={() => setTypeFilter(f.key)}
                    className={cn('px-2.5 py-1 rounded-md text-xs font-semibold transition-all',
                      typeFilter === f.key ? 'bg-[#0062ff] text-white' : 'text-[#8b95a8] hover:text-[#e2e8f8] hover:bg-[#191b24]')}>
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 bg-[#272a33] border border-[#272a33] rounded-lg p-1">
                {statusFilters.map(f => (
                  <button key={f.key} onClick={() => setStatusFilter(f.key)}
                    className={cn('px-2.5 py-1 rounded-md text-xs font-semibold transition-all',
                      statusFilter === f.key ? 'bg-[#191b24] text-[#e2e8f8]' : 'text-[#8b95a8] hover:text-[#e2e8f8]')}>
                    {f.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-[#8b95a8] ml-auto font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{filtered.length} kampanya</span>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#8b95a8] hover:text-[#e2e8f8] border border-[#272a33] rounded-lg bg-[#272a33] hover:bg-[#191b24] transition-all">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filtrele
              </button>
            </div>

            {/* Card Grid */}
            <div className="flex-1 overflow-auto p-5">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="relative overflow-hidden rounded-xl bg-[#1a1e2b] h-44 animate-pulse">
                      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 && campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-5 animate-fade-in">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-[#b4c5ff]/[0.06] border border-[#b4c5ff]/15 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-[#b4c5ff]" />
                    </div>
                    <div className="absolute -inset-2 rounded-3xl bg-[#b4c5ff]/[0.03] blur-xl -z-10" />
                  </div>
                  <div className="text-center max-w-xs">
                    <p className="text-[#e2e8f8] font-semibold text-sm mb-1">Henüz kampanya yok</p>
                    <p className="text-[#8b95a8] text-xs leading-relaxed">Yukarıdaki AI çubuğunu kullanarak ilk kampanyanızı dakikalar içinde oluşturun</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/campaigns/new"
                      className="flex items-center gap-2 text-xs bg-[#0062ff] hover:bg-[#0052d4] text-white px-4 py-2 rounded-lg font-semibold transition-all shadow-[0_0_16px_rgba(0,102,255,0.25)]">
                      <Plus className="w-3.5 h-3.5" /> Yeni Kampanya
                    </Link>
                    <Link href="/campaigns/templates"
                      className="flex items-center gap-2 text-xs bg-[#272a33] hover:bg-[#2e3140] text-[#8b95a8] hover:text-[#e2e8f8] px-4 py-2 rounded-lg font-semibold transition-all border border-[#272a33]">
                      <Sparkles className="w-3.5 h-3.5" /> Şablon Seç
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map(c => {
                    const type = typeConfig[c.type] ?? typeConfig.email
                    const status = statusConfig[c.status] ?? statusConfig.draft
                    const TypeIcon = type.icon
                    const openRate = c.sent > 0 ? ((c.opened / c.sent) * 100).toFixed(1) : null
                    const ctr = c.sent > 0 ? ((c.clicked / c.sent) * 100).toFixed(1) : null
                    const isSending = sendingId === c.id
                    const cardGradient = getCardGradient(c.type, c.status)

                    return (
                      <div key={c.id} className="group relative rounded-xl border border-[#272a33] overflow-hidden transition-all duration-300 hover:border-[#b4c5ff]/20 hover:shadow-[0_8px_32px_-8px_rgba(180,197,255,0.1)] cursor-pointer"
                        style={{ background: '#191b24' }}>

                        {/* Card header */}
                        <div className="px-4 pt-4 pb-3 relative" style={{ background: cardGradient }}>
                          <div className="absolute inset-0 opacity-30"
                            style={{ background: 'radial-gradient(ellipse at 80% 0%, rgba(180,197,255,0.12) 0%, transparent 60%)' }} />
                          <div className="relative flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm font-bold text-[#e2e8f8] leading-tight line-clamp-2 flex-1">{c.name}</p>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className={cn('inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide', status.badge)}>
                                <span className={cn('w-1 h-1 rounded-full inline-block', status.dot)} />
                                {status.label}
                              </span>
                              <span className={cn('inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded border', type.bg, type.color)}>
                                <TypeIcon className="w-2.5 h-2.5" />
                                {type.label}
                              </span>
                            </div>
                          </div>
                          {c.subject && (
                            <p className="text-[11px] text-[#8b95a8] truncate relative">{c.subject}</p>
                          )}
                          <p className="text-[10px] text-[#8b95a8]/60 mt-0.5 relative" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            {segmentLabel[c.segment] || c.segment}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="px-4 py-3 grid grid-cols-3 gap-2 border-t border-[#272a33]">
                          <div>
                            <p className="text-[9px] text-[#8b95a8] font-semibold uppercase tracking-wide mb-0.5">Gönderim</p>
                            <p className="text-sm font-bold text-[#e2e8f8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {c.sent > 0 ? formatNumber(c.sent) : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-[#8b95a8] font-semibold uppercase tracking-wide mb-0.5">Açılma</p>
                            <p className="text-sm font-bold text-[#e2e8f8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {openRate ? `%${openRate}` : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] text-[#8b95a8] font-semibold uppercase tracking-wide mb-0.5">Gelir</p>
                            <p className="text-sm font-bold text-emerald-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {c.revenue > 0 ? formatCurrency(c.revenue) : '—'}
                            </p>
                          </div>
                        </div>

                        {/* Footer actions */}
                        <div className="px-4 py-2.5 border-t border-[#272a33] flex items-center justify-between">
                          <span className="text-[10px] text-[#8b95a8]">
                            {ctr ? `CTR %${ctr}` : formatDate(c.createdAt)}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => navigator.clipboard.writeText(c.id)}
                              className="p-1.5 rounded-lg text-[#8b95a8] hover:text-[#e2e8f8] hover:bg-[#272a33] transition-all"
                              title="ID Kopyala">
                              <Copy className="w-3 h-3" />
                            </button>
                            {c.status === 'draft' ? (
                              <button
                                onClick={() => handleSend(c.id)}
                                disabled={isSending}
                                className="flex items-center gap-1 text-[10px] font-bold bg-[#0062ff] hover:bg-[#0052d4] disabled:opacity-50 text-white px-2 py-1 rounded-lg transition-all">
                                {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                Gönder
                              </button>
                            ) : (
                              <Link href={`/campaigns/${c.id}`}
                                className="flex items-center gap-1 text-[10px] font-bold text-[#b4c5ff] hover:text-white bg-[#b4c5ff]/10 hover:bg-[#b4c5ff]/20 px-2 py-1 rounded-lg transition-all">
                                <BarChart2 className="w-3 h-3" />
                                Detay
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Hover glow border */}
                        <div className="absolute inset-0 rounded-xl border border-[#b4c5ff]/0 group-hover:border-[#b4c5ff]/10 transition-all pointer-events-none" />
                      </div>
                    )
                  })}

                  {/* Create New card */}
                  <Link href="/campaigns/new"
                    className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#272a33] hover:border-[#b4c5ff]/30 min-h-[180px] transition-all duration-300 hover:bg-[#b4c5ff]/[0.02]">
                    <div className="w-10 h-10 rounded-xl bg-[#272a33] group-hover:bg-[#b4c5ff]/10 border border-[#272a33] group-hover:border-[#b4c5ff]/20 flex items-center justify-center transition-all">
                      <Plus className="w-4 h-4 text-[#8b95a8] group-hover:text-[#b4c5ff] transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-[#8b95a8] group-hover:text-[#e2e8f8] transition-colors">Yeni Kampanya</p>
                      <p className="text-[10px] text-[#8b95a8]/60 mt-0.5">AI ile oluştur</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar — Upcoming Triggers */}
          <div className="w-64 border-l border-[#272a33] bg-[#1d1f28] flex flex-col shrink-0">
            <div className="px-4 py-3.5 border-b border-[#272a33]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#b4c5ff]" />
                <h3 className="text-sm font-semibold text-[#e2e8f8]">Yaklaşan Tetikleyiciler</h3>
              </div>
            </div>
            <div className="flex-1 p-3 space-y-2 overflow-y-auto">
              {triggerDefs.map((trigger, i) => {
                const Icon = trigger.icon
                const count = triggerCounts[trigger.key] ?? 0
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#191b24] border border-[#272a33] hover:border-[#b4c5ff]/20 transition-all cursor-pointer">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', trigger.bg)}>
                      <Icon className={cn('w-3.5 h-3.5', trigger.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#e2e8f8] truncate">{trigger.label}</p>
                      <p className="text-[10px] text-[#8b95a8] mt-0.5">{trigger.desc}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#8b95a8] shrink-0" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{count}</span>
                  </div>
                )
              })}
            </div>

            {/* Calendar footer */}
            <div className="p-3 border-t border-[#272a33]">
              <div className="bg-[#191b24] border border-[#272a33] rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-[#e2e8f8] capitalize">{calendarMonth}</span>
                  <Zap className="w-3.5 h-3.5 text-[#b4c5ff]" />
                </div>
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((d, i) => (
                    <div key={i} className="text-[9px] text-[#8b95a8] py-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{d}</div>
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <div key={d} className={cn(
                      'text-[10px] py-1 rounded cursor-pointer transition-colors',
                      d === today ? 'bg-[#0062ff] text-white font-bold' :
                      d % 7 === 0 ? 'text-[#b4c5ff] font-semibold' :
                      'text-[#8b95a8] hover:text-[#e2e8f8]'
                    )} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{d}</div>
                  ))}
                </div>
              </div>
              <Link href="/campaigns/new"
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#272a33] hover:bg-[#b4c5ff]/10 text-[#e2e8f8] text-xs font-semibold transition-all border border-[#272a33] hover:border-[#b4c5ff]/30">
                <Plus className="w-3.5 h-3.5" /> Kampanya Planla
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
