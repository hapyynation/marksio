'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Loader2, Mail, Zap, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Bir hata oluştu.')
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page dot-bg items-center justify-center">
      <div className="auth-bg-orb-1" />
      <div className="auth-bg-orb-2" />

      <div className="relative z-10 w-full max-w-[380px] px-6">
        {/* Logo */}
        <Link href="/login" className="flex items-center gap-2 mb-8">
          <div className="btn-gradient w-7 h-7 rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-black" style={{ color: '#e5e2e1' }}>Marksio</span>
        </Link>

        <div className="ds-modal">
          <div className="p-8">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <CheckCircle2 className="w-6 h-6" style={{ color: '#34d399' }} />
                </div>
                <div>
                  <h1 className="text-xl font-black mb-2" style={{ color: '#e5e2e1' }}>Email gönderildi</h1>
                  <p className="text-sm leading-relaxed" style={{ color: '#8c90a1' }}>
                    <span className="font-semibold" style={{ color: '#e5e2e1' }}>{email}</span> adresine
                    şifre sıfırlama bağlantısı gönderdik. Spam klasörünü de kontrol edin.
                  </p>
                </div>
                <Link href="/login"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all w-full"
                  style={{ background: '#1c1b1b', border: '1px solid rgba(255,255,255,0.07)', color: '#c2c6d8' }}>
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Giriş sayfasına dön
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(0,241,254,0.06)', border: '1px solid rgba(0,241,254,0.12)' }}>
                    <Mail className="w-5 h-5" style={{ color: '#00f1fe' }} />
                  </div>
                  <h1 className="text-xl font-black mb-1" style={{ color: '#e5e2e1' }}>Şifrenizi sıfırlayın</h1>
                  <p className="text-xs" style={{ color: '#8c90a1' }}>
                    Email adresinizi girin, size sıfırlama bağlantısı gönderelim.
                  </p>
                </div>

                {error && <div className="ds-alert ds-alert-error mb-5">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Email adresi</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="siz@magaza.com"
                      required
                      className="input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-gradient w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</>
                      : 'Sıfırlama Bağlantısı Gönder'
                    }
                  </button>
                </form>

                <div className="ds-sep" />

                <Link href="/login"
                  className="flex items-center justify-center gap-2 text-xs font-semibold transition-colors"
                  style={{ color: '#8c90a1' }}>
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Giriş sayfasına dön
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
