'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  Mail, MessageSquare, ArrowLeft, ArrowRight, Check,
  Loader2, Sparkles, Users, Send, Eye, Monitor, Smartphone,
  X, CheckCircle2, Calendar, Clock,
} from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'

/* ── Types ─────────────────────────────────────────────────────────── */

interface Segment {
  id: string
  name: string
  customerCount: number
  type: string
}

type TemplateKey = 'promo' | 'welcome' | 'cart' | 'order' | 'winback'

interface ContentFields {
  title: string
  body: string
  ctaText: string
  ctaUrl: string
  brandColor: string
}

interface WizardData {
  name: string
  subject: string
  previewText: string
  senderName: string
  senderEmail: string
  segmentIds: string[]
  templateKey: TemplateKey
  content: ContentFields
  timing: 'now' | 'scheduled'
  scheduledAt: string
  scheduledTime: string
}

const INITIAL: WizardData = {
  name: '',
  subject: '',
  previewText: '',
  senderName: '',
  senderEmail: '',
  segmentIds: [],
  templateKey: 'promo',
  content: { title: '', body: '', ctaText: 'Şimdi İncele', ctaUrl: '', brandColor: '#4470ff' },
  timing: 'now',
  scheduledAt: '',
  scheduledTime: '10:00',
}

const TEMPLATES: Record<TemplateKey, { label: string; accent: string }> = {
  promo:   { label: 'Promosyon',  accent: '#4470ff' },
  welcome: { label: 'Hoş Geldin', accent: '#22c97a' },
  cart:    { label: 'Sepet Terk', accent: '#f0a020' },
  order:   { label: 'Sipariş',    accent: '#9f7afa' },
  winback: { label: 'Geri Kazan', accent: '#e84545' },
}

const STEPS = [
  { label: 'Temel Bilgiler', desc: 'Ad, konu, gönderen' },
  { label: 'Alıcılar',       desc: 'Segment seçimi'     },
  { label: 'İçerik',         desc: 'Şablon ve metin'    },
  { label: 'Zamanlama',      desc: 'Gönderim zamanı'    },
  { label: 'Gönder',         desc: 'Özet ve gönderim'   },
]

/* ── Shared UI ──────────────────────────────────────────────────────── */

const inp = 'w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none'
const inpSt = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: '#eeeef4' }

function Lbl({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#8080a0' }}>{children}</label>
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <Lbl>{label}</Lbl>
      {children}
      {hint && <p className="mt-1 text-[10px]" style={{ color: '#33334a' }}>{hint}</p>}
    </div>
  )
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-[13px] font-semibold"
      style={{
        background: type === 'success' ? 'rgba(34,201,122,0.12)' : 'rgba(232,69,69,0.12)',
        border: `1px solid ${type === 'success' ? 'rgba(34,201,122,0.3)' : 'rgba(232,69,69,0.3)'}`,
        color: type === 'success' ? '#22c97a' : '#e84545',
        backdropFilter: 'blur(20px)',
      }}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  )
}

/* ── Email Preview ──────────────────────────────────────────────────── */

function EmailPreview({ content, mode }: { content: ContentFields; mode: 'desktop' | 'mobile' }) {
  const w = mode === 'mobile' ? 300 : 460
  return (
    <div style={{ width: w, margin: '0 auto', fontFamily: 'system-ui,sans-serif', transition: 'width 0.3s' }}>
      <div style={{ background: '#f4f4f4', borderRadius: '8px 8px 0 0', padding: '8px 12px', fontSize: 11, color: '#777', border: '1px solid #e0e0e0' }}>
        Konu: {content.title || '(konu yok)'}
      </div>
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
        <div style={{ background: content.brandColor, padding: 24, textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '5px 14px', color: '#fff', fontSize: 12, fontWeight: 700 }}>
            LOGO
          </span>
        </div>
        <div style={{ padding: 24 }}>
          <h2 style={{ fontSize: mode === 'mobile' ? 17 : 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 12, lineHeight: 1.3 }}>
            {content.title || 'Başlık buraya gelecek'}
          </h2>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#555', marginBottom: 20 }}>
            {content.body || 'E-posta içeriği buraya gelecek. Müşterilerinize ulaşacak ana mesajınızı yazın.'}
          </p>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ display: 'inline-block', background: content.brandColor, color: '#fff', padding: '11px 26px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
              {content.ctaText || 'Şimdi İncele'}
            </span>
          </div>
        </div>
        <div style={{ background: '#f9f9f9', borderTop: '1px solid #eee', padding: '10px 24px', fontSize: 10, color: '#aaa', textAlign: 'center' }}>
          Bu e-posta Marksio aracılığıyla gönderilmiştir. · Abonelikten çık
        </div>
      </div>
    </div>
  )
}

