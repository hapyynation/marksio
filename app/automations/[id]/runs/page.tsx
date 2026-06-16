'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Loader2,
  ChevronDown, ChevronRight, AlertCircle, Timer,
  Activity, BarChart3, RefreshCw, RotateCcw, User,
  Zap, Filter,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { cn, formatNumber } from '@/lib/utils'

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

interface RunStep {
  id: string; nodeId: string; nodeType: string; nodeLabel: string | null
  status: string; input: string; output: string; error: string | null
  startedAt: string | null; endedAt: string | null
}

interface RunLog {
  id: string; level: string; message: string; data: string; createdAt: string
}

interface AutomationRun {
  id: string; automationId: string; customerId: string
  status: string; currentNodeId: string | null
  context: string; resumeAt: string | null
  completedAt: string | null; failedAt: string | null; failReason: string | null
  createdAt: string; updatedAt: string
  steps: RunStep[]; logs: RunLog[]
}

interface Summary {
  total: number
  byStatus: { status: string; _count: { status: number } }[]
}

/* ─────────────────────────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────────────────────────── */

const S: Record<string, { icon: React.ElementType; color: string; bg: string; border: string; label: string }> = {
  completed: { icon: CheckCircle2, color: '#22c97a', bg: 'rgba(34,201,122,0.08)',  border: 'rgba(34,201,122,0.18)',  label: 'Tamamlandı' },
  failed:    { icon: XCircle,      color: '#e84545', bg: 'rgba(232,69,69,0.08)',   border: 'rgba(232,69,69,0.18)',   label: 'Başarısız'  },
  waiting:   { icon: Clock,        color: '#f0a020', bg: 'rgba(240,160,32,0.08)',  border: 'rgba(240,160,32,0.18)',  label: 'Bekliyor'   },
  running:   { icon: Loader2,      color: '#99b4ff', bg: 'rgba(153,180,255,0.08)', border: 'rgba(153,180,255,0.18)', label: 'Çalışıyor'  },
  stopped:   { icon: XCircle,      color: '#8080a0', bg: 'rgba(128,128,160,0.08)', border: 'rgba(128,128,160,0.18)', label: 'Durduruldu' },
}

/* ─────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────── */

function duration(a: string, b: string | null): string {
  if (!b) return '—'
  const ms = new Date(b).getTime() - new Date(a).getTime()
  if (ms < 1000)  return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}dk ${Math.floor((ms % 60000) / 1000)}s`
}

function ago(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Az önce'
  if (m < 60) return `${m}dk önce`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}s önce`
  return `${Math.floor(h / 24)}g önce`
}

