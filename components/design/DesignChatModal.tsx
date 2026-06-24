'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X, Send, Sparkles, RefreshCw, Check, ExternalLink,
  ImageIcon, Wand2, ChevronRight, AlertCircle, Loader2,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface DesignChatModalProps {
  open: boolean
  onClose: () => void
  onSelect: (imageUrl: string, designId: string) => void
}

type MessageRole = 'user' | 'assistant'
type StatusStep = { message: string; done: boolean }

interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  imageUrl?: string
  designId?: string
  templateTitle?: string
  noTemplates?: boolean
  setupUrl?: string
  isError?: boolean
  statusSteps?: StatusStep[]
  isLoading?: boolean
}

const SUGGESTIONS = [
  'Yaz indirimi için email görseli oluştur, %30 indirim var',
  'Yeni koleksiyon tanıtımı, premium ürün fotoğrafı alanı olsun',
  'Sepet terk hatırlatıcısı, acil ve etkileyici tasarım',
  'Hoş geldin kampanyası, yeni üyeler için özel teklif',
]

const WELCOME = `Merhaba! Ben Marksio AI Tasarım Asistanınızım ✨

Kampanya görselinizi saniyeler içinde oluşturabilirim. Bana şunu söyleyin:
— Ne tür bir kampanya? (indirim, ürün tanıtımı, sezonluk...)
— Başlık veya mesajınız nedir?
— Varsa indirim oranı veya ürün adı?`

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: 'var(--primary)',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

function StatusTimeline({ steps }: { steps: StatusStep[] }) {
  return (
    <div className="space-y-2 mt-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: step.done
                ? 'var(--success-soft)'
                : i === steps.findIndex(s => !s.done)
                  ? 'var(--primary-soft)'
                  : 'var(--surface-2)',
              border: `1px solid ${step.done ? 'color-mix(in srgb, var(--success) 30%, transparent)' : 'var(--border)'}`,
            }}>
            {step.done
              ? <Check className="w-2.5 h-2.5" style={{ color: 'var(--success)' }} />
              : i === steps.findIndex(s => !s.done)
                ? <Loader2 className="w-2.5 h-2.5 animate-spin" style={{ color: 'var(--primary)' }} />
                : null
            }
          </div>
          <p style={{
            fontSize: 11,
            color: step.done ? 'var(--text-2)' : i === steps.findIndex(s => !s.done) ? 'var(--text-1)' : 'var(--text-3)',
            fontWeight: step.done ? 400 : 500,
          }}>
            {step.message}
          </p>
        </div>
      ))}
    </div>
  )
}

