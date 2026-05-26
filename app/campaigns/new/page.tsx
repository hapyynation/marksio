'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2, Sparkles, Send, ChevronRight, ChevronLeft, Check,
  RefreshCw, Image as ImageIcon, X, ShoppingCart, Crown,
  Leaf, Tag, Zap, Rocket, Heart, RotateCcw, Monitor, Smartphone,
  Mail, AlertTriangle, Users, Calendar, Info,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useSession } from 'next-auth/react'

/* ── Types ──────────────────────────────────────────────────────────── */

interface FormData {
  name: string
  productDescription: string
  discountRate: string
  segment: string
  brandTone: string
  brandColor: string
  ctaPurpose: string
  layoutStyle: string
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
  layoutStyle: string
  recommendedSegment: string
  personalizationVariables: string[]
  smsVariant: string
  whatsappVariant: string
}

interface Notif { id: number; type: 'success' | 'error' | 'info'; message: string }

/* ── Constants ──────────────────────────────────────────────────────── */

const PURPOSES = [
  { id: 'cart_abandoned', label: 'Sepeti Terk Edenler', Icon: ShoppingCart, desc: 'Sepette bırakan müşterileri geri kazanın', from: 'from-orange-500/15', border: 'border-orange-500/25', hov: 'hover:border-orange-400/50' },
  { id: 'vip',            label: 'VIP Müşteriler',      Icon: Crown,        desc: 'En değerli müşterilerinizi ödüllendirin',    from: 'from-yellow-500/15', border: 'border-yellow-500/25', hov: 'hover:border-yellow-400/50' },
  { id: 'new_customers',  label: 'Yeni Müşteriler',     Icon: Leaf,         desc: 'Yeni müşterileri karşılayın',               from: 'from-emerald-500/15', border: 'border-emerald-500/25', hov: 'hover:border-emerald-400/50' },
  { id: 'discount',       label: 'İndirim Kampanyası',  Icon: Tag,          desc: 'Özel indirimlerle satışları artırın',       from: 'from-blue-500/15', border: 'border-blue-500/25', hov: 'hover:border-blue-400/50' },
  { id: 'black_friday',   label: 'Black Friday',        Icon: Zap,          desc: 'Yılın en büyük kampanyasını başlatın',      from: 'from-purple-500/15', border: 'border-purple-500/25', hov: 'hover:border-purple-400/50' },
  { id: 'product_launch', label: 'Ürün Tanıtımı',       Icon: Rocket,       desc: 'Yeni ürünlerinizi dünyaya duyurun',         from: 'from-pink-500/15', border: 'border-pink-500/25', hov: 'hover:border-pink-400/50' },
  { id: 'repurchase',     label: 'Tekrar Satın Alma',   Icon: RotateCcw,    desc: 'Mevcut müşterileri tekrar alışverişe çekin',from: 'from-cyan-500/15', border: 'border-cyan-500/25', hov: 'hover:border-cyan-400/50' },
  { id: 'win_back',       label: 'Pasif Müşteriyi Geri Kazan', Icon: Heart, desc: 'Uzun süredir alışveriş yapmayan müşteriler',from: 'from-rose-500/15', border: 'border-rose-500/25', hov: 'hover:border-rose-400/50' },
]

const BRAND_TONES = [
  'Profesyonel ve Güvenilir',
  'Samimi ve Arkadaşça',
  'Heyecan Verici ve Enerjik',
  'Lüks ve Prestijli',
  'Eğlenceli ve Yaratıcı',
]

const LAYOUT_STYLES = [
  { value: 'default',      label: 'Varsayılan', desc: 'Mavi/lacivert klasik' },
  { value: 'luxury',       label: 'Luxury',     desc: 'Siyah/altın premium' },
  { value: 'minimal',      label: 'Minimal',    desc: 'Siyah/beyaz temiz' },
  { value: 'black-friday', label: 'Black Friday', desc: 'Siyah/sarı bold' },
  { value: 'skincare',     label: 'Skincare',   desc: 'Pembe/krem soft' },
  { value: 'fashion',      label: 'Fashion',    desc: 'Editorial koyu' },
  { value: 'tech',         label: 'Tech',       desc: 'Mavi/lacivert modern' },
  { value: 'furniture',    label: 'Furniture',  desc: 'Ahşap/warm tones' },
  { value: 'gaming',       label: 'Gaming',     desc: 'Mor/neon koyu' },
]

