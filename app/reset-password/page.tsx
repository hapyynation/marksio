'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Zap, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react'

function ResetPasswordForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const pwLen = password.length
  const strengthLevel = pwLen >= 12 ? 4 : pwLen >= 8 ? 3 : pwLen >= 5 ? 2 : pwLen > 0 ? 1 : 0
  const strengthColors = ['', '#ef4444', '#f59e0b', '#f59e0b', '#34d399']
  const strengthLabels = ['', 'Çok zayıf', 'Zayıf', 'Orta', 'Güçlü']

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Şifreler eşleşmiyor.'); return }
    if (pwLen < 8) { setError('Şifre en az 8 karakter olmalı.'); return }
    if (!token) { setError('Geçersiz veya süresi dolmuş bağlantı.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Bir hata oluştu.')
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm" style={{ color: '#8c90a1' }}>Geçersiz şifre sıfırlama bağlantısı.</p>
        <Link href="/forgot-password" className="btn-gradient flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold">
          Yeni bağlantı talep et
        </Link>
      </div>
    )
  }

  return done ? (
    <div className="text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
        style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
        <CheckCircle2 className="w-6 h-6" style={{ color: '#34d399' }} />
      </div>
      <div>
        <h1 className="text-xl font-black mb-2" style={{ color: '#e5e2e1' }}>Şifre güncellendi</h1>
        <p className="text-sm" style={{ color: '#8c90a1' }}>Giriş sayfasına yönlendiriliyorsunuz...</p>
      </div>
    </div>
  ) : (
    <>
      <div className="mb-7">
        <h1 className="text-xl font-black mb-1" style={{ color: '#e5e2e1' }}>Yeni şifre belirleyin</h1>
        <p className="text-xs" style={{ color: '#8c90a1' }}>Güçlü bir şifre seçin ve güvende kalın.</p>
      </div>

      {error && <div className="ds-alert ds-alert-error mb-5">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Yeni şifre</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input pr-10"
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: '#8c90a1' }}>
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                    style={{ background: i <= strengthLevel ? strengthColors[strengthLevel] : 'rgba(255,255,255,0.06)' }} />
                ))}
              </div>
              <p className="text-[10px] font-semibold" style={{ color: strengthColors[strengthLevel] }}>
                {strengthLabels[strengthLevel]}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="label">Şifre tekrar</label>
          <input
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            className="input"
          />
          {confirm && confirm !== password && (
            <p className="text-[10px] mt-1.5 font-semibold" style={{ color: '#ef4444' }}>Şifreler eşleşmiyor</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-gradient w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold mt-2"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Güncelleniyor...</>
            : 'Şifremi Güncelle'
          }
        </button>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page dot-bg items-center justify-center">
      <div className="auth-bg-orb-1" />
      <div className="auth-bg-orb-2" />

      <div className="relative z-10 w-full max-w-[380px] px-6">
        <Link href="/login" className="flex items-center gap-2 mb-8">
          <div className="btn-gradient w-7 h-7 rounded-lg flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-black" style={{ color: '#e5e2e1' }}>Marksio</span>
        </Link>

        <div className="ds-modal">
          <div className="p-8">
            <Suspense fallback={<div className="skeleton h-40 rounded-xl" />}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>

        <Link href="/login"
          className="flex items-center justify-center gap-2 mt-5 text-xs font-semibold transition-colors"
          style={{ color: '#8c90a1' }}>
          <ArrowLeft className="w-3.5 h-3.5" />
          Giriş sayfasına dön
        </Link>
      </div>
    </div>
  )
}
