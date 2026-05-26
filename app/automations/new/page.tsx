'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ShoppingCart, UserPlus, Gift, Clock,
  Package, Mail, MessageSquare, Zap, Plus, Trash2,
  Check, Loader2, Sparkles, ChevronDown, ArrowDown,
  Play, Settings2, Crown, Flame, Target, ChevronRight,
  TrendingUp, LayoutTemplate, BookmarkPlus,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { cn } from '@/lib/utils'

const triggers = [
  { key: 'cart_abandon',   label: 'Sepet Terk',        icon: ShoppingCart, desc: 'Müşteri sepeti terk ettiğinde',  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30',    glow: 'shadow-blue-500/20',    gradient: 'from-blue-600 to-cyan-600' },
  { key: 'new_signup',     label: 'Yeni Kayıt',         icon: UserPlus,     desc: 'Yeni müşteri kaydolduğunda',     color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30', glow: 'shadow-violet-500/20', gradient: 'from-violet-600 to-purple-600' },
  { key: 'birthday',       label: 'Doğum Günü',         icon: Gift,         desc: 'Müşteri doğum günü geldiğinde', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',   glow: 'shadow-amber-500/20',  gradient: 'from-amber-500 to-orange-500' },
  { key: 'no_purchase',    label: 'Satın Alma Yok',     icon: Clock,        desc: 'Belirtilen süre alışveriş yok', color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30',       glow: 'shadow-red-500/20',    gradient: 'from-rose-600 to-pink-600' },
  { key: 'order_complete', label: 'Sipariş Tamamlandı', icon: Package,      desc: 'Sipariş teslim edildiğinde',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', glow: 'shadow-emerald-500/20', gradient: 'from-emerald-600 to-teal-600' },
]

const channelOptions = [
  { key: 'email',    label: 'Email',    icon: Mail,          color: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/30',  activeCls: 'border-blue-500/50 bg-blue-500/10 text-blue-400' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-teal-400',  bg: 'bg-teal-500/10 border-teal-500/30',  activeCls: 'border-teal-500/50 bg-teal-500/10 text-teal-400' },
]

const delayUnits = [
  { value: 'dakika', label: 'Dakika' },
  { value: 'saat',   label: 'Saat' },
  { value: 'gün',    label: 'Gün' },
  { value: 'hafta',  label: 'Hafta' },
]

const segments = [
  { value: 'all',      label: 'Tüm Müşteriler' },
  { value: 'vip',      label: 'VIP Müşteriler' },
  { value: 'loyal',    label: 'Sadık Müşteriler' },
  { value: 'at_risk',  label: 'Risk Altındaki' },
  { value: 'new',      label: 'Yeni Müşteriler' },
  { value: 'inactive', label: 'Pasif Müşteriler' },
]

interface SavedTemplate {
  id: string
  name: string
  category: string
}

interface FlowStep {
  id: string
  channel: string
  immediate: boolean
  delayAmount: string
  delayUnit: string
  message: string
  templateId?: string
}

function defaultStep(): FlowStep {
  return {
    id: Math.random().toString(36).slice(2),
    channel: 'email',
    immediate: false,
    delayAmount: '1',
    delayUnit: 'saat',
    message: '',
  }
}

function TriggerNode({ trigger }: { trigger: typeof triggers[0] }) {
  const Icon = trigger.icon
  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        'relative w-full max-w-sm rounded-2xl border-2 p-5 text-center overflow-hidden',
        trigger.bg
      )}>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="flex items-center gap-3 mb-2">
          <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0', trigger.gradient)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">TETIKLEYICI</p>
            <p className={cn('text-sm font-bold', trigger.color)}>{trigger.label}</p>
          </div>
          <div className="ml-auto flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400">Aktif</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">{trigger.desc}</p>
      </div>
    </div>
  )
}

function DelayConnector({ step }: { step: FlowStep }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="w-px h-4 bg-white/[0.06]" />
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-semibold text-gray-500">
        <Clock className="w-3 h-3 text-amber-400" />
        {step.immediate ? 'Hemen' : `${step.delayAmount} ${step.delayUnit} sonra`}
      </div>
      <ArrowDown className="w-4 h-4 text-gray-700 my-0.5" />
    </div>
  )
}

function ActionNode({ step, index, onUpdate, onRemove, isOnly, savedTemplates }: {
  step: FlowStep
  index: number
  onUpdate: (patch: Partial<FlowStep>) => void
  onRemove: () => void
  isOnly: boolean
  savedTemplates: SavedTemplate[]
}) {
  const ch = channelOptions.find(c => c.key === step.channel) || channelOptions[0]

  const selectedTpl = savedTemplates.find(t => t.id === step.templateId)

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d12] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className={cn('w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold shadow-sm',
              ch.key === 'email' ? 'from-blue-600 to-blue-500' : 'from-teal-600 to-teal-500')}>
              {index + 1}
            </div>
            <span className="text-xs font-bold text-gray-300">Adım {index + 1}</span>
          </div>
          {!isOnly && (
            <button onClick={onRemove} className="p-1 text-gray-700 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Channel */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Kanal</label>
            <div className="grid grid-cols-2 gap-2">
              {channelOptions.map(c => {
                const CIcon = c.icon
                return (
                  <button key={c.key} onClick={() => onUpdate({ channel: c.key })}
                    className={cn('flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-bold transition-all',
                      step.channel === c.key ? c.activeCls : 'border-white/[0.06] text-gray-600 hover:border-white/10 hover:text-gray-400 bg-white/[0.02]')}>
                    <CIcon className="w-3.5 h-3.5" />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Template selector (email only) */}
          {step.channel === 'email' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <LayoutTemplate className="w-3 h-3" />
                Şablon Seç
              </label>
              {savedTemplates.length > 0 ? (
                <div className="relative">
                  <select
                    value={step.templateId || ''}
                    onChange={e => onUpdate({ templateId: e.target.value || undefined })}
                    className="w-full appearance-none px-3 py-2 text-xs border border-white/[0.06] rounded-xl bg-white/[0.02] text-gray-300 focus:outline-none focus:border-blue-500/40 pr-7"
                  >
                    <option value="">Şablon seçin...</option>
                    {savedTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-white/[0.06] text-[10px] text-gray-700">
                  <BookmarkPlus className="w-3 h-3" />
                  Henüz kaydedilmiş şablon yok. Kampanya editöründen şablon kaydedin.
                </div>
              )}
              {selectedTpl && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <LayoutTemplate className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="text-[10px] font-semibold text-blue-400 truncate">{selectedTpl.name}</span>
                  <button onClick={() => onUpdate({ templateId: undefined })} className="ml-auto text-gray-600 hover:text-gray-400">
                    <span className="text-[10px]">✕</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Timing */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Zamanlama</label>
            <div className="flex gap-2">
              <button onClick={() => onUpdate({ immediate: true })}
                className={cn('flex-1 py-2 rounded-xl text-xs font-bold border transition-all',
                  step.immediate ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20' : 'bg-white/[0.02] text-gray-600 border-white/[0.06] hover:border-white/10 hover:text-gray-400')}>
                Hemen
              </button>
              <button onClick={() => onUpdate({ immediate: false })}
                className={cn('flex-1 py-2 rounded-xl text-xs font-bold border transition-all',
                  !step.immediate ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20' : 'bg-white/[0.02] text-gray-600 border-white/[0.06] hover:border-white/10 hover:text-gray-400')}>
                Gecikmeli
              </button>
            </div>

            {!step.immediate && (
              <div className="flex items-center gap-2 mt-2">
                <input type="number" min="1" max="999" value={step.delayAmount}
                  onChange={e => onUpdate({ delayAmount: e.target.value })}
                  className="w-16 px-3 py-2 text-sm border border-white/[0.06] rounded-xl bg-white/[0.03] text-white focus:outline-none focus:border-blue-500/40 text-center font-bold" />
                <div className="relative flex-1">
                  <select value={step.delayUnit} onChange={e => onUpdate({ delayUnit: e.target.value })}
                    className="w-full appearance-none px-3 py-2 text-xs border border-white/[0.06] rounded-xl bg-white/[0.03] text-gray-300 focus:outline-none focus:border-blue-500/40 pr-7">
                    {delayUnits.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 pointer-events-none" />
                </div>
                <span className="text-xs text-gray-600 whitespace-nowrap font-medium">sonra</span>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
              {step.channel === 'email' ? 'Konu Satırı' : 'Mesaj'}
            </label>
            <textarea value={step.message} onChange={e => onUpdate({ message: e.target.value })}
              placeholder={step.channel === 'email' ? 'Email konu satırı...' : 'WhatsApp mesajı...'}
              rows={2}
              className="w-full px-3 py-2.5 text-xs border border-white/[0.06] rounded-xl bg-white/[0.02] text-gray-300 placeholder:text-gray-700 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 resize-none transition-all" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AutomationNewPage() {
  const router = useRouter()
  const [stage,     setStage]     = useState<'trigger' | 'flow' | 'settings' | 'done'>('trigger')
  const [trigger,   setTrigger]   = useState('')
  const [steps,     setSteps]     = useState<FlowStep[]>([defaultStep()])
  const [name,      setName]      = useState('')
  const [segment,   setSegment]   = useState('all')
  const [saving,    setSaving]    = useState(false)
  const [savedTpls, setSavedTpls] = useState<SavedTemplate[]>([])

  const selectedTrigger = triggers.find(t => t.key === trigger)

  useEffect(() => {
    fetch('/api/templates')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSavedTpls(data.map((t: { id: string; name: string; category?: string }) => ({ id: t.id, name: t.name, category: t.category || 'custom' }))) })
      .catch(() => {})
  }, [])

  function addStep() { setSteps(prev => [...prev, defaultStep()]) }
  function removeStep(id: string) { setSteps(prev => prev.filter(s => s.id !== id)) }
  function updateStep(id: string, patch: Partial<FlowStep>) {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || `${selectedTrigger?.label ?? ''} Otomasyonu`,
          trigger, status: 'active', segment,
          steps: steps.map(s => ({ id: s.id, channel: s.channel, immediate: s.immediate, delayAmount: s.delayAmount, delayUnit: s.delayUnit, message: s.message, templateId: s.templateId })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      setStage('done')
    } catch (e) {
      alert(`Hata: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`)
    } finally {
      setSaving(false)
    }
  }

  if (stage === 'done') {
    return (
      <div className="min-h-screen bg-[#060609] flex items-center justify-center p-6">
        <div className="text-center max-w-sm space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-emerald-400" strokeWidth={1.5} />
            </div>
            <div className="absolute inset-0 rounded-3xl bg-emerald-500/5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Otomasyon Aktif!</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              <span className="font-semibold text-gray-300">{name || selectedTrigger?.label}</span> otomasyonu başarıyla oluşturuldu ve şu an çalışıyor.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => router.push('/automations')}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20">
              Otomasyonlara Git
            </button>
            <button onClick={() => { setStage('trigger'); setTrigger(''); setSteps([defaultStep()]); setName('') }}
              className="w-full bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] text-gray-400 hover:text-gray-200 font-semibold py-3 rounded-xl transition-all">
              Yeni Otomasyon Oluştur
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060609] flex flex-col">
      {/* Top bar */}
      <div className="h-14 bg-[#080810]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-6 gap-4 sticky top-0 z-20">
        <Link href="/automations" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-px h-4 bg-white/[0.08]" />
        <div className="flex items-center gap-2 flex-1">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">Automation Builder</span>
        </div>

        {/* Stage indicator */}
        <div className="flex items-center gap-2">
          {(['trigger', 'flow', 'settings'] as const).map((s, i) => {
            const labels = ['Tetikleyici', 'Akış', 'Ayarlar']
            const done = ['trigger', 'flow', 'settings'].indexOf(stage) > i
            const active = s === stage
            return (
              <div key={s} className="flex items-center gap-1.5">
                <div className={cn(
                  'flex items-center gap-1.5 text-xs font-semibold transition-all',
                  active ? 'text-blue-400' : done ? 'text-emerald-400' : 'text-gray-700'
                )}>
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                    active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : done ? 'bg-emerald-500 text-white' : 'bg-white/[0.06] text-gray-600'
                  )}>
                    {done ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="hidden sm:block">{labels[i]}</span>
                </div>
                {i < 2 && <div className={cn('w-8 h-px', done ? 'bg-emerald-500/40' : 'bg-white/[0.06]')} />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* STAGE: Trigger */}
        {stage === 'trigger' && (
          <div className="flex-1 flex items-start justify-center p-8">
            <div className="w-full max-w-2xl space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Tetikleyici seçin</h2>
                <p className="text-sm text-gray-500 mt-2">Otomasyon hangi olayda başlasın?</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {triggers.map(t => {
                  const Icon = t.icon
                  const sel = trigger === t.key
                  return (
                    <button key={t.key} onClick={() => setTrigger(t.key)}
                      className={cn(
                        'relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left overflow-hidden group',
                        sel ? cn('border-2', t.bg) : 'border-white/[0.06] bg-[#0d0d12] hover:border-white/10'
                      )}>
                      {sel && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />}
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 shadow-lg transition-all',
                        sel ? cn('bg-gradient-to-br', t.gradient, t.glow, 'border-transparent') : 'bg-white/[0.03] border-white/[0.06]')}>
                        <Icon className={cn('w-5 h-5 transition-colors', sel ? 'text-white' : 'text-gray-600')} />
                      </div>
                      <div className="flex-1">
                        <p className={cn('text-sm font-bold transition-colors', sel ? t.color : 'text-gray-300')}>{t.label}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{t.desc}</p>
                      </div>
                      {sel && <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>}
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-end">
                <button disabled={!trigger} onClick={() => setStage('flow')}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20">
                  Akışı Tasarla <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE: Flow — Visual Builder */}
        {stage === 'flow' && (
          <div className="flex-1 flex">
            {/* Flow canvas */}
            <div className="flex-1 bg-[#0a0a0f] overflow-y-auto">
              <div className="flex flex-col items-center py-8 px-4 space-y-0 min-h-full">
                <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-4">OTOMASYON AKIŞI</p>

                {/* Trigger node */}
                {selectedTrigger && <TriggerNode trigger={selectedTrigger} />}

                {/* Steps */}
                {steps.map((step, i) => (
                  <div key={step.id} className="flex flex-col items-center w-full max-w-sm">
                    <DelayConnector step={step} />
                    <ActionNode
                      step={step}
                      index={i}
                      onUpdate={patch => updateStep(step.id, patch)}
                      onRemove={() => removeStep(step.id)}
                      isOnly={steps.length === 1}
                      savedTemplates={savedTpls}
                    />
                  </div>
                ))}

                {/* Add step */}
                <div className="flex flex-col items-center mt-2">
                  <div className="w-px h-4 bg-white/[0.06]" />
                  <button onClick={addStep}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-blue-500/40 hover:bg-blue-500/5 text-gray-600 hover:text-blue-400 text-xs font-bold transition-all">
                    <Plus className="w-3.5 h-3.5" /> Adım Ekle
                  </button>
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div className="w-72 border-l border-white/[0.06] bg-[#080810] flex flex-col p-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-white mb-1">Akış Özeti</p>
                <p className="text-[10px] text-gray-600">Oluşturduğunuz otomasyon akışı</p>
              </div>

              {selectedTrigger && (
                <div className={cn('p-3 rounded-xl border', selectedTrigger.bg)}>
                  <div className="flex items-center gap-2">
                    <selectedTrigger.icon className={cn('w-4 h-4 shrink-0', selectedTrigger.color)} />
                    <div>
                      <p className="text-[10px] text-gray-600">Tetikleyici</p>
                      <p className={cn('text-xs font-bold', selectedTrigger.color)}>{selectedTrigger.label}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {steps.map((step, i) => {
                  const ch = channelOptions.find(c => c.key === step.channel) || channelOptions[0]
                  const CIcon = ch.icon
                  return (
                    <div key={step.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                      <div className={cn('w-6 h-6 rounded-md bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold shrink-0',
                        ch.key === 'email' ? 'from-blue-600 to-blue-500' : 'from-teal-600 to-teal-500')}>
                        {i + 1}
                      </div>
                      <CIcon className={cn('w-3.5 h-3.5', ch.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-gray-400">{ch.label}</p>
                        <p className="text-[10px] text-gray-600">{step.immediate ? 'Hemen' : `${step.delayAmount} ${step.delayUnit} sonra`}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-auto pt-4 border-t border-white/[0.04] space-y-2">
                <button onClick={() => setStage('trigger')} className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors font-semibold">
                  ← Tetikleyiciyi Değiştir
                </button>
                <button onClick={() => setStage('settings')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-blue-500/20">
                  Ayarlara Geç <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE: Settings */}
        {stage === 'settings' && (
          <div className="flex-1 flex items-start justify-center p-8">
            <div className="w-full max-w-xl space-y-5">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Son Ayarlar</h2>
                <p className="text-sm text-gray-500 mt-2">İsim ve hedef kitle</p>
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-[#0d0d12] p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Otomasyon İsmi</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder={(selectedTrigger?.label ?? '') + ' Otomasyonu'}
                    className="w-full px-4 py-3 text-sm border border-white/[0.06] rounded-xl bg-white/[0.03] text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hedef Segment</label>
                  <div className="relative">
                    <select value={segment} onChange={e => setSegment(e.target.value)}
                      className="w-full appearance-none px-4 py-3 text-sm border border-white/[0.06] rounded-xl bg-white/[0.03] text-gray-300 focus:outline-none focus:border-blue-500/40 pr-10">
                      {segments.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-3">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Özet</p>
                  {[
                    { label: 'Tetikleyici', value: selectedTrigger?.label ?? '-' },
                    { label: 'Adım sayısı', value: `${steps.length} mesaj adımı` },
                    { label: 'Kanallar', value: [...new Set(steps.map(s => s.channel))].map(c => c === 'email' ? 'Email' : 'WhatsApp').join(', ') },
                    { label: 'Hedef', value: segments.find(s => s.value === segment)?.label || segment },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-medium">{row.label}</span>
                      <span className="font-semibold text-gray-300 text-right max-w-[200px] truncate">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setStage('flow')}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-200 border border-white/[0.06] hover:border-white/10 rounded-xl transition-all">
                  <ArrowLeft className="w-4 h-4" /> Geri
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Kaydediliyor...</> : <><Play className="w-4 h-4" />Otomasyonu Başlat</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CheckCircle({ className, strokeWidth }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth || 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