const CTA_PURPOSES = [
  'Alışverişe Başla',
  'İndirimi Al',
  'Ürünü İncele',
  'Websiteye Git',
  'Koleksiyonu Keşfet',
  'Hemen Satın Al',
  'Teklifi Gör',
]

const DEFAULT_SEGMENTS = [
  { value: 'all',            label: 'Tüm Müşteriler' },
  { value: 'vip',            label: 'VIP Müşteriler' },
  { value: 'new',            label: 'Yeni Müşteriler' },
  { value: 'loyal',          label: 'Sadık Müşteriler' },
  { value: 'at_risk',        label: 'Risk Altındakiler' },
  { value: 'cart_abandoned', label: 'Sepeti Terk Edenler' },
]

const STEPS = ['Amaç', 'Detaylar', 'AI İçerik', 'Görsel', 'Önizleme', 'Gönder']

const EMPTY_AI: AiContent = {
  subject: '', previewText: '', headline: '', body: '', ctaText: '',
  imagePrompt: '', layoutStyle: '', recommendedSegment: '',
  personalizationVariables: [], smsVariant: '', whatsappVariant: '',
}

const slide = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 }, transition: { duration: 0.2 } }

/* ── Component ──────────────────────────────────────────────────────── */

export default function NewCampaignPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const notifIdRef = useRef(0)

  const [step,           setStep]           = useState(1)
  const [purpose,        setPurpose]        = useState('')
  const [form,           setForm]           = useState<FormData>({
    name: '', productDescription: '', discountRate: '',
    segment: 'all', brandTone: 'Profesyonel ve Güvenilir',
    brandColor: '', ctaPurpose: 'Alışverişe Başla',
    layoutStyle: 'default',
    sendDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 16),
    sendNow: true,
  })
  const [ai,             setAi]             = useState<AiContent>(EMPTY_AI)
  const [imageUrl,       setImageUrl]       = useState('')
  const [genContent,     setGenContent]     = useState(false)
  const [genImage,       setGenImage]       = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [sending,        setSending]        = useState(false)
  const [sendingTest,    setSendingTest]    = useState(false)
  const [campaignId,     setCampaignId]     = useState('')
  const [segments,       setSegments]       = useState<Array<{ value: string; label: string }>>([])
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [showConfirm,    setShowConfirm]    = useState(false)
  const [previewMode,    setPreviewMode]    = useState<'desktop' | 'mobile'>('desktop')
  const [notifs,         setNotifs]         = useState<Notif[]>([])

  /* ── Notifications ────────────────────────────────────────────────── */

  const notify = useCallback((type: Notif['type'], message: string) => {
    const id = ++notifIdRef.current
    setNotifs(n => [...n, { id, type, message }])
    setTimeout(() => setNotifs(n => n.filter(x => x.id !== id)), 3600)
  }, [])

  /* ── Load segments ────────────────────────────────────────────────── */

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

  /* ── Fetch recipient count on step 6 ─────────────────────────────── */

  useEffect(() => {
    if (step === 6) {
      setRecipientCount(null)
      fetch(`/api/campaigns/recipients?segment=${form.segment}`)
        .then(r => r.json())
        .then(d => setRecipientCount(d.count ?? 0))
        .catch(() => setRecipientCount(0))
    }
  }, [step, form.segment])

  /* ── Auto-generate on step 3 ─────────────────────────────────────── */

  useEffect(() => {
    if (step === 3 && !ai.subject) generateContent()
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── AI content generation ────────────────────────────────────────── */

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
          ctaPurpose: form.ctaPurpose,
          layoutStyle: form.layoutStyle,
          storeName: (session?.user as { storeName?: string })?.storeName ?? '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'İçerik üretilemedi')

      setAi(data)
      if (data.layoutStyle) setForm(f => ({ ...f, layoutStyle: data.layoutStyle }))
      if (data.recommendedSegment) setForm(f => ({ ...f, segment: data.recommendedSegment }))
      notify('success', 'AI içerik hazır!')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'İçerik üretilemedi')
    } finally {
      setGenContent(false)
    }
  }

  /* ── Image generation ─────────────────────────────────────────────── */

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

  /* ── Test email ────────────────────────────────────────────────────── */

  async function sendTestEmail() {
    setSendingTest(true)
    try {
      const res = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: ai.subject,
          previewText: ai.previewText,
          headline: ai.headline,
          body: ai.body,
          ctaText: ai.ctaText,
          imageUrl: imageUrl || null,
          discountRate: form.discountRate || null,
          layoutStyle: form.layoutStyle,
          brandColor: form.brandColor || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gönderilemedi')
      notify('success', `Test maili ${data.sentTo} adresine gönderildi`)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Test maili gönderilemedi')
    } finally {
      setSendingTest(false)
    }
  }

  /* ── Save campaign ────────────────────────────────────────────────── */

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
          ctaText: ai.ctaText,
          purpose,
          imageUrl: imageUrl || null,
          imagePrompt: ai.imagePrompt || null,
          layoutStyle: form.layoutStyle || null,
          brandColor: form.brandColor || null,
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

  /* ── Send campaign ────────────────────────────────────────────────── */

  async function sendCampaign() {
    setShowConfirm(false)
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

      notify('success', `${data.sent} kişiye başarıyla gönderildi! ${data.failed ? `(${data.failed} başarısız)` : ''}`)
      setTimeout(() => router.push('/campaigns'), 1800)
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Gönderim başarısız')
    } finally {
      setSending(false)
    }
  }

  /* ── Navigation ───────────────────────────────────────────────────── */

  const canNext = () => {
    if (step === 1) return !!purpose
    if (step === 2) return !!form.name.trim() && !!form.productDescription.trim()
    if (step === 3) return !genContent && !!ai.subject
    return true
  }

  const next = () => { if (canNext()) setStep(s => Math.min(s + 1, 6)) }
  const prev = () => setStep(s => Math.max(s - 1, 1))

  /* ── Render ───────────────────────────────────────────────────────── */

  return (
    <AppShell>
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifs.map(n => (
            <motion.div key={n.id}
              initial={{ opacity: 0, x: 40, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.94 }}
              transition={{ duration: 0.18 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border shadow-2xl max-w-xs ${
                n.type === 'success' ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-300' :
                n.type === 'error'   ? 'bg-red-950/95 border-red-500/30 text-red-300' :
                'bg-blue-950/95 border-blue-500/30 text-blue-300'
              }`}
            >
              {n.type === 'success' ? <Check size={14} /> : n.type === 'error' ? <X size={14} /> : <Info size={14} />}
              <span className="leading-snug">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Send confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="w-12 h-12 rounded-xl bg-[#b3c5ff]/10 flex items-center justify-center mb-4">
                <Send size={22} className="text-[#b3c5ff]" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Kampanyayı gönder?</h3>
              <p className="text-white/40 text-sm mb-1">
                <span className="text-white/70 font-medium">{allSegments.find(s => s.value === form.segment)?.label}</span> segmentine
              </p>
              {recipientCount !== null && (
                <p className="text-white/40 text-sm mb-5">
                  <span className="text-[#b3c5ff] font-bold text-base">{recipientCount.toLocaleString('tr')}</span> kişiye gönderilecek
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:border-white/20 transition-all">İptal</button>
                <button onClick={sendCampaign} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#b3c5ff] to-[#7c9dff] text-[#050505] text-sm font-bold hover:opacity-90 transition-all">Gönder</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen" style={{ background: 'var(--bg-base,#050505)' }}>

        {/* Top bar */}
        <div className="border-b border-white/5 sticky top-0 z-40" style={{ background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(12px)' }}>
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#b3c5ff]/15 flex items-center justify-center">
                  <Sparkles size={15} className="text-[#b3c5ff]" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-white">Yeni AI Kampanya</h1>
                  <p className="text-[11px] text-white/35">{STEPS[step - 1]} · Adım {step}/{STEPS.length}</p>
                </div>
              </div>
              <button onClick={() => router.push('/campaigns')} className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1.5">
                <X size={13} /> İptal
              </button>
            </div>

            {/* Step indicators */}
            <div className="flex items-center">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div className={`flex items-center gap-1.5 transition-opacity ${i + 1 === step ? 'opacity-100' : i + 1 < step ? 'opacity-70' : 'opacity-25'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                      i + 1 < step  ? 'bg-[#b3c5ff] text-[#050505]' :
                      i + 1 === step ? 'border-2 border-[#b3c5ff] text-[#b3c5ff]' :
                      'border border-white/20 text-white/30'
                    }`}>
                      {i + 1 < step ? <Check size={10} /> : i + 1}
                    </div>
                    <span className="text-[11px] hidden sm:block text-white/60">{label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${i + 1 < step ? 'bg-[#b3c5ff]/40' : 'bg-white/8'}`} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-6 py-10">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Purpose ────────────────────────────── */}
            {step === 1 && (
              <motion.div key="s1" {...slide}>
                <StepHeader step={1} title="Kampanya amacını seç" sub="AI sana özel içerik üretmek için kampanyanın amacını bilmek istiyor" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PURPOSES.map(p => {
                    const sel = purpose === p.id
                    return (
                      <button key={p.id} onClick={() => setPurpose(p.id)}
                        className={`relative text-left p-4 rounded-2xl border transition-all duration-200 group ${
                          sel ? `bg-gradient-to-br ${p.from} to-transparent ${p.border.replace('/25', '/60')} scale-[1.02]`
                              : `bg-[#111] ${p.border} ${p.hov} border hover:scale-[1.01]`
                        }`}
                      >
                        {sel && <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#b3c5ff] flex items-center justify-center"><Check size={9} className="text-[#050505]" /></div>}
                        <p.Icon size={18} className={`mb-2.5 transition-colors ${sel ? 'text-white' : 'text-white/45 group-hover:text-white/65'}`} />
                        <div className="font-semibold text-xs text-white mb-1 leading-snug">{p.label}</div>
                        <div className="text-[11px] text-white/35 leading-relaxed">{p.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Details ────────────────────────────── */}
            {step === 2 && (
              <motion.div key="s2" {...slide}>
                <StepHeader step={2} title="Kampanya detayları" sub="Bu bilgilerle AI sana özel e-posta içeriği üretecek" />
                <div className="max-w-2xl space-y-5">
                  <Field label="Kampanya Adı *">
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Yaz Sonu İndirim Kampanyası" className="inp" />
                  </Field>

                  <Field label="Ürün / Hizmet Açıklaması *">
                    <textarea value={form.productDescription} onChange={e => setForm(f => ({ ...f, productDescription: e.target.value }))}
                      placeholder="Örn: Premium kadın giyim koleksiyonu — yazlık elbiseler ve plaj kıyafetleri" rows={3} className="inp resize-none" />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="İndirim Oranı (%)">
                      <input type="number" value={form.discountRate} onChange={e => setForm(f => ({ ...f, discountRate: e.target.value }))}
                        placeholder="30" min="0" max="100" className="inp" />
                    </Field>
                    <Field label="Hedef Segment">
                      <select value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} className="inp">
                        {allSegments.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </Field>
                  </div>

                  <Field label="CTA Amacı">
                    <select value={form.ctaPurpose} onChange={e => setForm(f => ({ ...f, ctaPurpose: e.target.value }))} className="inp">
                      {CTA_PURPOSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>

                  <Field label="E-posta Teması">
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {LAYOUT_STYLES.map(ls => (
                        <button key={ls.value} onClick={() => setForm(f => ({ ...f, layoutStyle: ls.value }))}
                          className={`p-2.5 rounded-xl text-left border transition-all ${
                            form.layoutStyle === ls.value
                              ? 'bg-[#b3c5ff]/12 border-[#b3c5ff]/45 text-[#b3c5ff]'
                              : 'bg-[#0e0e0e] border-white/8 text-white/45 hover:border-white/18'
                          }`}>
                          <div className="text-xs font-semibold mb-0.5">{ls.label}</div>
                          <div className="text-[10px] opacity-60 leading-tight">{ls.desc}</div>
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Marka Rengi (opsiyonel)">
                      <div className="flex items-center gap-2">
                        <input type="color" value={form.brandColor || '#2563eb'}
                          onChange={e => setForm(f => ({ ...f, brandColor: e.target.value }))}
                          className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent p-0.5" />
                        <input value={form.brandColor} onChange={e => setForm(f => ({ ...f, brandColor: e.target.value }))}
                          placeholder="#2563eb" className="inp flex-1" />
                      </div>
                    </Field>
                    <Field label="Marka Tonu">
                      <select value={form.brandTone} onChange={e => setForm(f => ({ ...f, brandTone: e.target.value }))} className="inp">
                        {BRAND_TONES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </Field>
                  </div>

                  <Field label="Gönderim Zamanı">
                    <div className="flex gap-2 mt-1">
                      {([true, false] as const).map(v => (
                        <button key={String(v)} onClick={() => setForm(f => ({ ...f, sendNow: v }))}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                            form.sendNow === v
                              ? 'bg-[#b3c5ff]/12 border-[#b3c5ff]/40 text-[#b3c5ff]'
                              : 'bg-[#0e0e0e] border-white/8 text-white/40 hover:border-white/18'
                          }`}>
                          {v ? <><Zap size={12} />Hemen Gönder</> : <><Calendar size={12} />Zamanla</>}
                        </button>
                      ))}
                    </div>
                    {!form.sendNow && (
                      <input type="datetime-local" value={form.sendDate}
                        onChange={e => setForm(f => ({ ...f, sendDate: e.target.value }))} className="inp mt-2" />
                    )}
                  </Field>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: AI Content ─────────────────────────── */}
            {step === 3 && (
              <motion.div key="s3" {...slide}>
                <div className="mb-8 flex items-start justify-between">
                  <StepHeader step={3} title="AI İçerik" sub="Kampanya amacına özel içerik üretildi — dilediğin alanı düzenleyebilirsin" />
                  {!genContent && ai.subject && (
                    <button onClick={generateContent} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111] border border-white/8 hover:border-white/18 text-xs text-white/50 transition-all mt-1 shrink-0">
                      <RefreshCw size={12} /> Yeniden
                    </button>
                  )}
                </div>

                {genContent ? (
                  <div className="flex flex-col items-center justify-center py-28 gap-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-[#b3c5ff]/10 flex items-center justify-center">
                        <Sparkles size={28} className="text-[#b3c5ff]" />
                      </div>
                      <motion.div className="absolute -inset-2 rounded-3xl border border-[#b3c5ff]/20"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.8, repeat: Infinity }} />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-white mb-1">Kampanya içeriği üretiliyor…</p>
                      <p className="text-sm text-white/35">Groq AI analiz ediyor</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl space-y-3">
                    {([
                      { key: 'subject',     label: 'Mail Konusu',            type: 'input',    ph: 'E-posta başlığı…' },
                      { key: 'previewText', label: 'Önizleme Metni',         type: 'input',    ph: 'İnbox önizleme…' },
                      { key: 'headline',    label: 'Başlık',                 type: 'input',    ph: 'Ana e-posta başlığı…' },
                      { key: 'body',        label: 'Açıklama',               type: 'textarea', ph: 'E-posta gövde metni…', rows: 5 },
                      { key: 'ctaText',     label: 'CTA Butonu',             type: 'input',    ph: 'Alışverişe Başla…' },
                      { key: 'imagePrompt', label: 'Görsel Prompt (Fal.ai)', type: 'textarea', ph: 'Görsel açıklaması…', rows: 2 },
                    ] as const).map(f => (
                      <div key={f.key} className="bg-[#0f0f0f] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors group">
                        <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">{f.label}</label>
                        {f.type === 'textarea' ? (
                          <textarea value={ai[f.key]} onChange={e => setAi(a => ({ ...a, [f.key]: e.target.value }))}
                            placeholder={f.ph} rows={f.rows}
                            className="w-full bg-transparent text-sm text-white/85 placeholder:text-white/18 focus:outline-none resize-none leading-relaxed" />
                        ) : (
                          <input value={ai[f.key]} onChange={e => setAi(a => ({ ...a, [f.key]: e.target.value }))}
                            placeholder={f.ph} className="w-full bg-transparent text-sm text-white/85 placeholder:text-white/18 focus:outline-none" />
                        )}
                      </div>
                    ))}

                    {(ai.smsVariant || ai.whatsappVariant) && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        {ai.smsVariant && (
                          <div className="bg-[#0f0f0f] rounded-2xl p-4 border border-white/5">
                            <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">SMS Variant</label>
                            <p className="text-xs text-white/60 leading-relaxed">{ai.smsVariant}</p>
                          </div>
                        )}
                        {ai.whatsappVariant && (
                          <div className="bg-[#0f0f0f] rounded-2xl p-4 border border-white/5">
                            <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">WhatsApp Variant</label>
                            <p className="text-xs text-white/60 leading-relaxed">{ai.whatsappVariant}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 4: Image ──────────────────────────────── */}
            {step === 4 && (
              <motion.div key="s4" {...slide}>
                <div className="mb-8 flex items-start justify-between">
                  <StepHeader step={4} title="Kampanya Görseli" sub="Fal.ai ile e-posta için özel hero görsel oluştur" />
                  {imageUrl && (
                    <button onClick={generateImage} disabled={genImage}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111] border border-white/8 hover:border-white/18 text-xs text-white/50 transition-all mt-1 disabled:opacity-50 shrink-0">
                      <RefreshCw size={12} className={genImage ? 'animate-spin' : ''} /> Yeniden
                    </button>
                  )}
                </div>

                <div className="max-w-xl space-y-4">
                  <div className="bg-[#0f0f0f] rounded-2xl p-4 border border-white/5">
                    <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Görsel Prompt</label>
                    <textarea value={ai.imagePrompt} onChange={e => setAi(a => ({ ...a, imagePrompt: e.target.value }))}
                      rows={3} className="w-full bg-transparent text-sm text-white/85 placeholder:text-white/18 focus:outline-none resize-none" placeholder="Görsel açıklaması…" />
                  </div>

                  {imageUrl ? (
                    <div className="rounded-2xl overflow-hidden border border-white/8 shadow-xl">
                      <img src={imageUrl} alt="Kampanya görseli" className="w-full h-auto block" />
                    </div>
                  ) : (
                    <button onClick={generateImage} disabled={genImage || !ai.imagePrompt}
                      className="w-full py-5 rounded-2xl border border-[#b3c5ff]/22 bg-[#b3c5ff]/5 hover:bg-[#b3c5ff]/8 hover:border-[#b3c5ff]/38 text-[#b3c5ff] font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      {genImage ? <><Loader2 size={18} className="animate-spin" />Görsel oluşturuluyor…</> : <><ImageIcon size={18} />Görsel Oluştur</>}
                    </button>
                  )}
                  <p className="text-center text-xs text-white/22">Görseli atlamak istiyorsanız ileri tuşuna basın</p>
                </div>
              </motion.div>
            )}

            {/* ── STEP 5: Preview ────────────────────────────── */}
            {step === 5 && (
              <motion.div key="s5" {...slide}>
                <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
                  <StepHeader step={5} title="E-posta Önizleme" sub="Müşterilerine ulaşacak mailin canlı önizlemesi" />
                  <div className="flex items-center gap-2">
                    {/* Desktop/mobile toggle */}
                    <div className="flex items-center bg-[#111] border border-white/8 rounded-xl p-1 gap-1">
                      <button onClick={() => setPreviewMode('desktop')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${previewMode === 'desktop' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                        <Monitor size={13} /> Masaüstü
                      </button>
                      <button onClick={() => setPreviewMode('mobile')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${previewMode === 'mobile' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
                        <Smartphone size={13} /> Mobil
                      </button>
                    </div>
                    {/* Test email button */}
                    <button onClick={sendTestEmail} disabled={sendingTest}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111] border border-white/8 hover:border-white/18 text-xs text-white/60 transition-all disabled:opacity-50">
                      {sendingTest ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                      Test Mail
                    </button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div style={{ width: previewMode === 'mobile' ? 375 : 520, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif' }}
                    className="rounded-2xl overflow-hidden shadow-2xl border border-white/8 transition-all duration-300">
                    <EmailPreview
                      storeName="Marka Adı"
                      headline={ai.headline}
                      body={ai.body}
                      ctaText={ai.ctaText}
                      discountRate={form.discountRate}
                      imageUrl={imageUrl}
                      layoutStyle={form.layoutStyle}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 6: Send ───────────────────────────────── */}
            {step === 6 && (
              <motion.div key="s6" {...slide}>
                <StepHeader step={6} title="Kampanyayı Gönder" sub="Her şey hazır. Son onayını ver." />

                <div className="max-w-md space-y-4">
                  {/* Summary */}
                  <div className="bg-[#0f0f0f] rounded-2xl p-5 border border-white/5">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-4">Kampanya Özeti</p>
                    <div className="space-y-2.5">
                      {[
                        { label: 'Kampanya',  value: form.name },
                        { label: 'Amaç',      value: PURPOSES.find(p => p.id === purpose)?.label ?? purpose },
                        { label: 'Segment',   value: allSegments.find(s => s.value === form.segment)?.label ?? form.segment },
                        { label: 'Tema',      value: LAYOUT_STYLES.find(l => l.value === form.layoutStyle)?.label ?? form.layoutStyle },
                        { label: 'Konu',      value: ai.subject },
                        { label: 'CTA',       value: ai.ctaText },
                        { label: 'Görsel',    value: imageUrl ? '✓ Hazır' : 'Yok' },
                        { label: 'Gönderim',  value: form.sendNow ? 'Hemen' : new Date(form.sendDate).toLocaleString('tr-TR') },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between items-start gap-3">
                          <span className="text-xs text-white/35 shrink-0">{r.label}</span>
                          <span className="text-xs text-white/75 text-right line-clamp-2">{r.value || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recipient count */}
                  <div className="bg-[#0f0f0f] rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                    <Users size={16} className="text-[#b3c5ff] shrink-0" />
                    <div>
                      <p className="text-xs text-white/40">Tahmini alıcı sayısı</p>
                      {recipientCount === null ? (
                        <div className="flex items-center gap-1.5 mt-0.5"><Loader2 size={12} className="animate-spin text-white/40" /><span className="text-xs text-white/40">Hesaplanıyor…</span></div>
                      ) : (
                        <p className="text-lg font-bold text-white">{recipientCount.toLocaleString('tr')} <span className="text-xs font-normal text-white/40">kişi</span></p>
                      )}
                    </div>
                  </div>

                  {recipientCount === 0 && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-amber-300/80">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <p className="text-xs leading-relaxed">Bu segmentte gönderilecek müşteri yok. Segment değiştirmeyi deneyin.</p>
                    </div>
                  )}

                  {/* Send button */}
                  <button onClick={() => setShowConfirm(true)} disabled={sending || saving || recipientCount === 0}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#b3c5ff] to-[#7c9dff] text-[#050505] font-bold text-sm flex items-center justify-center gap-2.5 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#b3c5ff]/12">
                    {sending ? <><Loader2 size={16} className="animate-spin" />Gönderiliyor…</> : <><Send size={16} />Kampanyayı Gönder</>}
                  </button>

                  {/* Save draft */}
                  <button onClick={async () => {
                    const id = await saveCampaign()
                    if (id) { notify('success', 'Taslak kaydedildi'); setTimeout(() => router.push('/campaigns'), 1000) }
                  }} disabled={saving}
                    className="w-full py-3 rounded-2xl bg-[#0f0f0f] border border-white/8 hover:border-white/15 text-white/40 text-xs font-medium transition-all disabled:opacity-40">
                    {saving ? <span className="flex items-center justify-center gap-1.5"><Loader2 size={13} className="animate-spin" />Kaydediliyor…</span> : 'Taslak Olarak Kaydet'}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12 max-w-2xl">
            <button onClick={prev}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-white/8 bg-[#0f0f0f] hover:border-white/18 text-white/55 transition-all ${step === 1 ? 'invisible' : ''}`}>
              <ChevronLeft size={15} /> Geri
            </button>
            {step < 6 && (
              <button onClick={next} disabled={!canNext()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#b3c5ff] text-[#050505] hover:bg-[#c5d3ff] active:scale-[0.98] transition-all disabled:opacity-35 disabled:cursor-not-allowed">
                {step === 5 ? 'Gönderiye Geç' : 'Devam Et'} <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global input styles */}
      <style jsx global>{`
        .inp{width:100%;background:#0f0f0f;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:11px 15px;font-size:13px;color:rgba(255,255,255,0.85);transition:border-color .15s;outline:none;font-family:inherit}
        .inp::placeholder{color:rgba(255,255,255,0.18)}
        .inp:focus{border-color:rgba(179,197,255,0.38)}
        .inp option{background:#111;color:white}
      `}</style>
    </AppShell>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function StepHeader({ step, title, sub }: { step: number; title: string; sub: string }) {
  return (
    <div className="mb-8">
      <p className="text-[11px] font-semibold text-[#b3c5ff] uppercase tracking-widest mb-2">Adım {step}</p>
      <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
      <p className="text-white/38 text-sm">{sub}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/45 mb-2">{label}</label>
      {children}
    </div>
  )
}

const PREVIEW_THEMES: Record<string, { headerBg: string; ctaBg: string; ctaColor: string; badgeBg: string }> = {
  luxury:        { headerBg: '#0a0a0a', ctaBg: '#c9a84c', ctaColor: '#000', badgeBg: '#c9a84c' },
  minimal:       { headerBg: '#fff', ctaBg: '#111', ctaColor: '#fff', badgeBg: '#111' },
  'black-friday':{ headerBg: '#000', ctaBg: '#facc15', ctaColor: '#000', badgeBg: '#facc15' },
  skincare:      { headerBg: '#f9f0e8', ctaBg: '#c4806a', ctaColor: '#fff', badgeBg: '#c4806a' },
  fashion:       { headerBg: '#0d0d0d', ctaBg: '#fff', ctaColor: '#000', badgeBg: '#fff' },
  tech:          { headerBg: '#0f172a', ctaBg: '#3b82f6', ctaColor: '#fff', badgeBg: '#3b82f6' },
  furniture:     { headerBg: '#3d2b1f', ctaBg: '#8b6f47', ctaColor: '#fff', badgeBg: '#8b6f47' },
  gaming:        { headerBg: '#0a0a0f', ctaBg: '#7c3aed', ctaColor: '#fff', badgeBg: '#7c3aed' },
  default:       { headerBg: '#0f172a', ctaBg: '#2563eb', ctaColor: '#fff', badgeBg: '#ef4444' },
}

function EmailPreview({ storeName, headline, body, ctaText, discountRate, imageUrl, layoutStyle }:
  { storeName: string; headline: string; body: string; ctaText: string; discountRate: string; imageUrl: string; layoutStyle: string }) {
  const t = PREVIEW_THEMES[layoutStyle] ?? PREVIEW_THEMES.default
  const isLight = ['minimal', 'skincare'].includes(layoutStyle)

  return (
    <div style={{ background: '#fff' }}>
      {/* Header */}
      <div style={{ background: t.headerBg, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: isLight ? '#111' : '#fff', fontSize: '17px', fontWeight: 800 }}>{storeName}</span>
        {discountRate && (
          <span style={{ background: t.badgeBg, color: isLight ? '#fff' : '#000', fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '100px' }}>
            %{discountRate} İNDİRİM
          </span>
        )}
      </div>

      {/* Hero image */}
      {imageUrl && <img src={imageUrl} alt="" style={{ width: '100%', display: 'block' }} />}

      {/* Content */}
      <div style={{ padding: '32px 28px', background: '#fff' }}>
        <h1 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
          {headline || 'Kampanya Başlığı'}
        </h1>
        <div style={{ fontSize: '14px', lineHeight: 1.75, color: '#475569', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
          {body || 'Kampanya açıklaması burada görünecek…'}
        </div>

        {discountRate && (
          <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '2px dashed #f59e0b', borderRadius: '12px', padding: '14px 20px', textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#92400e', fontWeight: 600, textTransform: 'uppercase' }}>Özel Fırsat</p>
            <p style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 900, color: '#78350f', letterSpacing: '2px' }}>%{discountRate} TASARRUF</p>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: t.ctaBg, color: t.ctaColor, fontSize: '14px', fontWeight: 700, padding: '13px 32px', borderRadius: '10px' }}>
            {ctaText || 'Alışverişe Başla'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#f8fafc', padding: '14px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Marksio tarafından gönderildi</span>
        <span style={{ fontSize: '11px', color: '#64748b', textDecoration: 'underline', cursor: 'pointer' }}>Aboneliği iptal et</span>
      </div>
    </div>
  )
}
