'use client'

import { useState, useCallback } from 'react'
import {
  Search, Sparkles, Loader2, ImagePlus, X, Check,
  Mail, Save, RefreshCw, ArrowLeft, Eye, Send,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { cn } from '@/lib/utils'

interface Template {
  id: string
  label: string
  emoji: string
  desc: string
  tags: string[]
  color: string
}

const TEMPLATES: Template[] = [
  {
    id: 'promotion',
    label: 'Promosyon & İndirim',
    emoji: '⚡',
    desc: 'İndirim ve kampanya duyuruları için hero tasarım',
    tags: ['indirim', 'kampanya', 'promosyon', 'kupon', 'fırsat'],
    color: 'from-orange-400 to-red-500',
  },
  {
    id: 'abandoned_cart',
    label: 'Sepet Terk',
    emoji: '🛒',
    desc: 'Terk edilen sepetleri geri kazanmak için aciliyet',
    tags: ['sepet', 'terk', 'geri kazanım', 'hatırlatma'],
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: 'new_product',
    label: 'Yeni Ürün Lansmanı',
    emoji: '🛍️',
    desc: 'Yeni ürün ve koleksiyon duyuruları için',
    tags: ['yeni', 'ürün', 'koleksiyon', 'lansman', 'tanıtım'],
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'winback',
    label: 'Geri Kazanım',
    emoji: '💚',
    desc: 'Pasif müşterileri özel teklifle geri çekin',
    tags: ['pasif', 'geri', 'kazanım', 'inaktif', 'özledik'],
    color: 'from-emerald-400 to-green-600',
  },
  {
    id: 'vip',
    label: 'VIP Özel',
    emoji: '👑',
    desc: 'Premium dark tasarım, VIP müşterilere özel',
    tags: ['vip', 'özel', 'premium', 'sadakat', 'lüks'],
    color: 'from-purple-600 to-indigo-700',
  },
  {
    id: 'welcome',
    label: 'Hoş Geldin',
    emoji: '🎉',
    desc: 'Yeni müşterileri sıcak bir şekilde karşılayın',
    tags: ['hoş geldin', 'yeni', 'kayıt', 'karşılama'],
    color: 'from-blue-500 to-blue-600',
  },
]

const STYLE_PRESETS = [
  { label: 'Acil & Sıcak', value: 'Aciliyet hissi veren, sıcak ve samimi bir dil kullan. Müşteriyi hemen harekete geçirecek ifadeler.' },
  { label: 'Minimal & Modern', value: 'Minimalist, temiz ve modern bir dil. Az kelime, maksimum etki. Gereksiz kelimeden kaçın.' },
  { label: 'Lüks & Premium', value: 'Sofistike, lüks ve premium bir ton. Müşteriyi değerli hissettiren, özel ve seçkin bir dil.' },
  { label: 'Samimi & Neşeli', value: 'Samimi, sıcak ve neşeli bir dil. Dostça konuş, emoji kullanabilirsin, müşteriyle sohbet et.' },
  { label: 'Kurumsal', value: 'Profesyonel ve kurumsal bir dil. Güven veren, net ve bilgilendirici ifadeler.' },
]

export default function CampaignBuilderPage() {
  const [search, setSearch] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const thumbnailKey = 0

  const [storeName, setStoreName] = useState('Demo Mağaza')
  const [headline, setHeadline] = useState('')
  const [subheadline] = useState('')
  const [discount, setDiscount] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [stylePrompt, setStylePrompt] = useState('')
  const [productImageUrl, setProductImageUrl] = useState('')
  const [imageUploading, setImageUploading] = useState(false)

  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [testError, setTestError] = useState('')
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form')

  const filtered = TEMPLATES.filter(t =>
    !search ||
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.tags.some(tag => tag.includes(search.toLowerCase()))
  )

  const selectTemplate = useCallback((tpl: Template) => {
    setSelectedTemplate(tpl)
    setPreviewHtml('')
    setActiveTab('form')
  }, [])

  async function handleGenerate() {
    if (!selectedTemplate) return
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/email-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          storeName,
          headline,
          subheadline,
          discount,
          couponCode,
          ctaText,
          ctaUrl,
          stylePrompt,
          productImage: productImageUrl || undefined,
          productName,
          productPrice,
        }),
      })
      const data = await res.json()
      setPreviewHtml(data.html)
      setActiveTab('preview')
    } catch {
      alert('AI üretimi sırasında hata oluştu.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!previewHtml || !selectedTemplate) return
    setSaving(true)
    try {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${selectedTemplate.label} — ${new Date().toLocaleDateString('tr-TR')}`,
          type: 'email',
          status: 'draft',
          segment: 'all',
          subject: headline || selectedTemplate.label,
          body: stylePrompt,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  async function handleTestSend() {
    if (!previewHtml || !selectedTemplate) return
    setSendingTest(true)
    setTestError('')
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: headline || selectedTemplate.label,
          body: stylePrompt || 'Builder ile oluşturuldu',
          templateId: selectedTemplate.id,
          heroImageUrl: productImageUrl || undefined,
          discount,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTestSent(true)
      setTimeout(() => setTestSent(false), 4000)
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Gönderilemedi')
    } finally {
      setSendingTest(false)
    }
  }

  async function handleImageUpload(file: File) {
    setImageUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload/image', { method: 'POST', body: form })
      const data = await res.json()
      if (data.url) setProductImageUrl(data.url)
    } finally {
      setImageUploading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition'

  return (
    <AppShell>
      <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">

        {/* ── Sol panel: Template galerisi ─────────────────────────── */}
        <div className="w-72 shrink-0 border-r border-[#1e1e1e] flex flex-col bg-[#0d0d0d]">
          <div className="p-4 border-b border-[#1e1e1e]">
            <div className="flex items-center gap-2 mb-3">
              <Link href="/campaigns" className="text-gray-500 hover:text-gray-300 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-sm font-bold text-white">Email Builder</h1>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Şablon ara... (sepet, vip...)"
                className="w-full pl-8 pr-3 py-2 text-xs bg-[#111] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.map(tpl => {
              const isSelected = selectedTemplate?.id === tpl.id
              return (
                <button
                  key={tpl.id}
                  onClick={() => selectTemplate(tpl)}
                  className={cn(
                    'w-full text-left rounded-xl overflow-hidden border-2 transition-all hover:shadow-md',
                    isSelected ? 'border-blue-500 shadow-md shadow-blue-500/10' : 'border-[#1e1e1e] hover:border-[#2a2a2a]'
                  )}
                >
                  <div className="relative overflow-hidden bg-[#0d0d0d]" style={{ height: '150px' }}>
                    <iframe
                      key={`${tpl.id}-${thumbnailKey}`}
                      src={`/api/email/preview/thumbnail?template=${tpl.id}`}
                      style={{
                        width: '620px',
                        height: '900px',
                        transform: 'scale(0.235)',
                        transformOrigin: 'top left',
                        border: 'none',
                        pointerEvents: 'none',
                      }}
                      title={tpl.label}
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className={cn('px-3 py-2.5 border-t', isSelected ? 'bg-blue-500/10 border-blue-500/20' : 'bg-[#111] border-[#1e1e1e]')}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{tpl.emoji}</span>
                      <p className={cn('text-xs font-semibold', isSelected ? 'text-blue-400' : 'text-gray-200')}>{tpl.label}</p>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{tpl.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Orta panel: Form ─────────────────────────────────────── */}
        {selectedTemplate ? (
          <div className="flex flex-1 overflow-hidden">

            <div className="w-80 shrink-0 border-r border-[#1e1e1e] flex flex-col bg-[#0d0d0d] overflow-hidden">
              <div className={cn('px-5 py-4 bg-gradient-to-r text-white', selectedTemplate.color)}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedTemplate.emoji}</span>
                  <div>
                    <p className="text-sm font-bold">{selectedTemplate.label}</p>
                    <p className="text-xs opacity-80">{selectedTemplate.desc}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Mağaza Adı</label>
                  <input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Mağazanız" className={inputCls} />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Başlık</label>
                  <input value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Örn: Sepette %15 İndirim" className={inputCls} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">İndirim</label>
                    <input value={discount} onChange={e => setDiscount(e.target.value)} placeholder="%15" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Kupon Kodu</label>
                    <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="MARKSIO15" className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Ürün Adı</label>
                    <input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Oversize T-Shirt" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Fiyat</label>
                    <input value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="499,90 TL" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">CTA Butonu</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="Alışverişe Başla" className={inputCls} />
                    <input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} placeholder="https://..." className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Hero Görseli</label>
                  {productImageUrl ? (
                    <div className="relative w-full h-28 rounded-xl overflow-hidden border border-[#2a2a2a]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={productImageUrl} alt="Hero" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setProductImageUrl('')}
                        className="absolute top-2 right-2 w-6 h-6 bg-[#1a1a1a] rounded-full shadow flex items-center justify-center text-gray-400 hover:text-red-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className={cn(
                      'flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all',
                      imageUploading
                        ? 'border-blue-500/40 bg-blue-500/5'
                        : 'border-[#2a2a2a] hover:border-blue-500/30 hover:bg-blue-500/5 bg-[#0d0d0d]'
                    )}>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }}
                        disabled={imageUploading}
                      />
                      {imageUploading
                        ? <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                        : <><ImagePlus className="w-5 h-5 text-gray-600 mb-1" /><span className="text-xs text-gray-500">Görsel yükle (PNG, JPG)</span></>
                      }
                    </label>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wide">Stil & Ton Promptu</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {STYLE_PRESETS.map(p => (
                      <button
                        key={p.label}
                        onClick={() => setStylePrompt(p.value)}
                        className={cn(
                          'text-[10px] font-medium px-2 py-1 rounded-full border transition-all',
                          stylePrompt === p.value
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                            : 'border-[#2a2a2a] bg-[#111] text-gray-500 hover:border-[#333]'
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={stylePrompt}
                    onChange={e => setStylePrompt(e.target.value)}
                    placeholder="Örn: Minimalist ve modern bir dil kullan. Müşteriyi hemen harekete geçirecek, kısa ve güçlü cümleler yaz..."
                    rows={3}
                    className="w-full px-3 py-2 text-xs bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 resize-none transition"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-[#1e1e1e] space-y-2">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all"
                >
                  {generating
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> AI Oluşturuyor...</>
                    : <><Sparkles className="w-4 h-4" /> AI ile Email Oluştur</>
                  }
                </button>
                {previewHtml && (
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Yeniden Üret
                  </button>
                )}
              </div>
            </div>

            {/* ── Sağ: Önizleme ──────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="h-12 bg-[#0d0d0d] border-b border-[#1e1e1e] flex items-center justify-between px-5">
                <div className="flex items-center gap-1">
                  {(['form', 'preview'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5',
                        activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'
                      )}
                    >
                      {tab === 'preview' ? <Eye className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      {tab === 'form' ? 'Ayarlar' : 'Önizleme'}
                    </button>
                  ))}
                </div>
                {previewHtml && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTestSend}
                      disabled={sendingTest || testSent}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                        testSent
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-[#1a1a1a] hover:bg-[#222] text-gray-300 disabled:opacity-60 border border-[#2a2a2a]'
                      )}
                    >
                      {sendingTest ? <Loader2 className="w-3 h-3 animate-spin" /> : testSent ? <Check className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                      {testSent ? 'Gönderildi!' : 'Test Gönder'}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || saved}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                        saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60'
                      )}
                    >
                      {saved ? <><Check className="w-3 h-3" /> Kaydedildi</> : <><Save className="w-3 h-3" /> Kaydet</>}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-hidden bg-[#0a0a0a] p-6 flex items-start justify-center">
                {previewHtml ? (
                  <div className="w-full max-w-2xl h-full">
                    <div className="bg-[#111] rounded-t-xl border border-[#1e1e1e] px-4 py-3 flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/60" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                      </div>
                      <div className="flex-1 bg-[#1a1a1a] rounded-md px-3 py-1">
                        <p className="text-xs text-gray-500">{storeName || 'Demo Mağaza'} &lt;noreply@marksio.app&gt;</p>
                      </div>
                      <Mail className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="border border-t-0 border-[#1e1e1e] rounded-b-xl overflow-hidden" style={{ height: 'calc(100% - 52px)' }}>
                      <iframe
                        srcDoc={previewHtml}
                        className="w-full h-full border-0"
                        title="Email Önizlemesi"
                        sandbox="allow-same-origin"
                      />
                    </div>
                    {testError && (
                      <p className="text-xs text-red-400 mt-2 text-center">{testError}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center max-w-sm">
                    <div className="w-20 h-20 rounded-2xl bg-[#111] border border-[#1e1e1e] flex items-center justify-center mb-4">
                      <span className="text-3xl">{selectedTemplate.emoji}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">{selectedTemplate.label} seçildi</p>
                    <p className="text-xs text-gray-500 mb-6">Sol panelden bilgileri doldurun ve "AI ile Email Oluştur" butonuna tıklayın.</p>

                    <div className="w-64 rounded-xl overflow-hidden border border-[#1e1e1e] shadow-md">
                      <div className="relative overflow-hidden bg-[#0d0d0d]" style={{ height: '200px' }}>
                        <iframe
                          src={`/api/email/preview/thumbnail?template=${selectedTemplate.id}`}
                          style={{
                            width: '620px',
                            height: '900px',
                            transform: 'scale(0.315)',
                            transformOrigin: 'top left',
                            border: 'none',
                            pointerEvents: 'none',
                          }}
                          title={selectedTemplate.label}
                        />
                      </div>
                      <div className="bg-[#111] px-3 py-2 border-t border-[#1e1e1e]">
                        <p className="text-xs text-gray-500">Şablon önizlemesi</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
              <Mail className="w-9 h-9 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Email Builder</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              Sol panelden bir şablon seçin. Mağaza bilgilerinizi ve stil tercihlerinizi girin, AI profesyonel bir email oluştursun.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-[#1e1e1e] hover:border-blue-500/30 hover:bg-blue-500/5 rounded-xl text-sm font-medium text-gray-300 transition-all"
                >
                  <span>{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
