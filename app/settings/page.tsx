'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Key, Store, Bell, Shield, Check, Eye, EyeOff,
  Sparkles, Mail, Phone, MessageSquare, Link2, Link2Off,
  RefreshCw, Loader2, AlertCircle, ShoppingBag, Globe,
  Zap, ChevronRight, Package,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { cn } from '@/lib/utils'

type Tab = 'integrations' | 'store' | 'api' | 'notifications' | 'billing'

const tabs: Array<{ key: Tab; label: string; icon: React.ElementType }> = [
  { key: 'integrations',  label: 'Entegrasyonlar',  icon: Link2    },
  { key: 'store',         label: 'Mağaza',           icon: Store    },
  { key: 'api',           label: 'API Anahtarları',  icon: Key      },
  { key: 'notifications', label: 'Bildirimler',      icon: Bell     },
  { key: 'billing',       label: 'Plan & Ödeme',     icon: Shield   },
]

interface Integration {
  id: string
  platform: string
  shopDomain?: string
  status: string
  lastSyncAt?: string
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

function Toggle({ defaultChecked = true }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked)
  return (
    <button
      onClick={() => setOn(!on)}
      className={cn('relative inline-flex rounded-full transition-colors', on ? 'bg-blue-600' : 'bg-[#2a2a2a]')}
      style={{ height: '22px', width: '40px' }}
    >
      <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', on ? 'translate-x-[18px]' : 'translate-x-0')} />
    </button>
  )
}

