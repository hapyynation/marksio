'use client'
export const dynamic = 'force-dynamic'

import { useState, FormEvent, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, ArrowRight, RefreshCw, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'login' | 'register'
type Step = 'form' | 'otp' | 'success'

const ERROR_MESSAGES: Record<string, string> = {
  dogrulamaBasarisiz: 'Bağlantı geçersiz veya süresi dolmuş. Lütfen yeni kod isteyin.',
  sessionExpired: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
}

// ─── Left Panel (marketing) ────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: '#0A0A0A', borderRight: '1px solid #1a1a1a' }}>
      {/* Ambient glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(59,130,246,0.08) 0%, transparent 65%)' }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 100% 100%, rgba(59,130,246,0.05) 0%, transparent 65%)' }} />

      {/* Logo */}
      <div className="flex items-center gap-3 relative z-10">
        <Image src="/marksio-logo.png" alt="Marksio" width={36} height={36} className="rounded-xl" style={{ objectFit: 'contain' }} />
        <span style={{ fontFamily: 'Geist, Inter, sans-serif', fontSize: 18, fontWeight: 600, color: '#E2E1EB', letterSpacing: '-0.02em' }}>
          Marksio
        </span>
      </div>

      {/* Headline */}
      <div className="relative z-10 space-y-6">
        <div className="space-y-3">
          <h1 style={{ fontFamily: 'Geist, Inter, sans-serif', fontSize: 42, fontWeight: 700, color: '#E2E1EB', lineHeight: '1.1', letterSpacing: '-0.03em' }}>
            Tek Platform.<br />
            <span style={{ color: '#3B82F6' }}>Sınırsız</span> Büyüme.
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#8C909F', lineHeight: 1.7, maxWidth: 340 }}>
            E-posta, WhatsApp, otomasyon ve yapay zeka ile mağazanızı büyütün. Veriye dayalı kararlar alarak müşteri etkileşimini en üst düzeye çıkarın.
          </p>
        </div>

        {/* Mini dashboard mockup */}
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
              { label: 'Dönüşüm', value: '%8.5', delta: '+3.2%', color: '#3B82F6' },
            ].map(m => (
              <div key={m.label} className="rounded-lg p-3" style={{ background: '#1e1f26' }}>
                <p style={{ fontSize: 11, color: '#424754', fontFamily: 'Inter, sans-serif' }}>{m.label}</p>
                <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 20, fontWeight: 700, color: '#E2E1EB', letterSpacing: '-0.02em', lineHeight: 1.2, marginTop: 4 }}>{m.value}</p>
                <p style={{ fontSize: 11, color: m.color, marginTop: 2 }}>{m.delta}</p>
              </div>
            ))}
          </div>
          {/* Mini bar chart */}
          <div className="flex items-end gap-1 pt-1" style={{ height: 40 }}>
            {[30, 45, 35, 60, 50, 70, 65, 80, 72, 85, 78, 90].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm transition-all"
                style={{ height: `${h}%`, background: i === 11 ? '#3B82F6' : '#262626' }} />
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-4">
          {['500+ Mağaza', 'AI Destekli', 'KVKK Uyumlu'].map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full" style={{ background: '#3B82F6' }} />
              <span style={{ fontSize: 12, color: '#424754', fontFamily: 'Inter, sans-serif' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 relative z-10">
        <Link href="#" style={{ fontSize: 12, color: '#424754' }} className="hover:text-gray-400 transition-colors">Gizlilik Politikası</Link>
        <Link href="#" style={{ fontSize: 12, color: '#424754' }} className="hover:text-gray-400 transition-colors">Hizmet Şartları</Link>
      </div>
    </div>
  )
}

// ─── Auth Form ─────────────────────────────────────────────────────────────
function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const initialTab: Tab = (searchParams.get('tab') as Tab) || 'login'
  const nextPath = searchParams.get('next') || '/dashboard'
  const callbackError = searchParams.get('error')

  const [tab, setTab] = useState<Tab>(initialTab)
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({ name: '', email: '' })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(
    callbackError ? (ERROR_MESSAGES[callbackError] ?? 'Bir hata oluştu. Lütfen tekrar deneyin.') : ''
  )
  const [cooldown, setCooldown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  function switchTab(t: Tab) {
    setTab(t)
    setStep('form')
    setOtp(['', '', '', '', '', ''])
    setError('')
    setForm({ name: '', email: '' })
  }

  function startCooldown() {
    setCooldown(60)
    const t = setInterval(() => setCooldown(p => { if (p <= 1) { clearInterval(t); return 0 } return p - 1 }), 1000)
  }

  async function handleSendOtp(e?: FormEvent) {
    e?.preventDefault()
    setError('')
    if (!form.email) { setError('E-posta adresi gerekli.'); return }
    if (tab === 'register' && !form.name.trim()) { setError('Ad Soyad gerekli.'); return }
    setLoading(true)
    // No emailRedirectTo → Supabase Email OTP mode: only a 6-digit code is sent, no magic link.
    const { error: err } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        shouldCreateUser: tab === 'register',
        data: tab === 'register' ? { name: form.name } : undefined,
      },
    })
    setLoading(false)
    if (err) {
      if (err.message.includes('not found') || err.message.includes('User not found')) {
        setError('Bu e-posta ile kayıtlı hesap bulunamadı.')
      } else {
        setError(err.message)
      }
      return
    }
    setStep('otp')
    startCooldown()
  }

  function handleOtpChange(i: number, v: string) {
    if (!/^\d*$/.test(v)) return
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n)
    if (v && i < 5) otpRefs.current[i + 1]?.focus()
  }

  function handleOtpKey(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length > 0) {
      const next = ['', '', '', '', '', '']
      paste.split('').forEach((c, i) => { next[i] = c })
      setOtp(next)
      otpRefs.current[Math.min(paste.length, 5)]?.focus()
    }
  }

  async function handleVerifyOtp(e?: FormEvent) {
    e?.preventDefault()
    setError('')
    const token = otp.join('')
    if (token.length !== 6) { setError('Lütfen 6 haneli kodu girin.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.verifyOtp({
      email: form.email,
      token,
      type: tab === 'register' ? 'signup' : 'email',
    })
    setLoading(false)
    if (err) {
      setError(err.message.includes('expired') || err.message.includes('invalid')
        ? 'Kod hatalı veya süresi dolmuş. Yeni kod isteyin.'
        : err.message)
      return
    }
    setStep('success')
    setTimeout(() => router.push(tab === 'register' ? '/onboarding' : nextPath), 1200)
  }

  // ── Input style helpers ─────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: '100%', height: 40, padding: '0 12px', borderRadius: 6,
    background: '#171717', border: '1px solid #262626',
    color: '#E2E1EB', fontSize: 14, fontFamily: 'Inter, sans-serif',
    outline: 'none', transition: 'border-color 0.15s',
  }

  return (
    <div className="flex flex-col justify-center min-h-screen w-full"
      style={{ background: '#0A0A0A', padding: '24px 20px' }}>

      {/* Mobile logo */}
      <div className="flex items-center gap-2.5 mb-8 lg:hidden">
        <Image src="/marksio-logo.png" alt="Marksio" width={30} height={30} className="rounded-lg" style={{ objectFit: 'contain' }} />
        <span style={{ fontFamily: 'Geist, Inter, sans-serif', fontSize: 16, fontWeight: 600, color: '#E2E1EB', letterSpacing: '-0.02em' }}>Marksio</span>
      </div>

      {/* Auth card */}
      <div className="w-full mx-auto" style={{ maxWidth: 400 }}>
        <div className="rounded-xl overflow-hidden" style={{ background: '#171717', border: '1px solid #262626', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>

          {/* Tabs */}
          {step === 'form' && (
            <div className="flex" style={{ borderBottom: '1px solid #262626' }}>
              {([['login', 'Giriş Yap'], ['register', 'Hesap Oluştur']] as [Tab, string][]).map(([t, label]) => (
                <button key={t} onClick={() => switchTab(t)}
                  className="flex-1 py-3.5 text-sm font-medium transition-colors relative"
                  style={{
                    fontFamily: 'Geist, Inter, sans-serif',
                    fontSize: 14,
                    fontWeight: 500,
                    color: tab === t ? '#E2E1EB' : '#424754',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}>
                  {label}
                  {tab === t && (
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
                      style={{ background: '#3B82F6' }} />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="p-7">
            {/* STEP: form */}
            {step === 'form' && (
              <>
                <div className="mb-6">
                  <h2 style={{ fontFamily: 'Geist, Inter, sans-serif', fontSize: 20, fontWeight: 600, color: '#E2E1EB', letterSpacing: '-0.02em', margin: 0 }}>
                    {tab === 'login' ? 'Hoş Geldiniz' : 'Hesap Oluştur'}
                  </h2>
                  <p style={{ fontSize: 14, color: '#8C909F', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
                    {tab === 'login' ? 'Hesabınıza giriş yaparak büyümeye devam edin.' : 'Hemen kullanmaya başlayın.'}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 px-3 py-2.5 rounded-lg flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <span style={{ fontSize: 13, color: '#FCA5A5', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSendOtp} className="space-y-3">
                  {tab === 'register' && (
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8C909F', marginBottom: 6, fontFamily: 'Geist, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AD SOYAD</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Adınız Soyadınız"
                        required
                        autoFocus={tab === 'register'}
                        style={inputStyle}
                        onFocus={e => (e.target.style.borderColor = '#3B82F6')}
                        onBlur={e => (e.target.style.borderColor = '#262626')}
                      />
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8C909F', marginBottom: 6, fontFamily: 'Geist, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>E-POSTA</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder={tab === 'login' ? 'admin@marksio.com' : 'ornek@sirket.com'}
                      required
                      autoFocus={tab === 'login'}
                      style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = '#3B82F6')}
                      onBlur={e => (e.target.style.borderColor = '#262626')}
                    />
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg transition-all"
                    style={{
                      height: 40, marginTop: 8, background: loading ? '#1d4ed8' : '#3B82F6',
                      color: '#fff', fontFamily: 'Geist, Inter, sans-serif',
                      fontSize: 14, fontWeight: 600, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 0 16px rgba(59,130,246,0.2)',
                    }}
                    onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#60A5FA' }}
                    onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#3B82F6' }}>
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</>
                      : <>{tab === 'login' ? 'Kod Gönder' : 'Hesap Oluştur'} <ArrowRight className="w-4 h-4" /></>
                    }
                  </button>
                </form>

                {tab === 'login' && (
                  <div className="mt-4 text-center">
                    <Link href="/forgot-password" style={{ fontSize: 13, color: '#424754', fontFamily: 'Inter, sans-serif' }}
                      className="hover:text-gray-400 transition-colors">
                      Şifremi unuttum
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* STEP: otp */}
            {step === 'otp' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#3B82F6', fontVariationSettings: "'FILL' 1" }}>lock</span>
                  </div>
                  <h2 style={{ fontFamily: 'Geist, Inter, sans-serif', fontSize: 20, fontWeight: 600, color: '#E2E1EB', letterSpacing: '-0.02em', margin: 0 }}>
                    Doğrulama Kodunu Girin
                  </h2>
                  <p style={{ fontSize: 13, color: '#8C909F', marginTop: 6, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                    <span style={{ color: '#C2C6D6' }}>{form.email}</span> adresine gönderilen 6 haneli kodu girin
                  </p>
                </div>

                {error && (
                  <div className="mb-4 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <span style={{ fontSize: 13, color: '#FCA5A5', fontFamily: 'Inter, sans-serif' }}>{error}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp}>
                  <div className="flex justify-between gap-1.5 mb-5" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKey(i, e)}
                        autoFocus={i === 0}
                        style={{
                          flex: 1, minWidth: 0, height: 48, textAlign: 'center',
                          fontSize: 18, fontWeight: 700, fontFamily: 'Geist, sans-serif',
                          background: digit ? 'rgba(59,130,246,0.08)' : '#12131a',
                          border: digit ? '1px solid rgba(59,130,246,0.5)' : '1px solid #262626',
                          borderRadius: 8, color: '#E2E1EB', outline: 'none',
                          transition: 'border-color 0.15s, background 0.15s',
                          boxShadow: digit ? '0 0 0 2px rgba(59,130,246,0.1)' : 'none',
                        }}
                      />
                    ))}
                  </div>

                  <button type="submit" disabled={loading || otp.join('').length !== 6}
                    className="w-full flex items-center justify-center gap-2 rounded-lg transition-all"
                    style={{
                      height: 40, background: '#3B82F6', color: '#fff',
                      fontFamily: 'Geist, Inter, sans-serif', fontSize: 14, fontWeight: 600,
                      border: 'none', cursor: loading || otp.join('').length !== 6 ? 'not-allowed' : 'pointer',
                      opacity: otp.join('').length !== 6 ? 0.5 : 1,
                      boxShadow: otp.join('').length === 6 ? '0 0 20px rgba(59,130,246,0.3)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Doğrulanıyor...</>
                      : <>Doğrula <ArrowRight className="w-4 h-4" /></>
                    }
                  </button>
                </form>

                <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid #262626' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#424754' }}>schedule</span>
                    <span style={{ fontSize: 13, color: cooldown === 0 ? '#EF4444' : '#424754', fontFamily: 'Inter, sans-serif' }}>
                      {cooldown > 0 ? `0:${cooldown < 10 ? '0' : ''}${cooldown}` : '0:00'}
                    </span>
                  </div>
                  <button
                    onClick={() => { setError(''); setOtp(['', '', '', '', '', '']); handleSendOtp() }}
                    disabled={cooldown > 0}
                    style={{ fontSize: 13, color: cooldown > 0 ? '#424754' : '#C2C6D6', fontFamily: 'Inter, sans-serif', background: 'none', border: 'none', cursor: cooldown > 0 ? 'not-allowed' : 'pointer' }}
                    className="flex items-center gap-1.5 hover:text-white transition-colors disabled:hover:text-gray-600">
                    <RefreshCw className="w-3 h-3" /> Kodu tekrar gönder
                  </button>
                </div>

                <button onClick={() => { setStep('form'); setError(''); setOtp(['', '', '', '', '', '']) }}
                  className="mt-3 w-full text-center flex items-center justify-center gap-1.5 transition-colors"
                  style={{ fontSize: 13, color: '#424754', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#8C909F')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#424754')}>
                  ← Geri dön
                </button>
              </>
            )}

            {/* STEP: success */}
            {step === 'success' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <CheckCircle className="w-7 h-7" style={{ color: '#10B981' }} />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Geist, Inter, sans-serif', fontSize: 20, fontWeight: 600, color: '#E2E1EB', margin: 0 }}>
                    {tab === 'login' ? 'Giriş Başarılı!' : 'Hesap Oluşturuldu!'}
                  </h2>
                  <p style={{ fontSize: 14, color: '#8C909F', marginTop: 6, fontFamily: 'Inter, sans-serif' }}>
                    {tab === 'login' ? 'Dashboard\'a yönlendiriliyorsunuz...' : 'Kurulum sayfasına yönlendiriliyorsunuz...'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 mt-5">
          <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#424754' }}>shield_lock</span>
          <span style={{ fontSize: 12, color: '#424754', fontFamily: 'Inter, sans-serif' }}>Uçtan uca şifrelenmiş bağlantı</span>
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[55%_45%]" style={{ background: '#0A0A0A' }}>
      <LeftPanel />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen" style={{ background: '#0A0A0A' }}>
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }} />
        </div>
      }>
        <AuthForm />
      </Suspense>
    </div>
  )
}
