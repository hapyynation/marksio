'use client'
export const dynamic = 'force-dynamic'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react'

// ─── Left Panel (mirrors login) ────────────────────────────────────────────────
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
            Büyümeye<br />
            <span style={{ color: '#3B82F6' }}>Bugün</span> Başla.
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#8C909F', lineHeight: 1.7, maxWidth: 340 }}>
            E-posta, WhatsApp ve yapay zeka ile mağazanızı bir sonraki seviyeye taşıyın.
          </p>
        </div>

        <div className="space-y-3" style={{ maxWidth: 340 }}>
          {[
            { icon: '📧', title: 'E-posta Kampanyaları', desc: 'Segmentlere özel, AI destekli kampanyalar' },
            { icon: '🤖', title: 'Akıllı Otomasyonlar', desc: 'Terk sepeti, hoş geldin, yeniden kazanım' },
            { icon: '💬', title: 'WhatsApp AI', desc: 'Müşteri sorularını otomatik yanıtla' },
          ].map(f => (
            <div key={f.title} className="flex items-center gap-3 rounded-xl p-3"
              style={{ background: '#171717', border: '1px solid #262626' }}>
              <span style={{ fontSize: 20 }}>{f.icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#E2E1EB', lineHeight: 1 }}>{f.title}</p>
                <p style={{ fontSize: 12, color: '#424754', marginTop: 2 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {['500+ Mağaza', 'Ücretsiz Başla', 'KVKK Uyumlu'].map(t => (
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

// ─── Register Form ─────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter()

  const [name,            setName]            = useState('')
  const [email,           setEmail]           = useState('')
  const [storeName,       setStoreName]       = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw,          setShowPw]          = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState('')

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 12px',
    borderRadius: 8, background: '#171717', border: '1px solid #262626',
    color: '#E2E1EB', fontSize: 14, outline: 'none', transition: 'border-color 0.15s',
  }

  const pwStrength = password.length >= 12 ? 'strong' : password.length >= 8 ? 'ok' : 'weak'
  const pwBarColor = pwStrength === 'strong' ? '#10B981' : pwStrength === 'ok' ? '#F59E0B' : '#EF4444'
  const pwBarWidth = pwStrength === 'strong' ? '100%' : pwStrength === 'ok' ? '55%' : password.length > 0 ? '25%' : '0%'

  const canSubmit = name && email && storeName && password.length >= 8 && password === confirmPassword

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.')
      return
    }
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, storeName }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Kayıt başarısız.')
        return
      }

      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[55%_45%]" style={{ background: '#0A0A0A' }}>
      <LeftPanel />

      <div className="flex flex-col justify-center min-h-screen w-full"
        style={{ background: '#0A0A0A', padding: '24px 20px', overflowY: 'auto' }}>

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
                  Hesap Oluştur
                </h2>
                <p style={{ fontSize: 14, color: '#8C909F', marginTop: 4 }}>
                  Ücretsiz başlayın, 14 gün pro özellikler.
                </p>
              </div>

              {error && (
                <div className="mb-4 px-3 py-2.5 rounded-lg"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <span style={{ fontSize: 13, color: '#FCA5A5' }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8C909F', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    AD SOYAD
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ayşe Kaya"
                    required
                    autoFocus
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#3B82F6')}
                    onBlur={e => (e.target.style.borderColor = '#262626')}
                  />
                </div>

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
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = '#3B82F6')}
                    onBlur={e => (e.target.style.borderColor = '#262626')}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8C909F', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    MAĞAZA ADI
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="Mağazam"
                    required
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
                      placeholder="En az 8 karakter"
                      required
                      minLength={8}
                      style={{ ...inputStyle, paddingRight: 40 }}
                      onFocus={e => (e.target.style.borderColor = '#3B82F6')}
                      onBlur={e => (e.target.style.borderColor = '#262626')}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: '#424754', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full" style={{ background: '#262626' }}>
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{ width: pwBarWidth, background: pwBarColor }} />
                      </div>
                      <span style={{ fontSize: 11, color: pwBarColor, minWidth: 40 }}>
                        {pwStrength === 'strong' ? 'Güçlü' : pwStrength === 'ok' ? 'Orta' : 'Zayıf'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#8C909F', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    ŞİFRE TEKRAR
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      style={{
                        ...inputStyle, paddingRight: 40,
                        borderColor: confirmPassword && password !== confirmPassword ? '#EF4444' : '#262626',
                      }}
                      onFocus={e => (e.target.style.borderColor = password !== confirmPassword ? '#EF4444' : '#3B82F6')}
                      onBlur={e => (e.target.style.borderColor = confirmPassword && password !== confirmPassword ? '#EF4444' : '#262626')}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: '#424754', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>Şifreler eşleşmiyor</p>
                  )}
                </div>

                <button type="submit" disabled={loading || !canSubmit}
                  className="w-full flex items-center justify-center gap-2 rounded-lg transition-all"
                  style={{
                    height: 42, marginTop: 4,
                    background: '#3B82F6',
                    opacity: !canSubmit ? 0.5 : 1,
                    color: '#fff', fontSize: 14, fontWeight: 600,
                    border: 'none', cursor: loading || !canSubmit ? 'not-allowed' : 'pointer',
                    boxShadow: canSubmit ? '0 0 16px rgba(59,130,246,0.2)' : 'none',
                  }}>
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Hesap oluşturuluyor...</>
                    : <>Kayıt Ol <ArrowRight className="w-4 h-4" /></>
                  }
                </button>

                <p style={{ fontSize: 11, color: '#424754', textAlign: 'center', marginTop: 8 }}>
                  Kayıt olarak{' '}
                  <Link href="#" style={{ color: '#6B7280', textDecoration: 'underline' }}>Kullanım Şartları</Link>'nı ve{' '}
                  <Link href="#" style={{ color: '#6B7280', textDecoration: 'underline' }}>Gizlilik Politikası</Link>'nı kabul etmiş olursunuz.
                </p>
              </form>
            </div>

            <div className="px-7 py-4 flex items-center justify-center gap-1"
              style={{ borderTop: '1px solid #262626', background: 'rgba(0,0,0,0.3)' }}>
              <span style={{ fontSize: 13, color: '#424754' }}>Zaten hesabın var mı?</span>
              <Link href="/login" style={{ fontSize: 13, color: '#3B82F6', fontWeight: 500, marginLeft: 4 }}
                className="hover:underline">
                Giriş yap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
