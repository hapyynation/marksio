'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Plus, Trash2, Smile, Bold, Link2, Code2, Sparkles,
  Loader2, ChevronRight, Mail, Image as ImageIcon,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Campaign } from '@/app/campaigns/[id]/page'

/* ── Types ────────────────────────────────────────────────────────────────── */

interface Step {
  id: string
  subject: string
  body: string
}

/* ── Emoji data ───────────────────────────────────────────────────────────── */

const EMOJIS = [
  '😊','🎉','🔥','💡','✅','⚡','🚀','💎','🎁','❤️',
  '👏','🌟','📢','💰','🛍️','📦','🎯','🏆','✨','🙌',
  '👇','➡️','⭐','💫','🎀','🌈','🤩','😍','🥳','💥',
]

const VARS = ['{{name}}', '{{email}}', '{{segment}}']

/* ── Toolbar Button ───────────────────────────────────────────────────────── */

function TBtn({ children, onClick, title, active }: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        active
          ? 'bg-[#EFF6FF] text-[#2563EB]'
          : 'text-[#6B7280] hover:bg-[var(--bg-hover)] hover:text-[#374151]',
      )}
    >
      {children}
    </button>
  )
}

/* ── Save selection helper ────────────────────────────────────────────────── */

function saveSelection(): Range | null {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) return sel.getRangeAt(0).cloneRange()
  return null
}

function restoreSelection(range: Range | null) {
  if (!range) return
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
}

/* ── Main Panel ───────────────────────────────────────────────────────────── */

