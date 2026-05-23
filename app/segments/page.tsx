'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import {
  Users, Crown, Heart, AlertTriangle, UserPlus, UserMinus,
  Plus, TrendingUp, Mail, MessageSquare, Sparkles, X, Check, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Segment {
  id: string
  name: string
  description?: string
  type: string
  count: number
  color: string
  icon: string
  rules: Rule[]
  createdAt: string
}

interface Rule {
  field: string
  operator: string
  value: string
}

const ICON_MAP: Record<string, React.ElementType> = {
  Crown, Heart, AlertTriangle, UserPlus, UserMinus, Users,
}

const COLOR_MAP: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   dot: 'bg-amber-400'   },
  violet:  { text: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  dot: 'bg-violet-400'  },
  red:     { text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     dot: 'bg-red-400'     },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' },
  gray:    { text: 'text-gray-500',    bg: 'bg-[#1a1a1a]',      border: 'border-[#2a2a2a]',      dot: 'bg-gray-500'    },
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    dot: 'bg-blue-400'    },
}

const RULE_FIELDS = [
  { value: 'totalOrders', label: 'Toplam Sipariş' },
  { value: 'totalSpent',  label: 'Toplam Harcama (₺)' },
  { value: 'daysSinceOrder', label: 'Son Siparişten Gün' },
  { value: 'score',       label: 'Müşteri Skoru' },
]

const RULE_OPERATORS = [
  { value: 'gt',  label: '>'  },
  { value: 'lt',  label: '<'  },
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
  { value: 'eq',  label: '='  },
]

