'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Plus, Trash2, Edit2, Check, X, Crown, ChevronRight, Save, WifiOff } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
}

interface AssistantSettings {
  enabled: boolean
  tone: 'samimi' | 'resmi' | 'kisa'
  knowledgeText: string
  faqs: FAQ[]
}

const DEFAULT_SETTINGS: AssistantSettings = {
  enabled: false,
  tone: 'samimi',
  knowledgeText: '',
  faqs: [],
}

const TONE_OPTIONS = [
  { value: 'samimi' as const, label: 'Samimi', desc: 'Sıcak, arkadaşça, günlük dil' },
  { value: 'resmi' as const, label: 'Resmi', desc: 'Profesyonel, kibar, kurumsal dil' },
  { value: 'kisa' as const, label: 'Kısa ve Net', desc: 'Özlü, doğrudan, hızlı cevaplar' },
]

// UI ton değeri → API ton değeri
const TONE_TO_API: Record<string, string> = {
  samimi: 'FRIENDLY',
  resmi: 'FORMAL',
  kisa: 'PROFESSIONAL',
}
// API ton değeri → UI ton değeri
const TONE_FROM_API: Record<string, 'samimi' | 'resmi' | 'kisa'> = {
  FRIENDLY: 'samimi',
  FORMAL: 'resmi',
  PROFESSIONAL: 'kisa',
}

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
          background: checked ? '#16A34A' : 'var(--border-2)',
          position: 'relative', flexShrink: 0, transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
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
          <button onClick={() => onEdit(faq)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'var(--text-2)' }} title="Düzenle">
            <Edit2 size={12} />
          </button>
          <button onClick={() => onDelete(faq.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'var(--red)' }} title="Sil">
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
  const inpStyle: React.CSSProperties = { width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text-1)', outline: 'none' }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>{faq?.id ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={16} /></button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Soru</span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Kargo süresi ne kadar?" style={inpStyle} autoFocus />
          </label>
          <label style={{ display: 'block' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Cevap</span>
            <textarea value={a} onChange={e => setA(e.target.value)} placeholder="2-3 iş günü içinde teslim edilir." rows={3} style={{ ...inpStyle, resize: 'none' }} />
          </label>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: 'var(--text-2)' }}>İptal</button>
          <button
            onClick={() => { if (q.trim() && a.trim()) { onSave({ id: faq?.id ?? `local-${Date.now()}`, question: q.trim(), answer: a.trim() }) } }}
            disabled={!q.trim() || !a.trim()}
            style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: !q.trim() || !a.trim() ? 0.5 : 1 }}
          >
            <Check size={13} /> Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AIAssistantPage() {
  const [accountId, setAccountId] = useState<string | null>(null)
  const [isPro, setIsPro] = useState(true)
  const [notConnected, setNotConnected] = useState(false)
  const [settings, setSettings] = useState<AssistantSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [faqModal, setFaqModal] = useState<{ faq: Partial<FAQ> | null } | null>(null)

  // Track which FAQ IDs exist in DB (vs local-only new ones)
  const persistedFaqIds = useRef<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // 1. WhatsApp hesabını bul
      const healthRes = await fetch('/api/whatsapp/health')
      if (!healthRes.ok) { setNotConnected(true); return }
      const healthData = await healthRes.json() as { health?: { accountId?: string } }
      const aid = healthData.health?.accountId
      if (!aid) { setNotConnected(true); return }
      setAccountId(aid)

      // 2. Asistan konfigürasyonunu yükle
      const res = await fetch(`/api/whatsapp/assistant/${aid}`)
      if (res.status === 403) { setIsPro(false); return }
      setIsPro(true)

      if (res.ok) {
        const d = await res.json() as {
          config?: {
            enabled?: boolean
            tone?: string
            customKnowledge?: string | null
            faqs?: Array<{ id: string; question: string; answer: string }>
          } | null
        }
        const config = d.config
        if (config) {
          const faqs = config.faqs ?? []
          persistedFaqIds.current = new Set(faqs.map(f => f.id))
          setSettings({
            enabled: config.enabled ?? false,
            tone: TONE_FROM_API[config.tone ?? ''] ?? 'samimi',
            knowledgeText: config.customKnowledge ?? '',
            faqs,
          })
        }
      }
    } catch {
      setSettings(DEFAULT_SETTINGS)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave() {
    if (!accountId) return
    setSaving(true)
    setSaveError(null)
    try {
      // Ana konfigürasyonu kaydet
      const configRes = await fetch(`/api/whatsapp/assistant/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: settings.enabled,
          tone: TONE_TO_API[settings.tone] ?? 'PROFESSIONAL',
          customKnowledge: settings.knowledgeText,
        }),
      })
      if (!configRes.ok) {
        const d = await configRes.json() as { error?: string }
        setSaveError(d.error ?? 'Kayıt başarısız.')
        return
      }

      // FAQ senkronizasyonu
      const currentFaqs = settings.faqs
      const persisted = persistedFaqIds.current

      // Silinen kalıcı FAQ'ları sil
      for (const id of persisted) {
        if (!currentFaqs.find(f => f.id === id)) {
          await fetch(`/api/whatsapp/assistant/faq/${id}`, { method: 'DELETE' }).catch(() => null)
        }
      }

      // Yeni ve güncellenen FAQ'ları işle
      const idRemaps: Record<string, string> = {}
      for (const faq of currentFaqs) {
        if (persisted.has(faq.id)) {
          // Mevcut → güncelle
          await fetch(`/api/whatsapp/assistant/faq/${faq.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: faq.question, answer: faq.answer }),
          }).catch(() => null)
        } else {
          // Yeni → oluştur
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

      // Yeni DB ID'lerini state'e uygula ve persistedFaqIds güncelle
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

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setSaveError('Beklenmeyen bir hata oluştu.')
    } finally { setSaving(false) }
  }

  function handleFAQSave(faq: FAQ) {
    setSettings(s => ({
      ...s,
      faqs: s.faqs.find(f => f.id === faq.id)
        ? s.faqs.map(f => f.id === faq.id ? faq : f)
        : [...s.faqs, faq],
    }))
    setFaqModal(null)
  }

  function handleFAQDelete(id: string) {
    setSettings(s => ({ ...s, faqs: s.faqs.filter(f => f.id !== id) }))
  }

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
    padding: '20px 22px', marginBottom: 12,
  }
  const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 14px' }

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }}><Loader2 size={20} className="animate-spin" style={{ color: '#16A34A' }} /></div>
  }

  if (notConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 12 }}>
        <WifiOff size={36} style={{ color: 'var(--text-3)' }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>WhatsApp bağlı değil</p>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>AI Asistanı kullanmak için önce WhatsApp hesabınızı bağlayın</p>
        <a href="/whatsapp/connection" style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginTop: 4 }}>
          Bağlantı Kur
        </a>
      </div>
    )
  }

  if (!isPro) {
    return (
      <div style={{ padding: '40px 32px', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 32px' }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--violet-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Crown size={24} style={{ color: 'var(--violet)' }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 8px' }}>AI Asistan Growth Planına Özel</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 20px', lineHeight: 1.6 }}>
            WhatsApp AI Asistan ile müşterilerinize 7/24 otomatik yanıt verin, satışlarınızı artırın.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              '7/24 otomatik müşteri yanıtları',
              'Sipariş ve kargo bilgisine erişim',
              'SSS tabanlı özelleştirilebilir yanıtlar',
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-1)' }}>
                <Check size={14} style={{ color: '#16A34A', flexShrink: 0 }} /> {item}
              </li>
            ))}
          </ul>
          <a href="/plans" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--violet)', color: '#fff', borderRadius: 8, padding: '10px 22px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Growth&apos;a Yükselt <ChevronRight size={14} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 680, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px' }}>AI Asistan</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>WhatsApp müşteri sorularını otomatik yanıtlayan asistanınızı yapılandırın</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: saved ? '#16A34A' : 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
          {saving ? 'Kaydediliyor…' : saved ? 'Kaydedildi' : 'Kaydet'}
        </button>
      </div>

      {saveError && (
        <div style={{ marginBottom: 12, background: 'var(--red-soft)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)' }}>
          {saveError}
        </div>
      )}

      {/* Enable toggle */}
      <div style={cardStyle}>
        <Toggle
          checked={settings.enabled}
          onChange={v => setSettings(s => ({ ...s, enabled: v }))}
          label="AI Asistanı Etkinleştir"
          desc="Açıkken asistan gelen WhatsApp mesajlarına otomatik yanıt verir"
        />
      </div>

      {/* Tone */}
      <div style={cardStyle}>
        <p style={sectionTitle}>Ton / Üslup</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {TONE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSettings(s => ({ ...s, tone: opt.value }))}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', border: '2px solid',
                background: settings.tone === opt.value ? 'var(--blue-soft)' : 'var(--bg)',
                borderColor: settings.tone === opt.value ? 'var(--blue)' : 'var(--border)',
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: settings.tone === opt.value ? 'var(--blue)' : 'var(--text-1)', margin: '0 0 2px' }}>{opt.label}</p>
              <p style={{ fontSize: 11, color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={sectionTitle}>Sıkça Sorulan Sorular</p>
          <button
            onClick={() => setFaqModal({ faq: {} })}
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--text-1)' }}
          >
            <Plus size={12} /> Yeni Soru Ekle
          </button>
        </div>
        {settings.faqs.length === 0
          ? <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>Henüz soru eklenmemiş</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {settings.faqs.map(faq => (
                <FAQItem key={faq.id} faq={faq} onEdit={f => setFaqModal({ faq: f })} onDelete={handleFAQDelete} />
              ))}
            </div>
        }
      </div>

      {/* Knowledge text */}
      <div style={cardStyle}>
        <p style={sectionTitle}>Asistanın Bilmesi Gereken Bilgiler</p>
        <textarea
          value={settings.knowledgeText}
          onChange={e => setSettings(s => ({ ...s, knowledgeText: e.target.value }))}
          placeholder="Asistanın bilmesi gereken ek bilgileri buraya yazın (örn. kargo süreleri, iade politikası, kampanya detayları, özel ürün açıklamaları…)"
          rows={6}
          style={{
            width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--text-1)',
            outline: 'none', resize: 'vertical', lineHeight: 1.6,
          }}
        />
        <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '6px 0 0' }}>{settings.knowledgeText.length} karakter</p>
      </div>

      {/* FAQ modal */}
      {faqModal && (
        <FAQModal faq={faqModal.faq} onSave={handleFAQSave} onClose={() => setFaqModal(null)} />
      )}
    </div>
  )
}
