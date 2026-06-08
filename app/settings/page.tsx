'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  User, CreditCard, Link2, Mail, MessageCircle, Sparkles, Bell, Users, Shield,
  AlertTriangle, Check, Eye, EyeOff, Copy, Link2Off, RefreshCw, Loader2,
  AlertCircle, ShoppingBag, Globe, ChevronRight, ChevronLeft, Package, X, Settings, Trash2,
  Globe2, CheckCircle2, Clock, Plus, ShoppingCart, Key, Download, Pause,
  Send, Lock, Phone, Store, Bot, Upload, Webhook,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useSettingsDrawer } from '@/lib/settings-drawer-context'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab =
  | 'hesap' | 'billing' | 'integrations' | 'email'
  | 'whatsapp' | 'ai-studio' | 'notifications' | 'team' | 'security' | 'danger'

const tabs: Array<{ key: Tab; label: string; icon: React.ElementType; danger?: boolean }> = [
  { key: 'hesap',         label: 'Hesap',             icon: User           },
  { key: 'billing',       label: 'Plan & Faturalama', icon: CreditCard     },
  { key: 'integrations',  label: 'Entegrasyonlar',    icon: Link2          },
  { key: 'email',         label: 'E-posta Gönderimi', icon: Mail           },
  { key: 'whatsapp',      label: 'WhatsApp AI',       icon: MessageCircle  },
  { key: 'ai-studio',     label: 'AI Studio',         icon: Sparkles       },
  { key: 'notifications', label: 'Bildirimler',       icon: Bell           },
  { key: 'team',          label: 'Takım',             icon: Users          },
  { key: 'security',      label: 'Güvenlik',          icon: Shield         },
  { key: 'danger',        label: 'Tehlikeli Bölge',   icon: AlertTriangle, danger: true },
]

interface Integration {
  id: string; platform: string; shopDomain?: string; status: string
  lastSyncAt?: string; meta?: string
}
interface IntegrationMeta {
  shopName?: string; webhooksRegistered?: boolean
  syncInProgress?: boolean; lastSync?: SyncStats
}
interface SyncStats {
  customers: number; orders: number; products: number; abandonedCarts: number
  completedAt: string; durationMs: number
}
interface EmailDomain {
  id: string; domain: string; status: string; dnsRecords: string
  fromEmail?: string; createdAt: string
}
interface DnsRecord {
  type: string; name: string; value: string; status?: string; priority?: number
}
interface ModalField { key: string; label: string; placeholder: string; secret?: boolean; hint?: string }

function parseMeta(raw?: string): IntegrationMeta {
  try { return raw ? JSON.parse(raw) as IntegrationMeta : {} } catch { return {} }
}

// ─── Shared Helpers ───────────────────────────────────────────────────────────

function SectionHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>{title}</h2>
      {desc && <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>{desc}</p>}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'verified' || status === 'active') return (
    <span className="chip chip-green inline-flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3" /> {status === 'active' ? 'Bağlı' : 'Doğrulandı'}
    </span>
  )
  if (status === 'failed') return (
    <span className="chip chip-red inline-flex items-center gap-1">
      <AlertCircle className="w-3 h-3" /> Hata
    </span>
  )
  return (
    <span className="chip chip-amber inline-flex items-center gap-1">
      <Clock className="w-3 h-3" /> Bekliyor
    </span>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="shrink-0 p-1.5 rounded-lg transition-all btn-ghost">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5 last:border-0"
      style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="relative inline-flex rounded-full transition-colors"
      style={{ height: '22px', width: '40px', background: checked ? 'var(--blue)' : 'var(--surface-3)', border: '1px solid var(--border)' }}>
      <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0')} />
    </button>
  )
}

function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={saving}
      className={cn('btn-primary gap-2', saved ? '!bg-emerald-600 !border-emerald-600' : '')}>
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
      {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi' : 'Değişiklikleri Kaydet'}
    </button>
  )
}

// ─── Integration Modal ────────────────────────────────────────────────────────

