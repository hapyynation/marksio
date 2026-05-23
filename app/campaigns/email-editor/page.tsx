'use client'

import { useState, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft, Save, Check, Loader2, Smartphone, Monitor,
  Sparkles, Image as ImageIcon, Package, Wand2, Plus,
  Trash2, RefreshCw, X, Palette, ChevronDown, LayoutTemplate,
  Download, ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AiPromptInput, FileWithPreview } from '@/components/ui/claude-style-ai-input'

// ── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  price: string
  image: string
  url?: string
}

type LeftTab = 'prompt' | 'template' | 'image' | 'products'
type Device = 'desktop' | 'mobile'

const ACCENT_PRESETS = [
  { label: 'Turuncu', value: '#ea5c1e' },
  { label: 'Mavi', value: '#2563eb' },
  { label: 'Yeşil', value: '#059669' },
  { label: 'Siyah', value: '#1a1a1a' },
  { label: 'Mor', value: '#7c3aed' },
  { label: 'Kırmızı', value: '#dc2626' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Pembe', value: '#db2777' },
]

const TEMPLATE_STYLES = [
  { id: 'promo', label: 'İndirim', desc: 'Sepette % indirim kampanyası', accent: '#ea5c1e', badge: 'SIZE ÖZEL FIRSAT!' },
  { id: 'welcome', label: 'Hoş Geldin', desc: 'Yeni müşteri karşılama maili', accent: '#059669', badge: 'HOŞ GELDİNİZ!' },
  { id: 'winback', label: 'Geri Kazan', desc: 'Kaybedilen müşteri kampanyası', accent: '#d97706', badge: 'SİZİ ÖZLEDİK!' },
  { id: 'vip', label: 'VIP Özel', desc: 'Premium müşteri teklifi', accent: '#1a1a1a', badge: 'VIP ÜYELERİMİZE ÖZEL' },
  { id: 'launch', label: 'Yeni Ürün', desc: 'Ürün lansmanı maili', accent: '#7c3aed', badge: 'YENİ KOLEKSİYON' },
]

// ── Main Component ────────────────────────────────────────────────────────────

function EmailBuilderContent() {
  const searchParams = useSearchParams()

  // Core state
  const [leftTab, setLeftTab] = useState<LeftTab>('prompt')
  const [device, setDevice] = useState<Device>('desktop')
  const [campaignName, setCampaignName] = useState(searchParams.get('name') ?? 'Yeni Kampanya')
  const [storeName, setStoreName] = useState('')
  const [accentColor, setAccentColor] = useState('#ea5c1e')
  const [selectedTemplate, setSelectedTemplate] = useState('promo')

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null)
  const [generatedSubject, setGeneratedSubject] = useState('')
  const [lastPrompt, setLastPrompt] = useState('')

  // Hero image
  const [heroImage, setHeroImage] = useState<string | null>(null)
  const [imagePrompt, setImagePrompt] = useState('')

  // Products
  const [products, setProducts] = useState<Product[]>([])
  const [newProduct, setNewProduct] = useState<Partial<Product>>({})

  // Save
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const heroFileRef = useRef<HTMLInputElement>(null)

  // ── Generate email ─────────────────────────────────────────────────────────

  async function handleGenerate(prompt: string, files: FileWithPreview[]) {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setLastPrompt(prompt)

    // Upload image files as hero if provided
    let heroUrl = heroImage
    const imageFile = files.find(f => f.type.startsWith('image/'))
    if (imageFile?.preview) heroUrl = imageFile.preview

    try {
      const tpl = TEMPLATE_STYLES.find(t => t.id === selectedTemplate)

      const res = await fetch('/api/ai/email-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${prompt}. Şablon stili: ${tpl?.label}`,
          storeName: storeName || 'Mağazam',
          accentColor: tpl?.accent ?? accentColor,
          heroImage: heroUrl,
          products: products.map(p => ({ name: p.name, price: p.price, image: p.image, url: p.url })),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setGeneratedHtml(data.html)
      setGeneratedSubject(data.subject ?? '')
      if (data.content?.accentColor) setAccentColor(data.content.accentColor)
    } catch (err) {
      console.error('[generate]', err)
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Regenerate with same prompt ────────────────────────────────────────────

  async function handleRegenerate() {
    if (!lastPrompt) return
    await handleGenerate(lastPrompt, [])
  }

  // ── Generate hero image via FAL.ai ────────────────────────────────────────

  async function handleGenerateImage() {
    if (!imagePrompt.trim()) return
    setIsGeneratingImage(true)
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt, width: 800, height: 700 }),
      })
      const data = await res.json()
      if (data.url) {
        setHeroImage(data.url)
        // If we have a generated html, regenerate with new image
        if (generatedHtml && lastPrompt) {
          setIsGenerating(true)
          const res2 = await fetch('/api/ai/email-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: lastPrompt,
              storeName: storeName || 'Mağazam',
              accentColor,
              heroImage: data.url,
              products: products.map(p => ({ name: p.name, price: p.price, image: p.image })),
            }),
          })
          const d2 = await res2.json()
          if (d2.html) setGeneratedHtml(d2.html)
          setIsGenerating(false)
        }
      }
    } catch (err) {
      console.error('[image-generate]', err)
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // ── Upload hero image ──────────────────────────────────────────────────────

  function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setHeroImage(url)
    e.target.value = ''
  }

  // ── Products ───────────────────────────────────────────────────────────────

  function addProduct() {
    if (!newProduct.name || !newProduct.price) return
    setProducts(prev => [...prev, {
      id: `${Date.now()}`,
      name: newProduct.name!,
      price: newProduct.price!,
      image: newProduct.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
      url: newProduct.url,
    }])
    setNewProduct({})
  }

  function removeProduct(id: string) {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!generatedHtml) return
    setSaving(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          type: 'email',
          status: 'draft',
          subject: generatedSubject || campaignName,
          body: generatedHtml,
          tips: '[]',
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">

      {/* ── Top bar ── */}
      <div className="h-13 shrink-0 flex items-center px-4 gap-3 border-b border-[#1e1e1e] bg-[#0a0a0a] z-20">
        <Link href="/campaigns" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-300 text-sm transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:block">Geri</span>
        </Link>

        <div className="w-px h-4 bg-[#2a2a2a]" />

        <input
          value={campaignName}
          onChange={e => setCampaignName(e.target.value)}
          className="bg-transparent text-sm text-white font-semibold focus:outline-none w-48 placeholder:text-gray-600"
          placeholder="Kampanya adı..."
        />

        <div className="flex-1" />

        {generatedHtml && (
          <div className="flex items-center gap-1 bg-[#111] border border-[#1e1e1e] rounded-lg p-0.5">
            <button
              onClick={() => setDevice('desktop')}
              className={cn('p-1.5 rounded-md transition-all', device === 'desktop' ? 'bg-[#2a2a2a] text-white' : 'text-gray-600 hover:text-gray-400')}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={cn('p-1.5 rounded-md transition-all', device === 'mobile' ? 'bg-[#2a2a2a] text-white' : 'text-gray-600 hover:text-gray-400')}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {generatedHtml && lastPrompt && (
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-gray-200 hover:border-[#333] text-xs font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
            Yenile
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !generatedHtml}
          className={cn(
            'flex items-center gap-1.5 px-4 h-8 rounded-lg text-xs font-semibold transition-all disabled:opacity-40',
            saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          )}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? 'Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Panel ── */}
        <div className="w-[400px] shrink-0 flex flex-col border-r border-[#1e1e1e] bg-[#0d0d0d]">

          {/* Tab bar */}
          <div className="flex items-center border-b border-[#1e1e1e] px-2 pt-1">
            {[
              { id: 'prompt' as LeftTab, label: 'AI Prompt', icon: Sparkles },
              { id: 'template' as LeftTab, label: 'Şablon', icon: LayoutTemplate },
              { id: 'image' as LeftTab, label: 'Görsel', icon: ImageIcon },
              { id: 'products' as LeftTab, label: 'Ürünler', icon: Package },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setLeftTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all -mb-px',
                  leftTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-600 hover:text-gray-400'
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Prompt Tab ── */}
            {leftTab === 'prompt' && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-2">Mağaza adı</label>
                  <input
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    placeholder="Örn: Marksio"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-gray-200 placeholder:text-gray-700 focus:outline-none focus:border-[#3a3a3a] rounded-xl px-3 py-2.5 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-2">Kampanya isteğin</label>
                  <AiPromptInput
                    onSend={handleGenerate}
                    disabled={isGenerating}
                    placeholder="Ne tür bir email kampanyası istiyorsun? Mağazanı, hedefini, indirimi, kuponu tarif et..."
                    buttonLabel="Oluştur"
                    buttonColor="#2563eb"
                    maxFiles={3}
                  />
                  <p className="text-[11px] text-gray-700 mt-2 leading-relaxed">
                    Örn: &ldquo;VIP müşterilere sepette %20 indirim, MARKSIO20 kodu ile, ürün fotoğrafı olan premium bir mail&rdquo;
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-2">Renk Tonu</label>
                  <div className="grid grid-cols-4 gap-2">
                    {ACCENT_PRESETS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setAccentColor(p.value)}
                        className={cn(
                          'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all',
                          accentColor === p.value
                            ? 'border-white/30 bg-white/10 text-white'
                            : 'border-[#2a2a2a] text-gray-600 hover:border-[#3a3a3a] hover:text-gray-400'
                        )}
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: p.value }} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {generatedHtml && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400">Email oluşturuldu</span>
                    </div>
                    {generatedSubject && (
                      <p className="text-[11px] text-gray-500">Konu: <span className="text-gray-300">{generatedSubject}</span></p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Template Tab ── */}
            {leftTab === 'template' && (
              <div className="p-4 space-y-3">
                <p className="text-[11px] text-gray-600 mb-3">Kampanya tipini seçin, AI içeriği bu stile göre üretir.</p>
                {TEMPLATE_STYLES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={cn(
                      'w-full text-left flex items-center gap-3 p-3.5 rounded-xl border transition-all',
                      selectedTemplate === tpl.id
                        ? 'border-blue-500/50 bg-blue-500/5'
                        : 'border-[#1e1e1e] hover:border-[#2a2a2a] hover:bg-[#111]'
                    )}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${tpl.accent}20` }}>
                      <div className="w-3 h-3 rounded-full" style={{ background: tpl.accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{tpl.label}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{tpl.desc}</p>
                    </div>
                    {selectedTemplate === tpl.id && (
                      <Check className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ── Image Tab ── */}
            {leftTab === 'image' && (
              <div className="p-4 space-y-4">

                {/* Current hero image preview */}
                {heroImage && (
                  <div className="relative rounded-xl overflow-hidden border border-[#1e1e1e]">
                    <img src={heroImage} alt="Hero" className="w-full h-44 object-cover" />
                    <button
                      onClick={() => setHeroImage(null)}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <span className="text-xs text-white font-medium">Hero görsel</span>
                    </div>
                  </div>
                )}

                {/* AI generate */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-2">AI ile Görsel Üret</label>
                  <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
                    <textarea
                      value={imagePrompt}
                      onChange={e => setImagePrompt(e.target.value)}
                      placeholder="Görsel tarifi... Örn: shopping bag with fashionable clothes, white background, professional photo"
                      rows={3}
                      className="w-full bg-transparent px-3 pt-3 text-sm text-gray-200 placeholder:text-gray-700 focus:outline-none resize-none"
                    />
                    <div className="px-3 pb-3">
                      <button
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !imagePrompt.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all w-full justify-center"
                      >
                        {isGeneratingImage ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" />Üretiliyor...</>
                        ) : (
                          <><Wand2 className="w-3.5 h-3.5" />AI ile Üret</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#1e1e1e]" />
                  <span className="text-[11px] text-gray-700">ya da</span>
                  <div className="h-px flex-1 bg-[#1e1e1e]" />
                </div>

                {/* Upload */}
                <button
                  onClick={() => heroFileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[#2a2a2a] rounded-xl text-sm text-gray-600 hover:text-gray-400 hover:border-[#3a3a3a] transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Bilgisayardan Yükle
                </button>
                <input ref={heroFileRef} type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />

                {/* Quick suggestions */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-2">Hızlı Öneriler</label>
                  <div className="space-y-1.5">
                    {[
                      'Fashion shopping bag with clothes and accessories, clean white background',
                      'Elegant woman wearing modern outfit, fashion brand style',
                      'Minimalist product flat lay with clothes and accessories, marble background',
                      'Cozy lifestyle shot with coffee and fashion items, warm tones',
                    ].map(s => (
                      <button
                        key={s}
                        onClick={() => setImagePrompt(s)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-[#111] border border-[#1e1e1e] hover:border-[#2a2a2a] text-[11px] text-gray-500 hover:text-gray-300 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Products Tab ── */}
            {leftTab === 'products' && (
              <div className="p-4 space-y-4">
                <p className="text-[11px] text-gray-600">Emaile eklenecek ürünleri girin. Görsel URL ya da Unsplash linki girin.</p>

                {/* Current products */}
                {products.length > 0 && (
                  <div className="space-y-2">
                    {products.map(p => (
                      <div key={p.id} className="flex items-center gap-3 bg-[#111] border border-[#1e1e1e] rounded-xl p-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#1a1a1a]">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                          <p className="text-xs text-gray-600">{p.price} TL</p>
                        </div>
                        <button
                          onClick={() => removeProduct(p.id)}
                          className="text-gray-700 hover:text-red-400 transition-colors p-1 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add product form */}
                {products.length < 4 && (
                  <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3 space-y-2">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Ürün Ekle</p>
                    <input
                      value={newProduct.name ?? ''}
                      onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                      placeholder="Ürün adı *"
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-gray-200 placeholder:text-gray-700 focus:outline-none rounded-lg px-3 py-2"
                    />
                    <div className="flex gap-2">
                      <input
                        value={newProduct.price ?? ''}
                        onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
                        placeholder="Fiyat (TL) *"
                        className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-gray-200 placeholder:text-gray-700 focus:outline-none rounded-lg px-3 py-2"
                      />
                    </div>
                    <input
                      value={newProduct.image ?? ''}
                      onChange={e => setNewProduct(p => ({ ...p, image: e.target.value }))}
                      placeholder="Görsel URL (opsiyonel)"
                      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-gray-200 placeholder:text-gray-700 focus:outline-none rounded-lg px-3 py-2"
                    />
                    <button
                      onClick={addProduct}
                      disabled={!newProduct.name || !newProduct.price}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ürün Ekle
                    </button>
                  </div>
                )}

                {/* Quick-add Unsplash products */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-2">Hazır Ürün Ekle</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Oversize T-Shirt', price: '499', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop' },
                      { name: 'Casual Sneaker', price: '1.299', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop' },
                      { name: 'Kadın Çantası', price: '899', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop' },
                      { name: 'Minimal Saat', price: '799', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop' },
                    ].map(p => (
                      <button
                        key={p.name}
                        disabled={products.length >= 4 || products.some(x => x.name === p.name)}
                        onClick={() => setProducts(prev => [...prev, { ...p, id: `${Date.now()}` }])}
                        className="group flex flex-col items-center gap-1.5 p-2 bg-[#111] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-xl text-left transition-all disabled:opacity-40"
                      >
                        <div className="w-full h-20 rounded-lg overflow-hidden bg-[#1a1a1a]">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="w-full">
                          <p className="text-[11px] font-semibold text-gray-300 truncate">{p.name}</p>
                          <p className="text-[11px] text-gray-600">{p.price} TL</p>
                        </div>
                        {products.some(x => x.name === p.name) ? (
                          <span className="text-[10px] text-emerald-500 font-semibold">Eklendi ✓</span>
                        ) : (
                          <span className="text-[10px] text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">+ Ekle</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Preview Panel ── */}
        <div className="flex-1 flex flex-col bg-[#0f0f0f] overflow-hidden">

          {!generatedHtml && !isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mb-6">
                <Sparkles className="w-9 h-9 text-blue-500 opacity-60" />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">AI Email Builder</h2>
              <p className="text-gray-600 text-sm max-w-md leading-relaxed mb-6">
                Sol tarafta kampanyanızı tarif edin. Mağazanızı, hedef kitlenizi, indirimi ve kupon kodunu yazın.
                AI sizin için <strong className="text-gray-400">ekrandaki gibi premium bir email</strong> oluşturacak.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-sm text-left">
                {[
                  { icon: Wand2, label: 'AI ile içerik', desc: "Prompt'tan otomatik üretim" },
                  { icon: ImageIcon, label: 'Görsel üret', desc: 'FAL.ai ile hero görseli' },
                  { icon: Package, label: 'Ürün ekle', desc: 'Drag & drop ürün kartları' },
                  { icon: Palette, label: 'Renk seç', desc: 'Marka rengini uygula' },
                ].map(f => (
                  <div key={f.label} className="flex items-start gap-3 p-3 bg-[#111] border border-[#1e1e1e] rounded-xl">
                    <f.icon className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gray-300">{f.label}</p>
                      <p className="text-[11px] text-gray-600 mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-blue-400 animate-pulse" />
                </div>
                <div className="absolute -inset-2 rounded-3xl border border-blue-500/10 animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold mb-1">Email oluşturuluyor...</p>
                <p className="text-gray-600 text-sm">AI içerik üretiyor ve şablona uygulıyor</p>
              </div>
              {/* Skeleton preview */}
              <div className="w-[500px] max-w-full bg-white rounded-xl overflow-hidden opacity-20 animate-pulse">
                <div className="h-10 bg-gray-200" />
                <div className="h-64 bg-orange-100" />
                <div className="h-24 bg-gray-100" />
                <div className="h-48 bg-gray-50" />
              </div>
            </div>
          )}

          {generatedHtml && !isGenerating && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Preview toolbar */}
              <div className="shrink-0 h-10 flex items-center px-4 gap-3 border-b border-[#1a1a1a]">
                <div className="flex items-center gap-1.5 text-xs text-gray-700">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <div className="flex-1 bg-[#1a1a1a] rounded-md px-3 py-1 text-[11px] text-gray-600 font-mono truncate">
                  {generatedSubject || campaignName}
                </div>
                <button
                  onClick={() => {
                    const blob = new Blob([generatedHtml], { type: 'text/html' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url; a.download = `${campaignName}.html`; a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-300 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  HTML
                </button>
              </div>

              {/* iframe */}
              <div className="flex-1 overflow-auto bg-[#141414] flex items-start justify-center py-6 px-4">
                <div
                  className={cn(
                    'transition-all duration-300 bg-white rounded-xl overflow-hidden shadow-2xl',
                    device === 'mobile' ? 'w-[390px]' : 'w-[640px]'
                  )}
                  style={{ minHeight: 600 }}
                >
                  <iframe
                    srcDoc={generatedHtml}
                    className="w-full"
                    style={{ height: 900, border: 'none', display: 'block' }}
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function EmailEditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    }>
      <EmailBuilderContent />
    </Suspense>
  )
}
