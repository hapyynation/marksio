'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Loader2, Eye, EyeOff } from 'lucide-react'

const METRICS = [
  { value: '₺2.4M+', label: 'Üretilen gelir' },
  { value: '1.200+', label: 'Aktif mağaza' },
  { value: '%340',   label: 'Ort. ROI' },
]

const FEATURES = [
  { icon: 'campaign',       label: 'AI kampanya üretimi',         desc: 'Saniyeler içinde hazır içerik' },
  { icon: 'bolt',           label: 'Otomasyon akışları',           desc: 'Sepet terk, doğum günü, win-back' },
  { icon: 'bar_chart_4_bars', label: 'Gelir & dönüşüm takibi',   desc: 'Gerçek zamanlı attribution' },
  { icon: 'smart_toy',      label: 'WhatsApp AI Chatbot',          desc: '%87 okunma oranı' },
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

        {/* Logo */}
        <Link href="https://marksio.com" className="flex items-center gap-2.5 group w-fit">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--blue)', boxShadow: '0 2px 8px rgba(68,112,255,0.3)' }}>
            <span className="material-symbols-outlined icon-fill text-white" style={{ fontSize: 14 }}>auto_awesome</span>
          </div>
          <span className="text-[14px] font-bold tracking-tight" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>
            Marksio
          </span>
        </Link>

        {/* Main copy */}
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
              style={{ background: 'rgba(68,112,255,0.08)', border: '1px solid rgba(68,112,255,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--blue)', boxShadow: '0 0 5px rgba(68,112,255,0.6)' }} />
              <span className="text-[11px] font-semibold" style={{ color: '#99b4ff' }}>
                AI Pazarlama Otomasyonu
              </span>
            </div>
            <h2 className="text-[28px] font-bold leading-tight mb-3" style={{ color: '#eeeef4', letterSpacing: '-0.03em' }}>
              E-ticaret büyümesini<br />
              <span className="ai-gradient-text">otomatize edin</span>
            </h2>
            <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
              Klaviyo seviyesi pazarlama gücünü Türk e-ticaretine özel araçlarla birleştiriyoruz.
            </p>
          </div>

          {/* Features */}
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

          {/* Metrics */}
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
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <Link href="https://marksio.com" className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--blue)' }}>
              <span className="material-symbols-outlined icon-fill text-white" style={{ fontSize: 14 }}>auto_awesome</span>
            </div>
            <span className="text-[14px] font-bold" style={{ color: '#eeeef4' }}>Marksio</span>
          </Link>

          <div className="mb-7">
            <h1 className="text-[22px] font-bold mb-1.5" style={{ color: '#eeeef4', letterSpacing: '-0.025em' }}>
              Tekrar hoş geldiniz
            </h1>
            <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>Hesabınıza giriş yapın</p>
          </div>

          {error && (
            <div className="ds-alert ds-alert-error mb-5 text-[13px]">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="siz@magaza.com"
                required
                className="input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label" style={{ margin: 0 }}>Şifre</label>
                <Link href="/forgot-password" className="text-[12px] font-medium transition-colors"
                  style={{ color: 'var(--blue)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#99b4ff')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--blue)')}>
                  Şifremi unuttum
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input pr-10"
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
              className="btn-gradient w-full justify-center py-2.5 rounded-xl text-[14px] font-semibold mt-1"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Giriş yapılıyor...</>
                : 'Giriş Yap'
              }
            </button>
          </form>

          <div className="ds-sep" />

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
  )
}
