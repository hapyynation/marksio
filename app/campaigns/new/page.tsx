'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, MessageSquare, ChevronLeft, ChevronRight, Check, Loader2,
  Sparkles, X, Users, Clock, Smartphone, Monitor, Send,
  Calendar, AlertCircle, Search, Plus, Zap, Eye,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { cn, formatNumber } from '@/lib/utils'

/* ─── Types ─────────────────────────────────────────────────────────────── */

type CampaignType = 'email' | 'whatsapp'
type ContentTab = 'template' | 'html' | 'plain'
type TimingMode = 'now' | 'scheduled'
type PreviewDevice = 'mobile' | 'desktop'

interface Segment {
  id: string; name: string; count: number; color: string; icon: string; type: string
}

interface WizardData {
  type: CampaignType
  // Step 2
  name: string; subject: string; previewText: string
  senderName: string; senderEmail: string
  // Step 3
  segmentIds: string[]
  // Step 4
  templateType: string; contentTab: ContentTab
  templateFields: { logo: string; headline: string; body: string; ctaText: string; ctaUrl: string; brandColor: string }
  htmlContent: string; plainContent: string
  // Step 5
  timing: TimingMode; scheduledDate: string; scheduledTime: string
}

const TEMPLATES = [
  { id: 'promotion',         label: 'Promosyon',    emoji: '🎁', color: '#4470ff' },
  { id: 'welcome',           label: 'Hoş Geldin',   emoji: '👋', color: '#22c97a' },
  { id: 'cart-abandonment',  label: 'Sepet Terk',   emoji: '🛒', color: '#f0a020' },
  { id: 'order-confirmation',label: 'Sipariş',      emoji: '📦', color: '#9f7afa' },
  { id: 'win-back',          label: 'Geri Kazan',   emoji: '💫', color: '#e84545' },
]

const STEPS_EMAIL = [
  { id: 1, label: 'Tür Seç',      icon: Sparkles },
  { id: 2, label: 'Temel Bilgiler', icon: Mail },
  { id: 3, label: 'Alıcılar',     icon: Users },
  { id: 4, label: 'İçerik',       icon: Eye },
  { id: 5, label: 'Zamanlama',    icon: Clock },
  { id: 6, label: 'Gönder',       icon: Send },
]

const INITIAL_DATA: WizardData = {
  type: 'email',
  name: '', subject: '', previewText: '',
  senderName: 'Marksio', senderEmail: 'noreply@mg.marksio.com',
  segmentIds: [],
  templateType: 'promotion', contentTab: 'template',
  templateFields: { logo: '', headline: '', body: '', ctaText: 'Alışverişe Başla', ctaUrl: '', brandColor: '#4470ff' },
  htmlContent: '', plainContent: '',
  timing: 'now', scheduledDate: '', scheduledTime: '14:00',
}

/* ─── Email Preview Renderer ─────────────────────────────────────────────── */

function EmailPreviewFrame({ fields, template, device }: {
  fields: WizardData['templateFields']
  template: string
  device: PreviewDevice
}) {
  const tpl = TEMPLATES.find(t => t.id === template) ?? TEMPLATES[0]
  const html = `
    <html><head><meta charset="utf-8"><style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
      .wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1);}
      .header{background:${fields.brandColor || tpl.color};padding:32px 40px;text-align:center;}
      .logo{color:#fff;font-size:22px;font-weight:800;letter-spacing:-.02em;}
      .body-wrap{padding:40px;}
      .headline{font-size:26px;font-weight:800;color:#111;margin-bottom:12px;line-height:1.25;}
      .body-text{font-size:15px;color:#555;line-height:1.7;margin-bottom:28px;}
      .cta{display:inline-block;background:${fields.brandColor || tpl.color};color:#fff;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;text-decoration:none;}
      .footer{background:#f4f4f8;padding:24px;text-align:center;font-size:12px;color:#999;}
    </style></head><body>
    <div style="padding:20px 0;">
    <div class="wrap">
      <div class="header">
        <div class="logo">${fields.logo || 'LOGO'}</div>
      </div>
      <div class="body-wrap">
        <h1 class="headline">${fields.headline || 'E-posta başlığı buraya gelecek'}</h1>
        <p class="body-text">${fields.body || 'E-posta içeriğiniz buraya gelecek. Müşterilerinizi bilgilendirin ve harekete geçirin.'}</p>
        <a href="${fields.ctaUrl || '#'}" class="cta">${fields.ctaText || 'Hemen İncele'}</a>
      </div>
      <div class="footer">
        Bu e-postayı almak istemiyorsanız <a href="#">aboneliğinizi iptal edin</a>.
      </div>
    </div></div>
  </body></html>`
  return (
    <div className={cn('transition-all duration-300 mx-auto', device === 'mobile' ? 'max-w-[375px]' : 'w-full')}>
      <iframe
        srcDoc={html}
        className="w-full rounded-xl border"
        style={{ height: device === 'mobile' ? 560 : 480, border: '1px solid rgba(255,255,255,0.1)' }}
        sandbox="allow-same-origin"
      />
    </div>
  )
}