function fmtTs(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('tr', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/* ─────────────────────────────────────────────────────────────
   RUN ROW
───────────────────────────────────────────────────────────── */

function RunRow({ run, automationId, onRetried }: { run: AutomationRun; automationId: string; onRetried: () => void }) {
  const [open,     setOpen]     = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [retryMsg, setRetryMsg] = useState('')

  const st   = S[run.status] ?? S.stopped
  const Icon = st.icon
  const dur  = duration(run.createdAt, run.completedAt ?? run.failedAt)
  const done = run.steps.filter(s => s.status === 'completed').length
  const canRetry = run.status === 'failed' || run.status === 'stopped'

  async function doRetry() {
    setRetrying(true)
    setRetryMsg('')
    try {
      const res = await fetch(`/api/automations/${automationId}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: run.id }),
      })
      const data = await res.json()
      if (res.ok) { setRetryMsg('✅ Yeniden başlatıldı'); onRetried() }
      else setRetryMsg(`❌ ${data.error ?? 'Hata'}`)
    } catch { setRetryMsg('❌ Bağlantı hatası') }
    finally { setRetrying(false) }
  }

  return (
    <div style={{
      background: '#ffffff',
      border: `1px solid ${st.border}`,
      borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}>
      {/* Summary row */}
      <button className="w-full text-left" onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>

        {/* Status dot */}
        <div style={{ width: 34, height: 34, borderRadius: 9, background: st.bg, border: `1px solid ${st.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={14} style={{ color: st.color, ...(run.status === 'running' ? { animation: 'spin 1s linear infinite' } : {}) }} />
        </div>

        {/* Meta grid */}
        <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '2px 12px' }}>
          <div>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Durum</p>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, fontWeight: 700, color: st.color }}>{st.label}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Başlangıç</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-2)' }}>{ago(run.createdAt)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Süre</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-1)' }}>{dur}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Adımlar</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-2)' }}>{done}/{run.steps.length}</p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {canRetry && (
            <button onClick={doRetry} disabled={retrying}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 7,
                background: 'rgba(153,180,255,0.1)', border: '1px solid rgba(153,180,255,0.2)',
                color: '#99b4ff', fontSize: 10.5, fontWeight: 600, cursor: retrying ? 'not-allowed' : 'pointer',
                transition: 'all 0.14s', opacity: retrying ? 0.7 : 1,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(153,180,255,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(153,180,255,0.1)' }}>
              {retrying ? <Loader2 size={10} style={{ animation: 'spin 0.7s linear infinite' }} /> : <RotateCcw size={10} />}
              Tekrar Çalıştır
            </button>
          )}
          <div style={{ color: 'var(--text-3)' }}>
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </div>
        </div>
      </button>

      {/* Retry result */}
      {retryMsg && (
        <div style={{ margin: '0 16px 10px', padding: '6px 10px', borderRadius: 7, background: retryMsg.startsWith('✅') ? 'rgba(34,201,122,0.08)' : 'rgba(232,69,69,0.08)', border: `1px solid ${retryMsg.startsWith('✅') ? 'rgba(34,201,122,0.2)' : 'rgba(232,69,69,0.2)'}`, fontSize: 11, color: retryMsg.startsWith('✅') ? '#22c97a' : '#e84545' }}>
          {retryMsg}
        </div>
      )}

      {/* Fail reason */}
      {run.failReason && (
        <div style={{ margin: '0 16px 10px', padding: '7px 10px', borderRadius: 8, background: 'rgba(232,69,69,0.07)', border: '1px solid rgba(232,69,69,0.18)', display: 'flex', gap: 7, alignItems: 'flex-start' }}>
          <AlertCircle size={11} style={{ color: '#e84545', flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 11, color: '#e84545', lineHeight: 1.5 }}>{run.failReason}</p>
        </div>
      )}

      {/* Expanded */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--surface-2)' }}>

          {/* Customer info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <User size={11} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 10.5, color: 'var(--text-2)', fontFamily: 'monospace' }}>Customer ID: {run.customerId}</p>
          </div>

          {/* Steps */}
          {run.steps.length > 0 && (
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 9, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Adımlar</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {run.steps.map((step, i) => {
                  const ss    = S[step.status] ?? S.stopped
                  const SIcon = ss.icon
                  const out   = (() => { try { const o = JSON.parse(step.output ?? '{}'); delete o.ctx; const j = JSON.stringify(o); return j === '{}' ? null : j } catch { return step.output } })()
                  return (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      {/* Step number + icon */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, paddingTop: 1 }}>
                        <span style={{ fontSize: 8.5, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-3)', width: 14, textAlign: 'right' }}>{i + 1}</span>
                        <SIcon size={12} style={{ color: ss.color }} />
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-1)' }}>{step.nodeLabel ?? step.nodeType}</span>
                            <span style={{ fontSize: 8.5, fontWeight: 600, padding: '2px 6px', borderRadius: 5, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{ss.label}</span>
                          </div>
                          <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-3)', flexShrink: 0 }}>
                            {duration(step.startedAt ?? run.createdAt, step.endedAt)}
                          </span>
                        </div>
                        {step.error && <p style={{ margin: '4px 0 0', fontSize: 10.5, color: '#e84545', lineHeight: 1.4 }}>{step.error.slice(0, 150)}</p>}
                        {out && out !== '{}' && <p style={{ margin: '3px 0 0', fontSize: 10, fontFamily: 'monospace', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{out.slice(0, 110)}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Logs */}
          {run.logs.length > 0 && (
            <div>
              <p style={{ margin: '0 0 7px', fontSize: 9, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>Loglar</p>
              <div style={{ borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {run.logs.map(log => {
                  const col = log.level === 'error' ? '#dc2626' : log.level === 'warn' ? '#d97706' : '#16a34a'
                  return (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '5px 10px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', color: col, flexShrink: 0, paddingTop: 1, width: 32 }}>{log.level}</span>
                      <span style={{ flex: 1, fontSize: 10.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{log.message}</span>
                      <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--text-3)', flexShrink: 0 }}>{ago(log.createdAt)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Timing */}
          <div style={{ display: 'flex', gap: 16, fontSize: 10, color: 'var(--text-3)' }}>
            <span><strong style={{ color: 'var(--text-2)' }}>Başladı:</strong> {fmtTs(run.createdAt)}</span>
            <span><strong style={{ color: 'var(--text-2)' }}>Bitti:</strong> {fmtTs(run.completedAt ?? run.failedAt)}</span>
            {run.resumeAt && <span><strong style={{ color: '#f0a020' }}>Resume:</strong> {fmtTs(run.resumeAt)}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */

export default function RunHistoryPage() {
  const params  = useParams() as { id: string }
  const router  = useRouter()
  const [runs,      setRuns]      = useState<AutomationRun[]>([])
  const [summary,   setSummary]   = useState<Summary | null>(null)
  const [autoName,  setAutoName]  = useState('')
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [statusFilter, setFilter] = useState('')
  const [autoRefresh, setAutoRef] = useState(false)
  const [nodeStats, setNodeStats] = useState<Record<string, { nodeLabel: string | null; nodeType: string; completed: number; waiting: number; failed: number; total: number }>>({})
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const qs = statusFilter ? `?status=${statusFilter}&limit=50` : '?limit=50'
    Promise.all([
      fetch(`/api/automations/${params.id}/runs${qs}`).then(r => r.json()),
      fetch(`/api/automations/${params.id}/flow`).then(r => r.json()),
      fetch(`/api/automations/${params.id}/node-stats`).then(r => r.json()),
    ]).then(([rd, fd, ns]) => {
      if (rd.runs) { setRuns(rd.runs); setSummary({ total: rd.total, byStatus: rd.byStatus }) }
      else setError(rd.error ?? 'Hata')
      if (fd.name) setAutoName(fd.name)
      if (ns && typeof ns === 'object' && !ns.error) setNodeStats(ns)
    }).catch(() => setError('Veriler yüklenemedi'))
      .finally(() => setLoading(false))
  }, [params.id, statusFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(load, 8000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoRefresh, load])

  const byStatus = Object.fromEntries((summary?.byStatus ?? []).map(s => [s.status, s._count.status]))
  const filtered = statusFilter ? runs.filter(r => r.status === statusFilter) : runs

  const kpis = [
    { label: 'Toplam Run',  val: summary?.total ?? 0,    icon: Activity,     col: '#99b4ff' },
    { label: 'Tamamlandı',  val: byStatus.completed ?? 0, icon: CheckCircle2, col: '#22c97a' },
    { label: 'Başarısız',   val: byStatus.failed    ?? 0, icon: XCircle,      col: '#e84545' },
    { label: 'Aktif',       val: (byStatus.waiting ?? 0) + (byStatus.running ?? 0), icon: Clock, col: '#f0a020' },
  ]

  return (
    <AppShell>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-5 py-3.5"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', boxShadow: '0 1px 0 var(--border)' }}>
        <button onClick={() => router.push('/automations')}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={{ border: '1px solid var(--border)', color: 'var(--text-2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <ArrowLeft size={14} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>Otomasyonlar</p>
          <h1 className="text-sm font-bold truncate" style={{ color: '#eeeef4' }}>{autoName || 'Run Geçmişi'}</h1>
        </div>

        {/* Auto-refresh toggle */}
        <button onClick={() => setAutoRef(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 8,
            background: autoRefresh ? 'rgba(34,201,122,0.1)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${autoRefresh ? 'rgba(22,163,74,0.25)' : 'var(--border-2)'}`,
            color: autoRefresh ? '#22c97a' : 'var(--text-2)',
            fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
          }}>
          <Activity size={10} style={{ animation: autoRefresh ? 'pulse 2s infinite' : 'none' }} />
          {autoRefresh ? 'Canlı' : 'Canlı Takip'}
        </button>

        <button onClick={load}
          className="p-2 rounded-lg transition-all"
          style={{ color: 'var(--text-2)', border: '1px solid var(--border-2)', background: 'var(--surface)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 p-5 space-y-5 animate-fade-in">

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map(k => (
            <div key={k.label} className="stat-card cursor-pointer transition-all"
              onClick={() => setFilter(v => v === k.label.toLowerCase().replace('ı','i').replace('ü','u') ? '' : k.label === 'Tamamlandı' ? 'completed' : k.label === 'Başarısız' ? 'failed' : k.label === 'Aktif' ? 'waiting' : '')}
              style={{ border: statusFilter && kpis.find(kk => kk.label === k.label) ? `1px solid ${k.col}30` : undefined }}>
              <div className="flex items-center justify-between mb-2">
                <p className="label">{k.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${k.col}15` }}>
                  <k.icon className="w-3.5 h-3.5" style={{ color: k.col }} />
                </div>
              </div>
              <p className="text-2xl font-black tracking-tight" style={{ color: '#eeeef4' }}>{formatNumber(k.val)}</p>
            </div>
          ))}
        </div>

        {/* Per-node stats */}
        {Object.keys(nodeStats).length > 0 && (
          <div className="bento-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>Node İstatistikleri</p>
            <div className="space-y-2">
              {Object.entries(nodeStats).map(([nodeId, s]) => (
                <div key={nodeId} className="flex items-center gap-3 py-1.5 px-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <span className="text-[11px] font-semibold min-w-0 flex-1 truncate" style={{ color: 'var(--text-1)' }}>
                    {s.nodeLabel ?? s.nodeType}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 text-[10px] font-semibold font-mono">
                    <span style={{ color: '#22c97a' }}>✅ {s.completed}</span>
                    <span style={{ color: '#f0a020' }}>⏳ {s.waiting}</span>
                    <span style={{ color: '#e84545' }}>❌ {s.failed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="ds-alert ds-alert-error">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            {['', 'completed', 'failed', 'waiting', 'running'].map(s => (
              <button key={s} onClick={() => setFilter(v => v === s ? '' : s)}
                className={cn('px-3 py-1.5 rounded-lg text-[10.5px] font-semibold transition-all',
                  statusFilter === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                {s === '' ? 'Tümü' : S[s]?.label ?? s}
              </button>
            ))}
          </div>
          <span className="text-[10.5px] font-mono" style={{ color: 'var(--text-3)' }}>
            {filtered.length} kayıt
          </span>
        </div>

        {/* Run list */}
        {loading && runs.length === 0 ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton rounded-xl h-16" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bento-card p-12 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(153,180,255,0.06)', border: '1px dashed rgba(153,180,255,0.18)' }}>
              <BarChart3 className="w-6 h-6" style={{ color: '#99b4ff' }} />
            </div>
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: '#eeeef4' }}>
                {statusFilter ? `${S[statusFilter]?.label} run yok` : 'Henüz çalıştırma yok'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                {statusFilter ? 'Farklı bir filtre deneyin' : 'Otomasyon aktifleştirildiğinde run\'lar burada görünecek'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(run => (
              <RunRow key={run.id} run={run} automationId={params.id} onRetried={load} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </AppShell>
  )
}
