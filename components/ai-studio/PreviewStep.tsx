'use client'

import { useState } from 'react'
import { Monitor, Smartphone, Mail, RefreshCw, Pencil, Check, Loader2 } from 'lucide-react'

type ViewMode = 'mobile' | 'desktop' | 'email'

interface Props {
  generatedImageUrl: string
  generatedHtml: string | null
  content: { headline: string; ctaLabel: string }
  isLoading: boolean
  onContent: (c: { headline: string; ctaLabel: string }) => void
  onApprove: () => void
  onRegenerate: () => void
  onEdit: () => void
}

const VIEWS: { key: ViewMode; icon: React.ElementType; label: string; width: number }[] = [
  { key: 'mobile',  icon: Smartphone, label: 'Mobil (375px)',  width: 375 },
  { key: 'desktop', icon: Monitor,    label: 'Masaüstü (600px)', width: 600 },
  { key: 'email',   icon: Mail,       label: 'Email',          width: 600 },
]

export function PreviewStep({
  generatedImageUrl, generatedHtml, content, isLoading,
  onContent, onApprove, onRegenerate, onEdit,
}: Props) {
  const [view, setView] = useState<ViewMode>('desktop')
  const [saving, setSaving] = useState(false)

  const viewDef = VIEWS.find(v => v.key === view)!

  async function handleApprove() {
    setSaving(true)
    await onApprove()
    setSaving(false)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 gap-4 flex-wrap"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0f0f1a' }}>

        {/* View tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#08080f', border: '1px solid rgba(255,255,255,0.07)' }}>
          {VIEWS.map(v => {
            const Icon = v.icon
            return (
              <button key={v.key} onClick={() => setView(v.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                style={{
                  background: view === v.key ? 'rgba(108,71,255,0.2)' : 'transparent',
                  color: view === v.key ? '#a78bfa' : '#6b7280',
                  border: view === v.key ? '1px solid rgba(108,71,255,0.3)' : '1px solid transparent',
                }}>
                <Icon className="w-3.5 h-3.5" /> {v.label}
              </button>
            )
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8080a0' }}>
            <Pencil className="w-3.5 h-3.5" /> Düzenle
          </button>

          <button onClick={onRegenerate} disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{ background: 'rgba(108,71,255,0.12)', border: '1px solid rgba(108,71,255,0.25)', color: '#a78bfa', opacity: isLoading ? 0.5 : 1 }}>
            <RefreshCw className="w-3.5 h-3.5" /> Yeniden Üret
          </button>

          <button onClick={handleApprove} disabled={saving || isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
            style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)', color: '#fff', boxShadow: '0 4px 14px rgba(108,71,255,0.35)', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Onayla & Kaydet
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Preview area */}
        <div className="flex-1 flex items-start justify-center overflow-auto p-6"
          style={{ background: '#08080f' }}>
          <div style={{ width: viewDef.width, maxWidth: '100%' }}>
            {view === 'email' && generatedHtml ? (
              <iframe
                srcDoc={generatedHtml}
                title="Email önizleme"
                sandbox="allow-same-origin"
                className="w-full border-0 rounded-xl"
                style={{ minHeight: 500 }}
                onLoad={e => {
                  const d = e.currentTarget.contentDocument
                  if (d) e.currentTarget.style.height = d.documentElement.scrollHeight + 'px'
                }}
              />
            ) : (
              <div className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                <img
                  src={generatedImageUrl}
                  alt="Üretilen banner"
                  className="w-full object-cover"
                  style={{ aspectRatio: view === 'mobile' ? '9/16' : '16/9' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: text editing */}
        <div className="w-64 shrink-0 flex flex-col gap-4 p-4 overflow-y-auto"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', background: '#0f0f1a' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#3e3e54' }}>Metin Düzenle</p>

          <div>
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#6b7280' }}>Başlık</label>
            <textarea
              value={content.headline}
              onChange={e => onContent({ ...content, headline: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-xl text-[13px] outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4', fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#6b7280' }}>CTA Butonu</label>
            <input
              value={content.ctaLabel}
              onChange={e => onContent({ ...content, ctaLabel: e.target.value })}
              className="w-full px-3 py-2 rounded-xl text-[13px] outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4' }}
            />
          </div>

          <div className="mt-2 p-3 rounded-xl" style={{ background: 'rgba(108,71,255,0.08)', border: '1px solid rgba(108,71,255,0.15)' }}>
            <p className="text-[11px]" style={{ color: '#a78bfa' }}>
              Metinleri düzenleyerek "Onayla & Kaydet" butonuna basın.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
