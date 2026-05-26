'use client'

import { useState } from 'react'
import { Check, Zap, Star, Building2, Rocket, ArrowRight } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

const plans = [
  {
    id: 'free',
    name: 'Free',
    icon: Rocket,
    price: { monthly: 0, yearly: 0 },
    desc: 'Başlamak için ideal',
    color: 'text-gray-400',
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
    color: 'text-blue-400',
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
    color: 'text-blue-400',
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
    color: 'text-violet-400',
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

export default function PlansPage() {
  const { data: session } = useSession()
  const currentPlan = (session?.user as { plan?: string })?.plan ?? 'free'
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <AppShell>
      <Header title="Planlar & Fiyatlandırma" subtitle="İhtiyacınıza göre plan seçin" />
      <div className="p-6 space-y-10 flex-1 max-w-5xl">

        {/* Billing toggle */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-1">
            {(['monthly', 'yearly'] as const).map(b => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all',
                  billing === b ? 'bg-[#1a1a1a] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {b === 'monthly' ? 'Aylık' : 'Yıllık'}
                {b === 'yearly' && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">%20 İndirim</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-4 gap-4">
          {plans.map(plan => {
            const Icon     = plan.icon
            const price    = plan.price[billing]
            const isCurrent = currentPlan === plan.id

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border overflow-hidden transition-all',
                  plan.popular
                    ? 'border-blue-500/50 bg-gradient-to-b from-blue-500/5 to-[#0d0d0d]'
                    : 'border-[#1e1e1e] bg-[#0d0d0d]'
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                )}
                {plan.popular && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-b-lg block">En Popüler</span>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-4 border',
                    plan.popular ? 'bg-blue-500/10 border-blue-500/20' : 'bg-[#111] border-[#2a2a2a]')}>
                    <Icon className={cn('w-4.5 h-4.5', plan.color)} />
                  </div>

                  <p className="font-bold text-white text-lg leading-tight">{plan.name}</p>
                  <p className="text-xs text-gray-600 mb-5 mt-0.5">{plan.desc}</p>

                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-white">${price}</span>
                      <span className="text-sm text-gray-600 mb-1">/ay</span>
                    </div>
                    {billing === 'yearly' && plan.price.monthly > 0 && (
                      <p className="text-xs text-gray-700 mt-0.5">
                        <span className="line-through">${plan.price.monthly}/ay</span>
                        <span className="text-emerald-500 ml-1">%20 tasarruf</span>
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-7 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={isCurrent}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
                      isCurrent
                        ? 'bg-[#1a1a1a] text-gray-600 cursor-default border border-[#2a2a2a]'
                        : plan.popular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-[#111] hover:bg-[#1a1a1a] text-gray-300 border border-[#2a2a2a]'
                    )}
                  >
                    {isCurrent ? (
                      <><Check className="w-4 h-4" /> Mevcut Plan</>
                    ) : (
                      <>{plan.cta} <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Current plan summary */}
        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mb-1">Mevcut Plan</p>
              <p className="text-lg font-bold text-white capitalize">{currentPlan}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 mb-1">Sonraki yenileme</p>
              <p className="text-sm text-gray-400">1 Temmuz 2026</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">Sık Sorulan Sorular</h2>
          <div className="grid grid-cols-2 gap-5">
            {[
              { q: 'Aylık kotayı aşarsam ne olur?', a: 'Mesaj gönderimleri durur. Ek kredi paketi satın alarak devam edebilirsiniz.' },
              { q: 'İstediğim zaman plan değiştirebilir miyim?', a: 'Evet, her an yükseltme veya düşürme yapabilirsiniz. Fark bir sonraki dönemde yansır.' },
              { q: 'Yıllık ödeme nasıl çalışır?', a: 'Yıllık planlar tek seferlik ödeme ile aktifleşir ve 12 ay boyunca geçerlidir.' },
              { q: 'WhatsApp gönderimi için ne gerekiyor?', a: 'Meta Business API onayı gerekiyor. Ayarlar → Entegrasyonlar bölümünden bağlayabilirsiniz.' },
            ].map(item => (
              <div key={item.q} className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-200 mb-1.5">{item.q}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
