'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Send, Bot, User, X, ChevronRight, Tag, FileText, ShoppingBag, MessageSquare, Plus, Zap, FlaskConical } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ConvStatus = 'AI_HANDLING' | 'HUMAN_TAKEOVER' | 'CLOSED'

interface ConvItem {
  id: string
  phone: string
  name: string | null
  lastMessage: string
  lastMessageAt: string
  status: ConvStatus
  aiActive: boolean
  messages: MsgItem[]
}

interface MsgItem {
  id: string
  role: 'customer' | 'assistant'
  body: string
  timestamp: string
}

interface CustomerProfile {
  id: string
  name: string
  email: string
  phone: string | null
  segment: string
  totalOrders: number
  totalSpent: number
  avgOrder: number
  lastOrder: string | null
  riskScore: string
  score: number
  tags: string
  source: string
}

interface OrderItem {
  title: string
  quantity: number
  price: number
  variantTitle: string | null
  imageUrl: string | null
}

interface Order {
  id: string
  orderNumber: string | null
  status: string
  financialStatus: string | null
  total: number
  currency: string
  placedAt: string
  items: OrderItem[]
  shippingCity: string | null
}

interface AiLog {
  id: string
  intent: string | null
  confidence: number | null
  knowledgeSource: string | null
  faqMatched: string | null
  orderDataUsed: boolean
  transferred: boolean
  transferReason: string | null
  action: string | null
  responsePreview: string | null
  createdAt: string
}

interface Note {
  id: string
  note: string
  createdBy: string
  createdAt: string
}

interface TagItem {
  id: string
  name: string
  color: string
}

interface QuickReply {
  id: string
  title: string
  responseText: string
}

// ─── Default tags ─────────────────────────────────────────────────────────────

const DEFAULT_TAGS: Array<{ name: string; color: string }> = [
  { name: 'Satış', color: '#22c97a' },
  { name: 'Destek', color: '#4470ff' },
  { name: 'İade', color: '#f0a020' },
  { name: 'Şikayet', color: '#e84545' },
  { name: 'VIP', color: '#9f7afa' },
  { name: 'Riskli', color: '#e84545' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}dk`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}sa`
  return `${Math.floor(diff / 86400000)}g`
}

function initials(name: string | null, phone: string) {
  if (name) return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  return phone.slice(-2)
}

function fmtMoney(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function statusLabel(s: ConvStatus) {
  if (s === 'AI_HANDLING') return 'AI Aktif'
  if (s === 'HUMAN_TAKEOVER') return 'Temsilci'
  return 'Kapalı'
}

function statusColor(s: ConvStatus) {
  if (s === 'AI_HANDLING') return { bg: 'rgba(159,122,250,0.12)', text: '#9f7afa', border: 'rgba(159,122,250,0.25)' }
  if (s === 'HUMAN_TAKEOVER') return { bg: 'rgba(240,160,32,0.12)', text: '#f0a020', border: 'rgba(240,160,32,0.25)' }
  return { bg: 'rgba(128,128,160,0.1)', text: '#8080a0', border: 'rgba(128,128,160,0.2)' }
}

function riskLabel(r: string) {
  if (r === 'high') return { label: 'Yüksek Risk', color: '#e84545' }
  if (r === 'medium') return { label: 'Orta Risk', color: '#f0a020' }
  return { label: 'Düşük Risk', color: '#22c97a' }
}

function orderStatusLabel(s: string) {
  const m: Record<string, string> = {
    pending: 'Beklemede', confirmed: 'Onaylandı', shipped: 'Kargoda',
    delivered: 'Teslim Edildi', cancelled: 'İptal', refunded: 'İade',
  }
  return m[s] ?? s
}

function segmentLabel(s: string) {
  const m: Record<string, string> = {
    new: 'Yeni', vip: 'VIP', loyal: 'Sadık', at_risk: 'Risk Altında',
    champion: 'Şampiyon', promising: 'Gelişen', lost: 'Kayıp',
  }
  return m[s] ?? s
}

// ─── Filter tabs ─────────────────────────────────────────────────────────────

type FilterKey = '' | 'AI_HANDLING' | 'HUMAN_TAKEOVER' | 'CLOSED'

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: '', label: 'Tümü' },
  { key: 'AI_HANDLING', label: 'AI' },
  { key: 'HUMAN_TAKEOVER', label: 'Temsilci' },
  { key: 'CLOSED', label: 'Kapalı' },
]

