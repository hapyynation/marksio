'use client'

import { Loader2, Sparkles } from 'lucide-react'

export function GeneratingStep() {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6"
      style={{ background: 'rgba(8,8,15,0.92)' }}
    >
      <div className="relative">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)', boxShadow: '0 16px 48px rgba(108,71,255,0.45)' }}
        >
          <Sparkles className="w-10 h-10 text-white animate-pulse" />
        </div>
        <div
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: '#08080f', border: '2px solid #1e1e2e' }}
        >
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#6c47ff' }} />
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-[18px] font-bold" style={{ color: '#eeeef4' }}>Banner oluşturuluyor...</p>
        <p className="text-[13px]" style={{ color: '#8080a0' }}>
          Görsel ve metin içeriği paralel olarak üretiliyor
        </p>
      </div>

      <div className="flex flex-col gap-2 w-48">
        {['Görsel üretiliyor', 'Metin oluşturuluyor'].map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: '#6c47ff', animationDelay: `${i * 0.3}s` }} />
            <span className="text-[12px]" style={{ color: '#6b7280' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
