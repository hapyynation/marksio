'use client'

import { useState, useEffect } from 'react'
import { Mail, MessageSquare, Plus, TrendingUp, Eye, ShoppingBag, Calendar, Clock, Sparkles, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { formatCurrency, formatNumber, formatDate, cn } from '@/lib/utils'

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
  email:    { label: 'Email',    icon: Mail,          color: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/20' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
}

const statusConfig: Record<CampaignStatus, { label: string; badge: string }> = {
  completed: { label: 'Tamamlandı', badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  active:    { label: 'Aktif',      badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  scheduled: { label: 'Planlandı',  badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  draft:     { label: 'Taslak',     badge: 'bg-[#1e1e1e] text-gray-500 border border-[#2a2a2a]' },
}

const segmentLabel: Record<string, string> = {
  vip: 'VIP', loyal: 'Sadık', at_risk: 'Risk', new: 'Yeni', inactive: 'Pasif', all: 'Tümü',
}

function CampaignCard({ campaign, onSend }: { campaign: Campaign; onSend: (id: string) => void }) {
  const type = typeConfig[campaign.type] ?? typeConfig.email
  const status = statusConfig[campaign.status] ?? statusConfig.draft
  const Icon = type.icon
  const openRate = campaign.opened && campaign.sent ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : null
  const clickRate = campaign.sent ? ((campaign.clicked / campaign.sent) * 100).toFixed(1) : '0.0'
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!confirm(`"${campaign.name}" kampanyasını göndermek istiyor musunuz?`)) return
    setSending(true)
    onSend(campaign.id)
    setSending(false)
  }

  return (
    <div className="card p-5 hover:border-[#2a2a2a] transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border', type.bg)}>
            <Icon className={cn('w-5 h-5', type.color)} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-200 leading-tight">{campaign.name}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={cn('badge text-[11px]', status.badge)}>{status.label}</span>
              <span className="text-[11px] text-gray-700">·</span>
              <span className="text-[11px] text-gray-600">{segmentLabel[campaign.segment] || campaign.segment}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-white">{formatCurrency(campaign.revenue)}</p>
          <p className="text-xs text-gray-700 mt-0.5">gelir</p>
        </div>
      </div>

      {campaign.subject && (
        <p className="text-xs text-gray-600 bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-3 py-2 mb-4 truncate">
          {campaign.subject}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-300">{formatNumber(campaign.sent)}</p>
          <p className="text-[11px] text-gray-700 mt-0.5">Gönderildi</p>
        </div>
        {openRate && (
          <div className="text-center">
            <p className="text-sm font-semibold text-blue-400">%{openRate}</p>
            <p className="text-[11px] text-gray-700 mt-0.5">Açıldı</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-semibold text-purple-400">%{clickRate}</p>
          <p className="text-[11px] text-gray-700 mt-0.5">Tıklandı</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-1.5 text-xs text-gray-700">
          {campaign.status === 'draft'
            ? <span>Taslak</span>
            : campaign.scheduledAt
            ? <><Clock className="w-3 h-3 text-amber-500" /><span className="text-amber-600">{formatDate(campaign.scheduledAt)}</span></>
            : <><Calendar className="w-3 h-3" />{formatDate(campaign.createdAt)}</>
          }
        </div>
        {campaign.status === 'draft' ? (
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Gönder
          </button>
        ) : (
          <Link href={`/campaigns/${campaign.id}`} className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Detaylar →
          </Link>
        )}
      </div>
    </div>
  )
}

const typeFilters = [
  { key: 'all', label: 'Tümü' },
  { key: 'email', label: 'Email' },
  { key: 'whatsapp', label: 'WhatsApp' },
]

const statusFilters = [
  { key: 'all', label: 'Tüm Durumlar' },
  { key: 'draft', label: 'Taslak' },
  { key: 'active', label: 'Aktif' },
  { key: 'completed', label: 'Tamamlandı' },
  { key: 'scheduled', label: 'Planlandı' },
]

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sendingId, setSendingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCampaigns(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
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

  const filtered = campaigns.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    return true
  })

  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0)
  const totalConverted = campaigns.reduce((s, c) => s + c.converted, 0)

  return (
    <AppShell>
      <Header
        title="Kampanyalar"
        subtitle="Tüm pazarlama kampanyalarınız"
        actions={[
          { label: 'Email Editörü', href: '/campaigns/email-editor', variant: 'secondary' },
          { label: 'Yeni Kampanya', href: '/campaigns/new' },
        ]}
      />
      <div className="p-6 space-y-5 flex-1 bg-[#0a0a0a]">

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Toplam Gelir',    value: formatCurrency(totalRevenue), icon: TrendingUp,  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Toplam Gönderim', value: formatNumber(totalSent),      icon: Eye,         color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20' },
            { label: 'Toplam Dönüşüm',  value: formatNumber(totalConverted), icon: ShoppingBag, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          ].map(item => (
            <div key={item.label} className="card px-5 py-4 flex items-center gap-4">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border shrink-0', item.bg)}>
                <item.icon className={cn('w-5 h-5', item.color)} />
              </div>
              <div>
                <p className="text-xs text-gray-600">{item.label}</p>
                <p className="text-lg font-bold text-white mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-[#111] border border-[#1e1e1e] rounded-xl p-1">
            {typeFilters.map(f => (
              <button key={f.key} onClick={() => setTypeFilter(f.key)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  typeFilter === f.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-300 hover:bg-[#1a1a1a]')}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-[#111] border border-[#1e1e1e] rounded-xl p-1">
            {statusFilters.map(f => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  statusFilter === f.key ? 'bg-[#1e1e1e] text-gray-200' : 'text-gray-600 hover:text-gray-300 hover:bg-[#1a1a1a]')}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-700 ml-auto">{filtered.length} kampanya</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(c => <CampaignCard key={c.id} campaign={c} onSend={handleSend} />)}
            <Link href="/campaigns/new"
              className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[#1e1e1e] bg-transparent hover:border-blue-500/30 hover:bg-blue-500/5 transition-all cursor-pointer group min-h-[200px]">
              <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] group-hover:bg-blue-500/10 border border-[#2a2a2a] group-hover:border-blue-500/30 flex items-center justify-center transition-all">
                <Sparkles className="w-6 h-6 text-gray-600 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-400 transition-colors">Yeni Kampanya</p>
                <p className="text-xs text-gray-700 mt-1">AI ile saniyeler içinde oluştur</p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="card p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mx-auto">
              <Plus className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium">Henüz kampanya yok</p>
              <p className="text-gray-700 text-xs mt-1">İlk kampanyanızı oluşturun</p>
            </div>
            <Link href="/campaigns/new" className="inline-flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" /> Kampanya Oluştur
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  )
}
