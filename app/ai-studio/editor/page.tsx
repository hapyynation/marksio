'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, Layers, Sliders, Wand2, Eye, EyeOff, Lock, Unlock,
  Trash2, ChevronUp, ChevronDown, Download, Send, Save, RefreshCw,
  Plus, Sparkles, X, Check, Copy, ZoomIn, ZoomOut, Maximize2,
  Image as ImageIcon, Type, Square, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Loader2, Upload, PanelLeft, PanelRight, Monitor,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TEMPLATES } from '@/lib/editor/templates'
import type { Layer, Template, LayerStyle, AiAction } from '@/lib/editor/types'

/* ─── Helpers ─── */
function uid() { return Math.random().toString(36).slice(2, 9) }

function buildGradient(style: LayerStyle, w: number, h: number) {
  if (style.gradientFrom && style.gradientTo) {
    const angle = style.gradientAngle ?? 135
    return `linear-gradient(${angle}deg, ${style.gradientFrom}, ${style.gradientTo})`
  }
  return style.fill ?? 'transparent'
}

/* ─── Template Gallery ─── */
function TemplateGallery({ onSelect, onBlank }: { onSelect: (t: Template) => void; onBlank: () => void }) {
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#08080f' }}>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 h-14 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#08080f' }}>
        <button onClick={() => router.push('/ai-studio')}
          className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
          style={{ color: '#666680' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#eeeef4')}
          onMouseLeave={e => (e.currentTarget.style.color = '#666680')}>
          <ChevronLeft className="w-4 h-4" /> AI Stüdyo
        </button>
        <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(68,112,255,0.4), rgba(159,122,250,0.4))' }}>
            <Layers className="w-3 h-3" style={{ color: '#c084fc' }} />
          </div>
          <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>Layer Editor</p>
        </div>
        <span className="ml-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(159,122,250,0.12)', color: '#9f7afa', border: '1px solid rgba(159,122,250,0.25)' }}>
          Beta
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(68,112,255,0.25), rgba(159,122,250,0.25))' }}>
              <Layers className="w-4 h-4" style={{ color: '#9f7afa' }} />
            </div>
            <h1 className="text-[26px] font-bold" style={{ color: '#eeeef4', letterSpacing: '-0.03em' }}>
              Şablon Seç
            </h1>
          </div>
          <p className="text-[13px] ml-11" style={{ color: '#44445a' }}>
            Hazır e-ticaret şablonlarından birini seç, tüm katmanları düzenle.
          </p>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {TEMPLATES.map(t => (
            <button key={t.id}
              onClick={() => onSelect(t)}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              className="group relative rounded-2xl overflow-hidden text-left transition-all"
              style={{
                border: hovered === t.id ? '1.5px solid rgba(159,122,250,0.5)' : '1.5px solid rgba(255,255,255,0.07)',
                transform: hovered === t.id ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hovered === t.id ? '0 16px 40px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.2)',
              }}>
              {/* Preview */}
              <div className="h-44 relative" style={{ background: t.previewGradient }}>
                {/* Simulated layer preview */}
                <div className="absolute inset-0 flex items-end p-4">
                  <div className="space-y-1.5 w-full">
                    <div className="h-2 w-16 rounded-full opacity-50" style={{ background: 'rgba(255,255,255,0.6)' }} />
                    <div className="h-4 w-32 rounded-sm opacity-80" style={{ background: 'rgba(255,255,255,0.8)' }} />
                    <div className="h-2.5 w-24 rounded-sm opacity-40" style={{ background: 'rgba(255,255,255,0.5)' }} />
                    <div className="mt-2 h-7 w-28 rounded-full opacity-90"
                      style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }} />
                  </div>
                  <div className="absolute right-4 top-4 bottom-4 w-24 rounded-xl opacity-20"
                    style={{ background: 'rgba(255,255,255,0.3)' }} />
                </div>
                {/* Layers badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                  <Layers className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span className="text-[9px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {t.layers.length} katman
                  </span>
                </div>
              </div>
              {/* Info */}
              <div className="px-4 py-3" style={{ background: '#0f0f1a' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-bold" style={{ color: '#eeeef4' }}>{t.name}</p>
                    <p className="text-[11px]" style={{ color: '#44445a' }}>{t.category}</p>
                  </div>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
                    style={{
                      background: hovered === t.id ? 'rgba(159,122,250,0.2)' : 'rgba(255,255,255,0.04)',
                      border: hovered === t.id ? '1px solid rgba(159,122,250,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    }}>
                    <ChevronRight className="w-3.5 h-3.5" style={{ color: hovered === t.id ? '#9f7afa' : '#44445a' }} />
                  </div>
                </div>
              </div>
            </button>
          ))}

          {/* Custom blank */}
          <button
            onClick={onBlank}
            className="relative rounded-2xl overflow-hidden text-left h-[220px] flex items-center justify-center transition-all"
            style={{ border: '1.5px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.01)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(68,112,255,0.3)'; e.currentTarget.style.background = 'rgba(68,112,255,0.03)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.01)' }}>
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5"
                style={{ background: 'rgba(68,112,255,0.1)' }}>
                <Plus className="w-5 h-5" style={{ color: '#4470ff' }} />
              </div>
              <p className="text-[13px] font-semibold" style={{ color: '#666680' }}>Boş Kanvas</p>
              <p className="text-[11px] mt-1" style={{ color: '#33334a' }}>Sıfırdan başla</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Needed icon missing from import ─── */
function ChevronRight({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

/* ─── Layer Row ─── */
function LayerRow({
  layer, isSelected, onSelect, onToggleVisible, onToggleLock, onDelete, onMoveUp, onMoveDown,
}: {
  layer: Layer
  isSelected: boolean
  onSelect: () => void
  onToggleVisible: () => void
  onToggleLock: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const ICONS: Record<string, React.ElementType> = {
    background: Square, productImage: ImageIcon, headline: Type,
    subheadline: Type, price: Type, ctaButton: Square, badge: Square, shape: Square,
  }
  const Icon = ICONS[layer.type] ?? Square

  return (
    <div
      onClick={onSelect}
      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all group"
      style={{
        background: isSelected ? 'rgba(68,112,255,0.1)' : 'transparent',
        border: `1px solid ${isSelected ? 'rgba(68,112,255,0.25)' : 'transparent'}`,
        opacity: layer.visible ? 1 : 0.4,
      }}>
      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
        style={{ background: isSelected ? 'rgba(68,112,255,0.2)' : 'rgba(255,255,255,0.04)' }}>
        <Icon className="w-2.5 h-2.5" style={{ color: isSelected ? '#4470ff' : '#666680' }} />
      </div>
      <span className="flex-1 text-[11px] font-medium truncate" style={{ color: isSelected ? '#eeeef4' : '#8080a0' }}>
        {layer.label}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={e => { e.stopPropagation(); onMoveUp() }} className="p-0.5 rounded hover:bg-white/10 transition-colors">
          <ChevronUp className="w-3 h-3" style={{ color: '#44445a' }} />
        </button>
        <button onClick={e => { e.stopPropagation(); onMoveDown() }} className="p-0.5 rounded hover:bg-white/10 transition-colors">
          <ChevronDown className="w-3 h-3" style={{ color: '#44445a' }} />
        </button>
        <button onClick={e => { e.stopPropagation(); onToggleVisible() }} className="p-0.5 rounded hover:bg-white/10 transition-colors">
          {layer.visible
            ? <Eye className="w-3 h-3" style={{ color: '#44445a' }} />
            : <EyeOff className="w-3 h-3" style={{ color: '#44445a' }} />}
        </button>
        <button onClick={e => { e.stopPropagation(); onToggleLock() }} className="p-0.5 rounded hover:bg-white/10 transition-colors">
          {layer.locked
            ? <Lock className="w-3 h-3" style={{ color: '#f0a020' }} />
            : <Unlock className="w-3 h-3" style={{ color: '#44445a' }} />}
        </button>
        {layer.type !== 'background' && (
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-0.5 rounded hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3 h-3" style={{ color: '#44445a' }} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Properties Panel ─── */
function PropertiesPanel({ layer, onChange }: { layer: Layer | null; onChange: (id: string, patch: Partial<Layer>) => void }) {
  const imageFileRef = useRef<HTMLInputElement>(null)
  if (!layer) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2">
        <Sliders className="w-8 h-8" style={{ color: '#22223a' }} />
        <p className="text-[11px]" style={{ color: '#33334a' }}>Bir katman seç</p>
      </div>
    )
  }

  const isText = ['headline', 'subheadline', 'price', 'ctaButton', 'badge'].includes(layer.type)
  const isImage = layer.type === 'productImage'

  const styleChange = (patch: Partial<LayerStyle>) => {
    onChange(layer.id, { style: { ...layer.style, ...patch } })
  }

  return (
    <div className="space-y-4 p-3">
      {/* Layer name */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#33334a' }}>Katman</p>
        <p className="text-[12px] font-semibold" style={{ color: '#8080a0' }}>{layer.label}</p>
      </div>

      <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* Position & Size */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#33334a' }}>Konum & Boyut</p>
        <div className="grid grid-cols-2 gap-2">
          {[['X', 'x', layer.x], ['Y', 'y', layer.y], ['G', 'width', layer.width], ['Y', 'height', layer.height]].map(([lbl, key, val]) => (
            <div key={key as string}>
              <p className="text-[9px] mb-1" style={{ color: '#44445a' }}>{lbl === 'G' ? 'Genişlik' : lbl === 'Y' && key === 'height' ? 'Yükseklik' : lbl}</p>
              <input
                type="number"
                value={Math.round(val as number)}
                onChange={e => onChange(layer.id, { [key as string]: Number(e.target.value) })}
                className="w-full px-2 py-1.5 rounded-lg text-[11px] outline-none"
                style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', color: '#eeeef4', fontFamily: 'JetBrains Mono, monospace' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(68,112,255,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Rotation */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#33334a' }}>Döndürme</p>
        <div className="flex items-center gap-2">
          <input type="range" min={-180} max={180} value={layer.rotation}
            onChange={e => onChange(layer.id, { rotation: Number(e.target.value) })}
            className="flex-1 accent-blue-500 h-1 rounded" />
          <span className="text-[10px] w-8 text-right" style={{ color: '#666680', fontFamily: 'JetBrains Mono, monospace' }}>{layer.rotation}°</span>
        </div>
      </div>

      {/* Opacity */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#33334a' }}>Opaklık</p>
        <div className="flex items-center gap-2">
          <input type="range" min={0} max={100} value={Math.round((layer.style.opacity ?? 1) * 100)}
            onChange={e => styleChange({ opacity: Number(e.target.value) / 100 })}
            className="flex-1 accent-blue-500 h-1 rounded" />
          <span className="text-[10px] w-8 text-right" style={{ color: '#666680', fontFamily: 'JetBrains Mono, monospace' }}>
            {Math.round((layer.style.opacity ?? 1) * 100)}%
          </span>
        </div>
      </div>

      <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

      {/* Background / Shape fill */}
      {!isText && !isImage && layer.type !== 'background' && (
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#33334a' }}>Dolgu Rengi</p>
          <div className="flex items-center gap-2">
            <input type="color" value={layer.style.fill ?? '#ffffff'}
              onChange={e => styleChange({ fill: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <input type="text" value={layer.style.fill ?? ''}
              onChange={e => styleChange({ fill: e.target.value })}
              placeholder="#000000"
              className="flex-1 px-2 py-1.5 rounded-lg text-[11px] outline-none"
              style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', color: '#eeeef4', fontFamily: 'JetBrains Mono, monospace' }} />
          </div>
        </div>
      )}

      {/* Background gradient controls */}
      {layer.type === 'background' && (
        <div className="space-y-3">
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#33334a' }}>Arka Plan</p>

          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-[9px] mb-1.5" style={{ color: '#44445a' }}>Başlangıç Rengi</p>
              <div className="flex items-center gap-1.5">
                <input type="color" value={layer.style.gradientFrom ?? '#0f0f1a'}
                  onChange={e => styleChange({ gradientFrom: e.target.value })}
                  className="w-7 h-7 rounded-md cursor-pointer p-0.5"
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }} />
                <input type="text" value={layer.style.gradientFrom ?? ''}
                  onChange={e => styleChange({ gradientFrom: e.target.value })}
                  placeholder="#0f0f1a"
                  className="flex-1 px-2 py-1 rounded-lg text-[10px] outline-none"
                  style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', color: '#eeeef4', fontFamily: 'JetBrains Mono, monospace' }} />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[9px] mb-1.5" style={{ color: '#44445a' }}>Bitiş Rengi</p>
              <div className="flex items-center gap-1.5">
                <input type="color" value={layer.style.gradientTo ?? '#1a1a2e'}
                  onChange={e => styleChange({ gradientTo: e.target.value })}
                  className="w-7 h-7 rounded-md cursor-pointer p-0.5"
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }} />
                <input type="text" value={layer.style.gradientTo ?? ''}
                  onChange={e => styleChange({ gradientTo: e.target.value })}
                  placeholder="#1a1a2e"
                  className="flex-1 px-2 py-1 rounded-lg text-[10px] outline-none"
                  style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', color: '#eeeef4', fontFamily: 'JetBrains Mono, monospace' }} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[9px] mb-1.5" style={{ color: '#44445a' }}>Gradient Açısı</p>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={360} value={layer.style.gradientAngle ?? 135}
                onChange={e => styleChange({ gradientAngle: Number(e.target.value) })}
                className="flex-1 accent-blue-500 h-1 rounded" />
              <span className="text-[10px] w-8 text-right" style={{ color: '#666680', fontFamily: 'JetBrains Mono, monospace' }}>
                {layer.style.gradientAngle ?? 135}°
              </span>
            </div>
          </div>

          <div className="rounded-xl h-8 w-full" style={{
            background: (layer.style.gradientFrom && layer.style.gradientTo)
              ? `linear-gradient(${layer.style.gradientAngle ?? 135}deg, ${layer.style.gradientFrom}, ${layer.style.gradientTo})`
              : layer.style.fill ?? '#0f0f1a',
            border: '1px solid rgba(255,255,255,0.07)',
          }} />

          <div>
            <p className="text-[9px] mb-1.5" style={{ color: '#44445a' }}>Düz Renk (gradient yerine)</p>
            <div className="flex items-center gap-1.5">
              <input type="color" value={layer.style.fill ?? '#0f0f1a'}
                onChange={e => styleChange({ fill: e.target.value, gradientFrom: undefined, gradientTo: undefined })}
                className="w-7 h-7 rounded-md cursor-pointer p-0.5"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }} />
              <input type="text" value={layer.style.fill ?? ''}
                onChange={e => styleChange({ fill: e.target.value })}
                placeholder="#0f0f1a"
                className="flex-1 px-2 py-1 rounded-lg text-[10px] outline-none"
                style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', color: '#eeeef4', fontFamily: 'JetBrains Mono, monospace' }} />
            </div>
          </div>
        </div>
      )}

      {/* Text-specific */}
      {isText && (
        <>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#33334a' }}>İçerik</p>
            <textarea value={layer.content ?? ''}
              onChange={e => onChange(layer.id, { content: e.target.value })}
              rows={2}
              className="w-full px-2.5 py-2 rounded-lg text-[11px] outline-none resize-none"
              style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', color: '#eeeef4' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(68,112,255,0.4)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')} />
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#33334a' }}>Renk</p>
            <div className="flex items-center gap-2">
              <input type="color" value={layer.style.color ?? '#ffffff'}
                onChange={e => styleChange({ color: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px' }} />
              <input type="text" value={layer.style.color ?? ''}
                onChange={e => styleChange({ color: e.target.value })}
                placeholder="#ffffff"
                className="flex-1 px-2 py-1.5 rounded-lg text-[11px] outline-none"
                style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', color: '#eeeef4', fontFamily: 'JetBrains Mono, monospace' }} />
            </div>
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#33334a' }}>Font Boyutu</p>
            <div className="flex items-center gap-2">
              <input type="range" min={8} max={72} value={layer.style.fontSize ?? 16}
                onChange={e => styleChange({ fontSize: Number(e.target.value) })}
                className="flex-1 accent-blue-500 h-1 rounded" />
              <span className="text-[10px] w-6 text-right" style={{ color: '#666680', fontFamily: 'JetBrains Mono, monospace' }}>{layer.style.fontSize ?? 16}</span>
            </div>
          </div>

          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#33334a' }}>Stil</p>
            <div className="flex items-center gap-1">
              {[
                { icon: Bold, key: 'fontWeight' as const, activeVal: '800', inactiveVal: '400', label: 'Kalın' },
                { icon: Italic, key: 'italic' as const, activeVal: true, inactiveVal: false, label: 'İtalik' },
              ].map(({ icon: Icon, key, activeVal, inactiveVal, label }) => {
                const isActive = key === 'fontWeight'
                  ? (layer.style.fontWeight ?? '400') === activeVal
                  : !!(layer.style as Record<string, unknown>)[key]
                return (
                  <button key={key}
                    onClick={() => styleChange({ [key]: isActive ? inactiveVal : activeVal } as Partial<LayerStyle>)}
                    title={label}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      background: isActive ? 'rgba(68,112,255,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isActive ? 'rgba(68,112,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    <Icon className="w-3 h-3" style={{ color: isActive ? '#4470ff' : '#44445a' }} />
                  </button>
                )
              })}
              {/* Align */}
              {[AlignLeft, AlignCenter, AlignRight].map((Icon, i) => {
                const vals = ['left', 'center', 'right'] as const
                const isActive = (layer.style.textAlign ?? 'left') === vals[i]
                return (
                  <button key={i}
                    onClick={() => styleChange({ textAlign: vals[i] })}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      background: isActive ? 'rgba(68,112,255,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isActive ? 'rgba(68,112,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    <Icon className="w-3 h-3" style={{ color: isActive ? '#4470ff' : '#44445a' }} />
                  </button>
                )
              })}
            </div>
          </div>

          {layer.type === 'ctaButton' && (
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#33334a' }}>Buton Rengi</p>
              <div className="flex items-center gap-2">
                <input type="color" value={layer.style.fill ?? '#4470ff'}
                  onChange={e => styleChange({ fill: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px' }} />
                <input type="range" min={0} max={32} value={layer.style.borderRadius ?? 8}
                  onChange={e => styleChange({ borderRadius: Number(e.target.value) })}
                  className="flex-1 accent-blue-500 h-1 rounded"
                  title="Köşe Yuvarlaklığı" />
                <span className="text-[10px] w-6" style={{ color: '#666680' }}>{layer.style.borderRadius ?? 8}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Image-specific */}
      {isImage && (
        <div className="space-y-2">
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#33334a' }}>Görsel</p>
          <input ref={imageFileRef} type="file" accept="image/*" className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = ev => onChange(layer.id, { src: ev.target?.result as string })
              reader.readAsDataURL(file)
            }} />
          {layer.src ? (
            <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <img src={layer.src} alt="preview" className="w-full h-24 object-contain" style={{ background: 'rgba(255,255,255,0.03)' }} />
              <button
                onClick={() => onChange(layer.id, { src: undefined })}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.7)' }}>
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ) : (
            <button onClick={() => imageFileRef.current?.click()}
              className="w-full rounded-xl border border-dashed p-4 text-center transition-all"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(68,112,255,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}>
              <Upload className="w-5 h-5 mx-auto mb-1.5" style={{ color: '#44445a' }} />
              <p className="text-[10px]" style={{ color: '#44445a' }}>Görsel yükle</p>
            </button>
          )}
          <input type="text"
            value={typeof layer.src === 'string' && !layer.src.startsWith('data:') ? layer.src : ''}
            onChange={e => onChange(layer.id, { src: e.target.value })}
            placeholder="veya URL yapıştır..."
            className="w-full px-2.5 py-2 rounded-lg text-[11px] outline-none"
            style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', color: '#eeeef4' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(68,112,255,0.4)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')} />
        </div>
      )}
    </div>
  )
}

/* ─── Canvas Layer Renderer ─── */
function CanvasLayer({ layer, isSelected, scale, onClick, onMouseDown }: {
  layer: Layer
  isSelected: boolean
  scale: number
  onClick: () => void
  onMouseDown?: (e: React.MouseEvent) => void
}) {
  if (!layer.visible) return null

  const s = layer.style
  const opacity = s.opacity ?? 1
  const baseCursor = layer.locked ? 'not-allowed' : 'grab'
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: layer.x * scale,
    top: layer.y * scale,
    width: layer.width * scale,
    height: layer.height * scale,
    transform: `rotate(${layer.rotation}deg)`,
    opacity,
    cursor: baseCursor,
    boxSizing: 'border-box',
  }

  const md = (!layer.locked && onMouseDown) ? (e: React.MouseEvent) => { e.stopPropagation(); onMouseDown(e) } : undefined

  if (layer.type === 'background') {
    return (
      <div style={{ ...baseStyle, background: buildGradient(s, layer.width, layer.height), cursor: 'default' }} onClick={onClick} />
    )
  }

  if (layer.type === 'shape') {
    const isCircle = layer.width === layer.height
    return (
      <div onClick={onClick} onMouseDown={md} style={{
        ...baseStyle,
        background: s.fill ?? 'transparent',
        border: s.stroke ? `${(s.strokeWidth ?? 1) * scale}px solid ${s.stroke}` : undefined,
        borderRadius: isCircle ? '50%' : `${(s.borderRadius ?? 0) * scale}px`,
        outline: isSelected ? `2px solid rgba(68,112,255,0.8)` : undefined,
        outlineOffset: '2px',
      }} />
    )
  }

  if (layer.type === 'productImage') {
    return (
      <div onClick={onClick} onMouseDown={md} style={{
        ...baseStyle,
        background: layer.src ? 'transparent' : 'rgba(255,255,255,0.04)',
        border: layer.src ? undefined : '1.5px dashed rgba(255,255,255,0.12)',
        borderRadius: 8 * scale,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        outline: isSelected ? `2px solid rgba(68,112,255,0.8)` : undefined,
        outlineOffset: '2px',
      }}>
        {layer.src
          ? <img src={layer.src} alt="product" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />
          : (
            <div className="text-center">
              <ImageIcon style={{ width: 24 * scale, height: 24 * scale, color: 'rgba(255,255,255,0.2)', display: 'block', margin: 'auto' }} />
              <p style={{ fontSize: 10 * scale, color: 'rgba(255,255,255,0.2)', marginTop: 4 * scale }}>Ürün Görseli</p>
            </div>
          )}
      </div>
    )
  }

  if (layer.type === 'ctaButton') {
    return (
      <div onClick={onClick} onMouseDown={md} style={{
        ...baseStyle,
        background: s.fill ?? '#4470ff',
        borderRadius: (s.borderRadius ?? 22) * scale,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        outline: isSelected ? `2px solid rgba(68,112,255,0.8)` : undefined,
        outlineOffset: '2px',
      }}>
        <span style={{
          color: s.color ?? '#ffffff',
          fontSize: (s.fontSize ?? 13) * scale,
          fontWeight: s.fontWeight ?? '700',
          fontFamily: s.fontFamily ?? 'Inter',
          letterSpacing: (s.letterSpacing ?? 0) * scale,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>{layer.content ?? 'CTA'}</span>
      </div>
    )
  }

  if (layer.type === 'badge') {
    return (
      <div onClick={onClick} onMouseDown={md} style={{
        ...baseStyle,
        background: s.fill ?? 'rgba(68,112,255,0.15)',
        borderRadius: (s.borderRadius ?? 20) * scale,
        border: s.stroke ? `${(s.strokeWidth ?? 1) * scale}px solid ${s.stroke}` : undefined,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingLeft: (s.paddingX ?? 12) * scale,
        paddingRight: (s.paddingX ?? 12) * scale,
        outline: isSelected ? `2px solid rgba(68,112,255,0.8)` : undefined,
        outlineOffset: '2px',
      }}>
        <span style={{
          color: s.color ?? '#4470ff',
          fontSize: (s.fontSize ?? 11) * scale,
          fontWeight: s.fontWeight ?? '700',
          letterSpacing: (s.letterSpacing ?? 1) * scale,
          textTransform: s.uppercase ? 'uppercase' : 'none',
          fontFamily: s.fontFamily ?? 'Inter',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>{layer.content ?? 'Rozet'}</span>
      </div>
    )
  }

  // Text layers: headline, subheadline, price
  return (
    <div onClick={onClick} onMouseDown={md} style={{
      ...baseStyle,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'flex-end' : 'flex-start',
      outline: isSelected ? `2px solid rgba(68,112,255,0.8)` : undefined,
      outlineOffset: '2px',
      overflow: 'hidden',
    }}>
      <span style={{
        color: s.color ?? '#eeeef4',
        fontSize: (s.fontSize ?? 16) * scale,
        fontWeight: s.fontWeight ?? '700',
        fontStyle: s.italic ? 'italic' : 'normal',
        lineHeight: s.lineHeight ?? 1.3,
        letterSpacing: (s.letterSpacing ?? 0) * scale,
        fontFamily: s.fontFamily ?? 'Inter',
        textAlign: s.textAlign ?? 'left',
        whiteSpace: 'pre-wrap',
        textShadow: s.shadow ? `0 2px ${s.shadowBlur ?? 8}px ${s.shadowColor ?? 'rgba(0,0,0,0.4)'}` : undefined,
        pointerEvents: 'none',
      }}>{layer.content ?? ''}</span>
    </div>
  )
}

/* ─── Canvas PNG Export ─── */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const cr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + cr, y)
  ctx.lineTo(x + w - cr, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + cr)
  ctx.lineTo(x + w, y + h - cr)
  ctx.quadraticCurveTo(x + w, y + h, x + w - cr, y + h)
  ctx.lineTo(x + cr, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - cr)
  ctx.lineTo(x, y + cr)
  ctx.quadraticCurveTo(x, y, x + cr, y)
  ctx.closePath()
}

async function downloadAsPNG(template: Template, layers: Layer[]) {
  const canvas = document.createElement('canvas')
  canvas.width = template.canvasWidth
  canvas.height = template.canvasHeight
  const ctx = canvas.getContext('2d')!
  const sorted = [...layers].filter(l => l.visible).sort((a, b) => a.zIndex - b.zIndex)

  for (const layer of sorted) {
    ctx.save()
    ctx.globalAlpha = layer.style.opacity ?? 1
    if (layer.rotation) {
      const cx = layer.x + layer.width / 2, cy = layer.y + layer.height / 2
      ctx.translate(cx, cy)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.translate(-cx, -cy)
    }

    const s = layer.style
    if (layer.type === 'background') {
      if (s.gradientFrom && s.gradientTo) {
        const angle = ((s.gradientAngle ?? 135) * Math.PI) / 180
        const len = Math.sqrt((template.canvasWidth / 2) ** 2 + (template.canvasHeight / 2) ** 2)
        const cx = template.canvasWidth / 2, cy = template.canvasHeight / 2
        const grad = ctx.createLinearGradient(cx - Math.cos(angle) * len, cy - Math.sin(angle) * len, cx + Math.cos(angle) * len, cy + Math.sin(angle) * len)
        grad.addColorStop(0, s.gradientFrom)
        grad.addColorStop(1, s.gradientTo)
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = s.fill ?? '#000000'
      }
      ctx.fillRect(0, 0, template.canvasWidth, template.canvasHeight)
    } else if (layer.type === 'shape') {
      ctx.fillStyle = s.fill ?? 'transparent'
      if (layer.width === layer.height && !s.borderRadius) {
        ctx.beginPath()
        ctx.ellipse(layer.x + layer.width / 2, layer.y + layer.height / 2, layer.width / 2, layer.height / 2, 0, 0, Math.PI * 2)
        ctx.fill()
      } else {
        roundRect(ctx, layer.x, layer.y, layer.width, layer.height, s.borderRadius ?? 0)
        ctx.fill()
      }
      if (s.stroke) { ctx.strokeStyle = s.stroke; ctx.lineWidth = s.strokeWidth ?? 1; ctx.stroke() }
    } else if (layer.type === 'productImage' && layer.src) {
      await new Promise<void>(resolve => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const scale = Math.min(layer.width / img.width, layer.height / img.height)
          const dw = img.width * scale, dh = img.height * scale
          ctx.drawImage(img, layer.x + (layer.width - dw) / 2, layer.y + (layer.height - dh) / 2, dw, dh)
          resolve()
        }
        img.onerror = () => resolve()
        img.src = layer.src!
      })
    } else if (layer.type === 'ctaButton' || layer.type === 'badge') {
      ctx.fillStyle = s.fill ?? (layer.type === 'ctaButton' ? '#4470ff' : 'rgba(68,112,255,0.15)')
      roundRect(ctx, layer.x, layer.y, layer.width, layer.height, s.borderRadius ?? (layer.type === 'ctaButton' ? 22 : 20))
      ctx.fill()
      if (s.stroke) { ctx.strokeStyle = s.stroke; ctx.lineWidth = s.strokeWidth ?? 1; ctx.stroke() }
      if (layer.content) {
        ctx.fillStyle = s.color ?? '#ffffff'
        ctx.font = `${s.italic ? 'italic ' : ''}${s.fontWeight ?? '700'} ${s.fontSize ?? 13}px ${s.fontFamily ?? 'Inter'}`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(layer.content, layer.x + layer.width / 2, layer.y + layer.height / 2, layer.width - 8)
      }
    } else if (['headline', 'subheadline', 'price'].includes(layer.type) && layer.content) {
      ctx.fillStyle = s.color ?? '#eeeef4'
      ctx.font = `${s.italic ? 'italic ' : ''}${s.fontWeight ?? '700'} ${s.fontSize ?? 16}px ${s.fontFamily ?? 'Inter'}`
      ctx.textAlign = s.textAlign ?? 'left'; ctx.textBaseline = 'top'
      if (s.shadow) { ctx.shadowColor = s.shadowColor ?? 'rgba(0,0,0,0.4)'; ctx.shadowBlur = s.shadowBlur ?? 8; ctx.shadowOffsetY = 2 }
      const lines = layer.content.split('\n')
      const lh = (s.lineHeight ?? 1.3) * (s.fontSize ?? 16)
      let tx = layer.x
      if (s.textAlign === 'center') tx = layer.x + layer.width / 2
      if (s.textAlign === 'right') tx = layer.x + layer.width
      lines.forEach((line, i) => ctx.fillText(line, tx, layer.y + i * lh, layer.width))
    }
    ctx.restore()
  }

  const link = document.createElement('a')
  link.download = `${template.name.replace(/\s+/g, '-').toLowerCase()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

/* ─── Email HTML Generator ─── */
function generateEmailHTML(template: Template, layers: Layer[]): string {
  const { canvasWidth, canvasHeight } = template
  const sorted = [...layers].filter(l => l.visible).sort((a, b) => a.zIndex - b.zIndex)
  const bg = sorted.find(l => l.type === 'background')

  let bgCss = ''
  if (bg) {
    const s = bg.style
    bgCss = s.gradientFrom && s.gradientTo
      ? `background:linear-gradient(${s.gradientAngle ?? 135}deg,${s.gradientFrom},${s.gradientTo});`
      : `background:${s.fill ?? '#000000'};`
  }

  const layerHtml = sorted.filter(l => l.type !== 'background').map(layer => {
    const s = layer.style
    const rot = layer.rotation ? `transform:rotate(${layer.rotation}deg);` : ''
    const opa = (s.opacity ?? 1) < 1 ? `opacity:${s.opacity};` : ''
    const base = `position:absolute;left:${layer.x}px;top:${layer.y}px;width:${layer.width}px;height:${layer.height}px;${rot}${opa}box-sizing:border-box;`

    if (layer.type === 'productImage')
      return layer.src ? `<img src="${layer.src}" alt="" style="${base}object-fit:contain;" />` : ''

    if (layer.type === 'shape') {
      const isCircle = layer.width === layer.height && !s.borderRadius
      const border = s.stroke ? `border:${s.strokeWidth ?? 1}px solid ${s.stroke};` : ''
      const radius = isCircle ? 'border-radius:50%;' : s.borderRadius ? `border-radius:${s.borderRadius}px;` : ''
      return `<div style="${base}background:${s.fill ?? 'transparent'};${border}${radius}"></div>`
    }

    if (layer.type === 'ctaButton' || layer.type === 'badge') {
      const bg2 = s.fill ?? (layer.type === 'ctaButton' ? '#4470ff' : 'rgba(68,112,255,0.15)')
      const radius = `border-radius:${s.borderRadius ?? (layer.type === 'ctaButton' ? 22 : 20)}px;`
      const border = s.stroke ? `border:${s.strokeWidth ?? 1}px solid ${s.stroke};` : ''
      const pad = layer.type === 'badge' ? `padding:0 ${s.paddingX ?? 12}px;` : ''
      const txt = `color:${s.color ?? '#fff'};font-size:${s.fontSize ?? 13}px;font-weight:${s.fontWeight ?? '700'};font-family:Inter,Arial,sans-serif;letter-spacing:${(s.letterSpacing ?? 0)}px;text-transform:${s.uppercase ? 'uppercase' : 'none'};`
      return `<div style="${base}background:${bg2};${radius}${border}${pad}display:flex;align-items:center;justify-content:center;"><span style="${txt}">${layer.content ?? ''}</span></div>`
    }

    const shadow = s.shadow ? `text-shadow:0 2px ${s.shadowBlur ?? 8}px ${s.shadowColor ?? 'rgba(0,0,0,0.4)'};` : ''
    const txt = `color:${s.color ?? '#eeeef4'};font-size:${s.fontSize ?? 16}px;font-weight:${s.fontWeight ?? '700'};font-style:${s.italic ? 'italic' : 'normal'};line-height:${s.lineHeight ?? 1.3};letter-spacing:${s.letterSpacing ?? 0}px;font-family:Inter,Arial,sans-serif;text-align:${s.textAlign ?? 'left'};white-space:pre-wrap;${shadow}`
    return `<div style="${base}overflow:hidden;"><span style="${txt}">${layer.content ?? ''}</span></div>`
  }).join('\n')

  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${template.name}</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;"><tr><td align="center">
<div style="position:relative;width:${canvasWidth}px;height:${canvasHeight}px;${bgCss}overflow:hidden;border-radius:8px;">
${layerHtml}
</div>
</td></tr></table>
</body>
</html>`
}

/* ─── AI Command Panel ─── */
function AiCommandPanel({ layers, onActionsReceived, disabled }: {
  layers: Layer[]
  onActionsReceived: (actions: AiAction[]) => void
  disabled?: boolean
}) {
  const [command, setCommand] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastSummary, setLastSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const suggestions = [
    'Başlığı daha büyük ve kalın yap',
    'Arka planı daha koyu mor yap',
    'CTA butonunu yeşil yap',
    'Fiyatı vurgula, daha büyük yap',
  ]

  const handleSubmit = async (cmd: string) => {
    if (!cmd.trim() || loading) return
    setCommand(cmd)
    setLoading(true)
    setError(null)
    setLastSummary(null)

    try {
      const res = await fetch('/api/ai/editor-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, layers }),
      })
      const data = await res.json()
      if (data.actions?.length) {
        onActionsReceived(data.actions)
        setLastSummary(`${data.actions.length} aksiyon uygulandı`)
        setCommand('')
      } else {
        setError('Komut anlaşılamadı. Lütfen yeniden dene.')
      }
    } catch {
      setError('Bağlantı hatası. Lütfen yeniden dene.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'rgba(8,8,15,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
      {/* Suggestions */}
      <div className="flex items-center gap-2 px-4 pt-2.5 overflow-x-auto no-scrollbar">
        {suggestions.map(s => (
          <button key={s} onClick={() => handleSubmit(s)}
            disabled={loading || disabled}
            className="shrink-0 px-3 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#666680' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#a78bfa'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#666680'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(68,112,255,0.25), rgba(159,122,250,0.25))' }}>
          <Sparkles className="w-3.5 h-3.5" style={{ color: '#9f7afa' }} />
        </div>
        <input
          value={command}
          onChange={e => setCommand(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit(command)}
          placeholder='AI komut: "Ürün görselini sağa taşı, başlığı daha premium yap..."'
          disabled={loading || disabled}
          className="flex-1 text-[12px] outline-none bg-transparent"
          style={{ color: '#eeeef4', caretColor: '#9f7afa' }}
        />
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: '#9f7afa' }} />
          : (
            <button onClick={() => handleSubmit(command)} disabled={!command.trim() || disabled}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-semibold shrink-0 transition-all"
              style={{ background: command.trim() ? 'rgba(159,122,250,0.15)' : 'rgba(255,255,255,0.04)', color: command.trim() ? '#9f7afa' : '#44445a', border: `1px solid ${command.trim() ? 'rgba(159,122,250,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
              <Wand2 className="w-3 h-3" /> Uygula
            </button>
          )}
      </div>

      {/* Status */}
      {(lastSummary || error) && (
        <div className="px-4 pb-2">
          {lastSummary && (
            <p className="text-[10px] flex items-center gap-1" style={{ color: '#22c97a' }}>
              <Check className="w-3 h-3" /> {lastSummary}
            </p>
          )}
          {error && (
            <p className="text-[10px]" style={{ color: '#e84545' }}>{error}</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Export Modal ─── */
function ExportModal({ template, layers, onClose }: { template: Template; layers: Layer[]; onClose: () => void }) {
  const [tab, setTab] = useState<'png' | 'html' | 'email'>('png')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const html = generateEmailHTML(template, layers)

  const handlePNG = async () => {
    setDownloading(true)
    await downloadAsPNG(template, layers)
    setDownloading(false)
  }

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(html).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSend = async () => {
    if (!email) return
    setSending(true)
    try {
      const r = await fetch('/api/ai/banner-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), bannerHtml: html, storeName: template.name }),
      })
      if (r.ok) setSent(true)
    } catch { /* silent */ } finally { setSending(false) }
  }

  const handleSave = () => {
    setSaving(true)
    const id = `asset_${Date.now()}`
    const assets = JSON.parse(localStorage.getItem('marksio_ai_assets') ?? '[]') as unknown[]
    assets.unshift({
      id, html, bgImageUrl: null, productImage: null,
      config: { brandName: template.name, accentColor: '#4470ff' },
      content: { headline: layers.find(l => l.type === 'headline')?.content ?? template.name, ctaLabel: layers.find(l => l.type === 'ctaButton')?.content ?? '' },
      status: 'draft', createdAt: Date.now(), sceneName: template.category,
    })
    localStorage.setItem('marksio_ai_assets', JSON.stringify(assets.slice(0, 50)))
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-[480px] rounded-2xl overflow-hidden"
        style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[14px] font-bold" style={{ color: '#eeeef4' }}>Dışa Aktar & Kaydet</p>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: '#666680' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {([['png', 'PNG İndir', Download], ['html', 'Email HTML', Copy], ['email', 'Test Email', Send]] as [string, string, React.ElementType][]).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key as typeof tab)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold transition-all"
              style={tab === key
                ? { background: 'rgba(68,112,255,0.12)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.25)' }
                : { color: '#44445a', border: '1px solid transparent' }}>
              <Icon className="w-3 h-3" /> {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'png' && (
            <div className="space-y-4">
              <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[12px] mb-1" style={{ color: '#8080a0' }}>Boyut: {template.canvasWidth} × {template.canvasHeight}px</p>
                <p className="text-[11px]" style={{ color: '#44445a' }}>PNG formatında yüksek çözünürlüklü dışa aktar</p>
              </div>
              <button onClick={handlePNG} disabled={downloading}
                className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
                style={{ background: 'rgba(68,112,255,0.15)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.25)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(68,112,255,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(68,112,255,0.15)')}>
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloading ? 'İndiriliyor...' : `PNG İndir (${template.canvasWidth}×${template.canvasHeight})`}
              </button>
            </div>
          )}

          {tab === 'html' && (
            <div className="space-y-4">
              <div className="rounded-xl p-3 overflow-auto max-h-36"
                style={{ background: '#080810', border: '1px solid rgba(255,255,255,0.07)', fontFamily: 'JetBrains Mono, monospace' }}>
                <pre className="text-[9px] whitespace-pre-wrap break-all" style={{ color: '#666680', margin: 0 }}>{html.slice(0, 600)}…</pre>
              </div>
              <button onClick={handleCopyHTML}
                className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
                style={{ background: copied ? 'rgba(34,201,122,0.1)' : 'rgba(52,211,122,0.1)', color: copied ? '#22c97a' : '#22c97a', border: `1px solid ${copied ? 'rgba(34,201,122,0.3)' : 'rgba(52,211,122,0.2)'}` }}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Kopyalandı!' : 'HTML Kopyala'}
              </button>
            </div>
          )}

          {tab === 'email' && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold mb-2" style={{ color: '#8080a0' }}>Test email adresi</p>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  type="email"
                  className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(68,112,255,0.4)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')} />
              </div>
              <button onClick={handleSend} disabled={sending || sent}
                className="w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
                style={{ background: sent ? 'rgba(34,201,122,0.1)' : 'rgba(68,112,255,0.15)', color: sent ? '#22c97a' : '#99b4ff', border: `1px solid ${sent ? 'rgba(34,201,122,0.25)' : 'rgba(68,112,255,0.25)'}` }}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : sent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {sending ? 'Gönderiliyor...' : sent ? 'Gönderildi!' : 'Test Maili Gönder'}
              </button>
            </div>
          )}

          {/* Save */}
          <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={handleSave} disabled={saving || saved}
              className="w-full py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ background: saved ? 'rgba(159,122,250,0.08)' : 'rgba(255,255,255,0.04)', color: saved ? '#9f7afa' : '#666680', border: '1px solid rgba(255,255,255,0.08)' }}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi!' : 'Tasarımı Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Editor ─── */
export default function EditorPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'gallery' | 'editor'>('gallery')
  const [template, setTemplate] = useState<Template | null>(null)
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [leftTab, setLeftTab] = useState<'layers' | 'templates'>('layers')
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [showExport, setShowExport] = useState(false)
  const [history, setHistory] = useState<Layer[][]>([])
  const [redoStack, setRedoStack] = useState<Layer[][]>([])

  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [canvasScale, setCanvasScale] = useState(0.9)

  const dragRef = useRef<{
    layerId: string
    startX: number
    startY: number
    origX: number
    origY: number
    moved: boolean
  } | null>(null)
  const [isDraggingLayer, setIsDraggingLayer] = useState(false)

  const selectedLayer = layers.find(l => l.id === selectedId) ?? null
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex)

  /* ─ Scale calculation ─ */
  useEffect(() => {
    const calc = () => {
      if (!canvasContainerRef.current || !template) return
      const availW = canvasContainerRef.current.clientWidth - 48
      const availH = canvasContainerRef.current.clientHeight - 48
      const scaleW = availW / template.canvasWidth
      const scaleH = availH / template.canvasHeight
      setCanvasScale(Math.min(scaleW, scaleH, 1.2) * zoom)
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [template, zoom, showLeftPanel, showRightPanel])

  /* ─ Template select ─ */
  const selectTemplate = (t: Template) => {
    setTemplate(t)
    const layersCopy = t.layers.map(l => ({ ...l, style: { ...l.style } }))
    setLayers(layersCopy)
    setPhase('editor')
    setSelectedId(null)
  }

  /* ─ Layer mutations ─ */
  const pushHistory = useCallback((prev: Layer[]) => {
    setHistory(h => [...h.slice(-20), prev])
    setRedoStack([])
  }, [])

  const handleLayerMouseDown = useCallback((e: React.MouseEvent, layer: Layer) => {
    if (layer.locked) return
    dragRef.current = {
      layerId: layer.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: layer.x,
      origY: layer.y,
      moved: false,
    }
  }, [])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    if (Math.sqrt(dx * dx + dy * dy) < 3) return
    if (!dragRef.current.moved) {
      dragRef.current.moved = true
      setIsDraggingLayer(true)
      setLayers(prev => { pushHistory(prev); return prev })
    }
    const { layerId, origX, origY } = dragRef.current
    setLayers(prev => prev.map(l =>
      l.id === layerId
        ? { ...l, x: Math.round(origX + dx / canvasScale), y: Math.round(origY + dy / canvasScale) }
        : l
    ))
  }, [canvasScale, pushHistory])

  const handleCanvasMouseUp = useCallback(() => {
    dragRef.current = null
    setIsDraggingLayer(false)
  }, [])

  const createBlankCanvas = useCallback(() => {
    const blank: Template = {
      id: 'blank-' + Date.now(),
      name: 'Boş Kanvas',
      category: 'Özel',
      previewGradient: 'linear-gradient(135deg, #0f0f1a, #1a1a2e)',
      canvasWidth: 600,
      canvasHeight: 400,
      layers: [{
        id: 'bg', type: 'background', label: 'Arka Plan',
        x: 0, y: 0, width: 600, height: 400, rotation: 0, zIndex: 0,
        editable: true, locked: false, visible: true,
        style: { fill: '#0f0f1a' },
      }],
    }
    setTemplate(blank)
    setLayers(blank.layers.map(l => ({ ...l, style: { ...l.style } })))
    setPhase('editor')
    setSelectedId(null)
  }, [])

  const patchLayer = useCallback((id: string, patch: Partial<Layer>) => {
    setLayers(prev => {
      pushHistory(prev)
      return prev.map(l => l.id === id ? { ...l, ...patch, style: patch.style ? { ...l.style, ...patch.style } : l.style } : l)
    })
  }, [pushHistory])

  const toggleVisible = useCallback((id: string) => {
    setLayers(prev => { pushHistory(prev); return prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l) })
  }, [pushHistory])

  const toggleLock = useCallback((id: string) => {
    setLayers(prev => { pushHistory(prev); return prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l) })
  }, [pushHistory])

  const deleteLayer = useCallback((id: string) => {
    setLayers(prev => { pushHistory(prev); return prev.filter(l => l.id !== id) })
    setSelectedId(null)
  }, [pushHistory])

  const moveLayerUp = useCallback((id: string) => {
    setLayers(prev => {
      pushHistory(prev)
      const layer = prev.find(l => l.id === id)
      if (!layer) return prev
      const maxZ = Math.max(...prev.map(l => l.zIndex))
      if (layer.zIndex >= maxZ) return prev
      const nextZ = prev.filter(l => l.zIndex > layer.zIndex).reduce((a, b) => a.zIndex < b.zIndex ? a : b)
      return prev.map(l => {
        if (l.id === id) return { ...l, zIndex: nextZ.zIndex }
        if (l.id === nextZ.id) return { ...l, zIndex: layer.zIndex }
        return l
      })
    })
  }, [pushHistory])

  const moveLayerDown = useCallback((id: string) => {
    setLayers(prev => {
      pushHistory(prev)
      const layer = prev.find(l => l.id === id)
      if (!layer) return prev
      const minZ = Math.min(...prev.map(l => l.zIndex))
      if (layer.zIndex <= minZ) return prev
      const prevZLayer = prev.filter(l => l.zIndex < layer.zIndex).reduce((a, b) => a.zIndex > b.zIndex ? a : b)
      return prev.map(l => {
        if (l.id === id) return { ...l, zIndex: prevZLayer.zIndex }
        if (l.id === prevZLayer.id) return { ...l, zIndex: layer.zIndex }
        return l
      })
    })
  }, [pushHistory])

  const undo = () => {
    if (!history.length) return
    const prev = history[history.length - 1]
    setRedoStack(r => [...r, layers])
    setHistory(h => h.slice(0, -1))
    setLayers(prev)
  }

  const redo = () => {
    if (!redoStack.length) return
    const next = redoStack[redoStack.length - 1]
    setHistory(h => [...h, layers])
    setRedoStack(r => r.slice(0, -1))
    setLayers(next)
  }

  /* ─ AI action executor ─ */
  const executeAiActions = useCallback((actions: AiAction[]) => {
    setLayers(prev => {
      pushHistory(prev)
      let next = [...prev]
      for (const action of actions) {
        if (action.type === 'updateText') {
          next = next.map(l => l.id === action.layerId ? { ...l, content: action.content } : l)
        } else if (action.type === 'updateStyle') {
          next = next.map(l => l.id === action.layerId ? { ...l, style: { ...l.style, ...action.style } } : l)
        } else if (action.type === 'moveLayer') {
          next = next.map(l => l.id === action.layerId ? { ...l, x: action.x, y: action.y } : l)
        } else if (action.type === 'suggestPalette') {
          // Apply a warm palette as demo
          next = next.map(l => {
            if (l.type === 'ctaButton') return { ...l, style: { ...l.style, fill: '#f59e0b' } }
            if (l.type === 'badge') return { ...l, style: { ...l.style, color: '#f59e0b' } }
            return l
          })
        }
      }
      return next
    })
  }, [pushHistory])

  if (phase === 'gallery') {
    return <TemplateGallery onSelect={selectTemplate} onBlank={createBlankCanvas} />
  }

  if (!template) return null

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#08080f' }}>
      {/* ─ Top bar ─ */}
      <header className="flex items-center gap-3 px-4 h-12 shrink-0"
        style={{ background: '#0a0a14', borderBottom: '1px solid rgba(255,255,255,0.07)', zIndex: 30 }}>
        {/* Back */}
        <button onClick={() => setPhase('gallery')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all shrink-0"
          style={{ color: '#666680', border: '1px solid rgba(255,255,255,0.07)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#eeeef4'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#666680'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
          <ChevronLeft className="w-3.5 h-3.5" /> Şablonlar
        </button>

        <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Template name */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(68,112,255,0.3), rgba(159,122,250,0.3))' }}>
            <Layers className="w-2.5 h-2.5" style={{ color: '#9f7afa' }} />
          </div>
          <p className="text-[12px] font-semibold" style={{ color: '#eeeef4' }}>{template.name}</p>
        </div>

        <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={!history.length} title="Geri Al (Ctrl+Z)"
            className="p-1.5 rounded-lg text-[11px] transition-all disabled:opacity-30"
            style={{ color: '#666680', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#eeeef4')}
            onMouseLeave={e => (e.currentTarget.style.color = '#666680')}>
            <RefreshCw className="w-3 h-3" style={{ transform: 'scaleX(-1)' }} />
          </button>
          <button onClick={redo} disabled={!redoStack.length} title="Yeniden Yap"
            className="p-1.5 rounded-lg text-[11px] transition-all disabled:opacity-30"
            style={{ color: '#666680', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#eeeef4')}
            onMouseLeave={e => (e.currentTarget.style.color = '#666680')}>
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zoom */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
            className="p-1.5 rounded-lg transition-all" style={{ color: '#666680', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#eeeef4')}
            onMouseLeave={e => (e.currentTarget.style.color = '#666680')}>
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[10px] w-9 text-center" style={{ color: '#666680', fontFamily: 'JetBrains Mono, monospace' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))}
            className="p-1.5 rounded-lg transition-all" style={{ color: '#666680', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#eeeef4')}
            onMouseLeave={e => (e.currentTarget.style.color = '#666680')}>
            <ZoomIn className="w-3 h-3" />
          </button>
          <button onClick={() => setZoom(1)} title="Sığdır"
            className="p-1.5 rounded-lg transition-all" style={{ color: '#666680', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#eeeef4')}
            onMouseLeave={e => (e.currentTarget.style.color = '#666680')}>
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>

        <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Panel toggles */}
        <div className="flex items-center gap-1">
          <button onClick={() => setShowLeftPanel(v => !v)} title="Sol Panel"
            className="p-1.5 rounded-lg transition-all"
            style={{ color: showLeftPanel ? '#4470ff' : '#44445a', border: `1px solid ${showLeftPanel ? 'rgba(68,112,255,0.3)' : 'rgba(255,255,255,0.07)'}`, background: showLeftPanel ? 'rgba(68,112,255,0.1)' : 'transparent' }}>
            <PanelLeft className="w-3 h-3" />
          </button>
          <button onClick={() => setShowRightPanel(v => !v)} title="Sağ Panel"
            className="p-1.5 rounded-lg transition-all"
            style={{ color: showRightPanel ? '#4470ff' : '#44445a', border: `1px solid ${showRightPanel ? 'rgba(68,112,255,0.3)' : 'rgba(255,255,255,0.07)'}`, background: showRightPanel ? 'rgba(68,112,255,0.1)' : 'transparent' }}>
            <PanelRight className="w-3 h-3" />
          </button>
        </div>

        <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#666680', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#eeeef4' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#666680' }}>
            <Monitor className="w-3 h-3" /> Önizle
          </button>
          <button onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all"
            style={{ background: 'rgba(68,112,255,0.15)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.3)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(68,112,255,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(68,112,255,0.15)')}>
            <Download className="w-3 h-3" /> Dışa Aktar
          </button>
        </div>
      </header>

      {/* ─ Body ─ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        {showLeftPanel && (
          <aside className="w-[240px] shrink-0 flex flex-col overflow-hidden"
            style={{ background: '#0a0a14', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Tab bar */}
            <div className="flex gap-1 p-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {([['layers', 'Katmanlar', Layers], ['templates', 'Şablonlar', ImageIcon]] as [string, string, React.ElementType][]).map(([key, label, Icon]) => (
                <button key={key} onClick={() => setLeftTab(key as typeof leftTab)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                  style={leftTab === key
                    ? { background: 'rgba(68,112,255,0.12)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.2)' }
                    : { color: '#44445a', border: '1px solid transparent' }}>
                  <Icon className="w-3 h-3" /> {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-2">
              {leftTab === 'layers' ? (
                <div className="space-y-0.5">
                  {sortedLayers.map(layer => (
                    <LayerRow key={layer.id} layer={layer}
                      isSelected={selectedId === layer.id}
                      onSelect={() => setSelectedId(layer.id)}
                      onToggleVisible={() => toggleVisible(layer.id)}
                      onToggleLock={() => toggleLock(layer.id)}
                      onDelete={() => deleteLayer(layer.id)}
                      onMoveUp={() => moveLayerUp(layer.id)}
                      onMoveDown={() => moveLayerDown(layer.id)}
                    />
                  ))}

                  {/* Add text layer */}
                  <button
                    onClick={() => {
                      const newLayer: Layer = {
                        id: uid(), type: 'headline', label: 'Yeni Metin', x: 20, y: 20,
                        width: 200, height: 40, rotation: 0, zIndex: layers.length + 1,
                        editable: true, locked: false, visible: true, content: 'Yeni Metin',
                        style: { color: '#eeeef4', fontSize: 18, fontWeight: '600' },
                      }
                      pushHistory(layers)
                      setLayers(prev => [...prev, newLayer])
                      setSelectedId(newLayer.id)
                    }}
                    className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-semibold mt-2 transition-all"
                    style={{ color: '#44445a', border: '1px dashed rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#4470ff'; e.currentTarget.style.borderColor = 'rgba(68,112,255,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#44445a'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                    <Plus className="w-3 h-3" /> Metin Ekle
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => selectTemplate(t)}
                      className="w-full rounded-xl overflow-hidden text-left transition-all"
                      style={{ border: t.id === template.id ? '1.5px solid rgba(68,112,255,0.5)' : '1.5px solid rgba(255,255,255,0.06)' }}
                      onMouseEnter={e => { if (t.id !== template.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                      onMouseLeave={e => { if (t.id !== template.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}>
                      <div className="h-16" style={{ background: t.previewGradient }} />
                      <div className="px-2.5 py-1.5" style={{ background: '#0f0f1a' }}>
                        <p className="text-[10px] font-semibold" style={{ color: '#8080a0' }}>{t.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center canvas */}
        <main ref={canvasContainerRef} className="flex-1 overflow-hidden flex flex-col items-center justify-center relative"
          style={{ background: '#050508', cursor: isDraggingLayer ? 'grabbing' : 'default', userSelect: 'none' }}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {/* Grid dots */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          {/* Canvas */}
          <div className="relative" style={{
            width: template.canvasWidth * canvasScale,
            height: template.canvasHeight * canvasScale,
            boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            {/* Click outside deselect */}
            <div className="absolute inset-0" onClick={() => setSelectedId(null)} />

            {/* Render layers */}
            {[...layers].sort((a, b) => a.zIndex - b.zIndex).map(layer => (
              <CanvasLayer key={layer.id} layer={layer}
                isSelected={selectedId === layer.id}
                scale={canvasScale}
                onClick={() => { if (!layer.locked) setSelectedId(layer.id) }}
                onMouseDown={(e) => handleLayerMouseDown(e, layer)}
              />
            ))}

            {/* Canvas size label */}
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[9px]"
              style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono, monospace', pointerEvents: 'none' }}>
              {template.canvasWidth}×{template.canvasHeight}
            </div>
          </div>
        </main>

        {/* Right panel */}
        {showRightPanel && (
          <aside className="w-[240px] shrink-0 overflow-y-auto no-scrollbar"
            style={{ background: '#0a0a14', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Sliders className="w-3.5 h-3.5" style={{ color: '#44445a' }} />
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#44445a' }}>
                {selectedLayer ? selectedLayer.label : 'Özellikler'}
              </p>
            </div>
            <PropertiesPanel layer={selectedLayer} onChange={patchLayer} />
          </aside>
        )}
      </div>

      {/* ─ AI Command Bar ─ */}
      <AiCommandPanel layers={layers} onActionsReceived={executeAiActions} />

      {/* ─ Export Modal ─ */}
      {showExport && template && (
        <ExportModal template={template} layers={layers} onClose={() => setShowExport(false)} />
      )}
    </div>
  )
}
