'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Users, Search, AlertTriangle, UserPlus, Clock,
  Mail, MessageSquare, Sparkles, Upload, X, CheckCircle, Loader2, AlertCircle,
  TrendingUp, ShoppingCart, Filter,
  ChevronRight, ChevronDown, MoreHorizontal, Download, Plus,
  Crown, Activity,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'

/* ─── Types ─── */
type Segment = 'vip' | 'loyal' | 'at_risk' | 'new' | 'inactive'

const segmentConfig: Record<Segment, { label: string; icon: React.ElementType; color: string; bg: string; badgeText: string; badgeBg: string }> = {
  vip:      { label: 'VIP',          icon: Crown,          color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  badgeText: '#f59e0b', badgeBg: 'rgba(245,158,11,0.12)' },
  loyal:    { label: 'Sadık',        icon: Users,          color: '#99b4ff', bg: 'rgba(153,180,255,0.12)', badgeText: '#99b4ff', badgeBg: 'rgba(153,180,255,0.12)' },
  at_risk:  { label: 'Riskli',       icon: AlertTriangle,  color: '#e84545', bg: 'rgba(232,69,69,0.12)',   badgeText: '#e84545', badgeBg: 'rgba(232,69,69,0.12)' },
  new:      { label: 'Yeni',         icon: UserPlus,       color: '#22c97a', bg: 'rgba(34,201,122,0.12)',  badgeText: '#22c97a', badgeBg: 'rgba(34,201,122,0.12)' },
  inactive: { label: 'Pasif',        icon: Clock,          color: '#8080a0', bg: 'rgba(128,128,160,0.12)', badgeText: '#8080a0', badgeBg: 'rgba(128,128,160,0.12)' },
}

interface Customer {
  id: string; name: string; email: string; phone?: string
  segment: string; totalOrders: number; totalSpent: number
  lastOrder?: string; score: number
}


function ImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (n: number) => void }) {
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setFileName(file.name); setError('')
    const reader = new FileReader()
    reader.onload = e => setText(e.target?.result as string ?? '')
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImport() {
    if (!text.trim()) { setError('Dosya içeriği boş'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/customers/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import hatası')
      setResult(data)
      if (data.imported > 0) onSuccess(data.imported)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Import başarısız')
    } finally { setLoading(false) }
  }

  return (
    <div className="ds-modal-overlay" onClick={onClose}>
      <div className="ds-modal" onClick={e => e.stopPropagation()}>
        <div className="ds-modal-header">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4" style={{ color: '#99b4ff' }} />
            <h3 className="text-sm font-semibold" style={{ color: '#eeeef4' }}>Müşteri İçe Aktar</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#8080a0' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="ds-modal-body space-y-4">
          {!result ? (
            <>
              <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
                style={{ borderColor: fileName ? 'rgba(68,112,255,0.4)' : 'rgba(255,255,255,0.08)', background: fileName ? 'rgba(68,112,255,0.04)' : 'transparent' }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}>
                <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: fileName ? '#4470ff' : '#3e3e54' }} />
                <p className="text-sm font-medium" style={{ color: '#eeeef4' }}>{fileName || 'CSV veya TXT dosyası yükle'}</p>
                <p className="text-xs mt-1" style={{ color: '#8080a0' }}>Tıklayın veya sürükleyip bırakın</p>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </div>
              <div>
                <p className="text-[11px] font-semibold mb-2" style={{ color: '#8080a0' }}>Ya da metni yapıştırın</p>
                <textarea value={text} onChange={e => setText(e.target.value)} className="ds-textarea"
                  placeholder="Ad, Email, Telefon (her satır bir müşteri)" rows={4} />
              </div>
              {error && <div className="ds-alert ds-alert-error"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
              <p className="text-base font-bold" style={{ color: '#eeeef4' }}>İçe Aktarım Tamamlandı</p>
              <p className="text-sm mt-1" style={{ color: '#8080a0' }}>
                <span className="font-bold text-emerald-400">{result.imported}</span> müşteri eklendi
                {result.skipped > 0 && <span>, <span className="text-amber-400">{result.skipped}</span> atlandı</span>}
              </p>
            </div>
          )}
        </div>
        <div className="ds-modal-footer">
          {!result ? (
            <>
              <button onClick={onClose} className="btn-secondary text-xs">İptal</button>
              <button onClick={handleImport} disabled={loading || !text.trim()} className="btn-primary text-xs">
                {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> İçe Aktarılıyor...</> : <><Upload className="w-3.5 h-3.5" /> İçe Aktar</>}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="btn-primary text-xs"><CheckCircle className="w-3.5 h-3.5" /> Tamam</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCustomers(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!openMenuId) return
    const close = () => setOpenMenuId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenuId])

  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0)
  const vipCount   = customers.filter(c => c.segment === 'vip').length
  const newCount   = customers.filter(c => c.segment === 'new').length
  const riskCount  = customers.filter(c => c.segment === 'at_risk').length
  const activeCount = customers.filter(c => c.segment !== 'inactive').length
  const avgOrder   = customers.length > 0 ? totalSpent / customers.reduce((s, c) => s + c.totalOrders, 0) || 0 : 0

  const TABS = [
    { key: 'all',      label: 'Tüm Müşteriler',    count: customers.length },
    { key: 'active',   label: 'Aktif Müşteriler',   count: activeCount },
    { key: 'new',      label: 'Yeni Müşteriler',    count: newCount },
    { key: 'vip',      label: 'VIP Müşteriler',     count: vipCount },
    { key: 'at_risk',  label: 'Riskli Müşteriler',  count: riskCount },
  ]

  const filtered = customers.filter(c => {
    if (activeTab === 'active'  && c.segment === 'inactive') return false
    if (activeTab === 'new'     && c.segment !== 'new')      return false
    if (activeTab === 'vip'     && c.segment !== 'vip')      return false
    if (activeTab === 'at_risk' && c.segment !== 'at_risk')  return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase()) && !(c.phone?.includes(search) ?? false)) return false
    return true
  })

  return (
    <AppShell>
      {showImport && <ImportModal onClose={() => setShowImport(false)} onSuccess={() => { setShowImport(false) }} />}

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 h-14 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,8,15,0.95)', backdropFilter: 'blur(24px)' }}>
        <div>
          <h1 className="text-[16px] font-bold" style={{ color: '#eeeef4' }}>Müşteriler</h1>
          <p className="text-[11px]" style={{ color: '#44445a' }}>Müşterilerinizi segmentlere ayırın, davranışlarını analiz edin ve ilişkilerinizi geliştirin.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Download className="w-3.5 h-3.5" /> Dışa Aktar
          </button>
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
            <UserPlus className="w-3.5 h-3.5" /> Müşteri Ekle
          </button>
          <Link href="/segments"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold"
            style={{ background: '#4470ff', color: '#fff' }}>
            <Plus className="w-3.5 h-3.5" /> Yeni Segment
          </Link>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── KPI cards ── */}
          <div className="px-5 py-4 grid grid-cols-2 xl:grid-cols-3 gap-3 shrink-0">
            {[
              { label: 'Toplam Müşteri',          value: formatNumber(customers.length), icon: Users,       color: '#99b4ff', bg: 'rgba(153,180,255,0.1)' },
              { label: 'Aktif Müşteri',            value: formatNumber(activeCount),      icon: Activity,    color: '#22c97a', bg: 'rgba(34,201,122,0.1)' },
              { label: 'Yeni Müşteri (30G)',        value: formatNumber(newCount),         icon: UserPlus,    color: '#4470ff', bg: 'rgba(68,112,255,0.1)' },
              { label: 'Ortalama Sipariş Değeri',  value: avgOrder > 0 ? formatCurrency(avgOrder) : '—', icon: ShoppingCart, color: '#f0a020', bg: 'rgba(240,160,32,0.1)' },
              { label: 'Toplam Harcama',           value: totalSpent > 0 ? formatCurrency(totalSpent) : '—', icon: TrendingUp, color: '#22c97a', bg: 'rgba(34,201,122,0.1)' },
              { label: 'VIP Müşteri',              value: formatNumber(vipCount),         icon: Crown,       color: '#9f7afa', bg: 'rgba(159,122,250,0.1)' },
            ].map(kpi => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="rounded-2xl p-4 relative overflow-hidden cursor-default transition-all"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}>
                  <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg,transparent,${kpi.color}44,transparent)` }} />
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#44445a' }}>{kpi.label}</p>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: kpi.bg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                    </div>
                  </div>
                  <p className="text-[22px] font-bold leading-none mb-2" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>{kpi.value}</p>
                </div>
              )
            })}
          </div>

          {/* ── Search + filters ── */}
          <div className="px-5 py-2.5 flex items-center gap-2.5 flex-wrap shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: '#44445a' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Müşteri ara (e-posta, isim, telefon...)"
                className="pl-8 pr-3 py-1.5 text-[12px] rounded-xl outline-none w-64"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }} />
            </div>
            {['Tümü', 'Ülke', 'Segment', 'Etiket', 'Kayıt Tarihi'].map(f => (
              <button key={f} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.03)', color: '#44445a', border: '1px solid rgba(255,255,255,0.06)' }}>
                {f} <ChevronDown className="w-3 h-3" />
              </button>
            ))}
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
              style={{ background: 'rgba(255,255,255,0.03)', color: '#44445a', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Filter className="w-3 h-3" /> Filtrele
            </button>
            <span className="ml-auto text-[10px] font-mono" style={{ color: '#33334a' }}>
              {filtered.length} / {customers.length} müşteri
            </span>
          </div>

          {/* ── Tabs ── */}
          <div className="px-5 flex items-center gap-0.5 shrink-0 overflow-x-auto no-scrollbar"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-3.5 py-2.5 text-[12px] font-semibold whitespace-nowrap transition-all border-b-2"
                style={activeTab === tab.key
                  ? { color: '#eeeef4', borderColor: '#4470ff' }
                  : { color: '#44445a', borderColor: 'transparent' }}>
                {tab.label}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={activeTab === tab.key
                    ? { background: 'rgba(68,112,255,0.15)', color: '#99b4ff' }
                    : { background: 'rgba(255,255,255,0.04)', color: '#44445a' }}>
                  {formatNumber(tab.count)}
                </span>
              </button>
            ))}
          </div>

          {/* ── Table ── */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-5 space-y-2">
                {[...Array(8)].map((_, i) => <div key={i} className="skeleton rounded-xl h-14" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <Users className="w-5 h-5" style={{ color: '#33334a' }} />
                </div>
                <p className="text-[13px] font-semibold" style={{ color: '#44445a' }}>Müşteri bulunamadı</p>
                <button onClick={() => setShowImport(true)} className="text-[12px] font-semibold" style={{ color: '#99b4ff' }}>
                  + Müşteri İçe Aktar
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.15)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['MÜŞTERİ', 'KAYIT TARİHİ', 'SON SİPARİŞ', 'TOPLAM HARCAMA', 'SİPARİŞ SAYISI', 'SEGMENT', 'DURUM', 'İŞLEMLER'].map(col => (
                      <th key={col} className="text-left px-4 py-2.5 text-[9px] font-semibold tracking-wider whitespace-nowrap"
                        style={{ color: '#3e3e54' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const seg = segmentConfig[c.segment as Segment] ?? segmentConfig.inactive
                    const SegIcon = seg.icon
                    const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    const isActive = c.segment !== 'inactive' && c.segment !== 'at_risk'
                    return (
                      <tr key={c.id} className="transition-all cursor-default"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                              style={{ background: `${seg.color}18`, border: `1px solid ${seg.color}30`, color: seg.color }}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-[12px] font-semibold" style={{ color: '#eeeef4' }}>{c.name}</p>
                              <p className="text-[10px]" style={{ color: '#44445a' }}>{c.email}</p>
                              {c.phone && <p className="text-[10px]" style={{ color: '#3e3e54' }}>{c.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: '#8080a0', fontFamily: 'monospace' }}>
                          {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: '#8080a0', fontFamily: 'monospace' }}>
                          {c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-[12px] font-bold" style={{ color: '#22c97a', fontFamily: 'monospace' }}>
                          {formatCurrency(c.totalSpent)}
                        </td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: '#8080a0', fontFamily: 'monospace' }}>{c.totalOrders}</td>
                        <td className="px-4 py-3">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                            style={{ background: seg.badgeBg, color: seg.badgeText }}>
                            <SegIcon className="w-2.5 h-2.5" />
                            {seg.label}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? '#22c97a' : '#e84545' }} />
                            <span className="text-[11px]" style={{ color: isActive ? '#22c97a' : '#e84545' }}>
                              {isActive ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <button onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === c.id ? null : c.id) }}
                              className="p-1.5 rounded-lg transition-all" style={{ color: '#44445a' }}
                              onMouseEnter={e2 => (e2.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                              onMouseLeave={e2 => (e2.currentTarget.style.background = 'transparent')}>
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                            {openMenuId === c.id && (
                              <div className="absolute right-0 top-7 z-30 w-40 rounded-xl shadow-2xl overflow-hidden"
                                style={{ background: '#141420', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {[
                                  { label: 'Profil Gör', icon: ChevronRight, href: `/customers/${c.id}` },
                                  { label: 'E-posta Gönder', icon: Mail, href: '/ai-studio?type=email' },
                                  { label: 'WhatsApp Gönder', icon: MessageSquare, href: '/ai-studio?type=whatsapp' },
                                ].map(action => {
                                  const ActionIcon = action.icon
                                  return (
                                    <Link key={action.label} href={action.href}
                                      className="flex items-center gap-2 px-3 py-2.5 text-[11px] transition-colors"
                                      style={{ color: '#eeeef4' }}
                                      onMouseEnter={e2 => (e2.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                      onMouseLeave={e2 => (e2.currentTarget.style.background = 'transparent')}>
                                      <ActionIcon className="w-3 h-3" /> {action.label}
                                    </Link>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-[11px]" style={{ color: '#33334a' }}>1 - {filtered.length} / {filtered.length} müşteri</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map(p => (
                    <button key={p} className="w-7 h-7 rounded-lg text-[11px] font-semibold transition-all"
                      style={p === 1 ? { background: '#4470ff', color: '#fff' } : { background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.07)' }}>
                      {p}
                    </button>
                  ))}
                  <span style={{ color: '#33334a' }}>...</span>
                  <button className="w-7 h-7 rounded-lg text-[11px] font-semibold"
                    style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.07)' }}>
                    10
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#44445a' }}>
                  <span>Sayfa başına</span>
                  <button className="flex items-center gap-1 px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    10 <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── AI Müşteri Asistanı panel ── */}
        <div className="w-[300px] shrink-0 flex flex-col border-l overflow-hidden"
          style={{ background: '#0d0d1a', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(159,122,250,0.15)', border: '1px solid rgba(159,122,250,0.25)' }}>
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>AI Müşteri Asistanı</p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(68,112,255,0.15)', color: '#99b4ff' }}>Beta</span>
              </div>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-auto space-y-3">
            {customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Sparkles className="w-6 h-6" style={{ color: '#33334a' }} />
                <p className="text-[12px] text-center" style={{ color: '#44445a' }}>
                  Yeterli veri birikince AI önerileri burada görünecek.
                </p>
              </div>
            ) : (
              <>
                {vipCount > 0 && (
                  <div className="p-3.5 rounded-xl cursor-default transition-all"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.18)' }}>
                        <Crown className="w-3 h-3" style={{ color: '#f59e0b' }} />
                      </div>
                      <p className="text-[11px] font-bold" style={{ color: '#f59e0b' }}>Yüksek Değerli Müşteriler</p>
                    </div>
                    <p className="text-[11px] leading-relaxed mb-2" style={{ color: '#8080a0' }}>
                      {vipCount} VIP müşteriniz var. Onlara özel kampanya oluşturun.
                    </p>
                    <Link href="/segments" className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit"
                      style={{ background: 'rgba(245,158,11,0.18)', color: '#f59e0b' }}>
                      VIP Segmenti Gör <ChevronRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                )}
                {riskCount > 0 && (
                  <div className="p-3.5 rounded-xl cursor-default transition-all"
                    style={{ background: 'rgba(232,69,69,0.08)', border: '1px solid rgba(232,69,69,0.2)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(232,69,69,0.18)' }}>
                        <AlertTriangle className="w-3 h-3" style={{ color: '#e84545' }} />
                      </div>
                      <p className="text-[11px] font-bold" style={{ color: '#e84545' }}>Riskli Müşteriler</p>
                    </div>
                    <p className="text-[11px] leading-relaxed mb-2" style={{ color: '#8080a0' }}>
                      {riskCount} müşteri 60+ gündür alışveriş yapmadı. Win-back kampanyası deneyin.
                    </p>
                    <Link href="/ai-studio" className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit"
                      style={{ background: 'rgba(232,69,69,0.18)', color: '#e84545' }}>
                      Winback Kampanyası <ChevronRight className="w-2.5 h-2.5" />
                    </Link>
                  </div>
                )}
                {vipCount === 0 && riskCount === 0 && (
                  <p className="text-[11px] text-center py-4" style={{ color: '#44445a' }}>
                    Yeterli veri birikince AI önerileri burada görünecek.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
