'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Zap, Play, Pause, Plus, Mail, MessageSquare,
  ShoppingCart, UserPlus, Gift, Clock, Package, TrendingUp,
  Sparkles, Trash2, Loader2, AlertCircle, ArrowRight,
  ChevronRight, BarChart3, Target, Crown, Flame,
  CheckCircle, Activity, Settings2, Workflow,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'

const channelIcon: Record<string, React.ElementType> = { email: Mail, whatsapp: MessageSquare }
const channelStyle: Record<string, { color: string; bg: string; dot: string }> = {
  email:    { color: 'text-[#b4c5ff]', bg: 'bg-[#b4c5ff]/10 border-[#b4c5ff]/20', dot: 'bg-[#b4c5ff]' },
  whatsapp: { color: 'text-teal-400',  bg: 'bg-teal-500/10 border-teal-500/20',    dot: 'bg-teal-500' },
}

const triggerMeta: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  cart_abandon:   { label: 'Sepet Terk',          icon: ShoppingCart, color: 'text-blue-400',    bg: 'from-blue-950/60' },
  cart_abandoned: { label: 'Sepet Terk',          icon: ShoppingCart, color: 'text-blue-400',    bg: 'from-blue-950/60' },
  new_signup:     { label: 'Yeni Kayıt',           icon: UserPlus,    color: 'text-violet-400',  bg: 'from-violet-950/60' },
  birthday:       { label: 'Doğum Günü',           icon: Gift,         color: 'text-amber-400',   bg: 'from-amber-950/60' },
  no_purchase:    { label: 'Satın Alma Yok',       icon: Clock,        color: 'text-red-400',     bg: 'from-red-950/60' },
  order_complete: { label: 'Sipariş Tamamlandı',   icon: Package,      color: 'text-emerald-400', bg: 'from-emerald-950/60' },
  order_placed:   { label: 'Sipariş Oluşturuldu', icon: TrendingUp,  color: 'text-cyan-400',    bg: 'from-cyan-950/60' },
}

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  active:  { label: 'Aktif',        dot: 'bg-emerald-400 animate-pulse', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  paused:  { label: 'Duraklatıldı', dot: 'bg-amber-400',                  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  draft:   { label: 'Taslak',       dot: 'bg-[#8b95a8]',                  badge: 'bg-[#272a33] text-[#8b95a8] border-[#272a33]' },
}

const automationTemplates = [
  {
    name: 'Sepet Terk Akışı',
    icon: ShoppingCart,
    desc: 'Email + WhatsApp ile geri kazan',
    trigger: 'cart_abandon',
    color: 'from-blue-600 to-cyan-600',
    glow: 'shadow-blue-500/20',
    steps: '2 adım · 1s + 3s',
    rate: '%32 dönüşüm',
  },
  {
    name: 'Hoş Geldin Serisi',
    icon: UserPlus,
    desc: 'İlk 7 gün otomasyon',
    trigger: 'new_signup',
    color: 'from-violet-600 to-purple-600',
    glow: 'shadow-violet-500/20',
    steps: '3 adım · 1g + 3g + 7g',
    rate: '%28 dönüşüm',
  },
  {
    name: 'VIP Ödüllendirme',
    icon: Crown,
    desc: 'Sadık müşteriyi ödüllendir',
    trigger: 'birthday',
    color: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20',
    steps: '2 adım · 0s + 1g',
    rate: '%41 dönüşüm',
  },
  {
    name: 'Win-Back Kampanya',
    icon: Flame,
    desc: 'Pasif müşteriyi geri çek',
    trigger: 'no_purchase',
    color: 'from-rose-600 to-pink-600',
    glow: 'shadow-rose-500/20',
    steps: '2 adım · 7g + 14g',
    rate: '%19 dönüşüm',
  },
]

interface AutomationStep {
  id: string
  channel: string
  immediate: boolean
  delayAmount: string
  delayUnit: string
  message: string
}

interface AutomationItem {
  id: string
  name: string
  trigger: string
  status: string
  segment: string | null
  steps: AutomationStep[]
  sent: number
  converted: number
  revenue: number
  createdAt: string
}

function stepLabel(step: AutomationStep): string {
  return step.immediate ? 'Hemen' : `${step.delayAmount || '1'}${step.delayUnit?.[0] || 's'}`
}

function AutomationCard({ auto, onToggle, onDelete }: {
  auto: AutomationItem
  onToggle: () => void
  onDelete: () => void
}) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const status = statusConfig[auto.status] ?? statusConfig.draft
  const meta = triggerMeta[auto.trigger] ?? { label: auto.trigger, icon: Zap, color: 'text-[#8b95a8]', bg: 'from-gray-900/60' }
  const TriggerIcon = meta.icon
  const convRate = auto.sent > 0 ? ((auto.converted / auto.sent) * 100).toFixed(1) : '0.0'
  const uniqueChannels = [...new Set(auto.steps.map(s => s.channel))]

  async function handleToggle() {
    setToggling(true)
    onToggle()
    setToggling(false)
  }

  async function handleDelete() {
    if (!confirm(`"${auto.name}" otomasyonunu silmek istiyor musunuz?`)) return
    setDeleting(true)
    onDelete()
  }

  return (
    <div className={cn(
      'group relative rounded-lg border border-[#272a33] bg-[#191b24] overflow-hidden transition-all duration-200 hover:border-[#b4c5ff]/20',
      auto.status === 'active' && 'hover:shadow-lg hover:shadow-[#b4c5ff]/5'
    )}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 transition-all',
            auto.status === 'active' ? 'bg-[#b4c5ff]/10 border-[#b4c5ff]/20' : 'bg-[#272a33] border-[#272a33]'
          )}>
            <TriggerIcon className={cn('w-5 h-5 transition-colors', auto.status === 'active' ? meta.color : 'text-[#8b95a8]')} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="text-sm font-bold text-[#e2e8f8]">{auto.name}</h3>
                <p className="text-xs text-[#8b95a8] mt-0.5">{meta.label}</p>
              </div>
              <span className={cn('text-[10px] font-bold px-2 py-1 rounded border flex items-center gap-1.5 shrink-0', status.badge)}>
                <span className={cn('w-1.5 h-1.5 rounded-full inline-block', status.dot)} />
                {status.label}
              </span>
            </div>

            {/* Flow visualization */}
            {auto.steps.length > 0 && (
              <div className="flex items-center gap-1 mb-3 flex-wrap">
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#272a33] border border-[#272a33] text-[10px] font-semibold text-[#8b95a8]">
                  <Zap className="w-3 h-3 text-[#b4c5ff]" />
                  <span className={meta.color}>{meta.label}</span>
                </div>
                {auto.steps.map((step, i) => {
                  const Icon = channelIcon[step.channel] ?? Mail
                  const style = channelStyle[step.channel] ?? channelStyle.email
                  return (
                    <div key={step.id} className="flex items-center gap-1">
                      <ArrowRight className="w-2.5 h-2.5 text-[#8b95a8]" />
                      <div className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border', style.bg, style.color)}>
                        <Icon className="w-3 h-3" />
                        <span>{stepLabel(step)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-2 p-3 bg-[#272a33] border border-[#272a33] rounded-lg mb-3">
              <div>
                <p className="text-sm font-bold text-[#e2e8f8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatNumber(auto.sent)}</p>
                <p className="text-[10px] text-[#8b95a8]">Gönderildi</p>
              </div>
              <div>
                <p className="text-sm font-bold text-[#e2e8f8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatNumber(auto.converted)}</p>
                <p className="text-[10px] text-[#8b95a8]">Dönüştü</p>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>%{convRate}</p>
                <p className="text-[10px] text-[#8b95a8]">Dönüşüm</p>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatCurrency(auto.revenue)}</p>
                <p className="text-[10px] text-[#8b95a8]">Gelir</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {uniqueChannels.map(ch => {
                  const Icon = channelIcon[ch] ?? Mail
                  const style = channelStyle[ch] ?? channelStyle.email
                  return (
                    <div key={ch} className={cn('w-6 h-6 rounded-lg flex items-center justify-center border', style.bg, style.color)}>
                      <Icon className="w-3 h-3" />
                    </div>
                  )
                })}
                {auto.segment && auto.segment !== 'all' && (
                  <span className="ml-2 text-[10px] text-[#8b95a8] font-medium">· {auto.segment}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={handleDelete} disabled={deleting}
                  className="p-1.5 text-[#8b95a8] hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
                  {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
                <Link href={`/automations/${auto.id}/builder`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-all">
                  <Workflow className="w-3 h-3" /> Görsel Builder
                </Link>
                {auto.status !== 'draft' && (
                  <button onClick={handleToggle} disabled={toggling}
                    className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border',
                      auto.status === 'active'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20')}>
                    {toggling ? <Loader2 className="w-3 h-3 animate-spin" /> :
                      auto.status === 'active' ? <><Pause className="w-3 h-3" /> Durdur</> : <><Play className="w-3 h-3" /> Başlat</>}
                  </button>
                )}
                {auto.status === 'draft' && (
                  <Link href={`/automations/new?id=${auto.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#b4c5ff]/10 text-[#b4c5ff] border border-[#b4c5ff]/20 hover:bg-[#b4c5ff]/20 transition-all">
                    <Settings2 className="w-3 h-3" /> Düzenle
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AutomationsPage() {
  const [items, setItems] = useState<AutomationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/automations')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Yüklenemedi')
      }
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleStatus(id: string) {
    const item = items.find(a => a.id === id)
    if (!item) return
    const newStatus = item.status === 'active' ? 'paused' : 'active'
    setItems(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
    try {
      await fetch(`/api/automations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch {
      setItems(prev => prev.map(a => a.id === id ? { ...a, status: item.status } : a))
    }
  }

  async function deleteAutomation(id: string) {
    setItems(prev => prev.filter(a => a.id !== id))
    try {
      await fetch(`/api/automations/${id}`, { method: 'DELETE' })
    } catch {
      load()
    }
  }

  const activeCount = items.filter(a => a.status === 'active').length
  const totalSent = items.reduce((s, a) => s + a.sent, 0)
  const totalRevenue = items.reduce((s, a) => s + a.revenue, 0)

  return (
    <AppShell>
      <Header
        title="Automation Studio"
        subtitle="Akıllı pazarlama otomasyonları"
        action={{ label: '+ Yeni Otomasyon', href: '/automations/new' }}
      />

      <div className="p-6 space-y-6 flex-1 bg-[#11131c]">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Aktif Otomasyon',  value: activeCount,                  icon: Activity,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Toplam Gönderim',  value: formatNumber(totalSent),      icon: BarChart3,  color: 'text-[#b4c5ff]',  bg: 'bg-[#b4c5ff]/10' },
            { label: 'Otomasyon Geliri', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          ].map(item => (
            <div key={item.label} className="bg-[#191b24] border border-[#272a33] rounded-lg px-5 py-4 hover:border-[#b4c5ff]/20 transition-all">
              <div className="flex items-center gap-4">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', item.bg)}>
                  <item.icon className={cn('w-5 h-5', item.color)} />
                </div>
                <div>
                  <p className="text-[11px] text-[#8b95a8] font-medium">{item.label}</p>
                  <p className="text-xl font-bold text-[#e2e8f8] mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Template Library */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#0062ff]/15 border border-[#b4c5ff]/20 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-[#b4c5ff]" />
            </div>
            <h2 className="text-sm font-bold text-[#e2e8f8]">Hazır Otomasyon Şablonları</h2>
            <span className="text-[10px] bg-[#b4c5ff]/10 text-[#b4c5ff] border border-[#b4c5ff]/20 px-2 py-0.5 rounded font-semibold">AI Optimize</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {automationTemplates.map(tpl => {
              const Icon = tpl.icon
              return (
                <Link key={tpl.name} href={`/automations/new?trigger=${tpl.trigger}`}
                  className="group relative rounded-lg border border-[#272a33] bg-[#191b24] p-4 hover:border-[#b4c5ff]/20 hover:scale-[1.01] transition-all duration-200 overflow-hidden">
                  <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3', tpl.color)}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs font-bold text-[#e2e8f8] group-hover:text-white mb-0.5 transition-colors">{tpl.name}</p>
                  <p className="text-[10px] text-[#8b95a8] mb-2">{tpl.desc}</p>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{tpl.rate}</span>
                  <p className="text-[10px] text-[#8b95a8] mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{tpl.steps}</p>
                  <div className="flex items-center gap-1 text-[10px] text-[#b4c5ff] mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                    Oluştur <ChevronRight className="w-3 h-3" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#272a33]" />
          <span className="text-[11px] text-[#8b95a8] font-medium" style={{ fontFamily: 'JetBrains Mono, monospace' }}>OTOMASYONLARıM</span>
          <div className="flex-1 h-px bg-[#272a33]" />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 text-[#b4c5ff] animate-spin" />
              <span className="text-xs text-[#8b95a8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Otomasyonlar yükleniyor...</span>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-5 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-400">Yükleme hatası</p>
              <p className="text-xs text-[#8b95a8] mt-0.5">{error}</p>
            </div>
            <button onClick={load} className="ml-auto text-xs text-[#8b95a8] hover:text-[#e2e8f8] transition-colors font-semibold">
              Tekrar dene
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-[#191b24] border border-[#272a33] rounded-lg p-16 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-xl bg-[#272a33] border border-[#272a33] flex items-center justify-center mx-auto">
                <Zap className="w-8 h-8 text-[#b4c5ff]" />
              </div>
              <div>
                <h3 className="text-[#e2e8f8] font-bold text-sm">Henüz otomasyon yok</h3>
                <p className="text-[#8b95a8] text-xs mt-1 max-w-xs mx-auto">Yukarıdaki şablonlardan birini seçin veya sıfırdan otomasyon oluşturun</p>
              </div>
              <Link href="/automations/new"
                className="inline-flex items-center gap-2 text-sm bg-[#0062ff] hover:bg-[#0052d4] text-white px-5 py-2.5 rounded-lg font-bold transition-all">
                <Plus className="w-4 h-4" /> Yeni Otomasyon Oluştur
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(auto => (
              <AutomationCard
                key={auto.id}
                auto={auto}
                onToggle={() => toggleStatus(auto.id)}
                onDelete={() => deleteAutomation(auto.id)}
              />
            ))}
            <Link href="/automations/new"
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-[#272a33] hover:border-[#b4c5ff]/30 hover:text-[#b4c5ff] text-[#8b95a8] rounded-lg transition-all text-sm font-semibold">
              <Plus className="w-4 h-4" /> Yeni Otomasyon Ekle
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  )
}
