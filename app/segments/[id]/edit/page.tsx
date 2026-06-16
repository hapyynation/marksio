'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  X, Plus, Check, Loader2, AlertCircle, ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Rule {
  field: string
  operator: string
  value: string
}

const RULE_FIELDS = [
  { value: 'totalSpent',     label: 'Toplam Harcama (₺)',     type: 'number', placeholder: '5000' },
  { value: 'totalOrders',    label: 'Sipariş Sayısı',          type: 'number', placeholder: '5' },
  { value: 'daysSinceOrder', label: 'Son Sipariş (gün önce)', type: 'number', placeholder: '30' },
  { value: 'avgOrder',       label: 'Ortalama Sepet (₺)',      type: 'number', placeholder: '500' },
  { value: 'score',          label: 'Müşteri Skoru',           type: 'number', placeholder: '60' },
  { value: 'tags',           label: 'Etiket',                  type: 'text',   placeholder: 'vip' },
  { value: 'source',         label: 'Kaynak',                  type: 'text',   placeholder: 'shopify' },
  { value: 'segment',        label: 'Mevcut Segment',          type: 'text',   placeholder: 'new' },
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
  { value: 'eq',           label: '= eşit' },
  { value: 'contains',     label: 'içeriyor' },
  { value: 'not_contains', label: 'içermiyor' },
  { value: 'neq',          label: '≠ eşit değil' },
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
function resolveIcon(icon: string): string { return LUCIDE_TO_EMOJI[icon] ?? icon }

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
      <select value={rule.field} onChange={e => onUpdate(index, 'field', e.target.value)}
        className="flex-1 min-w-0 px-2 py-1.5 rounded-lg text-[11px] outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }}>
        {RULE_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      <select value={rule.operator} onChange={e => onUpdate(index, 'operator', e.target.value)}
        className="w-28 px-2 py-1.5 rounded-lg text-[10px] outline-none shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }}>
        {ops.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
      </select>
      <input value={rule.value} onChange={e => onUpdate(index, 'value', e.target.value)}
        placeholder={fieldDef?.placeholder ?? ''}
        className="w-20 px-2 py-1.5 rounded-lg text-[11px] outline-none text-center shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }} />
      <button onClick={() => onRemove(index)} className="p-1 rounded-lg shrink-0 transition-colors"
        style={{ color: '#44445a' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#e84545')}
        onMouseLeave={e => (e.currentTarget.style.color = '#44445a')}>
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

export default function SegmentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [isBuiltin, setIsBuiltin] = useState(false)

  const [form, setForm] = useState({
    name: '', description: '', matchType: 'all' as 'all' | 'any',
    color: '#4470ff', icon: '👥', rules: [] as Rule[],
  })

  useEffect(() => {
    fetch(`/api/segments/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: { name?: string; description?: string; matchType?: string; color?: string; icon?: string; rules?: Rule[]; type?: string }) => {
        setIsBuiltin(d.type === 'builtin')
        setForm({
          name: d.name ?? '',
          description: d.description ?? '',
          matchType: (d.matchType ?? 'all') as 'all' | 'any',
          color: d.color ?? '#4470ff',
          icon: resolveIcon(d.icon ?? '👥'),
          rules: Array.isArray(d.rules) ? d.rules.map(r => ({ ...r, value: String(r.value) })) : [],
        })
      })
      .catch(() => setError('Segment yüklenemedi'))
      .finally(() => setLoading(false))
  }, [id])

  // Debounced preview
  const fetchPreview = useCallback(async (rules: Rule[], matchType: string) => {
    if (!rules.length) { setPreviewCount(null); return }
    setPreviewing(true)
    try {
      const res = await fetch('/api/segments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules, matchType }),
      })
      if (res.ok) { const d = await res.json() as { count: number }; setPreviewCount(d.count) }
    } catch { /* silent */ }
    setPreviewing(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchPreview(form.rules, form.matchType), 500)
    return () => clearTimeout(timer)
  }, [form.rules, form.matchType, fetchPreview])

  async function handleSave() {
    if (!form.name.trim()) { setSaveError('Segment adı gerekli'); return }
    if (form.rules.length === 0) { setSaveError('En az 1 koşul ekleyin'); return }
    setSaving(true); setSaveError('')
    try {
      const res = await fetch(`/api/segments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setSaveError(d.error ?? 'Kaydedilemedi')
        return
      }
      router.push('/segments')
    } catch { setSaveError('Bağlantı hatası') }
    setSaving(false)
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
      if (key === 'field') {
        const fieldDef = RULE_FIELDS.find(fd => fd.value === value)
        rules[i].operator = fieldDef?.type === 'text' ? 'contains' : 'gte'
      }
      return { ...f, rules }
    })
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#4470ff' }} />
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <div className="p-6">
          <div className="flex items-center gap-2 p-4 rounded-xl" style={{ background: 'rgba(232,69,69,0.08)', border: '1px solid rgba(232,69,69,0.2)' }}>
            <AlertCircle className="w-4 h-4" style={{ color: '#e84545' }} />
            <p className="text-sm" style={{ color: '#e84545' }}>{error}</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 h-14 shrink-0 gap-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,15,0.95)', backdropFilter: 'blur(24px)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/segments')}
            className="p-1.5 rounded-lg transition-all" style={{ color: '#8080a0' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[15px] font-bold" style={{ color: '#eeeef4' }}>Segment Düzenle</h1>
            <p className="text-[11px] hidden sm:block" style={{ color: '#44445a' }}>Segment kurallarını ve görünümünü güncelle</p>
          </div>
        </div>
        {isBuiltin && (
          <span className="text-[11px] px-2 py-1 rounded-lg font-semibold"
            style={{ background: 'rgba(68,112,255,0.1)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.2)' }}>
            Varsayılan Segment
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-xl mx-auto space-y-4">

          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#8080a0' }}>Segment Adı *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Örn: Sadık Müşteriler"
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#4470ff66')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#8080a0' }}>Açıklama</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Bu segment nedir?"
              className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#4470ff66')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')} />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#8080a0' }}>İkon</label>
            <div className="grid grid-cols-8 gap-1">
              {ICON_OPTIONS.map(ic => (
                <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[15px] transition-all"
                  style={{ background: form.icon === ic ? '#4470ff22' : 'rgba(255,255,255,0.04)', border: form.icon === ic ? '1px solid #4470ff66' : '1px solid transparent' }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#8080a0' }}>Renk</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{ background: c, boxShadow: form.color === c ? `0 0 0 2px rgba(0,0,0,0.8), 0 0 0 4px ${c}` : 'none' }} />
              ))}
            </div>
          </div>

          {/* Rules */}
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold" style={{ color: '#8080a0' }}>KOŞULLAR *</p>
              <div className="flex items-center p-0.5 rounded-lg"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {(['all', 'any'] as const).map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, matchType: t }))}
                    className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all"
                    style={form.matchType === t ? { background: 'rgba(255,255,255,0.08)', color: '#eeeef4' } : { color: '#44445a' }}>
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl w-full text-[11px] font-semibold transition-all"
              style={{ background: 'rgba(68,112,255,0.06)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.15)' }}>
              <Plus className="w-3.5 h-3.5" /> Koşul Ekle
            </button>
          </div>

          {/* Preview */}
          <div className="rounded-xl p-4 flex items-center gap-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0"
              style={{ background: `${form.color}15`, border: `1px solid ${form.color}25` }}>
              {resolveIcon(form.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>{form.name || 'Segment Adı'}</p>
              <p className="text-[11px]" style={{ color: '#44445a' }}>{form.rules.length} koşul · {form.matchType === 'all' ? 'tümü' : 'herhangi biri'}</p>
            </div>
            <div className="text-right shrink-0">
              {previewing ? (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#4470ff' }} />
              ) : previewCount !== null ? (
                <div>
                  <p className="text-[18px] font-bold" style={{ color: form.color }}>{previewCount}</p>
                  <p className="text-[10px]" style={{ color: '#44445a' }}>müşteri</p>
                </div>
              ) : (
                <p className="text-[11px]" style={{ color: '#44445a' }}>koşul ekleyin</p>
              )}
            </div>
          </div>

          {saveError && (
            <div className="flex items-center gap-2 p-3 rounded-xl"
              style={{ background: 'rgba(232,69,69,0.08)', border: '1px solid rgba(232,69,69,0.2)' }}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#e84545' }} />
              <p className="text-[11px]" style={{ color: '#e84545' }}>{saveError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={() => router.push('/segments')}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
              İptal
            </button>
            <button onClick={handleSave} disabled={saving || isBuiltin}
              className={cn('flex-1 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50')}
              style={{ background: '#4470ff', color: '#fff' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Kaydediliyor…' : 'Güncelle'}
            </button>
          </div>

          {isBuiltin && (
            <p className="text-center text-[11px]" style={{ color: '#44445a' }}>
              Varsayılan segmentler düzenlenemez.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  )
}
