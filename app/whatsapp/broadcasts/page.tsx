'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Send, Loader2, X, Sparkles, ChevronDown, Trash2, Eye, Trophy, BarChart2, TrendingUp, Check, FlaskConical } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BroadcastStats {
  total: number; sent: number; delivered: number; read: number
  clicked: number; converted: number; failed: number; revenue: number; roi: number
  deliveryRate: number; readRate: number; clickRate: number; conversionRate: number
}

interface Broadcast {
  id: string; name: string; description: string | null
  demo?: boolean
  templateName: string; templateBody: string; templateCategory: string
  segmentId: string | null; segmentName: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED'
  sendType: string; scheduledAt: string | null; sentAt: string | null; createdAt: string
  stats: BroadcastStats
}

interface KpiData {
  total: number; totalSent: number; totalDelivered: number; deliveryRate: number
  totalRead: number; readRate: number; totalClicked: number; clickRate: number
  totalConverted: number; totalRevenue: number; avgRoi: number
}

interface SegmentOption {
  id: string; name: string; icon: string; description: string; count: number; estimatedRevenue: number
}

interface Template {
  id: string; name: string; status: string; category: string; body: string
}

interface Account { id: string; displayName: string | null; status: string; isDemo?: boolean }

interface AiResult {
  name: string; recommendedSegmentId: string; segmentReason: string
  message: string; cta: string; utmCampaign: string
  estimatedRevenue: number; segmentCount: number; tips: string[]
}

interface HourlyStat { hour: number; label: string; sent: number; delivered: number; read: number }

interface DetailData {
  broadcast: Broadcast & { updatedAt: string }
  hourlyStats: HourlyStat[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  DRAFT:     { label: 'Taslak',       bg: 'rgba(128,128,160,0.15)', color: 'var(--text-2)' },
  SCHEDULED: { label: 'Planlandı',    bg: 'rgba(68,112,255,0.12)',  color: '#4470ff' },
  SENDING:   { label: 'Gönderiliyor', bg: 'rgba(240,160,32,0.12)',  color: '#f0a020' },
  SENT:      { label: 'Gönderildi',   bg: 'rgba(34,201,122,0.12)',  color: '#22c97a' },
  FAILED:    { label: 'Başarısız',    bg: 'rgba(232,69,69,0.12)',   color: '#e84545' },
}

const WIZARD_STEPS = ['Bilgiler', 'Hedef Kitle', 'Şablon', 'Gönderim', 'Önizleme']

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-1)', outline: 'none',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, iconColor }: { icon: string; label: string; value: string | number; sub?: string; iconColor?: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', flex: '1 1 140px', minWidth: 130 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: iconColor ?? 'var(--text-2)' }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.DRAFT
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  )
}