// ─── Right panel tabs ─────────────────────────────────────────────────────────

type RightTab = 'profile' | 'orders' | 'ai-logs' | 'notes' | 'tags'

const RIGHT_TABS: Array<{ key: RightTab; label: string; Icon: React.ElementType }> = [
  { key: 'profile', label: 'Profil', Icon: User },
  { key: 'orders', label: 'Siparişler', Icon: ShoppingBag },
  { key: 'ai-logs', label: 'AI', Icon: Bot },
  { key: 'notes', label: 'Notlar', Icon: FileText },
  { key: 'tags', label: 'Etiketler', Icon: Tag },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConvItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MsgItem[]>([])
  const [msgLoading, setMsgLoading] = useState(false)
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [aiLogs, setAiLogs] = useState<AiLog[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [convTags, setConvTags] = useState<TagItem[]>([])
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [rightTab, setRightTab] = useState<RightTab>('profile')
  const [rightOpen, setRightOpen] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [seedingTest, setSeedingTest] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const selected = conversations.find(c => c.id === selectedId) ?? null

  // ── Load conversations ──
  const loadConversations = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/whatsapp/inbox')
      if (r.ok) {
        const d = await r.json()
        const convs: ConvItem[] = d.conversations ?? []
        setConversations(convs)
        setSelectedId(prev => {
          if (prev) return prev
          if (convs.length > 0) { setRightOpen(true); return convs[0].id }
          return null
        })
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  // ── Load quick replies once ──
  useEffect(() => {
    fetch('/api/whatsapp/quick-replies')
      .then(r => r.ok ? r.json() : { replies: [] })
      .then(d => setQuickReplies(d.replies ?? []))
      .catch(() => {})
  }, [])

  // ── Load conversation data when selected ──
  useEffect(() => {
    if (!selectedId) return
    setMessages([])
    setCustomer(null)
    setOrders([])
    setAiLogs([])
    setNotes([])
    setConvTags([])
    setAiSuggestions([])

    const base = `/api/whatsapp/inbox/conversations/${selectedId}`

    setMsgLoading(true)
    Promise.all([
      fetch(`${base}/messages`).then(r => r.ok ? r.json() : { messages: [] }),
      fetch(`${base}/customer`).then(r => r.ok ? r.json() : { customer: null }),
      fetch(`${base}/orders`).then(r => r.ok ? r.json() : { orders: [] }),
      fetch(`${base}/ai-logs`).then(r => r.ok ? r.json() : { logs: [] }),
      fetch(`${base}/notes`).then(r => r.ok ? r.json() : { notes: [] }),
      fetch(`${base}/tags`).then(r => r.ok ? r.json() : { tags: [] }),
    ]).then(([msgs, cust, ords, logs, nts, tgs]) => {
      const mapped = (msgs.messages ?? []).map((m: { id: string; direction: string; content: string; sentAt: string }) => ({
        id: m.id,
        role: m.direction === 'INBOUND' ? 'customer' : 'assistant',
        body: m.content ?? '',
        timestamp: m.sentAt,
      })) as MsgItem[]
      setMessages(mapped)
      setCustomer(cust.customer ?? null)
      setOrders(ords.orders ?? [])
      setAiLogs(logs.logs ?? [])
      setNotes(nts.notes ?? [])
      setConvTags(tgs.tags ?? [])
    }).catch(() => {}).finally(() => setMsgLoading(false))
  }, [selectedId])

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Load AI suggestions (human mode) ──
  useEffect(() => {
    if (!selected || selected.status !== 'HUMAN_TAKEOVER' || messages.length === 0) {
      setAiSuggestions([])
      return
    }
    setSuggestLoading(true)
    fetch('/api/whatsapp/ai/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: selected.id, messages }),
    })
      .then(r => r.ok ? r.json() : { suggestions: [] })
      .then(d => setAiSuggestions(d.suggestions ?? []))
      .catch(() => {})
      .finally(() => setSuggestLoading(false))
  }, [selectedId, selected?.status, messages.length > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Status change ──
  async function changeStatus(action: 'takeover' | 'release-ai' | 'close') {
    if (!selectedId) return
    const r = await fetch(`/api/whatsapp/inbox/conversations/${selectedId}/${action}`, { method: 'POST' })
    if (r.ok) {
      const d = await r.json()
      const newStatus: ConvStatus = d.status
      setConversations(prev => prev.map(c => c.id === selectedId
        ? { ...c, status: newStatus, aiActive: newStatus === 'AI_HANDLING' }
        : c
      ))
    }
  }

  // ── Send message ──
  async function handleSend() {
    if (!selectedId || !reply.trim()) return
    setSending(true)
    const text = reply.trim()
    const tempMsg: MsgItem = { id: `tmp-${Date.now()}`, role: 'assistant', body: text, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, tempMsg])
    setReply('')
    setShowQR(false)
    try {
      await fetch(`/api/whatsapp/inbox/${selectedId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      setConversations(prev => prev.map(c => c.id === selectedId
        ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() }
        : c
      ))
    } catch { /* ignore */ } finally { setSending(false) }
  }

  // ── Add note ──
  async function handleAddNote() {
    if (!selectedId || !newNote.trim()) return
    setAddingNote(true)
    try {
      const r = await fetch(`/api/whatsapp/inbox/conversations/${selectedId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() }),
      })
      if (r.ok) {
        const d = await r.json()
        setNotes(prev => [d.note, ...prev])
        setNewNote('')
      }
    } catch { /* ignore */ } finally { setAddingNote(false) }
  }

  // ── Add tag ──
  async function handleAddTag(name: string, color: string) {
    if (!selectedId) return
    const r = await fetch(`/api/whatsapp/inbox/conversations/${selectedId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })
    if (r.ok) {
      const freshTags = await fetch(`/api/whatsapp/inbox/conversations/${selectedId}/tags`).then(r => r.json())
      setConvTags(freshTags.tags ?? [])
    }
  }

  // ── Remove tag ──
  async function handleRemoveTag(tagId: string) {
    if (!selectedId) return
    await fetch(`/api/whatsapp/inbox/conversations/${selectedId}/tags`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId }),
    })
    setConvTags(prev => prev.filter(t => t.id !== tagId))
  }

  // ── Create test conversation ──
  async function handleSeedTest() {
    setSeedingTest(true)
    try {
      const r = await fetch('/api/whatsapp/inbox/seed-test', { method: 'POST' })
      if (r.ok) {
        const d = await r.json()
        await loadConversations()
        if (d.conversationId) {
          setSelectedId(d.conversationId)
          setRightOpen(true)
        }
      }
    } catch { /* ignore */ } finally { setSeedingTest(false) }
  }

  const filtered = conversations.filter(c => filter === '' || c.status === filter)
  const openCount = conversations.filter(c => c.status !== 'CLOSED').length
  const humanCount = conversations.filter(c => c.status === 'HUMAN_TAKEOVER').length

  // ─── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', padding: '0', overflow: 'hidden' }}>

      {/* Page header */}
      <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 2px' }}>Inbox</h1>
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>WhatsApp müşteri sohbetlerini yönetin</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <StatChip value={openCount} label="açık" color="var(--green)" />
            <StatChip value={humanCount} label="temsilci" color="#f0a020" />
            <StatChip value={conversations.length} label="toplam" color="var(--text-2)" />
          </div>
        </div>
      </div>

      {/* 3-col layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left: conversation list ────────────────────────────────────────── */}
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {FILTERS.map(f => {
              const active = filter === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    flex: 1, padding: '10px 4px', fontSize: 11, fontWeight: active ? 700 : 400,
                    color: active ? 'var(--text-1)' : 'var(--text-3)',
                    background: 'none', border: 'none',
                    borderBottom: active ? '2px solid var(--blue)' : '2px solid transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >{f.label}</button>
              )
            })}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <ConvSkeleton key={i} />)
            ) : filtered.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <MessageSquare size={28} style={{ color: 'var(--text-3)', margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 14px' }}>
                  {filter ? 'Bu filtrede konuşma yok' : 'Henüz konuşma yok'}
                </p>
                {!filter && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button
                      onClick={handleSeedTest}
                      disabled={seedingTest}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.25)', color: 'var(--blue)', cursor: 'pointer', fontSize: 11, fontWeight: 600, width: '100%', justifyContent: 'center' }}
                    >
                      {seedingTest ? <Loader2 size={11} className="animate-spin" /> : <FlaskConical size={11} />}
                      Test Konuşması Oluştur
                    </button>
                    <a
                      href="/whatsapp/connection"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: 'rgba(34,201,122,0.08)', border: '1px solid rgba(34,201,122,0.2)', color: 'var(--green)', cursor: 'pointer', fontSize: 11, fontWeight: 600, textDecoration: 'none', justifyContent: 'center' }}
                    >
                      <Zap size={11} />
                      WhatsApp Bağla
                    </a>
                  </div>
                )}
              </div>
            ) : filtered.map(c => {
              const sc = statusColor(c.status)
              const active = selectedId === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => { setSelectedId(c.id); setRightOpen(false) }}
                  style={{
                    padding: '12px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    background: active ? 'rgba(68,112,255,0.08)' : 'transparent',
                    borderLeft: `3px solid ${active ? 'var(--blue)' : 'transparent'}`,
                    display: 'flex', gap: 10, alignItems: 'flex-start', transition: 'background 0.1s',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: 'rgba(68,112,255,0.12)',
                    color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0, position: 'relative',
                  }}>
                    {initials(c.name, c.phone)}
                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: sc.text, border: '1.5px solid var(--bg)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name ?? c.phone}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{relTime(c.lastMessageAt)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-2)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.lastMessage || '—'}</p>
                      {c.status === 'AI_HANDLING' && <Bot size={10} style={{ color: '#9f7afa', flexShrink: 0 }} />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Middle: message panel ─────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <MessageSquare size={48} style={{ color: 'var(--text-3)' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 4px' }}>Konuşma seçin</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Sol listeden bir konuşmaya tıklayın</p>
              </div>
              {conversations.length === 0 && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={handleSeedTest}
                    disabled={seedingTest}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.3)', color: 'var(--blue)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    {seedingTest ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
                    Test Konuşması Oluştur
                  </button>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>Gerçek verilerle dolu örnek konuşma oluşturur</p>
                  <a
                    href="/whatsapp/connection"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(34,201,122,0.08)', border: '1px solid rgba(34,201,122,0.2)', color: 'var(--green)', cursor: 'pointer', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
                  >
                    <Zap size={12} />
                    WhatsApp Webhook Test Et
                  </a>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 12 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selected.name ?? selected.phone}
                    </span>
                    <StatusBadge status={selected.status} />
                  </div>
                  {selected.name && <p style={{ fontSize: 11, color: 'var(--text-2)', margin: '2px 0 0' }}>{selected.phone}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {selected.status !== 'HUMAN_TAKEOVER' && selected.status !== 'CLOSED' && (
                    <ActionBtn onClick={() => changeStatus('takeover')} label="Devral" color="#f0a020" />
                  )}
                  {selected.status === 'HUMAN_TAKEOVER' && (
                    <ActionBtn onClick={() => changeStatus('release-ai')} label="AI'a Ver" color="#9f7afa" />
                  )}
                  {selected.status !== 'CLOSED' && (
                    <ActionBtn onClick={() => changeStatus('close')} label="Kapat" color="var(--text-3)" />
                  )}
                  <button
                    onClick={() => setRightOpen(o => !o)}
                    style={{ padding: '6px 10px', borderRadius: 7, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                  >
                    <User size={12} /> Profil
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {msgLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
                    <Loader2 size={20} style={{ color: 'var(--text-3)' }} className="animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', paddingTop: 60 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Henüz mesaj yok</p>
                  </div>
                ) : messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'customer' ? 'flex-start' : 'flex-end' }}>
                    <div style={{
                      maxWidth: '72%', padding: '8px 12px',
                      borderRadius: msg.role === 'customer' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      background: msg.role === 'customer' ? 'var(--surface)' : 'rgba(68,112,255,0.18)',
                      border: `1px solid ${msg.role === 'customer' ? 'var(--border)' : 'rgba(68,112,255,0.25)'}`,
                    }}>
                      <p style={{ fontSize: 13, color: 'var(--text-1)', margin: '0 0 3px', lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.body}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-3)', margin: 0, textAlign: msg.role === 'customer' ? 'left' : 'right' }}>{fmtTime(msg.timestamp)}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* AI suggestions (human mode) */}
              {selected.status === 'HUMAN_TAKEOVER' && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Bot size={12} style={{ color: '#9f7afa' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>AI Önerileri</span>
                    {suggestLoading && <Loader2 size={10} style={{ color: 'var(--text-3)' }} className="animate-spin" />}
                  </div>
                  {aiSuggestions.length === 0 && !suggestLoading ? (
                    <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>Öneri oluşturuluyor…</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {aiSuggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setReply(s)}
                          style={{
                            textAlign: 'left', padding: '7px 10px', borderRadius: 8, fontSize: 12,
                            background: 'rgba(159,122,250,0.07)', border: '1px solid rgba(159,122,250,0.15)',
                            color: 'var(--text-1)', cursor: 'pointer', lineHeight: 1.4,
                            display: 'flex', alignItems: 'flex-start', gap: 8,
                          }}
                        >
                          <ChevronRight size={12} style={{ color: '#9f7afa', flexShrink: 0, marginTop: 1 }} />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Quick replies popup */}
              {showQR && quickReplies.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '8px 16px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>Hızlı Yanıtlar</span>
                    <button onClick={() => setShowQR(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={12} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 140, overflowY: 'auto' }}>
                    {quickReplies.map(qr => (
                      <button
                        key={qr.id}
                        onClick={() => { setReply(qr.responseText); setShowQR(false) }}
                        style={{
                          textAlign: 'left', padding: '6px 10px', borderRadius: 7, fontSize: 12,
                          background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)', cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--blue)', marginRight: 6 }}>{qr.title}</span>
                        <span style={{ color: 'var(--text-2)' }}>{qr.responseText.slice(0, 60)}{qr.responseText.length > 60 ? '…' : ''}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply bar */}
              {selected.status !== 'CLOSED' && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
                  {selected.status === 'HUMAN_TAKEOVER' ? (
                    <>
                      <button
                        onClick={() => setShowQR(o => !o)}
                        title="Hızlı yanıtlar"
                        style={{ padding: '9px 10px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0 }}
                      >
                        <MessageSquare size={14} />
                      </button>
                      <textarea
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="Yanıt yazın… (Enter gönderin, Shift+Enter yeni satır)"
                        rows={1}
                        style={{
                          flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
                          padding: '9px 12px', fontSize: 13, color: 'var(--text-1)', outline: 'none', resize: 'none',
                          fontFamily: 'inherit', lineHeight: 1.4, maxHeight: 100, overflowY: 'auto',
                        }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={sending || !reply.trim()}
                        style={{ padding: '9px 14px', borderRadius: 8, background: 'var(--blue)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: !reply.trim() ? 0.4 : 1, flexShrink: 0 }}
                      >
                        {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(159,122,250,0.07)', borderRadius: 8, border: '1px solid rgba(159,122,250,0.15)' }}>
                      <Bot size={13} style={{ color: '#9f7afa', flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>AI otomatik yanıt veriyor. Manuel yanıt için <button onClick={() => changeStatus('takeover')} style={{ background: 'none', border: 'none', color: '#f0a020', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0 }}>Devral</button> düğmesine tıklayın.</span>
                    </div>
                  )}
                </div>
              )}
              {selected.status === 'CLOSED' && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>Bu konuşma kapatıldı.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Right: customer panel ─────────────────────────────────────────── */}
        {selected && (
          <div style={{
            width: rightOpen ? 340 : 0,
            flexShrink: 0,
            borderLeft: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.2s ease',
          }}>
            <div style={{ width: 340, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Right panel header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{selected.name ?? selected.phone}</span>
                <button onClick={() => setRightOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
                  <X size={14} />
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, overflowX: 'auto' }}>
                {RIGHT_TABS.map(t => {
                  const active = rightTab === t.key
                  return (
                    <button
                      key={t.key}
                      onClick={() => setRightTab(t.key)}
                      style={{
                        flex: 1, padding: '8px 4px', fontSize: 10, fontWeight: active ? 700 : 400,
                        color: active ? 'var(--text-1)' : 'var(--text-3)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        borderBottom: active ? '2px solid var(--blue)' : '2px solid transparent',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      }}
                    >
                      <t.Icon size={12} />
                      {t.label}
                    </button>
                  )
                })}
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

                {/* Profile tab */}
                {rightTab === 'profile' && (
                  <ProfileTab customer={customer} phone={selected.phone} />
                )}

                {/* Orders tab */}
                {rightTab === 'orders' && (
                  <OrdersTab orders={orders} />
                )}

                {/* AI logs tab */}
                {rightTab === 'ai-logs' && (
                  <AiLogsTab logs={aiLogs} />
                )}

                {/* Notes tab */}
                {rightTab === 'notes' && (
                  <NotesTab
                    notes={notes}
                    newNote={newNote}
                    setNewNote={setNewNote}
                    addingNote={addingNote}
                    onAdd={handleAddNote}
                  />
                )}

                {/* Tags tab */}
                {rightTab === 'tags' && (
                  <TagsTab
                    convTags={convTags}
                    onRemove={handleRemoveTag}
                    onAdd={handleAddTag}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: if no right panel open but selected, show toggle */}
      {selected && !rightOpen && (
        <button
          onClick={() => setRightOpen(true)}
          style={{
            position: 'fixed', bottom: 80, right: 20, zIndex: 50,
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--blue)', color: '#fff', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(68,112,255,0.4)',
          }}
        >
          <User size={18} />
        </button>
      )}
    </div>
  )
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
    </div>
  )
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ConvStatus }) {
  const sc = statusColor(status)
  return (
    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, flexShrink: 0 }}>
      {statusLabel(status)}
    </span>
  )
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionBtn({ onClick, label, color }: { onClick: () => void; label: string; color: string }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: '6px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, color, background: 'var(--bg)', border: `1px solid ${color}33`, cursor: 'pointer' }}
    >
      {label}
    </button>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ConvSkeleton() {
  return (
    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 11, background: 'var(--surface)', borderRadius: 4, width: 100, marginBottom: 6 }} />
        <div style={{ height: 10, background: 'var(--surface)', borderRadius: 4, width: 150 }} />
      </div>
    </div>
  )
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

function ProfileTab({ customer, phone }: { customer: CustomerProfile | null; phone: string }) {
  if (!customer) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <User size={32} style={{ color: 'var(--text-3)', margin: '0 auto 8px', display: 'block' }} />
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 4px' }}>Müşteri kaydı bulunamadı</p>
        <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>Telefon: {phone}</p>
      </div>
    )
  }

  const risk = riskLabel(customer.riskScore)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Identity */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(68,112,255,0.12)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
            {customer.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{customer.name}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-2)' }}>{customer.email}</p>
          </div>
        </div>
        {customer.phone && <InfoRow label="Telefon" value={customer.phone} />}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: 'rgba(68,112,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(68,112,255,0.2)' }}>
            {segmentLabel(customer.segment)}
          </span>
          <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: `${risk.color}15`, color: risk.color, border: `1px solid ${risk.color}33` }}>
            {risk.label}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, border: '1px solid var(--border)' }}>
        <MetricCell label="Toplam Sipariş" value={String(customer.totalOrders)} />
        <MetricCell label="Toplam Harcama" value={`${fmtMoney(customer.totalSpent)} ₺`} />
        <MetricCell label="Ort. Sipariş" value={`${fmtMoney(customer.avgOrder)} ₺`} />
        <MetricCell label="Son Sipariş" value={customer.lastOrder ? fmtDate(customer.lastOrder) : '—'} />
      </div>

      <InfoRow label="Kaynak" value={customer.source} />
      <InfoRow label="Müşteri Skoru" value={`${customer.score}/100`} />
    </div>
  )
}

// ─── Orders tab ───────────────────────────────────────────────────────────────

function OrdersTab({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <ShoppingBag size={32} style={{ color: 'var(--text-3)', margin: '0 auto 8px', display: 'block' }} />
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Bu müşteriye ait sipariş bulunamadı.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {orders.map(o => {
        const statusColors: Record<string, string> = {
          delivered: '#22c97a', shipped: '#4470ff', confirmed: '#9f7afa',
          pending: '#f0a020', cancelled: '#e84545', refunded: '#8080a0',
        }
        const sc = statusColors[o.status] ?? '#8080a0'
        return (
          <div key={o.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>#{o.orderNumber ?? o.id.slice(-6)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)' }}>{fmtMoney(o.total)} ₺</span>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
              <Tag2 label={orderStatusLabel(o.status)} color={sc} />
              {o.financialStatus && <Tag2 label={o.financialStatus} color="#8080a0" />}
            </div>
            {o.items.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {o.items.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--text-2)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.quantity}× {item.title}{item.variantTitle ? ` (${item.variantTitle})` : ''}</span>
                    <span>{fmtMoney(item.price)} ₺</span>
                  </div>
                ))}
                {o.items.length > 3 && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>+{o.items.length - 3} ürün daha</span>}
              </div>
            )}
            <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-3)' }}>{fmtDate(o.placedAt)}</p>
          </div>
        )
      })}
    </div>
  )
}

// ─── AI logs tab ─────────────────────────────────────────────────────────────

function AiLogsTab({ logs }: { logs: AiLog[] }) {
  if (logs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <Bot size={32} style={{ color: 'var(--text-3)', margin: '0 auto 8px', display: 'block' }} />
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Bu sohbet için AI karar logu bulunmuyor.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {logs.map(log => (
        <div key={log.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Bot size={11} style={{ color: '#9f7afa' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)' }}>{log.intent ?? 'bilinmiyor'}</span>
            {log.confidence != null && (
              <span style={{ marginLeft: 'auto', fontSize: 10, color: log.confidence > 0.8 ? '#22c97a' : log.confidence > 0.5 ? '#f0a020' : '#e84545', fontWeight: 600 }}>
                {(log.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          {log.faqMatched && <AiLogRow icon="💬" label="FAQ" value={log.faqMatched} />}
          {log.knowledgeSource && <AiLogRow icon="📚" label="Kaynak" value={log.knowledgeSource} />}
          <AiLogRow icon="🛒" label="Sipariş verisi" value={log.orderDataUsed ? 'Kullanıldı' : 'Kullanılmadı'} />
          {log.action && <AiLogRow icon="⚡" label="Aksiyon" value={log.action} />}
          {log.transferred && <AiLogRow icon="👤" label="Transfer" value={log.transferReason ?? 'Temsilciye devredildi'} />}
          {log.responsePreview && (
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-2)', fontStyle: 'italic' }}>"{log.responsePreview.slice(0, 80)}{log.responsePreview.length > 80 ? '…' : ''}"</p>
          )}
          <p style={{ margin: '5px 0 0', fontSize: 10, color: 'var(--text-3)' }}>{fmtDate(log.createdAt)} {fmtTime(log.createdAt)}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Notes tab ────────────────────────────────────────────────────────────────

function NotesTab({ notes, newNote, setNewNote, addingNote, onAdd }: {
  notes: Note[]
  newNote: string
  setNewNote: (v: string) => void
  addingNote: boolean
  onAdd: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="İç not ekle… (müşteriye görünmez)"
          rows={3}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '10px 12px', fontSize: 12, color: 'var(--text-1)', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4, boxSizing: 'border-box' }}
        />
        <div style={{ borderTop: '1px solid var(--border)', padding: '6px 10px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onAdd}
            disabled={!newNote.trim() || addingNote}
            style={{ padding: '5px 12px', borderRadius: 6, background: 'var(--blue)', color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: !newNote.trim() ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {addingNote ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
            Kaydet
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>Henüz not eklenmemiş.</p>
      ) : notes.map(n => (
        <div key={n.id} style={{ background: 'rgba(240,160,32,0.06)', border: '1px solid rgba(240,160,32,0.15)', borderRadius: 8, padding: 10 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-1)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{n.note}</p>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-3)' }}>{n.createdBy} · {fmtDate(n.createdAt)} {fmtTime(n.createdAt)}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Tags tab ────────────────────────────────────────────────────────────────

function TagsTab({ convTags, onRemove, onAdd }: { convTags: TagItem[]; onRemove: (id: string) => void; onAdd: (name: string, color: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bu Sohbetin Etiketleri</p>
        {convTags.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Henüz etiket eklenmemiş.</p>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {convTags.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 20, background: `${t.color}15`, border: `1px solid ${t.color}33` }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: t.color }}>{t.name}</span>
                <button onClick={() => onRemove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.color, padding: 0, display: 'flex', alignItems: 'center' }}>
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Etiket Ekle</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DEFAULT_TAGS.filter(dt => !convTags.some(ct => ct.name === dt.name)).map(dt => (
            <button
              key={dt.name}
              onClick={() => onAdd(dt.name, dt.color)}
              style={{ padding: '4px 10px', borderRadius: 20, background: 'var(--bg)', border: `1px solid ${dt.color}44`, color: dt.color, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Plus size={9} /> {dt.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--text-1)', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ margin: '0 0 2px', fontSize: 10, color: 'var(--text-3)' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{value}</p>
    </div>
  )
}

function Tag2({ label, color }: { label: string; color: string }) {
  return (
    <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: `${color}15`, color, border: `1px solid ${color}30` }}>{label}</span>
  )
}

function AiLogRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 3 }}>
      <span style={{ fontSize: 11 }}>{icon}</span>
      <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{label}:</span>
      <span style={{ fontSize: 10, color: 'var(--text-2)', flex: 1 }}>{value}</span>
    </div>
  )
}
