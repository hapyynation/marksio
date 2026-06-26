'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Loader2, Send, Bot, User, X, ChevronRight, Tag, FileText,
  ShoppingBag, MessageSquare, Plus, Zap, FlaskConical,
  Search, Check, CheckCheck, Clock, AlertCircle, Smile, Paperclip,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ConvStatus = 'AI_HANDLING' | 'HUMAN_TAKEOVER' | 'CLOSED'
type MsgStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'

interface ConvItem {
  id: string
  phone: string
  name: string | null
  lastMessage: string
  lastMessageAt: string
  lastMessageDirection: 'INBOUND' | 'OUTBOUND' | null
  status: ConvStatus
  aiActive: boolean
  hasUnread: boolean
  windowExpiresAt: string | null
}

interface MsgItem {
  id: string
  role: 'customer' | 'assistant'
  body: string
  timestamp: string
  status: MsgStatus | null
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

interface OrderItem { title: string; quantity: number; price: number; variantTitle: string | null; imageUrl: string | null }
interface Order { id: string; orderNumber: string | null; status: string; financialStatus: string | null; total: number; currency: string; placedAt: string; items: OrderItem[]; shippingCity: string | null }
interface AiLog { id: string; intent: string | null; confidence: number | null; knowledgeSource: string | null; faqMatched: string | null; orderDataUsed: boolean; transferred: boolean; transferReason: string | null; action: string | null; responsePreview: string | null; createdAt: string }
interface Note { id: string; note: string; createdBy: string; createdAt: string }
interface TagItem { id: string; name: string; color: string }
interface QuickReply { id: string; title: string; responseText: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_TAGS: Array<{ name: string; color: string }> = [
  { name: 'Satış', color: '#22c97a' },
  { name: 'Destek', color: '#4470ff' },
  { name: 'İade', color: '#f0a020' },
  { name: 'Şikayet', color: '#e84545' },
  { name: 'VIP', color: '#9f7afa' },
  { name: 'Riskli', color: '#e84545' },
]

const AVATAR_COLORS = ['#4470ff', '#22c97a', '#9f7afa', '#f0a020', '#e84545', '#53bdeb', '#00b09b']

type FilterKey = '' | 'AI_HANDLING' | 'HUMAN_TAKEOVER' | 'CLOSED'
const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: '', label: 'Tümü' },
  { key: 'AI_HANDLING', label: 'AI' },
  { key: 'HUMAN_TAKEOVER', label: 'Temsilci' },
  { key: 'CLOSED', label: 'Kapalı' },
]

type RightTab = 'profile' | 'orders' | 'ai-logs' | 'notes' | 'tags'
const RIGHT_TABS: Array<{ key: RightTab; label: string; Icon: React.ElementType }> = [
  { key: 'profile', label: 'Profil', Icon: User },
  { key: 'orders', label: 'Siparişler', Icon: ShoppingBag },
  { key: 'ai-logs', label: 'AI', Icon: Bot },
  { key: 'notes', label: 'Notlar', Icon: FileText },
  { key: 'tags', label: 'Etiketler', Icon: Tag },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'şimdi'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}dk`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}sa`
  const d = new Date(iso)
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}

function initials(name: string | null, phone: string) {
  if (name) return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  return phone.slice(-2)
}

function avatarColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
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

