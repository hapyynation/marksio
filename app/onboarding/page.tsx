'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Store, Link2, Zap, ArrowRight, ArrowLeft, Check,
  ShoppingBag, LayoutGrid, Users, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const INDUSTRIES = [
  'Moda', 'Elektronik', 'Ev & Yaşam', 'Kozmetik', 'Spor', 'Gıda', 'Diğer',
]

const PLATFORMS = [
  {
    id: 'shopify',
    name: 'Shopify',
    logo: '🛍️',
    desc: 'Shopify mağazanı bağla',
    connectUrl: '/api/integrations/shopify/auth',
  },
  {
    id: 'ikas',
    name: 'İkas',
    logo: '🏪',
    desc: 'İkas mağazanı bağla',
    connectUrl: '#',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    logo: '🛒',
    desc: 'WooCommerce mağazanı bağla',
    connectUrl: '#',
  },
]

const QUICK_STARTS = [
  {
    icon: Zap,
    title: 'İlk kampanyamı oluştur',
    desc: 'AI ile dakikalar içinde kampanya hazırla',
    href: '/ai-studio',
    color: '#4470ff',
    bg: 'rgba(68,112,255,0.08)',
    border: 'rgba(68,112,255,0.2)',
  },
  {
    icon: LayoutGrid,
    title: 'Otomasyonlarımı kur',
    desc: 'Sepet terk, hoş geldin, doğum günü akışları',
    href: '/automations',
    color: '#9f7afa',
    bg: 'rgba(159,122,250,0.08)',
    border: 'rgba(159,122,250,0.2)',
  },
  {
    icon: Users,
    title: 'Müşterilerimi içe aktar',
    desc: 'CSV ile mevcut müşteri listeni yükle',
    href: '/customers',
    color: '#22c97a',
    bg: 'rgba(34,201,122,0.08)',
    border: 'rgba(34,201,122,0.2)',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]           = useState(1)
  const [storeName, setStoreName] = useState('')
  const [storeUrl, setStoreUrl]   = useState('')
  const [industry, setIndustry]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [checking, setChecking]   = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then((d: { onboarded?: boolean }) => {
        if (d.onboarded) router.replace('/dashboard')
        else setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [router])

  async function complete(destination = '/dashboard') {
    setSaving(true)
    try {
      await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName: storeName.trim() || undefined, storeUrl, industry }),
      })
    } catch { /* ignore */ }
    router.push(destination)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080f' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#4470ff' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#08080f' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white"
            style={{ background: 'linear-gradient(135deg,#0066ff,#00f1fe)' }}>M</div>
          <span className="text-sm font-black" style={{ color: '#e5e2e1' }}>Marksio</span>
        </div>
        <button onClick={() => complete()} disabled={saving}
          className="text-xs font-medium transition-colors hover:opacity-70"
          style={{ color: '#424656' }}>
          Atla
        </button>
      </div>

      {/* Progress */}
      <div className="px-6 pt-8 pb-2 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all shrink-0"
                style={step > s
                  ? { background: '#22c97a', color: '#fff' }
                  : step === s
                  ? { background: 'linear-gradient(135deg,#0066ff,#00f1fe)', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#424656', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 3 && (
                <div className="flex-1 h-px" style={{
                  background: step > s ? '#22c97a' : 'rgba(255,255,255,0.06)',
                }} />
              )}
            </div>
          ))}
        </div>

        {/* ─── Step 1 — Mağaza Bilgileri ─────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black mb-1" style={{ color: '#e5e2e1' }}>Mağaza bilgilerini gir</h1>
              <p className="text-sm" style={{ color: '#8c90a1' }}>Marksio'yu senin için kişiselleştirelim.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8c90a1' }}>
                  Mağaza adı <span style={{ color: '#e84545' }}>*</span>
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#424656' }} />
                  <input
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="Örn: Moda Markam"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      background: '#0f0f1a',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#e5e2e1',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#8c90a1' }}>
                  Mağaza URL <span style={{ color: '#424656' }}>(opsiyonel)</span>
                </label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#424656' }} />
                  <input
                    value={storeUrl}
                    onChange={e => setStoreUrl(e.target.value)}
                    placeholder="https://magazam.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{
                      background: '#0f0f1a',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#e5e2e1',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#8c90a1' }}>Sektör</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {INDUSTRIES.map(ind => (
                    <button key={ind} onClick={() => setIndustry(ind === industry ? '' : ind)}
                      className="py-2 px-3 rounded-xl text-xs font-semibold transition-all"
                      style={industry === ind
                        ? { background: 'rgba(68,112,255,0.12)', border: '1px solid rgba(68,112,255,0.35)', color: '#6b9fff' }
                        : { background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', color: '#8c90a1' }
                      }>
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              disabled={!storeName.trim()}
              onClick={() => setStep(2)}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all',
                !storeName.trim() && 'opacity-40 cursor-not-allowed',
              )}
              style={{ background: 'linear-gradient(135deg,#0066ff,#00f1fe)', color: '#fff' }}>
              Devam Et <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── Step 2 — Mağaza Bağlantısı ─────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black mb-1" style={{ color: '#e5e2e1' }}>Mağazanı bağla</h1>
              <p className="text-sm" style={{ color: '#8c90a1' }}>
                Mağazanı bağlayarak müşteri ve sipariş verilerini otomatik çekebilirsin.
              </p>
            </div>

            <div className="space-y-3">
              {PLATFORMS.map(p => (
                <a key={p.id} href={p.connectUrl}
                  className="flex items-center justify-between p-4 rounded-xl transition-all group"
                  style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.logo}</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#e5e2e1' }}>{p.name}</p>
                      <p className="text-xs" style={{ color: '#424656' }}>{p.desc}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.2)', color: '#6b9fff' }}>
                    Bağla
                  </span>
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setStep(1)}
                className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-semibold"
                style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', color: '#8c90a1' }}>
                <ArrowLeft className="w-4 h-4" /> Geri
              </button>
              <button onClick={() => setStep(3)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-70"
                style={{ color: '#424656' }}>
                Şimdilik Atla →
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3 — İlk Kampanya ──────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-black mb-1" style={{ color: '#e5e2e1' }}>Nereden başlamak istersin?</h1>
              <p className="text-sm" style={{ color: '#8c90a1' }}>İstediğin zaman değiştirebilirsin.</p>
            </div>

            <div className="space-y-3">
              {QUICK_STARTS.map(qs => {
                const Icon = qs.icon
                return (
                  <button key={qs.href} onClick={() => complete(qs.href)} disabled={saving}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left hover:opacity-80"
                    style={{ background: qs.bg, border: `1px solid ${qs.border}` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${qs.color}20`, border: `1px solid ${qs.color}30` }}>
                      <Icon className="w-5 h-5" style={{ color: qs.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: '#e5e2e1' }}>{qs.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#8c90a1' }}>{qs.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 shrink-0" style={{ color: '#424656' }} />
                  </button>
                )
              })}
            </div>

            <button onClick={() => complete()} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
              style={{ background: 'linear-gradient(135deg,#0066ff,#00f1fe)', color: '#fff' }}>
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor…</>
                : <><ShoppingBag className="w-4 h-4" /> Panele Git</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
