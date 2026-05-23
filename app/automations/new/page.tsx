'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, ShoppingCart, UserPlus, Gift, Clock,
  Package, Mail, MessageSquare, Zap, Plus, Trash2,
  Check, ChevronDown, Loader2,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'

const triggers = [
  { key: 'cart_abandon',   label: 'Sepet Terk',        icon: ShoppingCart, desc: 'Müşteri sepeti terk ettiğinde tetiklenir',    color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30'    },
  { key: 'new_signup',     label: 'Yeni Kayıt',         icon: UserPlus,     desc: 'Yeni müşteri kaydolduğunda tetiklenir',       color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/30' },
  { key: 'birthday',       label: 'Doğum Günü',         icon: Gift,         desc: 'Müşteri doğum günü geldiğinde tetiklenir',    color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30'   },
  { key: 'no_purchase',    label: 'Satın Alma Yok',     icon: Clock,        desc: 'Belirtilen süre içinde alışveriş yapılmadı',  color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/30'       },
  { key: 'order_complete', label: 'Sipariş Tamamlandı', icon: Package,      desc: 'Sipariş teslim edildiğinde tetiklenir',       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
]

const channels: Array<{ key: string; label: string; icon: React.ElementType; color: string; activeBg: string }> = [
  { key: 'email',    label: 'Email',    icon: Mail,          color: 'text-blue-400',  activeBg: 'border-blue-500/40 bg-blue-500/10 text-blue-400'   },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-teal-400',  activeBg: 'border-teal-500/40 bg-teal-500/10 text-teal-400'   },
]

const delayUnits = [
  { value: 'dakika', label: 'Dakika' },
  { value: 'saat',   label: 'Saat'   },
  { value: 'gün',    label: 'Gün'    },
  { value: 'hafta',  label: 'Hafta'  },
]

interface Step {
  id: string
  channel: string
  immediate: boolean
  delayAmount: string
  delayUnit: string
  message: string
}

function stepDelayLabel(step: Step): string {
  if (step.immediate) return 'Hemen'
  return `${step.delayAmount || '1'} ${step.delayUnit} sonra`
}

const defaultStep = (): Step => ({
  id: Math.random().toString(36).slice(2),
  channel: 'email',
  immediate: true,
  delayAmount: '1',
  delayUnit: 'saat',
  message: '',
})

export default function AutomationNewPage() {
  const router = useRouter()
  const [stage, setStage] = useState<'trigger' | 'steps' | 'settings' | 'done'>('trigger')
  const [trigger, setTrigger] = useState('')
  const [steps, setSteps] = useState<Step[]>([defaultStep()])
  const [name, setName] = useState('')
  const [segment, setSegment] = useState('all')
  const [saving, setSaving] = useState(false)

  const selectedTrigger = triggers.find((t) => t.key === trigger)

  function addStep() {
    setSteps((prev) => [...prev, defaultStep()])
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id))
  }

  function updateStep(id: string, patch: Partial<Omit<Step, 'id'>>) {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, ...patch } : s))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || `${selectedTrigger?.label ?? ''} Otomasyonu`,
          trigger,
          status: 'active',
          segment,
          steps: steps.map(s => ({
            id: s.id,
            channel: s.channel,
            immediate: s.immediate,
            delayAmount: s.delayAmount,
            delayUnit: s.delayUnit,
            message: s.message,
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      setStage('done')
    } catch (e) {
      alert(`Otomasyon kaydedilemedi: ${e instanceof Error ? e.message : 'Bilinmeyen hata'}`)
    } finally {
      setSaving(false)
    }
  }

  if (stage === 'done') {
    return (
      <AppShell>
        <Header title="Otomasyon Oluştur" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Check className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Otomasyon Aktif!</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              <span className="font-semibold text-gray-300">{name || selectedTrigger?.label}</span> otomasyonu başarıyla oluşturuldu ve şimdi çalışıyor.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/automations')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Otomasyonlara Git
              </button>
              <button
                onClick={() => { setStage('trigger'); setTrigger(''); setSteps([defaultStep()]); setName('') }}
                className="w-full bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-gray-400 hover:text-gray-200 font-medium py-3 rounded-xl transition-all"
              >
                Yeni Otomasyon Oluştur
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <Header title="Yeni Otomasyon" subtitle="Otomatik mesaj akışı oluşturun" />

      <div className="flex-1 p-4 lg:p-6 max-w-3xl space-y-6">
        <Link href="/automations" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Otomasyonlara Dön
        </Link>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {(['trigger', 'steps', 'settings'] as const).map((s, i) => {
            const labels = ['Tetikleyici', 'Mesaj Adımları', 'Ayarlar']
            const active = s === stage
            const done = ['trigger', 'steps', 'settings'].indexOf(stage) > i
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'flex items-center gap-2 text-sm font-medium',
                  active ? 'text-blue-400' : done ? 'text-emerald-400' : 'text-gray-700'
                )}>
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                    active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : done ? 'bg-emerald-500 text-white' : 'bg-[#1e1e1e] border border-[#2a2a2a] text-gray-600'
                  )}>
                    {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className="hidden sm:block text-xs">{labels[i]}</span>
                </div>
                {i < 2 && <div className={cn('flex-1 h-px', done ? 'bg-emerald-500/40' : 'bg-[#1e1e1e]')} />}
              </div>
            )
          })}
        </div>

        {/* Stage: Trigger */}
        {stage === 'trigger' && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Tetikleyici Seçin</h2>
              <p className="text-sm text-gray-600 mt-1">Otomasyon hangi durumda başlasın?</p>
            </div>
            <div className="space-y-2">
              {triggers.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTrigger(t.key)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                    trigger === t.key
                      ? cn('border-2', t.bg)
                      : 'border-[#1e1e1e] hover:border-[#2a2a2a] bg-[#0d0d0d]'
                  )}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center border shrink-0',
                    trigger === t.key ? t.bg : 'bg-[#1a1a1a] border-[#2a2a2a]'
                  )}>
                    <t.icon className={cn('w-5 h-5', trigger === t.key ? t.color : 'text-gray-600')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold', trigger === t.key ? t.color : 'text-gray-300')}>{t.label}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{t.desc}</p>
                  </div>
                  {trigger === t.key && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStage('steps')}
                disabled={!trigger}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                Devam Et
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stage: Steps */}
        {stage === 'steps' && (
          <div className="space-y-4">
            {/* Trigger badge */}
            <div className="flex items-center gap-3 bg-[#111] border border-[#1e1e1e] rounded-2xl px-5 py-4">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                {selectedTrigger && <selectedTrigger.icon className="w-4 h-4 text-white" />}
              </div>
              <div>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Tetikleyici</p>
                <p className="text-sm font-semibold text-white">{selectedTrigger?.label}</p>
              </div>
              <Zap className="w-4 h-4 text-blue-400 ml-auto" />
            </div>

            {/* Steps */}
            {steps.map((step, i) => (
              <div key={step.id} className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-sm shadow-blue-500/30">
                      {i + 1}
                    </div>
                    <span className="text-sm font-semibold text-white">Adım {i + 1}</span>
                  </div>
                  {steps.length > 1 && (
                    <button onClick={() => removeStep(step.id)} className="text-gray-700 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Channel selection */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block uppercase tracking-wider">Kanal</label>
                  <div className="grid grid-cols-2 gap-2">
                    {channels.map((ch) => (
                      <button
                        key={ch.key}
                        onClick={() => updateStep(step.id, { channel: ch.key })}
                        className={cn(
                          'flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition-all',
                          step.channel === ch.key
                            ? ch.activeBg
                            : 'border-[#2a2a2a] text-gray-600 hover:border-[#333] hover:text-gray-400 bg-[#0d0d0d]'
                        )}
                      >
                        <ch.icon className="w-3.5 h-3.5" />
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delay / Timing */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block uppercase tracking-wider">Gönderim Zamanı</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateStep(step.id, { immediate: true })}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                        step.immediate
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30'
                          : 'bg-[#0d0d0d] text-gray-500 border-[#2a2a2a] hover:border-[#333] hover:text-gray-300'
                      )}
                    >
                      Hemen
                    </button>
                    <button
                      onClick={() => updateStep(step.id, { immediate: false })}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                        !step.immediate
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30'
                          : 'bg-[#0d0d0d] text-gray-500 border-[#2a2a2a] hover:border-[#333] hover:text-gray-300'
                      )}
                    >
                      Özel Zamanlama
                    </button>
                  </div>

                  {!step.immediate && (
                    <>
                      <div className="flex items-center gap-2 mt-3">
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={step.delayAmount}
                          onChange={(e) => updateStep(step.id, { delayAmount: e.target.value })}
                          className="w-20 px-3 py-2 text-sm border border-[#2a2a2a] rounded-xl bg-[#0d0d0d] text-white focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-center font-semibold"
                        />
                        <div className="relative flex-1">
                          <select
                            value={step.delayUnit}
                            onChange={(e) => updateStep(step.id, { delayUnit: e.target.value })}
                            className="w-full appearance-none px-3 py-2 text-sm border border-[#2a2a2a] rounded-xl bg-[#0d0d0d] text-gray-300 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 pr-8"
                          >
                            {delayUnits.map((u) => (
                              <option key={u.value} value={u.value}>{u.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
                        </div>
                        <span className="text-sm text-gray-600 whitespace-nowrap">sonra</span>
                      </div>
                      <p className="text-xs text-blue-400 mt-2 font-medium">
                        → Tetikleyiciden {step.delayAmount || '1'} {step.delayUnit} sonra gönderilecek
                      </p>
                    </>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block uppercase tracking-wider">Mesaj İçeriği</label>
                  <textarea
                    value={step.message}
                    onChange={(e) => updateStep(step.id, { message: e.target.value })}
                    placeholder={
                      step.channel === 'email' ? 'Email konusu ve içeriği...' :
                      'WhatsApp mesajı...'
                    }
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-[#2a2a2a] rounded-xl bg-[#0d0d0d] text-gray-300 placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                </div>
              </div>
            ))}

            {/* Add step */}
            <button
              onClick={addStep}
              className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-[#1e1e1e] hover:border-blue-500/30 hover:text-blue-400 text-gray-600 rounded-2xl transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Adım Ekle
            </button>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStage('trigger')} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-300 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Geri
              </button>
              <button
                onClick={() => setStage('settings')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                Devam Et
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stage: Settings */}
        {stage === 'settings' && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-white">Otomasyon Ayarları</h2>
              <p className="text-sm text-gray-600 mt-1">İsim ve hedef kitle belirleyin.</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block uppercase tracking-wider">Otomasyon İsmi</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={(selectedTrigger?.label ?? '') + ' Otomasyonu'}
                className="w-full px-4 py-2.5 text-sm border border-[#2a2a2a] rounded-xl bg-[#0d0d0d] text-white placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block uppercase tracking-wider">Hedef Segment</label>
              <div className="relative">
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 text-sm border border-[#2a2a2a] rounded-xl bg-[#0d0d0d] text-gray-300 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 pr-8"
                >
                  <option value="all">Tüm Müşteriler</option>
                  <option value="vip">VIP</option>
                  <option value="loyal">Sadık</option>
                  <option value="at_risk">Risk Altında</option>
                  <option value="new">Yeni</option>
                  <option value="inactive">Pasif</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 pointer-events-none" />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Özet</p>
              {[
                { label: 'Tetikleyici', value: selectedTrigger?.label ?? '-' },
                { label: 'Adım sayısı', value: `${steps.length} mesaj adımı` },
                { label: 'Zamanlama',   value: steps.map(stepDelayLabel).join(' → ') },
                { label: 'Kanallar',    value: [...new Set(steps.map((s) => s.channel))].join(', ') },
                { label: 'Hedef',       value: segment === 'all' ? 'Tüm müşteriler' : segment },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{row.label}</span>
                  <span className="font-medium text-gray-300 truncate max-w-[200px] text-right">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStage('steps')} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-300 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Geri
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Kaydediliyor...</>
                ) : (
                  <><Check className="w-4 h-4" />Otomasyonu Başlat</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
