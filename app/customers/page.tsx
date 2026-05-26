'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Users, Search, Star, AlertTriangle, UserPlus, Clock,
  Mail, MessageSquare, Sparkles, Upload, X, CheckCircle, Loader2, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

type Segment = 'vip' | 'loyal' | 'at_risk' | 'new' | 'inactive'

const segmentConfig: Record<Segment, { label: string; icon: React.ElementType; color: string; bg: string; border: string; bar: string }> = {
  vip:      { label: 'VIP',          icon: Star,          color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   bar: 'from-amber-500/40'   },
  loyal:    { label: 'Sadık',        icon: Users,         color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    bar: 'from-blue-500/40'    },
  at_risk:  { label: 'Risk Altında', icon: AlertTriangle, color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     bar: 'from-red-500/40'     },
  new:      { label: 'Yeni',         icon: UserPlus,      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'from-emerald-500/40' },
  inactive: { label: 'Pasif',        icon: Clock,         color: 'text-gray-500',    bg: 'bg-[#1a1a1a]',      border: 'border-[#2a2a2a]',      bar: 'from-gray-500/20'    },
}

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  segment: string
  totalOrders: number
  totalSpent: number
  lastOrder?: string
  score: number
}

function ImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (n: number) => void }) {
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    imported: number; skipped: number
    preview: Array<{ name: string; email?: string; phone?: string }>
  } | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setFileName(file.name)
    setError('')
    const reader = new FileReader()
    reader.onload = e => setText(e.target?.result as string ?? '')
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImport() {
    if (!text.trim()) { setError('Dosya içeriği boş'); return }
    setLoading(true)
    setError('')
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000)
      const res = await fetch('/api/customers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Sunucu hatası (${res.status})`)
      setResult(data)
      // onSuccess'i burada değil, kullanıcı "Tamam"a basınca çağır
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        setError('İstek zaman aşımına uğradı (60s). Daha kısa bir metin deneyin.')
      } else {
        setError(e instanceof Error ? e.message : 'İçe aktarma başarısız')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <h3 className="font-semibold text-white">AI ile Müşteri İçe Aktar</h3>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {result ? (
            /* ── Başarı ekranı ── */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-lg font-bold text-white">{result.imported} müşteri aktarıldı</p>
              {result.skipped > 0 && (
                <p className="text-xs text-gray-500 mt-1">{result.skipped} kayıt atlandı (geçersiz/tekrar)</p>
              )}

              {/* Preview */}
              {result.preview?.length > 0 && (
                <div className="mt-4 text-left bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl overflow-hidden">
                  <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider px-4 py-2 border-b border-[#1e1e1e]">
                    Aktarılan Örnekler
                  </p>
                  {result.preview.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1a1a1a] last:border-0">
                      <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                        {c.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-300 truncate">{c.name}</p>
                        <p className="text-[11px] text-gray-600 truncate">
                          {c.email && <span>{c.email}</span>}
                          {c.email && c.phone && <span className="mx-1">·</span>}
                          {c.phone && <span>{c.phone}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => { onSuccess(result?.imported ?? 0); onClose() }}
                className="mt-5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Tamam
              </button>
            </div>
          ) : (
            /* ── Upload ekranı ── */
            <>
              {/* AI badge */}
              <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-400/80 leading-relaxed">
                  <span className="font-semibold text-blue-400">AI destekli içe aktarma.</span>{' '}
                  Herhangi bir dosya ya da metin yükleyin — format önemli değil.
                  AI email adreslerini ve telefon numaralarını otomatik bulur.
                </div>
              </div>

              {/* Drop zone */}
              <div
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                  text
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-[#2a2a2a] hover:border-blue-500/30 hover:bg-blue-500/5'
                )}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const f = e.dataTransfer.files[0]
                  if (f) handleFile(f)
                }}
              >
                {text ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-emerald-400">{fileName || 'Metin yapıştırıldı'}</p>
                    <p className="text-xs text-emerald-500/60 mt-1">{text.split('\n').length} satır yüklendi</p>
                    <button
                      onClick={e => { e.stopPropagation(); setText(''); setFileName('') }}
                      className="mt-2 text-xs text-gray-600 hover:text-gray-400 underline"
                    >
                      Temizle
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-400">Dosyayı sürükle veya tıkla</p>
                    <p className="text-xs text-gray-600 mt-1">CSV, TXT, veya herhangi bir metin dosyası</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt,.tsv,.xls,text/csv,text/plain"
                  className="hidden"
                  onClick={e => e.stopPropagation()}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </div>

              {/* Paste area */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-600">Ya da metin yapıştır:</p>
                <textarea
                  value={text}
                  onChange={e => { setText(e.target.value); setFileName('') }}
                  placeholder={`Ahmet Yılmaz - ahmet@example.com - 0532 123 45 67\nMehmet Kaya, mehmet@site.com, +90 533 987 65 43\nvb. herhangi bir formatta...`}
                  rows={4}
                  className="w-full text-xs border border-[#2a2a2a] bg-[#0d0d0d] text-gray-300 rounded-xl px-3 py-2.5 font-mono placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={loading || !text.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI analiz ediyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI ile İçe Aktar
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeSegment, setActiveSegment] = useState<Segment | 'all'>('all')
  const [showImport, setShowImport] = useState(false)

  async function fetchCustomers() {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (activeSegment !== 'all') params.set('segment', activeSegment)
      const res = await fetch(`/api/customers?${params}`)
      const data = await res.json()
      setCustomers(Array.isArray(data) ? data : (data.customers ?? []))
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCustomers() }, [search, activeSegment])

  const segmentCounts = customers.reduce((acc, c) => {
    acc[c.segment as Segment] = (acc[c.segment as Segment] || 0) + 1
    return acc
  }, {} as Record<Segment, number>)

  return (
    <AppShell>
      <Header
        title="Müşteriler"
        subtitle="Müşteri segmentleri ve detayları"
        action={{ label: 'Kampanya Oluştur', href: '/campaigns/new' }}
      />

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => fetchCustomers()}
        />
      )}

      <div className="p-6 space-y-5 flex-1">
        {/* Segment cards */}
        <div className="grid grid-cols-5 gap-3">
          {(Object.keys(segmentConfig) as Segment[]).map(seg => {
            const config = segmentConfig[seg]
            const Icon = config.icon
            const count = segmentCounts[seg] || 0
            const isActive = activeSegment === seg
            return (
              <button
                key={seg}
                onClick={() => setActiveSegment(seg === activeSegment ? 'all' : seg)}
                className={cn(
                  'relative text-left bg-[#111] border rounded-2xl px-5 py-4 overflow-hidden hover:border-[#2a2a2a] transition-all',
                  isActive ? cn('border-2', config.border) : 'border-[#1e1e1e]'
                )}
              >
                <div className={cn('absolute top-0 left-0 right-0 h-px bg-gradient-to-r to-transparent', config.bar)} />
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center border mb-3', config.bg, config.border)}>
                  <Icon className={cn('w-4 h-4', config.color)} />
                </div>
                <p className="text-2xl font-bold text-white mb-0.5 tabular-nums">{count.toLocaleString('tr-TR')}</p>
                <p className={cn('text-xs font-semibold', config.color)}>{config.label}</p>
              </button>
            )
          })}
        </div>

        {/* AI insight */}
        <div className="bg-[#111] border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-blue-500/40 to-transparent" />
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">AI Segment Analizi</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Risk altındaki müşterilerinize özel %15 indirim kampanyası ile %28 geri kazanım bekleniyor.
              VIP müşterilerin AOV&apos;si genel ortalamanın üstünde — WhatsApp kampanyası öncelikli olmalı.
            </p>
          </div>
          <Link href="/campaigns/new" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0">
            <Sparkles className="w-3.5 h-3.5" /> Kampanya Oluştur
          </Link>
        </div>

        {/* Table */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#1e1e1e] flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="İsim veya email ara..."
                className="pl-8 pr-4 py-2 text-sm bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl w-full text-gray-300 placeholder:text-gray-700 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex items-center gap-1 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-1">
              <button
                onClick={() => setActiveSegment('all')}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', activeSegment === 'all' ? 'bg-[#1e1e1e] text-white' : 'text-gray-600 hover:text-gray-400')}
              >
                Tümü
              </button>
              {(Object.keys(segmentConfig) as Segment[]).map(seg => (
                <button
                  key={seg}
                  onClick={() => setActiveSegment(seg === activeSegment ? 'all' : seg)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', activeSegment === seg ? cn('bg-[#1e1e1e]', segmentConfig[seg].color) : 'text-gray-600 hover:text-gray-400')}
                >
                  {segmentConfig[seg].label}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-700">{customers.length} müşteri</span>
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#2a2a2a] text-gray-400 hover:text-gray-200 text-xs font-medium rounded-xl transition-all ml-auto"
            >
              <Upload className="w-3.5 h-3.5" /> Müşteri Verisi İçe Aktar
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-[#1a1a1a] border border-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-gray-700" />
              </div>
              <p className="text-sm font-medium text-gray-400">Müşteri bulunamadı</p>
              <p className="text-xs text-gray-700 mt-1">CSV ile içe aktarabilirsiniz</p>
              <button onClick={() => setShowImport(true)} className="mt-4 flex items-center gap-1.5 mx-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors">
                <Upload className="w-3.5 h-3.5" /> Müşteri Verisi İçe Aktar
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  {['Müşteri', 'Segment', 'Sipariş', 'Harcama', 'Son Sipariş', 'İşlem'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider first:px-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#111]">
                {customers.map(customer => {
                  const seg = segmentConfig[customer.segment as Segment] || segmentConfig.new
                  const Icon = seg.icon
                  const initials = customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                  return (
                    <tr key={customer.id} className="hover:bg-[#141414] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <div>
                            <Link href={`/customers/${customer.id}`} className="text-sm font-medium text-gray-200 hover:text-blue-400 transition-colors">
                              {customer.name}
                            </Link>
                            <p className="text-xs text-gray-600">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border', seg.bg, seg.color, seg.border)}>
                          <Icon className="w-3 h-3" />
                          {seg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">{customer.totalOrders} sipariş</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-white">{formatCurrency(customer.totalSpent)}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-600">{customer.lastOrder ? formatDate(customer.lastOrder) : '—'}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-blue-500/10 text-gray-700 hover:text-blue-400 transition-all" title="Email"><Mail className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 rounded-lg hover:bg-teal-500/10 text-gray-700 hover:text-teal-400 transition-all" title="WhatsApp"><MessageSquare className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  )
}
