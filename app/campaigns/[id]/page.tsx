'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Play, MoreHorizontal, Loader2, AlertCircle, Pencil,
  CheckCircle2, XCircle,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { cn } from '@/lib/utils'
import { AnalyticsPanel } from '@/components/campaigns/AnalyticsPanel'
import { SequencesPanel } from '@/components/campaigns/SequencesPanel'
import { SchedulePanel } from '@/components/campaigns/SchedulePanel'
import { LeadsPanel } from '@/components/campaigns/LeadsPanel'
import { OptionsPanel } from '@/components/campaigns/OptionsPanel'

/* ── Types ────────────────────────────────────────────────────────────────── */

export interface Campaign {
  id: string
  name: string
  type: string
  status: string
  segment: string
  subject?: string
  previewText?: string
  body?: string
  design?: string
  cta?: string
  ctaText?: string
  ctaUrl?: string
  brandColor?: string
  sent: number
  opened: number
  clicked: number
  converted: number
  revenue: number
  sentAt?: string
  scheduledAt?: string | null
  createdAt: string
}

export interface RevenueData {
  metrics: {
    totalRevenue: number
    conversions: number
    aov: number
    revenuePerRecipient: number
    conversionRate: number
    sent: number
    opened: number
    clicked: number
  }
  revenueChart: Array<{ date: string; revenue: number; conversions: number }>
  funnel: Array<{ stage: string; value: number; pct: number }>
  topProducts: Array<{ title: string; quantity: number; revenue: number }>
  topSegments: Array<{ segment: string; count: number; revenue: number }>
}

/* ── Constants ────────────────────────────────────────────────────────────── */

type Tab = 'analytics' | 'sequences' | 'schedule' | 'leads' | 'options'

const TABS: { id: Tab; label: string }[] = [
  { id: 'analytics', label: 'Analitik' },
  { id: 'sequences', label: 'Sequences' },
  { id: 'schedule',  label: 'Zamanlama' },
  { id: 'leads',     label: 'Leadler' },
  { id: 'options',   label: 'Ayarlar' },
]

const STATUS_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  draft:     { label: 'Taslak',       bg: '#F3F4F6', color: '#374151' },
  active:    { label: 'Aktif',        bg: '#DCFCE7', color: '#16A34A' },
  sending:   { label: 'Gönderiliyor', bg: '#DCFCE7', color: '#16A34A' },
  scheduled: { label: 'Planlandı',    bg: '#FEF3C7', color: '#D97706' },
  completed: { label: 'Tamamlandı',   bg: '#EFF6FF', color: '#2563EB' },
  failed:    { label: 'Başarısız',    bg: '#FEE2E2', color: '#DC2626' },
}

