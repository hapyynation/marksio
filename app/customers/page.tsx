'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Users, Search, AlertTriangle, UserPlus, Clock,
  Mail, MessageSquare, Upload, X, CheckCircle, Loader2, AlertCircle,
  TrendingUp, ShoppingCart, Filter,
  ChevronRight, ChevronDown, ChevronLeft, MoreHorizontal, Download, Plus,
  Crown, Activity, Tag, Trash2, Check,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'

/* ─── Types ─── */
type Segment = 'vip' | 'loyal' | 'at_risk' | 'new' | 'inactive'

const segmentConfig: Record<Segment, { label: string; icon: React.ElementType; color: string; bg: string; badgeText: string; badgeBg: string }> = {
  vip:      { label: 'VIP',    icon: Crown,         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  badgeText: '#f59e0b', badgeBg: 'rgba(245,158,11,0.12)' },
  loyal:    { label: 'Sadık',  icon: Users,         color: '#99b4ff', bg: 'rgba(153,180,255,0.12)', badgeText: '#99b4ff', badgeBg: 'rgba(153,180,255,0.12)' },
  at_risk:  { label: 'Riskli', icon: AlertTriangle, color: '#e84545', bg: 'rgba(232,69,69,0.12)',   badgeText: '#e84545', badgeBg: 'rgba(232,69,69,0.12)' },
  new:      { label: 'Yeni',   icon: UserPlus,      color: '#22c97a', bg: 'rgba(34,201,122,0.12)',  badgeText: '#22c97a', badgeBg: 'rgba(34,201,122,0.12)' },
  inactive: { label: 'Pasif',  icon: Clock,         color: 'var(--text-2)', bg: 'rgba(128,128,160,0.12)', badgeText: 'var(--text-3)', badgeBg: 'rgba(128,128,160,0.12)' },
}

const SEGMENT_OPTIONS = [
  { value: 'vip',      label: 'VIP' },
  { value: 'loyal',    label: 'Sadık' },
  { value: 'new',      label: 'Yeni' },
  { value: 'at_risk',  label: 'Riskli' },
  { value: 'inactive', label: 'Pasif' },
]

interface Customer {
  id: string; name: string; email: string; phone?: string
  segment: string; totalOrders: number; totalSpent: number
  lastOrder?: string; score: number; createdAt: string
}

interface Stats {
  total: number; active: number; new: number; vip: number; atRisk: number; totalSpentAll: number
}

