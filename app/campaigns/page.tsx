'use client'

import { useState, useEffect } from 'react'
import {
  Mail, MessageSquare, Plus, TrendingUp, Eye, ShoppingBag,
  Calendar, Clock, Sparkles, Send, Loader2, Zap,
  ShoppingCart, Gift, UserPlus, ChevronRight, ArrowUpRight,
  Crown, Flame, Search, SlidersHorizontal, CheckCircle2, Circle,
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

      <div className="flex-1 flex flex-col bg-[#11131c]">

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

            {/* Table */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-[#b4c5ff]" />
                    <span className="text-xs text-[#8b95a8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Kampanyalar yükleniyor...</span>
                  </div>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#272a33] bg-[#191b24]">
                      {['Durum', 'Kampanya', 'Kanal', 'Açılma Oranı', 'CTR', 'ROI', ''].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-[#8b95a8] uppercase tracking-[0.1em]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#272a33]">
                    {filtered.map(c => {
                      const type = typeConfig[c.type] ?? typeConfig.email
                      const status = statusConfig[c.status] ?? statusConfig.draft
                      const TypeIcon = type.icon
                      const StatusIcon = status.icon
                      const openRate = c.sent > 0 ? ((c.opened / c.sent) * 100).toFixed(1) : '—'
                      const ctr = c.sent > 0 ? ((c.clicked / c.sent) * 100).toFixed(1) : '—'
                      const roi = c.revenue > 0 && c.sent > 0 ? `×${(c.revenue / (c.sent * 0.05)).toFixed(1)}` : '—'
                      const isSending = sendingId === c.id

                      return (
                        <tr key={c.id} className="hover:bg-[#272a33]/50 transition-colors group">
                          {/* Status */}
                          <td className="px-5 py-3.5 w-28">
                            <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded border', status.badge)}>
                              <span className={cn('w-1.5 h-1.5 rounded-full inline-block', status.dot)} />
                              {status.label}
                            </span>
                          </td>
                          {/* Name */}
                          <td className="px-5 py-3.5 max-w-[200px]">
                            <p className="text-sm font-semibold text-[#e2e8f8] truncate">{c.name}</p>
                            {c.subject && (
                              <p className="text-[11px] text-[#8b95a8] truncate mt-0.5">{c.subject}</p>
                            )}
                            <p className="text-[10px] text-[#8b95a8]/60 mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {segmentLabel[c.segment] || c.segment}
                              {c.sent > 0 && <span> · {formatNumber(c.sent)} gönderildi</span>}
                            </p>
                          </td>
                          {/* Channel */}
                          <td className="px-5 py-3.5 w-28">
                            <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded border', type.bg, type.color)}>
                              <TypeIcon className="w-3 h-3" />
                              {type.label}
                            </span>
                          </td>
                          {/* Open Rate */}
                          <td className="px-5 py-3.5 w-28">
                            <p className="text-sm font-bold text-[#e2e8f8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {openRate !== '—' ? `%${openRate}` : '—'}
                            </p>
                          </td>
                          {/* CTR */}
                          <td className="px-5 py-3.5 w-24">
                            <p className="text-sm font-bold text-[#e2e8f8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {ctr !== '—' ? `%${ctr}` : '—'}
                            </p>
                          </td>
                          {/* ROI */}
                          <td className="px-5 py-3.5 w-28">
                            <p className="text-sm font-bold text-emerald-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                              {formatCurrency(c.revenue)}
                            </p>
                            <p className="text-[10px] text-[#8b95a8]">{roi}</p>
                          </td>
                          {/* Actions */}
                          <td className="px-5 py-3.5 w-24 text-right">
                            {c.status === 'draft' ? (
                              <button
                                onClick={() => handleSend(c.id)}
                                disabled={isSending}
                                className="flex items-center gap-1.5 text-xs bg-[#0062ff] hover:bg-[#0052d4] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-semibold transition-all ml-auto"
                              >
                                {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                Gönder
                              </button>
                            ) : (
                              <Link href={`/campaigns/${c.id}`}
                                className="flex items-center gap-1 text-xs text-[#b4c5ff] hover:text-white font-semibold transition-colors ml-auto">
                                Detay <ArrowUpRight className="w-3 h-3" />
                              </Link>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                    {/* New row */}
                    <tr>
                      <td colSpan={7} className="px-5 py-3">
                        <Link href="/campaigns/new"
                          className="inline-flex items-center gap-2 text-xs text-[#8b95a8] hover:text-[#b4c5ff] font-semibold transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Yeni kampanya ekle
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}

              {!loading && filtered.length === 0 && campaigns.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#272a33] border border-[#272a33] flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[#b4c5ff]" />
                  </div>
                  <div className="text-center">
                    <p className="text-[#e2e8f8] font-semibold text-sm">Henüz kampanya yok</p>
                    <p className="text-[#8b95a8] text-xs mt-1">Yukarıdaki AI çubuğunu kullanarak ilk kampanyanızı oluşturun</p>
                  </div>
                  <Link href="/campaigns/templates"
                    className="flex items-center gap-2 text-sm bg-[#0062ff] hover:bg-[#0052d4] text-white px-5 py-2.5 rounded-lg font-semibold transition-all">
                    <Sparkles className="w-4 h-4" /> Şablon Seç
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
