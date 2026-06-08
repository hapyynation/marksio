'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Mail, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const verified  = searchParams.get('verified')
  const error     = searchParams.get('error')
  const email     = searchParams.get('email') ?? ''

  const [resending,    setResending]    = useState(false)
  const [resendDone,   setResendDone]   = useState(false)
  const [resendError,  setResendError]  = useState('')
  const [countdown,    setCountdown]    = useState(3)

  // Auto-redirect after successful verification
  useEffect(() => {
    if (!verified) return
    const t = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [verified])

  useEffect(() => {
    if (verified && countdown <= 0) router.push('/dashboard')
  }, [verified, countdown, router])

  async function handleResend() {
    if (!email) return
    setResending(true)
    setResendError('')
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setResendDone(true)
      } else {
        setResendError('Gönderilemedi. Lütfen tekrar deneyin.')
      }
    } catch {
      setResendError('Bağlantı hatası.')
    } finally {
      setResending(false)
    }
  }

  const errorMessages: Record<string, string> = {
    missing:  'Doğrulama linki eksik.',
    invalid:  'Geçersiz veya hatalı doğrulama linki.',
    used:     'Bu link daha önce kullanıldı.',
    expired:  'Linkin süresi dolmuş. Lütfen yeni bir link isteyin.',
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#08080f' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black text-white"
            style={{ background: 'linear-gradient(135deg,#0066ff,#00f1fe)' }}>M</div>
          <span className="text-base font-black" style={{ color: '#e5e2e1' }}>Marksio</span>
        </div>

        <div className="rounded-2xl p-8 text-center"
          style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)' }}>

          {/* Success state */}
          {verified && (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(34,201,122,0.1)', border: '1px solid rgba(34,201,122,0.2)' }}>
                <CheckCircle className="w-8 h-8" style={{ color: '#22c97a' }} />
              </div>
              <h1 className="text-xl font-black mb-2" style={{ color: '#e5e2e1' }}>E-posta doğrulandı!</h1>
              <p className="text-sm mb-6" style={{ color: '#8c90a1' }}>
                Hesabınız aktifleştirildi. {countdown} saniye içinde yönlendiriliyorsunuz…
              </p>
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ background: 'linear-gradient(90deg,#0066ff,#00f1fe)', width: `${((3 - countdown) / 3) * 100}%` }} />
              </div>
            </>
          )}

          {/* Error state */}
          {error && (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(232,69,69,0.1)', border: '1px solid rgba(232,69,69,0.2)' }}>
                <AlertCircle className="w-8 h-8" style={{ color: '#e84545' }} />
              </div>
              <h1 className="text-xl font-black mb-2" style={{ color: '#e5e2e1' }}>Doğrulama başarısız</h1>
              <p className="text-sm mb-6" style={{ color: '#8c90a1' }}>
                {errorMessages[error] ?? 'Bir hata oluştu.'}
              </p>
              {email && (
                <button onClick={handleResend} disabled={resending || resendDone}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.2)', color: '#6b9fff' }}>
                  {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {resendDone ? 'Gönderildi!' : 'Yeni link gönder'}
                </button>
              )}
            </>
          )}

          {/* Default / waiting state */}
          {!verified && !error && (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.2)' }}>
                <Mail className="w-8 h-8" style={{ color: '#6b9fff' }} />
              </div>
              <h1 className="text-xl font-black mb-2" style={{ color: '#e5e2e1' }}>E-postanızı doğrulayın</h1>
              {email ? (
                <p className="text-sm mb-1" style={{ color: '#8c90a1' }}>
                  <span className="font-semibold" style={{ color: '#c2c6d8' }}>{email}</span> adresine bir doğrulama linki gönderdik.
                </p>
              ) : (
                <p className="text-sm mb-1" style={{ color: '#8c90a1' }}>
                  Kayıt e-posta adresinize bir doğrulama linki gönderdik.
                </p>
              )}
              <p className="text-xs mb-6" style={{ color: '#424656' }}>
                Spam klasörünü de kontrol etmeyi unutmayın.
              </p>

              {email && (
                <div className="space-y-2">
                  <button onClick={handleResend} disabled={resending || resendDone}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={resendDone
                      ? { background: 'rgba(34,201,122,0.08)', border: '1px solid rgba(34,201,122,0.2)', color: '#22c97a' }
                      : { background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.2)', color: '#6b9fff' }}>
                    {resending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor…</>
                      : resendDone
                      ? <><CheckCircle className="w-4 h-4" /> Gönderildi!</>
                      : <><RefreshCw className="w-4 h-4" /> Tekrar gönder</>}
                  </button>
                  {resendError && (
                    <p className="text-xs" style={{ color: '#e84545' }}>{resendError}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080f' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#4470ff' }} />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
