'use client'

import { useState } from 'react'
import { Check, Zap, Star, Building2, Rocket, ArrowRight } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'
import { useSession } from '@/lib/hooks/use-session'

const plans = [
  {
    id: 'free',
    name: 'Free',
    icon: Rocket,
    price: { monthly: 0, yearly: 0 },
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
  },
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    price: { monthly: 19, yearly: 15 },
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
  },
  {
    id: 'growth',
    name: 'Growth',
    icon: Star,
    price: { monthly: 49, yearly: 39 },
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
  },
  {
    id: 'agency',
    name: 'Agency',
    icon: Building2,
    price: { monthly: 119, yearly: 95 },
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
  },
]

const faqs = [
  { q: 'Aylık kotayı aşarsam ne olur?', a: 'Mesaj gönderimleri durur. Ek kredi paketi satın alarak devam edebilirsiniz.' },
  { q: 'İstediğim zaman plan değiştirebilir miyim?', a: 'Evet, her an yükseltme veya düşürme yapabilirsiniz. Fark bir sonraki dönemde yansır.' },
  { q: 'Yıllık ödeme nasıl çalışır?', a: 'Yıllık planlar tek seferlik ödeme ile aktifleşir ve 12 ay boyunca geçerlidir.' },
  { q: 'WhatsApp gönderimi için ne gerekiyor?', a: 'Meta Business API onayı gerekiyor. Ayarlar → Entegrasyonlar bölümünden bağlayabilirsiniz.' },
]

export default function PlansPage() {
  const { data: session } = useSession()
  const currentPlan = (session?.user as { plan?: string })?.plan ?? 'free'
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <AppShell>
      <Header title="Planlar & Fiyatlandırma" subtitle="İhtiyacınıza göre plan seçin" />
      <div className="page-content space-y-10 flex-1 max-w-5xl">

        {/* Billing toggle */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['monthly', 'yearly'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                  billing === b
                    ? 'text-white'
                    : 'text-[#8c90a1] hover:text-[#c2c6d8]'
                )}
                style={billing === b ? { background: '#1c1b1b', border: '1px solid rgba(255,255,255,0.08)' } : undefined}
              >
                {b === 'monthly' ? 'Aylık' : 'Yıllık'}
                {b === 'yearly' && (
                  <span className="chip chip-green text-[9px]">%20 İndirim</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => {
            const Icon = plan.icon
            const price = plan.price[billing]
            const isCurrent = currentPlan === plan.id

            return (
              <div key={plan.id} className={cn('bento-card flex flex-col', plan.popular && 'gradient-border')}
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
                      <span className="text-3xl font-black" style={{ color: '#e5e2e1' }}>₺{price}</span>
                      <span className="text-xs mb-1" style={{ color: '#8c90a1' }}>/ay</span>
                    </div>
                    {billing === 'yearly' && plan.price.monthly > 0 && (
                      <p className="text-[10px] mt-0.5">
                        <span className="line-through" style={{ color: '#424656' }}>₺{plan.price.monthly}/ay</span>
                        <span className="ml-1" style={{ color: '#34d399' }}>%20 tasarruf</span>
                      </p>
                    )}
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
                    disabled={isCurrent}
                    onClick={() => {
                      if (!isCurrent && plan.id !== 'free') {
                        window.open('mailto:destek@marksio.com?subject=Plan Yükseltme - ' + plan.name, '_blank')
                      }
                    }}
                    className={cn(
                      'w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all',
                      isCurrent ? 'cursor-default' : 'cursor-pointer',
                      plan.popular && !isCurrent ? 'btn-gradient' : ''
                    )}
                    style={!plan.popular && !isCurrent ? {
                      background: '#1c1b1b',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: '#c2c6d8',
                    } : isCurrent ? {
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: '#424656',
                    } : undefined}
                  >
                    {isCurrent
                      ? <><Check className="w-3.5 h-3.5" /> Mevcut Plan</>
                      : <>{plan.cta} <ArrowRight className="w-3.5 h-3.5" /></>
                    }
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Current plan summary */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="label">Mevcut Plan</p>
              <p className="text-lg font-black capitalize" style={{ color: '#e5e2e1' }}>{currentPlan}</p>
            </div>
            <div className="text-right">
              <p className="label" style={{ textAlign: 'right' }}>Sonraki yenileme</p>
              <p className="text-sm" style={{ color: '#8c90a1' }}>1 Temmuz 2026</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <p className="label mb-5">Sık Sorulan Sorular</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map(item => (
              <div key={item.q} className="bento-card p-4">
                <p className="text-sm font-semibold mb-1.5" style={{ color: '#e5e2e1' }}>{item.q}</p>
                <p className="text-xs leading-relaxed" style={{ color: '#8c90a1' }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
