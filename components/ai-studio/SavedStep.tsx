'use client'

import { useRouter } from 'next/navigation'
import { Check, LayoutGrid, Plus } from 'lucide-react'

interface Props {
  generatedImageUrl: string | null
  content: { headline: string; ctaLabel: string }
  onReset: () => void
}

export function SavedStep({ generatedImageUrl, content, onReset }: Props) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 max-w-2xl mx-auto w-full gap-8">
      {/* Success icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#22c97a,#16a34a)', boxShadow: '0 12px 40px rgba(34,201,122,0.4)' }}>
          <Check className="w-10 h-10 text-white" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold" style={{ color: '#eeeef4' }}>Banner Kaydedildi!</h2>
        <p className="text-[14px]" style={{ color: '#8080a0' }}>
          Banner başarıyla AI Assets koleksiyonuna eklendi.
        </p>
      </div>

      {/* Preview */}
      {generatedImageUrl && (
        <div className="w-full max-w-md rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <img src={generatedImageUrl} alt="Kaydedilen banner" className="w-full object-cover" style={{ aspectRatio: '16/9' }} />
          {(content.headline || content.ctaLabel) && (
            <div className="px-4 py-3" style={{ background: '#0f0f1a' }}>
              {content.headline && (
                <p className="text-[14px] font-semibold" style={{ color: '#eeeef4' }}>{content.headline}</p>
              )}
              {content.ctaLabel && (
                <p className="text-[12px] mt-0.5" style={{ color: '#6c47ff' }}>{content.ctaLabel}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push('/ai-assets')}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-semibold transition-all"
          style={{ background: 'rgba(108,71,255,0.15)', border: '1px solid rgba(108,71,255,0.3)', color: '#a78bfa' }}>
          <LayoutGrid className="w-4 h-4" /> AI Assets'e Git
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold transition-all"
          style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)', color: '#fff', boxShadow: '0 4px 14px rgba(108,71,255,0.35)' }}>
          <Plus className="w-4 h-4" /> Yeni Banner Yap
        </button>
      </div>
    </div>
  )
}
