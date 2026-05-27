'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles, Check, ArrowRight, ArrowLeft, Loader2,
  ShoppingBag, Globe, Target, TrendingUp, ShoppingCart,
  Heart, Users, Mail, Shirt, Cpu, UtensilsCrossed, Flower2,
  Home, Package, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'İşletme'  },
  { label: 'Domain'   },
  { label: 'Sektör'   },
  { label: 'Hedef'    },
  { label: 'Mail'     },
  { label: 'Hazır'    },
]

const PLATFORMS = [
  { key: 'shopify',     label: 'Shopify',     emoji: '🛍️', desc: 'mystore.myshopify.com' },
  { key: 'ikas',        label: 'İkas',         emoji: '🇹🇷', desc: "Türkiye'nin platformu" },
  { key: 'woocommerce', label: 'WooCommerce',  emoji: '🛒', desc: 'WordPress + WooCommerce' },
  { key: 'other',       label: 'Diğer',        emoji: '🌐', desc: 'Manuel / Özel' },
]

const SECTORS = [
  { key: 'fashion',     icon: Shirt,           label: 'Moda & Giyim'       },
  { key: 'electronics', icon: Cpu,             label: 'Elektronik'          },
  { key: 'food',        icon: UtensilsCrossed, label: 'Gıda & İçecek'      },
  { key: 'beauty',      icon: Flower2,         label: 'Güzellik & Kozmetik' },
  { key: 'home',        icon: Home,            label: 'Ev & Yaşam'          },
  { key: 'other',       icon: Package,         label: 'Diğer'               },
]

