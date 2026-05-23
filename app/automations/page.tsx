'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Zap, Play, Pause, Plus, Mail, Phone, MessageSquare,
  ShoppingCart, UserPlus, Gift, Clock, Package, TrendingUp,
  Sparkles, Trash2, Loader2, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'

const channelIcon: Record<string, React.ElementType> = {
  email: Mail, sms: Phone, whatsapp: MessageSquare,
}
const channelColor: Record<string, string> = {
  email:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
  sms:      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  whatsapp: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
}

const triggerMeta: Record<string, { label: string; icon: React.ElementType }> = {
  cart_abandon:   { label: 'Sepet Terk',          icon: ShoppingCart },
  cart_abandoned: { label: 'Sepet Terk',          icon: ShoppingCart },
  new_signup:     { label: 'Yeni Kayıt',           icon: UserPlus    },
  birthday:       { label: 'Doğum Günü',           icon: Gift        },
  no_purchase:    { label: 'Satın Alma Yok',       icon: Clock       },
  order_complete: { label: 'Sipariş Tamamlandı',   icon: Package     },
  order_placed:   { label: 'Sipariş Oluşturuldu', icon: TrendingUp  },
}

const statusConfig: Record<string, { label: string; badge: string; dot: string }> = {
  active:  { label: 'Aktif',        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  paused:  { label: 'Duraklatıldı', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       dot: 'bg-amber-400'   },
  draft:   { label: 'Taslak',       badge: 'bg-[#1e1e1e] text-gray-500 border-[#2a2a2a]',              dot: 'bg-gray-600'    },
}

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
  return step.immediate ? 'Hemen' : `${step.delayAmount || '1'} ${step.delayUnit} sonra`
}