/* ── Confetti ───────────────────────────────────────────────────────── */

function Confetti() {
  const colors = ['#4470ff', '#22c97a', '#9f7afa', '#f0a020', '#e84545', '#fff']
  return (
    <>
      <style>{`@keyframes cfFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} style={{
          position: 'fixed', top: -10, left: `${Math.random() * 100}%`,
          width: Math.random() * 8 + 4, height: Math.random() * 8 + 4,
          background: colors[Math.floor(Math.random() * colors.length)],
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animation: `cfFall ${Math.random() * 2 + 1.5}s ${Math.random() * 1.5}s linear forwards`,
          zIndex: 9999, pointerEvents: 'none',
        }} />
      ))}
    </>
  )
}

/* ── Main ───────────────────────────────────────────────────────────── */

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>(INITIAL)
  const [segments, setSegments] = useState<Segment[]>([])
  const [segLoading, setSegLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSubjects, setAiSubjects] = useState<string[]>([])
  const [testEmail, setTestEmail] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const update = useCallback((fields: Partial<WizardData>) => setData(p => ({ ...p, ...fields })), [])
  const updateContent = (fields: Partial<ContentFields>) =>
    setData(p => ({ ...p, content: { ...p.content, ...fields } }))

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    if (step === 2 && segments.length === 0) {
      setSegLoading(true)
      fetch('/api/segments')
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setSegments(d); else if (d.segments) setSegments(d.segments) })
        .catch(() => {})
        .finally(() => setSegLoading(false))
    }
  }, [step, segments.length])

  const recipientCount = segments
    .filter(s => data.segmentIds.includes(s.id))
    .reduce((sum, s) => sum + (s.customerCount ?? 0), 0)

  const fetchAiSubjects = async () => {
    if (!data.name) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'subjects', name: data.name }),
      })
      const d = await res.json()
      if (Array.isArray(d.subjects)) setAiSubjects(d.subjects)
    } catch { /* */ }
    finally { setAiLoading(false) }
  }

  const fillWithAi = async () => {
    if (!data.name) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'content', name: data.name, campaignType: data.templateKey }),
      })
      const d = await res.json()
      if (d.title) updateContent({ title: d.title, body: d.body ?? '', ctaText: d.ctaText ?? 'Şimdi İncele' })
    } catch { /* */ }
    finally { setAiLoading(false) }
  }

  const saveCampaign = async (): Promise<string | null> => {
    try {
      const scheduledAt = data.timing === 'scheduled' && data.scheduledAt
        ? new Date(`${data.scheduledAt}T${data.scheduledTime}`).toISOString()
        : null
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          type: 'email',
          subject: data.subject,
          previewText: data.previewText,
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          segmentIds: data.segmentIds,
          templateKey: data.templateKey,
          content: data.content,
          scheduledAt,
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? 'Hata') }
      const created = await res.json()
      setCampaignId(created.id)
      return created.id as string
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Kampanya oluşturulamadı', 'error')
      return null
    }
  }

  const handleSend = async () => {
    setSaving(true)
    try {
      const id = campaignId ?? await saveCampaign()
      if (!id) return
      if (data.timing === 'scheduled') {
        showToast('Kampanya zamanlandı!')
        setShowConfetti(true)
        setSuccess(true)
        setTimeout(() => router.push('/campaigns'), 2500)
        return
      }
      const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error ?? 'Gönderim başarısız') }
      setShowConfetti(true)
      setSuccess(true)
      setTimeout(() => router.push('/campaigns'), 2500)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gönderim başarısız', 'error')
    } finally { setSaving(false) }
  }

  const handleTestEmail = async () => {
    if (!testEmail.trim()) return
    setTestSending(true)
    try {
      const id = campaignId ?? await saveCampaign()
      if (!id) return
      const res = await fetch(`/api/campaigns/${id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      })
      const d = await res.json()
      if (d.success) showToast(`Test e-postası ${testEmail} adresine gönderildi`)
      else showToast(d.error ?? 'Test gönderilemedi', 'error')
    } catch { showToast('Test gönderilemedi', 'error') }
    finally { setTestSending(false) }
  }

  /* ── Step 0: Type Selection ──────────────────────────────────────── */
  if (step === 0) {
    return (
      <AppShell>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
        <div className="flex items-center gap-3 px-6 h-14 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,15,0.95)', backdropFilter: 'blur(24px)' }}>
          <button onClick={() => router.push('/campaigns')}
            className="p-1.5 rounded-lg transition-all" style={{ color: '#44445a', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-[15px] font-bold" style={{ color: '#eeeef4' }}>Yeni Kampanya</h1>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-10">
              <p className="text-[26px] font-bold mb-2" style={{ color: '#eeeef4' }}>Kampanya türünü seçin</p>
              <p className="text-[14px]" style={{ color: '#8080a0' }}>Doğru kanalı seçerek başlayın</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  key: 'email' as const,
                  Icon: Mail,
                  label: 'E-posta Kampanyası',
                  desc: 'Segmentlere profesyonel e-posta gönderin. Şablon seçin, AI ile içerik oluşturun.',
                  color: '#4470ff',
                  bg: 'rgba(68,112,255,0.06)',
                  border: 'rgba(68,112,255,0.2)',
                  hoverBg: 'rgba(68,112,255,0.12)',
                  hoverBorder: 'rgba(68,112,255,0.4)',
                },
                {
                  key: 'whatsapp' as const,
                  Icon: MessageSquare,
                  label: 'WhatsApp Kampanyası',
                  desc: 'Toplu WhatsApp mesajı gönderin. Kişiselleştirilmiş mesajlarla doğrudan ulaşın.',
                  color: '#22c97a',
                  bg: 'rgba(34,201,122,0.06)',
                  border: 'rgba(34,201,122,0.2)',
                  hoverBg: 'rgba(34,201,122,0.12)',
                  hoverBorder: 'rgba(34,201,122,0.4)',
                },
              ].map(opt => (
                <button key={opt.key}
                  onClick={() => {
                    if (opt.key === 'whatsapp') { router.push('/whatsapp?tab=campaigns'); return }
                    setStep(1)
                  }}
                  className="p-8 rounded-2xl text-left transition-all duration-200"
                  style={{ background: opt.bg, border: `1px solid ${opt.border}` }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = opt.hoverBg
                    e.currentTarget.style.borderColor = opt.hoverBorder
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = opt.bg
                    e.currentTarget.style.borderColor = opt.border
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: `${opt.color}20`, border: `1px solid ${opt.color}30` }}>
                    <opt.Icon className="w-7 h-7" style={{ color: opt.color }} />
                  </div>
                  <p className="text-[17px] font-bold mb-2" style={{ color: '#eeeef4' }}>{opt.label}</p>
                  <p className="text-[13px] leading-relaxed" style={{ color: '#8080a0' }}>{opt.desc}</p>
                  <div className="mt-5 flex items-center gap-1 text-[12px] font-semibold" style={{ color: opt.color }}>
                    Başla <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  /* ── Steps 1–5: Email Wizard ─────────────────────────────────────── */

  return (
    <AppShell>
      {showConfetti && <Confetti />}
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 h-14 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,15,0.95)', backdropFilter: 'blur(24px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => step === 1 ? setStep(0) : setStep(s => s - 1)}
            className="p-1.5 rounded-lg transition-all" style={{ color: '#44445a', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-[15px] font-bold" style={{ color: '#eeeef4' }}>Yeni Kampanya</h1>
          <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(68,112,255,0.12)', color: '#99b4ff' }}>
            Adım {step} / {STEPS.length}
          </span>
        </div>

        {/* Progress bar (desktop) */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs mx-8">
          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(step / STEPS.length) * 100}%`, background: 'linear-gradient(90deg,#4470ff,#9f7afa)' }} />
          </div>
          <span className="text-[11px] shrink-0" style={{ color: '#44445a' }}>{Math.round((step / STEPS.length) * 100)}%</span>
        </div>

        <button onClick={() => router.push('/campaigns')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
          <X className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Kaydet &amp; Çık</span>
        </button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left sidebar ── */}
        <div className="hidden md:flex w-56 shrink-0 flex-col p-5 gap-1"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>

          {data.name && (
            <div className="mb-4 p-3 rounded-xl" style={{ background: 'rgba(68,112,255,0.08)', border: '1px solid rgba(68,112,255,0.15)' }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: '#4470ff' }}>E-POSTA</p>
              <p className="text-[12px] font-semibold truncate" style={{ color: '#eeeef4' }}>{data.name}</p>
            </div>
          )}

          {STEPS.map((s, i) => {
            const idx = i + 1
            const active = step === idx
            const done = step > idx
            return (
              <button key={s.label}
                onClick={() => done ? setStep(idx) : undefined}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left w-full transition-all"
                style={{
                  background: active ? 'rgba(68,112,255,0.1)' : 'transparent',
                  border: active ? '1px solid rgba(68,112,255,0.2)' : '1px solid transparent',
                  cursor: done ? 'pointer' : 'default',
                }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold transition-all"
                  style={{
                    background: done ? '#4470ff' : active ? 'rgba(68,112,255,0.2)' : 'rgba(255,255,255,0.06)',
                    color: done ? '#fff' : active ? '#4470ff' : '#44445a',
                  }}>
                  {done ? <Check className="w-3 h-3" /> : idx}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold truncate"
                    style={{ color: active ? '#99b4ff' : done ? '#8080a0' : '#44445a' }}>
                    {s.label}
                  </p>
                  <p className="text-[10px]" style={{ color: active ? '#5588cc' : '#2a2a40' }}>{s.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-auto">

          {/* ── Step 1: Basic Info ── */}
          {step === 1 && (
            <div className="p-5 md:p-7 max-w-2xl space-y-5">
              <div>
                <h2 className="text-[18px] font-bold mb-1" style={{ color: '#eeeef4' }}>Temel Bilgiler</h2>
                <p className="text-[13px]" style={{ color: '#44445a' }}>Kampanyanıza isim verin ve e-posta detaylarını girin.</p>
              </div>

              <Field label="Kampanya Adı">
                <input value={data.name} onChange={e => update({ name: e.target.value })}
                  placeholder="Yaz Sezonu İndirimi 2026" className={inp} style={inpSt} />
              </Field>

              <div>
                <Lbl>Konu Satırı</Lbl>
                <div className="flex gap-2">
                  <input value={data.subject} onChange={e => { update({ subject: e.target.value }); setAiSubjects([]) }}
                    placeholder="☀️ Yaz fırsatları başladı — %30 indirim"
                    className={cn(inp, 'flex-1')} style={inpSt} />
                  <button onClick={fetchAiSubjects} disabled={!data.name || aiLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold shrink-0 disabled:opacity-40 transition-all"
                    style={{ background: 'rgba(159,122,250,0.1)', color: '#9f7afa', border: '1px solid rgba(159,122,250,0.2)' }}>
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI Öner
                  </button>
                </div>
                {aiSubjects.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {aiSubjects.map((s, i) => (
                      <button key={i} onClick={() => { update({ subject: s }); setAiSubjects([]) }}
                        className="w-full text-left px-3 py-2 rounded-xl text-[12px] transition-all"
                        style={{ background: 'rgba(159,122,250,0.06)', border: '1px solid rgba(159,122,250,0.15)', color: '#c4b5fd' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(159,122,250,0.12)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(159,122,250,0.06)')}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-[10px]" style={{ color: '#33334a' }}>{data.subject.length}/150</p>
              </div>

              <Field label="Ön İzleme Metni" hint="E-posta istemcisinde konu satırından sonra görünür">
                <input value={data.previewText} onChange={e => update({ previewText: e.target.value })}
                  placeholder="Sadece bu hafta geçerli özel teklifler..." className={inp} style={inpSt} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Gönderen Adı">
                  <input value={data.senderName} onChange={e => update({ senderName: e.target.value })}
                    placeholder="Mağaza Adı" className={inp} style={inpSt} />
                </Field>
                <Field label="Gönderen E-posta">
                  <input type="email" value={data.senderEmail} onChange={e => update({ senderEmail: e.target.value })}
                    placeholder="noreply@marksio.com" className={inp} style={inpSt} />
                </Field>
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => setStep(2)} disabled={!data.name.trim() || !data.subject.trim()}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40 transition-all"
                  style={{ background: '#4470ff', color: '#fff' }}>
                  Devam <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Recipients ── */}
          {step === 2 && (
            <div className="p-5 md:p-7 max-w-3xl">
              <div className="mb-6">
                <h2 className="text-[18px] font-bold mb-1" style={{ color: '#eeeef4' }}>Alıcıları Seç</h2>
                <p className="text-[13px]" style={{ color: '#44445a' }}>E-postanın gönderileceği müşteri segmentlerini seçin.</p>
              </div>

              <div className="flex gap-5">
                <div className="flex-1">
                  {segLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#4470ff' }} />
                    </div>
                  ) : segments.length === 0 ? (
                    <div className="flex flex-col items-center py-16 gap-3">
                      <Users className="w-10 h-10" style={{ color: '#33334a' }} />
                      <p className="text-[13px]" style={{ color: '#44445a' }}>Henüz segment oluşturulmadı</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {segments.map(seg => {
                        const sel = data.segmentIds.includes(seg.id)
                        return (
                          <button key={seg.id}
                            onClick={() => update({
                              segmentIds: sel
                                ? data.segmentIds.filter(x => x !== seg.id)
                                : [...data.segmentIds, seg.id],
                            })}
                            className="w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all"
                            style={{
                              background: sel ? 'rgba(68,112,255,0.08)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${sel ? 'rgba(68,112,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                            }}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                                style={{
                                  background: sel ? '#4470ff' : 'rgba(255,255,255,0.06)',
                                  border: sel ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                }}>
                                {sel && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-[13px] font-medium" style={{ color: sel ? '#99b4ff' : '#eeeef4' }}>
                                {seg.name}
                              </span>
                            </div>
                            <span className="text-[11px]" style={{ color: '#44445a' }}>
                              {formatNumber(seg.customerCount ?? 0)} kişi
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="w-48 shrink-0">
                  <div className="sticky top-0 p-4 rounded-xl space-y-2.5"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#44445a' }}>Tahmini Erişim</p>
                    <p className="text-[14px] font-bold" style={{ color: '#eeeef4' }}>👥 {formatNumber(recipientCount)}</p>
                    <div className="space-y-1.5 text-[12px]">
                      <p style={{ color: '#4470ff' }}>📧 {formatNumber(recipientCount)} e-posta</p>
                      <p style={{ color: '#44445a' }}>🚫 0 abonelikten çıkmış</p>
                    </div>
                    {data.segmentIds.length > 0 && (
                      <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <p className="text-[10px]" style={{ color: '#44445a' }}>{data.segmentIds.length} segment seçildi</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                  <ArrowLeft className="w-3.5 h-3.5" /> Geri
                </button>
                <button onClick={() => setStep(3)} disabled={data.segmentIds.length === 0}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40"
                  style={{ background: '#4470ff', color: '#fff' }}>
                  Devam <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Content ── */}
          {step === 3 && (
            <div className="p-5 md:p-7">
              <div className="mb-5">
                <h2 className="text-[18px] font-bold mb-1" style={{ color: '#eeeef4' }}>İçerik</h2>
                <p className="text-[13px]" style={{ color: '#44445a' }}>E-posta şablonunu seçin ve içeriği özelleştirin.</p>
              </div>

              {/* Template picker */}
              <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
                {(Object.entries(TEMPLATES) as [TemplateKey, { label: string; accent: string }][]).map(([key, t]) => (
                  <button key={key} onClick={() => update({ templateKey: key })}
                    className="px-3.5 py-2 rounded-xl text-[12px] font-semibold shrink-0 transition-all"
                    style={data.templateKey === key
                      ? { background: `${t.accent}18`, border: `1px solid ${t.accent}40`, color: t.accent }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#44445a' }}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-5">
                {/* Form fields */}
                <div className="flex-1 space-y-4" style={{ maxWidth: 320 }}>
                  <Field label="Başlık">
                    <input value={data.content.title} onChange={e => updateContent({ title: e.target.value })}
                      placeholder="E-posta başlığı" className={inp} style={inpSt} />
                  </Field>
                  <Field label="İçerik Metni">
                    <textarea value={data.content.body} onChange={e => updateContent({ body: e.target.value })}
                      rows={4} placeholder="Ana e-posta metni..."
                      className={cn(inp, 'resize-none')} style={inpSt} />
                  </Field>
                  <Field label="Buton Metni">
                    <input value={data.content.ctaText} onChange={e => updateContent({ ctaText: e.target.value })}
                      placeholder="Şimdi İncele" className={inp} style={inpSt} />
                  </Field>
                  <Field label="Buton URL">
                    <input type="url" value={data.content.ctaUrl} onChange={e => updateContent({ ctaUrl: e.target.value })}
                      placeholder="https://..." className={inp} style={inpSt} />
                  </Field>
                  <Field label="Marka Rengi">
                    <div className="flex items-center gap-2">
                      <input type="color" value={data.content.brandColor}
                        onChange={e => updateContent({ brandColor: e.target.value })}
                        className="w-10 h-10 rounded-lg cursor-pointer"
                        style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', padding: 2 }} />
                      <input value={data.content.brandColor} onChange={e => updateContent({ brandColor: e.target.value })}
                        className={cn(inp, 'flex-1')} style={inpSt} />
                    </div>
                  </Field>
                  <button onClick={fillWithAi} disabled={!data.name || aiLoading}
                    className="flex items-center gap-1.5 w-full justify-center px-4 py-2.5 rounded-xl text-[12px] font-bold disabled:opacity-40 transition-all"
                    style={{ background: 'rgba(159,122,250,0.1)', color: '#9f7afa', border: '1px solid rgba(159,122,250,0.2)' }}>
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    AI ile Doldur
                  </button>
                </div>

                {/* Preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold" style={{ color: '#44445a' }}>Canlı Önizleme</p>
                    <div className="flex items-center gap-1 p-0.5 rounded-lg"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {([['desktop', Monitor], ['mobile', Smartphone]] as const).map(([mode, Icon]) => (
                        <button key={mode} onClick={() => setPreviewMode(mode)}
                          className="p-1.5 rounded-md transition-all"
                          style={previewMode === mode ? { background: 'rgba(255,255,255,0.1)', color: '#eeeef4' } : { color: '#44445a' }}>
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl overflow-auto" style={{ background: '#ebebeb', padding: 16, maxHeight: 480 }}>
                    <EmailPreview content={data.content} mode={previewMode} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                <button onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                  <ArrowLeft className="w-3.5 h-3.5" /> Geri
                </button>
                <button onClick={() => setStep(4)} disabled={!data.content.title.trim()}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40"
                  style={{ background: '#4470ff', color: '#fff' }}>
                  Devam <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Timing ── */}
          {step === 4 && (
            <div className="p-5 md:p-7 max-w-2xl space-y-5">
              <div>
                <h2 className="text-[18px] font-bold mb-1" style={{ color: '#eeeef4' }}>Zamanlama</h2>
                <p className="text-[13px]" style={{ color: '#44445a' }}>E-postanın ne zaman gönderileceğini seçin.</p>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'now' as const,       Icon: Send,     label: 'Hemen Gönder',  desc: "Kaydet'e bastığında hemen gönderilir" },
                  { key: 'scheduled' as const, Icon: Calendar, label: 'Zamanla',        desc: 'Belirlediğin tarih ve saatte otomatik gönderilir' },
                ].map(opt => {
                  const active = data.timing === opt.key
                  return (
                    <button key={opt.key} onClick={() => update({ timing: opt.key })}
                      className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
                      style={{
                        background: active ? 'rgba(68,112,255,0.08)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${active ? 'rgba(68,112,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: active ? 'rgba(68,112,255,0.15)' : 'rgba(255,255,255,0.05)' }}>
                        <opt.Icon className="w-4 h-4" style={{ color: active ? '#4470ff' : '#44445a' }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold" style={{ color: active ? '#99b4ff' : '#eeeef4' }}>{opt.label}</p>
                        <p className="text-[11px]" style={{ color: '#44445a' }}>{opt.desc}</p>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                        style={{ borderColor: active ? '#4470ff' : 'rgba(255,255,255,0.2)' }}>
                        {active && <div className="w-2 h-2 rounded-full" style={{ background: '#4470ff' }} />}
                      </div>
                    </button>
                  )
                })}
              </div>

              {data.timing === 'scheduled' && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tarih">
                    <input type="date" value={data.scheduledAt} onChange={e => update({ scheduledAt: e.target.value })}
                      min={new Date().toISOString().split('T')[0]} className={inp} style={inpSt} />
                  </Field>
                  <Field label="Saat">
                    <input type="time" value={data.scheduledTime} onChange={e => update({ scheduledTime: e.target.value })}
                      className={inp} style={inpSt} />
                  </Field>
                </div>
              )}

              <div className="p-3.5 rounded-xl text-[12px] leading-relaxed"
                style={{ background: 'rgba(68,112,255,0.05)', border: '1px solid rgba(68,112,255,0.12)', color: '#8080a0' }}>
                <Clock className="w-3.5 h-3.5 inline mr-1.5 align-middle" style={{ color: '#99b4ff' }} />
                <strong style={{ color: '#99b4ff' }}>En iyi gönderim zamanı:</strong> Salı–Perşembe arası 10:00–11:00 veya 14:00–15:00 saatleri en yüksek açılma oranı sağlar.
              </div>

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                  <ArrowLeft className="w-3.5 h-3.5" /> Geri
                </button>
                <button onClick={() => setStep(5)} disabled={data.timing === 'scheduled' && !data.scheduledAt}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40"
                  style={{ background: '#4470ff', color: '#fff' }}>
                  Devam <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Send ── */}
          {step === 5 && (
            <div className="p-5 md:p-7 max-w-3xl">
              <div className="mb-6">
                <h2 className="text-[18px] font-bold mb-1" style={{ color: '#eeeef4' }}>🎉 Kampanya hazır!</h2>
                <p className="text-[13px]" style={{ color: '#44445a' }}>Her şeyi kontrol edin ve kampanyayı başlatın.</p>
              </div>

              {success ? (
                <div className="flex flex-col items-center py-20 gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(34,201,122,0.15)' }}>
                    <CheckCircle2 className="w-8 h-8" style={{ color: '#22c97a' }} />
                  </div>
                  <p className="text-[18px] font-bold" style={{ color: '#eeeef4' }}>
                    Kampanya {data.timing === 'scheduled' ? 'zamanlandı' : 'gönderildi'}!
                  </p>
                  <p className="text-[13px]" style={{ color: '#44445a' }}>Kampanyalar sayfasına yönlendiriliyorsunuz…</p>
                  <Loader2 className="w-5 h-5 animate-spin mt-2" style={{ color: '#4470ff' }} />
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row gap-5 mb-6">
                    {/* Summary */}
                    <div className="flex-1 space-y-3">
                      <div className="p-4 rounded-xl space-y-2.5"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#44445a' }}>Özet</p>
                        {[
                          { icon: '📧', label: 'Kampanya', value: data.name },
                          { icon: '✉️', label: 'Konu',     value: data.subject },
                          { icon: '👥', label: 'Alıcı',    value: `${formatNumber(recipientCount)} kişi` },
                          { icon: '🎨', label: 'Şablon',   value: TEMPLATES[data.templateKey].label },
                          { icon: '⏰', label: 'Zamanlama',
                            value: data.timing === 'now' ? 'Hemen' : `${data.scheduledAt} ${data.scheduledTime}` },
                        ].map(item => (
                          <div key={item.label} className="flex items-baseline gap-1.5 text-[12px]">
                            <span className="shrink-0">{item.icon}</span>
                            <span style={{ color: '#44445a' }}>{item.label}:</span>
                            <span className="font-semibold truncate" style={{ color: '#eeeef4' }}>{item.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Test email */}
                      <div className="p-4 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#44445a' }}>Test E-postası</p>
                        <div className="flex gap-2">
                          <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
                            placeholder="ornek@email.com" type="email"
                            className={cn(inp, 'flex-1')} style={inpSt} />
                          <button onClick={handleTestEmail} disabled={!testEmail.trim() || testSending}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold shrink-0 disabled:opacity-40 transition-all"
                            style={{ background: 'rgba(68,112,255,0.12)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.2)' }}>
                            {testSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                            Gönder
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Email preview */}
                    <div className="flex-1 min-w-0">
                      <div className="rounded-xl overflow-auto" style={{ background: '#ebebeb', padding: 12, maxHeight: 360 }}>
                        <EmailPreview content={data.content} mode="desktop" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button onClick={() => setStep(4)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                      <ArrowLeft className="w-3.5 h-3.5" /> Geri
                    </button>
                    <button onClick={handleSend} disabled={saving}
                      className="flex items-center gap-2 px-7 py-3 rounded-xl text-[14px] font-bold disabled:opacity-50 transition-all"
                      style={{ background: '#4470ff', color: '#fff' }}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {saving ? 'Gönderiliyor…' : '🚀 Kampanyayı Başlat'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </AppShell>
  )
}
