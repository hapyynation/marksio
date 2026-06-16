'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Zap, Play, Pause, Plus, Search, Download, X,
  Activity, Workflow, TrendingUp, Target, CheckCircle2,
  ShoppingCart, UserPlus, Package, Clock, Tag, Settings2,
  Eye, CreditCard, Gift, BarChart3,
  Pencil, Trash2, Loader2, AlertCircle, History,
  ArrowUpRight, Timer, Copy, Sparkles, Crown,
  MessageCircle, Layers,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import PlanLimitModal, { type PlanLimitData } from '@/components/ui/PlanLimitModal'

/* ─────────────────────────────────────────────────────────────
   META
───────────────────────────────────────────────────────────── */

const TRIGGER_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  cart_abandoned:    { label: 'Sepet Terk',          icon: ShoppingCart, color: '#16a34a' },
  cart_abandon:      { label: 'Sepet Terk',          icon: ShoppingCart, color: '#16a34a' },
  new_customer:      { label: 'Yeni Müşteri',        icon: UserPlus,     color: '#2563eb' },
  new_signup:        { label: 'Yeni Kayıt',          icon: UserPlus,     color: '#2563eb' },
  order_created:     { label: 'Sipariş',             icon: Package,      color: '#d97706' },
  order_complete:    { label: 'Sipariş',             icon: Package,      color: '#d97706' },
  checkout_started:  { label: 'Ödeme Başlatıldı',    icon: CreditCard,   color: '#d97706' },
  product_viewed:    { label: 'Ürün Görüntülendi',   icon: Eye,          color: '#0891b2' },
  tag_added:         { label: 'Etiket Eklendi',      icon: Tag,          color: '#dc2626' },
  customer_inactive: { label: 'Müşteri Pasif',       icon: Clock,        color: '#dc2626' },
  no_purchase:       { label: 'Satın Alma Yok',      icon: Clock,        color: '#dc2626' },
  birthday:          { label: 'Doğum Günü',          icon: Gift,         color: '#be185d' },
  manual_trigger:    { label: 'Manuel',              icon: Play,         color: '#7c3aed' },
  custom_event:      { label: 'Özel Event',          icon: Settings2,    color: '#7c3aed' },
}