function AutomationCard({
  auto,
  onToggle,
  onDelete,
}: {
  auto: AutomationItem
  onToggle: () => void
  onDelete: () => void
}) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const status = statusConfig[auto.status] ?? statusConfig.draft
  const meta = triggerMeta[auto.trigger] ?? { label: auto.trigger, icon: Zap }
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
    <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 hover:border-[#2a2a2a] transition-all animate-slide-up">
      <div className="flex items-start gap-4">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border',
          auto.status === 'active' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-[#1a1a1a] border-[#2a2a2a]'
        )}>
          <TriggerIcon className={cn('w-5 h-5', auto.status === 'active' ? 'text-blue-400' : 'text-gray-600')} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h3 className="text-sm font-semibold text-white">{auto.name}</h3>
              <p className="text-xs text-gray-600 mt-0.5">{meta.label}</p>
            </div>
            <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1.5', status.badge)}>
              <span className={cn('w-1.5 h-1.5 rounded-full inline-block', status.dot)} />
              {status.label}
            </span>
          </div>

          {/* Step flow */}
          {auto.steps.length > 0 && (
            <div className="flex items-center gap-1 mt-3 mb-4 flex-wrap">
              {auto.steps.map((step, i) => {
                const Icon = channelIcon[step.channel] ?? Mail
                return (
                  <div key={step.id} className="flex items-center gap-1">
                    <div className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border', channelColor[step.channel] ?? 'text-gray-500 bg-[#1a1a1a] border-[#2a2a2a]')}>
                      <Icon className="w-3 h-3" />
                      <span>{stepLabel(step)}</span>
                    </div>
                    {i < auto.steps.length - 1 && <span className="text-gray-700 text-xs">→</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-3 p-3 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl mb-3">
            <div>
              <p className="text-sm font-semibold text-white">{formatNumber(auto.sent)}</p>
              <p className="text-[11px] text-gray-600">Gönderildi</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{formatNumber(auto.converted)}</p>
              <p className="text-[11px] text-gray-600">Dönüştü</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-400">%{convRate}</p>
              <p className="text-[11px] text-gray-600">Dönüşüm</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{formatCurrency(auto.revenue)}</p>
              <p className="text-[11px] text-gray-600">Gelir</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {uniqueChannels.map(ch => {
                const Icon = channelIcon[ch] ?? Mail
                return (
                  <div key={ch} className={cn('w-6 h-6 rounded-lg flex items-center justify-center border', channelColor[ch] ?? 'text-gray-500 bg-[#1a1a1a] border-[#2a2a2a]')}>
                    <Icon className="w-3 h-3" />
                  </div>
                )
              })}
              {auto.segment && auto.segment !== 'all' && (
                <span className="ml-2 text-[11px] text-gray-600">· {auto.segment} segmenti</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 text-gray-700 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
              {auto.status !== 'draft' && (
                <button
                  onClick={handleToggle}
                  disabled={toggling}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    auto.status === 'active'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                  )}
                >
                  {auto.status === 'active'
                    ? <><Pause className="w-3 h-3" /> Durdur</>
                    : <><Play className="w-3 h-3" /> Başlat</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const templates = [
  { name: 'Sepet Terk Akışı',    icon: ShoppingCart, desc: 'Email + SMS + WhatsApp', trigger: 'cart_abandon',   color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  { name: 'Hoş Geldin Serisi',   icon: UserPlus,     desc: 'Email + WhatsApp',       trigger: 'new_signup',     color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
  { name: 'VIP Ödüllendirme',    icon: Gift,          desc: 'Email + WhatsApp + SMS', trigger: 'birthday',       color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  { name: 'Win-Back Kampanyası', icon: Clock,         desc: 'Email',                  trigger: 'no_purchase',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
]

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
      setError(e instanceof Error ? e.message : 'Otomasyonlar yüklenirken bir hata oluştu.')
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
        title="Otomasyonlar"
        subtitle="Otomatik pazarlama akışları"
        action={{ label: 'Yeni Otomasyon', href: '/automations/new' }}
      />

      <div className="p-4 lg:p-6 space-y-5 flex-1">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Aktif Otomasyon',   value: activeCount,               color: 'text-emerald-400', bar: 'from-emerald-500/40' },
            { label: 'Toplam Gönderilen', value: formatNumber(totalSent),   color: 'text-blue-400',    bar: 'from-blue-500/40'    },
            { label: 'Otomasyon Geliri',  value: formatCurrency(totalRevenue), color: 'text-white',    bar: 'from-violet-500/40'  },
          ].map(item => (
            <div key={item.label} className="relative bg-[#111] border border-[#1e1e1e] rounded-2xl px-5 py-4 overflow-hidden hover:border-[#2a2a2a] transition-all">
              <div className={cn('absolute top-0 left-0 right-0 h-px bg-gradient-to-r to-transparent', item.bar)} />
              <p className="text-xs text-gray-600 mb-1.5">{item.label}</p>
              <p className={cn('text-2xl font-bold tabular-nums', item.color)}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Templates */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Hazır Otomasyon Şablonları</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {templates.map(tpl => {
              const Icon = tpl.icon
              return (
                <Link
                  key={tpl.name}
                  href={`/automations/new?trigger=${tpl.trigger}`}
                  className="group p-4 rounded-xl border border-dashed border-[#2a2a2a] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left block"
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3 border transition-all', tpl.bg)}>
                    <Icon className={cn('w-4 h-4', tpl.color)} />
                  </div>
                  <p className="text-xs font-semibold text-gray-300 group-hover:text-white mb-0.5 transition-colors">{tpl.name}</p>
                  <p className="text-[11px] text-gray-600">{tpl.desc}</p>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-3 h-3" /> Oluştur
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-[#111] border border-red-500/20 rounded-2xl p-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-400">Hata</p>
              <p className="text-xs text-gray-500 mt-0.5">{error}</p>
            </div>
            <button onClick={load} className="ml-auto text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Tekrar dene
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Henüz otomasyon yok</h3>
            <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
              Yukarıdaki şablonlardan birini seçin ya da sıfırdan bir otomasyon oluşturun.
            </p>
            <Link
              href="/automations/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Yeni Otomasyon Oluştur
            </Link>
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
            <Link
              href="/automations/new"
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-[#1e1e1e] hover:border-blue-500/30 hover:text-blue-400 text-gray-600 rounded-2xl transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Yeni Otomasyon Ekle
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  )
}