function ShopifyCard({ integration, onConnected }: {
  integration?: Integration
  onConnected: () => void
}) {
  const isConnected = integration?.status === 'active'
  const [domain, setDomain] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState('')
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(!isConnected)

  function handleConnect() {
    if (!domain) return
    const shop = domain.replace('https://', '').replace('http://', '').replace(/\/$/, '')
    window.location.href = `/api/integrations/shopify/auth?shop=${encodeURIComponent(shop)}`
  }

  async function handleSync() {
    setSyncing(true); setSyncResult('')
    try {
      const res = await fetch('/api/integrations/shopify/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSyncResult(data.message); onConnected()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Senkronizasyon hatası')
    } finally { setSyncing(false) }
  }

  async function handleDisconnect() {
    await fetch('/api/integrations/shopify/disconnect', { method: 'POST' })
    onConnected(); setExpanded(true); setDomain('')
  }

  return (
    <div className={cn('rounded-2xl border-2 overflow-hidden transition-all', isConnected ? 'border-emerald-500/30' : 'border-[#1e1e1e]')}>
      <div className="px-5 py-4 flex items-center gap-4 bg-[#111]">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border', isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-[#1a1a1a] border-[#2a2a2a]')}>
          <ShoppingBag className={cn('w-5 h-5', isConnected ? 'text-emerald-400' : 'text-gray-600')} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">Shopify</p>
            {isConnected && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Bağlı
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600">{isConnected ? integration?.shopDomain : 'Sipariş, müşteri ve sepet verilerini çek'}</p>
          {integration?.lastSyncAt && (
            <p className="text-[11px] text-gray-700 mt-0.5">Son sync: {new Date(integration.lastSyncAt).toLocaleString('tr-TR')}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all">
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Senkronize Et
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="text-gray-600 hover:text-gray-300 transition-colors p-1">
            <ChevronRight className={cn('w-4 h-4 transition-transform', expanded && 'rotate-90')} />
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="px-5 pb-3 bg-[#111]">
          <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">✓ {syncResult}</p>
        </div>
      )}

      {expanded && (
        <div className="px-5 pb-5 pt-4 border-t border-[#1e1e1e] bg-[#0d0d0d] space-y-4">
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3 text-xs text-blue-400">
            <p className="font-semibold mb-1">Nasıl çalışır?</p>
            <p className="text-blue-500/80">Mağaza adresini gir → Shopify izin sayfasına yönlendirilirsin → İzin ver → Otomatik bağlanır.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wider">Mağaza Domain</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
                placeholder="magazaniz.myshopify.com"
                className="flex-1 px-3 py-2.5 text-sm border border-[#2a2a2a] bg-[#111] text-gray-300 placeholder:text-gray-700 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={handleConnect}
                disabled={!domain}
                className="flex items-center gap-2 px-4 py-2 bg-[#96bf48] hover:bg-[#7ea33a] disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all whitespace-nowrap"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Shopify ile Bağlan
              </button>
            </div>
            <p className="text-[11px] text-gray-700 mt-1.5">Örnek: gqcdmn-9j.myshopify.com</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}
          {isConnected && (
            <button onClick={handleDisconnect} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors">
              <Link2Off className="w-3.5 h-3.5" /> Bağlantıyı Kes
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function PlatformCard({
  icon: Icon, name, desc, iconBg, integration, onConnected,
  fields, connectUrl, syncUrl, disconnectUrl,
}: {
  icon: React.ElementType; name: string; desc: string; iconBg: string
  integration?: Integration; onConnected: () => void
  fields: Array<{ key: string; label: string; placeholder: string; secret?: boolean }>
  connectUrl: string; syncUrl: string; disconnectUrl: string
}) {
  const isConnected = integration?.status === 'active'
  const [values, setValues] = useState<Record<string, string>>({})
  const [show, setShow] = useState<Record<string, boolean>>({})
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState('')
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(!isConnected)

  async function handleConnect() {
    const missing = fields.find(f => !values[f.key])
    if (missing) return
    setConnecting(true); setError('')
    try {
      const res = await fetch(connectUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onConnected(); setExpanded(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bağlantı hatası')
    } finally { setConnecting(false) }
  }

  async function handleSync() {
    setSyncing(true); setSyncResult('')
    try {
      const res = await fetch(syncUrl, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSyncResult(data.message); onConnected()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync hatası')
    } finally { setSyncing(false) }
  }

  async function handleDisconnect() {
    await fetch(disconnectUrl, { method: 'POST' })
    onConnected(); setExpanded(true); setValues({})
  }

  return (
    <div className={cn('rounded-2xl border-2 overflow-hidden transition-all', isConnected ? 'border-emerald-500/30' : 'border-[#1e1e1e]')}>
      <div className="px-5 py-4 flex items-center gap-4 bg-[#111]">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{name}</p>
            {isConnected && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Bağlı
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600">{isConnected ? integration?.shopDomain : desc}</p>
          {integration?.lastSyncAt && (
            <p className="text-[11px] text-gray-700 mt-0.5">Son sync: {new Date(integration.lastSyncAt).toLocaleString('tr-TR')}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isConnected && (
            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all">
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Senkronize Et
            </button>
          )}
          <button onClick={() => setExpanded(!expanded)} className="text-gray-600 hover:text-gray-300 transition-colors p-1">
            <ChevronRight className={cn('w-4 h-4 transition-transform', expanded && 'rotate-90')} />
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="px-5 pb-3 bg-[#111]">
          <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">✓ {syncResult}</p>
        </div>
      )}

      {expanded && (
        <div className="px-5 pb-5 pt-4 border-t border-[#1e1e1e] bg-[#0d0d0d] space-y-3">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wider">{f.label}</label>
              <div className="relative">
                <input
                  type={f.secret && !show[f.key] ? 'password' : 'text'}
                  value={values[f.key] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 text-sm border border-[#2a2a2a] bg-[#111] text-gray-300 placeholder:text-gray-700 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 pr-9"
                />
                {f.secret && (
                  <button type="button" onClick={() => setShow(s => ({ ...s, [f.key]: !s[f.key] }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                    {show[f.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button onClick={handleConnect} disabled={connecting || fields.some(f => !values[f.key])}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all">
              {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
              {connecting ? 'Bağlanıyor...' : 'Bağla ve Test Et'}
            </button>
            {isConnected && (
              <button onClick={handleDisconnect} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors">
                <Link2Off className="w-3.5 h-3.5" /> Bağlantıyı Kes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function WhatsAppChatbotCard({ integration, onConnected }: { integration?: Integration; onConnected: () => void }) {
  const isConnected = integration?.status === 'active'
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [accessToken, setAccessToken]     = useState('')
  const [showToken, setShowToken]         = useState(false)
  const [connecting, setConnecting]       = useState(false)
  const [error, setError]                 = useState('')
  const [expanded, setExpanded]           = useState(!isConnected)

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/whatsapp/webhook`
    : 'https://app.marksio.com/api/whatsapp/webhook'

  async function handleConnect() {
    if (!phoneNumberId || !accessToken) return
    setConnecting(true); setError('')
    try {
      const res = await fetch('/api/integrations/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumberId, accessToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onConnected(); setExpanded(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bağlantı hatası')
    } finally { setConnecting(false) }
  }

  async function handleDisconnect() {
    await fetch('/api/integrations/whatsapp/disconnect', { method: 'POST' })
    onConnected(); setExpanded(true)
  }

  return (
    <div className={cn(
      'rounded-2xl border-2 overflow-hidden transition-all',
      isConnected ? 'border-green-500/40' : 'border-green-500/20 bg-gradient-to-b from-green-500/5 to-transparent'
    )}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-4 bg-[#111]">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border',
          isConnected ? 'bg-green-500/10 border-green-500/20' : 'bg-green-500/10 border-green-500/20'
        )}>
          <MessageSquare className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white">WhatsApp AI Chatbot</p>
            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Premium Özellik
            </span>
            {isConnected && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Aktif
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {isConnected ? integration?.shopDomain : 'Müşteriler mağazanla WhatsApp\'tan konuşur — AI otomatik yanıtlar'}
          </p>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-gray-600 hover:text-gray-300 transition-colors p-1">
          <ChevronRight className={cn('w-4 h-4 transition-transform', expanded && 'rotate-90')} />
        </button>
      </div>

      {/* Feature highlights */}
      {!isConnected && !expanded && (
        <div className="px-5 pb-4 bg-[#111]">
          <div className="flex items-center gap-6">
            {['Stok & fiyat bilir', 'Sipariş sorgular', 'Türkçe konuşur'].map(f => (
              <div key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                <Check className="w-3 h-3 text-green-400" /> {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && (
        <div className="border-t border-[#1e1e1e] bg-[#0d0d0d]">
          {/* Nasıl çalışır */}
          <div className="px-5 pt-5 pb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Nasıl çalışır?</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { step: '1', title: 'Meta Hesap', desc: 'Meta Business + WhatsApp Business API' },
                { step: '2', title: 'API Bilgileri', desc: 'Phone Number ID ve Access Token gir' },
                { step: '3', title: 'Webhook Kur', desc: 'Meta\'ya webhook URL\'ini ekle' },
              ].map(s => (
                <div key={s.step} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[11px] font-bold text-green-400 mb-2">
                    {s.step}
                  </div>
                  <p className="text-xs font-medium text-gray-300">{s.title}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="px-5 pb-5 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wider">Phone Number ID</label>
              <input
                type="text"
                value={phoneNumberId}
                onChange={e => setPhoneNumberId(e.target.value)}
                placeholder="1234567890123456"
                className="w-full px-3 py-2.5 text-sm border border-[#2a2a2a] bg-[#111] text-gray-300 placeholder:text-gray-700 rounded-xl focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
              />
              <p className="text-[11px] text-gray-700 mt-1">Meta for Developers → App → WhatsApp → API Setup → Phone Number ID</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block uppercase tracking-wider">Permanent Access Token</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  placeholder="EAAxxxxxx..."
                  className="w-full px-3 py-2.5 pr-9 text-sm border border-[#2a2a2a] bg-[#111] text-gray-300 placeholder:text-gray-700 rounded-xl focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
                />
                <button type="button" onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-700 mt-1">System User Access Token — Meta Business Manager&apos;dan al</p>
            </div>

            {/* Webhook URL */}
            <div className="bg-green-500/5 border border-green-500/15 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-green-400 mb-1">Webhook URL (Meta&apos;ya ekle)</p>
              <code className="text-[11px] text-green-300/80 font-mono break-all">{webhookUrl}</code>
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <p className="text-[10px] text-gray-600">Verify Token</p>
                  <code className="text-[11px] text-gray-400 font-mono">marksio-whatsapp-verify-2024</code>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600">Subscribed Fields</p>
                  <code className="text-[11px] text-gray-400 font-mono">messages</code>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleConnect}
                disabled={connecting || !phoneNumberId || !accessToken}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all"
              >
                {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                {connecting ? 'Doğrulanıyor...' : 'WhatsApp\'ı Bağla'}
              </button>
              {isConnected && (
                <button onClick={handleDisconnect} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors">
                  <Link2Off className="w-3.5 h-3.5" /> Bağlantıyı Kes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ComingSoonCard({ icon: Icon, name, desc, iconBg }: {
  icon: React.ElementType; name: string; desc: string; iconBg: string
}) {
  return (
    <div className="bg-[#111] rounded-2xl border border-[#1e1e1e] px-5 py-4 flex items-center gap-4 opacity-50">
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('integrations')
  const [saved, setSaved] = useState(false)
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
  }, [loadIntegrations])

  const shopifyIntegration = integrations.find(i => i.platform === 'shopify')
  const ikasIntegration    = integrations.find(i => i.platform === 'ikas')
  const wooIntegration     = integrations.find(i => i.platform === 'woocommerce')

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

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
                      <p className="text-xs text-emerald-500/70">Verilerini senkronize etmek için &quot;Senkronize Et&quot; butonuna bas.</p>
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-white">Platform Entegrasyonları</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Mağaza verinizi Marksio&apos;ya bağlayın. Gerçek müşteri, sipariş ve sepet verileri ile otomasyonlar çalışır.
                  </p>
                </div>

                <ShopifyCard integration={shopifyIntegration} onConnected={loadIntegrations} />

                <PlatformCard
                  icon={Store} name="İkas" desc="İkas mağaza sipariş ve müşteri verilerini çek" iconBg="bg-purple-600"
                  integration={ikasIntegration} onConnected={loadIntegrations}
                  connectUrl="/api/integrations/ikas/connect"
                  syncUrl="/api/integrations/ikas/sync"
                  disconnectUrl="/api/integrations/ikas/disconnect"
                  fields={[
                    { key: 'storeName',   label: 'Mağaza Adı', placeholder: 'magazaniz' },
                    { key: 'accessToken', label: 'API Token',   placeholder: 'ey...', secret: true },
                  ]}
                />

                <PlatformCard
                  icon={Globe} name="WooCommerce" desc="WordPress/WooCommerce sipariş ve müşteri verilerini çek" iconBg="bg-blue-600"
                  integration={wooIntegration} onConnected={loadIntegrations}
                  connectUrl="/api/integrations/woocommerce/connect"
                  syncUrl="/api/integrations/woocommerce/sync"
                  disconnectUrl="/api/integrations/woocommerce/disconnect"
                  fields={[
                    { key: 'storeUrl',       label: 'Mağaza URL',      placeholder: 'https://magazaniz.com' },
                    { key: 'consumerKey',    label: 'Consumer Key',    placeholder: 'ck_...', secret: true },
                    { key: 'consumerSecret', label: 'Consumer Secret', placeholder: 'cs_...', secret: true },
                  ]}
                />

                <div className="space-y-2.5">
                  <ComingSoonCard icon={ShoppingBag} name="Trendyol"    desc="Trendyol pazar yeri siparişleri"    iconBg="bg-orange-500" />
                  <ComingSoonCard icon={Package}     name="Hepsiburada" desc="Hepsiburada pazar yeri siparişleri" iconBg="bg-amber-500"  />
                </div>

                {/* WhatsApp AI Chatbot — öne çıkan kart */}
                <WhatsAppChatbotCard integration={integrations.find(i => i.platform === 'whatsapp')} onConnected={loadIntegrations} />

                {/* Messaging channels */}
                <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
                  <p className="text-sm font-semibold text-white mb-4">Altyapı Servisleri</p>
                  <div className="space-y-3">
                    {[
                      { name: 'Resend (Email)',         icon: Mail,          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',       connected: true },
                      { name: 'Groq AI (Chatbot)',      icon: Zap,           color: 'text-violet-400 bg-violet-500/10 border-violet-500/20', connected: true },
                      { name: 'fal.ai (Görsel Üretim)', icon: Sparkles,      color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',       connected: true },
                    ].map(ch => {
                      const Icon = ch.icon
                      return (
                        <div key={ch.name} className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-0">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center border', ch.color)}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm text-gray-400">{ch.name}</span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> Aktif
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-amber-400 mb-1">Shopify Webhook URL</p>
                  <p className="text-xs text-amber-500/70 mb-2">
                    Shopify Admin&apos;de webhook eklerken bu URL&apos;i kullanın (gerçek zamanlı güncellemeler için)
                  </p>
                  <code className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1.5 rounded-lg block font-mono">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/webhooks/shopify
                  </code>
                </div>
              </div>
            )}

            {/* MAĞAZA */}
            {activeTab === 'store' && (
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Mağaza Bilgileri</h3>
                <SettingRow label="Mağaza Adı" desc="Müşterilerinize gösterilen isim">
                  <input defaultValue="Demo Mağaza" className="px-3 py-2.5 text-sm border border-[#2a2a2a] bg-[#0d0d0d] text-white rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 w-52" />
                </SettingRow>
                <SettingRow label="Para Birimi">
                  <select className="px-3 py-2.5 text-sm border border-[#2a2a2a] bg-[#0d0d0d] text-gray-300 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 w-36">
                    <option>TRY (₺)</option>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                  </select>
                </SettingRow>
                <SettingRow label="Dil">
                  <select className="px-3 py-2.5 text-sm border border-[#2a2a2a] bg-[#0d0d0d] text-gray-300 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 w-36">
                    <option>Türkçe</option>
                    <option>English</option>
                  </select>
                </SettingRow>
                <SettingRow label="Zaman Dilimi">
                  <select className="px-3 py-2.5 text-sm border border-[#2a2a2a] bg-[#0d0d0d] text-gray-300 rounded-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 w-52">
                    <option>Europe/Istanbul (UTC+3)</option>
                    <option>UTC</option>
                  </select>
                </SettingRow>
                <div className="pt-5">
                  <button
                    onClick={handleSave}
                    className={cn(
                      'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all',
                      saved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                    )}
                  >
                    {saved ? <><Check className="w-4 h-4" /> Kaydedildi</> : 'Değişiklikleri Kaydet'}
                  </button>
                </div>
              </div>
            )}

            {/* API ANAHTARLARI */}
            {activeTab === 'api' && (
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 space-y-5">
                <h3 className="text-sm font-semibold text-white">API Anahtarları</h3>
                <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-200">Groq AI</p>
                        <p className="text-xs text-gray-600">Kampanya içeriği üretimi (.env üzerinden)</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Aktif
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-700">
                  API anahtarları .env.local dosyasından okunur. Değiştirmek için dosyayı düzenleyin ve sunucuyu yeniden başlatın.
                </p>
              </div>
            )}

            {/* BİLDİRİMLER */}
            {activeTab === 'notifications' && (
              <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Bildirim Tercihleri</h3>
                <SettingRow label="Kampanya tamamlandığında" desc="Kampanya gönderimi bitince bildir">
                  <Toggle defaultChecked />
                </SettingRow>
                <SettingRow label="Sepet terk tespit edildiğinde" desc="Gerçek zamanlı sepet terk bildirimleri">
                  <Toggle defaultChecked={false} />
                </SettingRow>
                <SettingRow label="Haftalık performans raporu" desc="Her Pazartesi email ile özet gönder">
                  <Toggle defaultChecked />
                </SettingRow>
                <SettingRow label="Yeni müşteri kaydı">
                  <Toggle defaultChecked={false} />
                </SettingRow>
              </div>
            )}

            {/* PLAN & ÖDEME */}
            {activeTab === 'billing' && (
              <div className="space-y-4">
                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-start justify-between relative">
                    <div>
                      <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider mb-1">Mevcut Plan</p>
                      <p className="text-3xl font-bold">Growth</p>
                      <p className="text-blue-200 text-sm mt-1">$119 / ay</p>
                    </div>
                    <Sparkles className="w-8 h-8 text-blue-300" />
                  </div>
                </div>
                <a href="/plans" className="flex items-center justify-between p-4 bg-[#111] rounded-2xl border border-[#1e1e1e] hover:border-blue-500/30 transition-all group">
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