const STATUS_CFG: Record<string, { label: string; dot: string; badge: string }> = {
  active:  { label: 'Aktif',        dot: 'bg-emerald-400 animate-pulse', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  paused:  { label: 'Duraklatıldı', dot: 'bg-amber-400',                 badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'       },
  draft:   { label: 'Taslak',       dot: 'bg-[#8080a0]',                 badge: 'bg-slate-100 text-slate-500 border-slate-200'       },
}

type FilterKey = 'all' | 'active' | 'paused' | 'draft'

interface RunStats {
  total: number; completed: number; failed: number
  waiting: number; running: number
  lastRun: string | null; lastStatus: string | null
}

interface AutomationItem {
  id: string; name: string; trigger: string; status: string
  sent: number; converted: number; revenue: number
  createdAt: string; updatedAt: string
  runStats: RunStats
}

interface TemplateItem {
  id: string; name: string; description: string; trigger: string
  icon: string; color: string; category: string
  expectedRevenue: string; setupTime: string; pro?: boolean; isNew?: boolean
}

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart, UserPlus, Package, Clock, Tag, Settings2,
  Eye, CreditCard, Gift, Crown, MessageCircle, Layers,
}

// Suggestions that live in the AI panel — no revenue numbers, just context
const AI_SUGGESTIONS = [
  { icon: ShoppingCart, color: '#e84545', bg: 'rgba(232,69,69,0.08)', title: 'Ürün Stok Azalma Takibi', text: 'Stok azalan ürünler için otomatik bildirim akışı oluşturun.', trigger: 'custom_event' },
  { icon: Tag, color: '#4470ff', bg: 'rgba(68,112,255,0.08)', title: 'İlk Alışveriş İndirimi', text: 'İlk kez alışveriş yapacaklara özel indirim akışı kurun.', trigger: 'new_customer' },
  { icon: Clock, color: '#22c97a', bg: 'rgba(34,201,122,0.08)', title: 'Sadakat Puanı Hatırlatma', text: 'Puanları bitmek üzere olan müşterilere hatırlatma gönderin.', trigger: 'custom_event' },
]

/* ─────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────── */

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'Az önce'
  if (mins < 60)  return `${mins}dk önce`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}s önce`
  const days = Math.floor(hrs / 24)
  return `${days}g önce`
}

function convRate(sent: number, converted: number): string {
  return sent > 0 ? `%${((converted / sent) * 100).toFixed(1)}` : '—'
}

/* ─────────────────────────────────────────────────────────────
   AUTOMATION CARD (grid view — preserved for potential reuse)
───────────────────────────────────────────────────────────── */

function AutoCard({ a, onToggle, onDelete, onClone }: {
  a: AutomationItem; onToggle: () => Promise<void>; onDelete: () => void; onClone: () => void
}) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [cloning,  setCloning]  = useState(false)
  const [confirm,  setConfirm]  = useState(false)

  const st   = STATUS_CFG[a.status] ?? STATUS_CFG.draft
  const meta = TRIGGER_META[a.trigger] ?? { label: a.trigger || '—', icon: Zap, color: 'var(--text-2)' }
  const Icon = meta.icon
  const rs   = a.runStats
  const successRate = rs.total > 0 ? Math.round((rs.completed / rs.total) * 100) : null

  async function doToggle() {
    setToggling(true)
    try { await onToggle() } finally { setToggling(false) }
  }

  return (
    <div className={cn(
      'bento-card overflow-hidden transition-all duration-200',
      a.status === 'active' && 'hover:shadow-md',
    )} style={{
      borderColor: a.status === 'active' ? `${meta.color}30` : undefined,
    }}>
      <div className="h-[2px]" style={{
        background: a.status === 'active'
          ? `linear-gradient(90deg, ${meta.color}, transparent)`
          : 'transparent',
      }} />

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}25` }}>
              <Icon size={17} style={{ color: a.status === 'active' ? meta.color : '#8080a0' }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{a.name}</h3>
              <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-2)' }}>{meta.label}</p>
            </div>
          </div>
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1.5 shrink-0', st.badge)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', st.dot)} />
            {st.label}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'Toplam Run',  value: formatNumber(rs.total),    color: 'var(--text-1)' },
            { label: 'Başarılı',    value: formatNumber(rs.completed), color: rs.completed > 0 ? '#22c97a' : 'var(--text-3)' },
            { label: 'Hatalı',      value: formatNumber(rs.failed),    color: rs.failed > 0    ? '#e84545' : 'var(--text-3)' },
            { label: 'Son Çalışma', value: relativeTime(rs.lastRun),   color: 'var(--text-2)' },
          ].map(s => (
            <div key={s.label} className="rounded-lg py-1.5 px-2 text-center" style={{ background: 'var(--surface-2)' }}>
              <p className="text-[8.5px] font-medium uppercase tracking-wide truncate" style={{ color: 'var(--text-3)' }}>{s.label}</p>
              <p className="text-[11px] font-bold font-mono mt-0.5 truncate" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {rs.total > 0 && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-3)' }}>Başarı oranı</span>
              <span className="text-[10px] font-bold font-mono" style={{ color: successRate! >= 80 ? '#22c97a' : successRate! >= 50 ? '#f0a020' : '#e84545' }}>
                %{successRate}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${successRate}%`,
                background: successRate! >= 80 ? '#22c97a' : successRate! >= 50 ? '#f0a020' : '#e84545',
              }} />
            </div>
          </div>
        )}

        {(a.sent > 0 || a.revenue > 0) && (
          <div className="flex items-center gap-3 pt-0.5">
            {a.sent > 0 && (
              <div className="flex items-center gap-1">
                <Activity size={10} style={{ color: 'var(--text-3)' }} />
                <span className="text-[10.5px] font-medium" style={{ color: 'var(--text-2)' }}>
                  {convRate(a.sent, a.converted)} dönüşüm
                </span>
              </div>
            )}
            {a.revenue > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp size={10} style={{ color: '#22c97a' }} />
                <span className="text-[10.5px] font-semibold font-mono" style={{ color: '#22c97a' }}>
                  {formatCurrency(a.revenue)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
          <div className="flex items-center gap-1">
            <Link href={`/automations/${a.id}/builder`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-[#99b4ff]/10"
              style={{ color: '#99b4ff' }}>
              <Pencil size={10} /> Düzenle
            </Link>
            <Link href={`/automations/${a.id}/runs`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-slate-100"
              style={{ color: 'var(--text-2)' }}>
              <History size={10} /> Geçmiş
            </Link>
            <button onClick={async () => { setCloning(true); await onClone(); setCloning(false) }} disabled={cloning}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:bg-slate-100"
              style={{ color: 'var(--text-2)' }}>
              {cloning ? <Loader2 size={10} className="animate-spin" /> : <Copy size={10} />} Klonla
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {confirm ? (
              <div className="flex items-center gap-1">
                <button onClick={() => { setDeleting(true); onDelete() }} disabled={deleting}
                  className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all">
                  {deleting ? <Loader2 size={9} className="animate-spin inline" /> : 'Sil'}
                </button>
                <button onClick={() => setConfirm(false)} className="px-2 py-1 rounded-md text-[10px] hover:bg-white/[0.05] transition-all" style={{ color: 'var(--text-3)' }}>İptal</button>
              </div>
            ) : (
              <button onClick={() => setConfirm(true)} className="p-1.5 rounded-md transition-all hover:bg-red-500/10" style={{ color: 'var(--text-3)' }}>
                <Trash2 size={11} />
              </button>
            )}

            <button onClick={doToggle} disabled={toggling}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all',
                a.status === 'active'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                  : 'btn-primary text-[11px]')}>
              {toggling ? <Loader2 size={11} className="animate-spin" />
                : a.status === 'active' ? <><Pause size={11} /> Duraklat</>
                : <><Play size={11} /> Başlat</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────── */

export default function AutomationsPage() {
  const router = useRouter()
  const [automations, setAutomations] = useState<AutomationItem[]>([])
  const [templates,   setTemplates]   = useState<TemplateItem[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState<FilterKey>('all')
  const [search,      setSearch]      = useState('')
  const [error,       setError]       = useState('')
  const [activatingTpl,  setActivatingTpl]  = useState<string | null>(null)
  const [updatingId,     setUpdatingId]     = useState<string | null>(null)
  const [creatingSuggestion, setCreatingSuggestion] = useState<number | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [planLimit, setPlanLimit] = useState<PlanLimitData | null>(null)

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/automations').then(r => r.json()),
      fetch('/api/automation-templates').then(r => r.json()),
    ])
      .then(([autoData, tplData]) => {
        if (Array.isArray(autoData)) {
          // Deduplicate by id in case of unexpected duplicates
          const unique = Array.from(new Map((autoData as AutomationItem[]).map(a => [a.id, a])).values())
          setAutomations(unique)
        } else {
          setError(autoData.error ?? 'Hata')
        }
        if (Array.isArray(tplData)) setTemplates(tplData)
      })
      .catch(() => setError('Veriler yüklenemedi'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const activateTemplate = async (templateId: string) => {
    setActivatingTpl(templateId)
    try {
      const res = await fetch('/api/automation-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/automations/${data.id}/builder`)
      } else if (res.status === 403 && data.error === 'PLAN_LIMIT_REACHED') {
        setPlanLimit(data as PlanLimitData)
      } else {
        showToast(data.error ?? 'Şablon oluşturulamadı', false)
      }
    } catch {
      showToast('Bağlantı hatası', false)
    } finally {
      setActivatingTpl(null)
    }
  }

  const handleToggle = async (id: string, current: string) => {
    const next = current === 'active' ? 'paused' : 'active'
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/automations/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (res.ok) {
        setAutomations(p => p.map(a => a.id === id ? { ...a, status: next } : a))
        showToast(next === 'active' ? 'Otomasyon başlatıldı' : 'Otomasyon duraklatıldı')
      } else {
        const d = await res.json()
        showToast(d.error ?? 'Güncelleme başarısız', false)
      }
    } catch {
      showToast('Bağlantı hatası', false)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/automations/${id}`, { method: 'DELETE' })
    if (res.ok) setAutomations(p => p.filter(a => a.id !== id))
  }

  const handleClone = async (id: string) => {
    const res = await fetch(`/api/automations/${id}/clone`, { method: 'POST' })
    if (res.ok) load()
  }

  const createSuggestedAutomation = async (name: string, trigger: string, idx: number) => {
    setCreatingSuggestion(idx)
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, trigger, status: 'draft' }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/automations/${data.id}/builder`)
      } else if (res.status === 403 && data.error === 'PLAN_LIMIT_REACHED') {
        setPlanLimit(data as PlanLimitData)
      } else {
        showToast(data.error ?? 'Oluşturulamadı', false)
      }
    } catch {
      showToast('Bağlantı hatası', false)
    } finally {
      setCreatingSuggestion(null)
    }
  }

  function downloadCSV() {
    if (automations.length === 0) return
    const headers = ['Ad', 'Durum', 'Tetikleyici', 'Toplam Run', 'Başarılı', 'Hatalı', 'Dönüşüm Oranı', 'Gelir', 'Son Çalışma']
    const rows = automations.map(a => [
      `"${a.name}"`,
      a.status,
      TRIGGER_META[a.trigger]?.label ?? a.trigger,
      a.runStats.total,
      a.runStats.completed,
      a.runStats.failed,
      a.sent > 0 ? ((a.converted / a.sent) * 100).toFixed(1) + '%' : '0%',
      a.revenue,
      a.runStats.lastRun ? new Date(a.runStats.lastRun).toLocaleString('tr-TR') : '—',
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const el = document.createElement('a')
    el.href = url
    el.download = `otomasyonlar-${new Date().toISOString().slice(0, 10)}.csv`
    el.click()
    URL.revokeObjectURL(url)
  }

  // Deduplicate filtered list by ID (defensive)
  const filtered = Array.from(
    new Map(
      automations
        .filter(a =>
          (filter === 'all' || a.status === filter) &&
          (!search || a.name.toLowerCase().includes(search.toLowerCase())),
        )
        .map(a => [a.id, a]),
    ).values(),
  )

  /* ── Summary KPIs ───────────────────────────────────────── */
  const activeCount    = automations.filter(a => a.status === 'active').length
  const totalRuns      = automations.reduce((s, a) => s + (a.runStats?.total ?? 0), 0)
  const totalCompleted = automations.reduce((s, a) => s + (a.runStats?.completed ?? 0), 0)
  const totalRevenue   = automations.reduce((s, a) => s + a.revenue, 0)

  /* ── AI Panel computed values ───────────────────────────── */
  // Low performers: active automations with >10 sends and <5% conversion
  const lowPerformers = automations
    .filter(a => a.status === 'active' && a.sent > 10)
    .map(a => ({ ...a, rate: a.sent > 0 ? (a.converted / a.sent) * 100 : 0 }))
    .filter(a => a.rate < 5)
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 3)

  // Missing automations: templates whose trigger isn't covered by any existing automation
  const coveredTriggers = new Set(automations.map(a => a.trigger))
  const missingTemplates = templates
    .filter(t => !coveredTriggers.has(t.trigger))
    .slice(0, 3)

  return (
    <AppShell>
      <PlanLimitModal data={planLimit} onClose={() => setPlanLimit(null)} />

      {/* ── Toast ── */}
      {toast && (
        <div className={cn(
          'fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-2xl text-[12px] font-semibold transition-all',
          toast.ok
            ? 'bg-emerald-950 border border-emerald-500/30 text-emerald-400'
            : 'bg-red-950 border border-red-500/30 text-red-400',
        )}>
          {toast.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
          {toast.msg}
          <button onClick={() => setToast(null)}><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 h-14 shrink-0"
        style={{ background: 'rgba(8,8,15,0.95)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h1 className="text-[15px] md:text-[16px] font-bold" style={{ color: '#eeeef4' }}>Otomasyonlar</h1>
          <p className="text-[11px] hidden sm:block" style={{ color: '#44445a' }}>Akıllı müşteri yolculukları oluşturun, yönetin ve performanslarını artırın.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadCSV}
            disabled={automations.length === 0}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Download className="w-3.5 h-3.5" /> Raporu İndir
          </button>
          <Link href="/automations/new"
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-[12px] font-bold"
            style={{ background: '#4470ff', color: '#fff' }}>
            <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Yeni Otomasyon</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Main content ── */}
        <div className="flex-1 overflow-auto p-5 space-y-5">

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {[
              { label: 'Aktif Otomasyonlar', value: String(activeCount),          icon: Activity,   color: '#22c97a', bg: 'rgba(34,201,122,0.1)'  },
              { label: 'Toplam Çalıştırma',  value: formatNumber(totalRuns),      icon: Workflow,   color: '#4470ff', bg: 'rgba(68,112,255,0.1)'  },
              { label: 'Kurtarılan Gelir',   value: formatCurrency(totalRevenue), icon: TrendingUp, color: '#22c97a', bg: 'rgba(34,201,122,0.1)'  },
              { label: 'Dönüşüm Oranı',      value: totalRuns > 0 ? `%${((totalCompleted / totalRuns) * 100).toFixed(1)}` : '—', icon: Target, color: '#f0a020', bg: 'rgba(240,160,32,0.1)' },
              { label: 'Bekleyen İşlemler',  value: formatNumber(automations.reduce((s, a) => s + (a.runStats?.waiting ?? 0), 0)), icon: Timer, color: '#9f7afa', bg: 'rgba(159,122,250,0.1)' },
              { label: 'Toplam Otomasyon',   value: String(automations.length),  icon: BarChart3,  color: '#99b4ff', bg: 'rgba(153,180,255,0.1)' },
            ].map(k => {
              const KIcon = k.icon
              return (
                <div key={k.label} className="rounded-2xl p-4 relative overflow-hidden cursor-default transition-all"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}>
                  <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg,transparent,${k.color}44,transparent)` }} />
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#44445a' }}>{k.label}</p>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: k.bg }}>
                      <KIcon className="w-3.5 h-3.5" style={{ color: k.color }} />
                    </div>
                  </div>
                  <p className="text-[22px] font-bold leading-none mb-2" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>{k.value}</p>
                  <div className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md text-emerald-400"
                    style={{ background: 'rgba(34,201,122,0.08)' }}>
                    <ArrowUpRight className="w-3 h-3" />
                    Gerçek veri
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Templates grid ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-[14px] font-bold" style={{ color: '#eeeef4' }}>Hazır Otomasyon Şablonları</h2>
                <p className="text-[11px] mt-0.5" style={{ color: '#44445a' }}>İhtiyacınıza uygun şablonu seçin ve builder'da özelleştirip aktifleştirin.</p>
              </div>
              <span className="text-[11px] font-mono" style={{ color: '#44445a' }}>{templates.length} şablon</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {templates.map(tpl => {
                const TplIcon = ICON_MAP[tpl.icon] ?? Zap
                const bg = `${tpl.color}18`
                const isActivating = activatingTpl === tpl.id
                return (
                  <div key={tpl.id} className="rounded-2xl p-4 cursor-default transition-all relative overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = `${tpl.color}25` }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${tpl.color}44,transparent)` }} />
                    {tpl.pro && (
                      <span className="absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(159,122,250,0.15)', color: '#9f7afa', border: '1px solid rgba(159,122,250,0.25)' }}>PRO</span>
                    )}
                    {tpl.isNew && !tpl.pro && (
                      <span className="absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(34,201,122,0.15)', color: '#22c97a', border: '1px solid rgba(34,201,122,0.25)' }}>YENİ</span>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                        <TplIcon className="w-4 h-4" style={{ color: tpl.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold truncate" style={{ color: '#eeeef4' }}>{tpl.name}</p>
                        <p className="text-[10px]" style={{ color: '#44445a' }}>{tpl.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        {/* Labeled as industry estimate — not real store revenue */}
                        <p className="text-[10px]" style={{ color: '#44445a' }}>Tahmini Potansiyel</p>
                        <p className="text-[11px] font-semibold" style={{ color: '#8080a0' }}>{tpl.expectedRevenue} <span className="text-[9px] opacity-60">(sektör ort.)</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px]" style={{ color: '#44445a' }}>Kurulum Süresi</p>
                        <p className="text-[11px] font-semibold" style={{ color: '#8080a0' }}>{tpl.setupTime}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => activateTemplate(tpl.id)}
                      disabled={isActivating}
                      className="w-full py-1.5 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
                      style={{ background: `${tpl.color}12`, color: tpl.color, border: `1px solid ${tpl.color}20`, opacity: isActivating ? 0.7 : 1 }}>
                      {isActivating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      {isActivating ? 'Oluşturuluyor...' : 'Şablonu Kullan'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Active automations table ── */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
              <h2 className="text-[14px] font-bold shrink-0" style={{ color: '#eeeef4' }}>Aktif Otomasyonlar</h2>
              <div className="flex items-center p-0.5 gap-0.5 rounded-xl overflow-x-auto no-scrollbar" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {(['all','active','paused','draft'] as FilterKey[]).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 whitespace-nowrap"
                    style={filter === f ? { background: 'rgba(255,255,255,0.08)', color: '#eeeef4' } : { color: '#44445a' }}>
                    {f === 'all' ? 'Tümü' : STATUS_CFG[f]?.label ?? f}
                  </button>
                ))}
              </div>
              <div className="relative sm:ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: '#44445a' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Otomasyon ara..."
                  className="pl-8 pr-3 py-1.5 text-[12px] rounded-xl outline-none w-full sm:w-48"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }} />
              </div>
            </div>

            {error && <div className="ds-alert ds-alert-error mb-3"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}

            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton rounded-xl h-16" />)}
              </div>
            ) : filtered.length === 0 && automations.length === 0 ? (
              <div className="rounded-2xl p-12 flex flex-col items-center text-center gap-5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1.5px dashed rgba(255,255,255,0.08)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(68,112,255,0.08)', border: '1.5px dashed rgba(68,112,255,0.25)' }}>
                  <Zap className="w-6 h-6" style={{ color: '#99b4ff' }} />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold mb-1.5" style={{ color: '#eeeef4' }}>İlk otomasyonunuzu oluşturun</h3>
                  <p className="text-[12px] max-w-xs mx-auto leading-relaxed" style={{ color: '#44445a' }}>
                    Yukarıdaki şablonlardan birini seçin veya sıfırdan bir otomasyon oluşturun.
                  </p>
                </div>
                <Link href="/automations/new" className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold"
                  style={{ background: '#4470ff', color: '#fff' }}>
                  <Plus className="w-3.5 h-3.5" /> İlk Otomasyonu Oluştur
                </Link>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[13px]" style={{ color: '#44445a' }}>Filtreyle eşleşen otomasyon bulunamadı</p>
              </div>
            ) : (
              <div className="rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['OTOMASYON ADI', 'DURUM', 'TETİKLEYİCİ', 'ÇALIŞMA (30G)', 'DÖNÜŞÜM ORANI', 'KAZANILAN GELİR', 'SON ÇALIŞMA', ''].map(col => (
                        <th key={col} className="text-left px-4 py-2.5 text-[9px] font-semibold tracking-wider whitespace-nowrap"
                          style={{ color: '#3e3e54' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a, i) => {
                      const st = STATUS_CFG[a.status] ?? STATUS_CFG.draft
                      const meta = TRIGGER_META[a.trigger] ?? { label: a.trigger || '—', icon: Zap, color: '#8080a0' }
                      const MetaIcon = meta.icon
                      const conv = a.sent > 0 ? ((a.converted / a.sent) * 100).toFixed(1) : null
                      const isUpdating = updatingId === a.id
                      return (
                        <tr key={a.id} className="transition-all cursor-default"
                          style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${meta.color}15` }}>
                                <MetaIcon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                              </div>
                              <div>
                                <p className="text-[12px] font-semibold" style={{ color: '#eeeef4' }}>{a.name}</p>
                                <p className="text-[10px]" style={{ color: '#44445a' }}>{meta.label}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                              style={
                                a.status === 'active'
                                  ? { background: 'rgba(34,201,122,0.1)', color: '#22c97a', border: '1px solid rgba(34,201,122,0.2)' }
                                  : a.status === 'paused'
                                    ? { background: 'rgba(240,160,32,0.1)', color: '#f0a020', border: '1px solid rgba(240,160,32,0.2)' }
                                    : { background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }
                              }>
                              <span className={cn('w-1.5 h-1.5 rounded-full', st.dot)} />
                              {st.label}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#8080a0' }}>
                              <MetaIcon className="w-3 h-3" /> {meta.label}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[11px] font-semibold" style={{ color: '#eeeef4', fontFamily: 'monospace' }}>
                            {formatNumber(a.runStats?.total ?? 0)}
                          </td>
                          <td className="px-4 py-3">
                            {conv ? (
                              <span className="text-[11px] font-semibold" style={{ color: '#22c97a', fontFamily: 'monospace' }}>%{conv}</span>
                            ) : <span style={{ color: '#33334a' }}>—</span>}
                          </td>
                          <td className="px-4 py-3 text-[12px] font-bold" style={{ color: '#22c97a', fontFamily: 'monospace' }}>
                            {a.revenue > 0 ? formatCurrency(a.revenue) : '—'}
                          </td>
                          <td className="px-4 py-3 text-[11px]" style={{ color: '#8080a0' }}>
                            {relativeTime(a.runStats?.lastRun ?? null)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Link href={`/automations/${a.id}/builder`}
                                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                                style={{ background: 'rgba(153,180,255,0.08)', color: '#99b4ff', border: '1px solid rgba(153,180,255,0.15)' }}>
                                Düzenle
                              </Link>
                              <button
                                onClick={() => handleToggle(a.id, a.status)}
                                disabled={isUpdating}
                                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 disabled:opacity-60"
                                style={a.status === 'active'
                                  ? { background: 'rgba(240,160,32,0.1)', color: '#f0a020', border: '1px solid rgba(240,160,32,0.2)' }
                                  : { background: 'rgba(34,201,122,0.1)', color: '#22c97a', border: '1px solid rgba(34,201,122,0.2)' }}>
                                {isUpdating
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : a.status === 'active' ? <><Pause className="w-3 h-3" /> Duraklat</> : <><Play className="w-3 h-3" /> Başlat</>}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              </div>
            )}
          </div>
        </div>

        {/* ── AI Automation Manager panel — desktop only ── */}
        <div className="hidden lg:flex w-[300px] shrink-0 flex-col border-l overflow-hidden"
          style={{ background: '#0d0d1a', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(159,122,250,0.15)', border: '1px solid rgba(159,122,250,0.25)' }}>
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>AI Automation Manager</p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(34,201,122,0.15)', color: '#22c97a' }}>Beta</span>
              </div>
            </div>
            {AI_SUGGESTIONS.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,165,0,0.1)', color: '#f0a020', border: '1px solid rgba(240,160,32,0.2)' }}>
                {AI_SUGGESTIONS.length} öneri
              </span>
            )}
          </div>

          <div className="p-4 flex-1 overflow-auto space-y-3">
            {/* Suggested automations — no fake revenue */}
            <p className="text-[11px] font-semibold" style={{ color: '#44445a' }}>Yeni Otomasyon Önerileri</p>
            {AI_SUGGESTIONS.map((s, i) => {
              const SIcon = s.icon
              const isCreating = creatingSuggestion === i
              return (
                <div key={i} className="p-3.5 rounded-xl cursor-default"
                  style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}>
                      <SIcon className="w-3.5 h-3.5" style={{ color: s.color }} />
                    </div>
                    <p className="text-[11px] font-bold" style={{ color: s.color }}>{s.title}</p>
                  </div>
                  <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: '#8080a0' }}>{s.text}</p>
                  <button
                    onClick={() => createSuggestedAutomation(s.title, s.trigger, i)}
                    disabled={isCreating}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-60"
                    style={{ background: `${s.color}18`, color: s.color }}>
                    {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    {isCreating ? 'Oluşturuluyor...' : 'Oluştur'}
                  </button>
                </div>
              )
            })}

            {/* Low performers — real data, shown only when real low performers exist */}
            {lowPerformers.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                <p className="text-[11px] font-semibold mb-2.5" style={{ color: '#44445a' }}>Düşük Performans Uyarıları</p>
                {lowPerformers.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-2 p-3 rounded-xl mb-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold truncate" style={{ color: '#eeeef4' }}>{a.name}</p>
                      <p className="text-[10px]" style={{ color: '#8080a0' }}>
                        Dönüşüm oranı %{a.rate.toFixed(1)} ile düşük.
                      </p>
                    </div>
                    <Link href={`/automations/${a.id}/builder`}
                      className="text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded-lg whitespace-nowrap"
                      style={{ background: 'rgba(68,112,255,0.1)', color: '#99b4ff' }}>
                      Düzenle
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missing automations — dynamically computed from templates vs existing */}
          {missingTemplates.length > 0 && (
            <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold" style={{ color: '#eeeef4' }}>Eksik Otomasyonlar</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(240,160,32,0.1)', color: '#f0a020' }}>
                  {missingTemplates.length} eksik
                </span>
              </div>
              <div className="space-y-1.5">
                {missingTemplates.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => activateTemplate(tpl.id)}
                    disabled={activatingTpl === tpl.id}
                    className="w-full text-left flex items-center justify-between px-2.5 py-2 rounded-xl transition-all disabled:opacity-60"
                    style={{ background: 'rgba(68,112,255,0.06)', border: '1px solid rgba(68,112,255,0.12)' }}>
                    <span className="text-[11px] truncate" style={{ color: '#99b4ff' }}>{tpl.name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0 ml-2 flex items-center gap-1"
                      style={{ background: 'rgba(68,112,255,0.15)', color: '#99b4ff' }}>
                      {activatingTpl === tpl.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Oluştur
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
