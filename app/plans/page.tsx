'use client'

import { useState, useEffect, Suspense } from 'react'
import {
  Check, Zap, Star, Building2, Rocket, ArrowRight, Loader2,
  CheckCircle, AlertCircle, ChevronDown, ExternalLink, Receipt,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'
import { useSession } from '@/lib/hooks/use-session'
import { useSearchParams, useRouter } from 'next/navigation'

// ─── Plan definitions ─────────────────────────────────────────────────────────

const plans = [
  {
    id: 'free',
    name: 'Free',
    icon: Rocket,
    price: 0,
    desc: 'Başlamak için ideal',
    accentColor: 'rgba(140,144,161,0.15)',
    accentBorder: 'rgba(140,144,161,0.2)',
    iconColor: '#8c90a1',
    features: [
      '1.000 email / ay',
      '1 kampanya',
      'AI kampanya üretimi',
      'Temel segmentasyon',
      'Dashboard analytics',
    ],
    cta: 'Ücretsiz Başla',
    lsVariant: null,
  },
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    price: 29,
    desc: 'Büyüyen mağazalar için',
    accentColor: 'rgba(0,102,255,0.08)',
    accentBorder: 'rgba(0,102,255,0.2)',
    iconColor: '#6b9fff',
    features: [
      '10.000 email / ay',
      '50 WhatsApp / ay',
      'AI kampanya üretimi',
      'Tüm segment tipleri',
      'Otomasyon akışları',
      'CSV / dosya import',
      'Email tracking & analytics',
    ],
    cta: "Starter'a Geç",
    lsVariant: 'starter',
  },
  {
    id: 'growth',
    name: 'Growth',
    icon: Star,
    price: 59,
    desc: 'En çok tercih edilen',
    popular: true,
    accentColor: 'rgba(0,241,254,0.06)',
    accentBorder: 'rgba(0,241,254,0.25)',
    iconColor: '#00f1fe',
    features: [
      '50.000 email / ay',
      '200 WhatsApp / ay',
      'AI kampanya üretimi',
      'Gelişmiş segmentasyon',
      'Tüm otomasyon tipleri',
      'Mail domain bağlama',
      'Email + WhatsApp tracking',
      'Öncelikli destek',
    ],
    cta: "Growth'a Geç",
    lsVariant: 'growth',
  },
  {
    id: 'agency',
    name: 'Agency',
    icon: Building2,
    price: 99,
    desc: 'Ajans ve yüksek hacim',
    accentColor: 'rgba(167,139,250,0.08)',
    accentBorder: 'rgba(167,139,250,0.2)',
    iconColor: '#a78bfa',
    features: [
      'Sınırsız email',
      'Sınırsız WhatsApp',
      'AI kampanya üretimi',
      'Tüm özellikler',
      'Çoklu mağaza desteği',
      'API erişimi',
      'Özel entegrasyonlar',
      'Dedicated destek',
    ],
    cta: "Agency'e Geç",
    lsVariant: 'agency',
  },
]

const faqs = [
  { q: 'Aylık kotayı aşarsam ne olur?',         a: 'Mesaj gönderimleri durur. Ek kredi paketi satın alarak devam edebilirsiniz.' },
  { q: 'İstediğim zaman plan değiştirebilir miyim?', a: 'Evet, her an yükseltme veya düşürme yapabilirsiniz. Fark bir sonraki dönemde yansır.' },
  { q: 'WhatsApp gönderimi için ne gerekiyor?',  a: 'Meta Business API onayı gerekiyor. Ayarlar → Entegrasyonlar bölümünden bağlayabilirsiniz.' },
  { q: 'Kredi kartım güvende mi?',               a: 'Tüm ödemeler Lemon Squeezy altyapısıyla işlenir. Kart bilgileri Marksio sistemlerine ulaşmaz.' },
  { q: 'Kampanya limiti aşılırsa ne olur?',      a: 'Yeni kampanya oluşturulamaz. Planınızı yükselterek devam edebilirsiniz.' },
  { q: 'Birden fazla mağaza bağlayabilir miyim?', a: 'Agency planında çoklu mağaza desteği bulunuyor. Diğer planlarda tek mağaza bağlayabilirsiniz.' },
  { q: 'İptal edersem verilerim silinir mi?',    a: 'Hayır. Plan iptal edilse bile verileriniz 30 gün boyunca saklanır. Bu süre içinde yeniden aktifleştirebilirsiniz.' },
  { q: 'Fatura ve ödeme yönetimi nerede?',       a: "Planlar sayfasındaki \"Faturalarım\" bölümünden tüm ödemelerinizi görüntüleyebilir ve fatura indirebilirsiniz." },
]

