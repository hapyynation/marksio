'use client'

import { use, useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Mail, Phone, MessageSquare, ShoppingCart,
  TrendingUp, Calendar, Tag, Star, Clock, Package,
  Sparkles, Send, Loader2, AlertCircle, ShoppingBag,
  CheckCircle, XCircle, Truck, RotateCcw, CreditCard,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { formatCurrency, formatNumber, formatDate, timeAgo, cn } from '@/lib/utils'

const segmentConfig: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  vip:      { label: 'VIP',          color: 'text-amber-400',   bg: 'bg-amber-500/10',   desc: '5+ sipariş, yüksek harcama' },
  loyal:    { label: 'Sadık',        color: 'text-blue-400',    bg: 'bg-blue-500/10',    desc: 'Düzenli alıcı' },
  at_risk:  { label: 'Risk Altında', color: 'text-red-400',     bg: 'bg-red-500/10',     desc: '60+ gün inaktif' },
  new:      { label: 'Yeni',         color: 'text-emerald-400', bg: 'bg-emerald-500/10', desc: 'Son 30 günde kayıt' },
  inactive: { label: 'Pasif',        color: 'text-gray-400',    bg: 'bg-gray-500/10',    desc: '90+ gün inaktif' },
}

const orderStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: 'Bekliyor',      color: 'text-amber-400 bg-amber-500/10',   icon: Clock       },
  confirmed: { label: 'Onaylandı',     color: 'text-blue-400 bg-blue-500/10',     icon: CheckCircle },
  shipped:   { label: 'Kargoda',       color: 'text-violet-400 bg-violet-500/10', icon: Truck       },
  delivered: { label: 'Teslim Edildi', color: 'text-emerald-400 bg-emerald-500/10', icon: CheckCircle },
  cancelled: { label: 'İptal',         color: 'text-red-400 bg-red-500/10',       icon: XCircle     },
  refunded:  { label: 'İade',          color: 'text-gray-400 bg-gray-500/10',     icon: RotateCcw   },
}

const eventTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  order_placed:    { label: 'Sipariş Oluşturuldu', icon: ShoppingBag,  color: 'text-emerald-400 bg-emerald-500/10' },
  cart_abandoned:  { label: 'Sepet Terk Edildi',   icon: ShoppingCart, color: 'text-amber-400 bg-amber-500/10'    },
  order_delivered: { label: 'Sipariş Teslim',      icon: Package,      color: 'text-blue-400 bg-blue-500/10'      },
  customer_created:{ label: 'Kayıt Oldu',          icon: CheckCircle,  color: 'text-violet-400 bg-violet-500/10'  },
  email_sent:      { label: 'Email Gönderildi',    icon: Mail,         color: 'text-gray-400 bg-gray-500/10'      },
}

interface OrderItem {
  id: string
  title: string
  variantTitle: string | null
  quantity: number
  price: number
}

interface Order {
  id: string
  orderNumber: string | null
  platformOrderId: string | null
  status: string
  financialStatus: string | null
  total: number
  currency: string
  placedAt: string
  items: OrderItem[]
}

interface CustomerEvent {
  id: string
  type: string
  source: string
  data: Record<string, unknown>
  createdAt: string
  processedAt: string | null
}

