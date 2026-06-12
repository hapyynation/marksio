'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Store, Link2, Zap, ArrowRight, ArrowLeft, Check,
  ShoppingBag, LayoutGrid, Users, Loader2, AlertCircle, Eye, EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const INDUSTRIES = [
  'Moda', 'Elektronik', 'Ev & Yaşam', 'Kozmetik', 'Spor', 'Gıda', 'Diğer',
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

const INPUT_STYLE = {
  background: '#0a0a14',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#e5e2e1',
} as const

function inputCls() {
  return 'w-full px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/30'
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]           = useState(1)
  const [storeName, setStoreName] = useState('')
  const [storeUrl, setStoreUrl]   = useState('')
  const [industry, setIndustry]   = useState('')
  const [saving, setSaving]       = useState(false)
  const [checking, setChecking]   = useState(true)

  // Platform connection state
  const [expanded, setExpanded]         = useState<string | null>(null)
  const [connected, setConnected]       = useState<string[]>([])
  const [connecting, setConnecting]     = useState(false)
  const [connectError, setConnectError] = useState('')

  // Shopify
  const [shopDomain, setShopDomain] = useState('')

  // İkas
  const [ikasStore, setIkasStore]   = useState('')
  const [ikasToken, setIkasToken]   = useState('')
  const [showIkasToken, setShowIkasToken] = useState(false)

  // WooCommerce
  const [wooUrl, setWooUrl]         = useState('')
  const [wooKey, setWooKey]         = useState('')
  const [wooSecret, setWooSecret]   = useState('')
  const [showWooKey, setShowWooKey]     = useState(false)
  const [showWooSecret, setShowWooSecret] = useState(false)

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

  function togglePlatform(id: string) {
    setConnectError('')
    setExpanded(prev => prev === id ? null : id)
  }

  function handleShopifyConnect() {
    if (!shopDomain.trim()) return
    const clean = shopDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
    const domain = clean.includes('.') ? clean : `${clean}.myshopify.com`
    window.location.href = `/api/integrations/shopify/auth?shop=${encodeURIComponent(domain)}`
  }

  async function handleIkasConnect() {
    if (!ikasStore.trim() || !ikasToken.trim()) return
    setConnecting(true); setConnectError('')
    try {
      const res  = await fetch('/api/integrations/ikas/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName: ikasStore.trim(), accessToken: ikasToken.trim() }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Bağlantı hatası')
      setConnected(p => [...p, 'ikas'])
      setExpanded(null)
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Bağlantı hatası')
    } finally { setConnecting(false) }
  }

  async function handleWooConnect() {
    if (!wooUrl.trim() || !wooKey.trim() || !wooSecret.trim()) return
    setConnecting(true); setConnectError('')
    try {
      const res  = await fetch('/api/integrations/woocommerce/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeUrl: wooUrl.trim(), consumerKey: wooKey.trim(), consumerSecret: wooSecret.trim() }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Bağlantı hatası')
      setConnected(p => [...p, 'woocommerce'])
      setExpanded(null)
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Bağlantı hatası')
    } finally { setConnecting(false) }
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
                    className={cn('pl-9 pr-4', inputCls())}
                    style={INPUT_STYLE}
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
                    className={cn('pl-9 pr-4', inputCls())}
                    style={INPUT_STYLE}
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

              {/* ── Shopify ── */}
              <div className="rounded-xl overflow-hidden" style={{
                background: '#0f0f1a',
                border: connected.includes('shopify') ? '1px solid rgba(34,201,122,0.3)' : '1px solid rgba(255,255,255,0.07)',
              }}>
                <button
                  onClick={() => !connected.includes('shopify') && togglePlatform('shopify')}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🛍️</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#e5e2e1' }}>Shopify</p>
                      <p className="text-xs" style={{ color: '#424656' }}>Shopify mağazanı bağla</p>
                    </div>
                  </div>
                  {connected.includes('shopify') ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                      style={{ background: 'rgba(34,201,122,0.1)', border: '1px solid rgba(34,201,122,0.25)', color: '#22c97a' }}>
                      <Check className="w-3.5 h-3.5" /> Bağlandı
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.2)', color: '#6b9fff' }}>
                      {expanded === 'shopify' ? 'Kapat' : 'Bağla'}
                    </span>
                  )}
                </button>

                {expanded === 'shopify' && (
                  <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs pt-3" style={{ color: '#8c90a1' }}>
                      Mağaza adresinizi girin. OAuth sayfasına yönlendirileceksiniz.
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={shopDomain}
                        onChange={e => setShopDomain(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleShopifyConnect()}
                        placeholder="magazaniz.myshopify.com"
                        className={inputCls()}
                        style={INPUT_STYLE}
                      />
                      <button
                        onClick={handleShopifyConnect}
                        disabled={!shopDomain.trim()}
                        className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all"
                        style={{ background: '#96bf48', color: '#fff' }}>
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── İkas ── */}
              <div className="rounded-xl overflow-hidden" style={{
                background: '#0f0f1a',
                border: connected.includes('ikas') ? '1px solid rgba(34,201,122,0.3)' : '1px solid rgba(255,255,255,0.07)',
              }}>
                <button
                  onClick={() => !connected.includes('ikas') && togglePlatform('ikas')}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏪</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#e5e2e1' }}>İkas</p>
                      <p className="text-xs" style={{ color: '#424656' }}>İkas mağazanı bağla</p>
                    </div>
                  </div>
                  {connected.includes('ikas') ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                      style={{ background: 'rgba(34,201,122,0.1)', border: '1px solid rgba(34,201,122,0.25)', color: '#22c97a' }}>
                      <Check className="w-3.5 h-3.5" /> Bağlandı
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.2)', color: '#6b9fff' }}>
                      {expanded === 'ikas' ? 'Kapat' : 'Bağla'}
                    </span>
                  )}
                </button>

                {expanded === 'ikas' && (
                  <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs pt-3" style={{ color: '#8c90a1' }}>
                      İkas Admin → API → Token oluştur
                    </p>
                    <input
                      value={ikasStore}
                      onChange={e => setIkasStore(e.target.value)}
                      placeholder="Mağaza adı (örn: magazaniz)"
                      className={inputCls()}
                      style={INPUT_STYLE}
                    />
                    <div className="relative">
                      <input
                        type={showIkasToken ? 'text' : 'password'}
                        value={ikasToken}
                        onChange={e => setIkasToken(e.target.value)}
                        placeholder="API Token"
                        className={cn('pr-10', inputCls())}
                        style={INPUT_STYLE}
                      />
                      <button type="button" onClick={() => setShowIkasToken(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#424656' }}>
                        {showIkasToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {connectError && expanded === 'ikas' && (
                      <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                        style={{ background: 'rgba(232,69,69,0.08)', border: '1px solid rgba(232,69,69,0.2)', color: '#e84545' }}>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {connectError}
                      </div>
                    )}
                    <button
                      onClick={handleIkasConnect}
                      disabled={connecting || !ikasStore.trim() || !ikasToken.trim()}
                      className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#0066ff,#00f1fe)', color: '#fff' }}>
                      {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                      {connecting ? 'Bağlanıyor...' : 'Bağla'}
                    </button>
                  </div>
                )}
              </div>

              {/* ── WooCommerce ── */}
              <div className="rounded-xl overflow-hidden" style={{
                background: '#0f0f1a',
                border: connected.includes('woocommerce') ? '1px solid rgba(34,201,122,0.3)' : '1px solid rgba(255,255,255,0.07)',
              }}>
                <button
                  onClick={() => !connected.includes('woocommerce') && togglePlatform('woocommerce')}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🛒</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#e5e2e1' }}>WooCommerce</p>
                      <p className="text-xs" style={{ color: '#424656' }}>WooCommerce mağazanı bağla</p>
                    </div>
                  </div>
                  {connected.includes('woocommerce') ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                      style={{ background: 'rgba(34,201,122,0.1)', border: '1px solid rgba(34,201,122,0.25)', color: '#22c97a' }}>
                      <Check className="w-3.5 h-3.5" /> Bağlandı
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg"
                      style={{ background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.2)', color: '#6b9fff' }}>
                      {expanded === 'woocommerce' ? 'Kapat' : 'Bağla'}
                    </span>
                  )}
                </button>

                {expanded === 'woocommerce' && (
                  <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs pt-3" style={{ color: '#8c90a1' }}>
                      WooCommerce → Ayarlar → Gelişmiş → REST API
                    </p>
                    <input
                      value={wooUrl}
                      onChange={e => setWooUrl(e.target.value)}
                      placeholder="https://magazaniz.com"
                      className={inputCls()}
                      style={INPUT_STYLE}
                    />
                    <div className="relative">
                      <input
                        type={showWooKey ? 'text' : 'password'}
                        value={wooKey}
                        onChange={e => setWooKey(e.target.value)}
                        placeholder="Consumer Key (ck_...)"
                        className={cn('pr-10', inputCls())}
                        style={INPUT_STYLE}
                      />
                      <button type="button" onClick={() => setShowWooKey(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#424656' }}>
                        {showWooKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showWooSecret ? 'text' : 'password'}
                        value={wooSecret}
                        onChange={e => setWooSecret(e.target.value)}
                        placeholder="Consumer Secret (cs_...)"
                        className={cn('pr-10', inputCls())}
                        style={INPUT_STYLE}
                      />
                      <button type="button" onClick={() => setShowWooSecret(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#424656' }}>
                        {showWooSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {connectError && expanded === 'woocommerce' && (
                      <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                        style={{ background: 'rgba(232,69,69,0.08)', border: '1px solid rgba(232,69,69,0.2)', color: '#e84545' }}>
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {connectError}
                      </div>
                    )}
                    <button
                      onClick={handleWooConnect}
                      disabled={connecting || !wooUrl.trim() || !wooKey.trim() || !wooSecret.trim()}
                      className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#0066ff,#00f1fe)', color: '#fff' }}>
                      {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                      {connecting ? 'Bağlanıyor...' : 'Bağla'}
                    </button>
                  </div>
                )}
              </div>

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
                {connected.length > 0 ? 'Devam Et →' : 'Şimdilik Atla →'}
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
