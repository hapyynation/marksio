'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Upload, Download, Search, Filter, X, ChevronLeft, ChevronRight, MoreVertical, UserX, Trash2, Tag, RefreshCw, Plus, CheckSquare } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Subscriber {
  id: string
  phone: string
  optIn: 'OPTED_IN' | 'OPTED_OUT' | 'UNKNOWN'
  tags: string[]
  windowOpen: boolean
  windowExpiresAt: string | null
  lastMessageAt: string | null
  createdAt: string
  customerId: string | null
  name: string | null
  email: string | null
  segment: string | null
  totalSpent: number | null
  totalOrders: number | null
  lastOrderDate: string | null
  riskScore: string | null
  customerTags: string[]
}

interface Kpis {
  total: number
  optedIn: number
  optedOut: number
  windowOpen: number
}

interface ImportResult {
  upserted: number
  skipped: number
  total: number
  errors: { line: number; raw: string; reason: string }[]
  hasErrors: boolean
}

interface ProfileData {
  contact: {
    id: string
    phone: string
    optIn: string
    tags: string[]
    windowOpen: boolean
    windowExpiresAt: string | null
    lastMessageAt: string | null
    createdAt: string
  }
  customer: {
    id: string
    name: string
    email: string
    segment: string
    totalSpent: number
    totalOrders: number
    avgOrder: number
    lastOrder: string | null
    riskScore: string
    score: number
    tags: string[]
    createdAt: string
    orders: {
      id: string
      orderNumber: string | null
      status: string
      total: number
      currency: string
      placedAt: string
      items: { title: string; quantity: number; price: number; imageUrl: string | null }[]
    }[]
  } | null
  optInHistory: { id: string; status: string; source: string; note: string | null; createdAt: string }[]
  conversation: {
    id: string
    status: string
    lastMessageAt: string | null
    lastMessage: { content: string | null; direction: string; sentAt: string } | null
    notes: { id: string; note: string; createdBy: string; createdAt: string }[]
    tags: { id: string; name: string; color: string }[]
  } | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.floor(diff / 1000)} sn`
  if (diff < 3600000) return `${Math.floor(diff / 60000)} dk`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} sa`
  return `${Math.floor(diff / 86400000)} gün`
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: '2-digit' })
}

function fmtCurrency(n: number | null) {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
}

function initials(name: string | null, phone: string) {
  if (name) return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  return phone.slice(-2)
}

const AVATAR_COLORS = ['#1e3a5f', '#2d1b4e', '#0d3d2b', '#4a2000', '#1a1a3e']
const AVATAR_TEXT = ['#60a5fa', '#a78bfa', '#4ade80', '#fb923c', '#818cf8']
function avatarColor(id: string) { return AVATAR_COLORS[id.charCodeAt(0) % 5] }
function avatarTextColor(id: string) { return AVATAR_TEXT[id.charCodeAt(0) % 5] }

const SEGMENT_META: Record<string, { label: string; color: string; bg: string }> = {
  vip: { label: 'VIP', color: '#f0a020', bg: 'rgba(240,160,32,0.12)' },
  champion: { label: 'Şampiyon', color: '#9f7afa', bg: 'rgba(159,122,250,0.12)' },
  loyal: { label: 'Sadık', color: '#22c97a', bg: 'rgba(34,201,122,0.12)' },
  at_risk: { label: 'Risk', color: '#e84545', bg: 'rgba(232,69,69,0.12)' },
  new: { label: 'Yeni', color: '#4470ff', bg: 'rgba(68,112,255,0.12)' },
  inactive: { label: 'Pasif', color: '#8080a0', bg: 'rgba(128,128,160,0.12)' },
}

function SegmentBadge({ segment }: { segment: string | null }) {
  if (!segment) return <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>
  const m = SEGMENT_META[segment] ?? { label: segment, color: '#8080a0', bg: 'rgba(128,128,160,0.12)' }
  return (
    <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
      {m.label}
    </span>
  )
}

function OptInBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    OPTED_IN: { label: 'Aktif', color: '#22c97a', bg: 'rgba(34,201,122,0.12)' },
    OPTED_OUT: { label: 'Çıktı', color: '#e84545', bg: 'rgba(232,69,69,0.12)' },
    UNKNOWN: { label: 'Bilinmiyor', color: '#8080a0', bg: 'rgba(128,128,160,0.1)' },
  }
  const m = map[status] ?? map.UNKNOWN
  return (
    <span style={{ background: m.bg, color: m.color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
      {m.label}
    </span>
  )
}

function RiskBadge({ risk }: { risk: string | null }) {
  if (!risk) return null
  const map: Record<string, { label: string; color: string }> = {
    low: { label: 'Düşük', color: '#22c97a' },
    medium: { label: 'Orta', color: '#f0a020' },
    high: { label: 'Yüksek', color: '#e84545' },
  }
  const m = map[risk] ?? { label: risk, color: '#8080a0' }
  return <span style={{ color: m.color, fontSize: 11, fontWeight: 600 }}>{m.label}</span>
}

// ── KPI Card ───────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, active, onClick, color = '#8080a0' }: {
  icon: string; label: string; value: number; active: boolean; onClick: () => void; color?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: '1 1 140px',
        background: active ? `rgba(68,112,255,0.08)` : 'var(--surface)',
        border: `1px solid ${active ? '#4470ff' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '14px 18px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color }}>{icon}</span>
        <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{value.toLocaleString('tr-TR')}</p>
    </button>
  )
}

// ── Import Drawer ──────────────────────────────────────────────────────────────

function ImportDrawer({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle')
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('uploading')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/whatsapp/subscribers/import', { method: 'POST', body: form })
      const data = await res.json() as ImportResult
      setResult(data)
      setStatus('done')
      onDone()
    } catch {
      setStatus('idle')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  function downloadErrors() {
    if (!result?.errors.length) return
    const header = 'Satır,Ham Değer,Hata Sebebi'
    const rows = result.errors.map(e => `${e.line},"${e.raw.replace(/"/g, '""')}","${e.reason}"`)
    const csv = [header, ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'import-errors.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px 16px 0 0',
        width: '100%', maxWidth: 560, padding: '28px 28px 36px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>CSV Yükle</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ background: 'rgba(68,112,255,0.06)', border: '1px solid rgba(68,112,255,0.15)', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: '#4470ff' }}>CSV Format (başlık satırı opsiyonel):</p>
          <code style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'monospace' }}>
            phone,optIn,tags<br />
            905551234567,OPTED_IN,vip|yeni<br />
            905559876543,OPTED_OUT,
          </code>
        </div>

        {status === 'idle' && (
          <>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', padding: '16px', background: 'var(--bg)', border: '2px dashed var(--border)',
                borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, color: 'var(--text-2)', fontSize: 14, fontWeight: 500,
              }}
            >
              <Upload size={18} /> CSV dosyası seç
            </button>
          </>
        )}

        {status === 'uploading' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Loader2 size={28} className="animate-spin" style={{ color: '#4470ff', margin: '0 auto 10px' }} />
            <p style={{ color: 'var(--text-2)', fontSize: 13, margin: 0 }}>Yükleniyor…</p>
          </div>
        )}

        {status === 'done' && result && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Toplam', val: result.total, color: 'var(--text-1)' },
                { label: 'Eklendi/Güncellendi', val: result.upserted, color: '#22c97a' },
                { label: 'Atlandı', val: result.skipped, color: '#f0a020' },
              ].map(stat => (
                <div key={stat.label} style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, padding: '10px 14px', border: '1px solid var(--border)' }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: stat.color }}>{stat.val}</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--text-2)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
            {result.hasErrors && (
              <button
                onClick={downloadErrors}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  background: 'rgba(232,69,69,0.06)', border: '1px solid rgba(232,69,69,0.2)',
                  borderRadius: 8, padding: '10px 14px', cursor: 'pointer', color: '#e84545',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                <Download size={14} /> {result.errors.length} hata var — Hata CSV indir
              </button>
            )}
            <button
              onClick={onClose}
              style={{ marginTop: 12, width: '100%', padding: '10px', background: '#4470ff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Profile Drawer ─────────────────────────────────────────────────────────────

function ProfileDrawer({ contactId, onClose, onUpdate }: { contactId: string; onClose: () => void; onUpdate: () => void }) {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'info' | 'orders' | 'history' | 'notes'>('info')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/whatsapp/subscribers/${contactId}/profile`)
      .then(r => r.json())
      .then(d => { setData(d as ProfileData); setLoading(false) })
      .catch(() => setLoading(false))
  }, [contactId])

  async function toggleOptIn() {
    if (!data) return
    setSaving(true)
    const newStatus = data.contact.optIn === 'OPTED_IN' ? 'OPTED_OUT' : 'OPTED_IN'
    await fetch(`/api/whatsapp/subscribers/${contactId}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optIn: newStatus }),
    })
    setData(prev => prev ? { ...prev, contact: { ...prev.contact, optIn: newStatus } } : prev)
    setSaving(false)
    onUpdate()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        width: 420, height: '100%', background: 'var(--surface)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Abone Profili</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)' }}><X size={18} /></button>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#4470ff' }} />
          </div>
        ) : !data ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', fontSize: 13 }}>
            Profil yüklenemedi
          </div>
        ) : (
          <div style={{ flex: 1, padding: '20px' }}>
            {/* Avatar + Basic */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: avatarColor(data.contact.id),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color: avatarTextColor(data.contact.id), flexShrink: 0,
              }}>
                {initials(data.customer?.name ?? null, data.contact.phone)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>
                  {data.customer?.name ?? data.contact.phone}
                </p>
                {data.customer?.name && <p style={{ margin: 0, fontSize: 12, color: 'var(--text-2)' }}>{data.contact.phone}</p>}
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <OptInBadge status={data.contact.optIn} />
                  {data.customer && <SegmentBadge segment={data.customer.segment} />}
                  {data.contact.windowOpen && (
                    <span style={{ background: 'rgba(34,201,122,0.12)', color: '#22c97a', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                      Pencere Açık
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            {data.customer && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                {[
                  { label: 'Toplam Harcama', value: fmtCurrency(data.customer.totalSpent) },
                  { label: 'Sipariş Sayısı', value: data.customer.totalOrders.toString() },
                  { label: 'Son Sipariş', value: fmtDate(data.customer.lastOrder) },
                  { label: 'Risk Skoru', value: <RiskBadge risk={data.customer.riskScore} /> },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                    <p style={{ margin: '0 0 3px', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</p>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'var(--bg)', borderRadius: 8, padding: 3 }}>
              {(['info', 'orders', 'history', 'notes'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1, padding: '6px 0', background: tab === t ? 'var(--surface)' : 'none',
                    border: tab === t ? '1px solid var(--border)' : '1px solid transparent',
                    borderRadius: 6, cursor: 'pointer',
                    fontSize: 11, fontWeight: 600, color: tab === t ? 'var(--text-1)' : 'var(--text-2)',
                  }}
                >
                  {t === 'info' ? 'Bilgi' : t === 'orders' ? 'Siparişler' : t === 'history' ? 'Opt-in' : 'Notlar'}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'info' && (
              <div>
                {/* Tags */}
                {data.contact.tags.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>WA Etiketleri</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {data.contact.tags.map(t => (
                        <span key={t} style={{ background: 'rgba(159,122,250,0.12)', color: '#9f7afa', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Conversation tags */}
                {data.conversation?.tags && data.conversation.tags.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Konuşma Etiketleri</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {data.conversation.tags.map(t => (
                        <span key={t.id} style={{ background: `${t.color}20`, color: t.color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{t.name}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Customer tags */}
                {data.customer?.tags && data.customer.tags.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Müşteri Etiketleri</p>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {data.customer.tags.map(t => (
                        <span key={t} style={{ background: 'rgba(68,112,255,0.1)', color: '#4470ff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Last message */}
                {data.conversation?.lastMessage && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Son Mesaj</p>
                    <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--text-2)' }}>{fmtDate(data.conversation.lastMessage.sentAt)}</p>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-1)' }}>{data.conversation.lastMessage.content ?? '(Medya)'}</p>
                    </div>
                  </div>
                )}
                {/* Opt-in action */}
                <button
                  onClick={toggleOptIn}
                  disabled={saving}
                  style={{
                    marginTop: 8, width: '100%', padding: '10px',
                    background: data.contact.optIn === 'OPTED_IN' ? 'rgba(232,69,69,0.08)' : 'rgba(34,201,122,0.08)',
                    border: `1px solid ${data.contact.optIn === 'OPTED_IN' ? 'rgba(232,69,69,0.2)' : 'rgba(34,201,122,0.2)'}`,
                    borderRadius: 8, cursor: 'pointer',
                    color: data.contact.optIn === 'OPTED_IN' ? '#e84545' : '#22c97a',
                    fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} />}
                  {data.contact.optIn === 'OPTED_IN' ? 'Opt-out yap' : 'Opt-in yap'}
                </button>
              </div>
            )}

            {tab === 'orders' && (
              <div>
                {!data.customer?.orders?.length ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: 13 }}>
                    Sipariş bulunamadı
                  </div>
                ) : (
                  data.customer.orders.map(o => (
                    <div key={o.id} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px', marginBottom: 8, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                          {o.orderNumber ?? o.id.slice(-6)}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#22c97a' }}>{fmtCurrency(o.total)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{fmtDate(o.placedAt)}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{o.status}</span>
                      </div>
                      {o.items.length > 0 && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                          {o.items.slice(0, 2).map((item, i) => (
                            <p key={i} style={{ margin: '0 0 2px', fontSize: 11, color: 'var(--text-2)' }}>
                              {item.quantity}× {item.title}
                            </p>
                          ))}
                          {o.items.length > 2 && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)' }}>+{o.items.length - 2} daha</p>}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'history' && (
              <div>
                {!data.optInHistory?.length ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: 13 }}>
                    Opt-in geçmişi bulunamadı
                  </div>
                ) : (
                  data.optInHistory.map(h => (
                    <div key={h.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0,
                        background: h.status === 'OPTED_IN' ? '#22c97a' : h.status === 'OPTED_OUT' ? '#e84545' : '#8080a0',
                      }} />
                      <div>
                        <OptInBadge status={h.status} />
                        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-2)' }}>
                          {h.source === 'csv_import' ? 'CSV Yükleme' : h.source === 'webhook' ? 'Webhook' : 'Manuel'} · {fmtDate(h.createdAt)}
                        </p>
                        {h.note && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-3)' }}>{h.note}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'notes' && (
              <div>
                {!data.conversation?.notes?.length ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: 13 }}>
                    Henüz not yok
                    {!data.conversation && <p style={{ fontSize: 11, marginTop: 4 }}>Konuşma başladığında notlar buraya eklenir</p>}
                  </div>
                ) : (
                  data.conversation.notes.map(n => (
                    <div key={n.id} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', marginBottom: 8, border: '1px solid var(--border)' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--text-1)' }}>{n.note}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-3)' }}>{n.createdBy} · {fmtDate(n.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Bulk Action Bar ────────────────────────────────────────────────────────────

function BulkBar({ count, onClear, onBulkAction }: {
  count: number
  onClear: () => void
  onBulkAction: (action: string, payload?: Record<string, unknown>) => void
}) {
  const [tagInput, setTagInput] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10, background: '#4470ff',
      borderRadius: 10, padding: '10px 16px', marginBottom: 12,
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{count} seçildi</span>
      <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {showTagInput ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder="Etiket adı…"
              onKeyDown={e => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  onBulkAction('tag', { tag: tagInput.trim() })
                  setTagInput(''); setShowTagInput(false)
                }
              }}
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#fff', outline: 'none' }}
              autoFocus
            />
            <button onClick={() => setShowTagInput(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#fff', fontSize: 11 }}>İptal</button>
          </div>
        ) : (
          <button onClick={() => setShowTagInput(true)} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tag size={12} /> Etiket Ekle
          </button>
        )}
        <button onClick={() => onBulkAction('set_optin', { status: 'OPTED_OUT' })} style={{ background: 'rgba(232,69,69,0.2)', border: '1px solid rgba(232,69,69,0.4)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#ffb3b3', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <UserX size={12} /> Opt-out
        </button>
        <button onClick={() => { if (confirm(`${count} abone silinecek. Emin misin?`)) onBulkAction('delete') }} style={{ background: 'rgba(232,69,69,0.2)', border: '1px solid rgba(232,69,69,0.4)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#ffb3b3', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Trash2 size={12} /> Sil
        </button>
      </div>
      <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
        <X size={16} />
      </button>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [kpis, setKpis] = useState<Kpis>({ total: 0, optedIn: 0, optedOut: 0, windowOpen: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [optInFilter, setOptInFilter] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt_desc')
  const [showFilters, setShowFilters] = useState(false)

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Drawers
  const [showImport, setShowImport] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setSelected(new Set())
    try {
      const params = new URLSearchParams({
        page: String(page),
        sort: sortBy,
        ...(search && { search }),
        ...(optInFilter && { optIn: optInFilter }),
        ...(segmentFilter && { segment: segmentFilter }),
        ...(tagFilter && { tag: tagFilter }),
        ...(riskFilter && { risk: riskFilter }),
      })
      const res = await fetch(`/api/whatsapp/subscribers?${params}`)
      if (res.ok) {
        const d = await res.json()
        setSubscribers(d.subscribers ?? [])
        setTotalPages(d.totalPages ?? 0)
        if (d.kpis) setKpis(d.kpis)
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [page, search, optInFilter, segmentFilter, tagFilter, riskFilter, sortBy])

  useEffect(() => { load() }, [load])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [search, optInFilter, segmentFilter, tagFilter, riskFilter, sortBy])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    if (selected.size === subscribers.length) setSelected(new Set())
    else setSelected(new Set(subscribers.map(s => s.id)))
  }

  async function handleBulkAction(action: string, payload?: Record<string, unknown>) {
    const contactIds = Array.from(selected)
    if (!contactIds.length) return
    await fetch('/api/whatsapp/subscribers/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, contactIds, payload }),
    })
    setSelected(new Set())
    load()
  }

  function exportCsv() {
    const params = new URLSearchParams()
    if (optInFilter) params.set('optIn', optInFilter)
    if (tagFilter) params.set('tag', tagFilter)
    window.open(`/api/whatsapp/subscribers/export?${params}`, '_blank')
  }

  async function addDemoSubscriber() {
    const demoPhones = ['905551234567', '905559876543', '905553456789', '905557654321', '905551112233']
    const phone = demoPhones[Math.floor(Math.random() * demoPhones.length)] + Math.floor(Math.random() * 10)
    const form = new FormData()
    const csv = `phone,optIn,tags\n${phone},OPTED_IN,demo`
    const blob = new Blob([csv], { type: 'text/csv' })
    form.append('file', new File([blob], 'demo.csv'))
    await fetch('/api/whatsapp/subscribers/import', { method: 'POST', body: form })
    load()
  }

  const allTags = [...new Set(subscribers.flatMap(s => s.tags))]
  const hasFilters = optInFilter || segmentFilter || tagFilter || riskFilter || search

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 4px' }}>Aboneler</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>WhatsApp abone listenizi yönetin ve analiz edin</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={exportCsv}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            <Download size={13} /> Dışa Aktar
          </button>
          <button
            onClick={addDemoSubscriber}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            <Plus size={13} /> Demo Abone
          </button>
          <button
            onClick={() => setShowImport(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4470ff', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Upload size={13} /> CSV Yükle
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiCard icon="group" label="Toplam" value={kpis.total} active={optInFilter === ''} onClick={() => setOptInFilter('')} />
        <KpiCard icon="check_circle" label="Opt-in" value={kpis.optedIn} active={optInFilter === 'OPTED_IN'} onClick={() => setOptInFilter(prev => prev === 'OPTED_IN' ? '' : 'OPTED_IN')} color="#22c97a" />
        <KpiCard icon="cancel" label="Opt-out" value={kpis.optedOut} active={optInFilter === 'OPTED_OUT'} onClick={() => setOptInFilter(prev => prev === 'OPTED_OUT' ? '' : 'OPTED_OUT')} color="#e84545" />
        <KpiCard icon="chat_bubble" label="Pencere Açık" value={kpis.windowOpen} active={optInFilter === 'window_open'} onClick={() => setOptInFilter(prev => prev === 'window_open' ? '' : 'window_open')} color="#4470ff" />
      </div>

      {/* Search + filter toggle */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="İsim veya telefon ara…"
            style={{ width: '100%', paddingLeft: 36, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px 9px 36px', fontSize: 13, color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text-2)', outline: 'none' }}
        >
          <option value="createdAt_desc">En Yeni</option>
          <option value="createdAt_asc">En Eski</option>
          <option value="lastMessage_desc">Son Mesaj</option>
        </select>
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: showFilters ? 'rgba(68,112,255,0.1)' : 'var(--surface)',
            border: `1px solid ${showFilters ? '#4470ff' : 'var(--border)'}`,
            borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 500,
            color: showFilters ? '#4470ff' : 'var(--text-2)', cursor: 'pointer',
          }}
        >
          <Filter size={13} /> Filtreler {hasFilters ? '●' : ''}
        </button>
        {hasFilters && (
          <button
            onClick={() => { setOptInFilter(''); setSegmentFilter(''); setTagFilter(''); setRiskFilter(''); setSearch('') }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#e84545', cursor: 'pointer' }}
          >
            <X size={12} /> Temizle
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px', marginBottom: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Segment</label>
            <select value={segmentFilter} onChange={e => setSegmentFilter(e.target.value)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--text-1)', outline: 'none' }}>
              <option value="">Tümü</option>
              {['vip', 'champion', 'loyal', 'at_risk', 'new', 'inactive'].map(s => (
                <option key={s} value={s}>{SEGMENT_META[s]?.label ?? s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Etiket</label>
            <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--text-1)', outline: 'none' }}>
              <option value="">Tümü</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Risk</label>
            <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--text-1)', outline: 'none' }}>
              <option value="">Tümü</option>
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
            </select>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <BulkBar count={selected.size} onClear={() => setSelected(new Set())} onBulkAction={handleBulkAction} />
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '10px 14px', width: 36 }}>
                <button onClick={selectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
                  <CheckSquare size={15} />
                </button>
              </th>
              {['Abone', 'Opt-in', 'Segment', 'Harcama', 'Sipariş', 'Son Sipariş', 'Pencere', 'Etiketler', ''].map(h => (
                <th key={h} style={{ padding: '10px 10px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textAlign: 'left', whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} style={{ padding: '12px 10px' }}>
                        <div style={{ height: 12, background: 'var(--bg)', borderRadius: 4, width: [36, 140, 60, 70, 60, 50, 80, 50, 80][j] }} />
                      </td>
                    ))}
                  </tr>
                ))
              : subscribers.length === 0
              ? (
                <tr><td colSpan={9}>
                  <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--text-3)', display: 'block', marginBottom: 12 }}>group</span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 6px' }}>
                      {hasFilters ? 'Filtreyle eşleşen abone yok' : 'Henüz abone yok'}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 20px' }}>
                      {hasFilters ? 'Filtrelerinizi değiştirmeyi deneyin' : 'CSV dosyası yükleyerek aboneleri içe aktarın'}
                    </p>
                    {!hasFilters && (
                      <button onClick={() => setShowImport(true)} style={{ background: '#4470ff', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Upload size={13} /> CSV Yükle
                      </button>
                    )}
                  </div>
                </td></tr>
              )
              : subscribers.map((s, idx) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: idx < subscribers.length - 1 ? '1px solid var(--border)' : 'none',
                      background: selected.has(s.id) ? 'rgba(68,112,255,0.06)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!selected.has(s.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={e => { if (!selected.has(s.id)) e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '10px 14px' }}>
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        style={{ cursor: 'pointer', accentColor: '#4470ff' }}
                      />
                    </td>
                    {/* Name + phone */}
                    <td style={{ padding: '10px 10px' }}>
                      <button
                        onClick={() => setProfileId(s.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', padding: 0 }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: avatarColor(s.id),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800, color: avatarTextColor(s.id), flexShrink: 0,
                        }}>
                          {initials(s.name, s.phone)}
                        </div>
                        <div>
                          {s.name && <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{s.name}</p>}
                          <p style={{ fontSize: 12, color: s.name ? 'var(--text-2)' : 'var(--text-1)', margin: 0 }}>{s.phone}</p>
                        </div>
                      </button>
                    </td>
                    {/* Opt-in */}
                    <td style={{ padding: '10px 10px' }}><OptInBadge status={s.optIn} /></td>
                    {/* Segment */}
                    <td style={{ padding: '10px 10px' }}><SegmentBadge segment={s.segment} /></td>
                    {/* Spending */}
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: s.totalSpent ? '#22c97a' : 'var(--text-3)' }}>
                        {fmtCurrency(s.totalSpent)}
                      </span>
                    </td>
                    {/* Orders */}
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{s.totalOrders ?? '—'}</span>
                    </td>
                    {/* Last order */}
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{fmtDate(s.lastOrderDate)}</span>
                    </td>
                    {/* 24h window */}
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{
                        background: s.windowOpen ? 'rgba(34,201,122,0.12)' : 'rgba(128,128,160,0.08)',
                        color: s.windowOpen ? '#22c97a' : 'var(--text-3)',
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                      }}>
                        {s.windowOpen ? 'Açık' : 'Kapalı'}
                      </span>
                    </td>
                    {/* Tags */}
                    <td style={{ padding: '10px 10px' }}>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: 140 }}>
                        {s.tags.length === 0
                          ? <span style={{ fontSize: 12, color: 'var(--text-3)' }}>—</span>
                          : s.tags.slice(0, 2).map(tag => (
                              <span key={tag} style={{ background: 'rgba(159,122,250,0.12)', color: '#9f7afa', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4 }}>{tag}</span>
                            ))
                        }
                        {s.tags.length > 2 && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>+{s.tags.length - 2}</span>}
                      </div>
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '10px 10px' }}>
                      <button
                        onClick={() => setProfileId(s.id)}
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--text-2)', fontSize: 11, fontWeight: 500 }}
                      >
                        Profil
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? 'var(--text-3)' : 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
          >
            <ChevronLeft size={14} /> Önceki
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? 'var(--text-3)' : 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
          >
            Sonraki <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Import drawer */}
      {showImport && <ImportDrawer onClose={() => setShowImport(false)} onDone={load} />}

      {/* Profile drawer */}
      {profileId && (
        <ProfileDrawer
          contactId={profileId}
          onClose={() => setProfileId(null)}
          onUpdate={load}
        />
      )}
    </div>
  )
}
