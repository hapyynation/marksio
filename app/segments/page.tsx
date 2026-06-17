'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import {
  Users, Plus, X, Check, Loader2, MoreHorizontal,
  Sparkles, Trash2, Search, RefreshCw,
  AlertCircle, Filter, Pencil,
} from 'lucide-react'
import Link from 'next/link'
import { cn, formatNumber } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Rule {
  field: string
  operator: string
  value: string
}

interface Segment {
  id: string
  name: string
  description?: string | null
  type: string
  count: number
  color: string
  icon: string
  rules: Rule[]
  matchType: string
  active: boolean
  createdAt: string
}

interface AISuggestion {
  title: string
  description: string
  insight: string
  rules: Rule[]
  color: string
  icon: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RULE_FIELDS = [
  { value: 'totalSpent',     label: 'Toplam Harcama (₺)',    type: 'number', placeholder: '5000' },
  { value: 'totalOrders',    label: 'Sipariş Sayısı',        type: 'number', placeholder: '5' },
  { value: 'daysSinceOrder', label: 'Son Sipariş (gün önce)',type: 'number', placeholder: '30' },
  { value: 'avgOrder',       label: 'Ortalama Sepet (₺)',    type: 'number', placeholder: '500' },
  { value: 'score',          label: 'Müşteri Skoru',         type: 'number', placeholder: '60' },
  { value: 'tags',           label: 'Etiket',                type: 'text',   placeholder: 'vip' },
  { value: 'source',         label: 'Kaynak',                type: 'text',   placeholder: 'shopify' },
  { value: 'segment',        label: 'Mevcut Segment',        type: 'text',   placeholder: 'new' },
]

const NUMBER_OPS = [
  { value: 'gte', label: '≥ büyük veya eşit' },
  { value: 'gt',  label: '> büyük' },
  { value: 'lte', label: '≤ küçük veya eşit' },
  { value: 'lt',  label: '< küçük' },
  { value: 'eq',  label: '= eşit' },
  { value: 'neq', label: '≠ eşit değil' },
]

const TEXT_OPS = [
  { value: 'eq',          label: '= eşit' },
  { value: 'contains',    label: 'içeriyor' },
  { value: 'not_contains',label: 'içermiyor' },
  { value: 'neq',         label: '≠ eşit değil' },
]

const ICON_OPTIONS = ['👥','👑','💎','🤝','✨','🛒','💤','🚨','⚠️','🎯','⭐','🔄','📦','🏆','💰','🎁']
const COLOR_OPTIONS = ['#4470ff','#f0a020','#9f7afa','#22c97a','#e84545','#8080a0','#00bcd4','#f59e0b','#ec4899','#10b981']

const LUCIDE_TO_EMOJI: Record<string, string> = {
  AlertTriangle: '⚠️', UserPlus: '👤', UserMinus: '👤', Users: '👥',
  Crown: '👑', ShoppingCart: '🛒', Target: '🎯', Flame: '🔥',
  Heart: '❤️', Star: '⭐', Activity: '📊', Circle: '⭕',
  Package: '📦', Zap: '⚡', Sparkles: '✨', Tag: '🏷️',
  Clock: '⏰', TrendingUp: '📈', Gift: '🎁', RefreshCw: '🔄',
}

function resolveIcon(icon: string): string {
  return LUCIDE_TO_EMOJI[icon] ?? icon
}

// ─── Small components ─────────────────────────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(!enabled) }}
      className="relative flex items-center shrink-0 transition-all"
      style={{ width: 36, height: 20 }}
    >
      <div className="absolute inset-0 rounded-full transition-all"
        style={{ background: enabled ? '#4470ff' : 'rgba(255,255,255,0.1)' }} />
      <div className="absolute w-4 h-4 rounded-full transition-all"
        style={{ background: '#fff', left: enabled ? 18 : 2, top: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </button>
  )
}

function RuleRow({
  rule, index, onUpdate, onRemove,
}: {
  rule: Rule; index: number
  onUpdate: (i: number, key: keyof Rule, v: string) => void
  onRemove: (i: number) => void
}) {
  const fieldDef = RULE_FIELDS.find(f => f.value === rule.field)
  const ops = fieldDef?.type === 'text' ? TEXT_OPS : NUMBER_OPS

  return (
    <div className="flex items-center gap-1.5 p-2.5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Field */}
      <select
        value={rule.field}
        onChange={e => onUpdate(index, 'field', e.target.value)}
        className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-[11px] outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }}
      >
        {RULE_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      {/* Operator */}
      <select
        value={rule.operator}
        onChange={e => onUpdate(index, 'operator', e.target.value)}
        className="w-28 px-2 py-1.5 rounded-lg text-[10px] outline-none shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }}
      >
        {ops.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
      </select>
      {/* Value */}
      <input
        value={rule.value}
        onChange={e => onUpdate(index, 'value', e.target.value)}
        placeholder={fieldDef?.placeholder ?? ''}
        className="w-20 px-2 py-1.5 rounded-lg text-[11px] outline-none text-center shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }}
      />
      <button
        onClick={() => onRemove(index)}
        className="p-1 rounded-lg shrink-0 transition-colors"
        style={{ color: '#44445a' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#e84545')}
        onMouseLeave={e => (e.currentTarget.style.color = '#44445a')}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SegmentsPage() {
  const [segments, setSegments]         = useState<Segment[]>([])
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)
  const [showCreate, setShowCreate]     = useState(false)
  const [search, setSearch]             = useState('')
  const [openMenuId, setOpenMenuId]     = useState<string | null>(null)
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [suggestions, setSuggestions]   = useState<AISuggestion[]>([])
  const [aiLoading, setAiLoading]       = useState(false)
  const [saveError, setSaveError]       = useState('')
  const [saving, setSaving]             = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [userPlan, setUserPlan] = useState<string>('starter')

  const [form, setForm] = useState({
    name: '', description: '', matchType: 'all' as 'all' | 'any',
    color: '#4470ff', icon: '👥', rules: [] as Rule[],
  })

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchSegments = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/segments')
      if (res.ok) setSegments(await res.json())
    } catch { /* silent */ }
    setLoading(false)
    setRefreshing(false)
  }, [])

  const fetchSuggestions = useCallback(async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/segment-suggestions')
      if (res.ok) {
        const d = await res.json() as { suggestions?: AISuggestion[] }
        setSuggestions(d.suggestions ?? [])
      }
    } catch { /* silent */ }
    setAiLoading(false)
  }, [])

  useEffect(() => {
    fetchSegments()
    fetch('/api/user/plan')
      .then(r => r.json())
      .then((d: { plan?: string }) => { if (d.plan) setUserPlan(d.plan) })
      .catch(() => {})
  }, [fetchSegments])

  const canUseAISegments = ['growth', 'agency'].includes(userPlan)

  useEffect(() => {
    if (canUseAISegments) fetchSuggestions()
  }, [canUseAISegments, fetchSuggestions])

  // Debounced preview count
  useEffect(() => {
    if (!showCreate || form.rules.length === 0) { setPreviewCount(null); return }
    setPreviewLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/segments/preview', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rules: form.rules, matchType: form.matchType }),
        })
        if (res.ok) { const d = await res.json() as { count: number }; setPreviewCount(d.count) }
      } catch { /* silent */ }
      setPreviewLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [showCreate, form.rules, form.matchType])

  // Close dropdown on outside click
  useEffect(() => {
    const fn = () => setOpenMenuId(null)
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [])

  // ─── Actions ────────────────────────────────────────────────────────────────

  async function toggleActive(id: string, active: boolean) {
    setSegments(prev => prev.map(s => s.id === id ? { ...s, active } : s))
    await fetch(`/api/segments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
  }

  async function deleteSegment(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/segments/${id}`, { method: 'DELETE' })
    if (res.ok) setSegments(prev => prev.filter(s => s.id !== id))
    else {
      const d = await res.json() as { error?: string }
      alert(d.error ?? 'Silinemedi')
    }
    setDeletingId(null)
    setOpenMenuId(null)
  }

  async function refreshCounts() {
    setRefreshing(true)
    await fetch('/api/segments/apply', { method: 'POST' })
    await fetchSegments(true)
  }

  async function saveSegment() {
    if (!form.name.trim()) { setSaveError('Segment adı gerekli'); return }
    if (form.rules.length === 0) { setSaveError('En az 1 koşul ekleyin'); return }
    setSaving(true); setSaveError('')
    try {
      const res = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setSaveError(d.error ?? 'Kaydedilemedi')
        return
      }
      await fetchSegments(true)
      setShowCreate(false)
      setForm({ name: '', description: '', matchType: 'all', color: '#4470ff', icon: '👥', rules: [] })
    } catch { setSaveError('Bağlantı hatası') }
    setSaving(false)
  }

  function applySuggestion(s: AISuggestion) {
    setForm({
      name: s.title, description: s.description, matchType: 'all',
      color: s.color, icon: s.icon,
      rules: (s.rules ?? []).map(r => ({ ...r, value: String(r.value) })),
    })
    setShowCreate(true)
  }

  function addRule() {
    setForm(f => ({ ...f, rules: [...f.rules, { field: 'totalSpent', operator: 'gte', value: '1000' }] }))
  }
  function removeRule(i: number) {
    setForm(f => ({ ...f, rules: f.rules.filter((_, idx) => idx !== i) }))
  }
  function updateRule(i: number, key: keyof Rule, value: string) {
    setForm(f => {
      const rules = [...f.rules]
      rules[i] = { ...rules[i], [key]: value }
      // Reset operator when field changes
      if (key === 'field') {
        const fieldDef = RULE_FIELDS.find(fd => fd.value === value)
        rules[i].operator = fieldDef?.type === 'text' ? 'contains' : 'gte'
      }
      return { ...f, rules }
    })
  }

  // ─── Derived ────────────────────────────────────────────────────────────────

  const filtered    = segments.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))
  const totalCount  = segments.reduce((a, s) => a + s.count, 0)
  const activeCount = segments.filter(s => s.active).length
  const biggest     = segments.length > 0 ? segments.reduce((a, b) => b.count > a.count ? b : a) : null

  return (
    <AppShell>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 md:px-6 h-14 shrink-0 gap-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,15,0.95)', backdropFilter: 'blur(24px)' }}>
        <div>
          <h1 className="text-[15px] md:text-[16px] font-bold" style={{ color: '#eeeef4' }}>Segmentler</h1>
          <p className="text-[11px] hidden sm:block" style={{ color: '#44445a' }}>
            Müşterilerinizi davranış ve alışveriş geçmişine göre otomatik segmentlere ayırın.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={refreshCounts}
            disabled={refreshing}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            Sayımları Güncelle
          </button>
          <button
            onClick={() => { setShowCreate(true); setSaveError('') }}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-[12px] font-bold min-h-[44px]"
            style={{ background: '#4470ff', color: '#fff' }}
          >
            <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Yeni Segment</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 lg:overflow-hidden">

        {/* ── Main ── */}
        <div className="w-full lg:flex-1 flex flex-col lg:overflow-hidden min-h-0">

          {/* KPI cards */}
          <div className="px-4 md:px-6 py-4 grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
            {[
              { label: 'Toplam Segment',     value: String(segments.length), sub: `${activeCount} aktif`, color: '#99b4ff', icon: '📊' },
              { label: 'Toplam Müşteri',      value: formatNumber(totalCount), sub: 'tüm segmentlerde',  color: '#4470ff',  icon: '👥' },
              { label: 'En Büyük Segment',    value: biggest?.name ?? '—', sub: biggest ? formatNumber(biggest.count) + ' müşteri' : '—', color: '#f0a020', icon: '👑', small: true },
              { label: 'Aktif Segment',       value: String(activeCount), sub: `${segments.length - activeCount} pasif`, color: '#22c97a', icon: '✅' },
            ].map(kpi => (
              <div key={kpi.label} className="rounded-2xl p-4 relative overflow-hidden min-w-0"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="absolute top-0 left-4 right-4 h-px"
                  style={{ background: `linear-gradient(90deg,transparent,${kpi.color}44,transparent)` }} />
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#44445a' }}>{kpi.label}</p>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px]"
                    style={{ background: `${kpi.color}18` }}>{kpi.icon}</div>
                </div>
                <p className={cn('font-bold mb-1 leading-tight', (kpi as { small?: boolean }).small ? 'text-[13px]' : 'text-[20px]')}
                  style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>{kpi.value}</p>
                <p className="text-[10px]" style={{ color: '#44445a' }}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div className="px-6 py-2 flex items-center gap-3 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: '#44445a' }} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Segment ara..."
                className="pl-8 pr-3 py-1.5 text-[12px] rounded-xl outline-none w-52"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }}
              />
            </div>
            <span className="ml-auto text-[11px]" style={{ color: '#33334a', fontFamily: 'monospace' }}>
              {filtered.length} segment
            </span>
          </div>

          {/* Segment table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
                  {['SEGMENT', 'TÜR', 'MÜŞTERİ SAYISI', 'KOŞULLAR', 'DURUM', 'İŞLEMLER'].map(col => (
                    <th key={col} className="text-left px-4 py-2.5 text-[9px] font-semibold tracking-wider whitespace-nowrap"
                      style={{ color: '#3e3e54' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {[180, 60, 80, 200, 50, 80].map((w, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.04)', width: w }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.map(seg => (
                  <tr key={seg.id}
                    className="transition-all"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Segment name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[16px] shrink-0"
                          style={{ background: `${seg.color}15`, border: `1px solid ${seg.color}25` }}>
                          {resolveIcon(seg.icon)}
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold truncate max-w-[160px]" style={{ color: '#eeeef4' }}>{seg.name}</p>
                          {seg.description && (
                            <p className="text-[10px]" style={{ color: '#44445a' }}>
                              {seg.description.length > 50 ? seg.description.slice(0, 49) + '…' : seg.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: seg.type === 'builtin' ? 'rgba(68,112,255,0.12)' : 'rgba(34,201,122,0.12)',
                          color: seg.type === 'builtin' ? '#99b4ff' : '#22c97a',
                        }}>
                        {seg.type === 'builtin' ? 'Varsayılan' : 'Özel'}
                      </span>
                    </td>

                    {/* Count */}
                    <td className="px-4 py-3.5">
                      <p className="text-[13px] font-bold" style={{ color: '#eeeef4', fontFamily: 'monospace' }}>
                        {formatNumber(seg.count)}
                      </p>
                      {totalCount > 0 && (
                        <p className="text-[9px]" style={{ color: '#44445a' }}>
                          %{((seg.count / totalCount) * 100).toFixed(1)} toplam
                        </p>
                      )}
                    </td>

                    {/* Rules preview */}
                    <td className="px-4 py-3.5 max-w-[220px]">
                      <div className="flex flex-wrap gap-1">
                        {(seg.rules ?? []).slice(0, 3).map((r, i) => {
                          const fieldLabel = RULE_FIELDS.find(f => f.value === r.field)?.label ?? r.field
                          return (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
                              style={{ background: 'rgba(153,180,255,0.08)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.07)' }}>
                              {fieldLabel} {r.operator} {r.value}
                            </span>
                          )
                        })}
                        {(seg.rules ?? []).length > 3 && (
                          <span className="text-[10px]" style={{ color: '#44445a' }}>+{seg.rules.length - 3}</span>
                        )}
                        {(seg.rules ?? []).length === 0 && (
                          <span className="text-[10px]" style={{ color: '#44445a' }}>Tüm müşteriler</span>
                        )}
                      </div>
                    </td>

                    {/* Toggle */}
                    <td className="px-4 py-3.5">
                      <Toggle enabled={seg.active} onChange={v => toggleActive(seg.id, v)} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        {seg.type !== 'builtin' && (
                          <Link href={`/segments/${seg.id}/edit`}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1"
                            style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Pencil className="w-2.5 h-2.5" /> Düzenle
                          </Link>
                        )}
                        <Link href={`/campaigns/new`}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                          style={{ background: 'rgba(68,112,255,0.08)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.15)' }}>
                          Kampanya Oluştur
                        </Link>

                        {/* Menu */}
                        <div className="relative">
                          <button
                            onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === seg.id ? null : seg.id) }}
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: '#44445a' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                          {openMenuId === seg.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 rounded-xl z-20 overflow-hidden"
                              style={{ background: '#141420', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                              {seg.type !== 'builtin' && (
                                <button
                                  onClick={() => deleteSegment(seg.id)}
                                  disabled={deletingId === seg.id}
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-medium transition-all"
                                  style={{ color: '#e84545' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(232,69,69,0.08)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  {deletingId === seg.id
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : <Trash2 className="w-3 h-3" />}
                                  Sil
                                </button>
                              )}
                              {seg.type === 'builtin' && (
                                <p className="px-3 py-2.5 text-[10px]" style={{ color: '#44445a' }}>
                                  Varsayılan segment silinemez
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Filter className="w-8 h-8" style={{ color: '#33334a' }} />
                <p className="text-[13px]" style={{ color: '#44445a' }}>Segment bulunamadı</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel ── */}
        {showCreate ? (

          /* ── Segment builder ── */
          <div className="w-full lg:w-80 shrink-0 flex flex-col overflow-y-auto"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)', borderLeft: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[13px] font-bold" style={{ color: '#eeeef4' }}>Yeni Segment Oluştur</p>
              <button onClick={() => { setShowCreate(false); setSaveError('') }}
                className="p-1.5 rounded-lg transition-all" style={{ color: '#44445a' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1">

              {/* Name */}
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#8080a0' }}>Segment Adı *</label>
                <input
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Örn: Sadık Müşteriler"
                  className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#4470ff66')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#8080a0' }}>Açıklama</label>
                <input
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Bu segment nedir?"
                  className="w-full px-3 py-2.5 rounded-xl text-[12px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#4470ff66')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
              </div>

              {/* Icon + Color */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#8080a0' }}>İkon</label>
                  <div className="grid grid-cols-8 gap-1">
                    {ICON_OPTIONS.map(ic => (
                      <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[13px] transition-all"
                        style={{ background: form.icon === ic ? '#4470ff22' : 'rgba(255,255,255,0.04)', border: form.icon === ic ? '1px solid #4470ff66' : '1px solid transparent' }}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#8080a0' }}>Renk</label>
                <div className="flex gap-1.5 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-6 h-6 rounded-full transition-all"
                      style={{
                        background: c,
                        boxShadow: form.color === c ? `0 0 0 2px rgba(0,0,0,0.8), 0 0 0 4px ${c}` : 'none',
                      }} />
                  ))}
                </div>
              </div>

              {/* Rules */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold" style={{ color: '#8080a0' }}>KOŞULLAR *</p>
                  {/* Match type */}
                  <div className="flex items-center p-0.5 rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {(['all', 'any'] as const).map(t => (
                      <button key={t} onClick={() => setForm(f => ({ ...f, matchType: t }))}
                        className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all"
                        style={form.matchType === t
                          ? { background: 'rgba(255,255,255,0.08)', color: '#eeeef4' }
                          : { color: '#44445a' }}>
                        {t === 'all' ? 'Tümü' : 'Herhangi'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {form.rules.map((rule, i) => (
                    <RuleRow key={i} rule={rule} index={i} onUpdate={updateRule} onRemove={removeRule} />
                  ))}
                </div>

                <button onClick={addRule}
                  className="flex items-center gap-1.5 mt-2 px-3 py-2 rounded-xl w-full text-[11px] font-semibold transition-all"
                  style={{ background: 'rgba(68,112,255,0.06)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.15)' }}>
                  <Plus className="w-3.5 h-3.5" /> Koşul Ekle
                </button>
              </div>

              {/* Preview */}
              <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[15px]"
                    style={{ background: `${form.color}15`, border: `1px solid ${form.color}25` }}>
                    {resolveIcon(form.icon)}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: '#eeeef4' }}>{form.name || 'Segment Adı'}</p>
                    <p className="text-[10px]" style={{ color: '#44445a' }}>{form.rules.length} koşul · {form.matchType === 'all' ? 'tümü' : 'herhangi biri'}</p>
                  </div>
                </div>
                {form.rules.length === 0 ? (
                  <p className="text-[10px]" style={{ color: '#44445a' }}>Koşul ekleyince önizleme görünür.</p>
                ) : previewLoading ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#44445a' }} />
                    <p className="text-[10px]" style={{ color: '#44445a' }}>Hesaplanıyor…</p>
                  </div>
                ) : previewCount !== null ? (
                  <p className="text-[11px] font-bold" style={{ color: form.color }}>
                    👥 {formatNumber(previewCount)} müşteri bu segmente giriyor
                  </p>
                ) : null}
              </div>

              {saveError && (
                <div className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(232,69,69,0.08)', border: '1px solid rgba(232,69,69,0.2)' }}>
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#e84545' }} />
                  <p className="text-[11px]" style={{ color: '#e84545' }}>{saveError}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 flex gap-2 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => { setShowCreate(false); setSaveError('') }}
                className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
                İptal
              </button>
              <button onClick={saveSegment} disabled={saving}
                className="flex-1 py-2 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                style={{ background: '#4470ff', color: '#fff' }}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Kaydet
              </button>
            </div>
          </div>

        ) : (

          /* ── AI Öneriler panel ── */
          <div className="w-full lg:w-[290px] shrink-0 flex flex-col overflow-hidden"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#0d0d1a' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(159,122,250,0.15)', border: '1px solid rgba(159,122,250,0.25)' }}>
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>AI Segment Önerileri</p>
              </div>
              {canUseAISegments && (
                <button onClick={fetchSuggestions} disabled={aiLoading}
                  className="p-1.5 rounded-lg transition-all" style={{ color: '#44445a' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <RefreshCw className={cn('w-3.5 h-3.5', aiLoading && 'animate-spin')} />
                </button>
              )}
            </div>

            <div className="p-4 flex-1 overflow-auto space-y-3">
              {!canUseAISegments ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(159,122,250,0.1)', border: '1px solid rgba(159,122,250,0.2)' }}>
                    <Sparkles className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold mb-1" style={{ color: '#eeeef4' }}>🔒 AI Segment Önerileri</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: '#44445a' }}>
                      Bu özellik Growth planında kullanılabilir.
                    </p>
                  </div>
                  <a href="/plans"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
                    style={{ background: 'rgba(159,122,250,0.12)', color: '#9f7afa', border: '1px solid rgba(159,122,250,0.25)' }}>
                    Growth&apos;a Yükselt →
                  </a>
                </div>
              ) : (
                <>
              <p className="text-[11px]" style={{ color: '#44445a' }}>
                Müşteri verileriniz analiz edilerek oluşturuldu.
              </p>

              {aiLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="p-3.5 rounded-xl animate-pulse"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: 96 }} />
                ))
              ) : suggestions.map((s, i) => (
                <div key={i} className="p-3.5 rounded-xl transition-all cursor-default"
                  style={{ background: `${s.color}10`, border: `1px solid ${s.color}28` }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${s.color}18`)}
                  onMouseLeave={e => (e.currentTarget.style.background = `${s.color}10`)}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[14px]">{s.icon}</span>
                    <p className="text-[11px] font-bold" style={{ color: s.color }}>{s.title}</p>
                  </div>
                  <p className="text-[10px] leading-relaxed mb-1" style={{ color: '#8080a0' }}>{s.description}</p>
                  <p className="text-[10px] font-semibold mb-2.5" style={{ color: s.color }}>{s.insight}</p>
                  <button onClick={() => applySuggestion(s)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                    style={{ background: `${s.color}18`, color: s.color }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${s.color}28`)}
                    onMouseLeave={e => (e.currentTarget.style.background = `${s.color}18`)}>
                    Segment Oluştur →
                  </button>
                </div>
              ))}

              {/* Stats summary */}
              <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[11px] font-semibold mb-2.5" style={{ color: '#eeeef4' }}>Segment Özeti</p>
                <div className="space-y-2">
                  {[
                    ['Toplam segment', String(segments.length)],
                    ['Aktif segment', String(activeCount)],
                    ['Toplam kapsam', formatNumber(totalCount) + ' müşteri'],
                    ['En büyük', biggest?.name ?? '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between text-[11px]">
                      <span style={{ color: '#44445a' }}>{label}</span>
                      <span className="font-semibold" style={{ color: '#eeeef4' }}>{value}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setShowCreate(true); setSaveError('') }}
                  className="w-full mt-3 py-2 rounded-xl text-[11px] font-bold transition-all"
                  style={{ background: 'rgba(68,112,255,0.1)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.2)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(68,112,255,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(68,112,255,0.1)')}>
                  <Users className="w-3.5 h-3.5 inline mr-1.5" />
                  Özel Segment Oluştur
                </button>
                <GenerateAiButton onDone={fetchSegments} />
              </div>
              </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

// ─── AI Toplu Segment Oluştur ─────────────────────────────────────────────────

function GenerateAiButton({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; message: string; source?: string } | null>(null)

  async function generate() {
    setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/segments/generate-ai', { method: 'POST' })
      const data = await res.json() as { created: number; message: string; source?: string }
      setResult(data)
      if (data.created > 0) onDone()
    } catch { setResult({ created: 0, message: 'Hata oluştu' }) }
    finally { setLoading(false) }
  }

  return (
    <div className="mt-2">
      <button onClick={generate} disabled={loading}
        className="w-full py-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        style={{ background: 'rgba(159,122,250,0.1)', color: '#9f7afa', border: '1px solid rgba(159,122,250,0.2)' }}
        onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(159,122,250,0.18)')}
        onMouseLeave={e => !loading && ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(159,122,250,0.1)')}>
        {loading ? <><Loader2 className="w-3 h-3 animate-spin" /> Groq AI analiz ediyor…</> : <><Sparkles className="w-3 h-3" /> AI ile Tüm Segmentleri Oluştur</>}
      </button>
      {result && (
        <p className="text-[10px] text-center mt-1.5" style={{ color: result.created > 0 ? '#22c97a' : '#8080a0' }}>
          {result.message}{result.source === 'groq' ? ' (Groq AI)' : ''}
        </p>
      )}
    </div>
  )
}
