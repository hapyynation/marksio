'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Loader2, Plus, Trash2, Edit2, Check, X, Crown, ChevronRight, Save,
  WifiOff, Send, Bot, User, Globe, FileText, MessageSquare, Clock,
  ShoppingBag, Zap, TrendingUp, Users, Timer, RefreshCw, Upload,
  AlertCircle, FlaskConical,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FAQ {
  id: string
  question: string
  answer: string
}

interface KnowledgeSource {
  id: string
  sourceType: 'WEBSITE_URL' | 'PDF' | 'FAQ_IMPORT' | 'MANUAL'
  title: string | null
  content: string | null
  url: string | null
  fileName: string | null
  storageUrl: string | null
  createdAt: string
}

interface HandoverRule {
  ruleType: string
  enabled: boolean
}

interface AssistantSettings {
  enabled: boolean
  tone: 'samimi' | 'resmi' | 'kisa'
  responseLength: 'kisa' | 'orta' | 'uzun'
  confidenceLevel: 'dusuk' | 'orta' | 'yuksek'
  knowledgeText: string
  websiteUrl: string
  workingHoursStart: string
  workingHoursEnd: string
  offlineMessage: string
  shopifyEnabled: boolean
  faqs: FAQ[]
  handoverRules: HandoverRule[]
}

interface AnalyticsData {
  totalChats: number
  aiResolved: number
  handedOver: number
  resolutionRate: number
  timeSavedMinutes: number
}

interface TestMessage {
  role: 'user' | 'ai'
  content: string
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

const TONE_TO_API: Record<string, string> = { samimi: 'FRIENDLY', resmi: 'FORMAL', kisa: 'PROFESSIONAL' }
const TONE_FROM_API: Record<string, 'samimi' | 'resmi' | 'kisa'> = { FRIENDLY: 'samimi', FORMAL: 'resmi', PROFESSIONAL: 'kisa' }

const LENGTH_TO_API: Record<string, string> = { kisa: 'SHORT', orta: 'MEDIUM', uzun: 'LONG' }
const LENGTH_FROM_API: Record<string, 'kisa' | 'orta' | 'uzun'> = { SHORT: 'kisa', MEDIUM: 'orta', LONG: 'uzun' }

const CONF_TO_API: Record<string, string> = { dusuk: 'LOW', orta: 'MEDIUM', yuksek: 'HIGH' }
const CONF_FROM_API: Record<string, 'dusuk' | 'orta' | 'yuksek'> = { LOW: 'dusuk', MEDIUM: 'orta', HIGH: 'yuksek' }

const DEFAULT_HANDOVER_RULES: HandoverRule[] = [
  { ruleType: 'AI_CANNOT_RESOLVE', enabled: true },
  { ruleType: 'ORDER_COMPLAINT', enabled: false },
  { ruleType: 'RETURN_REQUEST', enabled: false },
  { ruleType: 'ANGRY_CUSTOMER', enabled: true },
  { ruleType: 'MANUAL_TRANSFER', enabled: false },
]

const HANDOVER_LABELS: Record<string, { label: string; desc: string }> = {
  AI_CANNOT_RESOLVE: { label: 'AI çözemediğinde aktar', desc: 'Asistan cevap bulamazsa insan temsilciye geçer' },
  ORDER_COMPLAINT: { label: 'Sipariş şikayetlerinde aktar', desc: 'Sipariş ile ilgili şikayet tespit edilirse' },
  RETURN_REQUEST: { label: 'İade taleplerinde aktar', desc: 'Müşteri iade/iptal talep ederse' },
  ANGRY_CUSTOMER: { label: 'Öfkeli müşteri algılanırsa aktar', desc: 'Negatif duygu algılandığında' },
  MANUAL_TRANSFER: { label: 'Manuel aktarım aktif', desc: 'Müşteri temsilci isterse transfer et' },
}

const DEFAULT_SETTINGS: AssistantSettings = {
  enabled: false,
  tone: 'samimi',
  responseLength: 'orta',
  confidenceLevel: 'orta',
  knowledgeText: '',
  websiteUrl: '',
  workingHoursStart: '09:00',
  workingHoursEnd: '18:00',
  offlineMessage: 'Ekibimiz şu anda çevrimdışı. En kısa sürede dönüş yapacağız.',
  shopifyEnabled: false,
  faqs: [],
  handoverRules: DEFAULT_HANDOVER_RULES,
}

// ─── UI sub-components ────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 2px' }}>{label}</p>
        {desc && <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        style={{
          width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
          background: checked ? '#16A34A' : 'rgba(255,255,255,0.12)',
          position: 'relative', flexShrink: 0, transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: 16, height: 16, borderRadius: '50%', background: 'var(--surface)',
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  )
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 100,
      background: type === 'success' ? '#16A34A' : 'var(--red)',
      color: '#fff', borderRadius: 10, padding: '12px 18px',
      fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
    }}>
      {type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
      {msg}
    </div>
  )
}

