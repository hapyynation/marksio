'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ResetPasswordForm() {
  const params  = useSearchParams()
  const router  = useRouter()
  const token   = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')

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
      const res  = await fetch('/api/auth/reset-password', {
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
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>Geçersiz şifre sıfırlama bağlantısı.</p>
        <Link href="/forgot-password"
          className="btn-gradient flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold">
          Yeni bağlantı talep et
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <CheckCircle2 className="w-6 h-6" style={{ color: '#34d399' }} />
        </div>
        <div>
          <h1 className="text-[20px] font-bold mb-2" style={{ color: '#eeeef4' }}>Şifre güncellendi</h1>
          <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>Giriş sayfasına yönlendiriliyorsunuz...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-7">
        <h1 className="text-[20px] font-bold mb-1" style={{ color: '#eeeef4', letterSpacing: '-0.025em' }}>
          Yeni şifre belirleyin
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>Güçlü bir şifre seçin ve güvende kalın.</p>
      </div>

      {error && <div className="ds-alert ds-alert-error mb-5">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Yeni şifre</Label>
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
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--text-3)' }}>
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {password && (
            <div className="space-y-1 mt-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex-1 h-[3px] rounded-full transition-all duration-300"
                    style={{ background: i <= strengthLevel ? strengthColors[strengthLevel] : 'rgba(255,255,255,0.06)' }} />
                ))}
              </div>
              <p className="text-[11px] font-semibold" style={{ color: strengthColors[strengthLevel] }}>
                {strengthLabels[strengthLevel]}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Şifre tekrar</Label>
          <Input
            id="confirm"
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
          />
          {confirm && confirm !== password && (
            <p className="text-[11px] font-semibold" style={{ color: '#ef4444' }}>Şifreler eşleşmiyor</p>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="btn-gradient w-full justify-center h-10 rounded-xl text-[14px] font-semibold mt-1">
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
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--blue)', boxShadow: '0 2px 8px rgba(68,112,255,0.3)' }}>
            <span className="material-symbols-outlined icon-fill text-white" style={{ fontSize: 14 }}>auto_awesome</span>
          </div>
          <span className="text-[14px] font-bold" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>Marksio</span>
        </Link>

        <div className="rounded-2xl overflow-hidden"
          style={{
            background: '#080810',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.6)',
          }}>
          <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, #0066ff, #00f1fe)' }} />

          <div className="p-8">
            <Suspense fallback={<div className="h-40 animate-pulse rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }} />}>
              <ResetPasswordForm />
            </Suspense>
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