/* ─── Confetti ───────────────────────────────────────────────────────────── */

function Confetti() {
  const colors = ['#4470ff', '#22c97a', '#9f7afa', '#f0a020', '#e84545', '#fff']
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 60 }).map((_, i) => (
        <div key={i}
          className="absolute w-2 h-2 rounded-sm animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            background: colors[i % colors.length],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>(INITIAL_DATA)
  const [segments, setSegments] = useState<Segment[]>([])
  const [segSearch, setSegSearch] = useState('')
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('desktop')
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSubjects, setAiSubjects] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [error, setError] = useState('')
  const [direction, setDirection] = useState(1)
  const campaignId = useRef<string | null>(null)

  const totalSteps = data.type === 'email' ? 6 : 5

  // Load segments
  useEffect(() => {
    fetch('/api/segments')
      .then(r => r.json())
      .then((d: unknown) => { if (Array.isArray(d)) setSegments(d) })
      .catch(() => {})
  }, [])

  // Live preview debounce
  useEffect(() => {
    if (step !== 4 || data.contentTab !== 'template') return
    const timer = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const res = await fetch('/api/campaigns/preview-template', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateType: data.templateType, fields: data.templateFields }),
        })
        if (res.ok) { const d = await res.json() as { html?: string }; if (d.html) setPreviewHtml(d.html) }
      } catch { /* silent */ }
      setPreviewLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [step, data.contentTab, data.templateType, data.templateFields])

  const selectedSegments = segments.filter(s => data.segmentIds.includes(s.id))
  const totalRecipients = selectedSegments.reduce((a, s) => a + s.count, 0)
  const filteredSegments = segments.filter(s => !segSearch || s.name.toLowerCase().includes(segSearch.toLowerCase()))

  function update(partial: Partial<WizardData>) {
    setData(d => ({ ...d, ...partial }))
  }

  function updateField(key: keyof WizardData['templateFields'], value: string) {
    setData(d => ({ ...d, templateFields: { ...d.templateFields, [key]: value } }))
  }

  function goNext() {
    setError('')
    if (!validateStep()) return
    setDirection(1)
    setStep(s => Math.min(s + 1, totalSteps))
  }

  function goBack() {
    setError('')
    setDirection(-1)
    setStep(s => Math.max(s - 1, 1))
  }

  function validateStep(): boolean {
    if (step === 2) {
      if (!data.name.trim()) { setError('Kampanya adı gerekli'); return false }
      if (data.type === 'email' && !data.subject.trim()) { setError('Konu satırı gerekli'); return false }
    }
    if (step === 3 && data.segmentIds.length === 0) {
      setError('En az bir alıcı segmenti seçin'); return false
    }
    return true
  }

  async function fetchAiSubjects() {
    if (!data.name) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate-campaign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, type: 'subject_suggestions' }),
      })
      if (res.ok) {
        const d = await res.json() as { subjects?: string[]; subject?: string }
        if (d.subjects) setAiSubjects(d.subjects)
        else if (d.subject) setAiSubjects([d.subject])
      }
    } catch { /* silent */ }
    setAiLoading(false)
  }

  async function fillWithAi() {
    if (!data.name) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/generate-campaign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, templateType: data.templateType, type: 'content' }),
      })
      if (res.ok) {
        const d = await res.json() as { subject?: string; headline?: string; body?: string; ctaText?: string; previewText?: string }
        if (d.subject) update({ subject: d.subject })
        if (d.previewText) update({ previewText: d.previewText })
        if (d.headline) updateField('headline', d.headline)
        if (d.body) updateField('body', d.body)
        if (d.ctaText) updateField('ctaText', d.ctaText)
      }
    } catch { /* silent */ }
    setAiLoading(false)
  }

  async function saveAndSend() {
    setSending(true); setError('')
    try {
      // Create campaign
      const createRes = await fetch('/api/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          subject: data.subject,
          previewText: data.previewText,
          senderName: data.senderName,
          senderEmail: data.senderEmail,
          segment: data.segmentIds.join(','),
          templateType: data.templateType,
          templateFields: data.templateFields,
          body: data.htmlContent || JSON.stringify(data.templateFields),
          scheduledAt: data.timing === 'scheduled' ? `${data.scheduledDate}T${data.scheduledTime}:00` : null,
          status: data.timing === 'now' ? 'draft' : 'scheduled',
        }),
      })
      if (!createRes.ok) { const e = await createRes.json() as { error?: string }; throw new Error(e.error ?? 'Kampanya oluşturulamadı') }
      const created = await createRes.json() as { id?: string }
      campaignId.current = created.id ?? null

      if (data.timing === 'now' && created.id) {
        const sendRes = await fetch(`/api/campaigns/${created.id}/send`, { method: 'POST' })
        if (!sendRes.ok) { const e = await sendRes.json() as { error?: string }; throw new Error(e.error ?? 'Gönderim başarısız') }
      }

      setShowConfetti(true)
      setSaved(true)
      setTimeout(() => {
        setShowConfetti(false)
        router.push('/campaigns')
      }, 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu')
    } finally { setSending(false) }
  }

  async function sendTestEmail() {
    if (!testEmail || !campaignId.current) return
    setTestSending(true)
    try {
      await fetch(`/api/campaigns/${campaignId.current}/preview`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      })
      setTestSent(true)
      setTimeout(() => setTestSent(false), 3000)
    } catch { /* silent */ }
    setTestSending(false)
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' as const } },
    exit:  (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.2 } }),
  }

  const progress = Math.round(((step - 1) / (totalSteps - 1)) * 100)

  return (
    <AppShell>
      {showConfetti && <Confetti />}

      {/* ── Top progress bar ── */}
      <div className="shrink-0 relative h-[3px]" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: 'linear-gradient(90deg,#4470ff,#9f7afa)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 md:px-6 h-13 shrink-0 gap-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,15,0.96)', backdropFilter: 'blur(24px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/campaigns')}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: '#8080a0' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X className="w-4 h-4" />
          </button>
          <div>
            <p className="text-[13px] font-bold" style={{ color: '#eeeef4' }}>
              {data.name || 'Yeni Kampanya'}
            </p>
            <p className="text-[10px]" style={{ color: '#44445a' }}>Adım {step}/{totalSteps}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold" style={{ color: '#44445a' }}>%{progress} tamamlandı</span>
          <button onClick={() => router.push('/campaigns')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
            Kaydet & Çık
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left sidebar steps ── */}
        <div className="hidden md:flex w-[200px] shrink-0 flex-col py-6 px-3 gap-1"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
          {STEPS_EMAIL.slice(0, totalSteps).map((s, i) => {
            const isActive = step === s.id
            const isDone = step > s.id
            const Icon = s.icon
            return (
              <div key={s.id}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all"
                style={isActive ? { background: 'rgba(68,112,255,0.1)' } : {}}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all"
                  style={isDone
                    ? { background: '#22c97a', border: '1px solid #22c97a' }
                    : isActive
                    ? { background: '#4470ff', border: '1px solid #4470ff' }
                    : { background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {isDone
                    ? <Check className="w-3 h-3 text-white" />
                    : <Icon className="w-3 h-3" style={{ color: isActive ? '#fff' : '#44445a' }} />}
                </div>
                <span className="text-[12px] font-semibold"
                  style={{ color: isActive ? '#eeeef4' : isDone ? '#8080a0' : '#44445a' }}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* ── Main content area ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="min-h-full"
              >

                {/* ─── Step 1: Type Selection ─── */}
                {step === 1 && (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
                    <p className="text-[24px] font-bold mb-2 text-center" style={{ color: '#eeeef4' }}>Kampanya türünü seçin</p>
                    <p className="text-[14px] mb-10 text-center" style={{ color: '#8080a0' }}>Doğru kanalı seçerek başlayın</p>
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
                      {[
                        { type: 'email' as const, icon: Mail, label: 'E-posta Kampanyası', desc: 'Segmentlere profesyonel e-posta gönderin', color: '#4470ff', bg: 'rgba(68,112,255,0.08)' },
                        { type: 'whatsapp' as const, icon: MessageSquare, label: 'WhatsApp Kampanyası', desc: 'Toplu WhatsApp mesajı gönderin', color: '#22c97a', bg: 'rgba(34,201,122,0.08)' },
                      ].map(opt => {
                        const Icon = opt.icon
                        const selected = data.type === opt.type
                        return (
                          <button key={opt.type}
                            onClick={() => { update({ type: opt.type }); goNext() }}
                            className="flex-1 p-8 rounded-2xl text-left transition-all group relative overflow-hidden"
                            style={{
                              background: selected ? opt.bg : 'rgba(255,255,255,0.025)',
                              border: `2px solid ${selected ? opt.color + '60' : 'rgba(255,255,255,0.08)'}`,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = opt.bg; e.currentTarget.style.borderColor = opt.color + '40' }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = selected ? opt.bg : 'rgba(255,255,255,0.025)'
                              e.currentTarget.style.borderColor = selected ? opt.color + '60' : 'rgba(255,255,255,0.08)'
                            }}>
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                              style={{ background: `${opt.color}18`, border: `1px solid ${opt.color}30` }}>
                              <Icon className="w-7 h-7" style={{ color: opt.color }} />
                            </div>
                            <p className="text-[16px] font-bold mb-2" style={{ color: '#eeeef4' }}>{opt.label}</p>
                            <p className="text-[13px]" style={{ color: '#8080a0' }}>{opt.desc}</p>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-all"
                              style={{ color: opt.color }} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ─── Step 2: Basic Info ─── */}
                {step === 2 && (
                  <div className="max-w-2xl mx-auto p-6 md:p-10 space-y-6">
                    <div>
                      <p className="text-[22px] font-bold mb-1" style={{ color: '#eeeef4' }}>Temel bilgiler</p>
                      <p className="text-[13px]" style={{ color: '#8080a0' }}>Kampanyanızı tanımlayın</p>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-xl"
                        style={{ background: 'rgba(232,69,69,0.08)', border: '1px solid rgba(232,69,69,0.2)' }}>
                        <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#e84545' }} />
                        <p className="text-[12px]" style={{ color: '#e84545' }}>{error}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold mb-2" style={{ color: '#8080a0' }}>KAMPANYA ADI *</label>
                        <input value={data.name} onChange={e => update({ name: e.target.value })}
                          placeholder="Örn: Yaz Sezonu İndirimi 2026"
                          className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4' }}
                          onFocus={e => (e.currentTarget.style.borderColor = '#4470ff88')}
                          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                        />
                      </div>

                      {data.type === 'email' && (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[11px] font-semibold" style={{ color: '#8080a0' }}>KONU SATIRI *</label>
                              <button onClick={fetchAiSubjects} disabled={aiLoading || !data.name}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40"
                                style={{ background: 'rgba(159,122,250,0.1)', color: '#9f7afa', border: '1px solid rgba(159,122,250,0.2)' }}>
                                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                AI ile öner
                              </button>
                            </div>
                            <input value={data.subject} onChange={e => update({ subject: e.target.value })}
                              placeholder="☀️ Yaz fırsatları başladı — %30 indirim"
                              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4' }}
                              onFocus={e => (e.currentTarget.style.borderColor = '#4470ff88')}
                              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                            <div className="flex items-center justify-between mt-1">
                              <div />
                              <span className="text-[10px]" style={{ color: '#33334a' }}>{data.subject.length}/150</span>
                            </div>
                            {/* AI subject suggestions */}
                            {aiSubjects.length > 0 && (
                              <div className="mt-2 space-y-1.5">
                                {aiSubjects.map((s, i) => (
                                  <button key={i} onClick={() => { update({ subject: s }); setAiSubjects([]) }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] text-left transition-all"
                                    style={{ background: 'rgba(159,122,250,0.06)', border: '1px solid rgba(159,122,250,0.15)', color: '#c4b5fd' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(159,122,250,0.12)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(159,122,250,0.06)')}>
                                    <Sparkles className="w-3 h-3 shrink-0" style={{ color: '#9f7afa' }} />
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold mb-2" style={{ color: '#8080a0' }}>ÖN İZLEME METNİ</label>
                            <input value={data.previewText} onChange={e => update({ previewText: e.target.value })}
                              placeholder="Sadece bu hafta geçerli özel teklifler"
                              className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4' }}
                              onFocus={e => (e.currentTarget.style.borderColor = '#4470ff88')}
                              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                            <div className="flex justify-end mt-1">
                              <span className="text-[10px]" style={{ color: '#33334a' }}>{data.previewText.length}/200</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-semibold mb-2" style={{ color: '#8080a0' }}>GÖNDEREN ADI</label>
                              <input value={data.senderName} onChange={e => update({ senderName: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4' }}
                                onFocus={e => (e.currentTarget.style.borderColor = '#4470ff88')}
                                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold mb-2" style={{ color: '#8080a0' }}>GÖNDEREN E-POSTA</label>
                              <div className="relative">
                                <select value={data.senderEmail} onChange={e => update({ senderEmail: e.target.value })}
                                  className="w-full px-4 py-3 rounded-xl text-[13px] outline-none appearance-none transition-all"
                                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4' }}>
                                  <option value="noreply@mg.marksio.com">noreply@mg.marksio.com</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {data.type === 'whatsapp' && (
                        <div>
                          <label className="block text-[11px] font-semibold mb-2" style={{ color: '#8080a0' }}>KAMPANYA TÜRÜ</label>
                          <div className="space-y-2">
                            {[
                              { value: 'broadcast', label: 'Tek seferlik broadcast' },
                              { value: 'scheduled', label: 'Zamanlanmış' },
                            ].map(opt => (
                              <label key={opt.value} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <input type="radio" value={opt.value} checked={data.timing === opt.value}
                                  onChange={() => update({ timing: opt.value as TimingMode })}
                                  className="accent-blue-500" />
                                <span className="text-[13px]" style={{ color: '#eeeef4' }}>{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ─── Step 3: Recipients ─── */}
                {step === 3 && (
                  <div className="max-w-2xl mx-auto p-6 md:p-10 space-y-6">
                    <div>
                      <p className="text-[22px] font-bold mb-1" style={{ color: '#eeeef4' }}>Alıcıları seçin</p>
                      <p className="text-[13px]" style={{ color: '#8080a0' }}>Bir veya daha fazla segment seçebilirsiniz</p>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-xl"
                        style={{ background: 'rgba(232,69,69,0.08)', border: '1px solid rgba(232,69,69,0.2)' }}>
                        <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#e84545' }} />
                        <p className="text-[12px]" style={{ color: '#e84545' }}>{error}</p>
                      </div>
                    )}

                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#44445a' }} />
                      <input value={segSearch} onChange={e => setSegSearch(e.target.value)}
                        placeholder="Segment veya liste ara..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] outline-none"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4' }} />
                    </div>

                    <div className="space-y-2">
                      {filteredSegments.map(seg => {
                        const selected = data.segmentIds.includes(seg.id)
                        return (
                          <button key={seg.id}
                            onClick={() => update({
                              segmentIds: selected
                                ? data.segmentIds.filter(id => id !== seg.id)
                                : [...data.segmentIds, seg.id],
                            })}
                            className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all text-left"
                            style={{
                              background: selected ? 'rgba(68,112,255,0.1)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${selected ? 'rgba(68,112,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                            }}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px]"
                                style={{ background: `${seg.color || '#4470ff'}15` }}>
                                {seg.icon || '👥'}
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>{seg.name}</p>
                                <p className="text-[11px]" style={{ color: '#44445a' }}>{formatNumber(seg.count)} müşteri</p>
                              </div>
                            </div>
                            <div className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                              style={selected ? { background: '#4470ff' } : { border: '2px solid rgba(255,255,255,0.15)' }}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* Live summary */}
                    {data.segmentIds.length > 0 && (
                      <div className="p-4 rounded-xl" style={{ background: 'rgba(68,112,255,0.06)', border: '1px solid rgba(68,112,255,0.2)' }}>
                        <p className="text-[11px] font-semibold mb-2" style={{ color: '#99b4ff' }}>Tahmini Erişim</p>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" style={{ color: '#99b4ff' }} />
                            <span className="text-[13px] font-bold" style={{ color: '#eeeef4' }}>{formatNumber(totalRecipients)} müşteri</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" style={{ color: '#22c97a' }} />
                            <span className="text-[13px] font-bold" style={{ color: '#eeeef4' }}>{formatNumber(totalRecipients)} geçerli e-posta</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Step 4: Content ─── */}
                {step === 4 && data.type === 'email' && (
                  <div className="p-4 md:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[20px] font-bold" style={{ color: '#eeeef4' }}>İçerik Editörü</p>
                        <p className="text-[12px]" style={{ color: '#8080a0' }}>Şablonunuzu seçin ve özelleştirin</p>
                      </div>
                      <button onClick={fillWithAi} disabled={aiLoading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-50"
                        style={{ background: 'rgba(159,122,250,0.1)', color: '#9f7afa', border: '1px solid rgba(159,122,250,0.2)' }}>
                        {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        AI ile Doldur
                      </button>
                    </div>

                    {/* Content mode tabs */}
                    <div className="flex items-center p-0.5 gap-0.5 rounded-xl w-fit"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {(['template', 'html', 'plain'] as const).map(tab => (
                        <button key={tab} onClick={() => update({ contentTab: tab })}
                          className="px-4 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                          style={data.contentTab === tab
                            ? { background: 'rgba(255,255,255,0.1)', color: '#eeeef4' }
                            : { color: '#44445a' }}>
                          {tab === 'template' ? 'Şablon Seç' : tab === 'html' ? 'HTML Editör' : 'Düz Metin'}
                        </button>
                      ))}
                    </div>

                    {data.contentTab === 'template' && (
                      <div className="grid lg:grid-cols-2 gap-6">
                        {/* Left: Editor */}
                        <div className="space-y-4">
                          {/* Template picker */}
                          <div>
                            <p className="text-[11px] font-semibold mb-2" style={{ color: '#8080a0' }}>ŞABLON</p>
                            <div className="flex gap-2 flex-wrap">
                              {TEMPLATES.map(t => (
                                <button key={t.id} onClick={() => update({ templateType: t.id })}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold transition-all"
                                  style={data.templateType === t.id
                                    ? { background: `${t.color}18`, border: `1px solid ${t.color}50`, color: t.color }
                                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                                  {t.emoji} {t.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Fields */}
                          <div className="space-y-3">
                            {[
                              { key: 'logo' as const,     label: 'Logo / Marka Adı',  placeholder: 'Marksio' },
                              { key: 'headline' as const, label: 'Başlık',             placeholder: 'Yaz fırsatlarını kaçırmayın!' },
                              { key: 'body' as const,     label: 'İçerik',             placeholder: 'Müşterilerinize söyleyin...' },
                              { key: 'ctaText' as const,  label: 'Buton Metni',        placeholder: 'Alışverişe Başla' },
                              { key: 'ctaUrl' as const,   label: 'Buton URL',          placeholder: 'https://magazaniz.com/kampanya' },
                            ].map(f => (
                              <div key={f.key}>
                                <label className="block text-[10px] font-semibold mb-1" style={{ color: '#8080a0' }}>{f.label}</label>
                                {f.key === 'body' ? (
                                  <textarea value={data.templateFields[f.key]} onChange={e => updateField(f.key, e.target.value)}
                                    placeholder={f.placeholder} rows={3}
                                    className="w-full px-3 py-2 rounded-xl text-[12px] outline-none resize-none"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }} />
                                ) : (
                                  <input value={data.templateFields[f.key]} onChange={e => updateField(f.key, e.target.value)}
                                    placeholder={f.placeholder}
                                    className="w-full px-3 py-2 rounded-xl text-[12px] outline-none"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }} />
                                )}
                              </div>
                            ))}
                            <div>
                              <label className="block text-[10px] font-semibold mb-1" style={{ color: '#8080a0' }}>MARKA RENGİ</label>
                              <div className="flex items-center gap-2">
                                <input type="color" value={data.templateFields.brandColor}
                                  onChange={e => updateField('brandColor', e.target.value)}
                                  className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 bg-transparent" />
                                <input value={data.templateFields.brandColor} onChange={e => updateField('brandColor', e.target.value)}
                                  className="flex-1 px-3 py-2 rounded-xl text-[12px] outline-none font-mono"
                                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Preview */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold" style={{ color: '#8080a0' }}>ÖNİZLEME</p>
                            <div className="flex items-center p-0.5 gap-0.5 rounded-lg"
                              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <button onClick={() => setPreviewDevice('desktop')}
                                className="p-1.5 rounded-md transition-all"
                                style={previewDevice === 'desktop' ? { background: 'rgba(255,255,255,0.1)', color: '#eeeef4' } : { color: '#44445a' }}>
                                <Monitor className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setPreviewDevice('mobile')}
                                className="p-1.5 rounded-md transition-all"
                                style={previewDevice === 'mobile' ? { background: 'rgba(255,255,255,0.1)', color: '#eeeef4' } : { color: '#44445a' }}>
                                <Smartphone className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {previewLoading ? (
                            <div className="flex items-center justify-center h-64">
                              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#4470ff' }} />
                            </div>
                          ) : (
                            <EmailPreviewFrame
                              fields={data.templateFields}
                              template={data.templateType}
                              device={previewDevice}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {data.contentTab === 'html' && (
                      <div className="space-y-3">
                        <p className="text-[12px]" style={{ color: '#8080a0' }}>Özel HTML içeriği girin</p>
                        <textarea value={data.htmlContent} onChange={e => update({ htmlContent: e.target.value })}
                          placeholder="<!DOCTYPE html><html>..."
                          rows={16}
                          className="w-full px-4 py-3 rounded-xl text-[12px] outline-none resize-none font-mono"
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }} />
                      </div>
                    )}

                    {data.contentTab === 'plain' && (
                      <div className="space-y-3">
                        <p className="text-[12px]" style={{ color: '#8080a0' }}>Düz metin içeriği girin</p>
                        <textarea value={data.plainContent} onChange={e => update({ plainContent: e.target.value })}
                          placeholder="Merhaba,&#10;&#10;Özel kampanyamız hakkında bilgilendirmek istedik..."
                          rows={12}
                          className="w-full px-4 py-3 rounded-xl text-[13px] outline-none resize-none"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }} />
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Step 5 (WA Step 4 / Email Step 5): Timing ─── */}
                {((data.type === 'email' && step === 5) || (data.type === 'whatsapp' && step === 4)) && (
                  <div className="max-w-xl mx-auto p-6 md:p-10 space-y-6">
                    <div>
                      <p className="text-[22px] font-bold mb-1" style={{ color: '#eeeef4' }}>Ne zaman gönderelim?</p>
                      <p className="text-[13px]" style={{ color: '#8080a0' }}>Hemen gönderin veya ileri tarih belirleyin</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { value: 'now' as const, label: 'Hemen Gönder', desc: 'Kampanyayı başlatınca gönderilir' },
                        { value: 'scheduled' as const, label: 'Zamanla', desc: 'İleri tarih ve saat belirleyin' },
                      ].map(opt => (
                        <label key={opt.value}
                          className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
                          style={{
                            background: data.timing === opt.value ? 'rgba(68,112,255,0.08)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${data.timing === opt.value ? 'rgba(68,112,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                          }}>
                          <input type="radio" value={opt.value} checked={data.timing === opt.value}
                            onChange={() => update({ timing: opt.value })}
                            className="mt-0.5 accent-blue-500" />
                          <div>
                            <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>{opt.label}</p>
                            <p className="text-[11px]" style={{ color: '#8080a0' }}>{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {data.timing === 'scheduled' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-semibold mb-2" style={{ color: '#8080a0' }}>TARİH</label>
                          <input type="date" value={data.scheduledDate} onChange={e => update({ scheduledDate: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4' }} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-2" style={{ color: '#8080a0' }}>SAAT (UTC+3)</label>
                          <input type="time" value={data.scheduledTime} onChange={e => update({ scheduledTime: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl text-[13px] outline-none"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#eeeef4' }} />
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-xl" style={{ background: 'rgba(240,160,32,0.06)', border: '1px solid rgba(240,160,32,0.15)' }}>
                      <p className="text-[11px] font-semibold mb-1" style={{ color: '#f0a020' }}>💡 En iyi gönderim zamanı</p>
                      <p className="text-[11px]" style={{ color: '#8080a0' }}>Salı–Perşembe, 10:00–11:00 veya 14:00–15:00 arası en yüksek açılma oranına sahiptir.</p>
                    </div>

                    {data.type === 'whatsapp' && (
                      <div className="p-4 rounded-xl" style={{ background: 'rgba(232,69,69,0.06)', border: '1px solid rgba(232,69,69,0.15)' }}>
                        <p className="text-[11px] font-semibold mb-1" style={{ color: '#e84545' }}>⚠️ WhatsApp Gönderim Hızı</p>
                        <p className="text-[11px]" style={{ color: '#8080a0' }}>
                          Spam engellemek için mesajlar arasında 1–3 saniye beklenir.
                          {totalRecipients > 0 && ` ${formatNumber(totalRecipients)} mesaj ≈ ~${Math.round(totalRecipients * 2)} saniye`}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Final Step: Review & Send ─── */}
                {step === totalSteps && !saved && (
                  <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6">
                    <div className="text-center">
                      <div className="text-[48px] mb-3">🎉</div>
                      <p className="text-[26px] font-bold mb-2" style={{ color: '#eeeef4' }}>Kampanyanız hazır!</p>
                      <p className="text-[14px]" style={{ color: '#8080a0' }}>Son kontrolleri yapın ve başlatın</p>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-4 rounded-xl"
                        style={{ background: 'rgba(232,69,69,0.08)', border: '1px solid rgba(232,69,69,0.2)' }}>
                        <AlertCircle className="w-4 h-4 shrink-0" style={{ color: '#e84545' }} />
                        <p className="text-[13px]" style={{ color: '#e84545' }}>{error}</p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Summary card */}
                      <div className="rounded-2xl p-6 space-y-4"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <p className="text-[14px] font-bold" style={{ color: '#eeeef4' }}>ÖZET</p>
                        <div className="space-y-3">
                          {[
                            { icon: data.type === 'email' ? '📧' : '💬', label: 'Kanal', value: data.type === 'email' ? 'E-posta' : 'WhatsApp' },
                            { icon: '📝', label: 'Kampanya', value: data.name },
                            ...(data.type === 'email' ? [{ icon: '✉️', label: 'Konu', value: data.subject || '—' }] : []),
                            { icon: '👥', label: 'Alıcı', value: `${formatNumber(totalRecipients)} kişi` },
                            { icon: '📅', label: 'Zaman', value: data.timing === 'now' ? 'Hemen' : `${data.scheduledDate} ${data.scheduledTime}` },
                            { icon: '📊', label: 'Tahmini Açılma', value: '~%24' },
                          ].map(item => (
                            <div key={item.label} className="flex items-center justify-between py-2"
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <span className="text-[12px]" style={{ color: '#8080a0' }}>
                                {item.icon} {item.label}
                              </span>
                              <span className="text-[12px] font-semibold max-w-[180px] text-right truncate" style={{ color: '#eeeef4' }}>
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Test email */}
                        {data.type === 'email' && (
                          <div className="pt-2">
                            <p className="text-[11px] font-semibold mb-2" style={{ color: '#8080a0' }}>TEST MAİLİ GÖNDER</p>
                            <div className="flex gap-2">
                              <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
                                placeholder="ornek@email.com"
                                className="flex-1 px-3 py-2 rounded-xl text-[12px] outline-none"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }} />
                              <button onClick={sendTestEmail} disabled={testSending || !testEmail}
                                className="px-3 py-2 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40"
                                style={{ background: 'rgba(68,112,255,0.1)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.2)' }}>
                                {testSent ? <Check className="w-4 h-4" /> : testSending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gönder'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Email preview */}
                      {data.type === 'email' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold" style={{ color: '#8080a0' }}>E-POSTA ÖNİZLEME</p>
                            <div className="flex items-center p-0.5 gap-0.5 rounded-lg"
                              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <button onClick={() => setPreviewDevice('desktop')}
                                className="p-1 rounded-md"
                                style={previewDevice === 'desktop' ? { background: 'rgba(255,255,255,0.1)', color: '#eeeef4' } : { color: '#44445a' }}>
                                <Monitor className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setPreviewDevice('mobile')}
                                className="p-1 rounded-md"
                                style={previewDevice === 'mobile' ? { background: 'rgba(255,255,255,0.1)', color: '#eeeef4' } : { color: '#44445a' }}>
                                <Smartphone className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <EmailPreviewFrame fields={data.templateFields} template={data.templateType} device={previewDevice} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Success state */}
                {step === totalSteps && saved && (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
                      <div className="w-20 h-20 rounded-full flex items-center justify-center text-[40px]"
                        style={{ background: 'rgba(34,201,122,0.12)', border: '2px solid rgba(34,201,122,0.3)' }}>
                        ✅
                      </div>
                    </motion.div>
                    <p className="text-[24px] font-bold" style={{ color: '#eeeef4' }}>Kampanya gönderiliyor!</p>
                    <p className="text-[14px]" style={{ color: '#8080a0' }}>Kampanya listesine yönlendiriliyorsunuz...</p>
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#4470ff' }} />
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Bottom nav bar ── */}
          {step < totalSteps || !saved ? (
            <div className="shrink-0 flex items-center justify-between px-6 py-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,15,0.95)' }}>
              <button onClick={goBack} disabled={step === 1}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-30"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
                <ChevronLeft className="w-4 h-4" /> Geri
              </button>

              {step === totalSteps ? (
                <motion.button
                  onClick={saveAndSend}
                  disabled={sending}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl text-[14px] font-bold transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#4470ff,#9f7afa)', color: '#fff' }}>
                  {sending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</>
                    : <><Zap className="w-4 h-4" /> 🚀 Kampanyayı Başlat</>}
                </motion.button>
              ) : step === 1 ? null : (
                <button onClick={goNext}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all"
                  style={{ background: '#4470ff', color: '#fff' }}>
                  İleri <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti-fall linear forwards; }
      `}</style>
    </AppShell>
  )
}
