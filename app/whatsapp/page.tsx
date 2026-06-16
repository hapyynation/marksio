'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import AppShell from '@/components/layout/AppShell'
import {
  MessageSquare, Plus, Check, X, Loader2, Send, Settings,
  Zap, Link2, Users, Trash2, Edit2, ToggleLeft, ToggleRight,
  WifiOff, AlertTriangle, CheckCircle2, RefreshCw, Eye, EyeOff,
  Clock, Phone, Key, Shield, Activity, TrendingUp, Bot,
  ChevronRight, MessageCircle, Copy, ArrowLeft,
} from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'

/* ─── Types ──────────────────────────────────────────────────────────────────── */

type WaTab = 'overview' | 'campaigns' | 'conversations' | 'quick-replies' | 'bot-settings' | 'test' | 'connection'

interface WaSettings {
  botName: string
  welcomeMessage: string
  fallbackMessage: string
  tone: string
  responseLength: string
  emojiUsage: string
  humanHandoffMessage: string
  businessHoursMessage: string
  language: string
  autoResponseEnabled?: boolean
  businessHoursEnabled?: boolean
  businessHoursStart?: string
  businessHoursEnd?: string
  phoneNumberId?: string
  businessAccountId?: string
  webhookVerifyToken?: string
  connectionStatus: string
  hasMetaToken?: boolean
  hasAppSecret?: boolean
}

interface WaStats {
  totalConversations: number
  activeConversations: number
  botResolutionRate: number
  humanHandoffs: number
  campaignMessagesSent: number
  failedMessages: number
}

interface QuickReply {
  id: string
  title: string
  triggerKeywords: string
  responseText: string
  isActive: boolean
  createdAt: string
}

interface Conversation {
  id: string
  customerPhone: string
  customerName?: string | null
  status: string
  resolvedBy?: string | null
  lastMessage?: string | null
  updatedAt: string
  createdAt: string
}

interface WaMessage {
  id: string
  role: string
  content: string
  status?: string | null
  createdAt: string
}

interface ConversationDetail extends Conversation {
  messages: WaMessage[]
}

const EMPTY_STATS: WaStats = {
  totalConversations: 0,
  activeConversations: 0,
  botResolutionRate: 0,
  humanHandoffs: 0,
  campaignMessagesSent: 0,
  failedMessages: 0,
}

/* ─── Shared helpers ─────────────────────────────────────────────────────────── */

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'şimdi'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} sa önce`
  return `${Math.floor(diff / 86400000)} gün önce`
}

/* ─── Shared UI primitives ───────────────────────────────────────────────────── */

function ConnectionBadge({ status }: { status: string }) {
  if (status === 'connected') return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(34,201,122,0.1)', border: '1px solid rgba(34,201,122,0.2)', color: '#22c97a' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
      Bağlı
    </div>
  )
  if (status === 'error') return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(232,69,69,0.1)', border: '1px solid rgba(232,69,69,0.2)', color: '#e84545' }}>
      <AlertTriangle size={11} />
      Bağlantı Hatası
    </div>
  )
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
      <WifiOff size={11} />
      Bağlı Değil
    </div>
  )
}

function EmptyState({ icon: Icon, title, desc, action, onAction }: { icon: React.ElementType; title: string; desc: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <Icon size={22} style={{ color: '#33334a' }} />
      </div>
      <p className="text-[14px] font-semibold" style={{ color: '#8080a0' }}>{title}</p>
      <p className="text-[12px]" style={{ color: '#44445a' }}>{desc}</p>
      {action && onAction && (
        <button onClick={onAction} className="mt-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all" style={{ background: 'rgba(34,201,122,0.12)', color: '#22c97a', border: '1px solid rgba(34,201,122,0.2)' }}>
          {action}
        </button>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[14px] font-bold text-white">{title}</p>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors"><X size={17} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#8080a0' }}>{label}</label>
      {children}
    </div>
  )
}

const inpCls = "w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none transition-colors"
const inpStyle = { background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px]" style={{ color: '#eeeef4' }}>{label}</span>
      <button onClick={() => onChange(!value)} className="transition-colors">
        {value ? <ToggleRight size={26} style={{ color: '#22c97a' }} /> : <ToggleLeft size={26} style={{ color: '#44445a' }} />}
      </button>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */

export default function WhatsAppPage() {
  const [tab, setTab] = useState<WaTab>('overview')
  const [settings, setSettings] = useState<WaSettings | null>(null)
  const [stats, setStats] = useState<WaStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/settings')
      const data = await res.json()
      if (data.settings) setSettings(data.settings)
      if (data.stats) {
        setStats(data.stats as WaStats)
      }
    } catch { /* keep demo */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  const TABS: Array<{ key: WaTab; label: string; icon: React.ElementType }> = [
    { key: 'overview',      label: 'Genel Bakış',    icon: Activity },
    { key: 'campaigns',     label: 'Kampanyalar',     icon: Send },
    { key: 'conversations', label: 'Konuşmalar',      icon: Users },
    { key: 'quick-replies', label: 'Hızlı Yanıtlar',  icon: Zap },
    { key: 'bot-settings',  label: 'Bot Ayarları',    icon: Settings },
    { key: 'test',          label: 'Test',             icon: MessageCircle },
    { key: 'connection',    label: 'Bağlantı',         icon: Link2 },
  ]

  return (
    <AppShell>
      {/* Toast */}
      {toast && (
        <div className={cn('fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-[13px] font-semibold backdrop-blur-xl border', toast.type === 'success' ? 'text-emerald-300 border-emerald-500/20' : 'text-red-300 border-red-500/20')}
          style={{ background: toast.type === 'success' ? 'rgba(5,40,25,0.95)' : 'rgba(40,5,5,0.95)' }}>
          {toast.type === 'success' ? <CheckCircle2 size={14} /> : <X size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 h-14 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,15,0.95)', backdropFilter: 'blur(24px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,201,122,0.15)', border: '1px solid rgba(34,201,122,0.25)' }}>
            <MessageSquare size={15} style={{ color: '#22c97a' }} />
          </div>
          <div>
            <h1 className="text-[15px] font-bold" style={{ color: '#eeeef4' }}>WhatsApp AI</h1>
            <p className="text-[11px]" style={{ color: '#44445a' }}>AI destekli müşteri iletişimi ve otomasyon</p>
          </div>
        </div>
        <ConnectionBadge status={settings?.connectionStatus ?? 'disconnected'} />
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0.5 px-6 py-2 shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap"
              style={active
                ? { background: 'rgba(34,201,122,0.12)', color: '#22c97a', border: '1px solid rgba(34,201,122,0.2)' }
                : { color: '#44445a', border: '1px solid transparent' }}>
              <Icon size={13} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={22} className="animate-spin" style={{ color: '#22c97a' }} />
          </div>
        ) : (
          <>
            {tab === 'overview'      && <OverviewTab stats={stats} settings={settings} onGoConnection={() => setTab('connection')} />}
            {tab === 'campaigns'     && <WaCampaignsTab showToast={showToast} />}
            {tab === 'conversations' && <ConversationsTab />}
            {tab === 'quick-replies' && <QuickRepliesTab showToast={showToast} />}
            {tab === 'bot-settings'  && <BotSettingsTab settings={settings} onSave={loadSettings} showToast={showToast} />}
            {tab === 'test'          && <TestTab />}
            {tab === 'connection'    && <ConnectionTab settings={settings} onSave={loadSettings} showToast={showToast} />}
          </>
        )}
      </div>
    </AppShell>
  )
}

/* ─── Overview Tab ───────────────────────────────────────────────────────────── */

function OverviewTab({ stats, settings, onGoConnection }: { stats: WaStats; settings: WaSettings | null; onGoConnection: () => void }) {
  const isDisconnected = !settings?.connectionStatus || settings.connectionStatus === 'disconnected'

  if (isDisconnected) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <WifiOff size={26} style={{ color: '#33334a' }} />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-semibold mb-1" style={{ color: '#eeeef4' }}>WhatsApp API bağlantısı kurulmamış</p>
          <p className="text-[13px]" style={{ color: '#44445a' }}>Meta Cloud API bilgilerini girerek bağlantı kurun</p>
        </div>
        <button onClick={onGoConnection}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all"
          style={{ background: '#22c97a', color: '#050505' }}>
          Bağlantı Kur <ChevronRight size={14} />
        </button>
      </div>
    )
  }

  const kpis = [
    { label: 'Toplam Konuşma',    value: formatNumber(stats.totalConversations),   color: '#22c97a', icon: MessageSquare },
    { label: 'Aktif Konuşmalar',  value: String(stats.activeConversations),        color: '#4470ff', icon: Activity },
    { label: 'Bot Çözüm Oranı',   value: stats.botResolutionRate > 0 ? `%${stats.botResolutionRate}` : '—', color: '#9f7afa', icon: Bot },
    { label: 'İnsana Aktarılan',  value: String(stats.humanHandoffs),              color: '#f0a020', icon: Users },
    { label: 'Toplam Mesaj',      value: formatNumber(stats.campaignMessagesSent), color: '#22c97a', icon: Send },
    { label: 'Başarısız Mesaj',   value: String(stats.failedMessages),             color: '#e84545', icon: AlertTriangle },
  ]

  if (stats.totalConversations === 0 && stats.campaignMessagesSent === 0) {
    return (
      <div className="p-6 max-w-6xl">
        <EmptyState
          icon={MessageSquare}
          title="Henüz konuşma verisi yok"
          desc="WhatsApp bağlantınız aktif. İlk müşteri mesajı geldiğinde veriler burada görünecek."
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold" style={{ color: '#44445a' }}>{k.label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${k.color}18` }}>
                  <Icon size={13} style={{ color: k.color }} />
                </div>
              </div>
              <p className="text-[24px] font-bold leading-none" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>{k.value}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Quick Replies Tab ──────────────────────────────────────────────────────── */

function QuickRepliesTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [replies, setReplies] = useState<QuickReply[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState<QuickReply | null>(null)
  const [form, setForm] = useState({ title: '', triggerKeywords: '', responseText: '', isActive: true })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/quick-replies')
      const data = await res.json()
      setReplies(data.replies ?? [])
    } catch { /* */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm({ title: '', triggerKeywords: '', responseText: '', isActive: true })
    setShowModal(true)
  }

  const openEdit = (r: QuickReply) => {
    setEditItem(r)
    setForm({ title: r.title, triggerKeywords: r.triggerKeywords, responseText: r.responseText, isActive: r.isActive })
    setShowModal(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editItem) {
        const res = await fetch(`/api/whatsapp/quick-replies/${editItem.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        if (!res.ok) throw new Error((await res.json()).error)
        showToast('Hızlı yanıt güncellendi')
      } else {
        const res = await fetch('/api/whatsapp/quick-replies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        if (!res.ok) throw new Error((await res.json()).error)
        showToast('Hızlı yanıt eklendi')
      }
      setShowModal(false)
      load()
    } catch (err) { showToast(err instanceof Error ? err.message : 'Hata', 'error') }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/whatsapp/quick-replies/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      showToast('Yanıt silindi')
      setReplies(p => p.filter(r => r.id !== id))
    } catch (err) { showToast(err instanceof Error ? err.message : 'Silinemedi', 'error') }
    finally { setDeletingId(null) }
  }

  const toggle = async (r: QuickReply) => {
    try {
      await fetch(`/api/whatsapp/quick-replies/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !r.isActive }) })
      setReplies(p => p.map(x => x.id === r.id ? { ...x, isActive: !x.isActive } : x))
    } catch { /* */ }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[15px] font-bold text-white">Hızlı Yanıtlar</h2>
          <p className="text-[12px] mt-0.5" style={{ color: '#44445a' }}>Tetikleyici kelime eşleştiğinde otomatik yanıt gönder</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold" style={{ background: '#22c97a', color: '#050505' }}>
          <Plus size={14} /> Yanıt Ekle
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin" style={{ color: '#22c97a' }} /></div>
      ) : replies.length === 0 ? (
        <EmptyState icon={Zap} title="Hızlı yanıt yok" desc="Müşterilerin sıkça sorduğu sorulara otomatik yanıt oluşturun" action="İlk Yanıtı Ekle" onAction={openAdd} />
      ) : (
        <div className="space-y-2">
          {replies.map(r => (
            <div key={r.id} className="p-4 rounded-2xl transition-all" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[13px] font-semibold text-white">{r.title}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold', r.isActive ? 'text-emerald-300 bg-emerald-500/10' : 'text-white/30 bg-white/5')}>
                      {r.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {r.triggerKeywords.split(',').map(k => k.trim()).filter(Boolean).map(k => (
                      <span key={k} className="px-2 py-0.5 rounded-lg text-[10px] font-semibold" style={{ background: 'rgba(34,201,122,0.08)', color: '#22c97a', border: '1px solid rgba(34,201,122,0.15)' }}>#{k}</span>
                    ))}
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: '#8080a0' }}>{r.responseText}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  <button onClick={() => toggle(r)} className="p-1.5 rounded-lg transition-colors" title={r.isActive ? 'Pasife al' : 'Aktif et'}>
                    {r.isActive ? <ToggleRight size={19} style={{ color: '#22c97a' }} /> : <ToggleLeft size={19} style={{ color: '#44445a' }} />}
                  </button>
                  <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#8080a0' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => remove(r.id)} disabled={deletingId === r.id} className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: '#e84545' }}>
                    {deletingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editItem ? 'Yanıt Düzenle' : 'Hızlı Yanıt Ekle'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Field label="Başlık">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Örn: Kargo Süresi" className={inpCls} style={inpStyle} />
            </Field>
            <Field label="Tetikleyici Kelimeler (virgülle ayırın)">
              <input value={form.triggerKeywords} onChange={e => setForm(f => ({ ...f, triggerKeywords: e.target.value }))} placeholder="kargo, teslimat, ne zaman gelir" className={inpCls} style={inpStyle} />
              <p className="text-[10px] mt-1" style={{ color: '#44445a' }}>Müşteri mesajında bu kelimelerden biri geçerse yanıt tetiklenir</p>
            </Field>
            <Field label="Cevap Metni">
              <textarea value={form.responseText} onChange={e => setForm(f => ({ ...f, responseText: e.target.value }))} rows={4} placeholder="Siparişiniz 2-3 iş günü içinde teslim edilir..." className={cn(inpCls, 'resize-none')} style={inpStyle} />
            </Field>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>İptal</button>
              <button onClick={save} disabled={saving || !form.title.trim() || !form.triggerKeywords.trim() || !form.responseText.trim()} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40" style={{ background: '#22c97a', color: '#050505' }}>
                {saving ? <Loader2 size={13} className="animate-spin inline mr-1" /> : null}
                {editItem ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ─── Bot Settings Tab ───────────────────────────────────────────────────────── */

function BotSettingsTab({ settings, onSave, showToast }: { settings: WaSettings | null; onSave: () => Promise<void>; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [form, setForm] = useState({
    botName: settings?.botName ?? 'Marksio Asistan',
    welcomeMessage: settings?.welcomeMessage ?? '',
    fallbackMessage: settings?.fallbackMessage ?? '',
    humanHandoffMessage: settings?.humanHandoffMessage ?? '',
    businessHoursMessage: settings?.businessHoursMessage ?? '',
    tone: settings?.tone ?? 'friendly',
    responseLength: settings?.responseLength ?? 'medium',
    emojiUsage: settings?.emojiUsage ?? 'low',
    language: settings?.language ?? 'tr',
    autoResponseEnabled: settings?.autoResponseEnabled ?? true,
    businessHoursEnabled: settings?.businessHoursEnabled ?? false,
    businessHoursStart: settings?.businessHoursStart ?? '09:00',
    businessHoursEnd: settings?.businessHoursEnd ?? '18:00',
  })
  const [saving, setSaving] = useState(false)

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      showToast('Ayarlar kaydedildi')
      await onSave()
    } catch (err) { showToast(err instanceof Error ? err.message : 'Kaydedilemedi', 'error') }
    finally { setSaving(false) }
  }

  const sec = "rounded-2xl p-5 space-y-4"
  const secStyle = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }

  return (
    <div className="p-6 max-w-2xl space-y-5">
      {/* General */}
      <div className={sec} style={secStyle}>
        <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#44445a' }}>Genel</p>
        <Field label="Bot Adı">
          <input value={form.botName} onChange={f('botName')} placeholder="Marksio Asistan" className={inpCls} style={inpStyle} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Marka Tonu">
            <select value={form.tone} onChange={f('tone')} className={inpCls} style={inpStyle}>
              <option value="friendly">Samimi ve Sıcak</option>
              <option value="professional">Profesyonel</option>
              <option value="formal">Resmi</option>
              <option value="energetic">Enerjik</option>
            </select>
          </Field>
          <Field label="Yanıt Dili">
            <select value={form.language} onChange={f('language')} className={inpCls} style={inpStyle}>
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </Field>
          <Field label="Yanıt Uzunluğu">
            <select value={form.responseLength} onChange={f('responseLength')} className={inpCls} style={inpStyle}>
              <option value="short">Kısa</option>
              <option value="medium">Orta</option>
              <option value="long">Uzun</option>
            </select>
          </Field>
          <Field label="Emoji Kullanımı">
            <select value={form.emojiUsage} onChange={f('emojiUsage')} className={inpCls} style={inpStyle}>
              <option value="none">Yok</option>
              <option value="low">Az</option>
              <option value="medium">Orta</option>
              <option value="high">Çok</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Messages */}
      <div className={sec} style={secStyle}>
        <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#44445a' }}>Mesajlar</p>
        <Field label="Karşılama Mesajı">
          <textarea value={form.welcomeMessage} onChange={f('welcomeMessage')} rows={2} placeholder="Merhaba! Size nasıl yardımcı olabilirim?" className={cn(inpCls, 'resize-none')} style={inpStyle} />
        </Field>
        <Field label="Yedek Mesaj (bot anlayamadığında)">
          <textarea value={form.fallbackMessage} onChange={f('fallbackMessage')} rows={2} placeholder="Üzgünüm, bu konuda yardımcı olamıyorum..." className={cn(inpCls, 'resize-none')} style={inpStyle} />
        </Field>
        <Field label="İnsan Temsilciye Aktarma Mesajı">
          <textarea value={form.humanHandoffMessage} onChange={f('humanHandoffMessage')} rows={2} placeholder="Sizi mağaza ekibimizle bağlıyorum." className={cn(inpCls, 'resize-none')} style={inpStyle} />
        </Field>
        <Field label="Mesai Dışı Mesajı">
          <textarea value={form.businessHoursMessage} onChange={f('businessHoursMessage')} rows={2} placeholder="Mesai saatlerimiz dışında yazıyorsunuz..." className={cn(inpCls, 'resize-none')} style={inpStyle} />
        </Field>
      </div>

      {/* Automation */}
      <div className={sec} style={secStyle}>
        <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: '#44445a' }}>Otomasyon</p>
        <Toggle value={form.autoResponseEnabled} onChange={v => setForm(p => ({ ...p, autoResponseEnabled: v }))} label="Otomatik Yanıt" />
        <Toggle value={form.businessHoursEnabled} onChange={v => setForm(p => ({ ...p, businessHoursEnabled: v }))} label="Çalışma Saatleri Aktif" />
        {form.businessHoursEnabled && (
          <div className="grid grid-cols-2 gap-4 mt-1">
            <Field label="Başlangıç">
              <input type="time" value={form.businessHoursStart} onChange={f('businessHoursStart')} className={inpCls} style={inpStyle} />
            </Field>
            <Field label="Bitiş">
              <input type="time" value={form.businessHoursEnd} onChange={f('businessHoursEnd')} className={inpCls} style={inpStyle} />
            </Field>
          </div>
        )}
      </div>

      <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50" style={{ background: '#22c97a', color: '#050505' }}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        {saving ? 'Kaydediliyor…' : 'Kaydet'}
      </button>
    </div>
  )
}

