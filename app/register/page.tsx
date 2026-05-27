'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PERKS = [
  'Email, WhatsApp ve SMS otomasyonu',
  'Shopify & WooCommerce entegrasyonu',
  'AI ile kampanya ve içerik üretimi',
  'Gerçek zamanlı gelir analitikleri',
  'Sınırsız müşteri segmentasyonu',
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm]       = useState({ name: '', storeName: '', email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password) { setError('Lütfen tüm zorunlu alanları doldurun.'); return }
    if (form.password.length < 8) { setError('Şifre en az 8 karakter olmalıdır.'); return }

    setLoading(true)
    const res  = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, storeName: form.storeName || 'Mağazam' }),
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error ?? 'Kayıt hatası oluştu.'); setLoading(false); return }

    const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    setLoading(false)
    if (result?.ok) router.push('/onboarding')
    else setError('Hesap oluşturuldu fakat giriş yapılamadı. Lütfen giriş yapın.')
  }

  const pwLen    = form.password.length
  const strength = pwLen >= 12 ? 4 : pwLen >= 8 ? 3 : pwLen >= 5 ? 2 : pwLen > 0 ? 1 : 0
  const strengthColor = strength >= 4 ? 'var(--green)' : strength === 3 ? 'var(--amber)' : 'var(--red)'
  const strengthLabel = strength >= 4 ? 'Güçlü' : strength === 3 ? 'Orta' : 'Zayıf'

  return (
    <div className="auth-page dot-bg">
      <div className="auth-bg-orb-1" />
      <div className="auth-bg-orb-2" />

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 p-10 relative z-10"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        <Link href="https://marksio.com" className="flex items-center gap-2.5 w-fit">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--blue)', boxShadow: '0 2px 8px rgba(68,112,255,0.3)' }}>
            <span className="material-symbols-outlined icon-fill text-white" style={{ fontSize: 14 }}>auto_awesome</span>
          </div>
          <span className="text-[14px] font-bold" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>Marksio</span>
        </Link>

        <div className="space-y-7">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(34,201,122,0.08)', border: '1px solid rgba(34,201,122,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)', boxShadow: '0 0 5px rgba(34,201,122,0.5)' }} />
              <span className="text-[11px] font-semibold" style={{ color: 'var(--green)' }}>14 gün ücretsiz deneme</span>
            </div>
            <h2 className="text-[26px] font-bold leading-tight mb-3" style={{ color: '#eeeef4', letterSpacing: '-0.03em' }}>
              Hemen başlayın,<br />
              <span className="ai-gradient-text">kredi kartı gerekmez</span>
            </h2>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
              Kayıt olduğunuz anda tüm özellikler aktif olur. Kurulum dakikalar alır.
            </p>
          </div>

          <div className="space-y-2.5">
            {PERKS.map(p => (
              <div key={p} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(34,201,122,0.1)', border: '1px solid rgba(34,201,122,0.2)' }}>
                  <Check className="w-3 h-3" style={{ color: 'var(--green)' }} />
                </div>
                <span className="text-[13px]" style={{ color: 'var(--text-2)' }}>{p}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ background: 'rgba(68,112,255,0.12)', border: '1px solid rgba(68,112,255,0.2)', color: '#99b4ff' }}>
                AK
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>Ayşe Kara</p>
                <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>ModaKara.com · Kurucu</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[...Array(5)].map((_, i) => <span key={i} className="text-[11px]" style={{ color: '#f0a020' }}>★</span>)}
              </div>
            </div>
            <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-2)', fontStyle: 'italic' }}>
              &ldquo;İlk ayda ₺45.000 ek gelir elde ettik. Marksio olmadan bu imkansızdı.&rdquo;
            </p>
          </div>
        </div>

        <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>© 2025 Marksio · Tüm hakları saklıdır</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 relative z-10">
        <div className="w-full max-w-[400px]">

          <Link href="https://marksio.com" className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--blue)' }}>
              <span className="material-symbols-outlined icon-fill text-white" style={{ fontSize: 14 }}>auto_awesome</span>
            </div>
            <span className="text-[14px] font-bold" style={{ color: '#eeeef4' }}>Marksio</span>
          </Link>

          {/* Form card */}
          <div className="rounded-2xl overflow-hidden"
            style={{
              background: '#080810',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.6)',
            }}>

            {/* Top gradient line */}
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #0066ff, #00f1fe)' }} />

            <div className="p-8">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-[20px] font-bold mb-1" style={{ color: '#eeeef4', letterSpacing: '-0.025em' }}>
                  Hesap oluşturun
                </h1>
                <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
                  14 gün boyunca tüm özellikler ücretsiz
                </p>
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                <button type="button"
                  className="flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#c2c6d8' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 256 262">
                    <path fill="#4285f4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"/>
                    <path fill="#34a853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"/>
                    <path fill="#fbbc05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"/>
                    <path fill="#eb4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"/>
                  </svg>
                  Google
                </button>

                <button type="button"
                  className="flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#c2c6d8' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256">
                    <path fill="#f1511b" d="M121.666 121.666H0V0h121.666z"/>
                    <path fill="#80cc28" d="M256 121.666H134.335V0H256z"/>
                    <path fill="#00adef" d="M121.663 256.002H0V134.336h121.663z"/>
                    <path fill="#fbbc09" d="M256 256.002H134.335V134.336H256z"/>
                  </svg>
                  Microsoft
                </button>
              </div>

              {/* Divider */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mb-6">
                <hr style={{ borderColor: 'rgba(255,255,255,0.07)', borderStyle: 'dashed' }} />
                <span className="text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>veya şununla devam et</span>
                <hr style={{ borderColor: 'rgba(255,255,255,0.07)', borderStyle: 'dashed' }} />
              </div>

              {error && <div className="ds-alert ds-alert-error mb-5 text-[13px]">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Ad Soyad <span style={{ color: 'var(--red)' }}>*</span></Label>
                    <Input id="name" type="text" value={form.name} onChange={set('name')} placeholder="Adınız" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="storeName">Mağaza Adı</Label>
                    <Input id="storeName" type="text" value={form.storeName} onChange={set('storeName')} placeholder="Mağazam" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email <span style={{ color: 'var(--red)' }}>*</span></Label>
                  <Input id="email" type="email" value={form.email} onChange={set('email')} placeholder="siz@magaza.com" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Şifre <span style={{ color: 'var(--red)' }}>*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={set('password')}
                      placeholder="En az 8 karakter"
                      className="pr-10"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-3)' }}>
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {pwLen > 0 && (
                    <div className="space-y-1 mt-1">
                      <div className="flex gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="h-[3px] flex-1 rounded-full transition-all duration-300"
                            style={{ background: i < strength ? strengthColor : 'rgba(255,255,255,0.06)' }} />
                        ))}
                      </div>
                      <p className="text-[11px] font-medium" style={{ color: strengthColor }}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading}
                  className="btn-gradient w-full justify-center h-10 rounded-xl text-[14px] font-semibold mt-1">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Hesap oluşturuluyor...</>
                    : 'Ücretsiz Başla'
                  }
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="px-8 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
              <p className="text-center text-[13px]" style={{ color: 'var(--text-2)' }}>
                Zaten hesabınız var mı?{' '}
                <Link href="/login" className="font-semibold transition-colors" style={{ color: '#99b4ff' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#eeeef4')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#99b4ff')}>
                  Giriş yapın
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
