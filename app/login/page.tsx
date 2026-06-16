'use client'
export const dynamic = 'force-dynamic'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Loader2, ArrowRight, Eye, EyeOff, CheckCircle, Mail } from 'lucide-react'

// ─── Left Panel ────────────────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: '#0A0A0A', borderRight: '1px solid #1a1a1a' }}>
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(59,130,246,0.08) 0%, transparent 65%)' }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 100% 100%, rgba(59,130,246,0.05) 0%, transparent 65%)' }} />

      <div className="flex items-center gap-3 relative z-10">
        <Image src="/marksio-logo.png" alt="Marksio" width={36} height={36} className="rounded-xl" style={{ objectFit: 'contain' }} />
        <span style={{ fontFamily: 'Geist, Inter, sans-serif', fontSize: 18, fontWeight: 600, color: '#E2E1EB', letterSpacing: '-0.02em' }}>
          Marksio
        </span>
      </div>

      <div className="relative z-10 space-y-6">
        <div className="space-y-3">
          <h1 style={{ fontFamily: 'Geist, Inter, sans-serif', fontSize: 42, fontWeight: 700, color: '#E2E1EB', lineHeight: '1.1', letterSpacing: '-0.03em' }}>
            Tek Platform.<br />
            <span style={{ color: '#3B82F6' }}>Sınırsız</span> Büyüme.
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#8C909F', lineHeight: 1.7, maxWidth: 340 }}>
            E-posta, WhatsApp, otomasyon ve yapay zeka ile mağazanızı büyütün.
          </p>
        </div>

        <div className="rounded-xl p-4 space-y-3" style={{ background: '#171717', border: '1px solid #262626', maxWidth: 360 }}>
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 10, fontWeight: 600, color: '#424754', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Kampanya Performansı
            </span>
            <span style={{ fontSize: 10, color: '#424754' }}>Son 30 gün</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Açılma Oranı', value: '%64.2', delta: '+12%', color: '#10B981' },
              { label: 'Dönüşüm',      value: '%8.5',  delta: '+3.2%', color: '#3B82F6' },
            ].map(m => (
              <div key={m.label} className="rounded-lg p-3" style={{ background: '#1e1f26' }}>
                <p style={{ fontSize: 11, color: '#424754' }}>{m.label}</p>
                <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 20, fontWeight: 700, color: '#E2E1EB', letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: 4 }}>{m.value}</p>
                <p style={{ fontSize: 11, color: m.color, marginTop: 2 }}>{m.delta}</p>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-1 pt-1" style={{ height: 40 }}>
            {[30, 45, 35, 60, 50, 70, 65, 80, 72, 85, 78, 90].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm"
                style={{ height: `${h}%`, background: i === 11 ? '#3B82F6' : '#262626' }} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {['500+ Mağaza', 'AI Destekli', 'KVKK Uyumlu'].map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full" style={{ background: '#3B82F6' }} />
              <span style={{ fontSize: 12, color: '#424754' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <Link href="#" style={{ fontSize: 12, color: '#424754' }}>Gizlilik Politikası</Link>
        <Link href="#" style={{ fontSize: 12, color: '#424754' }}>Hizmet Şartları</Link>
      </div>
    </div>
  )
}

// ─── Login Form ────────────────────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/dashboard'
  const justVerified = searchParams.get('verified') === '1'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 12px',
    borderRadius: 8, background: '#171717', border: '1px solid #262626',
    color: '#E2E1EB', fontSize: 14, outline: 'none', transition: 'border-color 0.15s',
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (!result?.ok) {
      if (result?.error === 'EMAIL_NOT_VERIFIED') {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`)
        return
      }
      setError('E-posta adresi veya şifre hatalı.')
      return
    }

    router.push(nextPath)
    router.refresh()
  }

  return (
    <div className="flex flex-col justify-center min-h-screen w-full"
      style={{ background: '#0A0A0A', padding: '24px 20px' }}>

      {/* Mobile logo */}
      <div className="flex items-center gap-2.5 mb-8 lg:hidden">
        <Image src="/marksio-logo.png" alt="Marksio" width={30} height={30} className="rounded-lg" style={{ objectFit: 'contain' }} />
        <span style={{ fontFamily: 'Geist, Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#E2E1EB', letterSpacing: '-0.02em' }}>Marksio</span>
      </div>

      <div className="w-full mx-auto" style={{ maxWidth: 400 }}>
        <div className="rounded-xl overflow-hidden" style={{ background: '#171717', border: '1px solid #262626', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

          <div className="p-7">
            <div className="mb-6">
              <h2 style={{ fontFamily: 'Geist, Inter, sans-serif', fontSize: 20, fontWeight: 600, color: '#E2E1EB', letterSpacing: '-0.02em', margin: 0 }}>
                Hoş Geldiniz
              </h2>
              <p style={{ fontSize: 14, color: '#8C909F', marginTop: 4 }}>
                Hesabınıza giriş yaparak büyümeye devam edin.
              </p>
            </div>

            {/* Email verified success banner */}
            {justVerified && (
              <div className="mb-4 px-3 py-2.5 rounded-lg flex items-center gap-2"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#10B981' }} />
                <span style={{ fontSize: 13, color: '#6EE7B7' }}>E-posta doğrulandı! Şimdi giriş yapabilirsiniz.</span>
              </div>
            )}

            {error && (
              <div className="mb-4 px-3 py-2.5 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <span style={{ fontSize: 13, color: '#FCA5A5' }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8C909F', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  E-POSTA
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="siz@magaza.com"
                  required
                  autoFocus
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#3B82F6')}
                  onBlur={e => (e.target.style.borderColor = '#262626')}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8C909F', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  ŞİFRE
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ ...inputStyle, paddingRight: 40 }}
                    onFocus={e => (e.target.style.borderColor = '#3B82F6')}
                    onBlur={e => (e.target.style.borderColor = '#262626')}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#424754', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end" style={{ marginTop: 2 }}>
                <Link href="/forgot-password" style={{ fontSize: 13, color: '#424754' }}
                  className="hover:text-gray-400 transition-colors">
                  Şifremi unuttum
                </Link>
              </div>

              <button type="submit" disabled={loading || !email || !password}
                className="w-full flex items-center justify-center gap-2 rounded-lg transition-all"
                style={{
                  height: 42, marginTop: 4,
                  background: loading || !email || !password ? '#1d4ed8' : '#3B82F6',
                  opacity: !email || !password ? 0.6 : 1,
                  color: '#fff', fontSize: 14, fontWeight: 600,
                  border: 'none', cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
                  boxShadow: '0 0 16px rgba(59,130,246,0.2)',
                }}>
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Giriş yapılıyor...</>
                  : <>Giriş Yap <ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>
          </div>

          <div className="px-7 py-4 flex items-center justify-center gap-1"
            style={{ borderTop: '1px solid #262626', background: 'rgba(0,0,0,0.3)' }}>
            <span style={{ fontSize: 13, color: '#424754' }}>Hesabın yok mu?</span>
            <Link href="/register" style={{ fontSize: 13, color: '#3B82F6', fontWeight: 500, marginLeft: 4 }}
              className="hover:underline">
              Kayıt ol
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-5">
          <span style={{ fontSize: 12, color: '#424754' }}>🔒</span>
          <span style={{ fontSize: 12, color: '#424754' }}>Uçtan uca şifrelenmiş bağlantı</span>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[55%_45%]" style={{ background: '#0A0A0A' }}>
      <LeftPanel />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen" style={{ background: '#0A0A0A' }}>
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }} />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
