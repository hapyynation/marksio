'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2, Sparkles, Send, ChevronRight, ChevronLeft, Check,
  RefreshCw, Image as ImageIcon, Wand2, X, ShoppingCart, Crown,
  Leaf, Tag, Zap, Rocket, Eye, EyeOff, Calendar, Users, ArrowRight,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useSession } from 'next-auth/react'

/* ── Types ─────────────────────────────────────────────────────────── */

interface FormData {
  name: string
  productDescription: string
  discountRate: string
  segment: string
  brandTone: string
  sendDate: string
  sendNow: boolean
}

interface AiContent {
  subject: string
  previewText: string
  headline: string
  body: string
  ctaText: string
  imagePrompt: string
}

interface Notif {
  id: number
  type: 'success' | 'error'
  message: string
}

/* ── Constants ──────────────────────────────────────────────────────── */

const PURPOSES = [
  { id: 'cart_abandoned', label: 'Sepeti Terk Edenler', Icon: ShoppingCart, desc: 'Sepette bırakan müşterileri geri kazanın', from: 'from-orange-500/15', border: 'border-orange-500/25', hover: 'hover:border-orange-400/50' },
  { id: 'vip',            label: 'VIP Müşteriler',      Icon: Crown,        desc: 'En değerli müşterilerinizi ödüllendirin',    from: 'from-yellow-500/15', border: 'border-yellow-500/25', hover: 'hover:border-yellow-400/50' },
  { id: 'new_customers',  label: 'Yeni Müşteriler',     Icon: Leaf,         desc: 'Yeni müşterileri karşılayın',               from: 'from-emerald-500/15', border: 'border-emerald-500/25', hover: 'hover:border-emerald-400/50' },
  { id: 'discount',       label: 'İndirim Kampanyası',  Icon: Tag,          desc: 'Özel indirimlerle satışları artırın',       from: 'from-blue-500/15', border: 'border-blue-500/25', hover: 'hover:border-blue-400/50' },
  { id: 'black_friday',   label: 'Black Friday',        Icon: Zap,          desc: 'Yılın en büyük kampanyasını başlatın',      from: 'from-purple-500/15', border: 'border-purple-500/25', hover: 'hover:border-purple-400/50' },
  { id: 'product_launch', label: 'Ürün Tanıtımı',       Icon: Rocket,       desc: 'Yeni ürünlerinizi dünyaya duyurun',         from: 'from-pink-500/15', border: 'border-pink-500/25', hover: 'hover:border-pink-400/50' },
]

const BRAND_TONES = [
  'Profesyonel ve Güvenilir',
  'Samimi ve Arkadaşça',
  'Heyecan Verici ve Enerjik',
  'Lüks ve Prestijli',
  'Eğlenceli ve Yaratıcı',
]

const DEFAULT_SEGMENTS = [
  { value: 'all',           label: 'Tüm Müşteriler' },
  { value: 'vip',           label: 'VIP Müşteriler' },
  { value: 'new',           label: 'Yeni Müşteriler' },
  { value: 'loyal',         label: 'Sadık Müşteriler' },
  { value: 'at_risk',       label: 'Risk Altındakiler' },
  { value: 'cart_abandoned',label: 'Sepeti Terk Edenler' },
]

const STEPS = ['Amaç', 'Detaylar', 'AI İçerik', 'Görsel', 'Önizleme', 'Gönder']

const EMPTY_AI: AiContent = { subject: '', previewText: '', headline: '', body: '', ctaText: '', imagePrompt: '' }

/* ── Slide variants ─────────────────────────────────────────────────── */

const slide = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -24 },
  transition: { duration: 0.22 },
}

/* ── Component ──────────────────────────────────────────────────────── */

