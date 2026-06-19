'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Send, Loader2, X } from 'lucide-react'

interface Broadcast {
  id: string
  name: string
  templateName: string
  segmentName: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED'
  scheduledAt: string | null
  sentAt: string | null
  stats: { sent: number; delivered: number; read: number }
}

interface Template {
  id: string
  name: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED'
}

interface Account {
  id: string
  displayName: string | null
  status: string
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT:     { label: 'Taslak',       bg: '#F3F4F6', color: '#6B7280' },
  SCHEDULED: { label: 'Planlandı',    bg: '#DBEAFE', color: '#2563EB' },
  SENDING:   { label: 'Gönderiliyor', bg: '#FEF3C7', color: '#D97706' },
  SENT:      { label: 'Gönderildi',   bg: '#DCFCE7', color: '#16A34A' },
  FAILED:    { label: 'Başarısız',    bg: '#FEE2E2', color: '#DC2626' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>
      {cfg.label}
    </span>
  )
}

function StatChip({ icon, value, label, color = '#6B7280' }: { icon: string; value: string | number; label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 20, padding: '4px 12px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 14, color }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{value}</span>
      <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
    </div>
  )
}

type WizardStep = 1 | 2 | 3
const WIZARD_STEPS = ['Bilgiler', 'Şablon & Segment', 'Zamanlama']