/* ── Toast ────────────────────────────────────────────────────────────────── */

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-[13px] font-semibold border',
        type === 'success'
          ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]'
          : 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]',
      )}
    >
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <XCircle className="w-4 h-4 shrink-0" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">✕</button>
    </div>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function CampaignDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()

  const [campaign, setCampaign]     = useState<Campaign | null>(null)
  const [rev, setRev]               = useState<RevenueData | null>(null)
  const [loading, setLoading]       = useState(true)
  const [revLoading, setRevLoading] = useState(true)
  const [activeTab, setActiveTab]   = useState<Tab>('analytics')

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }, [])

  // Inline name editing
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue]     = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  // Launch button state
  const [launching, setLaunching] = useState(false)

  // More menu
  const [showMenu, setShowMenu] = useState(false)

  // Read initial tab from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab') as Tab
    if (tab && TABS.some(t => t.id === tab)) setActiveTab(tab)
  }, [])

  useEffect(() => {
    if (!id) return
    fetch(`/api/campaigns/${id}`)
      .then(r => r.json())
      .then(d => {
        setCampaign(d)
        setNameValue(d.name)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetch(`/api/campaigns/${id}/revenue`)
      .then(r => r.json())
      .then(d => { setRev(d); setRevLoading(false) })
      .catch(() => setRevLoading(false))
  }, [id])

  const setTab = (tab: Tab) => {
    setActiveTab(tab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', tab)
    router.push(url.pathname + url.search, { scroll: false })
  }

  const saveName = async () => {
    if (!campaign || !nameValue.trim() || nameValue === campaign.name) {
      setEditingName(false)
      setNameValue(campaign?.name ?? '')
      return
    }
    await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameValue }),
    })
    setCampaign(prev => prev ? { ...prev, name: nameValue } : prev)
    setEditingName(false)
  }

  const updateCampaign = useCallback(async (fields: Partial<Campaign>) => {
    const res = await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    if (res.ok) {
      setCampaign(prev => prev ? { ...prev, ...fields } : prev)
    }
  }, [id])

  const handleLaunch = useCallback(async () => {
    if (!campaign) return
    setLaunching(true)
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'PLAN_LIMIT_REACHED') {
          router.push('/plans')
          return
        }
        showToast(data.error ?? 'Kampanya gönderilemedi', 'error')
        return
      }

      setCampaign(prev => prev ? { ...prev, status: 'active', sent: data.sent ?? 0 } : prev)
      showToast(
        data.sent > 0
          ? `✓ ${data.sent} e-posta başarıyla gönderildi!`
          : 'Kampanya başlatıldı',
        'success',
      )
    } catch {
      showToast('Bağlantı hatası — lütfen tekrar deneyin', 'error')
    } finally {
      setLaunching(false)
    }
  }, [campaign, id, router, showToast])

  const handleDelete = async () => {
    if (!confirm('Kampanyayı silmek istediğinize emin misiniz?')) return
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    router.push('/campaigns')
  }

  /* ── Loading ── */
  if (loading) return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="w-5 h-5 text-[#2563EB] animate-spin" />
      </div>
    </AppShell>
  )

  if (!campaign) return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-[#D1D5DB] mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-[#374151]">Kampanya bulunamadı</p>
          <Link href="/campaigns" className="text-[12px] text-[#2563EB] hover:underline mt-2 inline-block">
            ← Kampanyalara dön
          </Link>
        </div>
      </div>
    </AppShell>
  )

  const statusBadge = STATUS_BADGES[campaign.status] ?? STATUS_BADGES.draft
  const canLaunch   = campaign.status === 'draft' || campaign.status === 'scheduled'

  return (
    <AppShell>
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="flex-1 flex flex-col min-h-0 bg-[#F9FAFB]">

        {/* ── Top header ── */}
        <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 h-14 flex items-center gap-3 sticky top-0 z-20 shrink-0">
          <Link
            href="/campaigns"
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* Editable name */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {editingName ? (
              <input
                ref={nameRef}
                value={nameValue}
                onChange={e => setNameValue(e.target.value)}
                onBlur={saveName}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveName()
                  if (e.key === 'Escape') { setEditingName(false); setNameValue(campaign.name) }
                }}
                className="text-[15px] font-semibold text-[#111827] bg-transparent border-b-2 border-[#2563EB] outline-none px-0.5 min-w-0 flex-1"
                autoFocus
              />
            ) : (
              <button
                onClick={() => { setEditingName(true); setTimeout(() => nameRef.current?.select(), 30) }}
                className="flex items-center gap-1.5 group min-w-0"
              >
                <span className="text-[15px] font-semibold text-[#111827] truncate">{campaign.name}</span>
                <Pencil className="w-3 h-3 text-[#D1D5DB] group-hover:text-[#6B7280] shrink-0 transition-colors" />
              </button>
            )}

            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0"
              style={{ background: statusBadge.bg, color: statusBadge.color }}
            >
              {statusBadge.label}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLaunch}
              disabled={!canLaunch || launching}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: '#16A34A' }}
            >
              {launching
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Play className="w-3.5 h-3.5 fill-white" />}
              Kampanyayı Başlat
            </button>

            {/* ... menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(p => !p)}
                className="p-2 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[var(--border)] rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                    <button
                      onClick={() => { setShowMenu(false); handleDelete() }}
                      className="w-full px-4 py-2.5 text-left text-[13px] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                    >
                      Kampanyayı Sil
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 flex items-center sticky top-14 z-10 shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={cn(
                'px-4 py-3 text-[13px] font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#6B7280] hover:text-[#111827]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'analytics' && (
            <AnalyticsPanel campaign={campaign} rev={rev} revLoading={revLoading} />
          )}
          {activeTab === 'sequences' && (
            <SequencesPanel campaign={campaign} onUpdate={updateCampaign} />
          )}
          {activeTab === 'schedule' && (
            <SchedulePanel campaign={campaign} onUpdate={updateCampaign} onLaunch={handleLaunch} />
          )}
          {activeTab === 'leads' && (
            <LeadsPanel campaign={campaign} />
          )}
          {activeTab === 'options' && (
            <OptionsPanel campaign={campaign} onUpdate={updateCampaign} />
          )}
        </div>
      </div>
    </AppShell>
  )
}
