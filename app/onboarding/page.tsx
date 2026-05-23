'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, Check, ArrowRight, ArrowLeft,
  ShoppingBag, Globe, Mail, Phone, MessageSquare, Loader2,
} from 'lucide-react'
import { getUser, setUser } from '@/lib/auth'
import { cn } from '@/lib/utils'

const platforms = [
  { key: 'shopify',     label: 'Shopify',     logo: '🛍️', desc: 'mystore.myshopify.com' },
  { key: 'woocommerce', label: 'WooCommerce',  logo: '🛒', desc: 'WordPress + WooCommerce' },
  { key: 'other',       label: 'Diğer',        logo: '🌐', desc: 'Manuel entegrasyon' },
]

const channelList = [
  { key: 'email',     label: 'Email',     icon: Mail,          color: 'text-violet-600', bg: 'border-violet-200 bg-violet-50' },
  { key: 'sms',       label: 'SMS',       icon: Phone,         color: 'text-blue-600',   bg: 'border-blue-200 bg-blue-50' },
  { key: 'whatsapp',  label: 'WhatsApp',  icon: MessageSquare, color: 'text-emerald-600',bg: 'border-emerald-200 bg-emerald-50' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [platform, setPlatform] = useState('')
  const [storeUrl, setStoreUrl] = useState('')
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['email'])
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [storeName, setStoreName] = useState('')

  useEffect(() => {
    const u = getUser()
    if (!u) { router.replace('/login'); return }
    setStoreName(u.storeName || '')
  }, [router])

  function toggleChannel(key: string) {
    setSelectedChannels((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    )
  }

  async function handleConnect() {
    setConnecting(true)
    await new Promise((r) => setTimeout(r, 2000))
    setConnecting(false)
    setConnected(true)
  }

  async function handleFinish() {
    const u = getUser()
    if (u) setUser({ ...u, storeName: storeName || u.storeName })
    router.push('/dashboard')
  }

  const steps = [
    { label: 'Hoş Geldin', icon: Sparkles },
    { label: 'Mağaza Bağla', icon: ShoppingBag },
    { label: 'Kanallar', icon: Mail },
    { label: 'Hazır!', icon: Check },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-gray-900">Marksio</span>
        </div>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Atla
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => {
            const done = i < step
            const active = i === step
            return (
              <div key={s.label} className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  done ? 'bg-emerald-500 text-white' : active ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-400'
                )}>
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn('w-8 h-px', done ? 'bg-emerald-300' : 'bg-gray-200')} />
                )}
              </div>
            )
          })}
        </div>

        <div className="w-full max-w-lg">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Marksio&apos;ye Hoş Geldiniz! 🎉</h1>
              <p className="text-gray-500 mb-6">
                Birkaç adımda mağazanızı bağlayın ve AI destekli pazarlamaya başlayın.
                Kurulum 3 dakika sürer.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5 text-left">Mağaza Adınız</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Örn: Moda Butik"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-left mb-6">
                {[
                  { icon: '🤖', title: 'AI İçerik', desc: 'Otomatik kampanya oluştur' },
                  { icon: '📊', title: 'Analitik', desc: 'Gerçek zamanlı raporlar' },
                  { icon: '⚡', title: 'Otomasyon', desc: '7/24 çalışan akışlar' },
                ].map((f) => (
                  <div key={f.title} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">{f.icon}</div>
                    <p className="text-xs font-semibold text-gray-900">{f.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Kuruluma Başla
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 1: Store connection */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Mağazanızı Bağlayın</h2>
                <p className="text-sm text-gray-500 mt-1">E-ticaret platformunuzu seçin</p>
              </div>

              <div className="space-y-3 mb-6">
                {platforms.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPlatform(p.key)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                      platform === p.key ? 'border-violet-500 bg-violet-50' : 'border-gray-100 hover:border-gray-200'
                    )}
                  >
                    <span className="text-2xl">{p.logo}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{p.label}</p>
                      <p className="text-xs text-gray-400">{p.desc}</p>
                    </div>
                    {platform === p.key && (
                      <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {platform && !connected && (
                <div className="mb-5 space-y-3">
                  <input
                    type="text"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    placeholder={platform === 'shopify' ? 'mystore.myshopify.com' : 'mystore.com'}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder:text-gray-400"
                  />
                  <button
                    onClick={handleConnect}
                    disabled={!storeUrl || connecting}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all"
                  >
                    {connecting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Bağlanıyor...</>
                    ) : (
                      <><Globe className="w-4 h-4" />Mağazayı Bağla</>
                    )}
                  </button>
                </div>
              )}

              {connected && (
                <div className="mb-5 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Bağlantı Başarılı!</p>
                    <p className="text-xs text-emerald-600">{storeUrl} bağlandı · 5.832 müşteri içe aktarıldı</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Geri
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!platform}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-all"
                >
                  {connected ? 'Devam Et' : 'Atla'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Channels */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Kanalları Seçin</h2>
                <p className="text-sm text-gray-500 mt-1">Müşterilerinize hangi kanallardan ulaşmak istiyorsunuz?</p>
              </div>

              <div className="space-y-3 mb-8">
                {channelList.map((ch) => {
                  const selected = selectedChannels.includes(ch.key)
                  return (
                    <button
                      key={ch.key}
                      onClick={() => toggleChannel(ch.key)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                        selected ? cn('border-opacity-100', ch.bg) : 'border-gray-100 hover:border-gray-200'
                      )}
                    >
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', selected ? ch.bg : 'bg-gray-100')}>
                        <ch.icon className={cn('w-4 h-4', selected ? ch.color : 'text-gray-400')} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{ch.label}</p>
                        <p className="text-xs text-gray-400">
                          {ch.key === 'email' ? 'Detaylı içerik, yüksek dönüşüm' :
                           ch.key === 'sms' ? 'Anlık ulaşım, %98 açılma oranı' :
                           'Kişisel mesaj, %87 okunma oranı'}
                        </p>
                      </div>
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                        selected ? 'border-violet-600 bg-violet-600' : 'border-gray-300'
                      )}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Geri
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedChannels.length === 0}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-all"
                >
                  Devam Et
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Her şey hazır! 🚀</h2>
              <p className="text-gray-500 mb-6">
                {storeName || 'Mağazanız'} için AI destekli pazarlama başlamaya hazır.
                Dashboard&apos;unuzda sizi bekleyen veriler var.
              </p>

              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { value: '5.832', label: 'Müşteri İçe Aktarıldı' },
                  { value: selectedChannels.length.toString(), label: 'Kanal Aktif' },
                  { value: '14 gün', label: 'Ücretsiz Deneme' },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-lg font-bold text-gray-900">{s.value}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleFinish}
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl transition-all text-base"
              >
                <Sparkles className="w-5 h-5" />
                Dashboard&apos;a Git
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