function FAQItem({ faq, onEdit, onDelete }: { faq: FAQ; onEdit: (faq: FAQ) => void; onDelete: (id: string) => void }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: '0 0 4px' }}>{faq.question}</p>
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>{faq.answer}</p>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={() => onEdit(faq)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'var(--text-2)' }}>
            <Edit2 size={12} />
          </button>
          <button onClick={() => onDelete(faq.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'var(--red)' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

function FAQModal({ faq, onSave, onClose }: { faq: Partial<FAQ> | null; onSave: (faq: FAQ) => void; onClose: () => void }) {
  const [q, setQ] = useState(faq?.question ?? '')
  const [a, setA] = useState(faq?.answer ?? '')
  const inp: React.CSSProperties = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box' }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 440 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>{faq?.id ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={16} /></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Soru</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Kargo süresi ne kadar?" style={inp} autoFocus />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Cevap</span>
            <textarea value={a} onChange={e => setA(e.target.value)} placeholder="2-3 iş günü içinde teslim edilir." rows={3} style={{ ...inp, resize: 'none' }} />
          </label>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: 'var(--text-2)' }}>İptal</button>
          <button
            onClick={() => { if (q.trim() && a.trim()) onSave({ id: faq?.id ?? `local-${Date.now()}`, question: q.trim(), answer: a.trim() }) }}
            disabled={!q.trim() || !a.trim()}
            style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !q.trim() || !a.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Check size={13} /> Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  const [accountId, setAccountId] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(true)
  const [notConnected, setNotConnected] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [demoSetupLoading, setDemoSetupLoading] = useState(false)
  const [settings, setSettings] = useState<AssistantSettings>(DEFAULT_SETTINGS)
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [faqModal, setFaqModal] = useState<Partial<FAQ> | null | false>(false)
  const [testMessages, setTestMessages] = useState<TestMessage[]>([])
  const [testInput, setTestInput] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [addSourceType, setAddSourceType] = useState<KnowledgeSource['sourceType'] | null>(null)
  const [newSourceValue, setNewSourceValue] = useState('')
  const [newSourceTitle, setNewSourceTitle] = useState('')
  const [uploadingPDF, setUploadingPDF] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const testEndRef = useRef<HTMLDivElement>(null)
  const persistedFaqIds = useRef<Set<string>>(new Set())

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const healthRes = await fetch('/api/whatsapp/health')
      if (!healthRes.ok) { setNotConnected(true); return }
      const healthData = await healthRes.json() as { health?: { accountId?: string; isDemo?: boolean } }
      const aid = healthData.health?.accountId
      if (!aid) { setNotConnected(true); return }
      setAccountId(aid)
      setIsDemo(healthData.health?.isDemo ?? false)

      const [configRes, analyticsRes] = await Promise.all([
        fetch(`/api/whatsapp/assistant/${aid}`),
        fetch(`/api/whatsapp/assistant/${aid}/analytics`),
      ])

      if (configRes.status === 403) { setIsPro(false); return }
      setIsPro(true)

      if (configRes.ok) {
        const d = await configRes.json() as {
          config?: {
            enabled?: boolean
            tone?: string
            responseLength?: string
            confidenceLevel?: string
            customKnowledge?: string | null
            websiteUrl?: string | null
            workingHoursStart?: string | null
            workingHoursEnd?: string | null
            offlineMessage?: string | null
            shopifyEnabled?: boolean
            faqs?: FAQ[]
            handoverRules?: HandoverRule[]
            knowledgeSources?: KnowledgeSource[]
          } | null
        }
        const cfg = d.config
        if (cfg) {
          const faqs = cfg.faqs ?? []
          persistedFaqIds.current = new Set(faqs.map(f => f.id))

          const dbRules = cfg.handoverRules ?? []
          const mergedRules = DEFAULT_HANDOVER_RULES.map(def => {
            const found = dbRules.find(r => r.ruleType === def.ruleType)
            return found ?? def
          })

          setSettings({
            enabled: cfg.enabled ?? false,
            tone: TONE_FROM_API[cfg.tone ?? ''] ?? 'samimi',
            responseLength: LENGTH_FROM_API[cfg.responseLength ?? ''] ?? 'orta',
            confidenceLevel: CONF_FROM_API[cfg.confidenceLevel ?? ''] ?? 'orta',
            knowledgeText: cfg.customKnowledge ?? '',
            websiteUrl: cfg.websiteUrl ?? '',
            workingHoursStart: cfg.workingHoursStart ?? '09:00',
            workingHoursEnd: cfg.workingHoursEnd ?? '18:00',
            offlineMessage: cfg.offlineMessage ?? DEFAULT_SETTINGS.offlineMessage,
            shopifyEnabled: cfg.shopifyEnabled ?? false,
            faqs,
            handoverRules: mergedRules,
          })
          setKnowledgeSources(cfg.knowledgeSources ?? [])
        }
      }

      if (analyticsRes.ok) {
        const ad = await analyticsRes.json() as { analytics?: AnalyticsData }
        if (ad.analytics) setAnalytics(ad.analytics)
      }
    } catch {
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    testEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [testMessages])

  async function handleDemoSetup() {
    setDemoSetupLoading(true)
    try {
      const r = await fetch('/api/whatsapp/demo/setup', { method: 'POST' })
      if (r.ok) {
        setNotConnected(false)
        await load()
      }
    } catch { /* ignore */ } finally { setDemoSetupLoading(false) }
  }

  async function handleSave() {
    if (!accountId) return
    setSaving(true)
    try {
      const configRes = await fetch(`/api/whatsapp/assistant/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: settings.enabled,
          tone: TONE_TO_API[settings.tone] ?? 'PROFESSIONAL',
          responseLength: LENGTH_TO_API[settings.responseLength] ?? 'MEDIUM',
          confidenceLevel: CONF_TO_API[settings.confidenceLevel] ?? 'MEDIUM',
          customKnowledge: settings.knowledgeText,
          websiteUrl: settings.websiteUrl,
          workingHoursStart: settings.workingHoursStart,
          workingHoursEnd: settings.workingHoursEnd,
          offlineMessage: settings.offlineMessage,
          shopifyEnabled: settings.shopifyEnabled,
          handoverRules: settings.handoverRules,
        }),
      })
      if (!configRes.ok) {
        const d = await configRes.json() as { error?: string }
        showToast(d.error ?? 'Kayıt başarısız.', 'error')
        return
      }

      const persisted = persistedFaqIds.current
      const currentFaqs = settings.faqs

      for (const id of persisted) {
        if (!currentFaqs.find(f => f.id === id)) {
          await fetch(`/api/whatsapp/assistant/faq/${id}`, { method: 'DELETE' }).catch(() => null)
        }
      }

      const idRemaps: Record<string, string> = {}
      for (const faq of currentFaqs) {
        if (persisted.has(faq.id)) {
          await fetch(`/api/whatsapp/assistant/faq/${faq.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: faq.question, answer: faq.answer }),
          }).catch(() => null)
        } else {
          const r = await fetch(`/api/whatsapp/assistant/${accountId}/faq`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: faq.question, answer: faq.answer }),
          }).catch(() => null)
          if (r?.ok) {
            const data = await r.json() as { faq?: { id: string } }
            if (data.faq?.id) idRemaps[faq.id] = data.faq.id
          }
        }
      }

      const newPersistedIds = new Set<string>()
      for (const faq of currentFaqs) {
        const dbId = idRemaps[faq.id] ?? faq.id
        if (persisted.has(faq.id) || idRemaps[faq.id]) newPersistedIds.add(dbId)
      }
      persistedFaqIds.current = newPersistedIds

      if (Object.keys(idRemaps).length > 0) {
        setSettings(s => ({
          ...s,
          faqs: s.faqs.map(f => idRemaps[f.id] ? { ...f, id: idRemaps[f.id] } : f),
        }))
      }

      showToast('Değişiklikler kaydedildi.', 'success')
    } catch {
      showToast('Beklenmeyen bir hata oluştu.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendTest() {
    if (!testInput.trim() || !accountId || testLoading) return
    const userMsg = testInput.trim()
    setTestMessages(m => [...m, { role: 'user', content: userMsg }])
    setTestInput('')
    setTestLoading(true)
    try {
      const res = await fetch(`/api/whatsapp/assistant/${accountId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json() as { reply?: string; error?: string }
      setTestMessages(m => [...m, { role: 'ai', content: data.reply ?? data.error ?? 'Yanıt alınamadı.' }])
    } catch {
      setTestMessages(m => [...m, { role: 'ai', content: 'Bağlantı hatası oluştu.' }])
    } finally {
      setTestLoading(false)
    }
  }

  async function handleAddKnowledgeSource() {
    if (!accountId || !addSourceType) return
    const body: Record<string, string> = { sourceType: addSourceType }
    if (addSourceType === 'WEBSITE_URL') {
      if (!newSourceValue.trim()) return
      body.url = newSourceValue.trim()
      body.title = newSourceTitle.trim() || newSourceValue.trim()
    } else if (addSourceType === 'MANUAL') {
      if (!newSourceValue.trim()) return
      body.content = newSourceValue.trim()
      body.title = newSourceTitle.trim() || 'Manuel Bilgi'
    }

    const res = await fetch(`/api/whatsapp/assistant/${accountId}/knowledge-sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const d = await res.json() as { source: KnowledgeSource }
      setKnowledgeSources(s => [...s, d.source])
      setAddSourceType(null)
      setNewSourceValue('')
      setNewSourceTitle('')
    }
  }

  async function handleDeleteKnowledgeSource(id: string) {
    if (!accountId) return
    await fetch(`/api/whatsapp/assistant/${accountId}/knowledge-sources/${id}`, { method: 'DELETE' })
    setKnowledgeSources(s => s.filter(x => x.id !== id))
  }

  async function handlePDFUpload(file: File) {
    if (!accountId) return
    setUploadingPDF(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/whatsapp/assistant/${accountId}/knowledge-sources/upload`, {
        method: 'POST',
        body: form,
      })
      if (res.ok) {
        const d = await res.json() as { source: KnowledgeSource }
        setKnowledgeSources(s => [...s, d.source])
        showToast('PDF yüklendi.', 'success')
      } else {
        const d = await res.json() as { error?: string }
        showToast(d.error ?? 'PDF yüklenemedi.', 'error')
      }
    } catch {
      showToast('PDF yükleme hatası.', 'error')
    } finally {
      setUploadingPDF(false)
    }
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  const cardStyle: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
    padding: '20px 22px', marginBottom: 12,
  }
  const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 14px' }
  const label12: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }
  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text-1)',
    outline: 'none', boxSizing: 'border-box',
  }

  // ─── Early returns ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}>
        <Loader2 size={20} className="animate-spin" style={{ color: '#16A34A' }} />
      </div>
    )
  }

  if (notConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 12, textAlign: 'center' }}>
        <WifiOff size={36} style={{ color: 'var(--text-3)' }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>WhatsApp bağlı değil</p>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, maxWidth: 340 }}>
          Gerçek WhatsApp bağlantısı kurun veya Demo Modu ile AI ayarlarını ve test panelini deneyin.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/whatsapp/connection" style={{ background: '#16A34A', color: '#fff', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            Bağlantı Kur
          </a>
          <button
            onClick={handleDemoSetup}
            disabled={demoSetupLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(68,112,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(68,112,255,0.25)', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: demoSetupLoading ? 0.7 : 1 }}
          >
            {demoSetupLoading ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />}
            Demo Modu ile Başla
          </button>
        </div>
      </div>
    )
  }

  if (!isPro) {
    return (
      <div style={{ padding: '40px 32px', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 32px' }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: 'rgba(159,122,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Crown size={24} style={{ color: 'var(--violet)' }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 8px' }}>AI Asistan Growth Planına Özel</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 20px', lineHeight: 1.6 }}>
            WhatsApp AI Asistan ile müşterilerinize 7/24 otomatik yanıt verin, satışlarınızı artırın.
          </p>
          <a href="/plans" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--violet)', color: '#fff', borderRadius: 8, padding: '10px 22px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Growth&apos;a Yükselt <ChevronRight size={14} />
          </a>
        </div>
      </div>
    )
  }

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '28px 32px', maxWidth: 720, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px' }}>AI Asistan</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>WhatsApp müşteri sorularını otomatik yanıtlayan asistanınızı yapılandırın</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={load}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <RefreshCw size={13} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* ─── Demo Banner ─────────────────────────────────────────────────── */}
      {isDemo && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'rgba(240,160,32,0.08)', border: '1px solid rgba(240,160,32,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FlaskConical size={15} style={{ color: '#f0a020', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#f0a020', margin: '0 0 1px' }}>Demo Modu Aktif</p>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>AI test paneli, FAQ ve ayarlar çalışır — gerçek WhatsApp gönderimi yapılmaz.</p>
            </div>
          </div>
          <a href="/whatsapp/connection" style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            WhatsApp Bağla →
          </a>
        </div>
      )}

      {/* ─── Analytics Dashboard ─────────────────────────────────────────── */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { icon: <MessageSquare size={16} />, label: 'Toplam Sohbet', value: analytics.totalChats, color: 'var(--blue)' },
            { icon: <Bot size={16} />, label: 'AI Çözdü', value: analytics.aiResolved, color: '#16A34A' },
            { icon: <Users size={16} />, label: 'Temsilciye Aktardı', value: analytics.handedOver, color: 'var(--amber)' },
            { icon: <TrendingUp size={16} />, label: 'Çözüm Oranı', value: `%${analytics.resolutionRate}`, color: 'var(--violet)' },
            { icon: <Timer size={16} />, label: 'Tasarruf (dk)', value: analytics.timeSavedMinutes, color: 'var(--green)' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ color: stat.color, marginBottom: 8 }}>{stat.icon}</div>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 2px', lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-2)', margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── Enable Toggle ───────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <Toggle
          checked={settings.enabled}
          onChange={v => setSettings(s => ({ ...s, enabled: v }))}
          label="AI Asistanı Etkinleştir"
          desc="Açıkken asistan gelen WhatsApp mesajlarına otomatik yanıt verir"
        />
      </div>

      {/* ─── AI Test Paneli ──────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <p style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 7, margin: '0 0 14px' }}>
          <Zap size={14} style={{ color: 'var(--blue)' }} /> Asistanı Test Et
        </p>
        <div style={{
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10,
          minHeight: 200, maxHeight: 320, overflowY: 'auto', padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10,
        }}>
          {testMessages.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', margin: 'auto', padding: '20px 0' }}>
              Bir mesaj yazın ve AI&apos;ın nasıl cevap verdiğini görün
            </p>
          )}
          {testMessages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '10px 13px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: m.role === 'user' ? 'var(--blue)' : 'var(--surface)',
                border: m.role === 'ai' ? '1px solid var(--border)' : 'none',
                fontSize: 13, color: m.role === 'user' ? '#fff' : 'var(--text-1)', lineHeight: 1.5,
              }}>
                {m.role === 'ai' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, color: 'var(--text-2)' }}>
                    <Bot size={12} /> <span style={{ fontSize: 11, fontWeight: 600 }}>AI Asistan</span>
                  </div>
                )}
                {m.content}
              </div>
            </div>
          ))}
          {testLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 2px', padding: '10px 13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={12} className="animate-spin" style={{ color: 'var(--text-2)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Yanıt üretiliyor…</span>
              </div>
            </div>
          )}
          <div ref={testEndRef} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={testInput}
            onChange={e => setTestInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendTest() } }}
            placeholder="Örn: Kargom nerede?"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleSendTest}
            disabled={!testInput.trim() || testLoading}
            style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, opacity: !testInput.trim() || testLoading ? 0.5 : 1 }}
          >
            <Send size={13} /> Gönder
          </button>
          {testMessages.length > 0 && (
            <button onClick={() => setTestMessages([])} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', color: 'var(--text-2)', fontSize: 13 }}>
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* ─── Ton / Üslup ────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <p style={sectionTitle}>Ton / Üslup</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { value: 'samimi' as const, label: 'Samimi', desc: 'Sıcak, arkadaşça, günlük dil' },
            { value: 'resmi' as const, label: 'Resmi', desc: 'Profesyonel, kibar, kurumsal dil' },
            { value: 'kisa' as const, label: 'Kısa ve Net', desc: 'Özlü, doğrudan, hızlı cevaplar' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setSettings(s => ({ ...s, tone: opt.value }))}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', border: '2px solid',
                background: settings.tone === opt.value ? 'rgba(68,112,255,0.08)' : 'var(--bg)',
                borderColor: settings.tone === opt.value ? 'var(--blue)' : 'var(--border)',
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: settings.tone === opt.value ? 'var(--blue)' : 'var(--text-1)', margin: '0 0 2px' }}>{opt.label}</p>
              <p style={{ fontSize: 11, color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Yanıt Stili ─────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <p style={sectionTitle}>Yanıt Uzunluğu</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { value: 'kisa' as const, label: 'Kısa', desc: 'Maks 2 cümle, özet bilgi' },
            { value: 'orta' as const, label: 'Orta', desc: 'Maks 4 cümle, dengeli detay' },
            { value: 'uzun' as const, label: 'Uzun', desc: 'Maks 6 cümle, tam açıklama' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setSettings(s => ({ ...s, responseLength: opt.value }))}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', border: '2px solid',
                background: settings.responseLength === opt.value ? 'rgba(34,201,122,0.08)' : 'var(--bg)',
                borderColor: settings.responseLength === opt.value ? '#16A34A' : 'var(--border)',
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: settings.responseLength === opt.value ? '#16A34A' : 'var(--text-1)', margin: '0 0 2px' }}>{opt.label}</p>
              <p style={{ fontSize: 11, color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ─── AI Güven Seviyesi ───────────────────────────────────────────── */}
      <div style={cardStyle}>
        <p style={sectionTitle}>AI Güven Seviyesi</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { value: 'dusuk' as const, label: 'Düşük', desc: 'Belirsiz durumlarda temsilciye aktar' },
            { value: 'orta' as const, label: 'Orta', desc: 'Bildiği konularda yanıtlar, diğerlerinde aktarır' },
            { value: 'yuksek' as const, label: 'Yüksek', desc: 'Makul çıkarımlar yaparak özgürce yanıtlar' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setSettings(s => ({ ...s, confidenceLevel: opt.value }))}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', border: '2px solid',
                background: settings.confidenceLevel === opt.value ? 'rgba(159,122,250,0.08)' : 'var(--bg)',
                borderColor: settings.confidenceLevel === opt.value ? 'var(--violet)' : 'var(--border)',
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: settings.confidenceLevel === opt.value ? 'var(--violet)' : 'var(--text-1)', margin: '0 0 2px' }}>{opt.label}</p>
              <p style={{ fontSize: 11, color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Canlı Temsilci Kuralları ─────────────────────────────────────── */}
      <div style={cardStyle}>
        <p style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 7 }}>
          <User size={14} style={{ color: 'var(--amber)' }} /> Canlı Temsilci Kuralları
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {settings.handoverRules.map((rule) => {
            const meta = HANDOVER_LABELS[rule.ruleType]
            return (
              <Toggle
                key={rule.ruleType}
                checked={rule.enabled}
                onChange={v => setSettings(s => ({
                  ...s,
                  handoverRules: s.handoverRules.map(r => r.ruleType === rule.ruleType ? { ...r, enabled: v } : r),
                }))}
                label={meta?.label ?? rule.ruleType}
                desc={meta?.desc}
              />
            )
          })}
        </div>
      </div>

      {/* ─── Çalışma Saatleri ─────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <p style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Clock size={14} style={{ color: 'var(--blue)' }} /> Çalışma Saatleri
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <label style={{ display: 'block' }}>
            <span style={label12}>Başlangıç Saati</span>
            <input
              type="time"
              value={settings.workingHoursStart}
              onChange={e => setSettings(s => ({ ...s, workingHoursStart: e.target.value }))}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'block' }}>
            <span style={label12}>Bitiş Saati</span>
            <input
              type="time"
              value={settings.workingHoursEnd}
              onChange={e => setSettings(s => ({ ...s, workingHoursEnd: e.target.value }))}
              style={inputStyle}
            />
          </label>
        </div>
        <label style={{ display: 'block' }}>
          <span style={label12}>Mesai Dışı Mesajı</span>
          <textarea
            value={settings.offlineMessage}
            onChange={e => setSettings(s => ({ ...s, offlineMessage: e.target.value }))}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            placeholder="Ekibimiz şu anda çevrimdışı. En kısa sürede dönüş yapacağız."
          />
        </label>
      </div>

      {/* ─── Bilgi Kaynakları ─────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <p style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Globe size={14} style={{ color: 'var(--violet)' }} /> Bilgi Kaynakları
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { type: 'WEBSITE_URL' as const, icon: <Globe size={14} />, label: 'Web Sitesi URL' },
            { type: 'PDF' as const, icon: <FileText size={14} />, label: 'PDF Yükle' },
            { type: 'MANUAL' as const, icon: <Edit2 size={14} />, label: 'Manuel Bilgi' },
            { type: 'FAQ_IMPORT' as const, icon: <MessageSquare size={14} />, label: 'SSS İçe Aktar' },
          ].map(btn => (
            <button
              key={btn.type}
              onClick={() => {
                if (btn.type === 'PDF') {
                  fileInputRef.current?.click()
                } else {
                  setAddSourceType(addSourceType === btn.type ? null : btn.type)
                  setNewSourceValue('')
                  setNewSourceTitle('')
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                background: addSourceType === btn.type ? 'rgba(68,112,255,0.08)' : 'var(--bg)',
                border: '1px solid', borderColor: addSourceType === btn.type ? 'var(--blue)' : 'var(--border)',
                borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                color: addSourceType === btn.type ? 'var(--blue)' : 'var(--text-1)',
              }}
            >
              {uploadingPDF && btn.type === 'PDF' ? <Loader2 size={14} className="animate-spin" /> : btn.icon}
              {btn.label}
            </button>
          ))}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handlePDFUpload(f)
            e.target.value = ''
          }}
        />

        {(addSourceType === 'WEBSITE_URL' || addSourceType === 'MANUAL') && (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'block' }}>
                <span style={label12}>{addSourceType === 'WEBSITE_URL' ? 'Başlık (opsiyonel)' : 'Başlık'}</span>
                <input
                  value={newSourceTitle}
                  onChange={e => setNewSourceTitle(e.target.value)}
                  placeholder={addSourceType === 'WEBSITE_URL' ? 'Ana Sayfa' : 'Kargo Politikası'}
                  style={inputStyle}
                />
              </label>
              <label style={{ display: 'block' }}>
                <span style={label12}>{addSourceType === 'WEBSITE_URL' ? 'URL' : 'İçerik'}</span>
                {addSourceType === 'MANUAL'
                  ? <textarea value={newSourceValue} onChange={e => setNewSourceValue(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} placeholder="Kargo süresi 2-3 iş günüdür. İade süresi 14 gündür..." />
                  : <input value={newSourceValue} onChange={e => setNewSourceValue(e.target.value)} placeholder="https://magazaniz.com" style={inputStyle} />
                }
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setAddSourceType(null); setNewSourceValue(''); setNewSourceTitle('') }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer', color: 'var(--text-2)' }}>İptal</button>
                <button
                  onClick={handleAddKnowledgeSource}
                  disabled={!newSourceValue.trim()}
                  style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: !newSourceValue.trim() ? 0.5 : 1 }}
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>
        )}

        {addSourceType === 'FAQ_IMPORT' && (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 11, color: 'var(--text-2)', margin: '0 0 10px', lineHeight: 1.5 }}>
              Her satıra bir soru-cevap çifti girin. Format: <code style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '1px 5px' }}>Soru;Cevap</code>
            </p>
            <textarea
              value={newSourceValue}
              onChange={e => setNewSourceValue(e.target.value)}
              rows={6}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, fontFamily: 'monospace', fontSize: 12 }}
              placeholder={"Kargo süresi ne kadar?;2-3 iş günü içinde teslim edilir.\nİade nasıl yapılır?;14 gün içinde iade formunu doldurun.\nÖdeme yöntemleri neler?;Kredi kartı, havale ve kapıda ödeme kabul edilir."}
              autoFocus
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {newSourceValue.trim() ? `${newSourceValue.trim().split('\n').filter(l => l.includes(';')).length} soru tespit edildi` : ''}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setAddSourceType(null); setNewSourceValue(''); setNewSourceTitle('') }}
                  style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer', color: 'var(--text-2)' }}
                >
                  İptal
                </button>
                <button
                  disabled={!newSourceValue.trim().split('\n').some(l => l.includes(';'))}
                  onClick={() => {
                    const lines = newSourceValue.trim().split('\n').filter(l => l.includes(';'))
                    const newFaqs: FAQ[] = lines.map(line => {
                      const semi = line.indexOf(';')
                      return {
                        id: `local-import-${Date.now()}-${Math.random()}`,
                        question: line.slice(0, semi).trim(),
                        answer: line.slice(semi + 1).trim(),
                      }
                    }).filter(f => f.question && f.answer)
                    if (newFaqs.length > 0) {
                      setSettings(s => ({ ...s, faqs: [...s.faqs, ...newFaqs] }))
                      showToast(`${newFaqs.length} soru SSS listesine eklendi. Kaydetmeyi unutmayın.`, 'success')
                    }
                    setAddSourceType(null)
                    setNewSourceValue('')
                    setNewSourceTitle('')
                  }}
                  style={{
                    background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8,
                    padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    opacity: !newSourceValue.trim().split('\n').some(l => l.includes(';')) ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <Upload size={11} /> İçe Aktar
                </button>
              </div>
            </div>
          </div>
        )}

        {knowledgeSources.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {knowledgeSources.map(src => (
              <div key={src.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ color: 'var(--text-2)', flexShrink: 0 }}>
                  {src.sourceType === 'WEBSITE_URL' && <Globe size={14} />}
                  {src.sourceType === 'PDF' && <FileText size={14} />}
                  {src.sourceType === 'MANUAL' && <Edit2 size={14} />}
                  {src.sourceType === 'FAQ_IMPORT' && <MessageSquare size={14} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {src.title ?? src.fileName ?? src.url ?? 'Kaynak'}
                  </p>
                  {src.url && <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{src.url}</p>}
                </div>
                <button
                  onClick={() => handleDeleteKnowledgeSource(src.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4, flexShrink: 0 }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <label style={{ display: 'block' }}>
          <span style={label12}>Manuel Bilgi Alanı</span>
          <textarea
            value={settings.knowledgeText}
            onChange={e => setSettings(s => ({ ...s, knowledgeText: e.target.value }))}
            placeholder="Asistanın bilmesi gereken ek bilgileri buraya yazın (kargo süreleri, iade politikası, kampanya detayları…)"
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
          <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '4px 0 0' }}>{settings.knowledgeText.length} karakter</p>
        </label>
      </div>

      {/* ─── Shopify Entegrasyonu ─────────────────────────────────────────── */}
      <div style={cardStyle}>
        <p style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: 7 }}>
          <ShoppingBag size={14} style={{ color: '#96BF48' }} /> Shopify Entegrasyonu
        </p>
        <Toggle
          checked={settings.shopifyEnabled}
          onChange={v => setSettings(s => ({ ...s, shopifyEnabled: v }))}
          label="Shopify verilerini kullan"
          desc="Açıkken AI, sipariş durumu, ürün bilgileri ve müşteri geçmişine erişebilir"
        />
        {settings.shopifyEnabled && (
          <div style={{ marginTop: 14, background: 'rgba(150,191,72,0.06)', border: '1px solid rgba(150,191,72,0.2)', borderRadius: 8, padding: '12px 14px' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#96BF48', margin: '0 0 6px' }}>Shopify bağlıyken AI şunlara erişebilir:</p>
            <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {['Sipariş durumu ve takip numarası', 'Sipariş tarihi ve tutarı', 'Ürün bilgileri ve stok durumu', 'Müşteri geçmişi ve toplam harcama'].map((item, i) => (
                <li key={i} style={{ fontSize: 12, color: 'var(--text-2)' }}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ─── Sıkça Sorulan Sorular ───────────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={sectionTitle}>Sıkça Sorulan Sorular</p>
          <button
            onClick={() => setFaqModal({})}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--text-1)' }}
          >
            <Plus size={12} /> Yeni Soru Ekle
          </button>
        </div>
        {settings.faqs.length === 0
          ? <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>Henüz soru eklenmemiş</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {settings.faqs.map(faq => (
                <FAQItem
                  key={faq.id}
                  faq={faq}
                  onEdit={f => setFaqModal(f)}
                  onDelete={id => setSettings(s => ({ ...s, faqs: s.faqs.filter(f => f.id !== id) }))}
                />
              ))}
            </div>
        }
      </div>

      {/* ─── FAQ Modal ──────────────────────────────────────────────────── */}
      {faqModal !== false && (
        <FAQModal
          faq={faqModal}
          onSave={faq => {
            setSettings(s => ({
              ...s,
              faqs: s.faqs.find(f => f.id === faq.id)
                ? s.faqs.map(f => f.id === faq.id ? faq : f)
                : [...s.faqs, faq],
            }))
            setFaqModal(false)
          }}
          onClose={() => setFaqModal(false)}
        />
      )}

      {/* ─── Toast ──────────────────────────────────────────────────────── */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  )
}