const COLORS: Array<{ key: string; dot: string }> = [
  { key: 'violet',  dot: 'bg-violet-500'  },
  { key: 'blue',    dot: 'bg-blue-500'    },
  { key: 'emerald', dot: 'bg-emerald-500' },
  { key: 'amber',   dot: 'bg-amber-500'   },
  { key: 'red',     dot: 'bg-red-500'     },
]

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', color: 'violet', rules: [] as Rule[] })
  const [saving, setSaving] = useState(false)
  const [activeSegment, setActiveSegment] = useState<Segment | null>(null)

  useEffect(() => { fetchSegments() }, [])

  async function fetchSegments() {
    setLoading(true)
    const res = await fetch('/api/segments')
    if (res.ok) setSegments(await res.json())
    setLoading(false)
  }

  function addRule() {
    setForm(f => ({ ...f, rules: [...f.rules, { field: 'totalOrders', operator: 'gt', value: '0' }] }))
  }

  function removeRule(i: number) {
    setForm(f => ({ ...f, rules: f.rules.filter((_, idx) => idx !== i) }))
  }

  function updateRule(i: number, key: keyof Rule, value: string) {
    setForm(f => {
      const rules = [...f.rules]
      rules[i] = { ...rules[i], [key]: value }
      return { ...f, rules }
    })
  }

  async function createSegment() {
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch('/api/segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      await fetchSegments()
      setShowCreate(false)
      setForm({ name: '', description: '', color: 'violet', rules: [] })
    }
    setSaving(false)
  }

  async function deleteSegment(id: string) {
    if (!confirm('Bu segmenti silmek istediğinizden emin misiniz?')) return
    await fetch(`/api/segments/${id}`, { method: 'DELETE' })
    setActiveSegment(null)
    fetchSegments()
  }

  const builtinSegments = segments.filter(s => s.type === 'builtin')
  const customSegments  = segments.filter(s => s.type === 'custom')
  const total = segments.reduce((sum, s) => sum + s.count, 0)

  return (
    <AppShell>
      <Header title="Segmentler" subtitle="Müşteri segmentlerini yönet ve yeni segmentler oluştur" />

      <div className="p-6 space-y-6 flex-1">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Toplam Müşteri', value: total,            icon: Users,          color: 'blue',    bar: 'from-blue-500/40'    },
            { label: 'Segment Sayısı', value: segments.length,  icon: TrendingUp,     color: 'violet',  bar: 'from-violet-500/40'  },
            { label: 'Aktif Kampanya', value: '—',              icon: Mail,           color: 'emerald', bar: 'from-emerald-500/40' },
            { label: 'Otomasyon',      value: '—',              icon: MessageSquare,  color: 'amber',   bar: 'from-amber-500/40'   },
          ].map(stat => {
            const Icon = stat.icon
            const colors = COLOR_MAP[stat.color] ?? COLOR_MAP.blue
            return (
              <div key={stat.label} className="relative bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 overflow-hidden hover:border-[#2a2a2a] transition-all">
                <div className={cn('absolute top-0 left-0 right-0 h-px bg-gradient-to-r to-transparent', stat.bar)} />
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', colors.bg, colors.border)}>
                    <Icon className={cn('w-4 h-4', colors.text)} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">{stat.label}</p>
                    <p className="text-xl font-bold text-white tabular-nums">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Builtin Segments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400">Yerleşik Segmentler</h2>
            <span className="text-xs text-gray-700">Otomatik güncellenir</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {builtinSegments.map(seg => {
                const Icon = ICON_MAP[seg.icon] ?? Users
                const colors = COLOR_MAP[seg.color] ?? COLOR_MAP.blue
                return (
                  <button
                    key={seg.id}
                    onClick={() => setActiveSegment(seg)}
                    className="bg-[#111] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-2xl p-4 text-left transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border shrink-0', colors.bg, colors.border)}>
                        <Icon className={cn('w-4 h-4', colors.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-200 text-sm group-hover:text-white transition-colors">{seg.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5 truncate">{seg.description}</p>
                        <p className="text-xl font-bold text-white mt-1 tabular-nums">{seg.count} <span className="text-xs font-normal text-gray-600">müşteri</span></p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Custom Segments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400">Özel Segmentler</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Yeni Segment
            </button>
          </div>

          {customSegments.length === 0 ? (
            <div className="bg-[#111] border-2 border-dashed border-[#1e1e1e] hover:border-blue-500/20 rounded-2xl p-8 text-center transition-all">
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm font-medium text-gray-400">Henüz özel segment yok</p>
              <p className="text-xs text-gray-700 mt-1">Kural tabanlı özel segmentler oluşturabilirsiniz</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                İlk segmentini oluştur →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {customSegments.map(seg => {
                const colors = COLOR_MAP[seg.color] ?? COLOR_MAP.blue
                return (
                  <button
                    key={seg.id}
                    onClick={() => setActiveSegment(seg)}
                    className="bg-[#111] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-2xl p-4 text-left transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border shrink-0', colors.bg, colors.border)}>
                        <Users className={cn('w-4 h-4', colors.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-200 text-sm group-hover:text-white transition-colors">{seg.name}</p>
                        {seg.description && <p className="text-xs text-gray-600 mt-0.5 truncate">{seg.description}</p>}
                        <p className="text-xl font-bold text-white mt-1 tabular-nums">{seg.count} <span className="text-xs font-normal text-gray-600">müşteri</span></p>
                        <p className="text-[10px] text-gray-700 mt-1">{seg.rules.length} kural</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Segment Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e]">
              <h3 className="font-semibold text-white">Yeni Segment Oluştur</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-600 hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wider">Segment Adı</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Örn: Yüksek Değerli Alıcılar"
                  className="w-full border border-[#2a2a2a] bg-[#0d0d0d] text-white rounded-xl px-3 py-2.5 text-sm placeholder:text-gray-700 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wider">Açıklama (opsiyonel)</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Segment açıklaması"
                  className="w-full border border-[#2a2a2a] bg-[#0d0d0d] text-white rounded-xl px-3 py-2.5 text-sm placeholder:text-gray-700 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block uppercase tracking-wider">Renk</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c.key}
                      onClick={() => setForm(f => ({ ...f, color: c.key }))}
                      className={cn(
                        'w-7 h-7 rounded-lg transition-all',
                        c.dot,
                        form.color === c.key ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-[#111] scale-110' : 'opacity-60 hover:opacity-100',
                      )}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Kurallar</label>
                  <button onClick={addRule} className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
                    <Plus className="w-3 h-3" /> Kural Ekle
                  </button>
                </div>

                {form.rules.length === 0 && (
                  <p className="text-xs text-gray-600 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-3 py-3 text-center">
                    Kural eklemezseniz tüm müşteriler dahil edilir
                  </p>
                )}

                <div className="space-y-2">
                  {form.rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-3 py-2">
                      <select
                        value={rule.field}
                        onChange={e => updateRule(i, 'field', e.target.value)}
                        className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500/50 flex-1"
                      >
                        {RULE_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                      <select
                        value={rule.operator}
                        onChange={e => updateRule(i, 'operator', e.target.value)}
                        className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500/50 w-14"
                      >
                        {RULE_OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <input
                        value={rule.value}
                        onChange={e => updateRule(i, 'value', e.target.value)}
                        className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500/50 w-20"
                      />
                      <button onClick={() => removeRule(i)} className="text-gray-700 hover:text-red-400 transition-colors p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 border border-[#2a2a2a] text-gray-500 hover:text-gray-300 rounded-xl py-2.5 text-sm hover:bg-[#1a1a1a] transition-all"
              >
                İptal
              </button>
              <button
                onClick={createSegment}
                disabled={!form.name.trim() || saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segment Detail Panel */}
      {activeSegment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e]">
              <div className="flex items-center gap-3">
                {(() => {
                  const colors = COLOR_MAP[activeSegment.color] ?? COLOR_MAP.blue
                  const Icon = ICON_MAP[activeSegment.icon] ?? Users
                  return (
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center border', colors.bg, colors.border)}>
                      <Icon className={cn('w-4 h-4', colors.text)} />
                    </div>
                  )
                })()}
                <h3 className="font-semibold text-white">{activeSegment.name}</h3>
              </div>
              <button onClick={() => setActiveSegment(null)} className="text-gray-600 hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-3">
                  <p className="text-xs text-gray-600">Müşteri Sayısı</p>
                  <p className="text-2xl font-bold text-white tabular-nums">{activeSegment.count}</p>
                </div>
                <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-3">
                  <p className="text-xs text-gray-600">Tip</p>
                  <p className="text-sm font-semibold text-gray-300 mt-1">
                    {activeSegment.type === 'builtin' ? 'Yerleşik' : 'Özel'}
                  </p>
                </div>
              </div>

              {activeSegment.description && (
                <p className="text-sm text-gray-500">{activeSegment.description}</p>
              )}

              {activeSegment.rules.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wider">Kurallar</p>
                  <div className="space-y-1.5">
                    {activeSegment.rules.map((rule, i) => {
                      const fieldLabel = RULE_FIELDS.find(f => f.value === rule.field)?.label ?? rule.field
                      const opLabel    = RULE_OPERATORS.find(o => o.value === rule.operator)?.label ?? rule.operator
                      return (
                        <div key={i} className="text-xs bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-3 py-2 text-gray-400">
                          {fieldLabel} {opLabel} {rule.value}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <a
                  href={`/campaigns/new?segment=${activeSegment.name}`}
                  className="flex-1 text-center text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 font-semibold transition-colors"
                >
                  Kampanya Oluştur
                </a>
                {activeSegment.type === 'custom' && (
                  <button
                    onClick={() => deleteSegment(activeSegment.id)}
                    className="px-4 text-sm border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl py-2.5 transition-all"
                  >
                    Sil
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
