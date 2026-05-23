'use client'

import { useState } from 'react'
import {
  Mail, MessageSquare, Sparkles, ArrowLeft, ArrowRight,
  Check, Loader2, Copy, Save, RefreshCw, Lightbulb,
  X, Palette, Edit3, Eye, Send, Crown, Heart, AlertTriangle, Clock, Layout,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { cn } from '@/lib/utils'
import { PromptInputBox } from '@/components/ui/ai-prompt-box'

type CampaignType = 'email' | 'whatsapp'
type Segment = 'vip' | 'loyal' | 'at_risk' | 'new' | 'inactive'
type Step = 'channel' | 'segment' | 'builder' | 'generate' | 'preview'

const channelOptions = [
  {
    key: 'email' as CampaignType,
    label: 'Email',
    icon: Mail,
    desc: 'Detaylı içerik, yüksek dönüşüm',
    color: 'text-blue-400',
    border: 'border-blue-500/40',
    glow: 'shadow-blue-500/10',
    bg: 'bg-blue-500/8',
    badge: 'bg-blue-500/15 text-blue-400',
    stat: '%42 açılma',
  },
  {
    key: 'whatsapp' as CampaignType,
    label: 'WhatsApp',
    icon: MessageSquare,
    desc: 'Kişisel his, %87 okunma oranı',
    color: 'text-green-400',
    border: 'border-green-500/40',
    glow: 'shadow-green-500/10',
    bg: 'bg-green-500/8',
    badge: 'bg-green-500/15 text-green-400',
    stat: '%87 okunma',
  },
]

const segmentOptions = [
  { key: 'vip' as Segment, label: 'VIP Müşteriler', count: 892, desc: '5+ sipariş, yüksek harcama', icon: Crown },
  { key: 'loyal' as Segment, label: 'Sadık Müşteriler', count: 1840, desc: 'Düzenli alıcılar, yüksek LTV', icon: Heart },
  { key: 'at_risk' as Segment, label: 'Risk Altındaki', count: 724, desc: '60+ gün inaktif', icon: AlertTriangle },
  { key: 'new' as Segment, label: 'Yeni Müşteriler', count: 1248, desc: 'Son 30 günde kayıt', icon: Sparkles },
  { key: 'inactive' as Segment, label: 'Pasif Müşteriler', count: 1128, desc: '90+ gün satın alma yok', icon: Clock },
]

const goalSuggestions = [
  { label: 'Satış artır', value: 'Müşterileri mağazaya çekip satış yapmak ve geliri artırmak' },
  { label: 'Sepet terk', value: 'Sepette ürün bırakıp ayrılan müşterileri geri çekmek ve alışverişi tamamlatmak' },
  { label: 'Yeni koleksiyon', value: 'Yeni sezon ürünleri tanıtmak ve ilk alışverişi teşvik etmek' },
  { label: 'İndirim', value: 'Özel indirim teklifleriyle müşterileri mağazaya çekmek' },
  { label: 'VIP ödül', value: 'Sadık müşterileri ödüllendirmek ve bağlılığı güçlendirmek' },
  { label: 'Geri kazan', value: 'Uzun süredir alışveriş yapmayan müşterileri özel teklifle geri kazanmak' },
]

const emailTemplates = [
  { id: 'promotion', label: 'Promosyon', desc: 'İndirim & kampanya' },
  { id: 'new_product', label: 'Yeni Ürün', desc: 'Ürün lansmanı' },
  { id: 'abandoned_cart', label: 'Sepet Terk', desc: 'Geri kazanım' },
  { id: 'winback', label: 'Win-back', desc: 'Pasif müşteri' },
  { id: 'vip', label: 'VIP Özel', desc: 'Premium' },
  { id: 'welcome', label: 'Hoş Geldin', desc: 'Yeni kayıt' },
]

interface GeneratedContent {
  subject?: string
  previewText?: string
  body: string
  cta?: string
  hashtags?: string[]
  tips: string[]
}

const steps: Array<{ key: Step; label: string }> = [
  { key: 'channel', label: 'Kanal' },
  { key: 'segment', label: 'Segment' },
  { key: 'builder', label: 'İçerik' },
  { key: 'preview', label: 'Önizleme' },
]

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('channel')
  const [channel, setChannel] = useState<CampaignType | null>(null)
  const [segment, setSegment] = useState<Segment | null>(null)
  const [goal, setGoal] = useState('')
  const [campaignName] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [editedContent, setEditedContent] = useState<GeneratedContent | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('promotion')
  const [previewHtml, setPreviewHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [testError, setTestError] = useState('')

  const loadingMessages = [
    'Müşteri segmentiniz analiz ediliyor...',
    'En iyi mesaj tonu belirleniyor...',
    'İçerik oluşturuluyor...',
    'Son dokunuşlar yapılıyor...',
  ]

  const activeStep = steps.findIndex(s => s.key === step && step !== 'generate')

  async function handleGenerate(promptGoal?: string) {
    const finalGoal = promptGoal || goal
    if (!channel || !segment || !finalGoal) return
    setStep('generate')
    setLoading(true)
    let idx = 0
    setLoadingMsg(loadingMessages[0])
    const interval = setInterval(() => {
      idx = (idx + 1) % loadingMessages.length
      setLoadingMsg(loadingMessages[idx])
    }, 1800)
    try {
      const res = await fetch('/api/ai/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: channel, segment, goal: finalGoal, storeName: campaignName || 'Mağazam', tone: 'dostane ve profesyonel' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setEditedContent(data)
      setStep('preview')
    } catch {
      setStep('builder')
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }

  async function handlePromptSend(message: string) {
    setGoal(message)
    await handleGenerate(message)
  }

  async function fetchPreview(tplId?: string) {
    if (!editedContent) return
    setLoadingPreview(true)
    try {
      const res = await fetch('/api/email/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: tplId ?? selectedTemplate,
          subject: editedContent.subject,
          body: editedContent.body,
          previewText: editedContent.previewText,
          cta: editedContent.cta,
        }),
      })
      const html = await res.text()
      setPreviewHtml(html)
      setShowPreview(true)
    } finally {
      setLoadingPreview(false)
    }
  }

  async function handleTestEmail() {
    if (!editedContent || channel !== 'email') return
    setSendingTest(true); setTestError('')
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: editedContent.subject, body: editedContent.body, campaignName, type: channel, templateId: selectedTemplate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTestSent(true); setTimeout(() => setTestSent(false), 4000)
    } catch (e) {
      setTestError(e instanceof Error ? e.message : 'Gönderilemedi')
    } finally { setSendingTest(false) }
  }

  async function handleSave() {
    if (!channel || !segment || !editedContent) return
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: campaignName || `${channel.toUpperCase()} — ${new Date().toLocaleDateString('tr-TR')}`,
        type: channel, status: 'draft', segment,
        subject: editedContent.subject, previewText: editedContent.previewText,
        body: editedContent.body, cta: editedContent.cta, tips: editedContent.tips,
      }),
    })
    if (res.ok) setSaved(true)
  }

  function copyContent() {
    const text = [
      editedContent?.subject ? `Konu: ${editedContent.subject}` : '',
      editedContent?.previewText ? `Ön izleme: ${editedContent.previewText}` : '',
      editedContent?.body,
      editedContent?.cta ? `CTA: ${editedContent.cta}` : '',
      editedContent?.hashtags?.length ? editedContent.hashtags.join(' ') : '',
    ].filter(Boolean).join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const visibleSteps = steps.filter(s => s.key !== 'generate')
  const currentVisibleIdx = visibleSteps.findIndex(s => s.key === step)

  return (
    <AppShell>
      {/* Header */}
      <div className="h-14 bg-[#0a0a0a] border-b border-[#1e1e1e] flex items-center px-6 gap-4 sticky top-0 z-20">
        <Link href="/campaigns" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Geri
        </Link>
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-white">Kampanya Oluştur</h1>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {visibleSteps.map((s, i) => {
            const done = i < currentVisibleIdx
            const active = s.key === step
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                  done ? 'bg-blue-600 text-white' : active ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/40' : 'bg-[#1e1e1e] text-gray-600'
                )}>
                  {done ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={cn('text-xs hidden md:block', active ? 'text-blue-400 font-medium' : done ? 'text-gray-500' : 'text-gray-700')}>
                  {s.label}
                </span>
                {i < visibleSteps.length - 1 && (
                  <div className={cn('w-6 h-px', done ? 'bg-blue-600/50' : 'bg-[#2a2a2a]')} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-6 bg-[#0a0a0a]">
        <div className="w-full max-w-2xl space-y-5">

          {/* STEP: Channel */}
          {step === 'channel' && (
            <div className="animate-slide-up space-y-6">
              <div className="text-center pt-4">
                <h2 className="text-2xl font-bold text-white">Kanal seçin</h2>
                <p className="text-sm text-gray-500 mt-2">Her kanal için özelleştirilmiş içerik oluşturulacak</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {channelOptions.map(opt => {
                  const Icon = opt.icon
                  const selected = channel === opt.key
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setChannel(opt.key)}
                      className={cn(
                        'group relative flex flex-col items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-200',
                        selected
                          ? cn('border-2', opt.border, opt.bg, 'shadow-lg', opt.glow)
                          : 'border-[#1e1e1e] bg-[#111] hover:border-[#2a2a2a] hover:bg-[#141414]'
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', selected ? opt.bg : 'bg-[#1a1a1a]', 'border', selected ? opt.border : 'border-[#2a2a2a]')}>
                        <Icon className={cn('w-5 h-5', selected ? opt.color : 'text-gray-600')} />
                      </div>
                      <div className="flex-1">
                        <p className={cn('text-sm font-semibold mb-1', selected ? opt.color : 'text-gray-300')}>{opt.label}</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{opt.desc}</p>
                      </div>
                      <span className={cn('text-[10px] font-medium px-2 py-1 rounded-full', selected ? opt.badge : 'bg-[#1a1a1a] text-gray-600')}>
                        {opt.stat}
                      </span>
                      {selected && (
                        <div className="absolute top-3 right-3">
                          <Check className={cn('w-4 h-4', opt.color)} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-end">
                <button disabled={!channel} onClick={() => setStep('segment')} className="btn-primary disabled:opacity-30">
                  Devam Et <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP: Segment */}
          {step === 'segment' && (
            <div className="animate-slide-up space-y-5">
              <div className="text-center pt-4">
                <h2 className="text-2xl font-bold text-white">Hedef kitle</h2>
                <p className="text-sm text-gray-500 mt-2">Mesajınız bu segmente göre kişiselleştirilecek</p>
              </div>
              <div className="space-y-2">
                {segmentOptions.map(opt => {
                  const selected = segment === opt.key
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setSegment(opt.key)}
                      className={cn(
                        'w-full flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all duration-200',
                        selected
                          ? 'border-blue-500/40 bg-blue-500/8 shadow-sm'
                          : 'border-[#1e1e1e] bg-[#111] hover:border-[#2a2a2a] hover:bg-[#141414]'
                      )}
                    >
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', selected ? 'bg-blue-500/15' : 'bg-[#1a1a1a]')}>
                        <opt.icon className={cn('w-4 h-4', selected ? 'text-blue-400' : 'text-gray-500')} />
                      </div>
                      <div className="flex-1">
                        <p className={cn('text-sm font-semibold', selected ? 'text-blue-400' : 'text-gray-300')}>{opt.label}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{opt.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn('text-base font-bold', selected ? 'text-blue-400' : 'text-gray-400')}>{opt.count.toLocaleString('tr-TR')}</p>
                        <p className="text-xs text-gray-700">müşteri</p>
                      </div>
                      {selected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep('channel')} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Geri</button>
                <button disabled={!segment} onClick={() => setStep('builder')} className="btn-primary disabled:opacity-30">
                  Devam Et <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP: Builder */}
          {step === 'builder' && (
            <div className="animate-slide-up space-y-5">
              <div className="text-center pt-4">
                <h2 className="text-2xl font-bold text-white">İçerik oluşturun</h2>
                <p className="text-sm text-gray-500 mt-2">Marka bilgilerinizi girin, size özel içerik hazırlayalım</p>
              </div>

              {/* Quick goal suggestions */}
              <div>
                <p className="text-xs text-gray-600 mb-3 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> Hızlı başlangıç
                </p>
                <div className="flex flex-wrap gap-2">
                  {goalSuggestions.map(s => (
                    <button key={s.label} onClick={() => setGoal(s.value)}
                      className={cn('px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                        goal === s.value ? 'border-blue-500/50 bg-blue-500/15 text-blue-400' : 'border-[#2a2a2a] text-gray-500 hover:border-[#333] hover:text-gray-300')}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Prompt Box */}
              <div>
                <p className="text-xs text-gray-600 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Kampanya hedefini ve mesajınızı buraya yazın
                </p>
                <PromptInputBox
                  placeholder={goal || "Örn: Sepette ürün bırakıp ayrılan müşterilere %15 indirimle özel teklif sun..."}
                  onSend={handlePromptSend}
                  isLoading={loading}
                />
                {goal && (
                  <p className="mt-2 text-xs text-gray-700 px-1 truncate">{goal}</p>
                )}
              </div>

              {/* Email için görsel editör seçeneği */}
              {channel === 'email' && (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                  <Layout className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-400">Görsel Editor ile Tasarla</p>
                    <p className="text-xs text-gray-600 mt-0.5">Sürükle-bırak şablon editörünü kullan</p>
                  </div>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams()
                      if (segment) params.set('segment', segment)
                      if (goal) params.set('goal', goal)
                      if (campaignName) params.set('name', campaignName)
                      router.push(`/campaigns/email-editor?${params.toString()}`)
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all shrink-0"
                  >
                    <Layout className="w-3.5 h-3.5" /> Editörü Aç
                  </button>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep('segment')} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Geri</button>
                <button disabled={!goal.trim()} onClick={() => handleGenerate()} className="btn-primary disabled:opacity-30">
                  <Sparkles className="w-4 h-4" /> Oluştur
                </button>
              </div>
            </div>
          )}

          {/* STEP: Generating */}
          {step === 'generate' && (
            <div className="animate-fade-in text-center py-20">
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Sparkles className="w-9 h-9 text-blue-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Hazırlanıyor...</h2>
              <p className="text-sm text-gray-500 animate-pulse">{loadingMsg}</p>
              <div className="flex justify-center gap-2 mt-8">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* STEP: Preview — Canvas-like editable */}
          {step === 'preview' && editedContent && (
            <div className="animate-slide-up space-y-5">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h2 className="text-xl font-bold text-white">İçeriğiniz hazır</h2>
                  <p className="text-xs text-gray-500 mt-1">Doğrudan üzerinde düzenleme yapabilirsiniz</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={copyContent} className="btn-ghost text-xs">
                    {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Kopyalandı</> : <><Copy className="w-3.5 h-3.5" />Kopyala</>}
                  </button>
                  <button onClick={() => handleGenerate()} disabled={loading} className="btn-ghost text-xs">
                    <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />Yenile
                  </button>
                  <button onClick={() => setIsEditing(!isEditing)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    isEditing ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent border-[#2a2a2a] text-gray-400 hover:border-[#333] hover:text-gray-200')}>
                    {isEditing ? <><Eye className="w-3.5 h-3.5" />Görüntüle</> : <><Edit3 className="w-3.5 h-3.5" />Düzenle</>}
                  </button>
                </div>
              </div>

              {/* Editable content card */}
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-[#1e1e1e] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#333]" />
                  <div className="w-2 h-2 rounded-full bg-[#333]" />
                  <div className="w-2 h-2 rounded-full bg-[#333]" />
                  <span className="text-xs text-gray-600 ml-2">
                    {channel === 'email' ? 'Email İçeriği' : 'WhatsApp İçeriği'}
                  </span>
                  {isEditing && <span className="ml-auto text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">Düzenleme modu</span>}
                </div>

                <div className="p-5 space-y-4">
                  {editedContent.subject !== undefined && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Konu Satırı</p>
                      {isEditing
                        ? <input value={editedContent.subject || ''} onChange={e => setEditedContent(p => p ? { ...p, subject: e.target.value } : p)} className="input text-sm font-medium" />
                        : <p className="text-sm font-semibold text-white bg-[#1a1a1a] px-4 py-3 rounded-xl border border-[#2a2a2a]">{editedContent.subject}</p>
                      }
                    </div>
                  )}

                  {editedContent.previewText !== undefined && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Ön İzleme Metni</p>
                      {isEditing
                        ? <input value={editedContent.previewText || ''} onChange={e => setEditedContent(p => p ? { ...p, previewText: e.target.value } : p)} className="input text-sm" />
                        : <p className="text-sm text-gray-400 bg-[#1a1a1a] px-4 py-3 rounded-xl border border-[#2a2a2a]">{editedContent.previewText}</p>
                      }
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Mesaj</p>
                    {isEditing
                      ? <textarea value={editedContent.body} onChange={e => setEditedContent(p => p ? { ...p, body: e.target.value } : p)} className="input resize-none text-sm leading-relaxed" rows={8} />
                      : <p className="text-sm text-gray-300 bg-[#1a1a1a] px-4 py-3 rounded-xl border border-[#2a2a2a] whitespace-pre-line leading-relaxed">{editedContent.body}</p>
                    }
                  </div>

                  {editedContent.cta && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Aksiyon Butonu</p>
                      {isEditing
                        ? <input value={editedContent.cta} onChange={e => setEditedContent(p => p ? { ...p, cta: e.target.value } : p)} className="input text-sm" />
                        : <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl">{editedContent.cta}</div>
                      }
                    </div>
                  )}

                  {editedContent.hashtags && editedContent.hashtags.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Hashtagler</p>
                      <div className="flex flex-wrap gap-2">
                        {editedContent.hashtags.map((tag, i) => (
                          <span key={i} className="text-xs bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 px-3 py-1 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Email template picker + preview */}
              {channel === 'email' && (
                <div className="card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-blue-400" />
                      <p className="text-sm font-semibold text-gray-300">Şablon Seç</p>
                    </div>
                    <button onClick={() => fetchPreview()} disabled={loadingPreview} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-60">
                      {loadingPreview ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                      Önizle
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {emailTemplates.map(tpl => (
                      <button key={tpl.id} onClick={() => { setSelectedTemplate(tpl.id); setShowPreview(false) }}
                        className={cn('p-3 rounded-xl border-2 text-left transition-all',
                          selectedTemplate === tpl.id ? 'border-blue-500/50 bg-blue-500/8' : 'border-[#1e1e1e] bg-[#0d0d0d] hover:border-[#2a2a2a]')}>
                        <p className="text-xs font-semibold text-gray-300 mb-0.5">{tpl.label}</p>
                        <p className="text-[11px] text-gray-600">{tpl.desc}</p>
                      </button>
                    ))}
                  </div>
                  {showPreview && previewHtml && (
                    <div className="border border-[#2a2a2a] rounded-xl overflow-hidden">
                      <div className="bg-[#0d0d0d] border-b border-[#1e1e1e] px-4 py-2 flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/60" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                          <div className="w-3 h-3 rounded-full bg-green-500/60" />
                        </div>
                        <span className="text-xs text-gray-600 ml-2">Email Önizleme</span>
                        <button onClick={() => setShowPreview(false)} className="ml-auto text-gray-700 hover:text-gray-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <iframe srcDoc={previewHtml} className="w-full border-0" style={{ height: '520px' }} title="Email Önizlemesi" sandbox="allow-same-origin" />
                    </div>
                  )}
                </div>
              )}

              {/* Test send — email only */}
              {channel === 'email' && (
                <div className="flex items-center justify-between bg-[#111] border border-[#1e1e1e] rounded-xl px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-300">Test Gönder</p>
                    <p className="text-xs text-gray-600 mt-0.5">info@vosensio.com adresine seçili şablonla</p>
                    {testError && <p className="text-xs text-red-400 mt-1">{testError}</p>}
                  </div>
                  <button onClick={handleTestEmail} disabled={sendingTest || testSent}
                    className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                      testSent ? 'bg-emerald-600 text-white' : 'bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-gray-300 disabled:opacity-60')}>
                    {sendingTest ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Gönderiliyor</> : testSent ? <><Check className="w-3.5 h-3.5" />Gönderildi</> : <><Send className="w-3.5 h-3.5" />Test Gönder</>}
                  </button>
                </div>
              )}

              {/* AI tips */}
              {editedContent.tips?.length > 0 && (
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <h3 className="text-sm font-semibold text-gray-300">Öneriler</h3>
                  </div>
                  <ul className="space-y-2">
                    {editedContent.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-gray-500">
                        <div className="w-4 h-4 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-gray-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</div>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep('builder')} className="btn-secondary"><ArrowLeft className="w-4 h-4" />Geri Dön</button>
                <button onClick={handleSave} disabled={saved}
                  className={cn('flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all',
                    saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white')}>
                  {saved ? <><Check className="w-4 h-4" />Kaydedildi</> : <><Save className="w-4 h-4" />Kaydet</>}
                </button>
              </div>

              {saved && (
                <div className="text-center pb-4">
                  <Link href="/campaigns" className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                    Kampanyalar listesine dön →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
