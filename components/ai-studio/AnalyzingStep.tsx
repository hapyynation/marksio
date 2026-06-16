'use client'

import { Loader2 } from 'lucide-react'

export function AnalyzingStep({ previewUrl }: { previewUrl: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-10 max-w-2xl mx-auto w-full gap-8">
      {previewUrl && (
        <div className="relative w-full max-w-sm rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <img src={previewUrl} alt="Yüklenen görsel" className="w-full h-48 object-contain"
            style={{ background: '#0f0f1a' }} />
          <div className="absolute inset-0" style={{ background: 'rgba(8,8,15,0.55)' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)', boxShadow: '0 8px 24px rgba(108,71,255,0.4)' }}>
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          </div>
        </div>
      )}

      <div className="text-center space-y-2">
        <p className="text-[16px] font-bold" style={{ color: '#eeeef4' }}>Görsel analiz ediliyor...</p>
        <p className="text-[13px]" style={{ color: '#8080a0' }}>
          AI görselinizi inceliyor: renkler, nesneler, metin
        </p>
      </div>

      {/* Skeleton cards */}
      <div className="w-full max-w-sm space-y-3">
        {[80, 60, 90].map((w, i) => (
          <div key={i} className="rounded-xl px-4 py-3" style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="h-3 rounded-full animate-pulse mb-2" style={{ width: `${w}%`, background: 'rgba(255,255,255,0.07)' }} />
            <div className="h-2 rounded-full animate-pulse" style={{ width: `${w * 0.6}%`, background: 'rgba(255,255,255,0.04)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