const GOALS = [
  { key: 'more_sales',    icon: TrendingUp,   label: 'Daha fazla satış',     desc: 'Kampanyalarla geliri artır' },
  { key: 'cart_recovery', icon: ShoppingCart, label: 'Terk sepet',           desc: 'Kaçan satışları geri kazan' },
  { key: 'loyalty',       icon: Heart,        label: 'Müşteri sadakati',      desc: 'Tekrar alışveriş oranını artır' },
  { key: 'new_customers', icon: Users,        label: 'Yeni müşteri',          desc: 'Müşteri tabanını genişlet' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]       = useState(0)
  const [saving, setSaving]   = useState(false)

  // Step 0 — business
  const [businessName, setBusinessName] = useState('')

  // Step 1 — domain / platform
  const [website, setWebsite]   = useState('')
  const [platform, setPlatform] = useState('')
  const [shopDomain, setShopDomain] = useState('')

  // Step 2 — sector
  const [sector, setSector] = useState('')

  // Step 3 — goal
  const [goal, setGoal] = useState('')

  // Step 4 — mail domain
  const [emailDomain, setEmailDomain]     = useState('')
  const [skipMailDomain, setSkipMailDomain] = useState(false)

  async function handleFinish(redirectTo: '/dashboard' | '/campaigns/new') {
    setSaving(true)
    try {
      await fetch('/api/settings/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, website, platform, shopDomain, sector, goal, emailDomain }),
      })
    } catch {}
    router.push(redirectTo)
  }

  const cardCls = 'bento-card p-8 w-full max-w-lg mx-auto'

  const NavButtons = ({ back, next, nextDisabled = false, onNext }: {
    back?: number, next?: number, nextDisabled?: boolean, onNext?: () => void
  }) => (
    <div className="flex items-center justify-between mt-8">
      {back !== undefined ? (
        <button onClick={() => setStep(back)}
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
          style={{ color: '#8c90a1' }}>
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
      ) : <div />}
      <button
        onClick={onNext ?? (() => next !== undefined && setStep(next))}
        disabled={nextDisabled}
        className="btn-gradient flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Devam Et <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen dot-bg flex flex-col" style={{ background: '#050505' }}>
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,241,254,0.3), rgba(0,102,255,0.2), transparent)' }} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <div className="btn-gradient w-7 h-7 rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-black" style={{ color: '#e5e2e1' }}>Marksio</span>
        </div>
        <button onClick={() => router.push('/dashboard')}
          className="text-xs font-semibold transition-colors" style={{ color: '#424656' }}>
          Atla
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-10">
          {STEPS.map((s, i) => {
            const done   = i < step
            const active = i === step
            return (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200',
                )
                } style={
                  done   ? { background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }
                  : active ? { background: 'rgba(0,102,255,0.2)', border: '1px solid rgba(0,102,255,0.4)', color: '#6b9fff' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#424656' }
                }>
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-6 h-px" style={{ background: done ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.05)' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* ── Step 0: İşletme adı ── */}
        {step === 0 && (
          <div className={cardCls}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 mx-auto"
              style={{ background: 'rgba(0,241,254,0.06)', border: '1px solid rgba(0,241,254,0.12)' }}>
              <Sparkles className="w-6 h-6" style={{ color: '#00f1fe' }} />
            </div>
            <h1 className="text-2xl font-black text-center mb-1" style={{ color: '#e5e2e1' }}>
              Marksio&apos;ya Hoş Geldiniz
            </h1>
            <p className="text-sm text-center mb-8" style={{ color: '#8c90a1' }}>
              Kurulum sadece birkaç dakika sürer. Hadi başlayalım.
            </p>

            <div>
              <label className="label">İşletme Adınız</label>
              <input
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="Örn: Moda Butik"
                className="input"
                autoFocus
              />
              <p className="text-[10px] mt-1.5" style={{ color: '#424656' }}>
                Müşterilerinize gönderilen emaillerde görünür.
              </p>
            </div>

            <NavButtons next={1} nextDisabled={!businessName.trim()} />
          </div>
        )}

        {/* ── Step 1: Website / domain ── */}
        {step === 1 && (
          <div className={cardCls}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(0,102,255,0.08)', border: '1px solid rgba(0,102,255,0.18)' }}>
              <Globe className="w-6 h-6" style={{ color: '#6b9fff' }} />
            </div>
            <h2 className="text-xl font-black mb-1" style={{ color: '#e5e2e1' }}>Website & Platform</h2>
            <p className="text-sm mb-6" style={{ color: '#8c90a1' }}>E-ticaret platformunuzu ve sitenizi belirtin.</p>

            <div className="space-y-5">
              <div>
                <label className="label">Website URL</label>
                <input
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://maganizin.com"
                  className="input"
                />
              </div>

              <div>
                <label className="label">E-Ticaret Platformu</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p.key} onClick={() => setPlatform(p.key)}
                      className={cn('flex items-center gap-3 p-3 rounded-xl text-left transition-all')}
                      style={platform === p.key
                        ? { background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,102,255,0.3)' }
                        : { background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-xl">{p.emoji}</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#e5e2e1' }}>{p.label}</p>
                        <p className="text-[10px]" style={{ color: '#8c90a1' }}>{p.desc}</p>
                      </div>
                      {platform === p.key && (
                        <Check className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: '#6b9fff' }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {platform && platform !== 'other' && (
                <div>
                  <label className="label">Mağaza Domain</label>
                  <input
                    value={shopDomain}
                    onChange={e => setShopDomain(e.target.value)}
                    placeholder={platform === 'shopify' ? 'mystore.myshopify.com' : 'mystore.com'}
                    className="input"
                  />
                </div>
              )}
            </div>

            <NavButtons back={0} next={2} />
          </div>
        )}

        {/* ── Step 2: Sektör ── */}
        {step === 2 && (
          <div className={cardCls}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.18)' }}>
              <ShoppingBag className="w-6 h-6" style={{ color: '#a78bfa' }} />
            </div>
            <h2 className="text-xl font-black mb-1" style={{ color: '#e5e2e1' }}>Sektörünüz</h2>
            <p className="text-sm mb-6" style={{ color: '#8c90a1' }}>
              Sektörünüze özel AI içerikler ve segmentler oluşturuyoruz.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {SECTORS.map(({ key, icon: Icon, label }) => (
                <button key={key} onClick={() => setSector(key)}
                  className={cn('flex items-center gap-3 p-3.5 rounded-xl text-left transition-all')}
                  style={sector === key
                    ? { background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)' }
                    : { background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Icon className="w-4.5 h-4.5 shrink-0" style={{ color: sector === key ? '#a78bfa' : '#424656', width: 18, height: 18 }} />
                  <p className="text-xs font-semibold" style={{ color: sector === key ? '#e5e2e1' : '#8c90a1' }}>{label}</p>
                  {sector === key && <Check className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: '#a78bfa' }} />}
                </button>
              ))}
            </div>

            <NavButtons back={1} next={3} nextDisabled={!sector} />
          </div>
        )}

        {/* ── Step 3: Hedef ── */}
        {step === 3 && (
          <div className={cardCls}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(0,241,254,0.06)', border: '1px solid rgba(0,241,254,0.12)' }}>
              <Target className="w-6 h-6" style={{ color: '#00f1fe' }} />
            </div>
            <h2 className="text-xl font-black mb-1" style={{ color: '#e5e2e1' }}>Hedefiniz nedir?</h2>
            <p className="text-sm mb-6" style={{ color: '#8c90a1' }}>
              Size en uygun otomasyonları ve kampanya şablonlarını hazırlayalım.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {GOALS.map(({ key, icon: Icon, label, desc }) => (
                <button key={key} onClick={() => setGoal(key)}
                  className={cn('p-4 rounded-xl text-left transition-all')}
                  style={goal === key
                    ? { background: 'rgba(0,241,254,0.06)', border: '1px solid rgba(0,241,254,0.2)' }
                    : { background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Icon className="w-5 h-5 mb-3" style={{ color: goal === key ? '#00f1fe' : '#424656' }} />
                  <p className="text-xs font-bold mb-0.5" style={{ color: '#e5e2e1' }}>{label}</p>
                  <p className="text-[10px]" style={{ color: '#8c90a1' }}>{desc}</p>
                </button>
              ))}
            </div>

            <NavButtons back={2} next={4} nextDisabled={!goal} />
          </div>
        )}

        {/* ── Step 4: Mail domain bağlama ── */}
        {step === 4 && (
          <div className={cardCls}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(0,102,255,0.08)', border: '1px solid rgba(0,102,255,0.18)' }}>
              <Mail className="w-6 h-6" style={{ color: '#6b9fff' }} />
            </div>
            <h2 className="text-xl font-black mb-1" style={{ color: '#e5e2e1' }}>Mail Domain Bağlayın</h2>
            <p className="text-sm mb-6" style={{ color: '#8c90a1' }}>
              Kendi domain&apos;inizden email göndermek için DNS kaydı eklemeniz gerekir.
              Şimdi atlayıp sonradan Ayarlar bölümünden yapabilirsiniz.
            </p>

            {!skipMailDomain && (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="label">Email Gönderme Domaini</label>
                  <input
                    value={emailDomain}
                    onChange={e => setEmailDomain(e.target.value)}
                    placeholder="magaza.com"
                    className="input"
                    disabled={skipMailDomain}
                  />
                  <p className="text-[10px] mt-1.5" style={{ color: '#424656' }}>
                    DNS kayıtları (SPF, DKIM, DMARC) otomatik oluşturulacak.
                  </p>
                </div>

                <div className="p-3 rounded-xl" style={{ background: 'rgba(0,241,254,0.03)', border: '1px solid rgba(0,241,254,0.08)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#00f1fe' }}>Neden önemli?</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#8c90a1' }}>
                    Kendi domain&apos;inizden gönderim spam skorunu düşürür, açılma oranını ortalama %35 artırır.
                  </p>
                </div>
              </div>
            )}

            <button onClick={() => setSkipMailDomain(!skipMailDomain)}
              className="flex items-center gap-2 text-xs font-semibold transition-colors mb-2"
              style={{ color: skipMailDomain ? '#00f1fe' : '#8c90a1' }}>
              <div className={cn('w-4 h-4 rounded border flex items-center justify-center transition-all',
                skipMailDomain ? '' : '')}
                style={skipMailDomain
                  ? { background: 'rgba(0,241,254,0.15)', border: '1px solid rgba(0,241,254,0.3)' }
                  : { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}>
                {skipMailDomain && <Check className="w-2.5 h-2.5" style={{ color: '#00f1fe' }} />}
              </div>
              Şimdi atla, sonra ayarlardan bağlarım
            </button>

            <NavButtons back={3} next={5} />
          </div>
        )}

        {/* ── Step 5: Hazır / Final ── */}
        {step === 5 && (
          <div className={cn(cardCls, 'text-center gradient-border')}
            style={{ background: 'linear-gradient(145deg, rgba(0,241,254,0.04), #131313)' }}>
            <div className="absolute top-0 inset-x-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #00f1fe, rgba(0,102,255,0.5), transparent)' }} />

            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Check className="w-8 h-8" style={{ color: '#34d399' }} />
            </div>

            <h2 className="text-2xl font-black mb-2" style={{ color: '#e5e2e1' }}>Her şey hazır!</h2>
            <p className="text-sm mb-8" style={{ color: '#8c90a1' }}>
              <span className="font-semibold" style={{ color: '#e5e2e1' }}>{businessName}</span> için
              AI destekli pazarlama başlamaya hazır.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { value: PLATFORMS.find(p => p.key === platform)?.label || '—', label: 'Platform' },
                { value: SECTORS.find(s => s.key === sector)?.label.split(' ')[0] || '—', label: 'Sektör' },
                { value: '14 gün', label: 'Ücretsiz Deneme' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl"
                  style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-sm font-black" style={{ color: '#e5e2e1' }}>{s.value}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#8c90a1' }}>{s.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleFinish('/campaigns/new')}
                disabled={saving}
                className="btn-gradient w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>
                  : <><Sparkles className="w-4 h-4" /> İlk Kampanyamı Oluştur</>
                }
              </button>
              <button
                onClick={() => handleFinish('/dashboard')}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: '#1c1b1b', border: '1px solid rgba(255,255,255,0.07)', color: '#8c90a1' }}>
                Dashboard&apos;a Git
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
