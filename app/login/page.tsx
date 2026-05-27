'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const METRICS = [
  { value: '₺2.4M+', label: 'Üretilen gelir' },
  { value: '1.200+', label: 'Aktif mağaza' },
  { value: '%340',   label: 'Ort. ROI' },
]

const FEATURES = [
  { icon: 'campaign',         label: 'AI kampanya üretimi',       desc: 'Saniyeler içinde hazır içerik' },
  { icon: 'bolt',             label: 'Otomasyon akışları',         desc: 'Sepet terk, doğum günü, win-back' },
  { icon: 'bar_chart_4_bars', label: 'Gelir & dönüşüm takibi',   desc: 'Gerçek zamanlı attribution' },
  { icon: 'smart_toy',        label: 'WhatsApp AI Chatbot',        desc: '%87 okunma oranı' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError('Email veya şifre hatalı.')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="auth-page dot-bg">
      <div className="auth-bg-orb-1" />
      <div className="auth-bg-orb-2" />

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 relative z-10"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>

        <Link href="https://marksio.com" className="flex items-center gap-2.5 group w-fit">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--blue)', boxShadow: '0 2px 8px rgba(68,112,255,0.3)' }}>
            <span className="material-symbols-outlined icon-fill text-white" style={{ fontSize: 14 }}>auto_awesome</span>
          </div>
          <span className="text-[14px] font-bold tracking-tight" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>
            Marksio
          </span>
        </Link>

        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(68,112,255,0.08)', border: '1px solid rgba(68,112,255,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--blue)', boxShadow: '0 0 5px rgba(68,112,255,0.6)' }} />
              <span className="text-[11px] font-semibold" style={{ color: '#99b4ff' }}>AI Pazarlama Otomasyonu</span>
            </div>
            <h2 className="text-[28px] font-bold leading-tight mb-3" style={{ color: '#eeeef4', letterSpacing: '-0.03em' }}>
              E-ticaret büyümesini<br />
              <span className="ai-gradient-text">otomatize edin</span>
            </h2>
            <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
              Klaviyo seviyesi pazarlama gücünü Türk e-ticaretine özel araçlarla birleştiriyoruz.
            </p>
          </div>

          <div className="space-y-1.5">
            {FEATURES.map(({ icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                style={{ cursor: 'default' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(68,112,255,0.08)', border: '1px solid rgba(68,112,255,0.14)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#99b4ff' }}>{icon}</span>
                </div>
                <div>
                  <p className="text-[13px] font-medium" style={{ color: '#eeeef4' }}>{label}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {METRICS.map(({ value, label }) => (
              <div key={label} className="p-3 rounded-xl text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[17px] font-bold ai-gradient-text leading-none mb-1">{value}</p>
                <p className="text-[10px] leading-tight" style={{ color: 'var(--text-2)' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
          © 2025 Marksio · Tüm hakları saklıdır
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
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
              <div className="mb-7">
                <h1 className="text-[20px] font-bold mb-1" style={{ color: '#eeeef4', letterSpacing: '-0.025em' }}>
                  Tekrar hoş geldiniz
                </h1>
                <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>Hesabınıza giriş yapın</p>
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                <button type="button"
                  className="flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-medium transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#c2c6d8',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}>
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
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#c2c6d8',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  }}>
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

              {/* Error */}
              {error && (
                <div className="ds-alert ds-alert-error mb-5 text-[13px]">{error}</div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="siz@magaza.com"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Şifre</Label>
                    <Link href="/forgot-password" className="text-[12px] font-medium transition-colors"
                      style={{ color: 'var(--blue)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#99b4ff')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--blue)')}>
                      Şifremi unuttum
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-3)' }}>
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gradient w-full justify-center h-10 rounded-xl text-[14px] font-semibold mt-1"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Giriş yapılıyor...</>
                    : 'Giriş Yap'
                  }
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="px-8 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
              <p className="text-center text-[13px]" style={{ color: 'var(--text-2)' }}>
                Hesabınız yok mu?{' '}
                <Link href="/register" className="font-semibold transition-colors"
                  style={{ color: '#99b4ff' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#eeeef4')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#99b4ff')}>
                  Ücretsiz başlayın
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