/* ─── Test Tab ───────────────────────────────────────────────────────────────── */

type TestMsg = { role: 'user' | 'bot'; text: string; source?: string; matchedTitle?: string }

function TestTab() {
  const [messages, setMessages] = useState<TestMsg[]>([
    { role: 'bot', text: 'Merhaba! Test modundasınız. Bir mesaj yazarak botun nasıl yanıt vereceğini görün.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const txt = input.trim()
    if (!txt || loading) return
    setInput('')
    setMessages(p => [...p, { role: 'user', text: txt }])
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/test-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: txt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessages(p => [...p, { role: 'bot', text: data.reply, source: data.source, matchedTitle: data.matchedTitle }])
    } catch (err) {
      setMessages(p => [...p, { role: 'bot', text: err instanceof Error ? err.message : 'Hata oluştu' }])
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Info bar */}
      <div className="px-6 py-3 shrink-0 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(34,201,122,0.04)' }}>
        <Bot size={13} style={{ color: '#22c97a' }} />
        <p className="text-[11px]" style={{ color: '#22c97a' }}>Test Modu — Gerçek ayarlarınız ve hızlı yanıtlarınız kullanılıyor</p>
        <button onClick={() => setMessages([{ role: 'bot', text: 'Sohbet sıfırlandı. Yeni test başlatabilirsiniz.' }])} className="ml-auto flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#44445a' }}>
          <RefreshCw size={10} /> Sıfırla
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-6 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            {m.role === 'bot' && (
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mr-2 mt-0.5" style={{ background: 'rgba(34,201,122,0.15)' }}>
                <Bot size={13} style={{ color: '#22c97a' }} />
              </div>
            )}
            <div className={cn('max-w-[75%]', m.role === 'user' ? 'items-end' : 'items-start')}>
              <div className="px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed" style={m.role === 'user' ? { background: '#22c97a', color: '#050505', borderRadius: '18px 18px 4px 18px' } : { background: 'rgba(255,255,255,0.06)', color: '#eeeef4', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px 18px 18px 4px' }}>
                {m.text}
              </div>
              {m.source && (
                <p className="text-[10px] mt-1 px-1" style={{ color: '#44445a' }}>
                  {m.source === 'quick_reply' ? `⚡ Hızlı yanıt: ${m.matchedTitle}` : '🤖 AI yanıtı'}
                </p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mr-2 mt-0.5" style={{ background: 'rgba(34,201,122,0.15)' }}>
              <Bot size={13} style={{ color: '#22c97a' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2 rounded-2xl px-4 py-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Mesaj yaz…" className="flex-1 bg-transparent text-[13px] outline-none" style={{ color: '#eeeef4' }} />
          <button onClick={send} disabled={!input.trim() || loading} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30" style={{ background: '#22c97a' }}>
            <Send size={13} style={{ color: '#050505' }} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Connection Tab ─────────────────────────────────────────────────────────── */

const WIZARD_STEPS = ['Telefon', 'Hesap', 'Token', 'Webhook'] as const

function ConnectionTab({ settings, onSave, showToast }: { settings: WaSettings | null; onSave: () => Promise<void>; showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    phoneNumberId: settings?.phoneNumberId ?? '',
    businessAccountId: settings?.businessAccountId ?? '',
    metaAccessToken: '',
    appSecret: '',
    webhookVerifyToken: settings?.webhookVerifyToken ?? '',
  })
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; phone?: string; name?: string; error?: string } | null>(null)

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [field]: e.target.value }))

  const saveAndNext = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      await onSave()
      if (step < 4) setStep(s => s + 1)
      else showToast('Bağlantı bilgileri kaydedildi')
    } catch (err) { showToast(err instanceof Error ? err.message : 'Kaydedilemedi', 'error') }
    finally { setSaving(false) }
  }

  const testConn = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/whatsapp/test-connection', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setTestResult({ ok: false, error: data.error }); return }
      setTestResult({ ok: true, phone: data.phone, name: data.name })
      await onSave()
      showToast('Bağlantı başarılı!')
    } catch { setTestResult({ ok: false, error: 'Bağlantı kurulamadı' }) }
    finally { setTesting(false) }
  }

  const copy = (val: string) => { navigator.clipboard.writeText(val); showToast('Kopyalandı') }

  const connected = settings?.connectionStatus === 'connected'

  return (
    <div className="p-6 max-w-2xl space-y-5">
      {/* Status card */}
      <div className="rounded-2xl p-5" style={{ background: connected ? 'rgba(34,201,122,0.06)' : 'rgba(255,255,255,0.025)', border: connected ? '1px solid rgba(34,201,122,0.2)' : '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          {connected ? <CheckCircle2 size={20} style={{ color: '#22c97a' }} /> : <WifiOff size={20} style={{ color: '#44445a' }} />}
          <div>
            <p className="text-[14px] font-bold" style={{ color: connected ? '#22c97a' : '#eeeef4' }}>{connected ? 'WhatsApp Bağlı' : 'Bağlantı Kurulmamış'}</p>
            {connected && settings?.phoneNumberId && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[11px]" style={{ color: '#44445a' }}>Phone ID: {settings.phoneNumberId}</p>
                <button onClick={() => copy(settings.phoneNumberId ?? '')}><Copy size={10} style={{ color: '#44445a' }} /></button>
              </div>
            )}
          </div>
          {settings?.hasMetaToken && (
            <button onClick={testConn} disabled={testing} className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all" style={{ background: 'rgba(34,201,122,0.1)', color: '#22c97a', border: '1px solid rgba(34,201,122,0.2)' }}>
              {testing ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Bağlantıyı Test Et
            </button>
          )}
        </div>
        {testResult && (
          <div className={cn('mt-3 p-3 rounded-xl text-[12px]', testResult.ok ? 'text-emerald-300' : 'text-red-300')} style={{ background: testResult.ok ? 'rgba(34,201,122,0.08)' : 'rgba(232,69,69,0.08)' }}>
            {testResult.ok ? `✓ Bağlandı — ${testResult.name ?? ''} (${testResult.phone ?? ''})` : `✗ ${testResult.error}`}
          </div>
        )}
      </div>

      {/* Wizard */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Step indicators */}
        <div className="flex px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {WIZARD_STEPS.map((label, i) => {
            const idx = i + 1
            const active = step === idx
            const done = step > idx
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => idx < step && setStep(idx)}>
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all', done ? 'bg-emerald-400 text-black' : active ? 'border-2 border-emerald-400 text-emerald-400' : 'border border-white/20 text-white/30')}>
                    {done ? <Check size={10} /> : idx}
                  </div>
                  <span className="text-[11px] hidden sm:block" style={{ color: active ? '#22c97a' : done ? '#8080a0' : '#44445a' }}>{label}</span>
                </div>
                {i < WIZARD_STEPS.length - 1 && <div className="flex-1 h-px mx-2" style={{ background: done ? 'rgba(34,201,122,0.3)' : 'rgba(255,255,255,0.06)' }} />}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div className="p-5 space-y-4">
          {step === 1 && (
            <>
              <StepInfo icon={Phone} title="Phone Number ID" desc="Meta Business Manager'dan WhatsApp Business hesabınızın Phone Number ID'sini girin" />
              <Field label="Phone Number ID">
                <input value={form.phoneNumberId} onChange={f('phoneNumberId')} placeholder="1234567890123456" className={inpCls} style={inpStyle} />
              </Field>
            </>
          )}
          {step === 2 && (
            <>
              <StepInfo icon={Shield} title="WhatsApp Business Account ID" desc="Meta Business Manager'daki WhatsApp Business Account ID'nizi girin" />
              <Field label="WhatsApp Business Account ID">
                <input value={form.businessAccountId} onChange={f('businessAccountId')} placeholder="9876543210987654" className={inpCls} style={inpStyle} />
              </Field>
            </>
          )}
          {step === 3 && (
            <>
              <StepInfo icon={Key} title="Access Token" desc="Meta App'inizden System User Access Token oluşturun ve yapıştırın. Token hassastır, güvenli saklayın." />
              <Field label="Access Token">
                <div className="relative">
                  <input type={showToken ? 'text' : 'password'} value={form.metaAccessToken} onChange={f('metaAccessToken')} placeholder={settings?.hasMetaToken ? '●●●●●●●●●●●● (mevcut token korunacak)' : 'EAABcde...'} className={cn(inpCls, 'pr-10')} style={inpStyle} />
                  <button onClick={() => setShowToken(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#44445a' }}>
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </Field>
              <Field label="App Secret (opsiyonel)">
                <input type="password" value={form.appSecret} onChange={f('appSecret')} placeholder="App secret for webhook signature verification" className={inpCls} style={inpStyle} />
              </Field>
            </>
          )}
          {step === 4 && (
            <>
              <StepInfo icon={Shield} title="Webhook Verify Token" desc="Meta App'inizin webhook ayarlarında kullanacağınız doğrulama token'ını belirleyin. Rastgele ve güçlü bir string seçin." />
              <Field label="Webhook Verify Token">
                <div className="relative">
                  <input value={form.webhookVerifyToken} onChange={f('webhookVerifyToken')} placeholder="my-secure-webhook-token-123" className={cn(inpCls, 'pr-20')} style={inpStyle} />
                  <button onClick={() => { const t = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); setForm(p => ({ ...p, webhookVerifyToken: t })) }} className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[10px] font-semibold" style={{ background: 'rgba(34,201,122,0.1)', color: '#22c97a' }}>
                    Oluştur
                  </button>
                </div>
              </Field>
              <div className="p-3 rounded-xl text-[11px] leading-relaxed" style={{ background: 'rgba(68,112,255,0.06)', border: '1px solid rgba(68,112,255,0.15)', color: '#8080a0' }}>
                <strong style={{ color: '#99b4ff' }}>Webhook URL:</strong> {typeof window !== 'undefined' ? window.location.origin : ''}/api/whatsapp/webhook<br />
                Bu URL'yi ve Verify Token'ı Meta App webhook ayarlarınıza girin.
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-2">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                <ArrowLeft size={13} /> Geri
              </button>
            ) : <div />}
            <button onClick={step < 4 ? saveAndNext : async () => { await saveAndNext(); testConn() }} disabled={saving} className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[12px] font-bold disabled:opacity-50 transition-all" style={{ background: '#22c97a', color: '#050505' }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : null}
              {step < 4 ? 'Kaydet ve İleri' : 'Kaydet ve Test Et'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepInfo({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl" style={{ background: 'rgba(34,201,122,0.05)', border: '1px solid rgba(34,201,122,0.12)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,201,122,0.12)' }}>
        <Icon size={14} style={{ color: '#22c97a' }} />
      </div>
      <div>
        <p className="text-[13px] font-semibold text-white">{title}</p>
        <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#8080a0' }}>{desc}</p>
      </div>
    </div>
  )
}

/* ─── Conversations Tab ──────────────────────────────────────────────────────── */

type ConvFilter = 'all' | 'open' | 'closed' | 'human'

function ConversationsTab() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ConvFilter>('all')
  const [selected, setSelected] = useState<ConversationDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async (f: ConvFilter) => {
    setLoading(true)
    try {
      const q = f === 'all' ? '' : `?status=${f}`
      const res = await fetch(`/api/whatsapp/conversations${q}`)
      const data = await res.json()
      setConversations(data.conversations ?? [])
    } catch { setConversations([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(filter) }, [filter, load])

  const openDetail = async (c: Conversation) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/whatsapp/conversations/${c.id}`)
      const data = await res.json()
      setSelected(data.conversation)
    } catch { /* */ }
    finally { setDetailLoading(false) }
  }

  const FILTERS: { key: ConvFilter; label: string }[] = [
    { key: 'all',    label: 'Tümü' },
    { key: 'open',   label: 'Açık' },
    { key: 'closed', label: 'Kapalı' },
    { key: 'human',  label: 'İnsana Aktarılan' },
  ]

  return (
    <div className="flex h-full min-h-0">
      {/* Left: list */}
      <div className="w-80 shrink-0 flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Filters */}
        <div className="p-3 shrink-0 flex flex-wrap gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {FILTERS.map(flt => (
            <button key={flt.key} onClick={() => { setFilter(flt.key); setSelected(null) }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
              style={filter === flt.key
                ? { background: 'rgba(34,201,122,0.12)', color: '#22c97a', border: '1px solid rgba(34,201,122,0.2)' }
                : { color: '#44445a', border: '1px solid transparent' }}>
              {flt.label}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={18} className="animate-spin" style={{ color: '#22c97a' }} /></div>
          ) : conversations.length === 0 ? (
            <EmptyState icon={MessageSquare} title="Konuşma yok" desc="Henüz WhatsApp konuşması başlamadı" />
          ) : conversations.map(c => (
            <button key={c.id} onClick={() => openDetail(c)} className="w-full text-left px-4 py-3 transition-all"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: selected?.id === c.id ? 'rgba(34,201,122,0.06)' : 'transparent' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,201,122,0.1)' }}>
                  <span className="text-[13px] font-bold" style={{ color: '#22c97a' }}>{(c.customerName ?? c.customerPhone).charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className="text-[12px] font-semibold truncate" style={{ color: '#eeeef4' }}>{c.customerName ?? c.customerPhone}</p>
                    <p className="text-[10px] shrink-0" style={{ color: '#44445a' }}>{relTime(c.updatedAt)}</p>
                  </div>
                  <p className="text-[11px] truncate" style={{ color: '#44445a' }}>{c.lastMessage ?? '—'}</p>
                </div>
              </div>
              <div className="mt-1.5 flex justify-end">
                <ConvStatusBadge status={c.status} resolvedBy={c.resolvedBy} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: detail */}
      <div className="flex-1 flex flex-col min-w-0">
        {detailLoading ? (
          <div className="flex items-center justify-center flex-1"><Loader2 size={20} className="animate-spin" style={{ color: '#22c97a' }} /></div>
        ) : !selected ? (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <MessageSquare size={32} style={{ color: '#33334a', margin: '0 auto 12px' }} />
              <p className="text-[13px]" style={{ color: '#44445a' }}>Bir konuşma seçin</p>
            </div>
          </div>
        ) : (
          <>
            {/* Detail header */}
            <div className="px-5 py-3.5 shrink-0 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,201,122,0.1)' }}>
                <span className="text-[14px] font-bold" style={{ color: '#22c97a' }}>{(selected.customerName ?? selected.customerPhone).charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">{selected.customerName ?? selected.customerPhone}</p>
                <div className="flex items-center gap-2">
                  <p className="text-[11px]" style={{ color: '#44445a' }}>{selected.customerPhone}</p>
                  <ConvStatusBadge status={selected.status} resolvedBy={selected.resolvedBy} />
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
              {(selected.messages ?? []).map(m => (
                <div key={m.id} className={cn('flex', m.role === 'customer' ? 'justify-end' : 'justify-start')}>
                  {m.role !== 'customer' && (
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5" style={{ background: 'rgba(34,201,122,0.15)' }}>
                      <Bot size={11} style={{ color: '#22c97a' }} />
                    </div>
                  )}
                  <div className="max-w-[70%]">
                    <div className="px-3.5 py-2 rounded-2xl text-[12px] leading-relaxed" style={m.role === 'customer'
                      ? { background: '#22c97a', color: '#050505', borderRadius: '16px 16px 4px 16px' }
                      : { background: 'rgba(255,255,255,0.06)', color: '#eeeef4', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px 16px 16px 4px' }}>
                      {m.content}
                    </div>
                    <p className="text-[9px] mt-0.5 px-1" style={{ color: '#33334a', textAlign: m.role === 'customer' ? 'right' : 'left' }}>
                      {new Date(m.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      {m.status && ` · ${m.status}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ConvStatusBadge({ status, resolvedBy }: { status: string; resolvedBy?: string | null }) {
  if (status === 'open' && resolvedBy === 'human') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(240,160,32,0.1)', color: '#f0a020' }}>İnsanda</span>
  if (status === 'open')   return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(34,201,122,0.1)', color: '#22c97a' }}>Açık</span>
  if (status === 'closed') return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#8080a0' }}>Çözüldü</span>
  return <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: '#44445a' }}>{status}</span>
}

/* ─── WhatsApp Campaigns Tab ─────────────────────────────────────────────────── */

interface WaCampaign {
  id: string
  name: string
  status: string
  messagesSent: number
  scheduledAt?: string | null
  createdAt: string
}

interface Segment {
  id: string
  name: string
  customerCount: number
  type: string
}

type WaWizardData = {
  name: string
  type: 'broadcast' | 'scheduled'
  description: string
  messageType: 'free' | 'template'
  messageContent: string
  segmentIds: string[]
  scheduledAt: string
  scheduledTime: string
}

const WA_WIZARD_INITIAL: WaWizardData = {
  name: '',
  type: 'broadcast',
  description: '',
  messageType: 'free',
  messageContent: '',
  segmentIds: [],
  scheduledAt: '',
  scheduledTime: '10:00',
}

const WA_VARS = ['{{isim}}', '{{email}}', '{{sipariş_no}}', '{{telefon}}']

function PhonePreview({ content }: { content: string }) {
  const sample = content
    .replace(/\{\{isim\}\}/g, 'Ali')
    .replace(/\{\{email\}\}/g, 'ali@example.com')
    .replace(/\{\{sipariş_no\}\}/g, '#12345')
    .replace(/\{\{telefon\}\}/g, '+90 555 000 0000')

  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="rounded-[24px] overflow-hidden" style={{ width: 190, background: '#111', border: '2px solid rgba(255,255,255,0.1)' }}>
        {/* WA status bar */}
        <div className="px-3 py-2 flex items-center gap-2" style={{ background: '#075e54' }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <MessageSquare size={11} className="text-white" />
          </div>
          <span className="text-white text-[11px] font-semibold">Mağaza</span>
          <span className="ml-auto text-[9px] text-white/60">14:32</span>
        </div>
        {/* Chat area */}
        <div className="px-2 py-3 min-h-[140px]" style={{ background: '#0a0a0a' }}>
          {sample ? (
            <div className="rounded-[4px_12px_12px_12px] px-3 py-2.5 text-[11px] leading-relaxed max-w-[85%]" style={{ background: '#1f2c1f', color: '#e0e0e0', border: '1px solid rgba(34,201,122,0.15)' }}>
              {sample.split('\n').map((line, i) => (
                <span key={i}>{line}{i < sample.split('\n').length - 1 && <br />}</span>
              ))}
              <div className="flex justify-end mt-1.5">
                <span style={{ color: '#22c97a', fontSize: 9 }}>✓✓ 14:32</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-20">
              <p style={{ color: '#33334a', fontSize: 11 }}>Önizleme burada görünür</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-[10px] mt-2" style={{ color: '#44445a' }}>Canlı önizleme</p>
    </div>
  )
}

function WaCampaignsTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error') => void }) {
  const [campaigns, setCampaigns] = useState<WaCampaign[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [step, setStep] = useState(1)
  const [data, setData] = useState<WaWizardData>(WA_WIZARD_INITIAL)
  const [segments, setSegments] = useState<Segment[]>([])
  const [segLoading, setSegLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await fetch('/api/whatsapp/campaigns')
      const d = await res.json()
      setCampaigns(d.campaigns ?? [])
    } catch { /* */ }
    finally { setListLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (step === 3 && segments.length === 0) {
      setSegLoading(true)
      fetch('/api/segments').then(r => r.json()).then(d => {
        if (Array.isArray(d)) setSegments(d)
        else if (d.segments) setSegments(d.segments)
      }).catch(() => {}).finally(() => setSegLoading(false))
    }
  }, [step, segments.length])

  const recipientCount = segments
    .filter(s => data.segmentIds.includes(s.id))
    .reduce((sum, s) => sum + (s.customerCount ?? 0), 0)

  const toggleSegment = (id: string) => {
    setData(p => ({
      ...p,
      segmentIds: p.segmentIds.includes(id) ? p.segmentIds.filter(x => x !== id) : [...p.segmentIds, id],
    }))
  }

  const insertVar = (v: string) => {
    setData(p => ({ ...p, messageContent: p.messageContent + v }))
  }

  const submit = async () => {
    setSaving(true)
    try {
      const scheduledAt = data.type === 'scheduled' && data.scheduledAt
        ? new Date(`${data.scheduledAt}T${data.scheduledTime}`).toISOString()
        : null
      const res = await fetch('/api/whatsapp/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          description: data.description,
          messageContent: data.messageContent,
          segmentIds: data.segmentIds,
          scheduledAt,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Kampanya oluşturulamadı')
      }
      showToast('WhatsApp kampanyası oluşturuldu!')
      setShowWizard(false)
      setStep(1)
      setData(WA_WIZARD_INITIAL)
      load()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Hata oluştu', 'error')
    } finally { setSaving(false) }
  }

  const STEPS = ['Bilgiler', 'Mesaj', 'Alıcılar', 'Gönder']

  const estSeconds = Math.ceil(recipientCount * 2)

  if (showWizard) {
    return (
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-52 shrink-0 flex flex-col p-5 gap-2" style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
          <button onClick={() => { setShowWizard(false); setStep(1); setData(WA_WIZARD_INITIAL) }}
            className="flex items-center gap-1.5 text-[11px] mb-4 transition-colors hover:text-white"
            style={{ color: '#44445a', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={13} /> Geri dön
          </button>
          {STEPS.map((label, i) => {
            const idx = i + 1
            const active = step === idx
            const done = step > idx
            return (
              <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                style={{ background: active ? 'rgba(34,201,122,0.1)' : 'transparent', border: active ? '1px solid rgba(34,201,122,0.2)' : '1px solid transparent' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                  style={{ background: done ? '#22c97a' : active ? 'rgba(34,201,122,0.2)' : 'rgba(255,255,255,0.06)', color: done ? '#050505' : active ? '#22c97a' : '#44445a' }}>
                  {done ? <Check size={10} /> : idx}
                </div>
                <span className="text-[12px] font-semibold" style={{ color: active ? '#22c97a' : done ? '#8080a0' : '#44445a' }}>{label}</span>
              </div>
            )
          })}
        </div>

        {/* Wizard content */}
        <div className="flex-1 overflow-auto p-6 max-w-3xl">
          {/* Progress bar */}
          <div className="w-full h-1 rounded-full mb-6" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${(step / STEPS.length) * 100}%`, background: 'linear-gradient(90deg, #22c97a, #4470ff)' }} />
          </div>

          {/* Step 1: Campaign info */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[16px] font-bold text-white mb-1">Kampanya Bilgileri</h2>
                <p className="text-[12px]" style={{ color: '#44445a' }}>Kampanyanıza bir isim verin ve türünü seçin.</p>
              </div>
              <Field label="Kampanya Adı">
                <input value={data.name} onChange={e => setData(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ramazan Özel Kampanyası" className={inpCls} style={inpStyle} />
              </Field>
              <div>
                <label className="block text-[11px] font-semibold mb-3" style={{ color: '#8080a0' }}>Kampanya Türü</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'broadcast', label: 'Tek Seferlik', desc: 'Hemen veya bir kerede gönder' },
                    { key: 'scheduled', label: 'Zamanlanmış', desc: 'İleri tarihte otomatik gönder' },
                  ].map(opt => (
                    <button key={opt.key} onClick={() => setData(p => ({ ...p, type: opt.key as 'broadcast' | 'scheduled' }))}
                      className="text-left p-4 rounded-xl transition-all"
                      style={{ background: data.type === opt.key ? 'rgba(34,201,122,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${data.type === opt.key ? 'rgba(34,201,122,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                      <p className="text-[13px] font-semibold mb-1" style={{ color: data.type === opt.key ? '#22c97a' : '#eeeef4' }}>{opt.label}</p>
                      <p className="text-[11px]" style={{ color: '#44445a' }}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Açıklama (isteğe bağlı)">
                <textarea value={data.description} onChange={e => setData(p => ({ ...p, description: e.target.value }))}
                  rows={2} placeholder="Kampanya hakkında kısa not..." className={cn(inpCls, 'resize-none')} style={inpStyle} />
              </Field>
              <button onClick={() => setStep(2)} disabled={!data.name.trim()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40 transition-all"
                style={{ background: '#22c97a', color: '#050505' }}>
                İleri <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Step 2: Message */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[16px] font-bold text-white mb-1">Mesaj İçeriği</h2>
                <p className="text-[12px]" style={{ color: '#44445a' }}>Alıcılara gönderilecek mesajı yazın.</p>
              </div>

              {/* Message type */}
              <div className="flex items-center gap-2 p-0.5 rounded-xl w-fit" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {[{ key: 'free', label: 'Serbest Mesaj' }, { key: 'template', label: 'Onaylı Şablon' }].map(opt => (
                  <button key={opt.key} onClick={() => setData(p => ({ ...p, messageType: opt.key as 'free' | 'template' }))}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                    style={data.messageType === opt.key ? { background: 'rgba(255,255,255,0.08)', color: '#eeeef4' } : { color: '#44445a' }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {data.messageType === 'free' && (
                <div className="text-[11px] px-3 py-2 rounded-xl" style={{ background: 'rgba(240,160,32,0.06)', border: '1px solid rgba(240,160,32,0.15)', color: '#f0a020' }}>
                  ⚠️ Serbest mesaj yalnızca son 24 saatte mesajlaşılan kişilere gönderilebilir
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1 space-y-3">
                  <Field label="Mesaj İçeriği">
                    <textarea
                      value={data.messageContent}
                      onChange={e => setData(p => ({ ...p, messageContent: e.target.value }))}
                      rows={7}
                      placeholder={'Merhaba {{isim}},\n\nÖzel teklifimizi kaçırmayın! 🎉\n%30 indirim için tıklayın:\n{{link}}'}
                      className={cn(inpCls, 'resize-none font-mono text-[12px]')}
                      style={inpStyle}
                    />
                  </Field>
                  {/* Variables */}
                  <div>
                    <p className="text-[10px] font-semibold mb-2" style={{ color: '#44445a' }}>Değişken ekle:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {WA_VARS.map(v => (
                        <button key={v} onClick={() => insertVar(v)}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                          style={{ background: 'rgba(34,201,122,0.08)', color: '#22c97a', border: '1px solid rgba(34,201,122,0.15)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,201,122,0.15)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(34,201,122,0.08)')}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px]" style={{ color: '#33334a' }}>{data.messageContent.length}/1024 karakter</p>
                </div>

                {/* Phone preview */}
                <PhonePreview content={data.messageContent} />
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                  <ArrowLeft size={13} /> Geri
                </button>
                <button onClick={() => setStep(3)} disabled={!data.messageContent.trim()}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40"
                  style={{ background: '#22c97a', color: '#050505' }}>
                  İleri <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Recipients */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[16px] font-bold text-white mb-1">Alıcıları Seç</h2>
                <p className="text-[12px]" style={{ color: '#44445a' }}>Mesajın gönderileceği segmentleri seçin.</p>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  {segLoading ? (
                    <div className="flex items-center justify-center py-10"><Loader2 size={18} className="animate-spin" style={{ color: '#22c97a' }} /></div>
                  ) : (
                    <div className="space-y-2">
                      {segments.map(seg => {
                        const sel = data.segmentIds.includes(seg.id)
                        return (
                          <button key={seg.id} onClick={() => toggleSegment(seg.id)}
                            className="w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all"
                            style={{ background: sel ? 'rgba(34,201,122,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${sel ? 'rgba(34,201,122,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-5 h-5 rounded-md flex items-center justify-center"
                                style={{ background: sel ? '#22c97a' : 'rgba(255,255,255,0.06)', border: sel ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                                {sel && <Check size={11} className="text-black" />}
                              </div>
                              <span className="text-[13px] font-medium" style={{ color: sel ? '#22c97a' : '#eeeef4' }}>{seg.name}</span>
                            </div>
                            <span className="text-[11px]" style={{ color: '#44445a' }}>{seg.customerCount ?? 0} kişi</span>
                          </button>
                        )
                      })}
                      {segments.length === 0 && (
                        <p className="text-[12px] py-6 text-center" style={{ color: '#44445a' }}>Henüz segment oluşturulmadı</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Summary box */}
                <div className="w-48 shrink-0 p-4 rounded-xl space-y-2.5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#44445a' }}>Tahmini Erişim</p>
                  <div className="space-y-2">
                    <p className="text-[12px]" style={{ color: '#eeeef4' }}>👥 {recipientCount} müşteri</p>
                    <p className="text-[12px]" style={{ color: '#22c97a' }}>📱 {recipientCount} WA numarası</p>
                    <p className="text-[12px]" style={{ color: '#44445a' }}>🚫 0 abonelikten çıkmış</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                  <ArrowLeft size={13} /> Geri
                </button>
                <button onClick={() => setStep(4)} disabled={data.segmentIds.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40"
                  style={{ background: '#22c97a', color: '#050505' }}>
                  İleri <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Timing & Send */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-[16px] font-bold text-white mb-1">Zamanlama & Gönder</h2>
                <p className="text-[12px]" style={{ color: '#44445a' }}>Gönderim zamanını seçin ve kampanyayı başlatın.</p>
              </div>

              {/* Timing */}
              <div className="space-y-3">
                {[
                  { key: 'broadcast', label: 'Hemen Gönder', desc: "Kaydet'e bastığında gönderilir" },
                  { key: 'scheduled', label: 'Zamanla', desc: 'Belirlediğin tarih ve saatte gönderilir' },
                ].map(opt => (
                  <button key={opt.key} onClick={() => setData(p => ({ ...p, type: opt.key as 'broadcast' | 'scheduled' }))}
                    className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                    style={{ background: data.type === opt.key ? 'rgba(34,201,122,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${data.type === opt.key ? 'rgba(34,201,122,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: data.type === opt.key ? '#22c97a' : 'rgba(255,255,255,0.2)' }}>
                      {data.type === opt.key && <div className="w-2 h-2 rounded-full" style={{ background: '#22c97a' }} />}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: data.type === opt.key ? '#22c97a' : '#eeeef4' }}>{opt.label}</p>
                      <p className="text-[11px]" style={{ color: '#44445a' }}>{opt.desc}</p>
                    </div>
                  </button>
                ))}

                {data.type === 'scheduled' && (
                  <div className="grid grid-cols-2 gap-3 pl-7">
                    <Field label="Tarih">
                      <input type="date" value={data.scheduledAt} onChange={e => setData(p => ({ ...p, scheduledAt: e.target.value }))}
                        className={inpCls} style={inpStyle} />
                    </Field>
                    <Field label="Saat">
                      <input type="time" value={data.scheduledTime} onChange={e => setData(p => ({ ...p, scheduledTime: e.target.value }))}
                        className={inpCls} style={inpStyle} />
                    </Field>
                  </div>
                )}
              </div>

              {/* WA send rate warning */}
              {recipientCount > 0 && (
                <div className="p-3.5 rounded-xl text-[11px] leading-relaxed"
                  style={{ background: 'rgba(240,160,32,0.06)', border: '1px solid rgba(240,160,32,0.15)', color: '#f0a020' }}>
                  ⚠️ <strong>WhatsApp Gönderim Hızı:</strong> Spam engellemek için mesajlar arasında 1–3 saniye beklenir.
                  <br />{recipientCount} mesaj ≈ ~{estSeconds} saniye
                </div>
              )}

              {/* Summary */}
              <div className="p-4 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#44445a' }}>Özet</p>
                <div className="space-y-1.5 text-[12px]">
                  <p><span style={{ color: '#44445a' }}>Kampanya:</span> <span style={{ color: '#eeeef4' }}>{data.name}</span></p>
                  <p><span style={{ color: '#44445a' }}>Tür:</span> <span style={{ color: '#eeeef4' }}>{data.type === 'broadcast' ? 'Hemen Gönder' : 'Zamanlanmış'}</span></p>
                  <p><span style={{ color: '#44445a' }}>Alıcı:</span> <span style={{ color: '#22c97a' }}>{recipientCount} kişi</span></p>
                  {data.type === 'scheduled' && data.scheduledAt && (
                    <p><span style={{ color: '#44445a' }}>Zaman:</span> <span style={{ color: '#f0a020' }}>{data.scheduledAt} {data.scheduledTime}</span></p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                  <ArrowLeft size={13} /> Geri
                </button>
                <button onClick={submit} disabled={saving || (data.type === 'scheduled' && !data.scheduledAt)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40 transition-all"
                  style={{ background: '#22c97a', color: '#050505' }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {saving ? 'Oluşturuluyor…' : '🚀 Kampanyayı Başlat'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ── Campaign list ── */
  const waCampaignStatus: Record<string, { label: string; color: string; bg: string }> = {
    completed: { label: 'Gönderildi', color: '#22c97a', bg: 'rgba(34,201,122,0.1)' },
    scheduled: { label: 'Zamanlandı', color: '#f0a020', bg: 'rgba(240,160,32,0.1)' },
    draft:     { label: 'Taslak',     color: '#8080a0', bg: 'rgba(255,255,255,0.04)' },
    sending:   { label: 'Gönderiliyor', color: '#4470ff', bg: 'rgba(68,112,255,0.1)' },
    failed:    { label: 'Başarısız',  color: '#e84545', bg: 'rgba(232,69,69,0.1)'  },
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[15px] font-bold text-white">WhatsApp Kampanyaları</h2>
          <p className="text-[12px] mt-0.5" style={{ color: '#44445a' }}>Toplu WhatsApp mesajları oluşturun ve gönderin</p>
        </div>
        <button onClick={() => { setShowWizard(true); setStep(1); setData(WA_WIZARD_INITIAL) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
          style={{ background: '#22c97a', color: '#050505' }}>
          <Plus size={14} /> Yeni Kampanya
        </button>
      </div>

      {listLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={20} className="animate-spin" style={{ color: '#22c97a' }} /></div>
      ) : campaigns.length === 0 ? (
        <EmptyState icon={Send} title="Henüz WhatsApp kampanyası yok" desc="Müşterilerinize toplu WhatsApp mesajı gönderin"
          action="İlk Kampanyayı Oluştur" onAction={() => setShowWizard(true)} />
      ) : (
        <div className="space-y-2">
          {campaigns.map(c => {
            const sc = waCampaignStatus[c.status] ?? waCampaignStatus.draft
            const dateStr = c.scheduledAt
              ? new Date(c.scheduledAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              : new Date(c.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
            return (
              <div key={c.id} className="p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(34,201,122,0.1)', border: '1px solid rgba(34,201,122,0.15)' }}>
                      <MessageSquare size={16} style={{ color: '#22c97a' }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>{c.name}</p>
                      <p className="text-[11px]" style={{ color: '#44445a' }}>{dateStr}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {c.messagesSent > 0 && (
                      <p className="text-[11px]" style={{ color: '#44445a' }}>📱 {c.messagesSent} gönderildi</p>
                    )}
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
                      style={{ background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