export default function NewCampaignPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [step,    setStep]    = useState(1)
  const [purpose, setPurpose] = useState('')
  const [form,    setForm]    = useState<FormData>({
    name: '',
    productDescription: '',
    discountRate: '',
    segment: 'all',
    brandTone: 'Profesyonel ve Güvenilir',
    sendDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 16),
    sendNow: true,
  })
  const [ai,         setAi]         = useState<AiContent>(EMPTY_AI)
  const [imageUrl,   setImageUrl]   = useState('')
  const [genContent, setGenContent] = useState(false)
  const [genImage,   setGenImage]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [sending,    setSending]    = useState(false)
  const [campaignId, setCampaignId] = useState('')
  const [segments,   setSegments]   = useState<Array<{ value: string; label: string }>>([])
  const [notifs,     setNotifs]     = useState<Notif[]>([])
  const notifIdRef = useRef(0)

  /* ── Notifications ──────────────────────────────────────────────── */

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++notifIdRef.current
    setNotifs(n => [...n, { id, type, message }])
    setTimeout(() => setNotifs(n => n.filter(x => x.id !== id)), 3500)
  }, [])

  /* ── Load custom segments ───────────────────────────────────────── */

  useEffect(() => {
    fetch('/api/segments')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSegments(data.map((s: { name: string }) => ({
            value: s.name.toLowerCase().replace(/\s+/g, '_'),
            label: s.name,
          })))
        }
      })
      .catch(() => {})
  }, [])

  const allSegments = [...DEFAULT_SEGMENTS, ...segments]

  /* ── Auto-generate when reaching step 3 ────────────────────────── */

  useEffect(() => {
    if (step === 3 && !ai.subject) generateContent()
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── AI content generation ──────────────────────────────────────── */

  async function generateContent() {
    setGenContent(true)
    setAi(EMPTY_AI)
    try {
      const res = await fetch('/api/ai/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose,
          name: form.name,
          productDescription: form.productDescription,
          discountRate: form.discountRate,
          brandTone: form.brandTone,
          storeName: (session?.user as { storeName?: string })?.storeName ?? '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'İçerik üretilemedi')
      setAi(data)
      notify('success', 'AI içerik hazır!')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'İçerik üretilemedi')
    } finally {
      setGenContent(false)
    }
  }

  /* ── Image generation ───────────────────────────────────────────── */

  async function generateImage() {
    if (!ai.imagePrompt) return
    setGenImage(true)
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: ai.imagePrompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Görsel üretilemedi')
      setImageUrl(data.url)
      notify('success', 'Görsel oluşturuldu!')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Görsel üretilemedi')
    } finally {
      setGenImage(false)
    }
  }

  /* ── Save campaign ──────────────────────────────────────────────── */

  async function saveCampaign(): Promise<string | null> {
    setSaving(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: 'email',
          status: 'draft',
          segment: form.segment,
          subject: ai.subject,
          previewText: ai.previewText,
          headline: ai.headline,
          body: ai.body,
          cta: ai.ctaText,
          purpose,
          imageUrl: imageUrl || null,
          scheduledAt: form.sendNow ? null : form.sendDate,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Kampanya kaydedilemedi')
      setCampaignId(data.id)
      return data.id
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Kampanya kaydedilemedi')
      return null
    } finally {
      setSaving(false)
    }
  }

  /* ── Send campaign ──────────────────────────────────────────────── */

  async function sendCampaign() {
    setSending(true)
    try {
      let cid = campaignId
      if (!cid) {
        const id = await saveCampaign()
        if (!id) return
        cid = id
      }

      const res = await fetch(`/api/campaigns/${cid}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gönderim başarısız')

      notify('success', `${data.sent} kişiye başarıyla gönderildi!`)
      setTimeout(() => router.push('/campaigns'), 1800)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Gönderim başarısız')
    } finally {
      setSending(false)
    }
  }

  /* ── Navigation ─────────────────────────────────────────────────── */

  const canNext = () => {
    if (step === 1) return !!purpose
    if (step === 2) return !!form.name.trim() && !!form.productDescription.trim()
    if (step === 3) return !genContent && !!ai.subject
    return true
  }

  const next = () => { if (canNext()) setStep(s => Math.min(s + 1, 6)) }
  const prev = () => setStep(s => Math.max(s - 1, 1))

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <AppShell>
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifs.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 32, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 32, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-xl pointer-events-auto border ${
                n.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/90 border-red-500/30 text-red-300'
              }`}
            >
              {n.type === 'success' ? <Check size={14} /> : <X size={14} />}
              {n.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="min-h-screen" style={{ background: 'var(--bg-base, #050505)' }}>
        {/* Top bar */}
        <div className="border-b border-white/5 sticky top-0 z-40" style={{ background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)' }}>
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#b3c5ff]/15 flex items-center justify-center">
                  <Sparkles size={15} className="text-[#b3c5ff]" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-white">Yeni AI Kampanya</h1>
                  <p className="text-xs text-white/35">
                    {STEPS[step - 1]} &middot; Adım {step}/{STEPS.length}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/campaigns')}
                className="text-xs text-white/35 hover:text-white/60 transition-colors flex items-center gap-1"
              >
                <X size={13} /> İptal
              </button>
            </div>

            {/* Step bar */}
            <div className="flex items-center gap-1">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
                  <div className={`flex items-center gap-1.5 ${i + 1 === step ? 'opacity-100' : i + 1 < step ? 'opacity-80' : 'opacity-30'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      i + 1 < step  ? 'bg-[#b3c5ff] text-[#050505]' :
                      i + 1 === step ? 'border-2 border-[#b3c5ff] text-[#b3c5ff]' :
                      'border border-white/20 text-white/30'
                    }`}>
                      {i + 1 < step ? <Check size={10} /> : i + 1}
                    </div>
                    <span className="text-[11px] font-medium hidden sm:block text-white/70">{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-1 hidden sm:block ${i + 1 < step ? 'bg-[#b3c5ff]/40' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-10">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Purpose ──────────────────────────────────── */}
            {step === 1 && (
              <motion.div key="s1" {...slide}>
                <div className="mb-10">
                  <p className="text-xs font-semibold text-[#b3c5ff] uppercase tracking-widest mb-2">Adım 1</p>
                  <h2 className="text-3xl font-bold text-white mb-2">Kampanya amacını seç</h2>
                  <p className="text-white/40 text-sm">AI sana özel içerik üretebilmek için kampanyanın amacını bilmek istiyor</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {PURPOSES.map(p => {
                    const selected = purpose === p.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPurpose(p.id)}
                        className={`relative text-left p-5 rounded-2xl border transition-all duration-200 group ${
                          selected
                            ? `bg-gradient-to-br ${p.from} to-transparent ${p.border.replace('/25', '/60')} scale-[1.02] shadow-lg shadow-black/20`
                            : `bg-[#131313] ${p.border} ${p.hover} border hover:scale-[1.01]`
                        }`}
                      >
                        {selected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#b3c5ff] flex items-center justify-center">
                            <Check size={10} className="text-[#050505]" />
                          </div>
                        )}
                        <p.Icon size={22} className={`mb-3 ${selected ? 'text-white' : 'text-white/50 group-hover:text-white/70'} transition-colors`} />
                        <div className="font-semibold text-sm text-white mb-1">{p.label}</div>
                        <div className="text-xs text-white/40 leading-relaxed">{p.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Details ───────────────────────────────────── */}
            {step === 2 && (
              <motion.div key="s2" {...slide}>
                <div className="mb-10">
                  <p className="text-xs font-semibold text-[#b3c5ff] uppercase tracking-widest mb-2">Adım 2</p>
                  <h2 className="text-3xl font-bold text-white mb-2">Kampanya detayları</h2>
                  <p className="text-white/40 text-sm">Bu bilgilerle AI sana özel e-posta içeriği üretecek</p>
                </div>

                <div className="max-w-2xl space-y-5">
                  <Field label="Kampanya Adı *">
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Yaz Sonu İndirim Kampanyası"
                      className="input-base"
                    />
                  </Field>

                  <Field label="Ürün / Hizmet Açıklaması *">
                    <textarea
                      value={form.productDescription}
                      onChange={e => setForm(f => ({ ...f, productDescription: e.target.value }))}
                      placeholder="Örn: Premium kadın giyim koleksiyonu — yazlık elbiseler, plaj kıyafetleri ve günlük şıklık"
                      rows={3}
                      className="input-base resize-none"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="İndirim Oranı (%)">
                      <input
                        type="number"
                        value={form.discountRate}
                        onChange={e => setForm(f => ({ ...f, discountRate: e.target.value }))}
                        placeholder="30"
                        min="0" max="100"
                        className="input-base"
                      />
                    </Field>

                    <Field label="Hedef Segment">
                      <select
                        value={form.segment}
                        onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}
                        className="input-base"
                      >
                        {allSegments.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Marka Tonu">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {BRAND_TONES.map(tone => (
                        <button
                          key={tone}
                          onClick={() => setForm(f => ({ ...f, brandTone: tone }))}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            form.brandTone === tone
                              ? 'bg-[#b3c5ff]/15 border-[#b3c5ff]/50 text-[#b3c5ff]'
                              : 'bg-[#0d0d0d] border-white/10 text-white/45 hover:border-white/20 hover:text-white/65'
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Gönderim Zamanı">
                    <div className="flex gap-2 mt-1">
                      {[true, false].map(v => (
                        <button
                          key={String(v)}
                          onClick={() => setForm(f => ({ ...f, sendNow: v }))}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                            form.sendNow === v
                              ? 'bg-[#b3c5ff]/15 border-[#b3c5ff]/40 text-[#b3c5ff]'
                              : 'bg-[#0d0d0d] border-white/10 text-white/40 hover:border-white/20'
                          }`}
                        >
                          {v ? <><Zap size={12} /> Hemen Gönder</> : <><Calendar size={12} /> Zamanla</>}
                        </button>
                      ))}
                    </div>
                    {!form.sendNow && (
                      <input
                        type="datetime-local"
                        value={form.sendDate}
                        onChange={e => setForm(f => ({ ...f, sendDate: e.target.value }))}
                        className="input-base mt-2"
                      />
                    )}
                  </Field>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: AI Content ───────────────────────────────── */}
            {step === 3 && (
              <motion.div key="s3" {...slide}>
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#b3c5ff] uppercase tracking-widest mb-2">Adım 3</p>
                    <h2 className="text-3xl font-bold text-white mb-2">AI İçerik</h2>
                    <p className="text-white/40 text-sm">Kampanya amacına özel içerik üretildi — düzenleyebilirsin</p>
                  </div>
                  {!genContent && ai.subject && (
                    <button
                      onClick={generateContent}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#131313] border border-white/10 hover:border-white/20 text-xs text-white/60 transition-all mt-1"
                    >
                      <RefreshCw size={13} /> Yeniden Üret
                    </button>
                  )}
                </div>

                {genContent ? (
                  <div className="flex flex-col items-center justify-center py-28 gap-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-[#b3c5ff]/10 flex items-center justify-center">
                        <Sparkles size={28} className="text-[#b3c5ff]" />
                      </div>
                      <motion.div
                        className="absolute -inset-2 rounded-3xl border border-[#b3c5ff]/20"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-white mb-1">Kampanya içeriği üretiliyor…</p>
                      <p className="text-sm text-white/35">AI kampanya amacını analiz ediyor</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl space-y-3">
                    {([
                      { key: 'subject',      label: 'Mail Konusu',             type: 'input',    ph: 'E-posta başlığı…' },
                      { key: 'previewText',  label: 'Önizleme Metni',          type: 'input',    ph: 'İnbox önizleme metni…' },
                      { key: 'headline',     label: 'Başlık',                  type: 'input',    ph: 'Ana e-posta başlığı…' },
                      { key: 'body',         label: 'Açıklama Metni',          type: 'textarea', ph: 'E-posta gövde metni…', rows: 5 },
                      { key: 'ctaText',      label: 'CTA Butonu',              type: 'input',    ph: 'Alışverişe Başla…' },
                      { key: 'imagePrompt',  label: 'Görsel Prompt (Fal.ai)',   type: 'textarea', ph: 'Görsel açıklaması…', rows: 2 },
                    ] as const).map(f => (
                      <div key={f.key} className="bg-[#111] rounded-2xl p-4 border border-white/6 group hover:border-white/10 transition-colors">
                        <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">{f.label}</label>
                        {f.type === 'textarea' ? (
                          <textarea
                            value={ai[f.key]}
                            onChange={e => setAi(a => ({ ...a, [f.key]: e.target.value }))}
                            placeholder={f.ph}
                            rows={f.rows}
                            className="w-full bg-transparent text-sm text-white/85 placeholder:text-white/20 focus:outline-none resize-none leading-relaxed"
                          />
                        ) : (
                          <input
                            value={ai[f.key]}
                            onChange={e => setAi(a => ({ ...a, [f.key]: e.target.value }))}
                            placeholder={f.ph}
                            className="w-full bg-transparent text-sm text-white/85 placeholder:text-white/20 focus:outline-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 4: Image ────────────────────────────────────── */}
            {step === 4 && (
              <motion.div key="s4" {...slide}>
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#b3c5ff] uppercase tracking-widest mb-2">Adım 4</p>
                    <h2 className="text-3xl font-bold text-white mb-2">Kampanya Görseli</h2>
                    <p className="text-white/40 text-sm">Fal.ai ile e-posta için özel görsel oluştur</p>
                  </div>
                  {imageUrl && (
                    <button
                      onClick={generateImage}
                      disabled={genImage}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#131313] border border-white/10 hover:border-white/20 text-xs text-white/60 transition-all mt-1 disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={genImage ? 'animate-spin' : ''} />
                      Yeniden Oluştur
                    </button>
                  )}
                </div>

                <div className="max-w-xl space-y-4">
                  <div className="bg-[#111] rounded-2xl p-4 border border-white/6">
                    <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Görsel Prompt</label>
                    <textarea
                      value={ai.imagePrompt}
                      onChange={e => setAi(a => ({ ...a, imagePrompt: e.target.value }))}
                      rows={3}
                      className="w-full bg-transparent text-sm text-white/85 placeholder:text-white/20 focus:outline-none resize-none"
                      placeholder="Görsel açıklaması…"
                    />
                  </div>

                  {imageUrl ? (
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                      <img src={imageUrl} alt="Kampanya görseli" className="w-full h-auto block" />
                    </div>
                  ) : (
                    <button
                      onClick={generateImage}
                      disabled={genImage || !ai.imagePrompt}
                      className="w-full py-5 rounded-2xl border border-[#b3c5ff]/25 bg-[#b3c5ff]/5 hover:bg-[#b3c5ff]/10 hover:border-[#b3c5ff]/40 text-[#b3c5ff] font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {genImage ? (
                        <><Loader2 size={18} className="animate-spin" /> Görsel oluşturuluyor…</>
                      ) : (
                        <><ImageIcon size={18} /> Görsel Oluştur</>
                      )}
                    </button>
                  )}

                  <p className="text-center text-xs text-white/25">
                    Görseli atlamak istiyorsanız ileri tuşuna basın
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── STEP 5: Preview ──────────────────────────────────── */}
            {step === 5 && (
              <motion.div key="s5" {...slide}>
                <div className="mb-8">
                  <p className="text-xs font-semibold text-[#b3c5ff] uppercase tracking-widest mb-2">Adım 5</p>
                  <h2 className="text-3xl font-bold text-white mb-2">E-posta Önizleme</h2>
                  <p className="text-white/40 text-sm">Müşterilerine ulaşacak mailin önizlemesi</p>
                </div>

                <div className="max-w-[520px] mx-auto rounded-2xl overflow-hidden shadow-2xl" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif' }}>
                  {/* Header */}
                  <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)', padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#fff', fontSize: '17px', fontWeight: 800 }}>Marka Adı</span>
                    {form.discountRate && (
                      <span style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '100px' }}>
                        %{form.discountRate} İNDİRİM
                      </span>
                    )}
                  </div>

                  {/* Hero image */}
                  {imageUrl && <img src={imageUrl} alt="Hero" style={{ width: '100%', display: 'block' }} />}

                  {/* Content */}
                  <div style={{ background: '#fff', padding: '32px 28px' }}>
                    <h1 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
                      {ai.headline || 'Kampanya Başlığı'}
                    </h1>
                    <div style={{ fontSize: '14px', lineHeight: 1.75, color: '#475569', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
                      {ai.body || 'Kampanya açıklaması burada görünecek…'}
                    </div>

                    {form.discountRate && (
                      <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '2px dashed #f59e0b', borderRadius: '12px', padding: '16px 20px', textAlign: 'center', marginBottom: '20px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#92400e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Özel Fırsat</p>
                        <p style={{ margin: '5px 0 0', fontSize: '22px', fontWeight: 900, color: '#78350f', letterSpacing: '3px' }}>%{form.discountRate} TASARRUF</p>
                      </div>
                    )}

                    <div style={{ textAlign: 'center' }}>
                      <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#2563eb 0%,#4338ca 100%)', color: '#fff', fontSize: '14px', fontWeight: 700, padding: '14px 36px', borderRadius: '10px', cursor: 'pointer' }}>
                        {ai.ctaText || 'Alışverişe Başla'}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ background: '#f8fafc', padding: '16px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Marksio tarafından gönderildi</span>
                    <span style={{ fontSize: '11px', color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}>Aboneliği iptal et</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 6: Send ─────────────────────────────────────── */}
            {step === 6 && (
              <motion.div key="s6" {...slide}>
                <div className="mb-8">
                  <p className="text-xs font-semibold text-[#b3c5ff] uppercase tracking-widest mb-2">Adım 6</p>
                  <h2 className="text-3xl font-bold text-white mb-2">Kampanyayı Gönder</h2>
                  <p className="text-white/40 text-sm">Her şey hazır — son onayını ver</p>
                </div>

                <div className="max-w-md space-y-4">
                  {/* Summary card */}
                  <div className="bg-[#111] rounded-2xl p-5 border border-white/6">
                    <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Kampanya Özeti</h3>
                    <div className="space-y-2.5">
                      {[
                        { label: 'Kampanya', value: form.name },
                        { label: 'Amaç', value: PURPOSES.find(p => p.id === purpose)?.label ?? purpose },
                        { label: 'Segment', value: allSegments.find(s => s.value === form.segment)?.label ?? form.segment },
                        { label: 'Konu', value: ai.subject },
                        { label: 'CTA', value: ai.ctaText },
                        { label: 'Görsel', value: imageUrl ? 'Hazır ✓' : 'Yok' },
                        { label: 'Gönderim', value: form.sendNow ? 'Hemen' : new Date(form.sendDate).toLocaleString('tr-TR') },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between items-start gap-3">
                          <span className="text-xs text-white/35 flex-shrink-0">{r.label}</span>
                          <span className="text-xs text-white/80 text-right leading-relaxed line-clamp-2">{r.value || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Send button */}
                  <button
                    onClick={sendCampaign}
                    disabled={sending || saving}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#b3c5ff] to-[#7c9dff] text-[#050505] font-bold text-sm flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#b3c5ff]/15"
                  >
                    {sending ? (
                      <><Loader2 size={17} className="animate-spin" /> Gönderiliyor…</>
                    ) : saving ? (
                      <><Loader2 size={17} className="animate-spin" /> Kaydediliyor…</>
                    ) : (
                      <><Send size={17} /> Kampanyayı Gönder</>
                    )}
                  </button>

                  {/* Save draft */}
                  <button
                    onClick={async () => {
                      const id = await saveCampaign()
                      if (id) {
                        notify('success', 'Taslak olarak kaydedildi!')
                        setTimeout(() => router.push('/campaigns'), 1200)
                      }
                    }}
                    disabled={saving}
                    className="w-full py-3 rounded-2xl bg-[#111] border border-white/8 hover:border-white/15 text-white/45 font-medium text-xs transition-all disabled:opacity-40"
                  >
                    Taslak Olarak Kaydet
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-12 max-w-2xl">
            <button
              onClick={prev}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-white/10 bg-[#111] hover:border-white/20 text-white/60 transition-all ${step === 1 ? 'invisible' : ''}`}
            >
              <ChevronLeft size={15} /> Geri
            </button>

            {step < 6 && (
              <button
                onClick={next}
                disabled={!canNext()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#b3c5ff] text-[#050505] hover:bg-[#c5d3ff] active:scale-[0.98] transition-all disabled:opacity-35 disabled:cursor-not-allowed"
              >
                {step === 5 ? 'Gönderiye Geç' : 'Devam Et'}
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Input styles */}
      <style jsx global>{`
        .input-base {
          width: 100%;
          background: #111;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          color: rgba(255,255,255,0.85);
          transition: border-color 0.15s;
          outline: none;
          font-family: inherit;
        }
        .input-base::placeholder { color: rgba(255,255,255,0.2); }
        .input-base:focus { border-color: rgba(179,197,255,0.4); }
        .input-base option { background: #111; color: white; }
      `}</style>
    </AppShell>
  )
}

/* ── Helper component ───────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-2">{label}</label>
      {children}
    </div>
  )
}
