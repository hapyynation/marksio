'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Zap, Play, Pause, Plus, Search,
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
   AUTOMATION CARD
───────────────────────────────────────────────────────────── */

function AutoCard({ a, onToggle, onDelete, onClone }: {
  a: AutomationItem; onToggle: () => void; onDelete: () => void; onClone: () => void
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
    onToggle()
    setTimeout(() => setToggling(false), 900)
  }

  return (
    <div className={cn(
      'bento-card overflow-hidden transition-all duration-200',
      a.status === 'active' && 'hover:shadow-md',
    )} style={{
      borderColor: a.status === 'active' ? `${meta.color}30` : undefined,
    }}>
      {/* Colour strip */}
      <div className="h-[2px]" style={{
        background: a.status === 'active'
          ? `linear-gradient(90deg, ${meta.color}, transparent)`
          : 'transparent',
      }} />

      <div className="p-4 space-y-3">
        {/* Header row */}
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

        {/* 4-stat grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'Toplam Run',    value: formatNumber(rs.total),            color: 'var(--text-1)' },
            { label: 'Başarılı',      value: formatNumber(rs.completed),        color: rs.completed > 0 ? '#22c97a' : 'var(--text-3)' },
            { label: 'Hatalı',        value: formatNumber(rs.failed),           color: rs.failed > 0    ? '#e84545' : 'var(--text-3)' },
            { label: 'Son Çalışma',   value: relativeTime(rs.lastRun),          color: 'var(--text-2)' },
          ].map(s => (
            <div key={s.label} className="rounded-lg py-1.5 px-2 text-center" style={{ background: 'var(--surface-2)' }}>
              <p className="text-[8.5px] font-medium uppercase tracking-wide truncate" style={{ color: 'var(--text-3)' }}>{s.label}</p>
              <p className="text-[11px] font-bold font-mono mt-0.5 truncate" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Success rate bar */}
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

        {/* Revenue + conversion */}
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

        {/* Action row */}
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
            {/* Delete */}
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

            {/* Toggle */}
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
  const [activatingTpl, setActivatingTpl] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/automations').then(r => r.json()),
      fetch('/api/automation-templates').then(r => r.json()),
    ])
      .then(([autoData, tplData]) => {
        if (Array.isArray(autoData)) setAutomations(autoData)
        else setError(autoData.error ?? 'Hata')
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
      }
    } finally {
      setActivatingTpl(null)
    }
  }

  const handleToggle = async (id: string, current: string) => {
    const next = current === 'active' ? 'paused' : 'active'
    const res  = await fetch(`/api/automations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) setAutomations(p => p.map(a => a.id === id ? { ...a, status: next } : a))
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/automations/${id}`, { method: 'DELETE' })
    if (res.ok) setAutomations(p => p.filter(a => a.id !== id))
  }

  const handleClone = async (id: string) => {
    const res = await fetch(`/api/automations/${id}/clone`, { method: 'POST' })
    if (res.ok) load()
  }

  const filtered = automations.filter(a =>
    (filter === 'all' || a.status === filter) &&
    (!search || a.name.toLowerCase().includes(search.toLowerCase())),
  )

  /* ── Summary KPIs ───────────────────────────────────────── */
  const activeCount    = automations.filter(a => a.status === 'active').length
  const totalRuns      = automations.reduce((s, a) => s + (a.runStats?.total ?? 0), 0)
  const totalCompleted = automations.reduce((s, a) => s + (a.runStats?.completed ?? 0), 0)
  const totalRevenue   = automations.reduce((s, a) => s + a.revenue, 0)

  return (
    <AppShell>
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 h-14 shrink-0"
        style={{ background: 'rgba(8,8,15,0.95)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h1 className="text-[16px] font-bold" style={{ color: '#eeeef4' }}>Otomasyonlar</h1>
          <p className="text-[11px]" style={{ color: '#44445a' }}>Akıllı müşteri yolculukları oluşturun, yönetin ve performanslarını artırın.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
            Raporu İndir
          </button>
          <Link href="/automations/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold"
            style={{ background: '#4470ff', color: '#fff' }}>
            <Plus className="w-3.5 h-3.5" /> Yeni Otomasyon
          </Link>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Main content ── */}
        <div className="flex-1 overflow-auto p-5 space-y-5">

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {[
              { label: 'Aktif Otomasyonlar', value: String(activeCount),          icon: Activity,   color: '#22c97a', bg: 'rgba(34,201,122,0.1)',  },
              { label: 'Toplam Çalıştırma',  value: formatNumber(totalRuns),      icon: Workflow,   color: '#4470ff', bg: 'rgba(68,112,255,0.1)',  },
              { label: 'Kurtarılan Gelir',   value: formatCurrency(totalRevenue), icon: TrendingUp, color: '#22c97a', bg: 'rgba(34,201,122,0.1)',  },
              { label: 'Dönüşüm Oranı',      value: totalRuns > 0 ? `%${((totalCompleted / totalRuns) * 100).toFixed(1)}` : '—', icon: Target, color: '#f0a020', bg: 'rgba(240,160,32,0.1)' },
              { label: 'Bekleyen İşlemler',  value: formatNumber(automations.reduce((s, a) => s + (a.runStats?.waiting ?? 0), 0)), icon: Timer, color: '#9f7afa', bg: 'rgba(159,122,250,0.1)' },
              { label: 'Toplam Otomasyon',   value: String(automations.length),  icon: BarChart3,  color: '#99b4ff', bg: 'rgba(153,180,255,0.1)', },
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
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
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
                        <p className="text-[10px]" style={{ color: '#44445a' }}>Beklenen Gelir</p>
                        <p className="text-[12px] font-bold" style={{ color: '#22c97a', fontFamily: 'monospace' }}>{tpl.expectedRevenue}</p>
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

          {/* ── Active automations ── */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-[14px] font-bold" style={{ color: '#eeeef4' }}>Aktif Otomasyonlar</h2>
              <div className="flex items-center p-0.5 gap-0.5 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {(['all','active','paused','draft'] as FilterKey[]).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                    style={filter === f ? { background: 'rgba(255,255,255,0.08)', color: '#eeeef4' } : { color: '#44445a' }}>
                    {f === 'all' ? 'Tümü' : STATUS_CFG[f]?.label ?? f}
                  </button>
                ))}
              </div>
              <div className="relative ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: '#44445a' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Otomasyon ara..."
                  className="pl-8 pr-3 py-1.5 text-[12px] rounded-xl outline-none w-48"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }} />
              </div>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px]"
                style={{ background: 'rgba(255,255,255,0.03)', color: '#44445a', border: '1px solid rgba(255,255,255,0.06)' }}>
                <BarChart3 className="w-3 h-3" /> Filtrele
              </button>
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
            ) : (
              /* Automation table */
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
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
                            {(() => {
                              const badgeStyle = a.status === 'active'
                                ? { background: 'rgba(34,201,122,0.1)', color: '#22c97a', border: '1px solid rgba(34,201,122,0.2)' }
                                : a.status === 'paused'
                                  ? { background: 'rgba(240,160,32,0.1)', color: '#f0a020', border: '1px solid rgba(240,160,32,0.2)' }
                                  : { background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }
                              return (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={badgeStyle}>
                                  <span className={cn('w-1.5 h-1.5 rounded-full', st.dot)} />
                                  {st.label}
                                </div>
                              )
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#8080a0' }}>
                              <MetaIcon className="w-3 h-3" /> {meta.label} {a.status === 'active' ? 'edildi' : 'yok'}
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
                              <button onClick={() => handleToggle(a.id, a.status)}
                                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                                style={a.status === 'active'
                                  ? { background: 'rgba(240,160,32,0.1)', color: '#f0a020', border: '1px solid rgba(240,160,32,0.2)' }
                                  : { background: 'rgba(34,201,122,0.1)', color: '#22c97a', border: '1px solid rgba(34,201,122,0.2)' }}>
                                {a.status === 'active' ? 'Duraklat' : 'Başlat'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── AI Automation Manager panel ── */}
        <div className="w-[300px] shrink-0 flex flex-col border-l overflow-hidden"
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
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,165,0,0.1)', color: '#f0a020', border: '1px solid rgba(240,160,32,0.2)' }}>3 öneri</span>
          </div>

          <div className="p-4 flex-1 overflow-auto space-y-3">
            <p className="text-[11px] font-semibold" style={{ color: '#44445a' }}>Yeni Otomasyon Önerileri</p>
            {[
              { icon: ShoppingCart, color: '#e84545', bg: 'rgba(232,69,69,0.08)', title: 'Ürün Stok Azalma Takibi', text: 'Stok azalan ürünler için otomatik bildirim akışı oluşturun.', revenue: '₺45.230', action: 'Oluştur' },
              { icon: Tag, color: '#4470ff', bg: 'rgba(68,112,255,0.08)', title: 'İlk Alışveriş İndirimi', text: 'İlk kez alışveriş yapacaklara özel indirim akışı kurun.', revenue: '₺38.750', action: 'Oluştur' },
              { icon: Clock, color: '#22c97a', bg: 'rgba(34,201,122,0.08)', title: 'Sadakat Puanı Hatırlatma', text: 'Puanları bitmek üzere olan müşterilere hatırlatma gönderin.', revenue: '₺22.480', action: 'Oluştur' },
            ].map((s, i) => {
              const SIcon = s.icon
              return (
                <div key={i} className="p-3.5 rounded-xl cursor-default"
                  style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}>
                      <SIcon className="w-3.5 h-3.5" style={{ color: s.color }} />
                    </div>
                    <p className="text-[11px] font-bold" style={{ color: s.color }}>{s.title}</p>
                  </div>
                  <p className="text-[11px] leading-relaxed mb-2" style={{ color: '#8080a0' }}>{s.text}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold" style={{ color: '#22c97a' }}>Beklenen: {s.revenue}</span>
                    <button className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                      style={{ background: `${s.color}18`, color: s.color }}>
                      {s.action}
                    </button>
                  </div>
                </div>
              )
            })}

            <button className="text-[11px] font-semibold" style={{ color: '#44445a' }}>Tüm Önerileri Gör →</button>

            {/* Low performance warnings */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
              <p className="text-[11px] font-semibold mb-2.5" style={{ color: '#44445a' }}>Düşük Performans Uyarıları</p>
              {[
                { name: 'Satın Alma Sonrası', issue: 'Açılma oranı %9.5 ile düşük.', color: '#e84545' },
                { name: 'Ürün İnceleme İsteği', issue: 'Açılma oranı %6.7 ile düşük.', color: '#f0a020' },
              ].map((w, i) => (
                <div key={i} className="flex items-start justify-between gap-2 p-3 rounded-xl mb-2"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="text-[11px] font-semibold" style={{ color: '#eeeef4' }}>{w.name}</p>
                    <p className="text-[10px]" style={{ color: '#8080a0' }}>{w.issue}</p>
                  </div>
                  <button className="text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded-lg"
                    style={{ background: 'rgba(68,112,255,0.1)', color: '#99b4ff' }}>
                    İncele
                  </button>
                </div>
              ))}
            </div>

            {/* Fırsatlar */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
              <p className="text-[11px] font-semibold mb-2.5" style={{ color: '#44445a' }}>Gelir Fırsatları</p>
              {[
                { name: 'Sepet Terk Akışını Optimize Et', sub: 'Ek %15 gelir artışı sağlayabilirsin.', revenue: '₺14.800', color: '#22c97a' },
                { name: 'VIP Müşteriler için Özel Tekif', sub: 'VIP segmentine özel kampanya oluştur.', revenue: '₺18.900', color: '#9f7afa' },
              ].map((f, i) => (
                <div key={i} className="p-3 rounded-xl mb-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold" style={{ color: '#eeeef4' }}>{f.name}</p>
                      <p className="text-[10px]" style={{ color: '#8080a0' }}>{f.sub}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-bold" style={{ color: '#22c97a' }}>{f.revenue}</p>
                      <button className="text-[10px] font-semibold" style={{ color: f.color }}>Optimize Et</button>
                    </div>
                  </div>
                </div>
              ))}
              <button className="text-[11px] font-semibold" style={{ color: '#44445a' }}>Tüm Fırsatları Gör →</button>
            </div>
          </div>

          {/* Eksik otomasyonlar */}
          <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold" style={{ color: '#eeeef4' }}>Eksik Otomasyonlar</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(240,160,32,0.1)', color: '#f0a020' }}>3 eksik</span>
            </div>
            <div className="space-y-1.5">
              {['Fiyat Düşüşü Bildirimi', 'Ürün Yeniden Stokta Bildirimi', 'Abone Yenileme Hatırlatma'].map((item, i) => (
                <button key={i} className="w-full text-left flex items-center justify-between px-2.5 py-2 rounded-xl transition-all"
                  style={{ background: 'rgba(68,112,255,0.06)', border: '1px solid rgba(68,112,255,0.12)' }}>
                  <span className="text-[11px]" style={{ color: '#99b4ff' }}>{item}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(68,112,255,0.15)', color: '#99b4ff' }}>Oluştur</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
