'use client'

import { useState, useRef } from 'react'
import { Loader2, Trash2, Crop, Sparkles, BookImage, Info, Check } from 'lucide-react'
import type { ImageAnalysis, CropConfig } from './types'

interface Props {
  previewUrl: string
  processedImageUrl: string | null
  analysis: ImageAnalysis | null
  cropConfig: CropConfig | null
  customPrompt: string
  selectedStyle: 'minimal' | 'dramatic' | 'colorful' | 'corporate'
  config: { brandName: string; productName: string; accentColor: string }
  onProcessedImageUrl: (url: string) => void
  onCropConfig: (c: CropConfig) => void
  onCustomPrompt: (s: string) => void
  onSelectedStyle: (s: 'minimal' | 'dramatic' | 'colorful' | 'corporate') => void
  onConfig: (c: { brandName: string; productName: string; accentColor: string }) => void
  onGenerate: () => void
}

const PRESETS: { label: string; width: number; height: number; tag: CropConfig['label'] }[] = [
  { label: 'Email (600×200)', width: 600, height: 200, tag: 'email' },
  { label: 'WhatsApp (800×418)', width: 800, height: 418, tag: 'whatsapp' },
  { label: 'Kare (800×800)', width: 800, height: 800, tag: 'square' },
]

const STYLES: { key: 'minimal' | 'dramatic' | 'colorful' | 'corporate'; label: string; desc: string }[] = [
  { key: 'minimal',   label: 'Minimalist', desc: 'Sade, beyaz zemin' },
  { key: 'dramatic',  label: 'Dramatik',   desc: 'Koyu, güçlü ışık' },
  { key: 'colorful',  label: 'Renkli',     desc: 'Canlı, enerjik' },
  { key: 'corporate', label: 'Kurumsal',   desc: 'Profesyonel stüdyo' },
]

