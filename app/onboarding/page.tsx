'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, Check, ArrowRight, ArrowLeft,
  ShoppingBag, Globe, Mail, MessageSquare,
  Users, Target, ShoppingCart, Heart, TrendingUp, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'İşletme',   icon: Sparkles     },
  { label: 'Platform',  icon: ShoppingBag  },
  { label: 'Kanallar',  icon: Mail         },
  { label: 'Hedef',     icon: Target       },
  { label: 'Hazır',     icon: Check        },
]

const PLATFORMS = [
  { key: 'shopify',     label: 'Shopify',     logo: '🛍️', desc: 'mystore.myshopify.com' },
  { key: 'ikas',        label: 'İkas',         logo: '🇹🇷', desc: 'Türkiye\'nin e-ticaret platformu' },
  { key: 'woocommerce', label: 'WooCommerce',  logo: '🛒', desc: 'WordPress + WooCommerce' },
  { key: 'other',       label: 'Diğer',        logo: '🌐', desc: 'Manuel entegrasyon' },
]

const TEAM_SIZES = [
  { key: '1', label: 'Sadece ben' },
  { key: '2-5', label: '2-5 kişi' },
  { key: '6-20', label: '6-20 kişi' },
  { key: '20+', label: '20+ kişi' },
]

const GOALS = [
  { key: 'more_sales',     icon: TrendingUp,   label: 'Daha fazla satış',        desc: 'Kampanyalarla geliri artır' },
  { key: 'cart_recovery',  icon: ShoppingCart, label: 'Terk edilmiş sepet',      desc: 'Kaçan satışları geri kazan' },
  { key: 'loyalty',        icon: Heart,        label: 'Müşteri sadakati',         desc: 'Tekrar alışveriş oranını artır' },
  { key: 'new_customers',  icon: Users,        label: 'Yeni müşteri kazanımı',    desc: 'Müşteri tabanını genişlet' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  // Step 0 — business
  const [businessName, setBusinessName] = useState('')
  const [teamSize, setTeamSize]         = useState('')

  // Step 1 — platform
  const [platform, setPlatform] = useState('')
  const [wantMailDomain, setWantMailDomain] = useState<boolean | null>(null)

  // Step 2 — channels
  const [channels, setChannels] = useState<string[]>(['email'])

  // Step 3 — goal
  const [goal, setGoal] = useState('')
  const [wantWhatsApp, setWantWhatsApp] = useState<boolean | null>(null)

  useEffect(() => {
    // Pre-fill business name from session if available
    try {
      const raw = localStorage.getItem('marksio-user')
      if (raw) {
        const u = JSON.parse(raw)
        if (u.storeName) setBusinessName(u.storeName)
      }
    } catch {}
  }, [])

  function toggleChannel(key: string) {
    setChannels(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key])
  }

  async function handleFinish() {
    setSaving(true)
    try {
      await fetch('/api/settings/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, teamSize, platform, channels, goal, wantMailDomain, wantWhatsApp }),
      })
    } catch {}
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">Marksio</span>
        </div>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-600 hover:text-gray-400 transition-colors">
          Atla
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => {
            const done   = i < step
            const active = i === step
            return (
              <div key={s.label} className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-[#1a1a1a] text-gray-600 border border-[#2a2a2a]'
                )}>
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('w-8 h-px', done ? 'bg-emerald-500/40' : 'bg-[#2a2a2a]')} />
                )}
              </div>
            )
          })}
        </div>

        <div className="w-full max-w-lg">

          {/* ── Step 0: Business info ── */}
          {step === 0 && (
            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-8">
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-7 h-7 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white text-center mb-1">Marksio&apos;ya Hoş Geldiniz</h1>
              <p className="text-gray-500 text-sm text-center mb-8">Kurulum sadece 2 dakika sürer.</p>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">İşletme Adınız</label>
                  <input
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="Örn: Moda Butik"
                    className="w-full px-4 py-3 bg-[#111] border border-[#2a2a2a] text-white placeholder:text-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Ekip Büyüklüğünüz</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEAM_SIZES.map(t => (
                      <button
                        key={t.key}
                        onClick={() => setTeamSize(t.key)}
                        className={cn(
                          'px-4 py-2.5 rounded-xl text-sm font-medium border transition-all text-left',
                          teamSize === t.key
                            ? 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                            : 'border-[#2a2a2a] bg-[#111] text-gray-500 hover:border-[#3a3a3a] hover:text-gray-300'
                        )}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={!businessName}
                className="w-full mt-8 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Devam Et <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 1: Platform ── */}
          {step === 1 && (
            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-1">Hangi platformu kullanıyorsunuz?</h2>
              <p className="text-sm text-gray-500 mb-6">E-ticaret platformunuzu seçin</p>

              <div className="space-y-2 mb-7">
                {PLATFORMS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setPlatform(p.key)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
                      platform === p.key ? 'border-blue-500/50 bg-blue-500/10' : 'border-[#2a2a2a] bg-[#111] hover:border-[#3a3a3a]'
                    )}
                  >
                    <span className="text-2xl">{p.logo}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{p.label}</p>
                      <p className="text-xs text-gray-500">{p.desc}</p>
                    </div>
                    {platform === p.key && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="mb-7">
                <p className="text-sm font-semibold text-white mb-3">Mail domaininizi bağlamak ister misiniz?</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ key: true, label: 'Evet, bağlamak istiyorum' }, { key: false, label: 'Şimdi değil' }].map(opt => (
                    <button
                      key={String(opt.key)}
                      onClick={() => setWantMailDomain(opt.key)}
                      className={cn(
                        'py-2.5 px-4 rounded-xl text-sm font-medium border transition-all',
                        wantMailDomain === opt.key ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-[#2a2a2a] bg-[#111] text-gray-500 hover:border-[#3a3a3a]'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-300 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Geri
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all"
                >
                  Devam Et <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Channels ── */}
          {step === 2 && (
            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-1">Hangi kanalları kullanacaksınız?</h2>
              <p className="text-sm text-gray-500 mb-6">Müşterilerinize hangi kanallardan ulaşmak istiyorsunuz?</p>

              <div className="space-y-3 mb-7">
                {[
                  { key: 'email',    icon: Mail,          label: 'Email Kampanyaları',    desc: 'Detaylı içerik, yüksek dönüşüm', color: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/30' },
                  { key: 'whatsapp', icon: MessageSquare, label: 'WhatsApp Chatbot',       desc: 'Kişisel mesaj, %87 okunma oranı', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
                ].map(ch => {
                  const selected = channels.includes(ch.key)
                  return (
                    <button
                      key={ch.key}
                      onClick={() => toggleChannel(ch.key)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
                        selected ? cn(ch.bg) : 'border-[#2a2a2a] bg-[#111] hover:border-[#3a3a3a]'
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', selected ? ch.bg : 'bg-[#1a1a1a] border-[#2a2a2a]')}>
                        <ch.icon className={cn('w-5 h-5', selected ? ch.color : 'text-gray-600')} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{ch.label}</p>
                        <p className="text-xs text-gray-500">{ch.desc}</p>
                      </div>
                      <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', selected ? 'border-blue-600 bg-blue-600' : 'border-[#3a3a3a]')}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-300 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Geri
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={channels.length === 0}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl transition-all"
                >
                  Devam Et <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Goal ── */}
          {step === 3 && (
            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-1">Hedefiniz nedir?</h2>
              <p className="text-sm text-gray-500 mb-6">Marksio'yu en çok hangi amaçla kullanacaksınız?</p>

              <div className="grid grid-cols-2 gap-2 mb-7">
                {GOALS.map(g => {
                  const Icon = g.icon
                  return (
                    <button
                      key={g.key}
                      onClick={() => setGoal(g.key)}
                      className={cn(
                        'p-4 rounded-xl border transition-all text-left',
                        goal === g.key ? 'border-blue-500/50 bg-blue-500/10' : 'border-[#2a2a2a] bg-[#111] hover:border-[#3a3a3a]'
                      )}
                    >
                      <Icon className={cn('w-5 h-5 mb-2', goal === g.key ? 'text-blue-400' : 'text-gray-600')} />
                      <p className="text-sm font-semibold text-white">{g.label}</p>
                      <p className="text-[11px] text-gray-600 mt-0.5">{g.desc}</p>
                    </button>
                  )
                })}
              </div>

              <div className="mb-7">
                <p className="text-sm font-semibold text-white mb-3">WhatsApp AI Chatbot kullanacak mısınız?</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ key: true, label: 'Evet' }, { key: false, label: 'Henüz değil' }].map(opt => (
                    <button
                      key={String(opt.key)}
                      onClick={() => setWantWhatsApp(opt.key)}
                      className={cn(
                        'py-2.5 px-4 rounded-xl text-sm font-medium border transition-all',
                        wantWhatsApp === opt.key ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-[#2a2a2a] bg-[#111] text-gray-500 hover:border-[#3a3a3a]'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-300 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Geri
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all"
                >
                  Devam Et <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Done ── */}
          {step === 4 && (
            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Her şey hazır!</h2>
              <p className="text-gray-500 text-sm mb-8">
                {businessName} için AI destekli pazarlama başlamaya hazır.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { value: platform || 'Manuel', label: 'Platform' },
                  { value: channels.length.toString(), label: 'Kanal Aktif' },
                  { value: '14 gün', label: 'Ücretsiz Deneme' },
                ].map(s => (
                  <div key={s.label} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3">
                    <p className="text-base font-bold text-white capitalize">{s.value}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {wantMailDomain && (
                <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl text-left">
                  <p className="text-xs font-semibold text-blue-400 mb-1">Mail Domain Hatırlatması</p>
                  <p className="text-xs text-blue-400/70">Dashboard&apos;a girdikten sonra Ayarlar → Mail Domain bölümünden domaininizi bağlayabilirsiniz.</p>
                </div>
              )}

              <button
                onClick={handleFinish}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all text-base"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {saving ? 'Kaydediliyor...' : 'Dashboard\'a Git'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
