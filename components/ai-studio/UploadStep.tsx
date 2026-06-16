'use client'

import { useState, useRef, useCallback, DragEvent } from 'react'
import { Upload, Link2, BookImage, Plus, ImageIcon } from 'lucide-react'
import { validateFile, validateImageUrl } from './FormatValidator'

type UploadTab = 'file' | 'url' | 'library' | 'blank'

interface Props {
  onFile: (file: File) => void
}

export function UploadStep({ onFile }: Props) {
  const [tab,       setTab]       = useState<UploadTab>('file')
  const [url,       setUrl]       = useState('')
  const [fileError, setFileError] = useState('')
  const [urlError,  setUrlError]  = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [dragging,  setDragging]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const err = validateFile(file)
    if (err) { setFileError(err); return }
    setFileError('')
    onFile(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const loadUrl = useCallback(async () => {
    const trimmed = url.trim()
    if (!trimmed) { setUrlError("Geçerli bir görsel URL'si girin."); return }
    const err = validateImageUrl(trimmed)
    if (err) { setUrlError(err); return }

    setUrlError('')
    setUrlLoading(true)
    try {
      const res = await fetch(trimmed)
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      if (!blob.type.startsWith('image/')) throw new Error('not image')
      const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' })
      const validateErr = validateFile(file)
      if (validateErr) { setUrlError(validateErr); return }
      onFile(file)
    } catch {
      setUrlError("Bu URL'den görsel alınamadı. Dosyayı bilgisayarınızdan yükleyin.")
    } finally {
      setUrlLoading(false)
    }
  }, [url, onFile])

  function createBlank() {
    const canvas = document.createElement('canvas')
    canvas.width = 1200; canvas.height = 675
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 1200, 675)
    canvas.toBlob(blob => {
      if (blob) onFile(new File([blob], 'blank.png', { type: 'image/png' }))
    })
  }

  const tabs: { key: UploadTab; icon: React.ElementType; label: string }[] = [
    { key: 'file',    icon: Upload,     label: 'Dosya Yükle' },
    { key: 'url',     icon: Link2,      label: 'URL Yapıştır' },
    { key: 'library', icon: BookImage,  label: 'Marka Kütüphanesi' },
    { key: 'blank',   icon: Plus,       label: 'Boş Başla' },
  ]

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-10 max-w-2xl mx-auto w-full">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)', boxShadow: '0 8px 32px rgba(108,71,255,0.35)' }}>
        <ImageIcon className="w-7 h-7 text-white" />
      </div>

      <h2 className="text-xl font-bold mb-1.5" style={{ color: '#eeeef4' }}>Görsel Yükle</h2>
      <p className="text-[13px] mb-8 text-center" style={{ color: '#8080a0' }}>
        Ürün görselinizi yükleyin, AI analiz edip banner oluştursun
      </p>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-2xl mb-6 w-full"
        style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)' }}>
        {tabs.map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => { setTab(key); setFileError(''); setUrlError('') }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[11px] font-semibold transition-all"
            style={{
              background: tab === key ? 'rgba(108,71,255,0.2)' : 'transparent',
              color: tab === key ? '#a78bfa' : '#6b7280',
              border: tab === key ? '1px solid rgba(108,71,255,0.3)' : '1px solid transparent',
            }}>
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* File tab */}
      {tab === 'file' && (
        <div className="w-full">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onInputChange} />
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all"
            style={{
              height: 240,
              border: `2px dashed ${dragging ? '#6c47ff' : '#2d2d3e'}`,
              background: dragging ? 'rgba(108,71,255,0.06)' : '#0f0f1a',
            }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: dragging ? 'rgba(108,71,255,0.2)' : 'rgba(255,255,255,0.05)' }}>
              <Upload className="w-6 h-6" style={{ color: dragging ? '#a78bfa' : '#6b7280' }} />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>Sürükle & bırak veya tıkla</p>
              <p className="text-[11px] mt-1" style={{ color: '#6b7280' }}>JPG, PNG veya WebP — maks 10 MB</p>
            </div>
          </div>
          {fileError && <p className="text-[12px] mt-2 text-center" style={{ color: '#e84545' }}>{fileError}</p>}
        </div>
      )}

      {/* URL tab */}
      {tab === 'url' && (
        <div className="w-full space-y-3">
          <div className="flex gap-2">
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadUrl()}
              placeholder="https://cdn.ornekmagaza.com/urun.jpg"
              className="flex-1 px-4 py-3 rounded-xl text-[13px] outline-none"
              style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4' }}
            />
            <button
              onClick={loadUrl}
              disabled={urlLoading}
              className="px-4 py-3 rounded-xl text-[13px] font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)', color: '#fff', opacity: urlLoading ? 0.5 : 1 }}>
              {urlLoading ? 'Yükleniyor...' : 'Yükle'}
            </button>
          </div>
          {urlError && <p className="text-[12px]" style={{ color: '#e84545' }}>{urlError}</p>}
        </div>
      )}

      {/* Library tab */}
      {tab === 'library' && (
        <BrandLibraryPicker onFile={onFile} />
      )}

      {/* Blank tab */}
      {tab === 'blank' && (
        <div className="w-full">
          <div
            className="w-full rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all"
            style={{ height: 240, border: '2px dashed #2d2d3e', background: '#0f0f1a' }}
            onClick={createBlank}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Plus className="w-6 h-6" style={{ color: '#6b7280' }} />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>Boş kanvas oluştur</p>
              <p className="text-[11px] mt-1" style={{ color: '#6b7280' }}>1200 × 675 px beyaz zemin</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface LibraryAsset { id: string; url: string; name: string; createdAt: number }

function BrandLibraryPicker({ onFile }: { onFile: (f: File) => void }) {
  const [assets] = useState<LibraryAsset[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('marksio_brand_library') ?? '[]') as LibraryAsset[]
    } catch { return [] }
  })

  if (assets.length === 0) {
    return (
      <div className="w-full rounded-2xl flex flex-col items-center justify-center gap-3 py-16"
        style={{ border: '2px dashed #2d2d3e', background: '#0f0f1a' }}>
        <BookImage className="w-8 h-8" style={{ color: '#3e3e54' }} />
        <p className="text-[12px] text-center" style={{ color: '#6b7280' }}>
          Marka kütüphanesi boş.<br />Düzenleme adımında görsel ekleyebilirsiniz.
        </p>
      </div>
    )
  }

  async function pick(asset: LibraryAsset) {
    try {
      const res = await fetch(asset.url)
      const blob = await res.blob()
      onFile(new File([blob], `${asset.name}.jpg`, { type: blob.type || 'image/jpeg' }))
    } catch { /* ignore */ }
  }

  return (
    <div className="w-full grid grid-cols-3 gap-3">
      {assets.map(a => (
        <button key={a.id} onClick={() => pick(a)}
          className="aspect-square rounded-xl overflow-hidden relative transition-all group"
          style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-end p-1.5 opacity-0 group-hover:opacity-100 transition-all"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
            <span className="text-[10px] text-white font-semibold truncate">{a.name}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