export function EditingStep({
  previewUrl, processedImageUrl, analysis, cropConfig,
  customPrompt, selectedStyle, config,
  onProcessedImageUrl, onCropConfig, onCustomPrompt,
  onSelectedStyle, onConfig, onGenerate,
}: Props) {
  const [removingBg,  setRemovingBg]  = useState(false)
  const [removeBgErr, setRemoveBgErr] = useState('')
  const [savedToLib,  setSavedToLib]  = useState(false)
  const activeImage = processedImageUrl ?? previewUrl

  async function removeBg() {
    setRemovingBg(true); setRemoveBgErr('')
    try {
      const res = await fetch(activeImage)
      const blob = await res.blob()
      const reader = new FileReader()
      const dataUrl = await new Promise<string>(resolve => {
        reader.onload = e => resolve(e.target?.result as string)
        reader.readAsDataURL(blob)
      })

      const r = await fetch('/api/fal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove-bg', imageUrl: dataUrl }),
      })
      const d = await r.json() as { url?: string; error?: string }
      if (!r.ok || !d.url) throw new Error(d.error ?? 'Başarısız')
      onProcessedImageUrl(d.url)
    } catch (e) {
      setRemoveBgErr((e as Error).message)
    } finally {
      setRemovingBg(false)
    }
  }

  function cropImage(imageUrl: string, targetWidth: number, targetHeight: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas context failed'))

        const imgRatio = img.width / img.height
        const targetRatio = targetWidth / targetHeight

        let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number

        if (imgRatio > targetRatio) {
          drawHeight = targetHeight
          drawWidth = img.width * (targetHeight / img.height)
          offsetX = (targetWidth - drawWidth) / 2
          offsetY = 0
        } else {
          drawWidth = targetWidth
          drawHeight = img.height * (targetWidth / img.width)
          offsetX = 0
          offsetY = (targetHeight - drawHeight) / 2
        }

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, targetWidth, targetHeight)
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

        resolve(canvas.toDataURL('image/jpeg', 0.92))
      }
      img.onerror = reject
      img.src = imageUrl
    })
  }

  async function applyCrop(preset: typeof PRESETS[number]) {
    try {
      const croppedDataUrl = await cropImage(activeImage, preset.width, preset.height)
      onProcessedImageUrl(croppedDataUrl)
      onCropConfig({ width: preset.width, height: preset.height, label: preset.tag })
    } catch (e) {
      console.error('[EditingStep] crop failed:', e)
    }
  }

  function saveToLibrary() {
    try {
      interface LibEntry { id: string; url: string; name: string; createdAt: number }
      const existing: LibEntry[] = JSON.parse(localStorage.getItem('marksio_brand_library') ?? '[]')
      const entry: LibEntry = {
        id: crypto.randomUUID(),
        url: activeImage,
        name: config.productName || `Görsel ${new Date().toLocaleDateString('tr')}`,
        createdAt: Date.now(),
      }
      localStorage.setItem('marksio_brand_library', JSON.stringify([entry, ...existing].slice(0, 50)))
      setSavedToLib(true)
      setTimeout(() => setSavedToLib(false), 2500)
    } catch { /* ignore */ }
  }

  return (
    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

      {/* Left: preview */}
      <div className="w-full lg:w-[340px] shrink-0 flex flex-col items-center justify-center p-6 gap-4"
        style={{ borderRight: '1px solid rgba(255,255,255,0.07)', background: '#08080f' }}>
        <div className="relative w-full max-w-xs rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <img
            src={activeImage}
            alt="Ürün görseli"
            className="w-full object-contain"
            style={{ maxHeight: 280, background: processedImageUrl ? 'transparent' : '#0f0f1a' }}
          />
        </div>

        {processedImageUrl && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{ background: 'rgba(34,201,122,0.12)', border: '1px solid rgba(34,201,122,0.25)', color: '#22c97a' }}>
            <Check className="w-3 h-3" /> Arka plan kaldırıldı
          </div>
        )}
        {cropConfig && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{ background: 'rgba(108,71,255,0.12)', border: '1px solid rgba(108,71,255,0.3)', color: '#a78bfa' }}>
            <Crop className="w-3 h-3" /> {PRESETS.find(p => p.tag === cropConfig.label)?.label}
          </div>
        )}
      </div>

      {/* Right: panels */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* Panel A: Remove BG */}
        <Panel title="Arka Plan Kaldır" icon={Trash2}>
          <div className="flex items-center gap-3">
            <button
              onClick={removeBg}
              disabled={removingBg}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
              style={{ background: 'rgba(108,71,255,0.15)', border: '1px solid rgba(108,71,255,0.3)', color: '#a78bfa', opacity: removingBg ? 0.5 : 1 }}>
              {removingBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {removingBg ? 'İşleniyor...' : 'Arka Planı Kaldır'}
            </button>
            <div className="flex items-center gap-1" style={{ color: '#6b7280' }}>
              <Info className="w-3 h-3" />
              <span className="text-[11px]">Fal.ai kredisi kullanılır</span>
            </div>
          </div>
          {removeBgErr && <p className="text-[12px] mt-2" style={{ color: '#e84545' }}>{removeBgErr}</p>}
        </Panel>

        {/* Panel B: Crop */}
        <Panel title="Kırp & Boyutlandır" icon={Crop}>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button key={p.tag} onClick={() => { void applyCrop(p) }}
                className="px-3 py-2 rounded-xl text-[12px] font-semibold transition-all"
                style={{
                  background: cropConfig?.label === p.tag ? 'rgba(108,71,255,0.2)' : 'rgba(255,255,255,0.04)',
                  border: cropConfig?.label === p.tag ? '1px solid rgba(108,71,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: cropConfig?.label === p.tag ? '#a78bfa' : '#8080a0',
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </Panel>

        {/* Panel C: AI Banner */}
        <Panel title="AI Banner Üret" icon={Sparkles}>
          {analysis?.detectedObjects && analysis.detectedObjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {analysis.detectedObjects.map((obj, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{ background: 'rgba(108,71,255,0.1)', border: '1px solid rgba(108,71,255,0.2)', color: '#a78bfa' }}>
                  {obj}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#6b7280' }}>
                Marka Adı
              </label>
              <input
                value={config.brandName}
                onChange={e => onConfig({ ...config, brandName: e.target.value })}
                placeholder="Marksio"
                className="w-full px-3 py-2 rounded-xl text-[13px] outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#6b7280' }}>
                Ürün Adı
              </label>
              <input
                value={config.productName}
                onChange={e => onConfig({ ...config, productName: e.target.value })}
                placeholder="Nike Air Max..."
                className="w-full px-3 py-2 rounded-xl text-[13px] outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#6b7280' }}>
                Banner Prompt
              </label>
              <textarea
                value={customPrompt || analysis?.suggestedFalPrompt || ''}
                onChange={e => onCustomPrompt(e.target.value)}
                placeholder="Profesyonel e-ticaret banner görseli..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl text-[12px] outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-2" style={{ color: '#6b7280' }}>Stil</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map(s => (
                  <button key={s.key} onClick={() => onSelectedStyle(s.key)}
                    className="flex flex-col items-start px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: selectedStyle === s.key ? 'rgba(108,71,255,0.18)' : 'rgba(255,255,255,0.03)',
                      border: selectedStyle === s.key ? '1px solid rgba(108,71,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    }}>
                    <span className="text-[12px] font-semibold" style={{ color: selectedStyle === s.key ? '#a78bfa' : '#eeeef4' }}>{s.label}</span>
                    <span className="text-[11px]" style={{ color: '#6b7280' }}>{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={onGenerate}
              className="w-full py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)', color: '#fff', boxShadow: '0 6px 20px rgba(108,71,255,0.35)' }}>
              <Sparkles className="w-4 h-4" /> Banner Üret
            </button>
          </div>
        </Panel>

        {/* Panel D: Brand Library */}
        <Panel title="Marka Kütüphanesine Kaydet" icon={BookImage}>
          <button
            onClick={saveToLibrary}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
            style={{
              background: savedToLib ? 'rgba(34,201,122,0.15)' : 'rgba(255,255,255,0.04)',
              border: savedToLib ? '1px solid rgba(34,201,122,0.3)' : '1px solid rgba(255,255,255,0.1)',
              color: savedToLib ? '#22c97a' : '#8080a0',
            }}>
            {savedToLib ? <Check className="w-4 h-4" /> : <BookImage className="w-4 h-4" />}
            {savedToLib ? 'Kütüphaneye Eklendi!' : 'Kütüphaneye Ekle'}
          </button>
        </Panel>
      </div>
    </div>
  )
}

function Panel({
  title, icon: Icon, children
}: {
  title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(108,71,255,0.15)' }}>
          <Icon className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
        </div>
        <span className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}