const PLAN_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: 'Aktif',             color: '#22c97a' },
  cancelled: { label: 'İptal Edildi',      color: '#f0a020' },
  expired:   { label: 'Süresi Doldu',      color: '#e84545' },
  past_due:  { label: 'Ödeme Gecikmiş',    color: '#e84545' },
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsageData {
  emailQuotaUsed: number
  emailQuotaLimit: number
  campaignCount: number
  campaignLimit: number
  whatsappQuotaUsed: number
  whatsappQuotaLimit: number
}

interface Invoice {
  id: string
  createdAt: string
  total: number
  currency: string
  status: string
  receiptUrl: string | null
  productName: string
}

// ─── Shared components ────────────────────────────────────────────────────────

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = limit === -1 || limit === 0
  const pct       = unlimited ? 0 : Math.min((used / limit) * 100, 100)
  const barColor  = pct >= 100 ? '#e84545' : pct >= 80 ? '#f0a020' : '#22c97a'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs" style={{ color: '#8c90a1' }}>{label}</p>
        <p className="text-xs font-mono" style={{ color: '#8c90a1' }}>
          {unlimited
            ? limit === 0 ? 'Bu planda yok' : `${used.toLocaleString('tr-TR')} / ∞`
            : `${used.toLocaleString('tr-TR')} / ${limit.toLocaleString('tr-TR')}`}
        </p>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1c1b1b' }}>
        {!unlimited && (
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, background: barColor }} />
        )}
        {limit === -1 && (
          <div className="h-full rounded-full" style={{ width: '30%', background: 'rgba(34,201,122,0.3)' }} />
        )}
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bento-card overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left">
        <p className="text-sm font-semibold" style={{ color: '#e5e2e1' }}>{q}</p>
        <ChevronDown className={cn('w-4 h-4 shrink-0 transition-transform', open && 'rotate-180')}
          style={{ color: '#8c90a1' }} />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-xs leading-relaxed" style={{ color: '#8c90a1' }}>{a}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

function PlansContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router       = useRouter()

  const currentPlan = (session?.user as { plan?: string })?.plan ?? 'free'
  const planStatus  = (session?.user as { planStatus?: string })?.planStatus ?? 'active'
  const renewsAt    = (session?.user as { planRenewsAt?: string })?.planRenewsAt

  const [loadingPlan,    setLoadingPlan]    = useState<string | null>(null)
  const [toast,          setToast]          = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [usage,          setUsage]          = useState<UsageData | null>(null)
  const [usageLoading,   setUsageLoading]   = useState(true)
  const [invoices,       setInvoices]       = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [portalUrl,      setPortalUrl]      = useState<string | null>(null)

  // Handle redirect back from Lemon Squeezy
  useEffect(() => {
    const success   = searchParams.get('success')
    const cancelled = searchParams.get('cancelled')
    const plan      = searchParams.get('plan')

    if (success) {
      setToast({ type: 'success', msg: `${plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Plan'} planı aktif edildi! Birkaç saniye içinde güncellenir.` })
      router.replace('/plans')
    } else if (cancelled) {
      setToast({ type: 'error', msg: 'Ödeme iptal edildi.' })
      router.replace('/plans')
    }
  }, [searchParams, router])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    fetch('/api/billing/usage')
      .then(r => r.ok ? r.json() : null)
      .then((d: UsageData | null) => { if (d) setUsage(d) })
      .catch(() => {})
      .finally(() => setUsageLoading(false))

    fetch('/api/billing/invoices')
      .then(r => r.ok ? r.json() : null)
      .then((d: { orders?: Invoice[] } | null) => { if (d?.orders) setInvoices(d.orders) })
      .catch(() => {})
      .finally(() => setInvoicesLoading(false))

    if (currentPlan !== 'free') {
      fetch('/api/billing/portal')
        .then(r => r.ok ? r.json() : null)
        .then((d: { url?: string } | null) => { if (d?.url) setPortalUrl(d.url) })
        .catch(() => {})
    }
  }, [currentPlan])

  async function handleUpgrade(planId: string) {
    if (!planId || planId === 'free') return
    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json() as { url?: string; error?: string }

      if (!res.ok || !data.url) {
        setToast({ type: 'error', msg: data.error ?? 'Checkout oluşturulamadı' })
        return
      }

      window.location.href = data.url
    } catch {
      setToast({ type: 'error', msg: 'Bağlantı hatası. Lütfen tekrar deneyin.' })
    } finally {
      setLoadingPlan(null)
    }
  }

  const statusInfo = PLAN_STATUS_LABELS[planStatus] ?? PLAN_STATUS_LABELS.active

  const renewalText = (() => {
    if (currentPlan === 'free') return 'Ücretsiz plan — süre sınırı yok'
    if (!renewsAt) return 'Bilinmiyor'
    return new Date(renewsAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  })()

  return (
    <AppShell>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-[13px] font-semibold"
          style={{
            background: toast.type === 'success' ? 'rgba(34,201,122,0.12)' : 'rgba(232,69,69,0.12)',
            border: `1px solid ${toast.type === 'success' ? 'rgba(34,201,122,0.3)' : 'rgba(232,69,69,0.3)'}`,
            color: toast.type === 'success' ? '#22c97a' : '#e84545',
            backdropFilter: 'blur(20px)',
          }}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      <Header title="Planlar & Fiyatlandırma" subtitle="İhtiyacınıza göre plan seçin" />
      <div className="page-content space-y-10 flex-1 max-w-5xl">

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => {
            const Icon      = plan.icon
            const isCurrent = currentPlan === plan.id
            const isLoading = loadingPlan === plan.id

            return (
              <div key={plan.id} className={cn('bento-card flex flex-col relative', plan.popular && 'gradient-border')}
                style={plan.popular ? {
                  borderColor: plan.accentBorder,
                  background: `linear-gradient(145deg, ${plan.accentColor}, #131313)`,
                } : undefined}
              >
                {plan.popular && (
                  <div className="absolute top-0 inset-x-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, #00f1fe, rgba(0,102,255,0.6), transparent)' }} />
                )}
                {plan.popular && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2">
                    <span className="text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-b-lg block"
                      style={{ background: 'linear-gradient(270deg, #001849, #003fa4, #00f1fe)', backgroundSize: '200%', color: '#fff' }}>
                      En Popüler
                    </span>
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: plan.accentColor, border: `1px solid ${plan.accentBorder}` }}>
                    <Icon className="w-4 h-4" style={{ color: plan.iconColor }} />
                  </div>

                  <p className="text-base font-black" style={{ color: '#e5e2e1' }}>{plan.name}</p>
                  <p className="text-[11px] mb-5 mt-0.5" style={{ color: '#424656' }}>{plan.desc}</p>

                  <div className="mb-5">
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black" style={{ color: '#e5e2e1' }}>${plan.price}</span>
                      <span className="text-xs mb-1" style={{ color: '#8c90a1' }}>/ay</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs" style={{ color: '#8c90a1' }}>
                        <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#34d399' }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={isCurrent || isLoading || !plan.lsVariant}
                    onClick={() => plan.lsVariant && !isCurrent && handleUpgrade(plan.id)}
                    className={cn(
                      'w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all',
                      isCurrent ? 'cursor-default' : plan.lsVariant ? 'cursor-pointer' : 'cursor-default',
                      plan.popular && !isCurrent && plan.lsVariant ? 'btn-gradient' : '',
                    )}
                    style={!plan.popular && !isCurrent && plan.lsVariant ? {
                      background: '#1c1b1b',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: '#c2c6d8',
                    } : isCurrent ? {
                      background: 'rgba(34,201,122,0.08)',
                      border: '1px solid rgba(34,201,122,0.2)',
                      color: '#22c97a',
                    } : plan.id === 'free' ? {
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: '#424656',
                    } : undefined}
                  >
                    {isLoading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Yükleniyor…</>
                      : isCurrent
                      ? <><Check className="w-3.5 h-3.5" /> Mevcut Plan</>
                      : plan.id === 'free'
                      ? 'Ücretsiz'
                      : <>{plan.cta} <ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Current plan summary */}
        <div className="stat-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="label">Mevcut Plan</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-lg font-black capitalize" style={{ color: '#e5e2e1' }}>
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${statusInfo.color}15`, color: statusInfo.color, border: `1px solid ${statusInfo.color}30` }}>
                  {statusInfo.label}
                </span>
              </div>
              {planStatus === 'past_due' && (
                <p className="text-[11px] mt-1" style={{ color: '#e84545' }}>
                  Ödeme alınamadı. Hesabınızı aktif tutmak için ödeme yöntemini güncelleyin.
                </p>
              )}
              {planStatus === 'cancelled' && renewsAt && (
                <p className="text-[11px] mt-1" style={{ color: '#f0a020' }}>
                  Plan {new Date(renewsAt).toLocaleDateString('tr-TR')} tarihinde sona erecek.
                </p>
              )}
            </div>
            <div className="text-right space-y-2">
              <div>
                <p className="label" style={{ textAlign: 'right' }}>
                  {currentPlan === 'free' ? 'Plan türü' : 'Sonraki yenileme'}
                </p>
                <p className="text-sm" style={{ color: '#8c90a1' }}>{renewalText}</p>
              </div>
              {currentPlan !== 'free' && portalUrl && (
                <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold"
                  style={{ color: '#6b9fff' }}>
                  Planı Yönet <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Usage bars in current plan card */}
          {usage && (
            <div className="space-y-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <UsageBar
                label="Email Gönderimi"
                used={usage.emailQuotaUsed}
                limit={usage.emailQuotaLimit}
              />
              <UsageBar
                label="Kampanyalar (bu ay)"
                used={usage.campaignCount}
                limit={usage.campaignLimit}
              />
            </div>
          )}
          {usageLoading && (
            <div className="space-y-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {[1, 2].map(i => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-32 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-1.5 w-full rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bu Ay Kullanımın */}
        <div>
          <p className="label mb-4">Bu Ay Kullanımın</p>
          {usageLoading ? (
            <div className="bento-card p-5 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-40 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-1.5 w-full rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>
              ))}
            </div>
          ) : usage ? (
            <div className="bento-card p-5 space-y-4">
              <UsageBar
                label="Email Gönderimi"
                used={usage.emailQuotaUsed}
                limit={usage.emailQuotaLimit}
              />
              <UsageBar
                label="Kampanyalar"
                used={usage.campaignCount}
                limit={usage.campaignLimit}
              />
              {currentPlan !== 'free' && (
                <UsageBar
                  label="WhatsApp Mesajı"
                  used={usage.whatsappQuotaUsed}
                  limit={usage.whatsappQuotaLimit}
                />
              )}
            </div>
          ) : (
            <div className="bento-card p-5">
              <p className="text-xs" style={{ color: '#8c90a1' }}>Kullanım verisi yüklenemedi.</p>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div>
          <p className="label mb-4">Sık Sorulan Sorular</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {faqs.map(item => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>

        {/* Faturalarım */}
        <div>
          <p className="label mb-4">Faturalarım</p>
          {invoicesLoading ? (
            <div className="bento-card p-5 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="bento-card p-8 flex flex-col items-center gap-2">
              <Receipt className="w-8 h-8" style={{ color: '#424656' }} />
              <p className="text-sm" style={{ color: '#8c90a1' }}>Henüz ödeme geçmişiniz yok.</p>
            </div>
          ) : (
            <div className="bento-card overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {['Tarih', 'Plan', 'Tutar', 'Durum', ''].map(h => (
                  <p key={h} className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#424656' }}>{h}</p>
                ))}
              </div>
              {invoices.map(inv => (
                <div key={inv.id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3.5"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <p className="text-xs" style={{ color: '#8c90a1' }}>
                    {new Date(inv.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs font-medium" style={{ color: '#e5e2e1' }}>{inv.productName}</p>
                  <p className="text-xs font-mono" style={{ color: '#e5e2e1' }}>
                    ${inv.total.toFixed(2)}
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: inv.status === 'paid' ? 'rgba(34,201,122,0.1)' : 'rgba(240,160,32,0.1)',
                      color: inv.status === 'paid' ? '#22c97a' : '#f0a020',
                      border: `1px solid ${inv.status === 'paid' ? 'rgba(34,201,122,0.2)' : 'rgba(240,160,32,0.2)'}`,
                    }}>
                    {inv.status === 'paid' ? 'Ödendi' : inv.status}
                  </span>
                  {inv.receiptUrl ? (
                    <a href={inv.receiptUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold inline-flex items-center gap-1"
                      style={{ color: '#6b9fff' }}>
                      PDF <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs" style={{ color: '#424656' }}>—</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}

export default function PlansPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#4470ff' }} />
        </div>
      </AppShell>
    }>
      <PlansContent />
    </Suspense>
  )
}