function Funnel({ stats }: { stats: BroadcastStats }) {
  if (stats.sent === 0) return <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>Henüz gönderim yapılmadı</p>
  const steps = [
    { label: 'Gönderilen', val: stats.sent, pct: 100, color: '#4470ff' },
    { label: 'Teslim Edilen', val: stats.delivered, pct: stats.deliveryRate, color: '#22c97a' },
    { label: 'Okunan', val: stats.read, pct: stats.readRate, color: '#9f7afa' },
    { label: 'Tıklayan', val: stats.clicked, pct: stats.clickRate, color: '#f0a020' },
    { label: 'Satın Alan', val: stats.converted, pct: stats.conversionRate, color: '#22c97a' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {steps.map(s => (
        <div key={s.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{s.label}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)' }}>{s.val.toLocaleString('tr')}</span>
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>%{s.pct}</span>
            </div>
          </div>
          <div style={{ height: 5, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function WhatsAppPreview({ body, templateName }: { body: string; templateName: string }) {
  const text = body || `Şablon: ${templateName}`
  return (
    <div style={{ background: '#0a1628', borderRadius: 16, padding: '20px 16px', maxWidth: 300, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 16 }}>🏪</span>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Mağazanız</div>
          <div style={{ fontSize: 10, color: '#8696a0' }}>İşletme Hesabı ✓</div>
        </div>
      </div>
      <div style={{ background: '#202c33', borderRadius: '0 12px 12px 12px', padding: '10px 14px', maxWidth: 240, fontSize: 13, color: '#e9edef', lineHeight: 1.6 }}>
        {text.replace(/{{1}}/g, 'Ahmet').replace(/{{2}}/g, 'İndirim')}
        <div style={{ fontSize: 10, color: '#8696a0', textAlign: 'right', marginTop: 6 }}>
          {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} ✓✓
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BroadcastsPage() {
  // Data
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [kpis, setKpis] = useState<KpiData | null>(null)
  const [loading, setLoading] = useState(true)

  // Detail panel
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sending, setSending] = useState(false)

  // Wizard
  const [showWizard, setShowWizard] = useState(false)
  const [wStep, setWStep] = useState(1)
  const [wName, setWName] = useState('')
  const [wDesc, setWDesc] = useState('')
  const [wSegmentId, setWSegmentId] = useState('all')
  const [wTemplateId, setWTemplateId] = useState('')
  const [wSendType, setWSendType] = useState('IMMEDIATE')
  const [wScheduledAt, setWScheduledAt] = useState('')
  const [wCreating, setWCreating] = useState(false)
  const [wError, setWError] = useState<string | null>(null)

  // Wizard data
  const [templates, setTemplates] = useState<Template[]>([])
  const [segments, setSegments] = useState<SegmentOption[]>([])
  const [segmentsLoading, setSegmentsLoading] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)

  // Demo mode
  const [isDemo, setIsDemo] = useState(false)
  const [demoCreating, setDemoCreating] = useState(false)

  // AI Generator
  const [showAiGen, setShowAiGen] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiResult, setAiResult] = useState<AiResult | null>(null)

  const selectedTemplate = templates.find(t => t.id === wTemplateId)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/broadcasts')
      if (res.ok) {
        const d = await res.json()
        setBroadcasts(d.broadcasts ?? [])
        setKpis(d.kpis ?? null)
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    Promise.all([
      fetch('/api/whatsapp/accounts').then(r => r.ok ? r.json() : []),
      fetch('/api/whatsapp/templates').then(r => r.ok ? r.json() : { templates: [] }),
    ]).then(([accounts, tplData]) => {
      const accs = accounts as Account[]
      const connected = accs.find(a => a.status === 'CONNECTED' && !a.isDemo) ?? accs.find(a => a.status === 'CONNECTED')
      if (connected) {
        setAccountId(connected.id)
        setIsDemo(connected.isDemo ?? false)
      }
      const tpls = (tplData.templates ?? [])
        .filter((t: { status: string }) => t.status === 'APPROVED')
        .map((t: { id: string; name: string; status: string; category: string; componentsJson?: unknown }) => {
          let body = ''
          try {
            const comps = t.componentsJson as Array<{ type: string; text?: string }> ?? []
            body = comps.find(c => c.type === 'BODY')?.text ?? ''
          } catch { /* */ }
          return { id: t.id, name: t.name, status: t.status, category: t.category ?? 'MARKETING', body }
        })
      setTemplates(tpls)
    }).catch(() => null)
  }, [])

  async function loadDetail(id: string) {
    setDetailId(id)
    setDetail(null)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/whatsapp/broadcasts/${id}`)
      if (res.ok) setDetail(await res.json())
    } catch { /* ignore */ } finally { setDetailLoading(false) }
  }

  async function loadSegments() {
    if (segments.length > 0) return
    setSegmentsLoading(true)
    try {
      const res = await fetch('/api/whatsapp/broadcasts/segments')
      if (res.ok) {
        const d = await res.json()
        setSegments(d.segments ?? [])
      }
    } catch { /* ignore */ } finally { setSegmentsLoading(false) }
  }

  function openWizard() {
    setWStep(1); setWName(''); setWDesc(''); setWSegmentId('all')
    setWTemplateId(''); setWSendType('IMMEDIATE'); setWScheduledAt(''); setWError(null)
    setShowWizard(true)
  }

  function wizardNext() {
    if (wStep === 1) loadSegments()
    setWStep(s => Math.min(s + 1, 5) as typeof wStep)
  }

  function wizardCanGoNext(): boolean {
    if (wStep === 1) return wName.trim().length > 0
    if (wStep === 3) return wTemplateId.length > 0
    if (wStep === 4) return wSendType !== 'SCHEDULED' || wScheduledAt.length > 0
    return true
  }

  async function handleDemoCreate() {
    setDemoCreating(true)
    try {
      const r = await fetch('/api/whatsapp/demo/broadcast', { method: 'POST' })
      if (r.ok) {
        const d = await r.json() as { broadcastId?: string }
        await load()
        if (d.broadcastId) loadDetail(d.broadcastId)
      }
    } catch { /* ignore */ } finally { setDemoCreating(false) }
  }

  async function handleCreate() {
    if (!accountId) { setWError('Bağlı WhatsApp hesabı bulunamadı.'); return }
    setWCreating(true); setWError(null)
    try {
      const res = await fetch('/api/whatsapp/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId, templateId: wTemplateId, segmentId: wSegmentId === 'all' ? null : wSegmentId,
          name: wName, description: wDesc || null,
          scheduledAt: wSendType === 'SCHEDULED' ? wScheduledAt : null,
          sendType: wSendType,
        }),
      })
      if (!res.ok) { const d = await res.json(); setWError(d.error ?? 'Hata'); return }
      setShowWizard(false)
      load()
    } catch { setWError('Sunucuya ulaşılamadı.') } finally { setWCreating(false) }
  }

  async function handleSend(id: string) {
    setSending(true)
    try {
      const res = await fetch(`/api/whatsapp/broadcasts/${id}/send`, { method: 'POST' })
      if (res.ok) { await load(); if (detailId) loadDetail(detailId) }
    } catch { /* ignore */ } finally { setSending(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu broadcast\'i silmek istediğinizden emin misiniz?')) return
    setDeleting(true)
    try {
      await fetch(`/api/whatsapp/broadcasts/${id}`, { method: 'DELETE' })
      setDetailId(null); setDetail(null)
      load()
    } catch { /* ignore */ } finally { setDeleting(false) }
  }

  async function handleAiGenerate() {
    if (!aiText.trim()) return
    setAiGenerating(true); setAiResult(null)
    try {
      const res = await fetch('/api/whatsapp/broadcasts/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiText }),
      })
      if (res.ok) setAiResult(await res.json())
    } catch { /* ignore */ } finally { setAiGenerating(false) }
  }

  function applyAiResult() {
    if (!aiResult) return
    setWName(aiResult.name)
    setWSegmentId(aiResult.recommendedSegmentId)
    setShowAiGen(false)
    setShowWizard(true)
    setWStep(3)
    loadSegments()
  }

  const fmtNum = (n: number) => n.toLocaleString('tr')
  const fmtMoney = (n: number) => `₺${n.toLocaleString('tr')}`

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1140, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px' }}>WhatsApp Broadcasts</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Toplu WhatsApp kampanyaları oluşturun, planlayın ve gelirini ölçün</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAiGen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(159,122,250,0.12)', color: '#9f7afa', border: '1px solid rgba(159,122,250,0.25)', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Sparkles size={13} /> AI Oluşturucu
          </button>
          <button
            onClick={handleDemoCreate}
            disabled={demoCreating}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(68,112,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(68,112,255,0.25)', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: demoCreating ? 0.7 : 1 }}
          >
            {demoCreating ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />}
            Demo Broadcast
          </button>
          <button
            onClick={openWizard}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#22c97a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={14} /> Yeni Broadcast
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {kpis && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <KpiCard icon="send" label="Toplam Broadcast" value={fmtNum(kpis.total)} iconColor="var(--text-2)" />
          <KpiCard icon="mail" label="Gönderilen Mesaj" value={fmtNum(kpis.totalSent)} iconColor="#4470ff" />
          <KpiCard icon="check_circle" label="Teslim Edilen" value={fmtNum(kpis.totalDelivered)} sub={`%${kpis.deliveryRate} oran`} iconColor="#22c97a" />
          <KpiCard icon="visibility" label="Okunan" value={fmtNum(kpis.totalRead)} sub={`%${kpis.readRate} oran`} iconColor="#9f7afa" />
          <KpiCard icon="ads_click" label="Tıklayan" value={fmtNum(kpis.totalClicked)} sub={`%${kpis.clickRate} oran`} iconColor="#f0a020" />
          <KpiCard icon="shopping_cart" label="Satın Alan" value={fmtNum(kpis.totalConverted)} iconColor="#22c97a" />
          <KpiCard icon="payments" label="Toplam Gelir" value={fmtMoney(kpis.totalRevenue)} iconColor="#22c97a" />
          <KpiCard icon="trending_up" label="Ortalama ROI" value={kpis.avgRoi > 0 ? `${kpis.avgRoi}x` : '—'} iconColor="#f0a020" />
        </div>
      )}

      {/* ── AI Generator Panel ── */}
      {showAiGen && (
        <div style={{ background: 'linear-gradient(135deg, rgba(68,112,255,0.06) 0%, rgba(159,122,250,0.06) 100%)', border: '1px solid rgba(159,122,250,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Sparkles size={16} color="#9f7afa" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>AI Kampanya Oluşturucu</span>
            <span style={{ fontSize: 12, color: 'var(--text-2)', marginLeft: 4 }}>— Kampanyanı anlat, AI segment, mesaj ve plan oluştursun</span>
            <button onClick={() => setShowAiGen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <X size={16} />
            </button>
          </div>
          <textarea
            value={aiText}
            onChange={e => setAiText(e.target.value)}
            placeholder="Örn: Yaz indirimi kampanyası oluştur. VIP müşterilere %30 indirim sun, sepet terk edenleri geri kazan..."
            style={{ ...inp, resize: 'vertical', minHeight: 68, fontFamily: 'inherit', marginBottom: 10 }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAiGenerate() }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleAiGenerate}
              disabled={aiGenerating || !aiText.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#9f7afa', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !aiText.trim() ? 0.5 : 1 }}
            >
              {aiGenerating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {aiGenerating ? 'AI Oluşturuyor…' : 'Kampanya Oluştur'}
            </button>
          </div>

          {aiResult && (
            <div style={{ marginTop: 16, padding: '16px 18px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{aiResult.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6 }}>{aiResult.segmentReason}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, background: 'rgba(68,112,255,0.12)', color: '#4470ff', padding: '2px 8px', borderRadius: 5, fontWeight: 600 }}>
                      👥 {aiResult.segmentCount?.toLocaleString('tr') ?? '—'} kişi
                    </span>
                    {aiResult.estimatedRevenue > 0 && (
                      <span style={{ fontSize: 11, background: 'rgba(34,201,122,0.12)', color: '#22c97a', padding: '2px 8px', borderRadius: 5, fontWeight: 600 }}>
                        ₺{aiResult.estimatedRevenue.toLocaleString('tr')} tahmini gelir
                      </span>
                    )}
                    <span style={{ fontSize: 11, background: 'rgba(159,122,250,0.12)', color: '#9f7afa', padding: '2px 8px', borderRadius: 5, fontWeight: 600 }}>
                      CTA: {aiResult.cta}
                    </span>
                  </div>
                </div>
                <button
                  onClick={applyAiResult}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#22c97a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <Check size={13} /> Sihirbazda Kullan
                </button>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--bg)', borderRadius: 8, padding: '10px 14px', lineHeight: 1.7 }}>
                {aiResult.message}
              </div>
              {aiResult.tips?.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {aiResult.tips.map((tip, i) => (
                    <span key={i} style={{ fontSize: 11, color: 'var(--text-2)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px' }}>
                      💡 {tip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Broadcasts Table ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Broadcast', 'Segment', 'Durum', 'Gönderim', 'İstatistikler', 'Gelir / ROI', 'Tarih'].map(h => (
                <th key={h} style={{ padding: '10px 14px', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textAlign: 'left', whiteSpace: 'nowrap', letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    {[160, 80, 70, 70, 140, 80, 60].map((w, j) => (
                      <td key={j} style={{ padding: '12px 14px' }}>
                        <div style={{ height: 12, background: 'var(--border)', borderRadius: 4, width: w, animation: 'pulse 1.5s infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              : broadcasts.length === 0
              ? (
                <tr><td colSpan={7}>
                  <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                    <Send size={40} color="var(--text-3)" style={{ display: 'block', margin: '0 auto 16px' }} />
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 6px' }}>Henüz broadcast yok</p>
                    <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 20px' }}>WhatsApp pazarlama kampanyaları oluşturarak müşterilerinize ulaşın</p>
                    <button onClick={openWizard} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#22c97a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <Plus size={14} /> İlk Broadcast&apos;i Oluştur
                    </button>
                  </div>
                </td></tr>
              )
              : broadcasts.map((b, idx) => (
                <tr
                  key={b.id}
                  onClick={() => loadDetail(b.id)}
                  style={{ borderBottom: idx < broadcasts.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.12s', background: detailId === b.id ? 'rgba(68,112,255,0.06)' : 'transparent' }}
                  onMouseEnter={e => { if (detailId !== b.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = detailId === b.id ? 'rgba(68,112,255,0.06)' : 'transparent' }}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{b.name}</div>
                    {b.description && <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{b.description}</div>}
                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-3)', marginTop: 2 }}>{b.templateName}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{b.segmentName}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}><StatusBadge status={b.status} /></td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                      {b.sendType === 'SMART' ? '🧠 Akıllı' : b.sendType === 'SCHEDULED' ? '📅 Planlandı' : '⚡ Hemen'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {b.stats.sent > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                          <span style={{ color: 'var(--text-1)' }}>{fmtNum(b.stats.sent)} <span style={{ color: 'var(--text-3)' }}>gönderildi</span></span>
                          <span style={{ color: '#22c97a' }}>%{b.stats.deliveryRate} <span style={{ color: 'var(--text-3)' }}>teslim</span></span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                          <span style={{ color: '#9f7afa' }}>%{b.stats.readRate} <span style={{ color: 'var(--text-3)' }}>okundu</span></span>
                          {b.stats.clicked > 0 && <span style={{ color: '#f0a020' }}>%{b.stats.clickRate} <span style={{ color: 'var(--text-3)' }}>tıkladı</span></span>}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {b.stats.revenue > 0 ? (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#22c97a' }}>{fmtMoney(b.stats.revenue)}</div>
                        {b.stats.roi > 0 && <div style={{ fontSize: 11, color: '#f0a020' }}>{b.stats.roi}x ROI</div>}
                      </div>
                    ) : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                      {b.sentAt
                        ? new Date(b.sentAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
                        : b.scheduledAt
                        ? new Date(b.scheduledAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
                        : new Date(b.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ── Detail Panel ── */}
      {detailId && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 39, background: 'rgba(0,0,0,0.3)' }}
            onClick={() => { setDetailId(null); setDetail(null) }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
            background: 'var(--surface)', borderLeft: '1px solid var(--border)',
            zIndex: 40, overflowY: 'auto', display: 'flex', flexDirection: 'column',
          }}>
            {/* Panel Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
              <BarChart2 size={16} color="#4470ff" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
                  {detail?.broadcast?.name ?? '…'}
                </div>
                {detail?.broadcast?.status && (
                  <div style={{ marginTop: 3 }}><StatusBadge status={detail.broadcast.status} /></div>
                )}
              </div>
              <button
                onClick={() => { setDetailId(null); setDetail(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
              >
                <X size={18} />
              </button>
            </div>

            {detailLoading ? (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ height: 40, background: 'var(--border)', borderRadius: 8, opacity: 0.5 }} />
                ))}
              </div>
            ) : detail ? (
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Metric Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Gönderilen', val: fmtNum(detail.broadcast.stats.sent), icon: <Send size={14} />, color: '#4470ff' },
                    { label: 'Teslim', val: `%${detail.broadcast.stats.deliveryRate}`, icon: <Check size={14} />, color: '#22c97a' },
                    { label: 'Okunan', val: `%${detail.broadcast.stats.readRate}`, icon: <Eye size={14} />, color: '#9f7afa' },
                    { label: 'Tıklayan', val: `%${detail.broadcast.stats.clickRate}`, icon: <TrendingUp size={14} />, color: '#f0a020' },
                    { label: 'Satın Alan', val: fmtNum(detail.broadcast.stats.converted), icon: <Trophy size={14} />, color: '#22c97a' },
                    { label: 'Gelir', val: fmtMoney(detail.broadcast.stats.revenue), icon: <TrendingUp size={14} />, color: '#22c97a' },
                  ].map(m => (
                    <div key={m.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, color: m.color }}>
                        {m.icon}
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>{m.label}</span>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{m.val}</div>
                    </div>
                  ))}
                </div>

                {/* ROI Banner */}
                {detail.broadcast.stats.roi > 0 && (
                  <div style={{ background: 'rgba(34,201,122,0.08)', border: '1px solid rgba(34,201,122,0.2)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TrendingUp size={20} color="#22c97a" />
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#22c97a' }}>{detail.broadcast.stats.roi}x ROI</div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{fmtMoney(detail.broadcast.stats.revenue)} gelir / {fmtNum(detail.broadcast.stats.sent)} gönderim</div>
                    </div>
                  </div>
                )}

                {/* Conversion Funnel */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Dönüşüm Hunisi</div>
                  <Funnel stats={detail.broadcast.stats} />
                </div>

                {/* Hourly Stats */}
                {detail.hourlyStats.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Saatlik Performans</div>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 60 }}>
                      {detail.hourlyStats.map(h => {
                        const max = Math.max(...detail.hourlyStats.map(x => x.sent))
                        const pct = max > 0 ? (h.sent / max) * 100 : 0
                        return (
                          <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }} title={`${h.label}: ${h.sent} gönderildi`}>
                            <div style={{ width: '100%', background: '#4470ff', borderRadius: '2px 2px 0 0', height: `${pct}%`, minHeight: 2, opacity: 0.7, transition: 'height 0.4s' }} />
                            <span style={{ fontSize: 8, color: 'var(--text-3)', transform: 'rotate(-45deg)', transformOrigin: 'center' }}>{h.hour}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Template Preview */}
                {detail.broadcast.templateBody && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Mesaj Önizleme</div>
                    <WhatsAppPreview body={detail.broadcast.templateBody} templateName={detail.broadcast.templateName} />
                  </div>
                )}

                {/* Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-2)' }}>Segment</span>
                    <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{detail.broadcast.segmentName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-2)' }}>Gönderim Tipi</span>
                    <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>
                      {detail.broadcast.sendType === 'SMART' ? '🧠 Akıllı' : detail.broadcast.sendType === 'SCHEDULED' ? '📅 Planlandı' : '⚡ Hemen'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-2)' }}>Toplam Alıcı</span>
                    <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{fmtNum(detail.broadcast.stats.total)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                  {(detail.broadcast.status === 'DRAFT' || detail.broadcast.status === 'SCHEDULED') && (
                    detail.broadcast.demo || isDemo ? (
                      <div style={{ background: 'rgba(240,160,32,0.08)', border: '1px solid rgba(240,160,32,0.2)', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
                        <p style={{ fontSize: 11, color: '#f0a020', margin: 0, fontWeight: 600 }}>Gerçek gönderim için WhatsApp bağlantısı gerekli.</p>
                        <a href="/whatsapp/connection" style={{ fontSize: 11, color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}>WhatsApp Bağla →</a>
                      </div>
                    ) : (
                    <button
                      onClick={() => handleSend(detail.broadcast.id)}
                      disabled={sending}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#22c97a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      {sending ? 'Gönderiliyor…' : 'Şimdi Gönder'}
                    </button>
                    )
                  )}
                  <button
                    onClick={() => handleDelete(detail.broadcast.id)}
                    disabled={deleting}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(232,69,69,0.1)', color: '#e84545', border: '1px solid rgba(232,69,69,0.2)', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    {deleting ? 'Siliniyor…' : 'Sil'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* ── Create Wizard ── */}
      {showWizard && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, width: '100%', maxWidth: 540, boxShadow: '0 24px 80px rgba(0,0,0,0.4)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>

            {/* Wizard Header */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 2px' }}>Yeni Broadcast</h2>
                <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>Adım {wStep}/{WIZARD_STEPS.length} — {WIZARD_STEPS[wStep - 1]}</p>
              </div>
              <button onClick={() => setShowWizard(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={18} /></button>
            </div>

            {/* Progress */}
            <div style={{ height: 3, background: 'var(--border)', flexShrink: 0 }}>
              <div style={{ height: '100%', width: `${(wStep / WIZARD_STEPS.length) * 100}%`, background: '#22c97a', transition: 'width 0.3s' }} />
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              {WIZARD_STEPS.map((s, i) => (
                <div key={s} style={{ flex: 1, padding: '8px 4px', textAlign: 'center', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: i + 1 === wStep ? '#22c97a' : i + 1 < wStep ? 'var(--text-2)' : 'var(--text-3)', borderBottom: i + 1 === wStep ? '2px solid #22c97a' : '2px solid transparent', transition: 'color 0.2s' }}>
                  {i + 1 < wStep ? '✓ ' : ''}{s}
                </div>
              ))}
            </div>

            {/* Content */}
            <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
              {wError && (
                <div style={{ background: 'rgba(232,69,69,0.1)', border: '1px solid rgba(232,69,69,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#e84545', marginBottom: 14 }}>
                  {wError}
                </div>
              )}

              {/* Step 1: Info */}
              {wStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <label style={{ display: 'block' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', display: 'block', marginBottom: 6 }}>Kampanya Adı <span style={{ color: '#e84545' }}>*</span></span>
                    <input value={wName} onChange={e => setWName(e.target.value)} placeholder="Yaz İndirimi Kampanyası" style={inp} autoFocus />
                  </label>
                  <label style={{ display: 'block' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', display: 'block', marginBottom: 6 }}>Açıklama <span style={{ color: 'var(--text-3)' }}>(opsiyonel)</span></span>
                    <textarea value={wDesc} onChange={e => setWDesc(e.target.value)} placeholder="Bu kampanya hakkında kısa not…" style={{ ...inp, resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }} />
                  </label>
                </div>
              )}

              {/* Step 2: Audience */}
              {wStep === 2 && (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14, marginTop: 0 }}>Broadcast gönderilecek hedef kitleyi seçin</p>
                  {segmentsLoading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} style={{ height: 72, background: 'var(--border)', borderRadius: 8, opacity: 0.4 }} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {segments.map(seg => (
                        <button
                          key={seg.id}
                          onClick={() => setWSegmentId(seg.id)}
                          style={{
                            background: wSegmentId === seg.id ? 'rgba(34,201,122,0.08)' : 'var(--bg)',
                            border: wSegmentId === seg.id ? '2px solid #22c97a' : '1px solid var(--border)',
                            borderRadius: 8, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 16 }}>{seg.icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{seg.name}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#22c97a', fontWeight: 700 }}>{fmtNum(seg.count)} kişi</div>
                          {seg.estimatedRevenue > 0 && (
                            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>~{fmtMoney(seg.estimatedRevenue)} tahmini</div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Template */}
              {wStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 6, marginTop: 0 }}>Meta tarafından onaylanan şablon seçin</p>
                  {templates.length === 0 ? (
                    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '20px 16px', textAlign: 'center' }}>
                      <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 8px' }}>Onaylı şablon bulunamadı</p>
                      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>WhatsApp &gt; Şablonlar sayfasından senkronize edin</p>
                    </div>
                  ) : (
                    templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setWTemplateId(t.id)}
                        style={{
                          background: wTemplateId === t.id ? 'rgba(34,201,122,0.06)' : 'var(--bg)',
                          border: wTemplateId === t.id ? '2px solid #22c97a' : '1px solid var(--border)',
                          borderRadius: 8, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: t.body ? 6 : 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'monospace' }}>{t.name}</span>
                          <span style={{ fontSize: 10, background: 'rgba(34,201,122,0.12)', color: '#22c97a', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>ONAYLANDI</span>
                          <span style={{ fontSize: 10, background: 'var(--border)', color: 'var(--text-3)', padding: '1px 6px', borderRadius: 4 }}>{t.category}</span>
                        </div>
                        {t.body && (
                          <p style={{ fontSize: 11, color: 'var(--text-2)', margin: 0, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {t.body}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Step 4: Scheduling */}
              {wStep === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4, marginTop: 0 }}>Ne zaman gönderilsin?</p>
                  {[
                    { id: 'IMMEDIATE', icon: '⚡', title: 'Hemen Gönder', desc: 'Broadcast hemen gönderilmeye başlar' },
                    { id: 'SCHEDULED', icon: '📅', title: 'Tarihe Planla', desc: 'Seçtiğiniz tarih ve saatte gönderilir' },
                    { id: 'SMART', icon: '🧠', title: 'Akıllı Gönder', desc: 'Her müşterinin en aktif olduğu saatte gönderilir' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setWSendType(opt.id)}
                      style={{
                        background: wSendType === opt.id ? 'rgba(34,201,122,0.06)' : 'var(--bg)',
                        border: wSendType === opt.id ? '2px solid #22c97a' : '1px solid var(--border)',
                        borderRadius: 10, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{opt.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{opt.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{opt.desc}</div>
                      </div>
                      {wSendType === opt.id && (
                        <Check size={16} color="#22c97a" style={{ marginLeft: 'auto' }} />
                      )}
                    </button>
                  ))}

                  {wSendType === 'SCHEDULED' && (
                    <div style={{ marginTop: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', display: 'block', marginBottom: 6 }}>Gönderim Tarihi ve Saati</span>
                      <input type="datetime-local" value={wScheduledAt} onChange={e => setWScheduledAt(e.target.value)} style={inp} min={new Date().toISOString().slice(0, 16)} />
                    </div>
                  )}

                  {wSendType === 'SMART' && (
                    <div style={{ background: 'rgba(159,122,250,0.08)', border: '1px solid rgba(159,122,250,0.2)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: 'var(--text-2)' }}>
                      <strong style={{ color: '#9f7afa' }}>Akıllı Gönderim:</strong> Sistem her müşterinin geçmiş mesaj aktivitesini analiz eder ve en yüksek okuma oranını elde edecek saate otomatik planlar. Gönderim 24 saat içinde tamamlanır.
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Preview */}
              {wStep === 5 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <WhatsAppPreview
                    body={selectedTemplate?.body ?? ''}
                    templateName={selectedTemplate?.name ?? ''}
                  />
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      ['Kampanya', wName],
                      ['Segment', segments.find(s => s.id === wSegmentId)?.name ?? 'Tüm Aboneler'],
                      ['Kişi Sayısı', fmtNum(segments.find(s => s.id === wSegmentId)?.count ?? 0)],
                      ['Şablon', selectedTemplate?.name ?? '—'],
                      ['Gönderim', wSendType === 'IMMEDIATE' ? 'Hemen' : wSendType === 'SMART' ? 'Akıllı' : wScheduledAt ? new Date(wScheduledAt).toLocaleString('tr-TR') : '—'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-2)' }}>{k}</span>
                        <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(240,160,32,0.08)', border: '1px solid rgba(240,160,32,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#f0a020' }}>
                    ⚠️ Gönderim başladıktan sonra durdurulamaz. Meta şablon mesaj ücretleri uygulanır.
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'space-between', flexShrink: 0 }}>
              <button
                onClick={() => wStep === 1 ? setShowWizard(false) : setWStep(s => (s - 1) as typeof wStep)}
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: 'var(--text-2)' }}
              >
                {wStep === 1 ? 'İptal' : 'Geri'}
              </button>

              {wStep < WIZARD_STEPS.length ? (
                <button
                  onClick={wizardNext}
                  disabled={!wizardCanGoNext()}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#22c97a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !wizardCanGoNext() ? 0.5 : 1 }}
                >
                  İleri <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={wCreating || !wTemplateId}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#22c97a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !wTemplateId ? 0.5 : 1 }}
                >
                  {wCreating ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  {wCreating ? 'Oluşturuluyor…' : 'Broadcast Oluştur'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
