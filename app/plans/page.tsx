'use client'

import { useState } from 'react'
import { Check, Zap, Star, Building2, Rocket } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

const plans = [
  {
    id: 'free',
    name: 'Free',
    icon: Rocket,
    price: 0,
    desc: 'Başlamak için ideal',
    features: [
      '1.000 email / ay',
      '1 kampanya',
      'AI kampanya üretimi',
      'Temel segmentasyon',
      'Dashboard',
    ],
    cta: 'Ücretsiz Başla',
  },
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    price: 19,
    desc: 'Büyüyen mağazalar için',
    popular: false,
    features: [
      '10.000 email / ay',
      '50 SMS / ay',
      '20 WhatsApp / ay',
      'AI kampanya üretimi',
      'Tüm segmentler',
      'Otomasyon',
      'CSV import',
      'Email tracking',
    ],
    cta: "Starter'a Geç",
  },
  {
    id: 'growth',
    name: 'Growth',
    icon: Star,
    price: 49,
    desc: 'En çok tercih edilen',
    popular: true,
    features: [
      '50.000 email / ay',
      '200 SMS / ay',
      '75 WhatsApp / ay',
      'AI kampanya üretimi',
      'Gelişmiş segmentasyon',
      'Tüm otomasyonlar',
      'CSV import',
      'Email + SMS tracking',
      'Öncelikli destek',
    ],
    cta: "Growth'a Geç",
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Building2,
    price: 99,
    desc: 'Yüksek hacimli mağazalar',
    popular: false,
    features: [
      '200.000 email / ay',
      '500 SMS / ay',
      '150 WhatsApp / ay',
      'AI kampanya üretimi',
      'Gelişmiş segmentasyon',
      'Tüm otomasyonlar',
      'API erişimi',
      'Öncelikli destek',
      'Çoklu kullanıcı',
    ],
    cta: "Pro'ya Geç",
  },
]

const creditPacks = [
  { name: 'Email Paketi', amount: '50.000 email', price: 15, icon: '✉️' },
  { name: 'SMS Paketi', amount: '100 SMS', price: 8, icon: '📱' },
  { name: 'SMS Paketi', amount: '500 SMS', price: 35, icon: '📱' },
  { name: 'WhatsApp Paketi', amount: '100 konuşma', price: 10, icon: '💬' },
  { name: 'WhatsApp Paketi', amount: '500 konuşma', price: 40, icon: '💬' },
]

export default function PlansPage() {
  const { data: session } = useSession()
  const currentPlan = (session?.user as { plan?: string })?.plan || 'free'
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <AppShell>
      <Header
        title="Planlar & Fiyatlandırma"
        subtitle="İhtiyacınıza göre plan seçin"
      />
      <div className="p-6 space-y-8 flex-1">

        {/* Billing toggle */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all', billing === 'monthly' ? 'bg-[#2a2a2a] text-white' : 'text-gray-500 hover:text-gray-300')}
            >
              Aylık
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2', billing === 'yearly' ? 'bg-[#2a2a2a] text-white' : 'text-gray-500 hover:text-gray-300')}
            >
              Yıllık
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">%20 indirim</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-4 gap-4">
          {plans.map(plan => {
            const Icon = plan.icon
            const price = billing === 'yearly' ? Math.round(plan.price * 0.8) : plan.price
            const isCurrent = currentPlan === plan.id
            return (
              <div
                key={plan.id}
                className={cn(
                  'bg-[#111] border rounded-2xl p-6 flex flex-col relative',
                  plan.popular ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-[#1e1e1e]',
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
                    En Popüler
                  </div>
                )}
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', plan.id === 'free' ? 'bg-[#1a1a1a]' : 'bg-blue-500/10')}>
                  <Icon className={cn('w-5 h-5', plan.id === 'free' ? 'text-gray-400' : 'text-blue-400')} />
                </div>
                <p className="font-bold text-white text-lg">{plan.name}</p>
                <p className="text-xs text-gray-500 mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">${price}</span>
                  <span className="text-sm text-gray-500">/ay</span>
                  {billing === 'yearly' && plan.price > 0 && (
                    <span className="ml-2 text-xs text-gray-600 line-through">${plan.price}</span>
                  )}
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={isCurrent}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-sm font-semibold transition-all',
                    isCurrent
                      ? 'bg-[#1a1a1a] text-gray-500 cursor-default'
                      : plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-[#1a1a1a] hover:bg-[#222] text-gray-300 border border-[#2a2a2a]'
                  )}
                >
                  {isCurrent ? '✓ Mevcut Plan' : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        {/* Credit packs */}
        <div>
          <h2 className="text-base font-semibold text-white mb-4">Ek Kredi Paketleri</h2>
          <div className="grid grid-cols-5 gap-3">
            {creditPacks.map((pack, i) => (
              <div key={i} className="bg-[#111] border border-[#1e1e1e] hover:border-blue-500/30 rounded-2xl p-4 text-center transition-all cursor-pointer">
                <div className="text-2xl mb-2">{pack.icon}</div>
                <p className="text-xs font-semibold text-gray-200">{pack.name}</p>
                <p className="text-xs text-gray-500 mt-1">{pack.amount}</p>
                <p className="text-xl font-bold text-white mt-3">${pack.price}</p>
                <button className="mt-3 w-full py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-xl transition">
                  Satın Al
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Sık Sorulan Sorular</h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              { q: 'Aylık kotayı aşarsam ne olur?', a: 'Mesaj gönderimleri durur. Ek kredi paketi satın alarak devam edebilirsiniz.' },
              { q: 'İstediğim zaman plan değiştirebilir miyim?', a: 'Evet, her an yükseltme veya düşürme yapabilirsiniz. Fark bir sonraki dönemde yansır.' },
              { q: 'Kredi paketleri ne kadar süre geçerli?', a: 'Satın alınan krediler 12 ay boyunca geçerlidir, sonraki dönemlere taşınmaz.' },
              { q: 'WhatsApp gönderimi için ne gerekiyor?', a: 'Meta Business API onayı gerekiyor. Twilio üzerinden 1-2 günde alınabilir.' },
            ].map(item => (
              <div key={item.q}>
                <p className="text-sm font-semibold text-gray-200">{item.q}</p>
                <p className="text-xs text-gray-500 mt-1">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
