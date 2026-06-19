'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Bot, Send } from 'lucide-react'

interface Message {
  id: string
  role: 'customer' | 'assistant'
  body: string
  timestamp: string
}

interface Conversation {
  id: string
  phone: string
  name: string | null
  lastMessage: string
  lastMessageAt: string
  status: 'open' | 'closed' | 'human'
  aiActive: boolean
  messages: Message[]
}


function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.floor(diff / 1000)} sn`
  if (diff < 3600000) return `${Math.floor(diff / 60000)} dk`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} sa`
  return `${Math.floor(diff / 86400000)} gün`
}

function initials(name: string | null, phone: string): string {
  if (name) return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  return phone.slice(-2)
}

const FILTERS = [
  { key: '', label: 'Tümü' },
  { key: 'open', label: 'Açık' },
  { key: 'closed', label: 'Kapalı' },
  { key: 'human', label: 'İnsanda' },
] as const

type FilterKey = '' | 'open' | 'closed' | 'human'

const STATUS_DOT: Record<string, string> = {
  open: '#16A34A',
  closed: '#9CA3AF',
  human: '#D97706',
}

function StatChip({ icon, value, label, color = '#6B7280' }: { icon: string; value: string | number; label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 20, padding: '4px 12px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 14, color }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{value}</span>
      <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
    </div>
  )
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('')
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/inbox')
      if (res.ok) {
        const d = await res.json()
        setConversations(d.conversations ?? [])
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [selected])

  const filtered = conversations.filter(c => filter === '' || c.status === filter)

  async function handleToggleAI() {
    if (!selected) return
    const updated = { ...selected, aiActive: !selected.aiActive, status: (!selected.aiActive ? 'open' : 'human') as 'open' | 'closed' | 'human' }
    setSelected(updated)
    setConversations(prev => prev.map(c => c.id === selected.id ? updated : c))
    try {
      await fetch(`/api/whatsapp/inbox/${selected.id}/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiActive: updated.aiActive }),
      })
    } catch { /* ignore */ }
  }

  async function handleSend() {
    if (!selected || !reply.trim()) return
    setSending(true)
    const msg: Message = { id: Date.now().toString(), role: 'assistant', body: reply.trim(), timestamp: new Date().toISOString() }
    const updated = { ...selected, messages: [...selected.messages, msg], lastMessage: reply.trim() }
    setSelected(updated)
    setConversations(prev => prev.map(c => c.id === selected.id ? updated : c))
    setReply('')
    try {
      await fetch(`/api/whatsapp/inbox/${selected.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() }),
      })
    } catch { /* ignore */ } finally { setSending(false) }
  }

  const openCount = conversations.filter(c => c.status === 'open').length
  const humanCount = conversations.filter(c => c.status === 'human').length

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Inbox</h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>WhatsApp müşteri sohbetlerini yönetin</p>
      </div>

      {/* Stat chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatChip icon="inbox" value={conversations.length} label="toplam" />
        <StatChip icon="chat_bubble" value={openCount} label="açık" color="#16A34A" />
        <StatChip icon="person" value={humanCount} label="insanda" color="#D97706" />
      </div>

      {/* Layout: conversation list + message panel */}
      <div style={{ display: 'flex', gap: 12, height: 'calc(100vh - 280px)', minHeight: 400 }}>

        {/* Left: conversation list */}
        <div style={{ width: 320, flexShrink: 0, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', padding: '0 4px' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  flex: 1, padding: '10px 4px', fontSize: 12, fontWeight: filter === f.key ? 600 : 400,
                  color: filter === f.key ? '#111827' : '#6B7280',
                  background: 'none', border: 'none', borderBottom: filter === f.key ? '2px solid #16A34A' : '2px solid transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ padding: '12px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F3F4F6', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, background: '#F3F4F6', borderRadius: 4, width: 100, marginBottom: 6 }} />
                    <div style={{ height: 10, background: '#F3F4F6', borderRadius: 4, width: 150 }} />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                <img src="/whatsapp/empty-inbox.png" alt="Konuşma yok" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, marginBottom: 8, opacity: 0.85 }} />
                <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Konuşma yok</p>
              </div>
            ) : (
              filtered.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelected(c)}
                  style={{
                    padding: '11px 14px', borderBottom: '1px solid #F3F4F6', cursor: 'pointer',
                    background: selected?.id === c.id ? '#F0FDF4' : 'transparent',
                    borderLeft: selected?.id === c.id ? '3px solid #16A34A' : '3px solid transparent',
                    display: 'flex', gap: 10, alignItems: 'flex-start', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (selected?.id !== c.id) e.currentTarget.style.background = '#F9FAFB' }}
                  onMouseLeave={e => { if (selected?.id !== c.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, position: 'relative' }}>
                    {initials(c.name, c.phone)}
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: STATUS_DOT[c.status] ?? '#9CA3AF', border: '1.5px solid #fff' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name ?? c.phone}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{relTime(c.lastMessageAt)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.lastMessage}</p>
                      {c.aiActive && <Bot size={11} style={{ color: '#7C3AED', flexShrink: 0 }} />}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: message panel */}
        <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#D1D5DB' }}>chat_bubble_outline</span>
              <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>Bir konuşma seçin</p>
            </div>
          ) : (
            <>
              {/* Panel header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{selected.name ?? selected.phone}</p>
                  {selected.name && <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{selected.phone}</p>}
                </div>
                <button
                  onClick={handleToggleAI}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: selected.aiActive ? '#EDE9FE' : '#F3F4F6',
                    color: selected.aiActive ? '#7C3AED' : '#6B7280',
                    border: selected.aiActive ? '1px solid #DDD6FE' : '1px solid #E5E7EB',
                  }}
                >
                  <Bot size={13} />
                  {selected.aiActive ? 'AI Aktif' : 'Manuel Mod'}
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selected.messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'customer' ? 'flex-start' : 'flex-end' }}>
                    <div style={{
                      maxWidth: '70%', padding: '8px 12px', borderRadius: msg.role === 'customer' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      background: msg.role === 'customer' ? '#F3F4F6' : '#DCFCE7',
                      color: '#111827',
                    }}>
                      <p style={{ fontSize: 13, color: '#111827', margin: '0 0 3px', lineHeight: 1.4 }}>{msg.body}</p>
                      <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0, textAlign: msg.role === 'customer' ? 'left' : 'right' }}>
                        {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Reply input (manual mode only) */}
              {!selected.aiActive && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 8 }}>
                  <input
                    value={reply} onChange={e => setReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Yanıt yazın…"
                    style={{ flex: 1, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 14px', fontSize: 13, color: '#111827', outline: 'none' }}
                  />
                  <button
                    onClick={handleSend} disabled={sending || !reply.trim()}
                    style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: !reply.trim() ? 0.5 : 1 }}
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              )}
              {selected.aiActive && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bot size={13} style={{ color: '#7C3AED' }} />
                  <span style={{ fontSize: 12, color: '#6B7280' }}>AI aktif — müşteriye otomatik yanıt veriyor. Manuel mod için yukarıdaki düğmeye tıklayın.</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