function DesignResult({ imageUrl, designId, templateTitle, onSelect, onRetry }: {
  imageUrl: string; designId: string; templateTitle?: string
  onSelect: (url: string, id: string) => void; onRetry: () => void
}) {
  const [selected, setSelected] = useState(false)
  return (
    <div className="mt-3">
      <div className="relative rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <Image src={imageUrl} alt="Tasarım" fill className="object-cover" unoptimized />
        </div>
        {templateTitle && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] font-semibold"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', backdropFilter: 'blur(4px)' }}>
            {templateTitle}
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => { setSelected(true); onSelect(imageUrl, designId) }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-semibold transition-all"
          style={{
            background: selected ? 'var(--success-soft)' : 'var(--primary)',
            color: selected ? 'var(--success)' : '#fff',
            border: selected ? '1px solid color-mix(in srgb, var(--success) 30%, transparent)' : 'none',
          }}>
          {selected ? <><Check className="w-3.5 h-3.5" /> Eklendi</> : <><Check className="w-3.5 h-3.5" /> Kampanyaya Ekle</>}
        </button>
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-colors"
          style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}>
          <RefreshCw className="w-3.5 h-3.5" /> Yeniden
        </button>
        <a
          href={`https://www.canva.com/design/${designId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center px-3 py-2.5 rounded-xl text-[12px] transition-colors"
          style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  )
}

function NoTemplatesCard({ setupUrl }: { setupUrl?: string }) {
  return (
    <div className="mt-3 p-4 rounded-xl" style={{ background: 'var(--warning-soft)', border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)' }}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning)', marginBottom: 4 }}>
            Canva Marka Şablonu Bulunamadı
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 10 }}>
            Tasarım oluşturabilmek için Canva hesabında marka şablonları oluşturman gerekiyor.
            Şablonlarda <code style={{ fontSize: 10, padding: '1px 4px', background: 'var(--surface-3)', borderRadius: 4 }}>title</code>,{' '}
            <code style={{ fontSize: 10, padding: '1px 4px', background: 'var(--surface-3)', borderRadius: 4 }}>subtitle</code>,{' '}
            <code style={{ fontSize: 10, padding: '1px 4px', background: 'var(--surface-3)', borderRadius: 4 }}>cta_text</code> alanlarını ekle.
          </p>
          {setupUrl && (
            <a href={setupUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
              style={{ color: 'var(--warning)' }}>
              Canva Brand Hub'a git <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DesignChatModal({ open, onClose, onSelect }: DesignChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', content: WELCOME },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastBrief, setLastBrief] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getHistory = useCallback(() =>
    messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }))
      .slice(-8),
    [messages]
  )

  const generate = useCallback(async (brief: string) => {
    if (!brief.trim() || loading) return
    setLastBrief(brief)
    setLoading(true)

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: brief }
    const aiMsgId = (Date.now() + 1).toString()
    const steps: StatusStep[] = [
      { message: 'Brief analiz ediliyor...', done: false },
      { message: 'Canva şablonları yükleniyor...', done: false },
      { message: 'Tasarım oluşturuluyor...', done: false },
      { message: 'Görsel hazırlanıyor...', done: false },
    ]

    setMessages(prev => [
      ...prev,
      userMsg,
      { id: aiMsgId, role: 'assistant', content: '', statusSteps: [...steps], isLoading: true },
    ])

    const updateStep = (message: string) => {
      setMessages(prev => prev.map(m => {
        if (m.id !== aiMsgId) return m
        const newSteps = [...(m.statusSteps ?? [])]
        const idx = newSteps.findIndex(s => s.message === message)
        if (idx >= 0) {
          for (let i = 0; i < idx; i++) newSteps[i] = { ...newSteps[i], done: true }
        } else {
          const active = newSteps.findIndex(s => !s.done)
          if (active >= 0) newSteps[active] = { ...newSteps[active], done: true }
        }
        return { ...m, statusSteps: newSteps }
      }))
    }

    try {
      const res = await fetch('/api/ai/design-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, history: getHistory() }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'status') {
              updateStep(event.message)
            } else if (event.type === 'done') {
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? {
                  ...m, isLoading: false,
                  content: 'Tasarımınız hazır! 🎉 Beğendiniz mi?',
                  imageUrl: event.imageUrl,
                  designId: event.designId,
                  templateTitle: event.templateTitle,
                  statusSteps: m.statusSteps?.map(s => ({ ...s, done: true })),
                } : m
              ))
            } else if (event.type === 'no_templates') {
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? {
                  ...m, isLoading: false,
                  content: event.message,
                  noTemplates: true,
                  setupUrl: event.setup_url,
                  statusSteps: undefined,
                } : m
              ))
            } else if (event.type === 'error') {
              setMessages(prev => prev.map(m =>
                m.id === aiMsgId ? {
                  ...m, isLoading: false,
                  content: `Bir hata oluştu: ${event.message}`,
                  isError: true,
                  statusSteps: undefined,
                } : m
              ))
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId ? {
          ...m, isLoading: false,
          content: 'Bağlantı hatası oluştu. Lütfen tekrar deneyin.',
          isError: true,
          statusSteps: undefined,
        } : m
      ))
    } finally {
      setLoading(false)
    }
  }, [loading, getHistory])

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    generate(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>

      <div
        className="relative w-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: 560,
          height: '85vh',
          maxHeight: 720,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        }}>

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--surface)), var(--surface))',
          }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--primary-soft)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
              <Wand2 className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                AI Tasarım Asistanı
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-3)' }}>
                Powered by Canva + Claude
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>

              {/* Avatar */}
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: 'var(--primary-soft)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
                  <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                </div>
              )}

              <div className={cn('max-w-[85%]', msg.role === 'user' && 'max-w-[75%]')}>
                {/* Bubble */}
                {(msg.content || msg.isLoading) && (
                  <div className="px-4 py-3 rounded-2xl"
                    style={msg.role === 'user' ? {
                      background: 'var(--primary)',
                      color: '#fff',
                      borderBottomRightRadius: 4,
                    } : {
                      background: 'var(--surface-2)',
                      color: 'var(--text-1)',
                      borderBottomLeftRadius: 4,
                      border: '1px solid var(--border)',
                    }}>
                    {msg.isLoading && !msg.content
                      ? <TypingDots />
                      : <p style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                    }
                    {msg.isLoading && msg.statusSteps && (
                      <StatusTimeline steps={msg.statusSteps} />
                    )}
                    {msg.isError && (
                      <div className="flex items-center gap-2 mt-2">
                        <AlertCircle className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
                        <button onClick={() => generate(lastBrief)}
                          className="text-[11px] font-semibold underline"
                          style={{ color: 'var(--primary)' }}>
                          Tekrar dene
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Design result */}
                {msg.imageUrl && msg.designId && (
                  <DesignResult
                    imageUrl={msg.imageUrl}
                    designId={msg.designId}
                    templateTitle={msg.templateTitle}
                    onSelect={onSelect}
                    onRetry={() => generate(lastBrief)}
                  />
                )}

                {/* No templates */}
                {msg.noTemplates && <NoTemplatesCard setupUrl={msg.setupUrl} />}

                {/* Status steps when done */}
                {!msg.isLoading && msg.statusSteps && !msg.imageUrl && (
                  <StatusTimeline steps={msg.statusSteps} />
                )}
              </div>
            </div>
          ))}

          {/* Suggestions — only show at start */}
          {messages.length === 1 && (
            <div className="grid grid-cols-1 gap-2 pt-2">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => { setInput(''); generate(s) }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all group"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-soft)'; e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--primary) 20%, transparent)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                  <ImageIcon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{s}</span>
                  <ChevronRight className="w-3 h-3 ml-auto shrink-0" style={{ color: 'var(--text-3)' }} />
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 px-4 pb-4 pt-3"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div className="flex items-end gap-2">
            <div className="flex-1 rounded-xl overflow-hidden"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Kampanyanızı tarif edin... (örn: Yaz sonu %40 indirim kampanyası)"
                disabled={loading}
                rows={2}
                className="w-full px-3.5 py-3 text-[13px] resize-none outline-none bg-transparent"
                style={{ color: 'var(--text-1)', lineHeight: 1.5 }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
              style={{
                background: input.trim() && !loading ? 'var(--primary)' : 'var(--surface-2)',
                color: input.trim() && !loading ? '#fff' : 'var(--text-3)',
                border: '1px solid var(--border)',
              }}>
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 8, textAlign: 'center' }}>
            Enter ile gönder · Shift+Enter yeni satır
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
