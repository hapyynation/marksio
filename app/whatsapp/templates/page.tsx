'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2, RefreshCw, X, Sparkles, Send, Copy, ChevronRight, AlertTriangle } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TemplateComp {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: string
  text?: string
  buttons?: Array<{ type: string; text: string; url?: string }>
}

interface BroadcastSummary {
  id: string
  name: string
  status: string
  sentCount: number
  readCount: number
  revenue: number
  createdAt: string
}

interface TemplateVersion {
  id: string
  status: string
  rejectedReason: string | null
  attemptNote: string | null
  createdAt: string
}

interface Template {
  id: string
  accountId: string
  metaTemplateId: string
  name: string
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED'
  componentsJson: TemplateComp[]
  rejectedReason: string | null
  qualityRating: string | null
  submittedAt: string | null
  syncedAt: string
  pendingDays: number | null
  stats: {
    broadcastCount: number
    sent: number
    delivered: number
    read: number
    clicked: number
    revenue: number
  }
  broadcastHistory: BroadcastSummary[]
  versions: TemplateVersion[]
}

interface AiResult {
  name: string
  category: string
  categoryReason: string
  language: string
  components: TemplateComp[]
  variableExamples: Record<string, string>
  estimatedCostPerMessage: number
  tips: string[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CAT_CFG = {
  MARKETING:      { label: 'Pazarlama',    color: '#9f7afa', bg: 'rgba(159,122,250,0.12)' },
  UTILITY:        { label: 'Yardımcı',     color: '#4470ff', bg: 'rgba(68,112,255,0.12)' },
  AUTHENTICATION: { label: 'Kimlik Doğr.', color: '#f0a020', bg: 'rgba(240,160,32,0.12)' },
}

const STS_CFG = {
  DRAFT:    { label: 'Taslak',     color: '#8080a0', bg: 'rgba(128,128,160,0.12)' },
  APPROVED: { label: 'Onaylı',     color: '#22c97a', bg: 'rgba(34,201,122,0.12)' },
  PENDING:  { label: 'Beklemede',  color: '#f0a020', bg: 'rgba(240,160,32,0.12)' },
  REJECTED: { label: 'Reddedildi', color: '#e84545', bg: 'rgba(232,69,69,0.12)' },
  PAUSED:   { label: 'Duraklatıldı', color: '#8080a0', bg: 'rgba(128,128,160,0.1)' },
  DISABLED: { label: 'Devre Dışı', color: '#3e3e54', bg: 'rgba(62,62,84,0.15)' },
}

const QUALITY_CFG = {
  GREEN:  { label: 'İyi',   color: '#22c97a' },
  YELLOW: { label: 'Orta',  color: '#f0a020' },
  RED:    { label: 'Düşük', color: '#e84545' },
}

// Meta TR pricing (USD, approximate 2024)
const COST_USD: Record<string, number> = { MARKETING: 0.029, UTILITY: 0.0024, AUTHENTICATION: 0.0155 }
const USD_TRY = 32.5

function costPerMsg(cat: string) { return (COST_USD[cat] ?? 0.029) * USD_TRY }

function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}B` : String(n) }
function fmtRev(n: number) { return `₺${Math.round(n).toLocaleString('tr')}` }
function pct(a: number, b: number) { return b > 0 ? `%${Math.round((a / b) * 100)}` : '%0' }
function ago(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 60000
  if (d < 60) return `${Math.round(d)} dk önce`
  if (d < 1440) return `${Math.round(d / 60)} sa önce`
  return `${Math.round(d / 1440)} gün önce`
}

// Extract variable indices from template text
function extractVars(components: TemplateComp[]): string[] {
  const all: string[] = []
  for (const c of components) {
    if (c.text) {
      const matches = c.text.match(/\{\{(\d+)\}\}/g) ?? []
      matches.forEach(m => { const k = m.slice(2, -2); if (!all.includes(k)) all.push(k) })
    }
  }
  return all.sort((a, b) => Number(a) - Number(b))
}

// Replace {{N}} with values
function fillVars(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\d+)\}\}/g, (_, k) => vars[k] ? `[${vars[k]}]` : `{{${k}}}`)
}

// ─── WhatsApp Preview ────────────────────────────────────────────────────────

function WaPreview({ components, variables }: { components: TemplateComp[]; variables: Record<string, string> }) {
  const header = components.find(c => c.type === 'HEADER')
  const body   = components.find(c => c.type === 'BODY')
  const footer = components.find(c => c.type === 'FOOTER')
  const btns   = components.find(c => c.type === 'BUTTONS')

  return (
    <div style={{ background: '#0b1117', borderRadius: 16, padding: '24px 16px', minHeight: 200, overflow: 'hidden', position: 'relative', isolation: 'isolate' }}>
      {/* Phone chrome */}
      <div style={{ background: '#1f2c34', borderRadius: 12, overflow: 'hidden', maxWidth: 320, margin: '0 auto', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', position: 'relative', zIndex: 1 }}>
        {/* WA header bar */}
        <div style={{ background: '#202c33', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2a3942', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e9edef', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>İş Hesabı</div>
            <div style={{ fontSize: 11, color: '#8696a0' }}>WhatsApp Business</div>
          </div>
        </div>

        {/* Chat area */}
        <div style={{ background: '#0b141a', padding: '16px 12px', backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
          {/* Message bubble */}
          <div style={{ maxWidth: '88%', marginLeft: 'auto' }}>
            <div style={{ background: '#005c4b', borderRadius: '12px 12px 2px 12px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
              {header && header.format === 'TEXT' && header.text && (
                <div style={{ padding: '8px 12px 4px', fontSize: 13, fontWeight: 700, color: '#e9edef', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {fillVars(header.text, variables)}
                </div>
              )}
              {header && header.format === 'IMAGE' && (
                <div style={{ background: '#2a3942', height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#8696a0' }}>image</span>
                </div>
              )}
              {body?.text && (
                <div style={{ padding: '8px 12px', fontSize: 13, color: '#e9edef', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {fillVars(body.text, variables)}
                </div>
              )}
              {footer?.text && (
                <div style={{ padding: '2px 12px 8px', fontSize: 11, color: '#8696a0' }}>
                  {fillVars(footer.text, variables)}
                </div>
              )}
              <div style={{ padding: '2px 8px 6px', textAlign: 'right', fontSize: 10, color: '#8696a0' }}>
                {new Date().toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' })} ✓✓
              </div>
            </div>
            {btns?.buttons && btns.buttons.length > 0 && (
              <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {btns.buttons.map((btn, i) => (
                  <div key={i} style={{ background: '#005c4b', borderRadius: i === btns.buttons!.length - 1 ? '2px 2px 12px 12px' : 2, padding: '8px 12px', textAlign: 'center', fontSize: 13, color: '#53bdeb', fontWeight: 500 }}>
                    {btn.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Drawer ──────────────────────────────────────────────────────────────────

function TemplateDrawer({
  template,
  onClose,
  onClone,
}: {
  template: Template
  onClose: () => void
  onClone: (t: Template) => void
}) {
  const [tab, setTab] = useState<'preview' | 'perf' | 'history' | 'send'>('preview')
  const [vars, setVars] = useState<Record<string, string>>({})
  const [testPhone, setTestPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const varKeys = extractVars(template.componentsJson)
  const catCfg = CAT_CFG[template.category] ?? CAT_CFG.MARKETING
  const stsCfg = STS_CFG[template.status] ?? STS_CFG.PENDING
  const qualCfg = template.qualityRating ? QUALITY_CFG[template.qualityRating as keyof typeof QUALITY_CFG] : null
  const costTRY = costPerMsg(template.category)

  async function handleTestSend() {
    setSending(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/whatsapp/templates/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id, toPhone: testPhone, variables: vars }),
      })
      const d = await res.json() as { ok?: boolean; error?: string }
      setSendResult({ ok: !!d.ok, msg: d.ok ? 'Mesaj gönderildi!' : (d.error ?? 'Hata oluştu') })
    } catch {
      setSendResult({ ok: false, msg: 'Bağlantı hatası' })
    } finally {
      setSending(false)
    }
  }

  const TABS = [
    { key: 'preview', label: 'Önizleme' },
    { key: 'perf', label: 'Performans' },
    { key: 'history', label: 'Geçmiş' },
    { key: 'send', label: 'Test Gönder' },
  ] as const

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
      <div style={{ position: 'relative', width: 440, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Drawer header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 4px', fontFamily: 'monospace' }}>{template.name}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: stsCfg.bg, color: stsCfg.color }}>{stsCfg.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: catCfg.bg, color: catCfg.color }}>{catCfg.label}</span>
                {qualCfg && (
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: `${qualCfg.color}18`, color: qualCfg.color }}>
                    Kalite: {qualCfg.label}
                  </span>
                )}
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{template.language.toUpperCase()}</span>
              </div>
              {template.status === 'PENDING' && template.pendingDays !== null && template.pendingDays > 0 && (
                <p style={{ fontSize: 11, color: '#f0a020', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={11} /> {template.pendingDays} gündür onay bekliyor
                </p>
              )}
              {template.status === 'REJECTED' && template.rejectedReason && (
                <div style={{ marginTop: 8, background: 'rgba(232,69,69,0.1)', border: '1px solid rgba(232,69,69,0.2)', borderRadius: 6, padding: '6px 10px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#e84545', margin: '0 0 2px' }}>Red Sebebi</p>
                  <p style={{ fontSize: 11, color: '#e84545', margin: 0, opacity: 0.85 }}>{template.rejectedReason}</p>
                </div>
              )}
              {template.qualityRating && ['YELLOW', 'RED'].includes(template.qualityRating) && (
                <div style={{ marginTop: 8, background: 'rgba(240,160,32,0.08)', border: '1px solid rgba(240,160,32,0.2)', borderRadius: 6, padding: '6px 10px' }}>
                  <p style={{ fontSize: 11, color: '#f0a020', margin: 0 }}>
                    ⚠️ Kalite puanı düşük — kullanıcı şikayetleri ya da düşük etkileşim nedeniyle Meta bu şablonu kısıtlayabilir.
                  </p>
                </div>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, flexShrink: 0 }}>
              <X size={18} />
            </button>
          </div>

          {/* Cost estimate */}
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, padding: '8px 12px' }}>
              <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gönderim Maliyeti</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>₺{costTRY.toFixed(3)}/mesaj</p>
            </div>
            <div style={{ flex: 1, background: 'var(--bg)', borderRadius: 8, padding: '8px 12px' }}>
              <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Broadcast Sayısı</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>{template.stats.broadcastCount}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={() => onClone(template)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 500, color: 'var(--text-1)', cursor: 'pointer' }}
            >
              <Copy size={12} /> Klonla
            </button>
            {template.status === 'APPROVED' && (
              <button
                onClick={() => setTab('send')}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(34,201,122,0.1)', border: '1px solid rgba(34,201,122,0.25)', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 500, color: '#22c97a', cursor: 'pointer' }}
              >
                <Send size={12} /> Test Gönder
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: '10px 4px', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: tab === t.key ? '#4470ff' : 'var(--text-3)', borderBottom: tab === t.key ? '2px solid #4470ff' : '2px solid transparent', transition: 'color 0.15s' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {tab === 'preview' && (
            <div>
              {varKeys.length > 0 && (
                <div style={{ marginBottom: 12, background: 'var(--bg)', borderRadius: 8, padding: '12px' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Değişken Değerleri</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {varKeys.map(k => (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9f7afa', background: 'rgba(159,122,250,0.1)', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{`{{${k}}}`}</span>
                        <input
                          value={vars[k] ?? ''}
                          onChange={e => setVars(v => ({ ...v, [k]: e.target.value }))}
                          placeholder={`Değişken ${k}`}
                          style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', fontSize: 12, color: 'var(--text-1)', outline: 'none' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <WaPreview components={template.componentsJson} variables={vars} />
            </div>
          )}

          {tab === 'perf' && (
            <div>
              {template.stats.broadcastCount === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36, marginBottom: 8, display: 'block' }}>analytics</span>
                  <p style={{ fontSize: 13 }}>Bu şablon henüz broadcast'te kullanılmadı</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: 'Toplam Gönderim', value: fmt(template.stats.sent) },
                      { label: 'Teslim Oranı', value: pct(template.stats.delivered, template.stats.sent) },
                      { label: 'Okunma Oranı', value: pct(template.stats.read, template.stats.sent) },
                      { label: 'Tıklama Oranı', value: pct(template.stats.clicked, template.stats.sent) },
                      { label: 'Toplam Gelir', value: fmtRev(template.stats.revenue) },
                      { label: 'Broadcast Sayısı', value: String(template.stats.broadcastCount) },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Broadcast Geçmişi</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {template.broadcastHistory.slice(0, 10).map(b => (
                      <div key={b.id} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{b.name}</span>
                          <span style={{ fontSize: 11, color: b.status === 'COMPLETED' ? '#22c97a' : 'var(--text-3)' }}>{b.status}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmt(b.sentCount)} gönderim</span>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{pct(b.readCount, b.sentCount)} okunma</span>
                          {b.revenue > 0 && <span style={{ fontSize: 11, color: '#22c97a' }}>{fmtRev(b.revenue)}</span>}
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{ago(b.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div>
              {template.versions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 36, marginBottom: 8, display: 'block' }}>history</span>
                  <p style={{ fontSize: 13 }}>Henüz deneme geçmişi yok</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {template.versions.map((v, i) => {
                    const vcfg = STS_CFG[v.status as keyof typeof STS_CFG] ?? STS_CFG.PENDING
                    return (
                      <div key={v.id} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', position: 'relative', paddingLeft: 20 }}>
                        <div style={{ position: 'absolute', left: 8, top: 14, width: 6, height: 6, borderRadius: '50%', background: vcfg.color }} />
                        {i < template.versions.length - 1 && (
                          <div style={{ position: 'absolute', left: 10, top: 20, bottom: -8, width: 2, background: 'var(--border)' }} />
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: vcfg.bg, color: vcfg.color }}>{vcfg.label}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{ago(v.createdAt)}</span>
                        </div>
                        {v.attemptNote && <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '2px 0 0' }}>{v.attemptNote}</p>}
                        {v.rejectedReason && <p style={{ fontSize: 11, color: '#e84545', margin: '4px 0 0' }}>{v.rejectedReason}</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'send' && (
            <div>
              {template.status !== 'APPROVED' ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)' }}>
                  <p style={{ fontSize: 13 }}>Yalnızca onaylı şablonlar gönderilebilir</p>
                </div>
              ) : (
                <>
                  {varKeys.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Değişken Değerleri</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {varKeys.map(k => (
                          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9f7afa', background: 'rgba(159,122,250,0.1)', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>{`{{${k}}}`}</span>
                            <input
                              value={vars[k] ?? ''}
                              onChange={e => setVars(v => ({ ...v, [k]: e.target.value }))}
                              placeholder={`Değişken ${k}`}
                              style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', fontSize: 12, color: 'var(--text-1)', outline: 'none' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Telefon Numarası</p>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                      value={testPhone}
                      onChange={e => setTestPhone(e.target.value)}
                      placeholder="905551234567"
                      style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text-1)', outline: 'none' }}
                    />
                    <button
                      onClick={handleTestSend}
                      disabled={sending || !testPhone}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#22c97a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: sending || !testPhone ? 'not-allowed' : 'pointer', opacity: sending || !testPhone ? 0.6 : 1 }}
                    >
                      {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      Gönder
                    </button>
                  </div>
                  {sendResult && (
                    <div style={{ background: sendResult.ok ? 'rgba(34,201,122,0.1)' : 'rgba(232,69,69,0.1)', border: `1px solid ${sendResult.ok ? 'rgba(34,201,122,0.25)' : 'rgba(232,69,69,0.25)'}`, borderRadius: 8, padding: '10px 12px' }}>
                      <p style={{ fontSize: 12, color: sendResult.ok ? '#22c97a' : '#e84545', margin: 0 }}>
                        {sendResult.ok ? '✓ ' : '✗ '}{sendResult.msg}
                      </p>
                    </div>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 12 }}>
                    ⚠️ Bu gerçek bir Meta API çağrısıdır — mesaj numaraya iletilir.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── AI Generator Modal ──────────────────────────────────────────────────────

function AiGeneratorModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [bodyText, setBodyText] = useState('')
  const [buttonText, setButtonText] = useState('')
  const [buttonUrl, setButtonUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [result, setResult] = useState<AiResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [draftResult, setDraftResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function generate() {
    if (!bodyText.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setSubmitResult(null)
    setDraftResult(null)
    try {
      const res = await fetch('/api/whatsapp/templates/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyText: bodyText.trim(),
          buttonText: buttonText.trim() || undefined,
          buttonUrl: buttonUrl.trim() || undefined,
        }),
      })
      const d = await res.json() as AiResult & { error?: string }
      if (!res.ok || d.error) { setError(d.error ?? 'Hata oluştu'); return }
      setResult(d)
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  async function submitToMeta() {
    if (!result) return
    setSubmitting(true)
    setSubmitResult(null)
    try {
      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.name,
          category: result.category,
          language: result.language,
          components: result.components,
        }),
      })
      const text = await res.text()
      let d: { template?: unknown; error?: string }
      try {
        d = JSON.parse(text) as typeof d
      } catch {
        setSubmitResult({ ok: false, msg: `Sunucu hatası (${res.status}): ${text.slice(0, 120)}` })
        return
      }
      if (!res.ok || d.error) {
        setSubmitResult({ ok: false, msg: d.error ?? 'Şablon gönderilemedi' })
      } else {
        setSubmitResult({ ok: true, msg: 'Şablon Meta\'ya gönderildi! Onay bekleniyor.' })
        onCreated()
      }
    } catch (err) {
      setSubmitResult({ ok: false, msg: `Ağ hatası: ${err instanceof Error ? err.message : String(err)}` })
    } finally {
      setSubmitting(false)
    }
  }

  async function saveDraft() {
    if (!result) return
    setSavingDraft(true)
    setDraftResult(null)
    try {
      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: result.name,
          category: result.category,
          language: result.language,
          components: result.components,
          saveDraft: true,
        }),
      })
      const text = await res.text()
      let d: { template?: unknown; error?: string }
      try { d = JSON.parse(text) as typeof d } catch {
        setDraftResult({ ok: false, msg: `Sunucu hatası (${res.status})` })
        return
      }
      if (!res.ok || d.error) {
        setDraftResult({ ok: false, msg: d.error ?? 'Taslak kaydedilemedi' })
      } else {
        setDraftResult({ ok: true, msg: 'Taslak kaydedildi. Şablonlar listesinde görüntüleyebilirsiniz.' })
        onCreated()
      }
    } catch (err) {
      setDraftResult({ ok: false, msg: `Ağ hatası: ${err instanceof Error ? err.message : String(err)}` })
    } finally {
      setSavingDraft(false)
    }
  }

  const COST: Record<string, number> = { MARKETING: 0.029, UTILITY: 0.0024, AUTHENTICATION: 0.0155 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} />
      <div style={{ position: 'relative', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, width: '90%', maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} color="#9f7afa" />
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>AI Şablon Oluşturucu</h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>Mesajını yaz, AI Meta formatına dönüştürsün</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                Mesaj metni <span style={{ color: '#e84545' }}>*</span>
              </label>
              <textarea
                value={bodyText}
                onChange={e => setBodyText(e.target.value)}
                placeholder={'Gönderilecek mesajı tam olarak yaz.\nÖrn: SEPETTE10 koduyla %10 indirim kazanın! Kampanya 3 gün sürecek.'}
                rows={4}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px', fontSize: 13, color: 'var(--text-1)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-3)' }}>AI bu metni kelimesi kelimesine kullanacak — değiştirmeyecek.</p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                  Buton metni <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(isteğe bağlı)</span>
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={e => setButtonText(e.target.value)}
                  placeholder="Örn: Alışverişe Başla"
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
                  Link <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(isteğe bağlı)</span>
                </label>
                <input
                  type="url"
                  value={buttonUrl}
                  onChange={e => setButtonUrl(e.target.value)}
                  placeholder="https://..."
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button
              onClick={generate}
              disabled={loading || !bodyText.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(159,122,250,0.15)', border: '1px solid rgba(159,122,250,0.3)', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, color: '#9f7afa', cursor: loading || !bodyText.trim() ? 'not-allowed' : 'pointer', opacity: loading || !bodyText.trim() ? 0.6 : 1, alignSelf: 'flex-start' }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {loading ? 'Yapılandırılıyor...' : 'Meta Formatına Dönüştür'}
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(232,69,69,0.1)', border: '1px solid rgba(232,69,69,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: '#e84545', margin: 0 }}>{error}</p>
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Meta header */}
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '14px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', background: 'rgba(68,112,255,0.1)', color: '#4470ff', padding: '3px 8px', borderRadius: 6 }}>{result.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: (CAT_CFG[result.category as keyof typeof CAT_CFG] ?? CAT_CFG.MARKETING).bg, color: (CAT_CFG[result.category as keyof typeof CAT_CFG] ?? CAT_CFG.MARKETING).color }}>
                    {(CAT_CFG[result.category as keyof typeof CAT_CFG] ?? CAT_CFG.MARKETING).label}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)', padding: '3px 8px' }}>₺{((COST[result.category] ?? 0.029) * USD_TRY).toFixed(3)}/mesaj</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{result.categoryReason}</p>
              </div>

              {/* Preview */}
              <WaPreview components={result.components} variables={result.variableExamples} />

              {result.tips.length > 0 && (
                <div style={{ background: 'rgba(68,112,255,0.06)', border: '1px solid rgba(68,112,255,0.15)', borderRadius: 8, padding: '12px 14px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#4470ff', margin: '0 0 8px' }}>AI İpuçları</p>
                  {result.tips.map((tip, i) => (
                    <p key={i} style={{ fontSize: 12, color: 'var(--text-2)', margin: i < result.tips.length - 1 ? '0 0 4px' : 0 }}>• {tip}</p>
                  ))}
                </div>
              )}

              {submitResult && (
                <div style={{ background: submitResult.ok ? 'rgba(34,201,122,0.08)' : 'rgba(232,69,69,0.08)', border: `1px solid ${submitResult.ok ? 'rgba(34,201,122,0.25)' : 'rgba(232,69,69,0.25)'}`, borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ fontSize: 12, color: submitResult.ok ? '#22c97a' : '#e84545', margin: 0 }}>{submitResult.msg}</p>
                </div>
              )}

              {draftResult && (
                <div style={{ background: draftResult.ok ? 'rgba(34,201,122,0.08)' : 'rgba(232,69,69,0.08)', border: `1px solid ${draftResult.ok ? 'rgba(34,201,122,0.25)' : 'rgba(232,69,69,0.25)'}`, borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ fontSize: 12, color: draftResult.ok ? '#22c97a' : '#e84545', margin: 0 }}>{draftResult.msg}</p>
                </div>
              )}

              {!submitResult?.ok && !draftResult?.ok && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={saveDraft}
                    disabled={savingDraft || submitting}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', cursor: savingDraft || submitting ? 'not-allowed' : 'pointer', opacity: savingDraft || submitting ? 0.6 : 1 }}
                  >
                    {savingDraft ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                    {savingDraft ? 'Kaydediliyor...' : 'Taslak Olarak Kaydet'}
                  </button>
                  <button
                    onClick={submitToMeta}
                    disabled={submitting || savingDraft}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(68,112,255,0.15)', border: '1px solid rgba(68,112,255,0.35)', borderRadius: 8, padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#4470ff', cursor: submitting || savingDraft ? 'not-allowed' : 'pointer', opacity: submitting || savingDraft ? 0.6 : 1 }}
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {submitting ? 'Gönderiliyor...' : 'Meta\'ya Gönder'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Clone Modal ─────────────────────────────────────────────────────────────

function CloneModal({ template, onClose, onSuccess }: { template: Template; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(`${template.name}_v2`)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function clone() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/whatsapp/templates/${template.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clone', newName: name, attemptNote: note }),
      })
      const d = await res.json() as { clone?: unknown; error?: string }
      if (!res.ok || d.error) { setError(d.error ?? 'Hata'); return }
      onSuccess()
      onClose()
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} />
      <div style={{ position: 'relative', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, width: 380, padding: '20px 24px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>Şablonu Klonla</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-3)' }}>{template.name}</p>

        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Yeni İsim</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="lowercase_underscore"
          style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
        />

        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Not (opsiyonel)</label>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Neden klonlandı?"
          style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
        />

        {error && <p style={{ fontSize: 12, color: '#e84545', marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px', fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>İptal</button>
          <button onClick={clone} disabled={loading || !name.trim()} style={{ flex: 1, background: '#4470ff', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: loading || !name.trim() ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {loading ? <Loader2 size={13} className="animate-spin" /> : null} Klonla
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  const [selected, setSelected] = useState<Template | null>(null)
  const [cloneTarget, setCloneTarget] = useState<Template | null>(null)
  const [showAI, setShowAI] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/templates')
      if (res.ok) {
        const d = await res.json() as { templates: Template[]; lastSyncAt: string | null; lastSyncError: string | null }
        setTemplates(d.templates ?? [])
        setLastSyncAt(d.lastSyncAt)
        setSyncError(d.lastSyncError)
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSync() {
    setSyncing(true)
    setSyncError(null)
    try {
      const res = await fetch('/api/whatsapp/templates/sync', { method: 'POST' })
      const d = await res.json() as { synced?: number; lastSyncAt?: string; error?: string; detail?: string }
      if (!res.ok) {
        setSyncError(d.detail ?? d.error ?? 'Senkronizasyon başarısız')
      } else {
        setLastSyncAt(d.lastSyncAt ?? null)
        setSyncError(null)
      }
      load()
    } catch {
      setSyncError('Bağlantı hatası')
      load()
    } finally { setSyncing(false) }
  }

  const filtered = useMemo(() => {
    return templates.filter(t => {
      const q = search.toLowerCase()
      if (q && !t.name.toLowerCase().includes(q)) return false
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false
      if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false
      return true
    })
  }, [templates, search, statusFilter, categoryFilter])

  const counts = useMemo(() => ({
    all: templates.length,
    approved: templates.filter(t => t.status === 'APPROVED').length,
    pending: templates.filter(t => t.status === 'PENDING').length,
    rejected: templates.filter(t => t.status === 'REJECTED').length,
  }), [templates])

  // Aggregate revenue across all templates
  const totalRevenue = useMemo(() => templates.reduce((a, t) => a + t.stats.revenue, 0), [templates])

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px' }}>Şablon Yönetimi</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Meta tarafından onaylanan WhatsApp şablonlarınız</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowAI(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(159,122,250,0.12)', color: '#9f7afa', border: '1px solid rgba(159,122,250,0.25)', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Sparkles size={13} /> AI Oluştur
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg)', color: 'var(--text-1)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Şablonları Yenile
          </button>
        </div>
      </div>

      {/* Sync status */}
      {(lastSyncAt || syncError) && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          {syncError ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(232,69,69,0.08)', border: '1px solid rgba(232,69,69,0.2)', borderRadius: 6, padding: '5px 12px' }}>
              <AlertTriangle size={12} color="#e84545" />
              <span style={{ fontSize: 12, color: '#e84545' }}>Sync hatası: {syncError}</span>
            </div>
          ) : lastSyncAt ? (
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Son senkronizasyon: {ago(lastSyncAt)}</span>
          ) : null}
        </div>
      )}

      {/* KPI stat chips — clickable to filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'ALL', label: 'Toplam', value: counts.all, icon: 'description', color: 'var(--text-2)' },
          { key: 'APPROVED', label: 'onaylı', value: counts.approved, icon: 'check_circle', color: '#22c97a' },
          { key: 'PENDING', label: 'beklemede', value: counts.pending, icon: 'schedule', color: '#f0a020' },
          { key: 'REJECTED', label: 'reddedildi', value: counts.rejected, icon: 'cancel', color: '#e84545' },
        ].map(chip => (
          <button
            key={chip.key}
            onClick={() => setStatusFilter(s => s === chip.key ? 'ALL' : chip.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: statusFilter === chip.key ? `${chip.color}18` : 'var(--bg)', border: `1px solid ${statusFilter === chip.key ? chip.color : 'var(--border)'}`, borderRadius: 20, padding: '4px 12px', cursor: 'pointer', transition: 'all 0.15s' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: chip.color }}>{chip.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{chip.value}</span>
            <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{chip.label}</span>
          </button>
        ))}
        {totalRevenue > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,201,122,0.08)', border: '1px solid rgba(34,201,122,0.2)', borderRadius: 20, padding: '4px 12px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#22c97a' }}>payments</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#22c97a' }}>{fmtRev(totalRevenue)}</span>
            <span style={{ fontSize: 11, color: 'var(--text-2)' }}>toplam gelir</span>
          </div>
        )}
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-3)', pointerEvents: 'none' }}>search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Şablon ara..."
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px 9px 34px', fontSize: 13, color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text-1)', outline: 'none' }}
        >
          <option value="ALL">Tüm Kategoriler</option>
          <option value="MARKETING">Pazarlama</option>
          <option value="UTILITY">Yardımcı</option>
          <option value="AUTHENTICATION">Kimlik Doğr.</option>
        </select>
      </div>

      {/* Template Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Şablon Adı', 'Kategori', 'Durum', 'Kalite', 'Broadcast', 'Gelir', 'Gönderim Maliyeti', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textAlign: 'left', whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {[200, 80, 70, 60, 40, 70, 90, 30].map((w, j) => (
                    <td key={j} style={{ padding: '12px 14px' }}>
                      <div style={{ height: 12, background: 'var(--bg)', borderRadius: 4, width: w, animation: 'pulse 1.5s infinite' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--text-3)', display: 'block', marginBottom: 8 }}>description</span>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 4px' }}>
                      {search || statusFilter !== 'ALL' || categoryFilter !== 'ALL' ? 'Filtrelerle eşleşen şablon yok' : 'Henüz şablon yok'}
                    </p>
                    {!search && statusFilter === 'ALL' && categoryFilter === 'ALL' && (
                      <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 16px' }}>Meta'dan şablonlarınızı senkronize edin</p>
                    )}
                    {!search && statusFilter === 'ALL' && categoryFilter === 'ALL' && (
                      <button onClick={handleSync} disabled={syncing} style={{ background: '#22c97a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {syncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                        Şablonları Yenile
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((t, idx) => {
                const catCfg = CAT_CFG[t.category] ?? CAT_CFG.MARKETING
                const stsCfg = STS_CFG[t.status] ?? STS_CFG.PENDING
                const qualCfg = t.qualityRating ? QUALITY_CFG[t.qualityRating as keyof typeof QUALITY_CFG] : null
                const cost1k = costPerMsg(t.category) * 1000

                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-1)' }}>{t.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.language.toUpperCase()}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: catCfg.bg, color: catCfg.color }}>{catCfg.label}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: stsCfg.bg, color: stsCfg.color }}>{stsCfg.label}</span>
                        {t.status === 'PENDING' && t.pendingDays !== null && t.pendingDays > 0 && (
                          <span style={{ fontSize: 10, color: '#f0a020' }}>{t.pendingDays} gün</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {qualCfg ? (
                        <span style={{ fontSize: 11, fontWeight: 600, color: qualCfg.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: qualCfg.color, display: 'inline-block' }} />
                          {qualCfg.label}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{t.stats.broadcastCount}</span>
                      {t.stats.sent > 0 && <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'block' }}>{fmt(t.stats.sent)} gönderim</span>}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {t.stats.revenue > 0 ? (
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#22c97a' }}>{fmtRev(t.stats.revenue)}</span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>₺{cost1k.toFixed(0)}/1k</span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <ChevronRight size={14} color="var(--text-3)" />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {selected && (
        <TemplateDrawer
          template={selected}
          onClose={() => setSelected(null)}
          onClone={t => { setCloneTarget(t); setSelected(null) }}
        />
      )}

      {/* Clone modal */}
      {cloneTarget && (
        <CloneModal
          template={cloneTarget}
          onClose={() => setCloneTarget(null)}
          onSuccess={() => { load(); setCloneTarget(null) }}
        />
      )}

      {/* AI Generator modal */}
      {showAI && <AiGeneratorModal onClose={() => setShowAI(false)} onCreated={() => { setShowAI(false); load() }} />}
    </div>
  )
}
