'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Key, Store, Bell, Shield, Check, Eye, EyeOff, Copy,
  Mail, MessageSquare, Link2, Link2Off,
  RefreshCw, Loader2, AlertCircle, ShoppingBag, Globe,
  ChevronRight, Package, X, Settings, Trash2, Globe2,
  CheckCircle2, Clock, AlertTriangle, Plus, Users, ShoppingCart,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'

type Tab = 'integrations' | 'maildomain' | 'store' | 'api' | 'notifications' | 'billing'

const tabs: Array<{ key: Tab; label: string; icon: React.ElementType }> = [
  { key: 'integrations', label: 'Entegrasyonlar', icon: Link2 },
  { key: 'maildomain',   label: 'Mail Domain',    icon: Mail  },
  { key: 'store',        label: 'Mağaza',          icon: Store },
  { key: 'api',          label: 'API Anahtarları', icon: Key   },
  { key: 'notifications',label: 'Bildirimler',     icon: Bell  },
  { key: 'billing',      label: 'Plan & Ödeme',    icon: Shield},
]

interface SyncStats {
  customers: number; orders: number; products: number; abandonedCarts: number
  completedAt: string; durationMs: number
}

interface IntegrationMeta {
  shopName?: string
  webhooksRegistered?: boolean
  syncInProgress?: boolean
  lastSync?: SyncStats
}

interface Integration {
  id: string; platform: string; shopDomain?: string; status: string; lastSyncAt?: string
  meta?: string
}

function parseMeta(raw?: string): IntegrationMeta {
  try { return raw ? JSON.parse(raw) as IntegrationMeta : {} } catch { return {} }
}

interface EmailDomain {
  id: string; domain: string; status: string; dnsRecords: string; fromEmail?: string; createdAt: string
}

interface DnsRecord {
  type: string; name: string; value: string; status?: string; priority?: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'verified') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Doğrulandı
    </span>
  )
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
      <AlertCircle className="w-3 h-3" /> Hata
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" /> Bekliyor
    </span>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="shrink-0 p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] transition-all text-gray-500 hover:text-gray-300">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-[#1e1e1e] last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-300">{label}</p>
        {desc && <p className="text-xs text-gray-600 mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex rounded-full transition-colors', checked ? 'bg-blue-600' : 'bg-[#2a2a2a]')}
      style={{ height: '22px', width: '40px' }}
    >
      <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0')} />
    </button>
  )
}

// ─── Integration Modal ────────────────────────────────────────────────────────