function msgDateLabel(iso: string) {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const d = new Date(iso).toDateString()
  if (d === today) return 'Bugün'
  if (d === yesterday) return 'Dün'
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
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

// ─── Window countdown hook ────────────────────────────────────────────────────

function useWindowCountdown(windowExpiresAt: string | null) {
  const [ms, setMs] = useState<number | null>(null)
  useEffect(() => {
    if (!windowExpiresAt) { setMs(null); return }
    const tick = () => setMs(new Date(windowExpiresAt).getTime() - Date.now())
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [windowExpiresAt])
  return ms
}

// ─── Message status icon ──────────────────────────────────────────────────────

function MsgStatusIcon({ status }: { status: MsgStatus | null }) {
  if (!status || status === 'QUEUED') return <Clock size={11} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
  if (status === 'FAILED') return <AlertCircle size={11} style={{ color: '#e84545', flexShrink: 0 }} />
  if (status === 'SENT') return <Check size={11} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
  if (status === 'DELIVERED') return <CheckCheck size={11} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />
  return <CheckCheck size={11} style={{ color: '#53bdeb', flexShrink: 0 }} />
}

// ─── Window banner ────────────────────────────────────────────────────────────

function WindowBanner({ windowExpiresAt }: { windowExpiresAt: string | null }) {
  const ms = useWindowCountdown(windowExpiresAt)
  if (!windowExpiresAt || ms === null || ms <= 0) return null

  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const isDanger = ms < 3600000
  const isWarning = ms < 6 * 3600000

  const color = isDanger ? '#e84545' : isWarning ? '#f0a020' : '#53bdeb'
  const bg = isDanger ? 'rgba(232,69,69,0.08)' : isWarning ? 'rgba(240,160,32,0.08)' : 'rgba(83,189,235,0.06)'

  return (
    <div style={{ padding: '7px 16px', background: bg, borderBottom: `1px solid ${color}22`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <Clock size={11} style={{ color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color }}>
        {isDanger
          ? `Pencere kapanıyor — ${minutes > 0 ? `${minutes}dk` : '< 1dk'} kaldı · Sadece template mesaj gönderilebilir`
          : `Mesajlaşma penceresi: ${hours > 0 ? `${hours}sa ` : ''}${minutes}dk kaldı`}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function InboxPage() {
  const [conversations, setConversations] = useState<ConvItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('')
  const [search, setSearch] = useState('')
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selected = conversations.find(c => c.id === selectedId) ?? null

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
    } catch { /* noop */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  useEffect(() => {
    fetch('/api/whatsapp/quick-replies')
      .then(r => r.ok ? r.json() : { replies: [] })
      .then(d => setQuickReplies(d.replies ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setMessages([]); setCustomer(null); setOrders([]); setAiLogs([]); setNotes([]); setConvTags([]); setAiSuggestions([])
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
      const mapped = (msgs.messages ?? []).map((m: { id: string; direction: string; content: string; sentAt: string; status: string }) => ({
        id: m.id,
        role: m.direction === 'INBOUND' ? 'customer' : 'assistant',
        body: m.content ?? '',
        timestamp: m.sentAt,
        status: (m.status ?? null) as MsgStatus | null,
      })) as MsgItem[]
      setMessages(mapped)
      setCustomer(cust.customer ?? null)
      setOrders(ords.orders ?? [])
      setAiLogs(logs.logs ?? [])
      setNotes(nts.notes ?? [])
      setConvTags(tgs.tags ?? [])
    }).catch(() => {}).finally(() => setMsgLoading(false))
  }, [selectedId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selected || selected.status !== 'HUMAN_TAKEOVER' || messages.length === 0) { setAiSuggestions([]); return }
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

  async function changeStatus(action: 'takeover' | 'release-ai' | 'close') {
    if (!selectedId) return
    const r = await fetch(`/api/whatsapp/inbox/conversations/${selectedId}/${action}`, { method: 'POST' })
    if (r.ok) {
      const d = await r.json()
      const newStatus: ConvStatus = d.status
      setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, status: newStatus, aiActive: newStatus === 'AI_HANDLING' } : c))
    }
  }

  async function handleSend() {
    if (!selectedId || !reply.trim()) return
    setSending(true)
    const text = reply.trim()
    const tempMsg: MsgItem = { id: `tmp-${Date.now()}`, role: 'assistant', body: text, timestamp: new Date().toISOString(), status: 'QUEUED' }
    setMessages(prev => [...prev, tempMsg])
    setReply('')
    setShowQR(false)
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }
    try {
      await fetch(`/api/whatsapp/inbox/${selectedId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, status: 'SENT' } : m))
      setConversations(prev => prev.map(c => c.id === selectedId ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString(), hasUnread: false, lastMessageDirection: 'OUTBOUND' } : c))
    } catch {
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, status: 'FAILED' } : m))
    } finally { setSending(false) }
  }

  async function handleAddNote() {
    if (!selectedId || !newNote.trim()) return
    setAddingNote(true)
    try {
      const r = await fetch(`/api/whatsapp/inbox/conversations/${selectedId}/notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() }),
      })
      if (r.ok) { const d = await r.json(); setNotes(prev => [d.note, ...prev]); setNewNote('') }
    } catch { /* noop */ } finally { setAddingNote(false) }
  }

  async function handleAddTag(name: string, color: string) {
    if (!selectedId) return
    await fetch(`/api/whatsapp/inbox/conversations/${selectedId}/tags`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color }),
    })
    const fresh = await fetch(`/api/whatsapp/inbox/conversations/${selectedId}/tags`).then(r => r.json())
    setConvTags(fresh.tags ?? [])
  }

  async function handleRemoveTag(tagId: string) {
    if (!selectedId) return
    await fetch(`/api/whatsapp/inbox/conversations/${selectedId}/tags`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId }),
    })
    setConvTags(prev => prev.filter(t => t.id !== tagId))
  }

  async function handleSeedTest() {
    setSeedingTest(true)
    try {
      const r = await fetch('/api/whatsapp/inbox/seed-test', { method: 'POST' })
      if (r.ok) {
        const d = await r.json()
        await loadConversations()
        if (d.conversationId) { setSelectedId(d.conversationId); setRightOpen(true) }
      }
    } catch { /* noop */ } finally { setSeedingTest(false) }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setReply(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const filtered = conversations.filter(c => {
    if (filter && c.status !== filter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (c.name?.toLowerCase().includes(q)) || c.phone.includes(q) || c.lastMessage.toLowerCase().includes(q)
    }
    return true
  })

  // Group messages by date
  function buildMsgGroups(msgs: MsgItem[]) {
    const groups: { dateLabel: string; msgs: MsgItem[] }[] = []
    let lastDate = ''
    for (const m of msgs) {
      const label = msgDateLabel(m.timestamp)
      if (label !== lastDate) { groups.push({ dateLabel: label, msgs: [] }); lastDate = label }
      groups[groups.length - 1].msgs.push(m)
    }
    return groups
  }

  const msgGroups = buildMsgGroups(messages)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── 3-col layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT: conversation list ──────────────────────────────────── */}
        <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Inbox</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {conversations.filter(c => c.hasUnread).length > 0 && (
                  <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(34,201,122,0.12)', color: 'var(--green)', border: '1px solid rgba(34,201,122,0.2)' }}>
                    {conversations.filter(c => c.hasUnread).length} okunmamış
                  </span>
                )}
              </div>
            </div>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ara…"
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px 7px 30px', fontSize: 12, color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            {FILTERS.map(f => {
              const active = filter === f.key
              const count = f.key ? conversations.filter(c => c.status === f.key).length : conversations.length
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{ flex: 1, padding: '9px 4px', fontSize: 11, fontWeight: active ? 700 : 400, color: active ? 'var(--text-1)' : 'var(--text-3)', background: 'none', border: 'none', borderBottom: active ? '2px solid var(--blue)' : '2px solid transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}
                >
                  {f.label}
                  {count > 0 && <span style={{ fontSize: 9, color: active ? 'var(--blue)' : 'var(--text-3)', fontWeight: 600 }}>{count}</span>}
                </button>
              )
            })}
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <ConvSkeleton key={i} />)
            ) : filtered.length === 0 ? (
              <EmptyList onSeed={handleSeedTest} seedingTest={seedingTest} hasFilter={!!filter || !!search} />
            ) : filtered.map(c => {
              const ac = avatarColor(c.phone)
              const active = selectedId === c.id
              const sc = statusColor(c.status)
              return (
                <div
                  key={c.id}
                  onClick={() => { setSelectedId(c.id); setRightOpen(true) }}
                  style={{
                    padding: '11px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                    borderLeft: `3px solid ${active ? 'var(--blue)' : 'transparent'}`,
                    display: 'flex', gap: 11, alignItems: 'flex-start', transition: 'background 0.1s',
                  }}
                >
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${ac}20`, color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, border: `1.5px solid ${ac}30` }}>
                      {initials(c.name, c.phone)}
                    </div>
                    <span style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: sc.text, border: '2px solid var(--surface)' }} />
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: c.hasUnread ? 700 : 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 6 }}>
                        {c.name ?? c.phone}
                      </span>
                      <span style={{ fontSize: 10, color: c.hasUnread ? 'var(--green)' : 'var(--text-3)', flexShrink: 0, fontWeight: c.hasUnread ? 600 : 400 }}>
                        {relTime(c.lastMessageAt)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {c.lastMessageDirection === 'OUTBOUND' && (
                        <CheckCheck size={11} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                      )}
                      <p style={{ fontSize: 12, color: c.hasUnread ? 'var(--text-2)' : 'var(--text-3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {c.lastMessage || '—'}
                      </p>
                      {c.hasUnread && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── MIDDLE: message thread ───────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {!selected ? (
            <NoConversation onSeed={handleSeedTest} seedingTest={seedingTest} hasConvs={conversations.length > 0} loading={loading} />
          ) : (
            <>
              {/* Thread header */}
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 12, background: 'var(--surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${avatarColor(selected.phone)}20`, color: avatarColor(selected.phone), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {initials(selected.name, selected.phone)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selected.name ?? selected.phone}
                      </span>
                      <StatusBadge status={selected.status} />
                    </div>
                    {selected.name && <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{selected.phone}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                  {selected.status !== 'HUMAN_TAKEOVER' && selected.status !== 'CLOSED' && (
                    <ActionBtn onClick={() => changeStatus('takeover')} label="Devral" color="#f0a020" />
                  )}
                  {selected.status === 'HUMAN_TAKEOVER' && (
                    <ActionBtn onClick={() => changeStatus('release-ai')} label="AI&apos;a Ver" color="#9f7afa" />
                  )}
                  {selected.status !== 'CLOSED' && (
                    <ActionBtn onClick={() => changeStatus('close')} label="Kapat" color="var(--text-3)" />
                  )}
                  <button
                    onClick={() => setRightOpen(o => !o)}
                    style={{ padding: '6px 10px', borderRadius: 7, background: rightOpen ? 'rgba(68,112,255,0.12)' : 'var(--bg)', border: `1px solid ${rightOpen ? 'rgba(68,112,255,0.3)' : 'var(--border)'}`, color: rightOpen ? 'var(--blue)' : 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                  >
                    <User size={12} /> Profil
                  </button>
                </div>
              </div>

              {/* 24h window banner */}
              <WindowBanner windowExpiresAt={selected.windowExpiresAt} />

              {/* Messages area */}
              <div
                style={{
                  flex: 1, overflowY: 'auto', padding: '16px 20px',
                  display: 'flex', flexDirection: 'column', gap: 2,
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)',
                  backgroundSize: '22px 22px',
                  backgroundColor: '#07090d',
                }}
              >
                {msgLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
                    <Loader2 size={22} style={{ color: 'var(--text-3)' }} className="animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 8 }}>
                    <MessageSquare size={32} style={{ color: 'var(--text-3)' }} />
                    <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Henüz mesaj yok</p>
                  </div>
                ) : msgGroups.map((group, gi) => (
                  <div key={gi}>
                    {/* Date separator */}
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 8px' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', background: 'rgba(0,0,0,0.4)', padding: '3px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
                        {group.dateLabel}
                      </span>
                    </div>
                    {group.msgs.map(msg => (
                      <div
                        key={msg.id}
                        style={{ display: 'flex', justifyContent: msg.role === 'customer' ? 'flex-start' : 'flex-end', marginBottom: 4 }}
                      >
                        <div
                          style={{
                            maxWidth: '68%', padding: '7px 11px 5px',
                            borderRadius: msg.role === 'customer' ? '2px 14px 14px 14px' : '14px 2px 14px 14px',
                            background: msg.role === 'customer' ? '#1a2535' : '#0a3828',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            opacity: msg.status === 'FAILED' ? 0.6 : 1,
                          }}
                        >
                          <p style={{ fontSize: 13, color: '#e8edf2', margin: '0 0 4px', lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {msg.body}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{fmtTime(msg.timestamp)}</span>
                            {msg.role === 'assistant' && <MsgStatusIcon status={msg.status} />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* AI suggestions */}
              {selected.status === 'HUMAN_TAKEOVER' && aiSuggestions.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px', flexShrink: 0, background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                    <Bot size={12} style={{ color: '#9f7afa' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>AI Önerileri</span>
                    {suggestLoading && <Loader2 size={10} style={{ color: 'var(--text-3)' }} className="animate-spin" />}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {aiSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => { setReply(s); textareaRef.current?.focus() }}
                        style={{ padding: '5px 10px', borderRadius: 20, fontSize: 12, background: 'rgba(159,122,250,0.07)', border: '1px solid rgba(159,122,250,0.18)', color: 'var(--text-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, maxWidth: 280, textAlign: 'left' }}
                      >
                        <ChevronRight size={10} style={{ color: '#9f7afa', flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick replies popup */}
              {showQR && quickReplies.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '8px 16px', flexShrink: 0, background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>Hızlı Yanıtlar</span>
                    <button onClick={() => setShowQR(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2 }}><X size={12} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 150, overflowY: 'auto' }}>
                    {quickReplies.map(qr => (
                      <button
                        key={qr.id}
                        onClick={() => { setReply(qr.responseText); setShowQR(false); textareaRef.current?.focus() }}
                        style={{ textAlign: 'left', padding: '6px 10px', borderRadius: 7, fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-1)', cursor: 'pointer' }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--blue)', marginRight: 6 }}>{qr.title}</span>
                        <span style={{ color: 'var(--text-2)' }}>{qr.responseText.slice(0, 70)}{qr.responseText.length > 70 ? '…' : ''}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Composer */}
              <ComposerBar
                status={selected.status}
                reply={reply}
                sending={sending}
                textareaRef={textareaRef}
                quickReplies={quickReplies}
                onTextChange={handleTextareaChange}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                onSend={handleSend}
                onToggleQR={() => setShowQR(o => !o)}
                onTakeover={() => changeStatus('takeover')}
              />
            </>
          )}
        </div>

        {/* ── RIGHT: customer panel ─────────────────────────────────────── */}
        {selected && (
          <div style={{ width: rightOpen ? 340 : 0, flexShrink: 0, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'width 0.22s ease' }}>
            <div style={{ width: 340, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--surface)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{selected.name ?? selected.phone}</span>
                <button onClick={() => setRightOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}><X size={14} /></button>
              </div>
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--surface)' }}>
                {RIGHT_TABS.map(t => {
                  const active = rightTab === t.key
                  return (
                    <button
                      key={t.key}
                      onClick={() => setRightTab(t.key)}
                      style={{ flex: 1, padding: '8px 4px', fontSize: 10, fontWeight: active ? 700 : 400, color: active ? 'var(--text-1)' : 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', borderBottom: active ? '2px solid var(--blue)' : '2px solid transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
                    >
                      <t.Icon size={12} />{t.label}
                    </button>
                  )
                })}
              </div>
              {/* Tab content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
                {rightTab === 'profile' && <ProfileTab customer={customer} phone={selected.phone} />}
                {rightTab === 'orders' && <OrdersTab orders={orders} />}
                {rightTab === 'ai-logs' && <AiLogsTab logs={aiLogs} />}
                {rightTab === 'notes' && <NotesTab notes={notes} newNote={newNote} setNewNote={setNewNote} addingNote={addingNote} onAdd={handleAddNote} />}
                {rightTab === 'tags' && <TagsTab convTags={convTags} onRemove={handleRemoveTag} onAdd={handleAddTag} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Composer bar ─────────────────────────────────────────────────────────────

function ComposerBar({ status, reply, sending, textareaRef, quickReplies, onTextChange, onKeyDown, onSend, onToggleQR, onTakeover }: {
  status: ConvStatus
  reply: string
  sending: boolean
  textareaRef: React.RefObject<HTMLTextAreaElement>
  quickReplies: QuickReply[]
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onSend: () => void
  onToggleQR: () => void
  onTakeover: () => void
}) {
  if (status === 'CLOSED') {
    return (
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0, textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Bu konuşma kapatıldı.</span>
      </div>
    )
  }

  if (status === 'AI_HANDLING') {
    return (
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(159,122,250,0.07)', borderRadius: 10, border: '1px solid rgba(159,122,250,0.15)' }}>
          <Bot size={13} style={{ color: '#9f7afa', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>AI otomatik yanıt veriyor</span>
        </div>
        <button
          onClick={onTakeover}
          style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(240,160,32,0.1)', border: '1px solid rgba(240,160,32,0.25)', color: '#f0a020', cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}
        >
          Devral
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
      {quickReplies.length > 0 && (
        <button
          onClick={onToggleQR}
          title="Hızlı yanıtlar"
          style={{ padding: '9px 10px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}
        >
          <MessageSquare size={15} />
        </button>
      )}
      <button
        title="Emoji (yakında)"
        style={{ padding: '9px 10px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'default', flexShrink: 0, display: 'flex', alignItems: 'center', opacity: 0.5 }}
      >
        <Smile size={15} />
      </button>
      <button
        title="Dosya ekle (yakında)"
        style={{ padding: '9px 10px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'default', flexShrink: 0, display: 'flex', alignItems: 'center', opacity: 0.5 }}
      >
        <Paperclip size={15} />
      </button>
      <textarea
        ref={textareaRef}
        value={reply}
        onChange={onTextChange}
        onKeyDown={onKeyDown}
        placeholder="Yanıt yazın…"
        rows={1}
        style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px', fontSize: 13, color: 'var(--text-1)', outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.45, maxHeight: 120, overflowY: 'auto', transition: 'border-color 0.15s' }}
        onFocus={e => (e.target.style.borderColor = 'rgba(68,112,255,0.4)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />
      <button
        onClick={onSend}
        disabled={sending || !reply.trim()}
        style={{ width: 40, height: 40, borderRadius: 10, background: reply.trim() ? 'var(--blue)' : 'var(--bg)', color: reply.trim() ? '#fff' : 'var(--text-3)', border: `1px solid ${reply.trim() ? 'var(--blue)' : 'var(--border)'}`, cursor: reply.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
      >
        {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
      </button>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

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
    <button onClick={onClick} style={{ padding: '6px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600, color, background: 'var(--bg)', border: `1px solid ${color}40`, cursor: 'pointer' }}>
      {label}
    </button>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ConvSkeleton() {
  return (
    <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 11 }}>
      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 11, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '60%', marginBottom: 7 }} />
        <div style={{ height: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '80%' }} />
      </div>
    </div>
  )
}

// ─── Empty list ───────────────────────────────────────────────────────────────

function EmptyList({ onSeed, seedingTest, hasFilter }: { onSeed: () => void; seedingTest: boolean; hasFilter: boolean }) {
  return (
    <div style={{ padding: '32px 16px', textAlign: 'center' }}>
      <MessageSquare size={28} style={{ color: 'var(--text-3)', margin: '0 auto 8px', display: 'block' }} />
      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 14px' }}>
        {hasFilter ? 'Bu filtrede konuşma yok' : 'Henüz konuşma yok'}
      </p>
      {!hasFilter && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={onSeed} disabled={seedingTest} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.25)', color: 'var(--blue)', cursor: 'pointer', fontSize: 11, fontWeight: 600, width: '100%', justifyContent: 'center' }}>
            {seedingTest ? <Loader2 size={11} className="animate-spin" /> : <FlaskConical size={11} />}
            Test Konuşması Oluştur
          </button>
          <a href="/whatsapp/connection" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: 'rgba(34,201,122,0.08)', border: '1px solid rgba(34,201,122,0.2)', color: 'var(--green)', fontSize: 11, fontWeight: 600, textDecoration: 'none', justifyContent: 'center' }}>
            <Zap size={11} /> WhatsApp Bağla
          </a>
        </div>
      )}
    </div>
  )
}

// ─── No conversation selected ─────────────────────────────────────────────────

function NoConversation({ onSeed, seedingTest, hasConvs, loading }: { onSeed: () => void; seedingTest: boolean; hasConvs: boolean; loading: boolean }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(68,112,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(68,112,255,0.12)' }}>
        <MessageSquare size={28} style={{ color: 'var(--text-3)' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 4px' }}>Konuşma seçin</p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>Sol listeden bir konuşmaya tıklayın</p>
      </div>
      {!hasConvs && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginTop: 8 }}>
          <button onClick={onSeed} disabled={seedingTest} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.3)', color: 'var(--blue)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {seedingTest ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
            Test Konuşması Oluştur
          </button>
          <a href="/whatsapp/connection" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(34,201,122,0.08)', border: '1px solid rgba(34,201,122,0.2)', color: 'var(--green)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            <Zap size={12} /> WhatsApp Bağla
          </a>
        </div>
      )}
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
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${avatarColor(customer.name)}20`, color: avatarColor(customer.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, border: `1.5px solid ${avatarColor(customer.name)}30` }}>
            {customer.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{customer.name}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-2)' }}>{customer.email}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Tag2 label={segmentLabel(customer.segment)} color="var(--blue)" />
          <Tag2 label={risk.label} color={risk.color} />
        </div>
      </div>
      <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, border: '1px solid var(--border)' }}>
        <MetricCell label="Sipariş" value={String(customer.totalOrders)} />
        <MetricCell label="Harcama" value={`₺${fmtMoney(customer.totalSpent)}`} />
        <MetricCell label="Ort. Sipariş" value={`₺${fmtMoney(customer.avgOrder)}`} />
        <MetricCell label="Son Sipariş" value={customer.lastOrder ? fmtDate(customer.lastOrder) : '—'} />
      </div>
      <InfoRow label="Kaynak" value={customer.source} />
      <InfoRow label="Skor" value={`${customer.score}/100`} />
    </div>
  )
}

// ─── Orders tab ───────────────────────────────────────────────────────────────

function OrdersTab({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <ShoppingBag size={32} style={{ color: 'var(--text-3)', margin: '0 auto 8px', display: 'block' }} />
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Sipariş bulunamadı.</p>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {orders.map(o => {
        const sc: Record<string, string> = { delivered: '#22c97a', shipped: '#4470ff', confirmed: '#9f7afa', pending: '#f0a020', cancelled: '#e84545', refunded: '#8080a0' }
        const c = sc[o.status] ?? '#8080a0'
        return (
          <div key={o.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>#{o.orderNumber ?? o.id.slice(-6)}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>₺{fmtMoney(o.total)}</span>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
              <Tag2 label={orderStatusLabel(o.status)} color={c} />
            </div>
            {o.items.slice(0, 3).map((item, i) => (
              <div key={i} style={{ fontSize: 11, color: 'var(--text-2)', display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span>{item.quantity}× {item.title}{item.variantTitle ? ` (${item.variantTitle})` : ''}</span>
                <span>₺{fmtMoney(item.price)}</span>
              </div>
            ))}
            {o.items.length > 3 && <span style={{ fontSize: 10, color: 'var(--text-3)' }}>+{o.items.length - 3} ürün</span>}
            <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--text-3)' }}>{fmtDate(o.placedAt)}</p>
          </div>
        )
      })}
    </div>
  )
}

// ─── AI logs tab ──────────────────────────────────────────────────────────────

function AiLogsTab({ logs }: { logs: AiLog[] }) {
  if (logs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <Bot size={32} style={{ color: 'var(--text-3)', margin: '0 auto 8px', display: 'block' }} />
        <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>AI log bulunamadı.</p>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {logs.map(log => (
        <div key={log.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Bot size={11} style={{ color: '#9f7afa' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)' }}>{log.intent ?? 'bilinmiyor'}</span>
            {log.confidence != null && (
              <span style={{ marginLeft: 'auto', fontSize: 10, color: log.confidence > 0.8 ? '#22c97a' : log.confidence > 0.5 ? '#f0a020' : '#e84545', fontWeight: 600 }}>
                {(log.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
          {log.faqMatched && <AiRow label="FAQ" value={log.faqMatched} />}
          {log.knowledgeSource && <AiRow label="Kaynak" value={log.knowledgeSource} />}
          {log.action && <AiRow label="Aksiyon" value={log.action} />}
          {log.transferred && <AiRow label="Transfer" value={log.transferReason ?? 'Temsilciye devredildi'} />}
          {log.responsePreview && <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--text-2)', fontStyle: 'italic' }}>&ldquo;{log.responsePreview.slice(0, 80)}{log.responsePreview.length > 80 ? '…' : ''}&rdquo;</p>}
          <p style={{ margin: '5px 0 0', fontSize: 10, color: 'var(--text-3)' }}>{fmtDate(log.createdAt)} {fmtTime(log.createdAt)}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Notes tab ────────────────────────────────────────────────────────────────

function NotesTab({ notes, newNote, setNewNote, addingNote, onAdd }: { notes: Note[]; newNote: string; setNewNote: (v: string) => void; addingNote: boolean; onAdd: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="İç not ekle… (müşteriye görünmez)"
          rows={3}
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', padding: '10px 12px', fontSize: 12, color: 'var(--text-1)', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4, boxSizing: 'border-box' }}
        />
        <div style={{ borderTop: '1px solid var(--border)', padding: '6px 10px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onAdd} disabled={!newNote.trim() || addingNote} style={{ padding: '5px 12px', borderRadius: 6, background: 'var(--blue)', color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: !newNote.trim() ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4 }}>
            {addingNote ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />} Kaydet
          </button>
        </div>
      </div>
      {notes.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '16px 0' }}>Henüz not eklenmemiş.</p>
      ) : notes.map(n => (
        <div key={n.id} style={{ background: 'rgba(240,160,32,0.05)', border: '1px solid rgba(240,160,32,0.12)', borderRadius: 8, padding: 10 }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-1)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>{n.note}</p>
          <p style={{ margin: 0, fontSize: 10, color: 'var(--text-3)' }}>{n.createdBy} · {fmtDate(n.createdAt)} {fmtTime(n.createdAt)}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Tags tab ─────────────────────────────────────────────────────────────────

function TagsTab({ convTags, onRemove, onAdd }: { convTags: TagItem[]; onRemove: (id: string) => void; onAdd: (name: string, color: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bu Sohbetin Etiketleri</p>
        {convTags.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Henüz etiket eklenmemiş.</p>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {convTags.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 20, background: `${t.color}15`, border: `1px solid ${t.color}30` }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: t.color }}>{t.name}</span>
                <button onClick={() => onRemove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.color, padding: 0, display: 'flex', alignItems: 'center' }}><X size={10} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Etiket Ekle</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DEFAULT_TAGS.filter(dt => !convTags.some(ct => ct.name === dt.name)).map(dt => (
            <button key={dt.name} onClick={() => onAdd(dt.name, dt.color)} style={{ padding: '4px 10px', borderRadius: 20, background: 'var(--bg)', border: `1px solid ${dt.color}40`, color: dt.color, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={9} /> {dt.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Micro components ─────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
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
    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: `${color}15`, color, border: `1px solid ${color}30` }}>{label}</span>
  )
}

function AiRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 3 }}>
      <span style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0, minWidth: 50 }}>{label}:</span>
      <span style={{ fontSize: 10, color: 'var(--text-2)', flex: 1 }}>{value}</span>
    </div>
  )
}