/* ─── ImportModal ─── */
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
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Müşteri İçe Aktar</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-2)' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="ds-modal-body space-y-4">
          {!result ? (
            <>
              <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
                style={{ borderColor: fileName ? 'rgba(68,112,255,0.4)' : '#E5E7EB', background: fileName ? 'rgba(68,112,255,0.04)' : 'transparent' }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}>
                <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: fileName ? '#4470ff' : '#9CA3AF' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{fileName || 'CSV veya TXT dosyası yükle'}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>Tıklayın veya sürükleyip bırakın</p>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </div>
              <div>
                <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-2)' }}>Ya da metni yapıştırın</p>
                <textarea value={text} onChange={e => setText(e.target.value)} className="ds-textarea"
                  placeholder="Ad, Email, Telefon (her satır bir müşteri)" rows={4} />
              </div>
              {error && <div className="ds-alert ds-alert-error"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
              <p className="text-base font-bold" style={{ color: 'var(--text-1)' }}>İçe Aktarım Tamamlandı</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
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

/* ─── DeleteConfirmModal ─── */
function DeleteConfirmModal({ count, onConfirm, onClose }: { count: number; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid rgba(232,69,69,0.3)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(232,69,69,0.12)' }}>
            <Trash2 className="w-5 h-5" style={{ color: '#e84545' }} />
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: 'var(--text-1)' }}>{count} müşteri silinecek</p>
            <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>Bu işlem geri alınamaz.</p>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-[12px] font-semibold"
            style={{ background: '#F3F4F6', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            İptal
          </button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-xl text-[12px] font-bold"
            style={{ background: '#e84545', color: '#fff' }}>
            Sil
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ─── */
const PAGE_SIZE = 20

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<Stats | null>(null)
  const [exporting, setExporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [showBulkTag, setShowBulkTag] = useState(false)
  const [bulkTagInput, setBulkTagInput] = useState('')
  const [showBulkSegment, setShowBulkSegment] = useState(false)
  const [bulkSegmentValue, setBulkSegmentValue] = useState('new')

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1) }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Load customers
  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
    if (activeTab !== 'all') params.set('segment', activeTab === 'active' ? '' : activeTab)
    if (search) params.set('search', search)

    fetch(`/api/customers?${params}`)
      .then(r => r.json())
      .then((data: { customers?: Customer[]; total?: number; totalPages?: number; stats?: Stats }) => {
        if (data.customers) {
          setCustomers(data.customers)
          setTotal(data.total ?? 0)
          setTotalPages(data.totalPages ?? 1)
          if (data.stats) setStats(data.stats)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, activeTab, search])

  useEffect(() => {
    if (!openMenuId) return
    const close = () => setOpenMenuId(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [openMenuId])

  function handleTabChange(tab: string) {
    setActiveTab(tab)
    setPage(1)
    setSelectedIds(new Set())
  }

  async function handleExport(ids?: string[]) {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (ids?.length) params.set('ids', ids.join(','))
      else if (activeTab !== 'all' && activeTab !== 'active') params.set('segment', activeTab)
      const res = await fetch(`/api/customers/export?${params}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `musteriler-${Date.now()}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch { /* silent */ }
    setExporting(false)
  }

  async function handleBulkDelete() {
    setBulkProcessing(true)
    try {
      await fetch('/api/customers/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', customerIds: [...selectedIds] }),
      })
      setSelectedIds(new Set())
      setShowDeleteConfirm(false)
      setPage(1)
      // Trigger re-fetch
      setSearch(s => s)
    } catch { /* silent */ }
    setBulkProcessing(false)
  }

  async function handleBulkTag() {
    if (!bulkTagInput.trim()) return
    setBulkProcessing(true)
    try {
      await fetch('/api/customers/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tag', customerIds: [...selectedIds], payload: { tag: bulkTagInput.trim() } }),
      })
      setSelectedIds(new Set()); setShowBulkTag(false); setBulkTagInput('')
    } catch { /* silent */ }
    setBulkProcessing(false)
  }

  async function handleBulkSegment() {
    setBulkProcessing(true)
    try {
      await fetch('/api/customers/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'segment', customerIds: [...selectedIds], payload: { segment: bulkSegmentValue } }),
      })
      setSelectedIds(new Set()); setShowBulkSegment(false)
      setPage(1); setSearch(s => s)
    } catch { /* silent */ }
    setBulkProcessing(false)
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (customers.every(c => selectedIds.has(c.id))) {
      setSelectedIds(prev => { const next = new Set(prev); customers.forEach(c => next.delete(c.id)); return next })
    } else {
      setSelectedIds(prev => { const next = new Set(prev); customers.forEach(c => next.add(c.id)); return next })
    }
  }

  const allPageSelected = customers.length > 0 && customers.every(c => selectedIds.has(c.id))
  const somePageSelected = customers.some(c => selectedIds.has(c.id))

  // KPI values from global stats or loaded data
  const s = stats
  const kpiTotal    = s?.total      ?? total
  const kpiActive   = s?.active     ?? customers.filter(c => c.segment !== 'inactive').length
  const kpiNew      = s?.new        ?? customers.filter(c => c.segment === 'new').length
  const kpiVip      = s?.vip        ?? customers.filter(c => c.segment === 'vip').length
  const kpiAtRisk   = s?.atRisk     ?? customers.filter(c => c.segment === 'at_risk').length
  const kpiSpent    = s?.totalSpentAll ?? customers.reduce((acc, c) => acc + c.totalSpent, 0)
  const kpiAov      = kpiTotal > 0 ? kpiSpent / Math.max(1, customers.reduce((a, c) => a + c.totalOrders, 0)) : 0

  const TABS = [
    { key: 'all',     label: 'Tüm Müşteriler',   count: kpiTotal },
    { key: 'active',  label: 'Aktif Müşteriler',  count: kpiActive },
    { key: 'new',     label: 'Yeni Müşteriler',   count: kpiNew },
    { key: 'vip',     label: 'VIP Müşteriler',    count: kpiVip },
    { key: 'at_risk', label: 'Riskli Müşteriler', count: kpiAtRisk },
  ]

  // Pagination helpers
  function pageNumbers(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '…')[] = [1]
    if (page > 3) pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
    return pages
  }

  return (
    <AppShell>
      {showImport && <ImportModal onClose={() => setShowImport(false)} onSuccess={() => { setShowImport(false); setPage(1) }} />}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          count={selectedIds.size}
          onConfirm={handleBulkDelete}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 md:px-6 h-14 shrink-0 gap-2"
        style={{ borderBottom: '1px solid #E5E7EB', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)' }}>
        <div>
          <h1 className="text-[15px] md:text-[16px] font-bold" style={{ color: 'var(--text-1)' }}>Müşteriler</h1>
          <p className="text-[11px] hidden sm:block" style={{ color: 'var(--text-2)' }}>Müşterilerinizi segmentlere ayırın, davranışlarını analiz edin.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleExport()}
            disabled={exporting}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-50"
            style={{ background: '#F3F4F6', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Dışa Aktar
          </button>
          <button onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold min-h-[44px]"
            style={{ background: '#F3F4F6', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
            <UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">Müşteri Ekle</span>
          </button>
          <Link href="/segments"
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-[12px] font-bold min-h-[44px]"
            style={{ background: '#4470ff', color: '#fff' }}>
            <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Yeni Segment</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── KPI cards ── */}
          <div className="px-5 py-4 grid grid-cols-2 xl:grid-cols-3 gap-3 shrink-0">
            {[
              { label: 'Toplam Müşteri',         value: formatNumber(kpiTotal),                                          icon: Users,       color: '#99b4ff' },
              { label: 'Aktif Müşteri',           value: formatNumber(kpiActive),                                         icon: Activity,    color: '#22c97a' },
              { label: 'Yeni Müşteri (30G)',       value: formatNumber(kpiNew),                                            icon: UserPlus,    color: '#4470ff' },
              { label: 'Ort. Sipariş Değeri',     value: kpiAov > 0 ? formatCurrency(kpiAov) : '—',                       icon: ShoppingCart,color: '#f0a020' },
              { label: 'Toplam Harcama',          value: kpiSpent > 0 ? formatCurrency(kpiSpent) : '—',                   icon: TrendingUp,  color: '#22c97a' },
              { label: 'VIP Müşteri',             value: formatNumber(kpiVip),                                            icon: Crown,       color: '#9f7afa' },
            ].map(kpi => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="rounded-2xl p-4 relative overflow-hidden"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg,transparent,${kpi.color}44,transparent)` }} />
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>{kpi.label}</p>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${kpi.color}18` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                    </div>
                  </div>
                  <p className="text-[22px] font-bold leading-none mb-2" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{kpi.value}</p>
                </div>
              )
            })}
          </div>

          {/* ── Bulk toolbar ── */}
          {selectedIds.size > 0 && (
            <div className="mx-5 mb-2 px-4 py-2.5 rounded-xl flex items-center gap-2 flex-wrap shrink-0"
              style={{ background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.25)' }}>
              <span className="text-[12px] font-semibold mr-1" style={{ color: '#99b4ff' }}>
                {selectedIds.size} seçildi
              </span>

              {/* Tag */}
              {showBulkTag ? (
                <div className="flex items-center gap-1.5">
                  <input
                    value={bulkTagInput}
                    onChange={e => setBulkTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleBulkTag()}
                    placeholder="Etiket adı"
                    className="px-2.5 py-1 rounded-lg text-[11px] outline-none"
                    style={{ background: '#F3F4F6', border: '1px solid #D1D5DB', color: 'var(--text-1)', width: 120 }}
                    autoFocus
                  />
                  <button onClick={handleBulkTag} disabled={bulkProcessing} className="p-1 rounded-lg" style={{ color: '#22c97a' }}>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setShowBulkTag(false); setBulkTagInput('') }} className="p-1 rounded-lg" style={{ color: 'var(--text-2)' }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => { setShowBulkTag(true); setShowBulkSegment(false) }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                  style={{ background: '#F3F4F6', color: 'var(--text-1)' }}>
                  <Tag className="w-3 h-3" /> Etiket Ekle
                </button>
              )}

              {/* Segment */}
              {showBulkSegment ? (
                <div className="flex items-center gap-1.5">
                  <select value={bulkSegmentValue} onChange={e => setBulkSegmentValue(e.target.value)}
                    className="px-2 py-1 rounded-lg text-[11px] outline-none"
                    style={{ background: '#F3F4F6', border: '1px solid #D1D5DB', color: 'var(--text-1)' }}>
                    {SEGMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <button onClick={handleBulkSegment} disabled={bulkProcessing} className="p-1 rounded-lg" style={{ color: '#22c97a' }}>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setShowBulkSegment(false)} className="p-1 rounded-lg" style={{ color: 'var(--text-2)' }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => { setShowBulkSegment(true); setShowBulkTag(false) }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                  style={{ background: '#F3F4F6', color: 'var(--text-1)' }}>
                  <Users className="w-3 h-3" /> Segmente Taşı
                </button>
              )}

              <button
                onClick={() => handleExport([...selectedIds])}
                disabled={exporting}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                style={{ background: '#F3F4F6', color: 'var(--text-1)' }}>
                <Download className="w-3 h-3" /> Dışa Aktar
              </button>

              <button onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ml-auto"
                style={{ background: 'rgba(232,69,69,0.12)', color: '#e84545' }}>
                <Trash2 className="w-3 h-3" /> Sil
              </button>

              <button onClick={() => { setSelectedIds(new Set()); setShowBulkTag(false); setShowBulkSegment(false) }}
                className="p-1 rounded-lg" style={{ color: 'var(--text-2)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Search + filters ── */}
          <div className="px-5 py-2.5 flex items-center gap-2.5 flex-wrap shrink-0"
            style={{ borderBottom: '1px solid #E5E7EB', borderTop: '1px solid #E5E7EB' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: 'var(--text-2)' }} />
              <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Müşteri ara (e-posta, isim, telefon...)"
                className="pl-8 pr-3 py-1.5 text-[12px] rounded-xl outline-none w-64"
                style={{ background: '#F3F4F6', border: '1px solid var(--border)', color: 'var(--text-1)' }} />
            </div>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
              style={{ background: 'var(--bg)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
              <Filter className="w-3 h-3" /> Filtrele
            </button>
            <span className="ml-auto text-[10px] font-mono" style={{ color: '#33334a' }}>
              {total} müşteri
            </span>
          </div>

          {/* ── Tabs ── */}
          <div className="px-5 flex items-center gap-0.5 shrink-0 overflow-x-auto no-scrollbar"
            style={{ borderBottom: '1px solid #E5E7EB' }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                className="flex items-center gap-2 px-3.5 py-2.5 text-[12px] font-semibold whitespace-nowrap transition-all border-b-2"
                style={activeTab === tab.key
                  ? { color: 'var(--text-1)', borderColor: '#4470ff' }
                  : { color: 'var(--text-2)', borderColor: 'transparent' }}>
                {tab.label}
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={activeTab === tab.key
                    ? { background: 'rgba(68,112,255,0.15)', color: '#99b4ff' }
                    : { background: '#F3F4F6', color: 'var(--text-2)' }}>
                  {formatNumber(tab.count)}
                </span>
              </button>
            ))}
          </div>

          {/* ── Mobile card list ── */}
          <div className="md:hidden flex-1 overflow-auto">
            <div className="p-4 space-y-2">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full" style={{ background: '#F3F4F6' }} />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 rounded-md w-1/2" style={{ background: '#F3F4F6' }} />
                        <div className="h-2.5 rounded-md w-3/4" style={{ background: '#F3F4F6' }} />
                      </div>
                    </div>
                  </div>
                ))
              ) : customers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Users className="w-8 h-8" style={{ color: '#33334a' }} />
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Müşteri bulunamadı</p>
                  <button onClick={() => setShowImport(true)} className="text-[12px] font-semibold" style={{ color: '#99b4ff' }}>+ Müşteri İçe Aktar</button>
                </div>
              ) : customers.map(c => {
                const seg = segmentConfig[c.segment as Segment] ?? segmentConfig.inactive
                const SegIcon = seg.icon
                const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                const isActive = c.segment !== 'inactive' && c.segment !== 'at_risk'
                return (
                  <Link key={c.id} href={`/customers/${c.id}`}
                    className="flex items-center gap-3 rounded-2xl p-4 transition-all active:scale-[0.98] block"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                      style={{ background: `${seg.color}18`, border: `1px solid ${seg.color}30`, color: seg.color }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>{c.name}</p>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                          style={{ background: seg.badgeBg, color: seg.badgeText }}>
                          <SegIcon className="w-2.5 h-2.5" />{seg.label}
                        </div>
                      </div>
                      <p className="text-[11px] truncate" style={{ color: 'var(--text-2)' }}>{c.email}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[11px] font-bold" style={{ color: '#22c97a' }}>{formatCurrency(c.totalSpent)}</span>
                        <span className="text-[11px]" style={{ color: 'var(--text-2)' }}>{c.totalOrders} sipariş</span>
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: isActive ? '#22c97a' : '#e84545' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? '#22c97a' : '#e84545' }} />
                          {isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
              <div className="h-4" />
            </div>
          </div>

          {/* ── Desktop table ── */}
          <div className="hidden md:flex flex-1 overflow-auto flex-col">
            {loading ? (
              <div className="p-5 space-y-2">
                {[...Array(8)].map((_, i) => <div key={i} className="skeleton rounded-xl h-14" />)}
              </div>
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Users className="w-8 h-8" style={{ color: '#33334a' }} />
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text-2)' }}>Müşteri bulunamadı</p>
                <button onClick={() => setShowImport(true)} className="text-[12px] font-semibold" style={{ color: '#99b4ff' }}>+ Müşteri İçe Aktar</button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--bg)', borderBottom: '1px solid #E5E7EB' }}>
                    <th className="px-4 py-2.5 w-8">
                      <input type="checkbox"
                        checked={allPageSelected}
                        ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected }}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 rounded cursor-pointer"
                        style={{ accentColor: '#4470ff' }}
                      />
                    </th>
                    {['MÜŞTERİ', 'KAYIT TARİHİ', 'SON SİPARİŞ', 'TOPLAM HARCAMA', 'SİPARİŞ SAYISI', 'SEGMENT', 'DURUM', 'İŞLEMLER'].map(col => (
                      <th key={col} className="text-left px-4 py-2.5 text-[9px] font-semibold tracking-wider whitespace-nowrap"
                        style={{ color: 'var(--text-3)' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => {
                    const seg = segmentConfig[c.segment as Segment] ?? segmentConfig.inactive
                    const SegIcon = seg.icon
                    const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    const isActive = c.segment !== 'inactive' && c.segment !== 'at_risk'
                    const isSelected = selectedIds.has(c.id)
                    return (
                      <tr key={c.id}
                        className="transition-all cursor-default"
                        style={{ borderBottom: '1px solid #F3F4F6', background: isSelected ? 'rgba(68,112,255,0.05)' : 'transparent' }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB' }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(c.id)}
                            className="w-3.5 h-3.5 rounded cursor-pointer"
                            style={{ accentColor: '#4470ff' }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                              style={{ background: `${seg.color}18`, border: `1px solid ${seg.color}30`, color: seg.color }}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-[12px] font-semibold" style={{ color: 'var(--text-1)' }}>{c.name}</p>
                              <p className="text-[10px]" style={{ color: 'var(--text-2)' }}>{c.email}</p>
                              {c.phone && <p className="text-[10px]" style={{ color: 'var(--text-3)' }}>{c.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--text-2)', fontFamily: 'monospace' }}>
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--text-2)', fontFamily: 'monospace' }}>
                          {c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-[12px] font-bold" style={{ color: '#22c97a', fontFamily: 'monospace' }}>
                          {formatCurrency(c.totalSpent)}
                        </td>
                        <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--text-2)', fontFamily: 'monospace' }}>{c.totalOrders}</td>
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
                              className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-2)' }}
                              onMouseEnter={e2 => (e2.currentTarget.style.background = '#F3F4F6')}
                              onMouseLeave={e2 => (e2.currentTarget.style.background = 'transparent')}>
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                            {openMenuId === c.id && (
                              <div className="absolute right-0 top-7 z-30 w-40 rounded-xl shadow-2xl overflow-hidden"
                                style={{ background: 'var(--surface)', border: '1px solid #D1D5DB' }}>
                                {[
                                  { label: 'Profil Gör', icon: ChevronRight, href: `/customers/${c.id}` },
                                  { label: 'E-posta Gönder', icon: Mail, href: '/ai-studio?type=email' },
                                  { label: 'WhatsApp Gönder', icon: MessageSquare, href: '/ai-studio?type=whatsapp' },
                                ].map(action => {
                                  const ActionIcon = action.icon
                                  return (
                                    <Link key={action.label} href={action.href}
                                      className="flex items-center gap-2 px-3 py-2.5 text-[11px] transition-colors"
                                      style={{ color: 'var(--text-1)' }}
                                      onMouseEnter={e2 => (e2.currentTarget.style.background = '#F3F4F6')}
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 shrink-0"
                style={{ borderTop: '1px solid #E5E7EB' }}>
                <span className="text-[11px]" style={{ color: '#33334a' }}>
                  {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} / {total} müşteri
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: '#F3F4F6', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  {pageNumbers().map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="w-7 text-center text-[11px]" style={{ color: 'var(--text-2)' }}>…</span>
                    ) : (
                      <button key={p} onClick={() => setPage(p as number)}
                        className="w-7 h-7 rounded-lg text-[11px] font-semibold transition-all"
                        style={p === page
                          ? { background: '#4470ff', color: '#fff' }
                          : { background: '#F3F4F6', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                    style={{ background: '#F3F4F6', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[11px]" style={{ color: '#33334a' }}>Sayfa {page}/{totalPages}</span>
              </div>
            )}
            {totalPages <= 1 && customers.length > 0 && (
              <div className="px-5 py-2.5 shrink-0" style={{ borderTop: '1px solid #E5E7EB' }}>
                <span className="text-[11px]" style={{ color: '#33334a' }}>{total} müşteri</span>
              </div>
            )}
          </div>
      </div>
    </AppShell>
  )
}
