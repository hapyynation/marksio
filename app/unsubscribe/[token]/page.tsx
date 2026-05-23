'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Loader2, MailX, Shield, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function UnsubscribePage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already'>('loading')
  const [email, setEmail] = useState('')

  useEffect(() => {
    fetch(`/api/unsubscribe/${params.token}`)
      .then(r => r.json())
      .then(data => {
        if (data.already) { setStatus('already'); setEmail(data.email) }
        else if (data.success) { setStatus('success'); setEmail(data.email) }
        else setStatus('error')
      })
      .catch(() => setStatus('error'))
  }, [params.token])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden shadow-2xl">

          {/* Top accent line */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-blue-400" />

          <div className="p-8 text-center">

            {/* Loading */}
            {status === 'loading' && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-5">
                  <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
                </div>
                <h1 className="text-xl font-bold text-white mb-2">İşleniyor...</h1>
                <p className="text-sm text-gray-500">Abonelik iptal isteğiniz işleniyor.</p>
              </>
            )}

            {/* Success */}
            {status === 'success' && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <h1 className="text-xl font-bold text-white mb-2">Abonelikten Çıkıldı</h1>
                <p className="text-sm text-gray-400 mb-1">
                  <span className="text-white font-medium">{email}</span> adresi pazarlama listesinden başarıyla çıkarıldı.
                </p>
                <p className="text-sm text-gray-500">Artık herhangi bir pazarlama e-postası almayacaksınız.</p>

                {/* GDPR info */}
                <div className="mt-6 bg-[#161616] border border-[#222] rounded-xl p-4 text-left">
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-300 mb-1">GDPR Bilgilendirmesi</p>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Bu işlem KVKK ve GDPR kapsamında kaydedilmiştir. Verilerinizin silinmesini talep etmek için mağaza ile doğrudan iletişime geçebilirsiniz.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-4">
                  Yanlışlıkla yaptıysanız mağaza ile iletişime geçin.
                </p>
              </>
            )}

            {/* Already unsubscribed */}
            {status === 'already' && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
                  <MailX className="w-7 h-7 text-blue-400" />
                </div>
                <h1 className="text-xl font-bold text-white mb-2">Zaten Çıkmışsınız</h1>
                <p className="text-sm text-gray-400">
                  <span className="text-white font-medium">{email}</span> adresi zaten pazarlama listesinden çıkarılmış durumda.
                </p>
                <div className="mt-5 bg-[#161616] border border-[#222] rounded-xl p-3">
                  <p className="text-xs text-gray-500">Bu işlem daha önce gerçekleştirilmiş. Herhangi bir e-posta alıyorsanız mağaza ile iletişime geçin.</p>
                </div>
              </>
            )}

            {/* Error */}
            {status === 'error' && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
                  <XCircle className="w-7 h-7 text-red-400" />
                </div>
                <h1 className="text-xl font-bold text-white mb-2">Geçersiz Link</h1>
                <p className="text-sm text-gray-400 mb-4">
                  Bu abonelik iptal linki geçersiz veya süresi dolmuş olabilir.
                </p>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-left">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-300/80">
                      Aboneliğinizi iptal etmek istiyorsanız aldığınız son e-postadaki linki kullanın veya mağaza ile iletişime geçin.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[#1e1e1e] px-8 py-4 bg-[#0d0d0d] flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Shield className="w-3 h-3" />
              KVKK Uyumlu
            </div>
            <div className="w-1 h-1 rounded-full bg-[#333]" />
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Shield className="w-3 h-3" />
              GDPR Uyumlu
            </div>
            <div className="w-1 h-1 rounded-full bg-[#333]" />
            <p className="text-xs text-gray-700">Marksio</p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors">
            <ArrowLeft className="w-3 h-3" />
            Ana sayfaya dön
          </Link>
        </div>
      </div>
    </div>
  )
}
