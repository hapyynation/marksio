'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface Template {
  id: string
  name: string
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED'
  rejectedReason?: string
}


const CATEGORY_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  MARKETING:      { label: 'Pazarlama',    bg: '#EDE9FE', color: '#7C3AED' },
  UTILITY:        { label: 'Yardımcı',     bg: '#DBEAFE', color: '#2563EB' },
  AUTHENTICATION: { label: 'Kimlik Doğr.', bg: '#FEF3C7', color: '#D97706' },
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  APPROVED: { label: 'Onaylı',    bg: '#DCFCE7', color: '#16A34A' },
  PENDING:  { label: 'Beklemede', bg: '#FEF3C7', color: '#D97706' },
  REJECTED: { label: 'Reddedildi', bg: '#FEE2E2', color: '#DC2626' },
}

function StatChip({ icon, value, label, color = '#6B7280' }: { icon: string; value: string | number; label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 14, color }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{label}</span>
    </div>
  )
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/templates')
      if (res.ok) {
        const d = await res.json()
        setTemplates(d.templates ?? [])
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSync() {
    setSyncing(true)
    try {
      await fetch('/api/whatsapp/templates/sync', { method: 'POST' })
      load()
    } catch { load() } finally { setSyncing(false) }
  }

  const approved = templates.filter(t => t.status === 'APPROVED').length
  const pending = templates.filter(t => t.status === 'PENDING').length
  const rejected = templates.filter(t => t.status === 'REJECTED').length

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px' }}>Şablonlar</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Meta tarafından onaylanan WhatsApp şablonlarınız</p>
        </div>
        <button
          onClick={handleSync} disabled={syncing}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg)', color: '#374151', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          Şablonları Yenile
        </button>
      </div>

      {/* Stat chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatChip icon="description" value={templates.length} label="toplam" />
        <StatChip icon="check_circle" value={approved} label="onaylı" color="#16A34A" />
        <StatChip icon="schedule" value={pending} label="beklemede" color="#D97706" />
        <StatChip icon="cancel" value={rejected} label="reddedildi" color="#DC2626" />
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)', borderBottom: '1px solid #E5E7EB' }}>
              {['Şablon Adı', 'Kategori', 'Dil', 'Durum', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textAlign: 'left', whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {[160, 80, 40, 70, 20].map((w, j) => (
                      <td key={j} style={{ padding: '12px 14px' }}><div style={{ height: 12, background: '#F3F4F6', borderRadius: 4, width: w }} /></td>
                    ))}
                  </tr>
                ))
              : templates.length === 0
              ? (
                <tr><td colSpan={5}>
                  <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                    <img src="/whatsapp/empty-templates.png" alt="Şablon yok" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 12, marginBottom: 12, opacity: 0.85 }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>Henüz şablon yok</p>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 16px' }}>Meta'dan şablonlarınızı senkronize edin</p>
                    <button onClick={handleSync} disabled={syncing} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                      Şablonları Yenile
                    </button>
                  </div>
                </td></tr>
              )
              : templates.map((t, idx) => {
                  const catCfg = CATEGORY_CONFIG[t.category] ?? CATEGORY_CONFIG.UTILITY
                  const stsCfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.PENDING
                  const isExpanded = expanded === t.id
                  return (
                    <>
                      <tr
                        key={t.id}
                        style={{ borderBottom: (!isExpanded && idx < templates.length - 1) ? '1px solid #F3F4F6' : '1px solid #F3F4F6', transition: 'background 0.1s', cursor: t.status === 'REJECTED' ? 'pointer' : 'default' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        onClick={() => t.status === 'REJECTED' && setExpanded(isExpanded ? null : t.id)}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-1)' }}>{t.name}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: catCfg.bg, color: catCfg.color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>{catCfg.label}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{t.language.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ background: stsCfg.bg, color: stsCfg.color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>{stsCfg.label}</span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          {t.status === 'REJECTED' && (
                            <span style={{ color: 'var(--text-3)' }}>{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && t.rejectedReason && (
                        <tr key={`${t.id}-reason`} style={{ borderBottom: idx < templates.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                          <td colSpan={5} style={{ padding: '10px 14px 14px 40px', background: '#FFF7F7' }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#FEE2E2', borderRadius: 8, padding: '10px 14px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#DC2626', flexShrink: 0, marginTop: 1 }}>error</span>
                              <div>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#991B1B', margin: '0 0 2px' }}>Red Sebebi</p>
                                <p style={{ fontSize: 12, color: '#B91C1C', margin: 0 }}>{t.rejectedReason}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