export function SequencesPanel({
  campaign,
  onUpdate,
}: {
  campaign: Campaign
  onUpdate: (fields: Partial<Campaign>) => Promise<void>
}) {
  const buildSteps = (): Step[] => {
    const extras: Step[] = (() => {
      try { return JSON.parse(campaign.design ?? '[]') } catch { return [] }
    })()
    return [
      { id: 'main', subject: campaign.subject ?? '', body: campaign.body ?? '' },
      ...extras,
    ]
  }

  const [steps, setSteps]         = useState<Step[]>(buildSteps)
  const [activeIdx, setActiveIdx] = useState(0)
  const [saving, setSaving]       = useState(false)
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [showEmoji, setShowEmoji] = useState(false)
  const [showLink, setShowLink]   = useState(false)
  const [linkUrl, setLinkUrl]     = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError]     = useState<string | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const bodyRef    = useRef<HTMLDivElement>(null)
  const subjectRef = useRef<HTMLInputElement>(null)
  const imageRef   = useRef<HTMLInputElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const activeStep = steps[activeIdx] ?? steps[0]

  /* ── Sync contenteditable → state ── */
  const syncBody = useCallback((nextSteps?: Step[]) => {
    if (!bodyRef.current) return
    const html = bodyRef.current.innerHTML
    const updated = (nextSteps ?? steps).map((s, i) =>
      i === activeIdx ? { ...s, body: html } : s
    )
    setSteps(updated)
    return updated
  }, [steps, activeIdx])

  /* ── Persist ── */
  const persist = useCallback(async (nextSteps: Step[]) => {
    setSaving(true)
    const [main, ...extras] = nextSteps
    await onUpdate({
      subject: main.subject,
      body:    main.body,
      design:  JSON.stringify(extras),
    })
    setSaving(false)
  }, [onUpdate])

  const schedulePersist = useCallback((nextSteps: Step[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => persist(nextSteps), 900)
  }, [persist])

  /* ── When active step changes, push its body HTML into the editor ── */
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.innerHTML = steps[activeIdx]?.body ?? ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx])

  /* ── Step mutators ── */
  const updateSubject = (subject: string) => {
    const next = steps.map((s, i) => i === activeIdx ? { ...s, subject } : s)
    setSteps(next)
    schedulePersist(next)
  }

  const onBodyInput = () => {
    const updated = syncBody()
    if (updated) schedulePersist(updated)
  }

  const addStep = () => {
    const updated = syncBody() ?? steps
    const next: Step[] = [
      ...updated,
      { id: crypto.randomUUID(), subject: `E-posta ${updated.length + 1}`, body: '' },
    ]
    setSteps(next)
    setActiveIdx(next.length - 1)
    schedulePersist(next)
  }

  const deleteStep = (idx: number) => {
    if (idx === 0) return
    const updated = syncBody() ?? steps
    const next = updated.filter((_, i) => i !== idx)
    setSteps(next)
    const nextIdx = Math.min(activeIdx, next.length - 1)
    setActiveIdx(nextIdx)
    schedulePersist(next)
  }

  /* ── Drag-and-drop step reordering ── */
  const dragStepRef = useRef<number | null>(null)

  const onStepDragStart = (idx: number) => { dragStepRef.current = idx }
  const onStepDragOver  = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    setDragOverIdx(idx)
  }
  const onStepDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    const from = dragStepRef.current
    if (from === null || from === idx) { setDragOverIdx(null); return }
    const updated = syncBody() ?? steps
    const next = [...updated]
    const [moved] = next.splice(from, 1)
    next.splice(idx, 0, moved)
    setSteps(next)
    setActiveIdx(idx)
    setDragOverIdx(null)
    schedulePersist(next)
  }

  /* ── execCommand helpers ── */
  const execCmd = (cmd: string, value?: string) => {
    restoreSelection(savedRangeRef.current)
    document.execCommand(cmd, false, value)
    bodyRef.current?.focus()
    onBodyInput()
  }

  const handleBold = () => execCmd('bold')

  const handleLink = () => {
    if (!showLink) {
      savedRangeRef.current = saveSelection()
      setShowLink(true)
      setLinkUrl('')
      return
    }
    execCmd('createLink', linkUrl || 'https://')
    setShowLink(false)
    setLinkUrl('')
  }

  const handleCode = () => {
    restoreSelection(savedRangeRef.current)
    const sel = window.getSelection()
    const selected = sel && sel.rangeCount > 0 ? sel.toString() : ''
    const html = `<code style="font-family:monospace;background:rgba(0,0,0,0.06);padding:1px 4px;border-radius:3px">${selected || 'kod'}</code>`
    document.execCommand('insertHTML', false, html)
    bodyRef.current?.focus()
    onBodyInput()
  }

  const handleEmoji = (emoji: string) => {
    restoreSelection(savedRangeRef.current)
    document.execCommand('insertText', false, emoji)
    bodyRef.current?.focus()
    setShowEmoji(false)
    onBodyInput()
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      restoreSelection(savedRangeRef.current)
      document.execCommand('insertImage', false, base64)
      bodyRef.current?.focus()
      onBodyInput()
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  /* ── Variable drag-and-drop ── */
  const onVarDragStart = (e: React.DragEvent, variable: string) => {
    e.dataTransfer.setData('text/plain', variable)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const onEditorDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const variable = e.dataTransfer.getData('text/plain')
    if (!variable) return
    bodyRef.current?.focus()
    document.execCommand('insertText', false, variable)
    onBodyInput()
  }

  const insertVarInSubject = (variable: string) => {
    const el = subjectRef.current
    if (!el) return
    const s = el.selectionStart ?? activeStep.subject.length
    const e = el.selectionEnd   ?? activeStep.subject.length
    const newSubject = activeStep.subject.slice(0, s) + variable + activeStep.subject.slice(e)
    updateSubject(newSubject)
    requestAnimationFrame(() => {
      if (subjectRef.current) {
        subjectRef.current.focus()
        subjectRef.current.setSelectionRange(s + variable.length, s + variable.length)
      }
    })
  }

  /* ── AI Generate ── */
  const handleAI = async () => {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/ai/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        campaign.name,
          storeName:   campaign.name,
          subject:     activeStep.subject,
          segment:     campaign.segment,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      const data = await res.json() as { subject?: string; body?: string }
      const next = steps.map((s, i) => {
        if (i !== activeIdx) return s
        return {
          ...s,
          subject: data.subject ?? s.subject,
          body:    data.body    ?? s.body,
        }
      })
      setSteps(next)
      if (bodyRef.current && data.body) bodyRef.current.innerHTML = data.body
      schedulePersist(next)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'İçerik üretilemedi'
      setAiError(msg)
      setTimeout(() => setAiError(null), 4000)
    } finally {
      setAiLoading(false)
    }
  }

  /* ── Render ── */
  return (
    <div className="flex min-h-0" style={{ height: 'calc(100vh - 112px)' }}>

      {/* Left: step list */}
      <div className="w-64 shrink-0 border-r flex flex-col"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <div className="px-4 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--text-secondary)' }}>E-postalar</p>
          {saving && <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--text-muted)' }} />}
        </div>

        <div className="flex-1 overflow-auto py-2 px-2 space-y-1">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              draggable
              onDragStart={() => onStepDragStart(idx)}
              onDragOver={e => onStepDragOver(e, idx)}
              onDrop={e => onStepDrop(e, idx)}
              className={cn(
                'flex items-center gap-1 rounded-xl transition-all group',
                dragOverIdx === idx ? 'ring-2 ring-[#2563EB]' : '',
              )}
            >
              <GripVertical className="w-3 h-3 ml-1 cursor-grab shrink-0 opacity-0 group-hover:opacity-40"
                style={{ color: 'var(--text-muted)' }} />
              <button
                onClick={() => {
                  const updated = syncBody() ?? steps
                  setSteps(updated)
                  setActiveIdx(idx)
                }}
                className={cn(
                  'flex-1 flex items-center gap-2.5 px-2 py-2.5 rounded-xl text-left transition-all',
                  activeIdx === idx
                    ? 'bg-[#EFF6FF] text-[#2563EB]'
                    : 'hover:bg-[var(--bg-hover)]',
                )}
                style={{ color: activeIdx === idx ? '#2563EB' : 'var(--text-primary)' }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold"
                  style={{
                    background: activeIdx === idx ? '#2563EB' : 'var(--bg-hover)',
                    color: activeIdx === idx ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold truncate">
                    {step.subject || `E-posta ${idx + 1}`}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                    {step.body ? step.body.replace(/<[^>]+>/g, '').slice(0, 30) + '…' : 'İçerik yok'}
                  </p>
                </div>
                {idx > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); deleteStep(idx) }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#EF4444] hover:bg-[#FEF2F2] transition-all shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                {activeIdx === idx && <ChevronRight className="w-3 h-3 shrink-0 text-[#2563EB]" />}
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={addStep}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed text-[12px] font-semibold transition-all hover:border-[#2563EB] hover:text-[#2563EB] hover:bg-[#EFF6FF]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Adım Ekle
          </button>
        </div>
      </div>

      {/* Right: editor */}
      <div className="flex-1 overflow-auto flex flex-col" style={{ background: 'var(--bg-app)' }}>
        {activeStep ? (
          <div className="max-w-2xl mx-auto w-full p-6 space-y-4">

            {/* Subject */}
            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: 'var(--text-secondary)' }}>
                Konu Satırı
              </label>
              <input
                ref={subjectRef}
                value={activeStep.subject}
                onChange={e => updateSubject(e.target.value)}
                placeholder="E-posta konusu…"
                className="w-full px-3.5 py-2.5 rounded-xl border text-[14px] font-medium placeholder-[#D1D5DB] outline-none transition-all"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#2563EB66')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Değişken:</span>
                {VARS.map(v => (
                  <button
                    key={v}
                    type="button"
                    draggable
                    onDragStart={e => onVarDragStart(e, v)}
                    onClick={() => insertVarInSubject(v)}
                    className="px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors cursor-grab"
                    style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Body editor card */}
            <div className="rounded-xl overflow-visible" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

              {/* Toolbar */}
              <div className="px-3 py-2 border-b flex items-center gap-0.5 relative"
                style={{ borderColor: 'var(--border)' }}>

                {/* Emoji */}
                <div className="relative">
                  <TBtn title="Emoji ekle" onClick={() => {
                    savedRangeRef.current = saveSelection()
                    setShowEmoji(p => !p)
                    setShowLink(false)
                  }}>
                    <Smile className="w-4 h-4" />
                  </TBtn>
                  {showEmoji && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowEmoji(false)} />
                      <div className="absolute left-0 top-8 z-20 rounded-xl shadow-xl p-2 w-52"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <div className="grid grid-cols-6 gap-1">
                          {EMOJIS.map(em => (
                            <button
                              key={em}
                              onMouseDown={e => { e.preventDefault(); handleEmoji(em) }}
                              className="text-[18px] p-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors leading-none"
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Bold */}
                <TBtn title="Kalın" onClick={handleBold}>
                  <Bold className="w-4 h-4" />
                </TBtn>

                {/* Link */}
                <div className="relative">
                  <TBtn title="Link ekle" onClick={() => {
                    if (!showLink) savedRangeRef.current = saveSelection()
                    setShowLink(p => !p)
                    setShowEmoji(false)
                  }}>
                    <Link2 className="w-4 h-4" />
                  </TBtn>
                  {showLink && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowLink(false)} />
                      <div className="absolute left-0 top-8 z-20 rounded-xl shadow-xl p-3 w-64"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Link URL</p>
                        <input
                          autoFocus
                          value={linkUrl}
                          onChange={e => setLinkUrl(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleLink()}
                          placeholder="https://..."
                          className="w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                          style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onMouseDown={e => { e.preventDefault(); handleLink() }}
                            className="flex-1 py-1.5 rounded-lg bg-[#2563EB] text-white text-[12px] font-semibold"
                          >
                            Ekle
                          </button>
                          <button
                            onClick={() => setShowLink(false)}
                            className="flex-1 py-1.5 rounded-lg text-[12px] font-semibold"
                            style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Code */}
                <TBtn title="Kod" onClick={handleCode}>
                  <Code2 className="w-4 h-4" />
                </TBtn>

                {/* Image */}
                <TBtn title="Görsel ekle" onClick={() => {
                  savedRangeRef.current = saveSelection()
                  imageRef.current?.click()
                }}>
                  <ImageIcon className="w-4 h-4" />
                </TBtn>
                <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

                <div className="flex-1" />

                {/* AI Write */}
                <button
                  type="button"
                  onClick={handleAI}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#7C3AED] bg-[#F5F3FF] hover:bg-[#EDE9FE] transition-colors disabled:opacity-50"
                >
                  {aiLoading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Sparkles className="w-3.5 h-3.5" />}
                  AI Yaz
                </button>
              </div>

              {/* contenteditable body */}
              <div
                ref={bodyRef}
                contentEditable
                suppressContentEditableWarning
                onInput={onBodyInput}
                onBlur={() => { savedRangeRef.current = saveSelection() }}
                onDrop={onEditorDrop}
                onDragOver={e => e.preventDefault()}
                className="w-full px-4 py-3 text-[14px] outline-none leading-relaxed min-h-[400px]"
                style={{
                  color: 'var(--text-primary)',
                  background: 'var(--bg-card)',
                }}
                data-placeholder="E-posta içeriğini buraya yazın…"
              />
            </div>

            {/* Body variable chips (draggable) */}
            <div className="flex items-center gap-1.5 -mt-2 flex-wrap">
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Değişken sürükle veya tıkla:</span>
              {VARS.map(v => (
                <button
                  key={v}
                  type="button"
                  draggable
                  onDragStart={e => onVarDragStart(e, v)}
                  onMouseDown={e => {
                    e.preventDefault()
                    restoreSelection(savedRangeRef.current)
                    document.execCommand('insertText', false, v)
                    bodyRef.current?.focus()
                    onBodyInput()
                  }}
                  className="px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors cursor-grab active:cursor-grabbing"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* AI error */}
            {aiError && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[12px] text-[#DC2626]">
                <span>⚠</span>
                <span>AI içerik üretilemedi: {aiError}</span>
              </div>
            )}

            {/* Hint */}
            <div className="flex items-start gap-2.5 p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl">
              <Mail className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
              <p className="text-[12px] text-[#3B82F6] leading-relaxed">
                Değişkenleri sürükleyip editöre bırakın. Görsel eklemek için araç çubuğundaki{' '}
                <strong>görsel</strong> ikonunu kullanın.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Düzenlemek için bir adım seçin</p>
          </div>
        )}
      </div>
    </div>
  )
}