const inpStyle: React.CSSProperties = {
  width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB',
  borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#111827', outline: 'none',
}

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<Template[]>([])
  const [accountId, setAccountId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [wStep, setWStep] = useState<WizardStep>(1)
  const [wName, setWName] = useState('')
  const [wTemplateId, setWTemplateId] = useState('')
  const [wSegment, setWSegment] = useState('')
  const [wSchedule, setWSchedule] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/broadcasts')
      if (res.ok) {
        const d = await res.json()
        setBroadcasts(d.broadcasts ?? [])
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    Promise.all([
      fetch('/api/whatsapp/accounts').then(r => r.ok ? r.json() : []),
      fetch('/api/whatsapp/templates').then(r => r.ok ? r.json() : { templates: [] }),
    ]).then(([accounts, tplData]) => {
      const connected = (accounts as Account[]).find(a => a.status === 'CONNECTED')
      if (connected) setAccountId(connected.id)
      setTemplates((tplData.templates ?? []).filter((t: Template) => t.status === 'APPROVED'))
    }).catch(() => null)
  }, [])

  async function handleCreate() {
    if (!accountId) {
      setCreateError('Bağlı WhatsApp hesabı bulunamadı. Önce hesap bağlayın.')
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/whatsapp/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          templateId: wTemplateId,
          segmentId: wSegment || null,
          name: wName,
          scheduledAt: wSchedule || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setCreateError(d.error ?? 'Broadcast oluşturulamadı.')
        return
      }
      setShowCreate(false)
      setWStep(1)
      setWName(''); setWTemplateId(''); setWSegment(''); setWSchedule('')
      load()
    } catch { setCreateError('Sunucuya ulaşılamadı.') } finally { setCreating(false) }
  }

  const totalSent = broadcasts.reduce((a, b) => a + b.stats.sent, 0)
  const totalRead = broadcasts.reduce((a, b) => a + b.stats.read, 0)
  const scheduled = broadcasts.filter(b => b.status === 'SCHEDULED').length
  const sent = broadcasts.filter(b => b.status === 'SENT').length

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Broadcasts</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>WhatsApp şablon mesajı kampanyalarını yönetin</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setWStep(1); setCreateError(null) }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={14} /> Yeni Broadcast
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatChip icon="send" value={broadcasts.length} label="toplam" />
        <StatChip icon="schedule" value={scheduled} label="planlandı" color="#2563EB" />
        <StatChip icon="check_circle" value={sent} label="gönderildi" color="#16A34A" />
        <StatChip icon="group" value={totalSent.toLocaleString('tr')} label="mesaj" />
        <StatChip icon="visibility" value={totalRead.toLocaleString('tr')} label="okundu" color="#16A34A" />
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {['Broadcast Adı', 'Şablon', 'Segment', 'Durum', 'İstatistikler', 'Tarih'].map(h => (
                <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#6B7280', textAlign: 'left', whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {[140, 80, 80, 60, 120, 60].map((w, j) => (
                      <td key={j} style={{ padding: '12px 14px' }}><div style={{ height: 12, background: '#F3F4F6', borderRadius: 4, width: w }} /></td>
                    ))}
                  </tr>
                ))
              : broadcasts.length === 0
              ? (
                <tr><td colSpan={6}>
                  <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#D1D5DB', display: 'block', marginBottom: 10 }}>send</span>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>Henüz broadcast yok</p>
                    <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px' }}>İlk kampanyanızı oluşturarak müşterilerinize ulaşın</p>
                    <button onClick={() => setShowCreate(true)} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      İlk Broadcast&apos;i Oluştur
                    </button>
                  </div>
                </td></tr>
              )
              : broadcasts.map((b, idx) => (
                <tr
                  key={b.id}
                  style={{ borderBottom: idx < broadcasts.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{b.name}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151', background: '#F3F4F6', padding: '2px 6px', borderRadius: 4 }}>{b.templateName}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>{b.segmentName}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge status={b.status} /></td>
                  <td style={{ padding: '10px 14px' }}>
                    {b.stats.sent > 0 ? (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, color: '#374151' }}>{b.stats.sent.toLocaleString('tr')} <span style={{ color: '#9CA3AF' }}>gönderildi</span></span>
                        <span style={{ fontSize: 12, color: '#374151' }}>{Math.round((b.stats.delivered / b.stats.sent) * 100)}% <span style={{ color: '#9CA3AF' }}>teslim</span></span>
                        <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 600 }}>{Math.round((b.stats.read / b.stats.sent) * 100)}% <span style={{ color: '#9CA3AF', fontWeight: 400 }}>okundu</span></span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      {b.sentAt
                        ? new Date(b.sentAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
                        : b.scheduledAt
                        ? new Date(b.scheduledAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
                        : '—'}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 12, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>Yeni Broadcast</h2>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Adım {wStep} / {WIZARD_STEPS.length} — {WIZARD_STEPS[wStep - 1]}</p>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
            </div>

            <div style={{ height: 2, background: '#F3F4F6' }}>
              <div style={{ height: '100%', width: `${(wStep / 3) * 100}%`, background: '#16A34A', transition: 'width 0.3s' }} />
            </div>

            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {createError && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991B1B' }}>
                  {createError}
                </div>
              )}
              {wStep === 1 && (
                <label style={{ display: 'block' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Broadcast Adı</span>
                  <input value={wName} onChange={e => setWName(e.target.value)} placeholder="Bahar kampanyası…" style={inpStyle} autoFocus />
                </label>
              )}
              {wStep === 2 && (
                <>
                  <label style={{ display: 'block' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Şablon (Onaylı)</span>
                    <select value={wTemplateId} onChange={e => setWTemplateId(e.target.value)} style={inpStyle}>
                      <option value="">Şablon seçin…</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    {templates.length === 0 && (
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Onaylı şablon bulunamadı. Şablonlar sayfasından senkronize edin.</p>
                    )}
                  </label>
                  <label style={{ display: 'block' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Segment (opsiyonel)</span>
                    <input value={wSegment} onChange={e => setWSegment(e.target.value)} placeholder="VIP Müşteriler" style={inpStyle} />
                  </label>
                </>
              )}
              {wStep === 3 && (
                <label style={{ display: 'block' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Gönderim Zamanı (opsiyonel)</span>
                  <input type="datetime-local" value={wSchedule} onChange={e => setWSchedule(e.target.value)} style={inpStyle} />
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, display: 'block' }}>Boş bırakırsanız hemen gönderilir</span>
                </label>
              )}
            </div>

            <div style={{ padding: '14px 22px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {wStep > 1 && (
                <button onClick={() => setWStep(s => (s - 1) as WizardStep)} style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>
                  Geri
                </button>
              )}
              {wStep < 3
                ? <button onClick={() => setWStep(s => (s + 1) as WizardStep)} disabled={wStep === 1 && !wName.trim()} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: wStep === 1 && !wName.trim() ? 0.5 : 1 }}>İleri</button>
                : <button onClick={handleCreate} disabled={creating || !wTemplateId} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: !wTemplateId ? 0.5 : 1 }}>
                    {creating ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    {creating ? 'Oluşturuluyor…' : 'Broadcast Oluştur'}
                  </button>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
