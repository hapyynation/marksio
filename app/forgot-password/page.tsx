'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/forgot-password', {
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
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--blue)', boxShadow: '0 2px 8px rgba(68,112,255,0.3)' }}>
            <span className="material-symbols-outlined icon-fill text-white" style={{ fontSize: 14 }}>auto_awesome</span>
          </div>
          <span className="text-[14px] font-bold" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>Marksio</span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: '#080810',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.6)',
          }}>
          <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #0066ff, #00f1fe)' }} />

          <div className="p-8">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <CheckCircle2 className="w-6 h-6" style={{ color: '#34d399' }} />
                </div>
                <div>
                  <h1 className="text-[20px] font-bold mb-2" style={{ color: '#eeeef4' }}>Email gönderildi</h1>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }}>
                    <span className="font-semibold" style={{ color: '#eeeef4' }}>{email}</span> adresine
                    şifre sıfırlama bağlantısı gönderdik. Spam klasörünü de kontrol edin.
                  </p>
                </div>
                <Link href="/login"
                  className="flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold transition-all w-full"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#c2c6d8' }}>
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Giriş sayfasına dön
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <h1 className="text-[20px] font-bold mb-1" style={{ color: '#eeeef4', letterSpacing: '-0.025em' }}>
                    Şifrenizi sıfırlayın
                  </h1>
                  <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>
                    Email adresinizi girin, size sıfırlama bağlantısı gönderelim.
                  </p>
                </div>

                {error && <div className="ds-alert ds-alert-error mb-5">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email adresi</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="siz@magaza.com"
                      required
                    />
                  </div>

                  <button type="submit" disabled={loading}
                    className="btn-gradient w-full justify-center h-10 rounded-xl text-[14px] font-semibold">
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</>
                      : 'Sıfırlama Bağlantısı Gönder'
                    }
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="px-8 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
            <Link href="/login"
              className="flex items-center justify-center gap-2 text-[13px] font-semibold transition-colors"
              style={{ color: 'var(--text-2)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#eeeef4')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
              <ArrowLeft className="w-3.5 h-3.5" />
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