interface CustomerDetail {
  id: string
  name: string
  email: string
  phone: string | null
  segment: string
  totalOrders: number
  totalSpent: number
  avgOrder: number
  lastOrder: string | null
  tags: string[]
  score: number
  source: string
  createdAt: string
  orders: Order[]
  events: CustomerEvent[]
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(r => {
        if (r.status === 404) { setError('not_found'); return null }
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(d => { if (d) setCustomer(d) })
      .catch(() => setError('Müşteri yüklenirken bir hata oluştu.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <AppShell>
        <Header title="Müşteri Profili" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      </AppShell>
    )
  }

  if (error === 'not_found') notFound()

  if (error || !customer) {
    return (
      <AppShell>
        <Header title="Müşteri Profili" />
        <div className="p-6">
          <div className="bg-[#111] border border-red-500/20 rounded-2xl p-6 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error || 'Bir hata oluştu.'}</p>
          </div>
        </div>
      </AppShell>
    )
  }

  const seg = segmentConfig[customer.segment] ?? segmentConfig.new
  const initials = customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const activityScore = Math.min(100,
    customer.segment === 'vip' ? 95 :
    customer.segment === 'loyal' ? 75 :
    customer.segment === 'new' ? 60 :
    customer.segment === 'at_risk' ? 35 : 15
  )

  return (
    <AppShell>
      <Header
        title={customer.name}
        subtitle={`${seg.label} Müşteri`}
      />

      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-5xl">
        <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Müşterilere Dön
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sol kolon */}
          <div className="space-y-5">
            {/* Profil kartı */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold mb-3">
                  {initials}
                </div>
                <h2 className="text-base font-bold text-white">{customer.name}</h2>
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full mt-2', seg.color, seg.bg)}>
                  {seg.label}
                </span>
                <p className="text-xs text-gray-500 mt-1">{seg.desc}</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2.5 text-gray-400">
                  <Mail className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  <span className="truncate text-xs">{customer.email}</span>
                </div>
                {customer.phone && (
                  <div className="flex items-center gap-2.5 text-gray-400">
                    <Phone className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                    <span className="text-xs">{customer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-gray-400">
                  <Calendar className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  <span className="text-xs">Kayıt: {formatDate(customer.createdAt)}</span>
                </div>
                {customer.lastOrder && (
                  <div className="flex items-center gap-2.5 text-gray-400">
                    <Clock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                    <span className="text-xs">Son sipariş: {timeAgo(customer.lastOrder)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-gray-500">
                  <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs capitalize">{customer.source}</span>
                </div>
              </div>

              {customer.tags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#1e1e1e]">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tag className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-xs font-medium text-gray-500">Etiketler</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {customer.tags.map((tag) => (
                      <span key={tag} className="text-[11px] bg-[#1a1a1a] text-gray-400 px-2 py-0.5 rounded-full border border-[#2a2a2a]">
                        {tag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hızlı iletişim */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">Hızlı İletişim</h3>
              <div className="space-y-2">
                <Link
                  href={`/campaigns/new?to=${customer.id}`}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Email Kampanyası
                </Link>
                <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp Gönder
                </button>
              </div>
            </div>

            {/* AI önerileri */}
            <div className="relative bg-[#111] border border-blue-500/20 rounded-2xl p-5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-blue-500/40 to-transparent" />
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">AI Önerileri</span>
              </div>
              <ul className="space-y-2.5">
                {customer.segment === 'vip' && [
                  'VIP müşteri — özel erken erişim kampanyası öner.',
                  'AOV yüksek: premium ürün koleksiyonu tanıt.',
                  'WhatsApp kişiselleştirilmiş mesaj gönder.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                    <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>{tip}
                  </li>
                ))}
                {customer.segment === 'at_risk' && [
                  'Geri kazanım kampanyası başlat — %15 indirim.',
                  'Son sepet terk etme tarihi kontrol et.',
                  'Win-back otomasyonu tetikle.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                    <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>{tip}
                  </li>
                ))}
                {!['vip', 'at_risk'].includes(customer.segment) && [
                  'Alışveriş geçmişine göre ürün öner.',
                  'Sadakat programına davet et.',
                  'Özel indirim kodu gönder.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                    <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>{tip}
                  </li>
                ))}
              </ul>
              <Link
                href="/campaigns/new"
                className="mt-4 flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Kampanya Oluştur
              </Link>
            </div>
          </div>

          {/* Sağ kolon */}
          <div className="lg:col-span-2 space-y-5">
            {/* Metrikler */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Toplam Sipariş',      value: formatNumber(customer.totalOrders), icon: ShoppingCart, color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
                { label: 'Toplam Harcama',       value: formatCurrency(customer.totalSpent), icon: TrendingUp,  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Ort. Sipariş Değeri',  value: formatCurrency(customer.avgOrder),  icon: Star,        color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
              ].map((m) => (
                <div key={m.label} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-3', m.bg)}>
                    <m.icon className={cn('w-4 h-4', m.color)} />
                  </div>
                  <p className="text-xl font-bold text-white">{m.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Sipariş geçmişi */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-white">Sipariş Geçmişi</h3>
                </div>
                <span className="text-xs text-gray-500">{customer.orders.length} sipariş</span>
              </div>

              {customer.orders.length === 0 ? (
                <div className="px-5 py-10 text-center text-gray-600">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Henüz sipariş yok</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1e1e1e]">
                  {customer.orders.map((order) => {
                    const st = orderStatusConfig[order.status] ?? orderStatusConfig.confirmed
                    const StIcon = st.icon
                    return (
                      <div key={order.id} className="px-5 py-3.5 hover:bg-[#141414] transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {order.orderNumber ?? `#${order.id.slice(-6)}`}
                            </span>
                            <span className={cn('flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium', st.color)}>
                              <StIcon className="w-2.5 h-2.5" />
                              {st.label}
                            </span>
                            {order.financialStatus && (
                              <span className="flex items-center gap-1 text-[11px] text-gray-600">
                                <CreditCard className="w-2.5 h-2.5" />
                                {order.financialStatus}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">{formatCurrency(order.total)}</p>
                            <p className="text-[11px] text-gray-500">{formatDate(order.placedAt)}</p>
                          </div>
                        </div>
                        {order.items.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {order.items.map(item => (
                              <span key={item.id} className="text-[11px] bg-[#1a1a1a] text-gray-500 px-2 py-0.5 rounded-full border border-[#2a2a2a]">
                                {item.quantity}× {item.title}{item.variantTitle ? ` (${item.variantTitle})` : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Event timeline */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-white">Aktivite Geçmişi</h3>
                </div>
                <span className="text-xs text-gray-500">{customer.events.length} olay</span>
              </div>

              {customer.events.length === 0 ? (
                <div className="px-5 py-10 text-center text-gray-600">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Henüz aktivite yok</p>
                </div>
              ) : (
                <div className="px-5 py-4 space-y-3">
                  {customer.events.map((event) => {
                    const cfg = eventTypeConfig[event.type] ?? { label: event.type, icon: Clock, color: 'text-gray-400 bg-gray-500/10' }
                    const Ico = cfg.icon
                    return (
                      <div key={event.id} className="flex items-start gap-3">
                        <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5', cfg.color)}>
                          <Ico className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-300">{cfg.label}</p>
                            <span className="text-[11px] text-gray-600 shrink-0">{timeAgo(event.createdAt)}</span>
                          </div>
                          {event.data && Object.keys(event.data).length > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {event.data.orderNumber ? `Sipariş ${String(event.data.orderNumber)}` : ''}
                              {event.data.total ? ` · ₺${String(event.data.total)}` : ''}
                              {event.data.checkoutId ? `Checkout #${String(event.data.checkoutId).slice(-6)}` : ''}
                            </p>
                          )}
                          {event.processedAt && (
                            <span className="text-[10px] text-emerald-500">otomasyon işlendi</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Skor */}
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Müşteri Değer Skoru</h3>
              <div className="space-y-3">
                {[
                  { label: 'Satın Alma Sıklığı', value: Math.min(100, customer.totalOrders * 10), color: 'bg-blue-500'    },
                  { label: 'Harcama Değeri',     value: Math.min(100, Math.round(customer.totalSpent / 100)), color: 'bg-emerald-500' },
                  { label: 'Son Aktivite',       value: activityScore, color: 'bg-amber-500' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500">{s.label}</span>
                      <span className="text-xs font-semibold text-gray-300">{s.value}/100</span>
                    </div>
                    <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', s.color)} style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