function IntegrationModal({
  name, fields, connectUrl, syncUrl, disconnectUrl,
  integration, onClose, onSuccess,
}: {
  name: string; fields: ModalField[]
  connectUrl: string; syncUrl?: string; disconnectUrl: string
  integration?: Integration; onClose: () => void; onSuccess: () => void
}) {
  const isConnected = integration?.status === 'active'
  const [values, setValues] = useState<Record<string, string>>({})
  const [show, setShow]     = useState<Record<string, boolean>>({})
  const [loading, setLoading]   = useState(false)
  const [syncing, setSyncing]   = useState(false)
  const [error, setError]       = useState('')
  const [syncResult, setSyncResult] = useState('')

  async function handleConnect() {
    setLoading(true); setError('')
    try {
      const res  = await fetch(connectUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
      const data = await res.json() as { error?: string }
      if (!res.ok) throw new Error(data.error)
      onSuccess(); onClose()
    } catch (e) { setError(e instanceof Error ? e.message : 'Bağlantı hatası') }
    finally { setLoading(false) }
  }

  async function handleSync() {
    if (!syncUrl) return
    setSyncing(true)
    try {
      const res  = await fetch(syncUrl, { method: 'POST' })
      const data = await res.json() as { error?: string; message?: string }
      if (!res.ok) throw new Error(data.error)
      setSyncResult(data.message ?? 'Senkronizasyon tamamlandı'); onSuccess()
    } catch (e) { setError(e instanceof Error ? e.message : 'Sync hatası') }
    finally { setSyncing(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--text-1)' }}>{name} Ayarları</h3>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {isConnected && (
            <div className="ds-alert ds-alert-success">
              <Check className="w-4 h-4 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold">{name} Bağlı</p>
                {integration?.lastSyncAt && (
                  <p style={{ color: 'var(--text-3)' }}>Son sync: {new Date(integration.lastSyncAt).toLocaleString('tr-TR')}</p>
                )}
              </div>
            </div>
          )}
          {fields.map(f => (
            <div key={f.key}>
              <label className="label mb-1.5 block">{f.label}</label>
              <div className="relative">
                <input
                  type={f.secret && !show[f.key] ? 'password' : 'text'}
                  value={values[f.key] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder} className="input w-full pr-9"
                />
                {f.secret && (
                  <button type="button" onClick={() => setShow(s => ({ ...s, [f.key]: !s[f.key] }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 btn-ghost p-0.5 rounded">
                    {show[f.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              {f.hint && <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>{f.hint}</p>}
            </div>
          ))}
          {error && <div className="ds-alert ds-alert-error"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}</div>}
          {syncResult && <div className="ds-alert ds-alert-success text-xs">✓ {syncResult}</div>}
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleConnect} disabled={loading} className="btn-primary flex-1 justify-center gap-2">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
              {isConnected ? 'Güncelle' : 'Bağla'}
            </button>
            {isConnected && syncUrl && (
              <button onClick={handleSync} disabled={syncing} className="btn-secondary gap-1.5 px-3">
                {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Sync
              </button>
            )}
            {isConnected && (
              <button onClick={async () => { await fetch(disconnectUrl, { method: 'POST' }); onSuccess(); onClose() }} className="btn-danger gap-1.5 px-3">
                <Link2Off className="w-3.5 h-3.5" /> Kes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({
  icon: Icon, name, desc, iconBg, iconColor, badge, integration,
  modalFields, connectUrl, syncUrl, disconnectUrl, onConnected, comingSoon,
}: {
  icon: React.ElementType; name: string; desc: string; iconBg: string; iconColor?: string; badge?: string
  integration?: Integration; modalFields: ModalField[]
  connectUrl: string; syncUrl?: string; disconnectUrl: string
  onConnected: () => void; comingSoon?: boolean
}) {
  const [showModal, setShowModal] = useState(false)
  const isConnected = integration?.status === 'active'

  if (comingSoon) {
    return (
      <div className="flex items-center gap-4 px-5 py-4 rounded-xl opacity-40"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          <Icon className="w-5 h-5" style={{ color: iconColor ?? 'white' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{name}</p>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{desc}</p>
        </div>
        <span className="chip chip-muted">Yakında</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-4 px-5 py-4 rounded-xl transition-all"
        style={{ background: 'var(--surface)', border: isConnected ? '1px solid rgba(34,201,122,0.2)' : '1px solid var(--border)' }}>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          <Icon className="w-5 h-5" style={{ color: iconColor ?? 'white' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{name}</p>
            {badge && <span className="chip chip-violet">{badge}</span>}
            {isConnected && (
              <span className="chip chip-green inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Bağlı
              </span>
            )}
          </div>
          <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
            {isConnected && integration?.shopDomain ? integration.shopDomain : desc}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-ghost p-2 rounded-lg">
          <Settings className="w-4 h-4" />
        </button>
      </div>
      {showModal && (
        <IntegrationModal
          name={name} fields={modalFields}
          connectUrl={connectUrl} syncUrl={syncUrl} disconnectUrl={disconnectUrl}
          integration={integration}
          onClose={() => setShowModal(false)}
          onSuccess={() => { onConnected(); setShowModal(false) }}
        />
      )}
    </>
  )
}

// ─── DNS Record Row ───────────────────────────────────────────────────────────

function DnsRecordRow({ record }: { record: DnsRecord }) {
  const statusColor = record.status === 'verified' ? 'text-emerald-400'
    : record.status === 'not_started' ? '' : 'text-amber-400'
  return (
    <div className="grid grid-cols-[80px_1fr_1fr_80px] gap-3 items-center py-3 last:border-0"
      style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="chip chip-blue font-mono text-center">{record.type}</span>
      <p className="text-xs font-mono truncate" style={{ color: 'var(--text-2)' }}>{record.name}</p>
      <div className="flex items-center gap-1.5 min-w-0">
        <p className="text-xs font-mono truncate flex-1" style={{ color: 'var(--text-3)' }}>{record.value}</p>
        <CopyButton value={record.value} />
      </div>
      <div className="flex justify-end">
        {record.status ? (
          <span className={cn('text-[11px] font-semibold', statusColor || '')} style={!statusColor ? { color: 'var(--text-3)' } : {}}>
            {record.status === 'verified' ? '✓ OK' : record.status === 'not_started' ? '— Bekliyor' : '⏳ Kontrol...'}
          </span>
        ) : <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>—</span>}
      </div>
    </div>
  )
}

// ─── Shopify Settings Button ──────────────────────────────────────────────────

function ShopifySettingsButton({ integration, onConnected }: { integration?: Integration; onConnected: () => void }) {
  const [showModal, setShowModal]   = useState(false)
  const [domain, setDomain]         = useState('')
  const [syncing, setSyncing]       = useState(false)
  const [syncResult, setSyncResult] = useState<{ stats?: { customers: number; orders: number; products: number; abandonedCarts: number }; error?: string } | null>(null)
  const [polling, setPolling]       = useState(false)
  const isConnected = integration?.status === 'active'
  const meta        = parseMeta(integration?.meta)

  async function handleSync() {
    setSyncing(true); setSyncResult(null)
    try {
      const res  = await fetch('/api/integrations/shopify/sync', { method: 'POST' })
      const data = await res.json() as { error?: string; stats?: { customers: number; orders: number; products: number; abandonedCarts: number } }
      if (!res.ok) throw new Error(data.error)
      setSyncResult({ stats: data.stats }); onConnected()
    } catch (e) { setSyncResult({ error: e instanceof Error ? e.message : 'Hata' }) }
    finally { setSyncing(false) }
  }

  useEffect(() => {
    if (!isConnected || !meta.syncInProgress) { setPolling(false); return }
    setPolling(true)
    const id = setInterval(async () => {
      const res = await fetch('/api/integrations/shopify/status').catch(() => null)
      if (!res?.ok) return
      const data = await res.json() as { syncInProgress?: boolean }
      if (!data.syncInProgress) { setPolling(false); clearInterval(id); onConnected() }
    }, 3000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, meta.syncInProgress])

  return (
    <>
      <button onClick={() => setShowModal(true)} className="btn-ghost p-2 rounded-lg">
        <Settings className="w-4 h-4" />
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(150,191,72,0.12)', border: '1px solid rgba(150,191,72,0.2)' }}>
                  <ShoppingBag className="w-4 h-4" style={{ color: '#96bf48' }} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{isConnected ? (meta.shopName ?? integration?.shopDomain) : 'Mağaza Bağla'}</h3>
                  {isConnected && <p className="text-[11px] font-mono" style={{ color: 'var(--text-3)' }}>{integration?.shopDomain}</p>}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              {isConnected ? (
                <>
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(34,201,122,0.06)', border: '1px solid rgba(34,201,122,0.15)' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-emerald-400">Bağlı</span>
                      {meta.webhooksRegistered && <span className="chip chip-green font-mono text-[10px]">webhooks ✓</span>}
                    </div>
                    {integration?.lastSyncAt && (
                      <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                        Son sync: {new Date(integration.lastSyncAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {meta.lastSync && (
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Ürünler',    value: meta.lastSync.products,       icon: Package      },
                        { label: 'Müşteriler', value: meta.lastSync.customers,      icon: Users        },
                        { label: 'Siparişler', value: meta.lastSync.orders,         icon: ShoppingBag  },
                        { label: 'Sepet Terk', value: meta.lastSync.abandonedCarts, icon: ShoppingCart },
                      ].map(s => (
                        <div key={s.label} className="bento-card p-3 text-center">
                          <s.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: 'var(--text-3)' }} />
                          <p className="text-sm font-bold font-mono" style={{ color: 'var(--text-1)' }}>{s.value.toLocaleString('tr-TR')}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {syncResult?.stats && (
                    <div className="ds-alert ds-alert-success text-xs">
                      <div>
                        <p className="font-semibold">✓ Senkronizasyon tamamlandı</p>
                        <p style={{ color: 'var(--text-3)' }}>{syncResult.stats.products} ürün · {syncResult.stats.customers} müşteri · {syncResult.stats.orders} sipariş</p>
                      </div>
                    </div>
                  )}
                  {syncResult?.error && <div className="ds-alert ds-alert-error"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {syncResult.error}</div>}
                  <div className="flex items-center gap-3 pt-1">
                    <button onClick={handleSync} disabled={syncing || polling} className="btn-secondary flex-1 justify-center gap-2 disabled:opacity-40">
                      {(syncing || polling) ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      {syncing ? 'Senkronize ediliyor...' : polling ? 'Sync devam ediyor...' : 'Tüm Veriyi Senkronize Et'}
                    </button>
                    <button onClick={async () => { await fetch('/api/integrations/shopify/disconnect', { method: 'POST' }); onConnected(); setShowModal(false) }} className="btn-danger gap-1.5 px-4">
                      Bağlantıyı Kes
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl px-4 py-3" style={{ background: 'var(--blue-soft)', border: '1px solid rgba(68,112,255,0.15)' }}>
                    <p className="text-xs font-semibold" style={{ color: 'var(--blue)' }}>OAuth bağlantısı</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>Mağaza adresini gir → İzin sayfasına yönlendirilirsin → İzin ver → Otomatik bağlanır.</p>
                  </div>
                  <div>
                    <label className="label mb-1.5 block">Mağaza Domain</label>
                    <div className="flex gap-2">
                      <input value={domain} onChange={e => setDomain(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && domain) window.location.href = `/api/integrations/shopify/auth?shop=${encodeURIComponent(domain.replace(/^https?:\/\//, '').replace(/\/$/, ''))}` }}
                        placeholder="magazaniz.myshopify.com" className="input flex-1" />
                      <button onClick={() => { if (domain) window.location.href = `/api/integrations/shopify/auth?shop=${encodeURIComponent(domain.replace(/^https?:\/\//, '').replace(/\/$/, ''))}` }}
                        disabled={!domain} className="btn-primary gap-2 disabled:opacity-40" style={{ background: '#96bf48', borderColor: '#96bf48' }}>
                        <ShoppingBag className="w-4 h-4" /> Bağlan
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Mail Domain Section ──────────────────────────────────────────────────────

function MailDomainSection() {
  const [domains, setDomains]     = useState<EmailDomain[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [creating, setCreating]   = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [error, setError]         = useState('')
  const [showAdd, setShowAdd]     = useState(false)

  const loadDomains = useCallback(async () => {
    try { const res = await fetch('/api/email/domain'); const d = await res.json() as { domains?: EmailDomain[] }; setDomains(d.domains ?? []) } catch {}
  }, [])

  useEffect(() => { loadDomains() }, [loadDomains])

  async function handleCreate() {
    if (!newDomain.trim()) return
    setCreating(true); setError('')
    try {
      const res  = await fetch('/api/email/domain', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: newDomain.trim() }) })
      const text = await res.text()
      const data = text ? JSON.parse(text) as { error?: string } : {}
      if (!res.ok) throw new Error(data.error ?? `Sunucu hatası (${res.status})`)
      await loadDomains(); setNewDomain(''); setShowAdd(false)
    } catch (e) { setError(e instanceof Error ? e.message : 'Beklenmeyen hata') }
    finally { setCreating(false) }
  }

  async function handleVerify(domainId: string) {
    setVerifying(domainId)
    try {
      const res  = await fetch('/api/email/domain/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domainId }) })
      const text = await res.text()
      const data = text ? JSON.parse(text) as { error?: string } : {}
      if (!res.ok) { setError(data.error ?? 'Doğrulama başarısız'); return }
      await loadDomains()
    } catch (e) { setError(e instanceof Error ? e.message : 'Hata') }
    finally { setVerifying(null) }
  }

  async function handleDelete(domainId: string) {
    setDeleting(domainId)
    try { await fetch(`/api/email/domain/${domainId}`, { method: 'DELETE' }); await loadDomains() }
    finally { setDeleting(null) }
  }

  return (
    <div className="space-y-3">
      {/* Coming-soon notice */}
      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
        style={{ background: 'rgba(240,160,32,0.06)', border: '1px solid rgba(240,160,32,0.18)' }}>
        <Lock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--amber)' }} />
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--amber)' }}>Özel Domain — Manuel Kurulum Gerekli</p>
          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-3)' }}>
            Tüm gönderimler şu an <span className="font-mono" style={{ color: 'var(--text-2)' }}>noreply@mg.marksio.com</span> üzerinden yapılmaktadır.
            Kendi domaininizi kullanmak için <a href="mailto:destek@marksio.com" className="underline" style={{ color: 'var(--text-2)' }}>destek@marksio.com</a> ile iletişime geçin.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Bağlı Domainler</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>SPF, DKIM, DMARC kayıtlarıyla kendi domaininizden gönderin</p>
        </div>
        <button disabled className="btn-secondary text-xs gap-1.5 px-3 py-2 opacity-40 cursor-not-allowed">
          <Plus className="w-3.5 h-3.5" /> Domain Ekle <span className="chip chip-muted ml-1">Yakında</span>
        </button>
      </div>

      {showAdd && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--surface-2)', border: '1px solid rgba(68,112,255,0.2)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-1)' }}>Yeni Domain Ekle</p>
          <div className="flex gap-2">
            <input value={newDomain} onChange={e => setNewDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="markaniz.com" className="input flex-1" />
            <button onClick={handleCreate} disabled={creating || !newDomain.trim()} className="btn-primary gap-2 disabled:opacity-40">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost p-2.5 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          {error && <div className="ds-alert ds-alert-error"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}</div>}
        </div>
      )}

      <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
        style={{ background: 'rgba(34,201,122,0.05)', border: '1px solid rgba(34,201,122,0.15)' }}>
        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#22c97a' }} />
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
          Tüm e-postalar Marksio&apos;nun doğrulanmış domain&apos;i{' '}
          <span className="font-mono" style={{ color: 'var(--text-2)' }}>mg.marksio.com</span>{' '}
          üzerinden gönderilmektedir. Özel domain desteği yakında eklenecektir.
        </p>
      </div>

      {domains.map(d => {
        let records: DnsRecord[] = []
        try { records = JSON.parse(d.dnsRecords) as DnsRecord[] } catch {}
        return (
          <div key={d.id} className="rounded-xl overflow-hidden"
            style={{ border: d.status === 'verified' ? '1px solid rgba(34,201,122,0.2)' : '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="px-5 py-4 flex items-center gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: d.status === 'verified' ? 'rgba(34,201,122,0.1)' : 'var(--surface-2)', border: `1px solid ${d.status === 'verified' ? 'rgba(34,201,122,0.2)' : 'var(--border)'}` }}>
                <Globe2 className={cn('w-5 h-5', d.status === 'verified' ? 'text-emerald-400' : '')} style={d.status !== 'verified' ? { color: 'var(--text-3)' } : {}} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{d.domain}</p>
                  <StatusBadge status={d.status} />
                </div>
                {d.fromEmail && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Gönderici: <span className="font-mono" style={{ color: 'var(--text-2)' }}>{d.fromEmail}</span></p>}
              </div>
              <div className="flex items-center gap-2">
                {d.status !== 'verified' && (
                  <button onClick={() => handleVerify(d.id)} disabled={verifying === d.id} className="btn-secondary text-xs gap-1.5 px-3 py-1.5">
                    {verifying === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Doğrula
                  </button>
                )}
                <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id} className="p-1.5 rounded-lg transition-colors hover:text-red-400" style={{ color: 'var(--text-3)' }}>
                  {deleting === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {records.length > 0 && (
              <div className="px-5 pb-2">
                <div className="grid grid-cols-[80px_1fr_1fr_80px] gap-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Tip', 'İsim', 'Değer', 'Durum'].map(h => (
                    <p key={h} className={cn('text-[11px] font-semibold label uppercase', h === 'Durum' ? 'text-right' : '')}>{h}</p>
                  ))}
                </div>
                {records.map((rec, i) => <DnsRecordRow key={i} record={rec} />)}
              </div>
            )}
            {d.status !== 'verified' && records.length > 0 && (
              <div className="px-5 py-3" style={{ background: 'rgba(240,160,32,0.04)', borderTop: '1px solid rgba(240,160,32,0.1)' }}>
                <p className="text-xs" style={{ color: 'rgba(240,160,32,0.8)' }}>Bu DNS kayıtlarını domain sağlayıcınıza ekleyin, ardından &quot;Doğrula&quot; butonuna basın. DNS yayılması 5–60 dakika sürebilir.</p>
              </div>
            )}
            {d.status === 'verified' && (
              <div className="px-5 py-3" style={{ background: 'rgba(34,201,122,0.04)', borderTop: '1px solid rgba(34,201,122,0.1)' }}>
                <p className="text-xs text-emerald-400">Domain doğrulandı. Kampanyalarınızda <strong className="font-mono">{d.fromEmail}</strong> adresini kullanabilirsiniz.</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//   SECTIONS
// ═══════════════════════════════════════════════════════════════

// ─── Hesap ────────────────────────────────────────────────────────────────────

function HesapSection() {
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [storeName, setStoreName] = useState('')
  const [phone, setPhone]         = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [loaded, setLoaded]       = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/settings/profile').then(r => r.json()).then((d: { name?: string; email?: string; storeName?: string; phone?: string; avatarUrl?: string }) => {
      setName(d.name ?? ''); setEmail(d.email ?? ''); setStoreName(d.storeName ?? ''); setPhone(d.phone ?? '')
      setAvatarUrl(d.avatarUrl ?? '')
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  async function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError('')
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      setUploadError('Geçersiz dosya türü. JPG, PNG veya WebP olmalı.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Dosya çok büyük (maks 5MB).')
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/settings/avatar', { method: 'POST', body: form })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Yükleme başarısız')
      setAvatarUrl(data.url ?? '')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Yükleme başarısız')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/settings/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, storeName, phone }) })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    setSaving(false)
  }

  if (!loaded) return <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-3)' }} /></div>

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <div className="space-y-4">
      <SectionHeader title="Hesap Bilgileri" desc="Kişisel bilgilerinizi ve profil ayarlarınızı yönetin" />

      <div className="bento-card p-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 pb-5 mb-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden relative group"
            style={{ background: 'var(--blue-soft)', border: '1px solid rgba(68,112,255,0.2)' }}
            title="Fotoğraf yükle">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold" style={{ color: 'var(--blue)' }}>{initials}</span>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Upload className="w-4 h-4 text-white" />}
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarSelect} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Profil Fotoğrafı</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>JPG, PNG veya WebP — maks 5MB</p>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="btn-ghost text-xs mt-2 gap-1.5 disabled:opacity-40">
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}
            </button>
            {uploadError && <p className="text-[11px] mt-1" style={{ color: 'var(--red)' }}>{uploadError}</p>}
          </div>
        </div>

        <SettingRow label="Ad Soyad">
          <input value={name} onChange={e => setName(e.target.value)} className="input w-52" placeholder="Adınız Soyadınız" />
        </SettingRow>
        <SettingRow label="E-posta" desc="Giriş e-postanız değiştirilemez">
          <input value={email} readOnly className="input w-52 opacity-50 cursor-not-allowed" />
        </SettingRow>
        <SettingRow label="Şirket / Mağaza Adı" desc="Müşterilerinize gösterilen marka adı">
          <input value={storeName} onChange={e => setStoreName(e.target.value)} className="input w-52" placeholder="Markanız" />
        </SettingRow>
        <SettingRow label="Telefon" desc="İletişim numaranız">
          <input value={phone} onChange={e => setPhone(e.target.value)} className="input w-52" placeholder="+90 555 000 0000" />
        </SettingRow>

        <div className="pt-4">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} />
        </div>
      </div>
    </div>
  )
}

// ─── Plan & Faturalama ────────────────────────────────────────────────────────

function BillingSection() {
  const planMap: Record<string, { name: string; price: string; emails: string; color: string }> = {
    starter: { name: 'Starter',   price: 'Ücretsiz',  emails: '5.000',    color: '#8080a0' },
    growth:  { name: 'Growth',    price: '$49/ay',    emails: '50.000',   color: 'var(--blue)' },
    pro:     { name: 'Pro',       price: '$99/ay',    emails: '200.000',  color: 'var(--violet)' },
    scale:   { name: 'Scale',     price: '$249/ay',   emails: 'Sınırsız', color: '#f0a020' },
  }
  const plan = planMap['growth']

  return (
    <div className="space-y-4">
      <SectionHeader title="Plan ve Faturalandırma" desc="Aboneliğinizi ve fatura bilgilerinizi yönetin" />

      {/* Current plan card */}
      <div className="relative p-6 rounded-xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1729 0%, #0a0f1e 100%)', border: '1px solid rgba(68,112,255,0.2)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl opacity-30"
          style={{ background: 'var(--blue)' }} />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(68,112,255,0.7)' }}>Mevcut Plan</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>{plan.name}</p>
            <p className="text-sm mt-1.5" style={{ color: 'rgba(68,112,255,0.6)' }}>{plan.price} · {plan.emails} e-posta</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--blue-soft)', border: '1px solid rgba(68,112,255,0.2)' }}>
            <CreditCard className="w-5 h-5" style={{ color: 'var(--blue)' }} />
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="bento-card p-5 space-y-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Kullanım Durumu</p>
        {[
          { label: 'E-posta Gönderimi', used: 12400, total: 50000, color: 'var(--blue)' },
          { label: 'Müşteri Kaydı',     used: 2431,  total: 10000, color: 'var(--violet)' },
          { label: 'Otomasyon Akışı',   used: 4,     total: 10,    color: 'var(--green)' },
        ].map(u => (
          <div key={u.label}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs" style={{ color: 'var(--text-2)' }}>{u.label}</p>
              <p className="text-xs font-mono" style={{ color: 'var(--text-2)' }}>{u.used.toLocaleString('tr-TR')} / {u.total.toLocaleString('tr-TR')}</p>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((u.used / u.total) * 100, 100)}%`, background: u.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Renewal + actions */}
      <div className="bento-card divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
        {[
          { label: 'Yenileme Tarihi',  value: '15 Haziran 2026', action: null },
          { label: 'Fatura Geçmişi',   value: '3 fatura',         action: <button className="btn-ghost text-xs px-2 py-1 rounded gap-1.5"><Download className="w-3 h-3" /> İndir</button> },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between px-5 py-3.5">
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>{row.label}</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{row.value}</p>
              {row.action}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <a href="/plans" className="btn-primary flex-1 justify-center gap-2">
          <ChevronRight className="w-4 h-4" /> Planı Yükselt
        </a>
        <button className="btn-ghost flex-1 justify-center gap-2 opacity-50 cursor-not-allowed">
          Kart Güncelle <span className="chip chip-muted">Yakında</span>
        </button>
      </div>

      <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-colors hover:bg-red-500/10"
        style={{ color: 'var(--red)', border: '1px solid rgba(232,69,69,0.15)' }}>
        <Pause className="w-4 h-4" /> Planı İptal Et
      </button>
    </div>
  )
}

// ─── Entegrasyonlar ───────────────────────────────────────────────────────────

function EntegrasyonlarSection({ integrations, onRefresh, oauthSuccess }: {
  integrations: Integration[]
  onRefresh: () => void
  oauthSuccess: boolean
}) {
  const shopify   = integrations.find(i => i.platform === 'shopify')
  const ikas      = integrations.find(i => i.platform === 'ikas')
  const woo       = integrations.find(i => i.platform === 'woocommerce')
  const whatsapp  = integrations.find(i => i.platform === 'whatsapp')
  const resend    = integrations.find(i => i.platform === 'resend')

  return (
    <div className="space-y-6">
      <SectionHeader title="Entegrasyonlar" desc="Mağaza, pazarlama ve iletişim araçlarınızı bağlayın" />

      {oauthSuccess && (
        <div className="ds-alert ds-alert-success">
          <Check className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-400">Shopify başarıyla bağlandı!</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Veriyi senkronize etmek için Shopify ayar butonuna bas.</p>
          </div>
        </div>
      )}

      {/* E-ticaret */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--text-3)' }}>E-Ticaret Platformları</p>

        {/* Shopify */}
        <div className="flex items-center gap-4 px-5 py-4 rounded-xl"
          style={{ background: 'var(--surface)', border: shopify?.status === 'active' ? '1px solid rgba(34,201,122,0.2)' : '1px solid var(--border)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(150,191,72,0.12)', border: '1px solid rgba(150,191,72,0.2)' }}>
            <ShoppingBag className="w-5 h-5" style={{ color: '#96bf48' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Shopify</p>
              {shopify?.status === 'active' && <span className="chip chip-green inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Bağlı</span>}
            </div>
            <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{shopify?.shopDomain ?? 'Sipariş, müşteri ve sepet verilerini çek'}</p>
          </div>
          <ShopifySettingsButton integration={shopify} onConnected={onRefresh} />
        </div>

        <IntegrationCard
          icon={Store} name="İkas" desc="Sipariş ve müşteri verilerini çek" iconBg="bg-purple-900" iconColor="#c084fc"
          integration={ikas} onConnected={onRefresh}
          connectUrl="/api/integrations/ikas/connect" syncUrl="/api/integrations/ikas/sync" disconnectUrl="/api/integrations/ikas/disconnect"
          modalFields={[
            { key: 'storeName',   label: 'Mağaza Adı',  placeholder: 'magazaniz',  hint: 'İkas panelindeki mağaza adı' },
            { key: 'accessToken', label: 'API Token',    placeholder: 'ey...',      secret: true, hint: 'İkas Admin → API → Token oluştur' },
          ]}
        />

        <IntegrationCard
          icon={Globe} name="WooCommerce" desc="WordPress/WooCommerce sipariş ve müşteri verilerini çek" iconBg="bg-blue-900" iconColor="#60a5fa"
          integration={woo} onConnected={onRefresh}
          connectUrl="/api/integrations/woocommerce/connect" syncUrl="/api/integrations/woocommerce/sync" disconnectUrl="/api/integrations/woocommerce/disconnect"
          modalFields={[
            { key: 'storeUrl',       label: 'Mağaza URL',      placeholder: 'https://magazaniz.com' },
            { key: 'consumerKey',    label: 'Consumer Key',    placeholder: 'ck_...', secret: true },
            { key: 'consumerSecret', label: 'Consumer Secret', placeholder: 'cs_...', secret: true },
          ]}
        />

        <IntegrationCard icon={ShoppingBag} name="Trendyol" desc="Trendyol pazar yeri siparişleri" iconBg="bg-orange-900" iconColor="#fb923c"
          integration={undefined} onConnected={() => {}} connectUrl="" disconnectUrl="" modalFields={[]} comingSoon />
      </div>

      {/* İletişim & E-posta */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--text-3)' }}>İletişim & E-posta</p>

        <IntegrationCard
          icon={Bot} name="Meta WhatsApp API" desc="Müşteri iletişimi için WhatsApp Business API" iconBg="bg-green-900" iconColor="#22c97a"
          badge="Premium" integration={whatsapp} onConnected={onRefresh}
          connectUrl="/api/integrations/whatsapp/connect" disconnectUrl="/api/integrations/whatsapp/disconnect"
          modalFields={[
            { key: 'phoneNumberId', label: 'Phone Number ID',        placeholder: '1234567890123456', hint: 'Meta Developers → WhatsApp → API Setup' },
            { key: 'accessToken',   label: 'Permanent Access Token', placeholder: 'EAAxxxxxx...', secret: true, hint: 'Meta Business Manager → System User Token' },
          ]}
        />

        <IntegrationCard
          icon={Mail} name="Resend" desc="Kustom e-posta gönderimi için Resend API anahtarı" iconBg="bg-zinc-800" iconColor="#eeeef4"
          integration={resend} onConnected={onRefresh}
          connectUrl="/api/integrations/resend/connect" disconnectUrl="/api/integrations/resend/disconnect"
          modalFields={[
            { key: 'apiKey', label: 'API Anahtarı', placeholder: 're_...', secret: true, hint: 'resend.com → API Keys → Create API Key' },
          ]}
        />
      </div>

      {/* Webhooks */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: 'var(--text-3)' }}>Webhook Yönetimi</p>
        <div className="bento-card p-5 space-y-3">
          {[
            { label: 'Shopify Webhook', path: '/api/webhooks/shopify' },
            { label: 'WhatsApp Webhook', path: '/api/whatsapp/webhook' },
          ].map(w => (
            <div key={w.label}>
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>{w.label}</p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <Webhook className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-3)' }} />
                <code className="text-[11px] font-mono flex-1 truncate" style={{ color: 'var(--text-3)' }}>
                  {typeof window !== 'undefined' ? window.location.origin : 'https://...'}{w.path}
                </code>
                <CopyButton value={typeof window !== 'undefined' ? `${window.location.origin}${w.path}` : ''} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── E-posta Gönderimi ────────────────────────────────────────────────────────

interface DomainRow {
  id: string; domain: string; status: string; fromPrefix: string | null
  senderName: string | null; fromEmail: string | null; dnsRecords: string; createdAt: string
}

function EmailSection() {
  const [domains,    setDomains]    = useState<DomainRow[]>([])
  const [testEmail,  setTestEmail]  = useState('')
  const [testing,    setTesting]    = useState(false)
  const [testResult, setTestResult] = useState<{ ok?: boolean; error?: string } | null>(null)

  // Per-domain edit state
  const [editing, setEditing] = useState<string | null>(null)
  const [editPrefix, setEditPrefix] = useState('')
  const [editSender, setEditSender] = useState('')
  const [savingDomain, setSavingDomain] = useState(false)
  const [savedDomain,  setSavedDomain]  = useState(false)

  const loadDomains = useCallback(async () => {
    const res = await fetch('/api/email/domain')
    const d   = await res.json() as { domains?: DomainRow[] }
    setDomains(d.domains ?? [])
  }, [])

  useEffect(() => { loadDomains() }, [loadDomains])

  function startEdit(d: DomainRow) {
    setEditing(d.id)
    setEditPrefix(d.fromPrefix ?? 'kampanya')
    setEditSender(d.senderName ?? '')
    setSavedDomain(false)
  }

  async function saveDomain(domainId: string) {
    setSavingDomain(true)
    await fetch('/api/email/domain', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ domainId, fromPrefix: editPrefix, senderName: editSender }),
    })
    await loadDomains()
    setSavingDomain(false); setSavedDomain(true)
    setTimeout(() => { setSavedDomain(false); setEditing(null) }, 1500)
  }

  async function handleTest() {
    if (!testEmail) return
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch('/api/email/test', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ to: testEmail }),
      })
      const d = await res.json() as { error?: string }
      setTestResult(res.ok ? { ok: true } : { error: d.error ?? 'Test maili gönderilemedi' })
    } catch { setTestResult({ error: 'Bağlantı hatası' }) }
    finally { setTesting(false) }
  }

  const verifiedDomains = domains.filter(d => d.status === 'verified')

  return (
    <div className="space-y-4">
      <SectionHeader title="E-posta Gönderimi" desc="Mail domaininizi bağlayın ve gönderen kimliğini yapılandırın" />

      {/* Domain verification status banner */}
      {verifiedDomains.length === 0 && domains.length > 0 && (
        <div className="ds-alert ds-alert-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--red)' }}>Doğrulanmış domain yok</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Domain doğrulanmadan ücretli planlarda toplu mail gönderilemez.</p>
          </div>
        </div>
      )}
      {verifiedDomains.length === 0 && domains.length === 0 && (
        <div className="ds-alert" style={{ background: 'rgba(68,112,255,0.06)', border: '1px solid rgba(68,112,255,0.15)' }}>
          <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--blue)' }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: 'var(--blue)' }}>Sistem Gönderim Adresi Aktif</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>
              Tüm kampanya mailleri <code className="font-mono" style={{ color: 'var(--text-2)' }}>noreply@mg.marksio.com</code> adresinden gönderilmektedir.
              Özel domain için destek ekibiyle iletişime geçin.
            </p>
          </div>
        </div>
      )}

      {/* Domain management */}
      <div className="bento-card p-6">
        <MailDomainSection />
      </div>

      {/* Sender config for verified domains */}
      {verifiedDomains.map(d => (
        <div key={d.id} className="bento-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Gönderen Kimliği</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                Kampanyalar <span className="font-mono" style={{ color: 'var(--text-2)' }}>{d.fromEmail ?? `kampanya@${d.domain}`}</span> adresinden gönderilir
              </p>
            </div>
            <span className="chip chip-green inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {d.domain}</span>
          </div>

          {editing === d.id ? (
            <div className="space-y-3 pt-1">
              <div>
                <label className="label mb-1.5 block">Gönderen Adı</label>
                <input value={editSender} onChange={e => setEditSender(e.target.value)}
                  className="input w-full" placeholder="Marka Adınız (boş bırakılırsa mağaza adı kullanılır)" />
              </div>
              <div>
                <label className="label mb-1.5 block">E-posta Prefix</label>
                <div className="flex items-center gap-0">
                  <input value={editPrefix} onChange={e => setEditPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                    className="input rounded-r-none flex-1" placeholder="kampanya" />
                  <span className="px-3 h-9 flex items-center rounded-r-xl text-sm font-mono"
                    style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderLeft: 0, color: 'var(--text-2)' }}>
                    @{d.domain}
                  </span>
                </div>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>
                  Önizleme: <span className="font-mono">{editSender || 'Marka Adı'} &lt;{editPrefix || 'kampanya'}@{d.domain}&gt;</span>
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => saveDomain(d.id)} disabled={savingDomain} className="btn-primary gap-2">
                  {savingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : savedDomain ? <Check className="w-4 h-4" /> : null}
                  {savingDomain ? 'Kaydediliyor...' : savedDomain ? 'Kaydedildi' : 'Kaydet'}
                </button>
                <button onClick={() => setEditing(null)} className="btn-secondary">İptal</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between py-2 px-3 rounded-xl"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div>
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                  <span className="font-semibold">{d.senderName || '(mağaza adı)'}</span>
                  {' '}<span style={{ color: 'var(--text-3)' }}>&lt;{d.fromEmail ?? `kampanya@${d.domain}`}&gt;</span>
                </p>
              </div>
              <button onClick={() => startEdit(d)} className="btn-ghost text-xs gap-1.5 px-2 py-1 rounded">
                <Settings className="w-3.5 h-3.5" /> Düzenle
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Test mail */}
      <div className="bento-card p-5">
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Test Mail Gönder</p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>Gönderici ayarlarınızın doğru çalıştığını test edin</p>
        <div className="flex gap-2">
          <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" className="input flex-1" />
          <button onClick={handleTest} disabled={testing || !testEmail} className="btn-primary gap-2 disabled:opacity-40 whitespace-nowrap">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {testing ? 'Gönderiliyor...' : 'Test Gönder'}
          </button>
        </div>
        {testResult?.ok && (
          <div className="ds-alert ds-alert-success mt-3 text-xs"><Check className="w-3.5 h-3.5 shrink-0" /> Test maili başarıyla gönderildi.</div>
        )}
        {testResult?.error && (
          <div className="ds-alert ds-alert-error mt-3 text-xs"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {testResult.error}</div>
        )}
      </div>

      {/* Info: how From header is built */}
      <div className="bento-card p-5">
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-1)' }}>Gönderim Kuralları</p>
        <div className="space-y-2">
          {[
            { icon: CheckCircle2, color: 'var(--green)', text: 'Unsubscribe linki her mailde otomatik eklenir (RFC 2369 uyumlu)' },
            { icon: CheckCircle2, color: 'var(--green)', text: 'Bounce olan adresler otomatik engellenir, bir daha gönderim yapılmaz' },
            { icon: CheckCircle2, color: 'var(--green)', text: 'Spam şikayeti yapan müşteriler anında listeden çıkarılır' },
            { icon: AlertCircle,  color: 'var(--amber)', text: 'Yeni domainlerde ilk 30 gün günlük limit: 500 mail/gün' },
          ].map((row, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <row.icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: row.color }} />
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{row.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── WhatsApp AI ──────────────────────────────────────────────────────────────

interface WASettings {
  botName: string; welcomeMessage: string; fallbackMessage: string
  tone: string; responseLength: string; emojiUsage: string
  humanHandoffMessage: string; connectionStatus: string
  phoneNumberId: string; hasMetaToken: boolean
}

function WhatsAppAISection() {
  const [s, setS]           = useState<WASettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [testMsg, setTestMsg] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch('/api/whatsapp/settings').then(r => r.json()).then((d: { settings?: WASettings }) => { if (d.settings) setS(d.settings) })
  }, [])

  function update(key: keyof WASettings, value: string) { setS(prev => prev ? { ...prev, [key]: value } : prev) }

  async function handleSave() {
    if (!s) return
    setSaving(true)
    await fetch('/api/whatsapp/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) })
    setSaved(true); setTimeout(() => setSaved(false), 2500); setSaving(false)
  }

  if (!s) return <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-3)' }} /></div>

  const isConnected = s.connectionStatus === 'connected' || s.hasMetaToken

  return (
    <div className="space-y-4">
      <SectionHeader title="WhatsApp AI" desc="Yapay zeka botunuzun davranışını ve mesajlarını yapılandırın" />

      {/* Connection status */}
      <div className="bento-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,201,122,0.1)', border: '1px solid rgba(34,201,122,0.2)' }}>
              <MessageCircle className={cn('w-5 h-5', isConnected ? 'text-emerald-400' : '')} style={!isConnected ? { color: 'var(--text-3)' } : {}} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>WhatsApp Bağlantısı</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                {isConnected ? `Phone Number ID: ${s.phoneNumberId || '—'}` : 'Meta API kimlik bilgileri gerekli'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected
              ? <span className="chip chip-green inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Bağlı</span>
              : <span className="chip chip-muted">Bağlı Değil</span>}
          </div>
        </div>
        {!isConnected && (
          <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: 'var(--blue-soft)', border: '1px solid rgba(68,112,255,0.15)' }}>
            <p style={{ color: 'var(--blue)' }}>Meta WhatsApp API kimlik bilgilerini <strong>Entegrasyonlar</strong> sekmesinden bağlayın.</p>
          </div>
        )}
      </div>

      {/* Bot config */}
      <div className="bento-card p-6">
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Bot Yapılandırması</p>
        <SettingRow label="Bot Adı" desc="Müşterilere gösterilecek asistan adı">
          <input value={s.botName} onChange={e => update('botName', e.target.value)} className="input w-52" />
        </SettingRow>
        <SettingRow label="Ton" desc="Botun iletişim tarzı">
          <select value={s.tone} onChange={e => update('tone', e.target.value)} className="input w-40">
            <option value="friendly">Samimi</option>
            <option value="professional">Profesyonel</option>
            <option value="formal">Resmi</option>
          </select>
        </SettingRow>
        <SettingRow label="Yanıt Uzunluğu">
          <select value={s.responseLength} onChange={e => update('responseLength', e.target.value)} className="input w-40">
            <option value="short">Kısa</option>
            <option value="medium">Orta</option>
            <option value="long">Uzun</option>
          </select>
        </SettingRow>
        <SettingRow label="Emoji Kullanımı">
          <select value={s.emojiUsage} onChange={e => update('emojiUsage', e.target.value)} className="input w-40">
            <option value="none">Yok</option>
            <option value="low">Az</option>
            <option value="medium">Orta</option>
            <option value="high">Çok</option>
          </select>
        </SettingRow>
      </div>

      {/* Messages */}
      <div className="bento-card p-6 space-y-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Mesaj Şablonları</p>
        <div>
          <label className="label mb-1.5 block">Karşılama Mesajı</label>
          <textarea value={s.welcomeMessage} onChange={e => update('welcomeMessage', e.target.value)}
            rows={2} className="input w-full resize-none" />
        </div>
        <div>
          <label className="label mb-1.5 block">Geri Dönüş Mesajı</label>
          <textarea value={s.fallbackMessage} onChange={e => update('fallbackMessage', e.target.value)}
            rows={2} className="input w-full resize-none" />
        </div>
        <div>
          <label className="label mb-1.5 block">İnsan Temsilciye Aktarım Mesajı</label>
          <textarea value={s.humanHandoffMessage} onChange={e => update('humanHandoffMessage', e.target.value)}
            rows={2} className="input w-full resize-none" />
        </div>
      </div>

      {/* Test */}
      <div className="bento-card p-5">
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Test Mesajı Gönder</p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>Bağlı WhatsApp hattınızdan test mesajı gönderin</p>
        <div className="flex gap-2">
          <input value={testMsg} onChange={e => setTestMsg(e.target.value)} placeholder="+90 555 000 0000" className="input flex-1" />
          <button disabled={!isConnected || !testMsg || sending} onClick={() => { setSending(true); setTimeout(() => setSending(false), 1500) }}
            className="btn-primary gap-2 whitespace-nowrap disabled:opacity-40">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Gönder
          </button>
        </div>
      </div>

      <SaveButton saving={saving} saved={saved} onClick={handleSave} />
    </div>
  )
}

// ─── AI Studio ────────────────────────────────────────────────────────────────

function AIStudioSection() {
  const [primary,    setPrimary]    = useState('#4470ff')
  const [secondary,  setSecondary]  = useState('#9f7afa')
  const [font,       setFont]       = useState('inter')
  const [style,      setStyle]      = useState('minimal')
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [saveError,  setSaveError]  = useState('')

  async function handleSave() {
    setSaving(true); setSaveError('')
    try {
      const res = await fetch('/api/settings/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSettings: { primary, secondary, font, style } }),
      })
      if (!res.ok) throw new Error('Kaydedilemedi')
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (e) { setSaveError(e instanceof Error ? e.message : 'Hata oluştu') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="AI Studio Ayarları" desc="AI üretimlerinde kullanılacak marka kimliğinizi tanımlayın" />

      <div className="bento-card p-6 space-y-5">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Marka Renkleri</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Birincil Renk',  value: primary,   onChange: setPrimary   },
            { label: 'İkincil Renk',   value: secondary, onChange: setSecondary },
          ].map(c => (
            <div key={c.label}>
              <label className="label mb-2 block">{c.label}</label>
              <div className="flex items-center gap-3">
                <input type="color" value={c.value} onChange={e => c.onChange(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
                <input value={c.value} onChange={e => c.onChange(e.target.value)} className="input flex-1 font-mono text-sm" placeholder="#000000" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bento-card p-6">
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Logo</p>
        <div className="flex items-center gap-4 p-4 rounded-xl border-dashed" style={{ border: '1.5px dashed var(--border-2)' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
            <Upload className="w-5 h-5" style={{ color: 'var(--text-3)' }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>Logo Yükle</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>PNG veya SVG — maks 1MB</p>
          </div>
          <button className="btn-secondary ml-auto opacity-50 cursor-not-allowed">
            Yükle <span className="chip chip-muted ml-1">Yakında</span>
          </button>
        </div>
      </div>

      <div className="bento-card p-6">
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-1)' }}>Görsel Stili</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'minimal',    label: 'Minimal',    desc: 'Sade ve temiz' },
            { key: 'bold',       label: 'Bold',       desc: 'Güçlü ve dikkat çekici' },
            { key: 'elegant',    label: 'Elegant',    desc: 'Şık ve premium' },
          ].map(opt => (
            <button key={opt.key} onClick={() => setStyle(opt.key)}
              className="p-3 rounded-xl text-left transition-all"
              style={{
                background: style === opt.key ? 'var(--blue-soft)' : 'var(--surface-2)',
                border: style === opt.key ? '1px solid rgba(68,112,255,0.3)' : '1px solid var(--border)',
              }}>
              <p className="text-xs font-semibold" style={{ color: style === opt.key ? 'var(--blue)' : 'var(--text-1)' }}>{opt.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-3)' }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bento-card p-5">
        <SettingRow label="Varsayılan Font">
          <select value={font} onChange={e => setFont(e.target.value)} className="input w-40">
            <option value="inter">Inter</option>
            <option value="geist">Geist</option>
            <option value="poppins">Poppins</option>
            <option value="montserrat">Montserrat</option>
          </select>
        </SettingRow>
      </div>

      {saveError && <p className="text-xs" style={{ color: 'var(--red)' }}>{saveError}</p>}
      <SaveButton saving={saving} saved={saved} onClick={handleSave} />
    </div>
  )
}

// ─── Bildirimler ──────────────────────────────────────────────────────────────

function BildirimlerSection() {
  const [prefs, setPrefs] = useState({
    campaignDone:     true,
    automationError:  true,
    weeklyReport:     true,
    newOrder:         false,
    emailNotifications: true,
    cartAbandoned:    false,
    newCustomer:      false,
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  function toggle(key: keyof typeof prefs) { setPrefs(p => ({ ...p, [key]: !p[key] })) }

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/settings/store', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationPrefs: prefs }) })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Bildirimler" desc="Hangi olaylarda bildirim almak istediğinizi seçin" />

      <div className="bento-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-3)' }}>Kampanya & Otomasyon</p>
        <SettingRow label="Kampanya Tamamlandı" desc="Kampanya gönderimi bitince bildir">
          <Toggle checked={prefs.campaignDone} onChange={() => toggle('campaignDone')} />
        </SettingRow>
        <SettingRow label="Otomasyon Hatası" desc="Bir otomasyon akışında hata oluşunca bildir">
          <Toggle checked={prefs.automationError} onChange={() => toggle('automationError')} />
        </SettingRow>
        <SettingRow label="Sepet Terk Tespit" desc="Gerçek zamanlı sepet terk bildirimleri">
          <Toggle checked={prefs.cartAbandoned} onChange={() => toggle('cartAbandoned')} />
        </SettingRow>

        <p className="text-xs font-semibold uppercase tracking-wider mt-5 mb-3" style={{ color: 'var(--text-3)' }}>Mağaza & Müşteri</p>
        <SettingRow label="Yeni Sipariş" desc="Her yeni sipariş oluştuğunda bildir">
          <Toggle checked={prefs.newOrder} onChange={() => toggle('newOrder')} />
        </SettingRow>
        <SettingRow label="Yeni Müşteri Kaydı" desc="Yeni müşteri oluşturulunca bildir">
          <Toggle checked={prefs.newCustomer} onChange={() => toggle('newCustomer')} />
        </SettingRow>

        <p className="text-xs font-semibold uppercase tracking-wider mt-5 mb-3" style={{ color: 'var(--text-3)' }}>Raporlar</p>
        <SettingRow label="Haftalık Performans Raporu" desc="Her Pazartesi e-posta ile özet gönder">
          <Toggle checked={prefs.weeklyReport} onChange={() => toggle('weeklyReport')} />
        </SettingRow>
        <SettingRow label="E-posta Bildirimleri" desc="Tüm bildirimleri e-posta ile al">
          <Toggle checked={prefs.emailNotifications} onChange={() => toggle('emailNotifications')} />
        </SettingRow>

        <div className="pt-5">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} />
        </div>
      </div>
    </div>
  )
}

// ─── Takım ────────────────────────────────────────────────────────────────────

function TakimSection() {
  const [inviteEmail, setInviteEmail] = useState('')

  const mockMembers = [
    { name: 'Yunus Emre', email: 'yunus@marksio.com', role: 'Sahip',    avatar: 'YE' },
    { name: 'Ayşe Kaya',  email: 'ayse@marksio.com',  role: 'Yönetici', avatar: 'AK' },
  ]

  return (
    <div className="space-y-4">
      <SectionHeader title="Takım Yönetimi" desc="Üyeleri davet edin ve yetkilerini yönetin" />

      {/* Invite */}
      <div className="bento-card p-5">
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-1)' }}>Üye Davet Et</p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-3)' }}>E-posta adresiyle takımınıza yeni üye ekleyin</p>
        <div className="flex gap-2">
          <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" className="input flex-1" />
          <select className="input w-36">
            <option>Üye</option>
            <option>Yönetici</option>
            <option>Görüntüleyici</option>
          </select>
          <button disabled={!inviteEmail} className="btn-primary gap-2 disabled:opacity-40 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Davet Gönder
          </button>
        </div>
        <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: 'var(--blue-soft)', border: '1px solid rgba(68,112,255,0.15)' }}>
          <p style={{ color: 'var(--blue)' }}>Bu özellik yakında aktif olacak. Çoklu kullanıcı desteği Pro plana dahildir.</p>
        </div>
      </div>

      {/* Members */}
      <div className="bento-card overflow-hidden">
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Mevcut Üyeler</p>
        </div>
        {mockMembers.map((m, i) => (
          <div key={m.email} className="flex items-center gap-4 px-5 py-4"
            style={i < mockMembers.length - 1 ? { borderBottom: '1px solid var(--border)' } : {}}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}>{m.avatar}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{m.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>{m.email}</p>
            </div>
            <span className={cn('chip', m.role === 'Sahip' ? 'chip-blue' : 'chip-muted')}>{m.role}</span>
          </div>
        ))}
      </div>

      {/* Roles info */}
      <div className="bento-card p-5">
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-1)' }}>Roller ve Yetkiler</p>
        {[
          { role: 'Sahip',        desc: 'Tüm ayarlar, fatura, üye yönetimi' },
          { role: 'Yönetici',     desc: 'Kampanya, otomasyon, müşteri yönetimi' },
          { role: 'Üye',          desc: 'Kampanya oluşturma ve görüntüleme' },
          { role: 'Görüntüleyici', desc: 'Sadece okuma yetkisi' },
        ].map(r => (
          <div key={r.role} className="flex items-center justify-between py-2.5 last:border-0" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>{r.role}</p>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Güvenlik ─────────────────────────────────────────────────────────────────

function GuvenlikSection() {
  const [current,  setCurrent]  = useState('')
  const [newPass,  setNewPass]  = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [result,   setResult]   = useState<{ ok?: boolean; error?: string } | null>(null)

  const [apiKeyCopied, setApiKeyCopied] = useState(false)
  const mockApiKey = 'mks_live_7f3k9x2p1q8r4t6y0n5w'

  async function handleChangePass() {
    if (newPass !== confirm) { setResult({ error: 'Şifreler eşleşmiyor' }); return }
    setSaving(true); setResult(null)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
      })
      const d = await res.json() as { error?: string }
      if (!res.ok) throw new Error(d.error)
      setResult({ ok: true }); setCurrent(''); setNewPass(''); setConfirm('')
    } catch (e) { setResult({ error: e instanceof Error ? e.message : 'Hata oluştu' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Güvenlik" desc="Şifrenizi değiştirin ve oturum güvenliğinizi yönetin" />

      {/* Change password */}
      <div className="bento-card p-6 space-y-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Şifre Değiştir</p>
        {[
          { label: 'Mevcut Şifre',   value: current,  set: setCurrent  },
          { label: 'Yeni Şifre',     value: newPass,  set: setNewPass  },
          { label: 'Yeni Şifre (Tekrar)', value: confirm, set: setConfirm },
        ].map(f => (
          <div key={f.label}>
            <label className="label mb-1.5 block">{f.label}</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={f.value} onChange={e => f.set(e.target.value)}
                className="input w-full pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 btn-ghost p-0.5 rounded">
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
        {result?.ok    && <div className="ds-alert ds-alert-success text-xs"><Check className="w-3.5 h-3.5 shrink-0" /> Şifreniz başarıyla güncellendi.</div>}
        {result?.error && <div className="ds-alert ds-alert-error text-xs"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {result.error}</div>}
        <button onClick={handleChangePass} disabled={saving || !current || !newPass || !confirm} className="btn-primary gap-2 disabled:opacity-40">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          {saving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
        </button>
      </div>

      {/* 2FA */}
      <div className="bento-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>İki Faktörlü Doğrulama (2FA)</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Hesabınızı ekstra güvenlik katmanıyla koruyun</p>
          </div>
          <button className="btn-secondary opacity-50 cursor-not-allowed gap-1.5">
            Etkinleştir <span className="chip chip-muted">Yakında</span>
          </button>
        </div>
      </div>

      {/* Active sessions */}
      <div className="bento-card p-5">
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-1)' }}>Aktif Oturumlar</p>
        <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--green-soft)' }}>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>Chrome / Windows — İstanbul</p>
            <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>Şu an aktif · Bu cihaz</p>
          </div>
          <span className="chip chip-green">Aktif</span>
        </div>
      </div>

      {/* API Keys */}
      <div className="bento-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>API Anahtarları</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Marksio API&apos;sine programatik erişim için</p>
          </div>
          <button className="btn-secondary text-xs gap-1.5 px-3 py-2">
            <Key className="w-3.5 h-3.5" /> Yeni Anahtar
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <Key className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-3)' }} />
          <code className="text-xs font-mono flex-1" style={{ color: 'var(--text-2)' }}>{mockApiKey}</code>
          <button onClick={() => { navigator.clipboard.writeText(mockApiKey); setApiKeyCopied(true); setTimeout(() => setApiKeyCopied(false), 1500) }}
            className="shrink-0 p-1.5 rounded-lg btn-ghost">
            {apiKeyCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tehlikeli Bölge ──────────────────────────────────────────────────────────

function TehlikeliBolgeSection() {
  const [deleteConfirm, setDeleteConfirm]   = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  return (
    <div className="space-y-4">
      <SectionHeader title="Tehlikeli Bölge" desc="Bu işlemler geri alınamaz. Dikkatli olun." />

      {/* Export */}
      <div className="bento-card p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Verileri Dışa Aktar</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Tüm müşteri, kampanya ve analitik verilerinizi CSV olarak indirin</p>
        </div>
        <button className="btn-secondary gap-2">
          <Download className="w-4 h-4" /> Dışa Aktar
        </button>
      </div>

      {/* Freeze */}
      <div className="rounded-xl p-5 flex items-center justify-between"
        style={{ background: 'var(--surface)', border: '1px solid rgba(240,160,32,0.2)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--amber)' }}>Hesabı Dondur</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Verileriniz korunur, tüm kampanyalar ve otomasyonlar duraklatılır</p>
        </div>
        <button className="text-sm px-4 py-2 rounded-xl transition-colors"
          style={{ background: 'rgba(240,160,32,0.1)', color: 'var(--amber)', border: '1px solid rgba(240,160,32,0.2)' }}>
          Dondur
        </button>
      </div>

      {/* Delete */}
      <div className="rounded-xl p-5 flex items-center justify-between"
        style={{ background: 'var(--surface)', border: '1px solid rgba(232,69,69,0.2)' }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--red)' }}>Hesabı Sil</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Tüm verileriniz kalıcı olarak silinir, bu işlem geri alınamaz</p>
        </div>
        <button onClick={() => setShowDeleteModal(true)} className="btn-danger gap-2">
          <AlertTriangle className="w-4 h-4" /> Hesabı Sil
        </button>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid rgba(232,69,69,0.3)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--red-soft)' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--red)' }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>Hesabı Sil</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>Bu işlem geri alınamaz</p>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              Tüm kampanya, müşteri, segment ve otomasyon verileriniz kalıcı olarak silinecek. Devam etmek için <strong style={{ color: 'var(--text-1)' }}>sil</strong> yazın:
            </p>
            <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="sil" className="input w-full" />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }} className="btn-secondary flex-1 justify-center">İptal</button>
              <button disabled={deleteConfirm !== 'sil'} className="btn-danger flex-1 justify-center disabled:opacity-40">Kalıcı Olarak Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//   MAIN PAGE
// ═══════════════════════════════════════════════════════════════

const TAB_META: Record<Tab, { label: string; desc: string; icon: React.ElementType; danger?: boolean }> = {
  hesap:         { label: 'Hesap',             desc: 'Profil ve mağaza bilgileri',   icon: User           },
  billing:       { label: 'Plan & Faturalama', desc: 'Abonelik ve ödeme yönetimi',   icon: CreditCard     },
  integrations:  { label: 'Entegrasyonlar',    desc: 'Platform ve servis bağlantıları', icon: Link2       },
  email:         { label: 'E-posta Gönderimi', desc: 'Domain ve gönderim ayarları',  icon: Mail           },
  whatsapp:      { label: 'WhatsApp AI',       desc: 'Bot yapılandırması',            icon: MessageCircle  },
  'ai-studio':   { label: 'AI Studio',         desc: 'Marka kimliği ve görsel stili', icon: Sparkles      },
  notifications: { label: 'Bildirimler',       desc: 'Bildirim tercihleriniz',        icon: Bell           },
  team:          { label: 'Takım',             desc: 'Üyeler ve yetkilendirme',       icon: Users          },
  security:      { label: 'Güvenlik',          desc: 'Şifre ve erişim kontrolü',      icon: Shield         },
  danger:        { label: 'Tehlikeli Bölge',   desc: 'Hesap silme ve dondurma',       icon: AlertTriangle, danger: true },
}

function SettingsPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const tabParam     = searchParams.get('tab') as Tab | null
  const activeTab: Tab = (tabParam && tabs.some(t => t.key === tabParam)) ? tabParam : 'hesap'

  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [oauthSuccess, setOauthSuccess] = useState(false)
  const { open: openDrawer } = useSettingsDrawer()

  const loadIntegrations = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations')
      const d   = await res.json() as { integrations?: Integration[] }
      setIntegrations(d.integrations ?? [])
    } catch {}
  }, [])

  // Load integrations once on mount; handle Shopify OAuth callback
  useEffect(() => {
    loadIntegrations()
    if (searchParams.get('connected') === 'shopify') {
      setOauthSuccess(true)
      router.replace('/settings?tab=integrations')
      setTimeout(() => setOauthSuccess(false), 5000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadIntegrations])

  // Open the drawer when there is no tab in the URL
  useEffect(() => {
    if (!tabParam) openDrawer()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam])

  const meta = TAB_META[activeTab]
  const Icon = meta.icon

  return (
    <AppShell>
      {/* ── Sticky top bar ── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between h-[52px] px-5 lg:px-6 shrink-0"
        style={{
          background: 'rgba(8,8,15,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Left: back breadcrumb */}
        <button
          onClick={openDrawer}
          className="flex items-center gap-1.5 text-[13px] transition-colors group"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Tüm Ayarlar</span>
        </button>

        {/* Center: current section */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-[7px] flex items-center justify-center shrink-0"
            style={{
              background: meta.danger ? 'var(--red-soft)' : 'var(--blue-soft)',
              border: `1px solid ${meta.danger ? 'rgba(232,69,69,0.2)' : 'rgba(68,112,255,0.2)'}`,
            }}
          >
            <Icon className="w-3 h-3" style={{ color: meta.danger ? 'var(--red)' : 'var(--blue)' }} />
          </div>
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>{meta.label}</span>
        </div>

        {/* Right: section switcher pill */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" style={{ maxWidth: 320 }}>
          {tabs.slice(0, 5).map(t => (
            <button
              key={t.key}
              onClick={() => router.replace(`/settings?tab=${t.key}`)}
              className="shrink-0 px-2.5 py-1 rounded-lg text-[11.5px] font-medium transition-all"
              style={
                activeTab === t.key
                  ? { background: t.danger ? 'var(--red-soft)' : 'var(--blue-soft)', color: t.danger ? 'var(--red)' : 'var(--blue)' }
                  : { color: 'var(--text-3)' }
              }
              onMouseEnter={e => { if (activeTab !== t.key) e.currentTarget.style.color = 'var(--text-2)' }}
              onMouseLeave={e => { if (activeTab !== t.key) e.currentTarget.style.color = 'var(--text-3)' }}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={openDrawer}
            className="shrink-0 px-2.5 py-1 rounded-lg text-[11.5px] font-medium transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            Tümü →
          </button>
        </div>
      </div>

      {/* ── Page content ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Section hero header */}
        <div className="px-5 lg:px-8 pt-8 pb-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: meta.danger ? 'var(--red-soft)' : 'var(--blue-soft)',
                  border: `1px solid ${meta.danger ? 'rgba(232,69,69,0.2)' : 'rgba(68,112,255,0.2)'}`,
                }}
              >
                <Icon className="w-4.5 h-4.5" style={{ color: meta.danger ? 'var(--red)' : 'var(--blue)' }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-1)', letterSpacing: '-0.025em' }}>
                  {meta.label}
                </h1>
                <p className="text-[12.5px]" style={{ color: 'var(--text-3)' }}>{meta.desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section content */}
        <div className="px-5 lg:px-8 pb-16">
          <div className="max-w-2xl mx-auto">
            {activeTab === 'hesap'         && <HesapSection />}
            {activeTab === 'billing'       && <BillingSection />}
            {activeTab === 'integrations'  && <EntegrasyonlarSection integrations={integrations} onRefresh={loadIntegrations} oauthSuccess={oauthSuccess} />}
            {activeTab === 'email'         && <EmailSection />}
            {activeTab === 'whatsapp'      && <WhatsAppAISection />}
            {activeTab === 'ai-studio'     && <AIStudioSection />}
            {activeTab === 'notifications' && <BildirimlerSection />}
            {activeTab === 'team'          && <TakimSection />}
            {activeTab === 'security'      && <GuvenlikSection />}
            {activeTab === 'danger'        && <TehlikeliBolgeSection />}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsPageInner />
    </Suspense>
  )
}