interface ModalField { key: string; label: string; placeholder: string; secret?: boolean; hint?: string }

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
  const [show, setShow] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [syncResult, setSyncResult] = useState('')

  async function handleConnect() {
    setLoading(true); setError('')
    try {
      const res = await fetch(connectUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSuccess(); onClose()
    } catch (e) { setError(e instanceof Error ? e.message : 'Bağlantı hatası') }
    finally { setLoading(false) }
  }

  async function handleSync() {
    if (!syncUrl) return
    setSyncing(true)
    try {
      const res = await fetch(syncUrl, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSyncResult(data.message); onSuccess()
    } catch (e) { setError(e instanceof Error ? e.message : 'Sync hatası') }
    finally { setSyncing(false) }
  }

  async function handleDisconnect() {
    await fetch(disconnectUrl, { method: 'POST' }); onSuccess(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e]">
          <h3 className="font-semibold text-white">{name} Ayarları</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {isConnected && (
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-xs text-emerald-400">
                <p className="font-semibold">{name} Bağlı</p>
                {integration?.lastSyncAt && <p className="text-emerald-500/70">Son sync: {new Date(integration.lastSyncAt).toLocaleString('tr-TR')}</p>}
              </div>
            </div>
          )}

          {fields.map(f => (
            <div key={f.key}>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase tracking-wider">{f.label}</label>
              <div className="relative">
                <input
                  type={f.secret && !show[f.key] ? 'password' : 'text'}
                  value={values[f.key] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 text-sm border border-[#2a2a2a] bg-[#0d0d0d] text-gray-300 placeholder:text-gray-700 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 pr-9"
                />
                {f.secret && (
                  <button type="button" onClick={() => setShow(s => ({ ...s, [f.key]: !s[f.key] }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                    {show[f.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
              {f.hint && <p className="text-[11px] text-gray-700 mt-1">{f.hint}</p>}
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}
          {syncResult && (
            <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">✓ {syncResult}</div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleConnect} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
              {isConnected ? 'Güncelle' : 'Bağla'}
            </button>
            {isConnected && syncUrl && (
              <button onClick={handleSync} disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-gray-400 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] rounded-xl transition-all">
                {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Sync
              </button>
            )}
            {isConnected && (
              <button onClick={handleDisconnect} className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded-xl transition-all">
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
  icon: Icon, name, desc, iconBg, badge, integration,
  modalFields, connectUrl, syncUrl, disconnectUrl, onConnected, comingSoon,
}: {
  icon: React.ElementType; name: string; desc: string; iconBg: string; badge?: string
  integration?: Integration; modalFields: ModalField[]
  connectUrl: string; syncUrl?: string; disconnectUrl: string
  onConnected: () => void; comingSoon?: boolean
}) {
  const [showModal, setShowModal] = useState(false)
  const isConnected = integration?.status === 'active'

  if (comingSoon) {
    return (
      <div className="flex items-center gap-4 px-5 py-4 bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl opacity-40">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-gray-600">{desc}</p>
        </div>
        <span className="text-[11px] font-semibold text-gray-600 bg-[#1a1a1a] border border-[#2a2a2a] px-2.5 py-1 rounded-full">Yakında</span>
      </div>
    )
  }

  return (
    <>
      <div className={cn(
        'flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all',
        isConnected ? 'bg-[#0d0d0d] border-emerald-500/25' : 'bg-[#0d0d0d] border-[#1a1a1a]'
      )}>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white">{name}</p>
            {badge && (
              <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">{badge}</span>
            )}
            {isConnected && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Bağlı
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 truncate">{isConnected && integration?.shopDomain ? integration.shopDomain : desc}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="p-2 rounded-xl text-gray-600 hover:text-gray-300 hover:bg-[#1a1a1a] transition-all border border-[#2a2a2a]"
        >
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

// ─── Mail Domain Section ──────────────────────────────────────────────────────

function DnsRecordRow({ record }: { record: DnsRecord }) {
  const statusColor = record.status === 'verified' ? 'text-emerald-400' : record.status === 'not_started' ? 'text-gray-600' : 'text-amber-400'
  return (
    <div className="grid grid-cols-[100px_1fr_1fr_80px] gap-3 items-center py-3 border-b border-[#1a1a1a] last:border-0">
      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg text-center">{record.type}</span>
      <div className="min-w-0">
        <p className="text-xs font-mono text-gray-400 truncate">{record.name}</p>
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        <p className="text-xs font-mono text-gray-500 truncate flex-1">{record.value}</p>
        <CopyButton value={record.value} />
      </div>
      <div className="flex justify-end">
        {record.status ? (
          <span className={cn('text-[11px] font-semibold', statusColor)}>
            {record.status === 'verified' ? '✓ OK' : record.status === 'not_started' ? '— Bekliyor' : '⏳ Kontrol...'}
          </span>
        ) : (
          <span className="text-[11px] text-gray-600">—</span>
        )}
      </div>
    </div>
  )
}

function MailDomainSection() {
  const [domains, setDomains] = useState<EmailDomain[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [creating, setCreating] = useState(false)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const loadDomains = useCallback(async () => {
    try {
      const res = await fetch('/api/email/domain')
      const data = await res.json()
      setDomains(data.domains ?? [])
    } catch {}
  }, [])

  useEffect(() => { loadDomains() }, [loadDomains])

  async function handleCreate() {
    if (!newDomain.trim()) return
    setCreating(true); setError('')
    try {
      const res = await fetch('/api/email/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim() }),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(data.error ?? `Sunucu hatası (${res.status})`)
      await loadDomains()
      setNewDomain(''); setShowAdd(false)
    } catch (e) { setError(e instanceof Error ? e.message : 'Beklenmeyen hata') }
    finally { setCreating(false) }
  }

  async function handleVerify(domainId: string) {
    setVerifying(domainId)
    try {
      const res = await fetch('/api/email/domain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId }),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) { setError(data.error ?? 'Doğrulama başarısız'); return }
      await loadDomains()
    } catch (e) { setError(e instanceof Error ? e.message : 'Hata') }
    finally { setVerifying(null) }
  }

  async function handleDelete(domainId: string) {
    setDeleting(domainId)
    try {
      await fetch(`/api/email/domain/${domainId}`, { method: 'DELETE' })
      await loadDomains()
    } finally { setDeleting(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Mail Domain</h3>
          <p className="text-sm text-gray-600 mt-1">Kendi domaininizden kampanya maili gönderin (kampanya@markaniz.com)</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" /> Domain Ekle
        </button>
      </div>

      {/* Nasıl çalışır */}
      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Kurulum Adımları</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { n: '1', title: 'Domain Ekle', desc: 'Marka domaininizi girin' },
            { n: '2', title: 'DNS Kayıtları', desc: 'SPF, DKIM, DMARC kayıtlarını kopyalayın' },
            { n: '3', title: 'Sağlayıcıya Ekle', desc: 'GoDaddy, Namecheap veya Cloudflare\'e ekleyin' },
            { n: '4', title: 'Doğrula', desc: 'Verify butonuna basın' },
          ].map(s => (
            <div key={s.n} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[11px] font-bold text-blue-400 shrink-0 mt-0.5">{s.n}</div>
              <div>
                <p className="text-xs font-semibold text-gray-300">{s.title}</p>
                <p className="text-[11px] text-gray-600 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add domain form */}
      {showAdd && (
        <div className="bg-[#0d0d0d] border border-blue-500/20 rounded-2xl p-5 space-y-3">
          <p className="text-sm font-semibold text-white">Yeni Domain Ekle</p>
          <div className="flex gap-2">
            <input
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="markaniz.com"
              className="flex-1 px-3 py-2.5 text-sm border border-[#2a2a2a] bg-[#111] text-gray-300 placeholder:text-gray-700 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              onClick={handleCreate} disabled={creating || !newDomain.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {creating ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
            <button onClick={() => setShowAdd(false)} className="p-2.5 text-gray-600 hover:text-gray-300 border border-[#2a2a2a] rounded-xl transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}
        </div>
      )}

      {/* Domain list */}
      {domains.length === 0 && !showAdd && (
        <div className="text-center py-10 bg-[#0d0d0d] border border-dashed border-[#2a2a2a] rounded-2xl">
          <Globe2 className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">Henüz domain eklenmedi</p>
          <p className="text-xs text-gray-700 mt-1">Kendi domaininizden mail göndermek için domain ekleyin</p>
        </div>
      )}

      {domains.map(d => {
        let records: DnsRecord[] = []
        try { records = JSON.parse(d.dnsRecords) } catch {}

        return (
          <div key={d.id} className={cn(
            'bg-[#0d0d0d] border rounded-2xl overflow-hidden',
            d.status === 'verified' ? 'border-emerald-500/25' : 'border-[#1a1a1a]'
          )}>
            {/* Domain header */}
            <div className="px-5 py-4 flex items-center gap-4 border-b border-[#1a1a1a]">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border',
                d.status === 'verified' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-[#111] border-[#2a2a2a]'
              )}>
                <Globe2 className={cn('w-5 h-5', d.status === 'verified' ? 'text-emerald-400' : 'text-gray-600')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white">{d.domain}</p>
                  <StatusBadge status={d.status} />
                </div>
                {d.fromEmail && (
                  <p className="text-xs text-gray-600 mt-0.5">Gönderici: <span className="text-gray-400 font-mono">{d.fromEmail}</span></p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {d.status !== 'verified' && (
                  <button
                    onClick={() => handleVerify(d.id)}
                    disabled={verifying === d.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 rounded-lg transition-all"
                  >
                    {verifying === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    Verify Domain
                  </button>
                )}
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={deleting === d.id}
                  className="p-1.5 text-gray-700 hover:text-red-400 transition-colors"
                >
                  {deleting === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* DNS Records */}
            {records.length > 0 && (
              <div className="px-5 pb-2">
                <div className="grid grid-cols-[100px_1fr_1fr_80px] gap-3 py-2 border-b border-[#1a1a1a]">
                  <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Tip</p>
                  <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">İsim</p>
                  <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Değer</p>
                  <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider text-right">Durum</p>
                </div>
                {records.map((rec, i) => (
                  <DnsRecordRow key={i} record={rec} />
                ))}
              </div>
            )}

            {d.status !== 'verified' && records.length > 0 && (
              <div className="px-5 py-3 bg-amber-500/5 border-t border-amber-500/10">
                <p className="text-xs text-amber-500/80">
                  Bu DNS kayıtlarını domain sağlayıcınıza (GoDaddy, Namecheap, Cloudflare vb.) ekleyin, ardından &quot;Verify Domain&quot; butonuna basın. DNS yayılması 5-60 dakika sürebilir.
                </p>
              </div>
            )}

            {d.status === 'verified' && (
              <div className="px-5 py-3 bg-emerald-500/5 border-t border-emerald-500/10">
                <p className="text-xs text-emerald-400">
                  Domain doğrulandı. Kampanyalarınızda <strong className="font-mono">{d.fromEmail}</strong> adresini kullanabilirsiniz.
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Store Settings ───────────────────────────────────────────────────────────

function StoreSettings() {
  const [storeName, setStoreName] = useState('')
  const [currency, setCurrency]   = useState('TRY')
  const [language, setLanguage]   = useState('tr')
  const [timezone, setTimezone]   = useState('Europe/Istanbul')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [loaded, setLoaded]       = useState(false)

  useEffect(() => {
    fetch('/api/settings/store').then(r => r.json()).then(d => {
      if (d.storeName) setStoreName(d.storeName)
      if (d.currency)  setCurrency(d.currency)
      if (d.language)  setLanguage(d.language)
      if (d.timezone)  setTimezone(d.timezone)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/settings/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName, currency, language, timezone }),
      })
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  if (!loaded) return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-600" /></div>

  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-white mb-5">Mağaza Bilgileri</h3>
      <SettingRow label="Mağaza Adı" desc="Müşterilerinize gösterilen isim">
        <input
          value={storeName}
          onChange={e => setStoreName(e.target.value)}
          className="px-3 py-2.5 text-sm border border-[#2a2a2a] bg-[#111] text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 w-52"
        />
      </SettingRow>
      <SettingRow label="Para Birimi">
        <select value={currency} onChange={e => setCurrency(e.target.value)}
          className="px-3 py-2.5 text-sm border border-[#2a2a2a] bg-[#111] text-gray-300 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 w-36">
          <option value="TRY">TRY (₺)</option>
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
        </select>
      </SettingRow>
      <SettingRow label="Dil">
        <select value={language} onChange={e => setLanguage(e.target.value)}
          className="px-3 py-2.5 text-sm border border-[#2a2a2a] bg-[#111] text-gray-300 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 w-36">
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
        </select>
      </SettingRow>
      <SettingRow label="Zaman Dilimi">
        <select value={timezone} onChange={e => setTimezone(e.target.value)}
          className="px-3 py-2.5 text-sm border border-[#2a2a2a] bg-[#111] text-gray-300 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 w-52">
          <option value="Europe/Istanbul">Europe/Istanbul (UTC+3)</option>
          <option value="UTC">UTC</option>
        </select>
      </SettingRow>
      <div className="pt-5">
        <button
          onClick={handleSave} disabled={saving}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all',
            saved ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700',
            saving && 'opacity-60'
          )}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi' : 'Değişiklikleri Kaydet'}
        </button>
      </div>
    </div>
  )
}

// ─── Notifications ────────────────────────────────────────────────────────────

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    campaignDone: true,
    cartAbandoned: false,
    weeklyReport: true,
    newCustomer: false,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  function toggle(key: keyof typeof prefs) { setPrefs(p => ({ ...p, [key]: !p[key] })) }

  async function handleSave() {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaved(true); setSaving(false)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-white mb-4">Bildirim Tercihleri</h3>
      <SettingRow label="Kampanya tamamlandığında" desc="Kampanya gönderimi bitince bildir">
        <Toggle checked={prefs.campaignDone} onChange={() => toggle('campaignDone')} />
      </SettingRow>
      <SettingRow label="Sepet terk tespit edildiğinde" desc="Gerçek zamanlı sepet terk bildirimleri">
        <Toggle checked={prefs.cartAbandoned} onChange={() => toggle('cartAbandoned')} />
      </SettingRow>
      <SettingRow label="Haftalık performans raporu" desc="Her Pazartesi email ile özet gönder">
        <Toggle checked={prefs.weeklyReport} onChange={() => toggle('weeklyReport')} />
      </SettingRow>
      <SettingRow label="Yeni müşteri kaydı" desc="Yeni müşteri oluşturulunca bildir">
        <Toggle checked={prefs.newCustomer} onChange={() => toggle('newCustomer')} />
      </SettingRow>
      <div className="pt-5">
        <button onClick={handleSave} disabled={saving}
          className={cn('flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all', saved ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700')}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('integrations')
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [oauthSuccess, setOauthSuccess] = useState(false)

  const loadIntegrations = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations')
      const data = await res.json()
      setIntegrations(data.integrations ?? [])
    } catch {}
  }, [])

  useEffect(() => {
    loadIntegrations()
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'shopify') {
      setOauthSuccess(true)
      window.history.replaceState({}, '', '/settings?tab=integrations')
      setTimeout(() => setOauthSuccess(false), 5000)
    }
    if (params.get('tab') === 'integrations') setActiveTab('integrations')
    if (params.get('tab') === 'maildomain')   setActiveTab('maildomain')
  }, [loadIntegrations])

  const shopifyIntegration  = integrations.find(i => i.platform === 'shopify')
  const ikasIntegration     = integrations.find(i => i.platform === 'ikas')
  const wooIntegration      = integrations.find(i => i.platform === 'woocommerce')
  const whatsappIntegration = integrations.find(i => i.platform === 'whatsapp')

  return (
    <AppShell>
      <Header title="Ayarlar" subtitle="Entegrasyon ve hesap ayarları" />

      <div className="p-4 lg:p-6 flex-1">
        <div className="flex gap-6 max-w-5xl">
          {/* Sidebar */}
          <div className="w-48 shrink-0 space-y-0.5">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                    isActive ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-[#141414] hover:text-gray-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">

            {/* ENTEGRASYONLAR */}
            {activeTab === 'integrations' && (
              <div className="space-y-4">
                {oauthSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-400">Shopify başarıyla bağlandı!</p>
                      <p className="text-xs text-emerald-500/70">Verileri senkronize etmek için ayarlar butonuna bas.</p>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-base font-bold text-white">Platform Entegrasyonları</h3>
                  <p className="text-sm text-gray-600 mt-1">Mağaza verinizi Marksio&apos;ya bağlayın</p>
                </div>

                {/* E-commerce platforms */}
                <div className="space-y-2.5">
                  {/* Shopify — OAuth flow, special handling */}
                  <div className={cn(
                    'flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all',
                    shopifyIntegration?.status === 'active' ? 'bg-[#0d0d0d] border-emerald-500/25' : 'bg-[#0d0d0d] border-[#1a1a1a]'
                  )}>
                    <div className="w-10 h-10 rounded-xl bg-[#96bf48]/15 border border-[#96bf48]/20 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-5 h-5 text-[#96bf48]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">Shopify</p>
                        {shopifyIntegration?.status === 'active' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Bağlı
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {shopifyIntegration?.shopDomain ?? 'Sipariş, müşteri ve sepet verilerini çek'}
                      </p>
                    </div>
                    <ShopifySettingsButton integration={shopifyIntegration} onConnected={loadIntegrations} />
                  </div>

                  <IntegrationCard
                    icon={Store} name="İkas" desc="Sipariş ve müşteri verilerini çek" iconBg="bg-purple-600"
                    integration={ikasIntegration} onConnected={loadIntegrations}
                    connectUrl="/api/integrations/ikas/connect"
                    syncUrl="/api/integrations/ikas/sync"
                    disconnectUrl="/api/integrations/ikas/disconnect"
                    modalFields={[
                      { key: 'storeName',   label: 'Mağaza Adı',  placeholder: 'magazaniz', hint: 'İkas panelindeki mağaza adı' },
                      { key: 'accessToken', label: 'API Token',    placeholder: 'ey...', secret: true, hint: 'İkas Admin → API → Token oluştur' },
                    ]}
                  />

                  <IntegrationCard
                    icon={Globe} name="WooCommerce" desc="WordPress/WooCommerce sipariş ve müşteri verilerini çek" iconBg="bg-blue-600"
                    integration={wooIntegration} onConnected={loadIntegrations}
                    connectUrl="/api/integrations/woocommerce/connect"
                    syncUrl="/api/integrations/woocommerce/sync"
                    disconnectUrl="/api/integrations/woocommerce/disconnect"
                    modalFields={[
                      { key: 'storeUrl',       label: 'Mağaza URL',      placeholder: 'https://magazaniz.com' },
                      { key: 'consumerKey',    label: 'Consumer Key',    placeholder: 'ck_...', secret: true },
                      { key: 'consumerSecret', label: 'Consumer Secret', placeholder: 'cs_...', secret: true },
                    ]}
                  />

                  <IntegrationCard
                    icon={MessageSquare} name="WhatsApp AI Chatbot" desc="Müşteriler WhatsApp üzerinden otomatik yanıt alır" iconBg="bg-green-600"
                    badge="Premium"
                    integration={whatsappIntegration} onConnected={loadIntegrations}
                    connectUrl="/api/integrations/whatsapp/connect"
                    disconnectUrl="/api/integrations/whatsapp/disconnect"
                    modalFields={[
                      { key: 'phoneNumberId', label: 'Phone Number ID',       placeholder: '1234567890123456', hint: 'Meta Developers → WhatsApp → API Setup' },
                      { key: 'accessToken',   label: 'Permanent Access Token', placeholder: 'EAAxxxxxx...', secret: true, hint: 'Meta Business Manager → System User Token' },
                    ]}
                  />

                  {/* Mail Servisi — Mail Domain tab'ına yönlendirir */}
                  <div
                    onClick={() => setActiveTab('maildomain')}
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-[#1a1a1a] bg-[#0d0d0d] hover:border-violet-500/20 transition-all cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">Mail Domain</p>
                      <p className="text-xs text-gray-600">SPF, DKIM, DMARC ile kendi domaininizden gönderin</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors" />
                  </div>

                  <div className="space-y-2">
                    <IntegrationCard icon={ShoppingBag} name="Trendyol"    desc="Trendyol pazar yeri siparişleri"    iconBg="bg-orange-500" integration={undefined} onConnected={() => {}} connectUrl="" disconnectUrl="" modalFields={[]} comingSoon />
                    <IntegrationCard icon={Package}     name="Hepsiburada" desc="Hepsiburada pazar yeri siparişleri" iconBg="bg-amber-500"  integration={undefined} onConnected={() => {}} connectUrl="" disconnectUrl="" modalFields={[]} comingSoon />
                  </div>
                </div>

                {/* Shopify Webhook */}
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-gray-400">Shopify Webhook URL</p>
                    <CopyButton value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/shopify` : ''} />
                  </div>
                  <code className="text-xs text-gray-500 font-mono block">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/webhooks/shopify
                  </code>
                </div>
              </div>
            )}

            {/* MAIL DOMAIN */}
            {activeTab === 'maildomain' && <MailDomainSection />}

            {/* MAĞAZA */}
            {activeTab === 'store' && <StoreSettings />}

            {/* API ANAHTARLARI */}
            {activeTab === 'api' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white">Bağlı Servisler</h3>
                  <p className="text-sm text-gray-600 mt-1">Entegre ettiğiniz servislerin bağlantı durumu</p>
                </div>
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl divide-y divide-[#1a1a1a]">
                  {[
                    { name: 'Shopify API',       desc: 'Mağaza entegrasyonu',         connected: shopifyIntegration?.status === 'active'  },
                    { name: 'İkas API',           desc: 'Mağaza entegrasyonu',         connected: ikasIntegration?.status === 'active'     },
                    { name: 'WhatsApp API',       desc: 'WhatsApp AI chatbot',         connected: whatsappIntegration?.status === 'active' },
                    { name: 'Mail Domain',        desc: 'E-posta gönderimi',           connected: false, action: () => setActiveTab('maildomain') },
                  ].map(item => (
                    <div key={item.name} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-gray-300">{item.name}</p>
                        <p className="text-xs text-gray-600">{item.desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.connected ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full">
                            Bağlı Değil
                          </span>
                        )}
                        {item.action && (
                          <button onClick={item.action} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Ayarla →</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BİLDİRİMLER */}
            {activeTab === 'notifications' && <NotificationsSection />}

            {/* PLAN & ÖDEME */}
            {activeTab === 'billing' && (
              <div className="space-y-4">
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-[#0f1729] to-[#0a0f1e] border border-blue-500/20 overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
                  <div className="flex items-start justify-between relative">
                    <div>
                      <p className="text-xs text-blue-400/70 font-semibold uppercase tracking-wider mb-2">Mevcut Plan</p>
                      <p className="text-3xl font-bold text-white">Growth</p>
                      <p className="text-blue-400/60 text-sm mt-1.5">$49 / ay · 50.000 email</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>
                </div>
                <a href="/plans" className="flex items-center justify-between p-4 bg-[#0d0d0d] rounded-2xl border border-[#1a1a1a] hover:border-blue-500/30 transition-all group">
                  <span className="text-sm font-medium text-gray-400 group-hover:text-gray-200 transition-colors">Tüm planları gör ve yükselt</span>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

// ─── Shopify settings button (OAuth flow) ─────────────────────────────────────

function ShopifySettingsButton({ integration, onConnected }: { integration?: Integration; onConnected: () => void }) {
  const [showModal, setShowModal]   = useState(false)
  const [domain, setDomain]         = useState('')
  const [syncing, setSyncing]       = useState(false)
  const [syncResult, setSyncResult] = useState<{ stats?: { customers: number; orders: number; products: number; abandonedCarts: number }; error?: string } | null>(null)
  const [polling, setPolling]       = useState(false)
  const isConnected = integration?.status === 'active'
  const meta = parseMeta(integration?.meta)

  async function handleSync() {
    setSyncing(true); setSyncResult(null)
    try {
      const res  = await fetch('/api/integrations/shopify/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSyncResult({ stats: data.stats })
      onConnected()
    } catch (e) {
      setSyncResult({ error: e instanceof Error ? e.message : 'Hata' })
    } finally { setSyncing(false) }
  }

  // Poll for sync progress (used while syncInProgress = true after page load)
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

  const syncIndicator = syncing || polling

  return (
    <>
      <button onClick={() => setShowModal(true)} className="p-2 rounded-xl text-gray-600 hover:text-gray-300 hover:bg-[#1a1a1a] transition-all border border-[#2a2a2a]">
        <Settings className="w-4 h-4" />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-lg">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#96bf48]/15 border border-[#96bf48]/20 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-[#96bf48]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">
                    {isConnected ? (meta.shopName ?? integration?.shopDomain) : 'Mağaza Bağla'}
                  </h3>
                  {isConnected && (
                    <p className="text-[11px] text-gray-600 font-mono">{integration?.shopDomain}</p>
                  )}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-gray-300"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              {isConnected ? (
                <>
                  {/* Status row */}
                  <div className="flex items-center justify-between p-3 bg-emerald-500/8 border border-emerald-500/15 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-semibold text-emerald-400">Bağlı</span>
                      {meta.webhooksRegistered && (
                        <span className="text-[10px] text-emerald-500/60 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">webhooks ✓</span>
                      )}
                    </div>
                    {integration?.lastSyncAt && (
                      <span className="text-[11px] text-gray-600">
                        Son sync: {new Date(integration.lastSyncAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {/* Last sync stats */}
                  {meta.lastSync && (
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Ürünler',    value: meta.lastSync.products,      icon: Package      },
                        { label: 'Müşteriler', value: meta.lastSync.customers,     icon: Users        },
                        { label: 'Siparişler', value: meta.lastSync.orders,        icon: ShoppingBag  },
                        { label: 'Sepet Terk', value: meta.lastSync.abandonedCarts,icon: ShoppingCart },
                      ].map(s => (
                        <div key={s.label} className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-3 text-center">
                          <s.icon className="w-3.5 h-3.5 text-gray-600 mx-auto mb-1" />
                          <p className="text-sm font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{s.value.toLocaleString('tr-TR')}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sync result feedback */}
                  {syncResult?.stats && (
                    <div className="text-xs text-emerald-400 bg-emerald-500/8 border border-emerald-500/15 rounded-xl px-3 py-2.5 space-y-0.5">
                      <p className="font-semibold">✓ Senkronizasyon tamamlandı</p>
                      <p className="text-emerald-500/70">{syncResult.stats.products} ürün · {syncResult.stats.customers} müşteri · {syncResult.stats.orders} sipariş · {syncResult.stats.abandonedCarts} sepet</p>
                    </div>
                  )}
                  {syncResult?.error && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {syncResult.error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-1">
                    <button onClick={handleSync} disabled={syncIndicator}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#b4c5ff]/10 hover:bg-[#b4c5ff]/20 disabled:opacity-40 text-[#b4c5ff] border border-[#b4c5ff]/20 text-sm font-semibold rounded-xl transition-all">
                      {syncIndicator ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      {syncing ? 'Senkronize ediliyor...' : polling ? 'Sync devam ediyor...' : 'Tüm Veriyi Senkronize Et'}
                    </button>
                    <button
                      onClick={async () => {
                        await fetch('/api/integrations/shopify/disconnect', { method: 'POST' })
                        onConnected(); setShowModal(false)
                      }}
                      className="px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded-xl transition-all whitespace-nowrap"
                    >
                      Bağlantıyı Kes
                    </button>
                  </div>

                  {/* Webhook URL */}
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl">
                    <Globe className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                    <code className="text-[11px] text-gray-600 font-mono flex-1 truncate">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/shopify
                    </code>
                    <CopyButton value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/shopify` : ''} />
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-[#b4c5ff]/5 border border-[#b4c5ff]/15 rounded-xl px-4 py-3 space-y-1">
                    <p className="text-xs font-semibold text-[#b4c5ff]">OAuth bağlantısı</p>
                    <p className="text-[11px] text-gray-600">Mağaza adresini gir → İzin sayfasına yönlendirilirsin → İzin ver → Otomatik bağlanır.</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block uppercase tracking-wider">Mağaza Domain</label>
                    <div className="flex gap-2">
                      <input
                        value={domain} onChange={e => setDomain(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && domain)
                            window.location.href = `/api/integrations/shopify/auth?shop=${encodeURIComponent(domain.replace(/^https?:\/\//, '').replace(/\/$/, ''))}`
                        }}
                        placeholder="magazaniz.myshopify.com"
                        className="flex-1 px-3 py-2.5 text-sm border border-[#2a2a2a] bg-[#0d0d0d] text-gray-300 placeholder:text-gray-700 rounded-xl focus:outline-none focus:border-[#b4c5ff]/50 focus:ring-2 focus:ring-[#b4c5ff]/20"
                      />
                      <button
                        onClick={() => {
                          if (domain)
                            window.location.href = `/api/integrations/shopify/auth?shop=${encodeURIComponent(domain.replace(/^https?:\/\//, '').replace(/\/$/, ''))}`
                        }}
                        disabled={!domain}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#96bf48] hover:bg-[#7ea33a] disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all whitespace-nowrap"
                      >
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
