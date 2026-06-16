'use client'

import { useState, useEffect, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import { RefreshCw, Globe, Users, Eye, TrendingUp, Store, Smartphone, Monitor, ShoppingCart, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type VisitorSession = {
  id: string
  sessionId: string
  city: string | null
  country: string | null
  device: string | null
  browser: string | null
  currentPage: string | null
  status: string
  startedAt: string
  lastSeenAt: string
}

function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return '🌐'
  return code.toUpperCase().split('').map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('')
}

function deviceIcon(device: string | null) {
  if (device === 'mobile' || device === 'tablet') return <Smartphone className="w-3.5 h-3.5" />
  return <Monitor className="w-3.5 h-3.5" />
}

function pageLabel(page: string | null): { label: string; icon: React.ReactNode } {
  if (!page) return { label: 'Ana Sayfa', icon: <Globe className="w-3 h-3" /> }
  if (page.includes('/checkout')) return { label: 'Ödeme', icon: <CreditCard className="w-3 h-3" style={{ color: '#f0a020' }} /> }
  if (page.includes('/cart')) return { label: 'Sepet', icon: <ShoppingCart className="w-3 h-3" style={{ color: '#4470ff' }} /> }
  if (page.includes('/products/')) {
    const slug = page.split('/products/')[1]?.split('?')[0] ?? 'ürün'
    return { label: `/${slug}`, icon: <Eye className="w-3 h-3" style={{ color: '#9f7afa' }} /> }
  }
  const path = new URL(page, 'https://x.com').pathname
  return { label: path || '/', icon: <Globe className="w-3 h-3" /> }
}

function elapsed(from: string): string {
  const secs = Math.floor((Date.now() - new Date(from).getTime()) / 1000)
  if (secs < 60) return `${secs}sn`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}dk`
  return `${Math.floor(mins / 60)}sa`
}

function VisitorCard({ s }: { s: VisitorSession }) {
  const page = pageLabel(s.currentPage)
  const isLeft = s.status === 'left' || (Date.now() - new Date(s.lastSeenAt).getTime()) > 120_000
  if (isLeft) return null

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Durum göstergesi */}
      <div className="shrink-0 relative w-2 h-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
          style={{ background: s.status === 'idle' ? '#f0a020' : '#22c97a' }} />
        <span className="relative inline-flex rounded-full w-2 h-2"
          style={{ background: s.status === 'idle' ? '#f0a020' : '#22c97a' }} />
      </div>

      {/* Konum */}
      <div className="flex items-center gap-1.5 min-w-[100px]">
        <span className="text-[16px] leading-none">{countryFlag(s.country)}</span>
        <span className="text-[12px] font-medium truncate" style={{ color: '#eeeef4' }}>
          {s.city ?? s.country ?? 'Bilinmiyor'}
        </span>
      </div>

      {/* Cihaz + Tarayıcı */}
      <div className="flex items-center gap-1 text-[11px] shrink-0" style={{ color: '#8080a0' }}>
        {deviceIcon(s.device)}
        <span>{s.browser ?? '—'}</span>
      </div>

      {/* Sayfa */}
      <div className="flex items-center gap-1 text-[11px] min-w-0 flex-1" style={{ color: '#8080a0' }}>
        {page.icon}
        <span className="truncate">{page.label}</span>
      </div>

      {/* Süre */}
      <span className="text-[11px] shrink-0 tabular-nums" style={{ color: '#3e3e54' }}>
        {elapsed(s.startedAt)}
      </span>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl animate-pulse"
      style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <div className="h-3 w-24 rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-3 w-16 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="h-3 flex-1 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="h-3 w-8 rounded" style={{ background: 'rgba(255,255,255,0.03)' }} />
    </div>
  )
}

export default function LivePage() {
  const [storeConnected, setStoreConnected] = useState<boolean | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<VisitorSession[]>([])
  const [loading, setLoading] = useState(true)
  const [totalToday, setTotalToday] = useState(0)
  const [totalViews, setTotalViews] = useState(0)

  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  // İki dakikadan eski oturumları düşür
  const activeSessions = sessions.filter(
    s => s.status !== 'left' && (Date.now() - new Date(s.lastSeenAt).getTime()) < 120_000
  )

  const loadSessions = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/live/sessions?storeId=${sid}`)
      if (!res.ok) return
      const data = await res.json()
      setSessions(data.sessions ?? [])
      setTotalToday(data.totalToday ?? 0)
      setTotalViews(data.totalViews ?? 0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch('/api/integrations')
      .then(r => r.json())
      .then((d: { integrations?: Array<{ id: string; platform: string; status: string }> }) => {
        const active = (d.integrations ?? []).find(
          i => ['shopify', 'ikas', 'woocommerce'].includes(i.platform) && i.status === 'active'
        )
        setStoreConnected(!!active)
        if (active) setStoreId(active.id)
        else setLoading(false)
      })
      .catch(() => { setStoreConnected(false); setLoading(false) })
  }, [])

  // İlk veri yükle + Supabase Realtime subscribe
  useEffect(() => {
    if (!storeId) return
    loadSessions(storeId)

    const supabase = createClient()

    const channel = supabase
      .channel('visitor-sessions')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'VisitorSession',
          filter: `storeId=eq.${storeId}`,
        },
        (payload: { eventType: string; new: VisitorSession; old: { id?: string } }) => {
          if (payload.eventType === 'INSERT') {
            setSessions(prev => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setSessions(prev =>
              prev.map(s => s.id === payload.new.id ? payload.new : s)
            )
          } else if (payload.eventType === 'DELETE') {
            setSessions(prev => prev.filter(s => s.id !== payload.old?.id))
          }
        }
      )
      .subscribe()

    // Süre sayaçları için her 10sn'de re-render
    const ticker = setInterval(() => setSessions(s => [...s]), 10_000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(ticker)
    }
  }, [storeId, loadSessions])

  const handleRefresh = () => {
    if (storeId) { setLoading(true); loadSessions(storeId) }
  }

  return (
    <AppShell>
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 h-14 shrink-0"
        style={{ background: 'rgba(8,8,15,0.95)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-[16px] font-bold" style={{ color: '#eeeef4' }}>Canlı Takip</h1>
          {storeConnected && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(34,201,122,0.1)', border: '1px solid rgba(34,201,122,0.25)' }}>
              <span className="relative flex w-1.5 h-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-semibold" style={{ color: '#22c97a' }}>Canlı</span>
            </div>
          )}
          <p className="text-[12px] hidden sm:block" style={{ color: '#44445a' }}>Ziyaretçilerinizi anlık olarak takip edin</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Yenile
          </button>
          <span className="text-[11px] px-2.5 py-1.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#44445a' }}>
            📅 {today}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-auto">
        {storeConnected === null || (storeConnected && loading) ? (
          /* Loading */
          <div className="w-full max-w-4xl mx-auto space-y-5">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-2xl p-4 animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', height: 80 }} />
              ))}
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        ) : !storeConnected ? (
          /* Mağaza bağlı değil */
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center max-w-sm mx-auto pt-20">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(68,112,255,0.08)', border: '1px solid rgba(68,112,255,0.15)' }}>
              <Store className="w-9 h-9" style={{ color: '#4470ff' }} />
            </div>
            <div>
              <h2 className="text-[18px] font-bold mb-2" style={{ color: '#eeeef4' }}>Mağazanı bağla</h2>
              <p className="text-[13px] leading-relaxed" style={{ color: '#44445a' }}>
                Mağazanı bağla ve ziyaretçilerini gerçek zamanlı takip et
              </p>
            </div>
            <Link href="/settings?tab=integrations"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold"
              style={{ background: '#4470ff', color: '#fff' }}>
              Mağaza Bağla →
            </Link>
          </div>
        ) : (
          /* Canlı takip */
          <div className="w-full max-w-4xl mx-auto space-y-5">
            {/* KPI Row */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: 'Şu An Canlı',       value: activeSessions.length,  icon: Globe,      color: '#22c97a', bg: 'rgba(34,201,122,0.1)' },
                { label: 'Bugün Ziyaretçi',   value: totalToday,             icon: Users,      color: '#4470ff', bg: 'rgba(68,112,255,0.1)' },
                { label: 'Sayfa Görüntüleme', value: totalViews,             icon: Eye,        color: '#9f7afa', bg: 'rgba(159,122,250,0.1)' },
                { label: 'Dönüşüm',           value: totalToday > 0 ? `${((activeSessions.filter(s => s.currentPage?.includes('/checkout')).length / Math.max(totalToday, 1)) * 100).toFixed(1)}%` : '—', icon: TrendingUp, color: '#f0a020', bg: 'rgba(240,160,32,0.1)' },
              ].map(kpi => {
                const Icon = kpi.icon
                return (
                  <div key={kpi.label} className="rounded-2xl p-4 relative overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="absolute top-0 left-4 right-4 h-px"
                      style={{ background: `linear-gradient(90deg,transparent,${kpi.color}44,transparent)` }} />
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#44445a' }}>{kpi.label}</p>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                      </div>
                    </div>
                    <p className="text-[24px] font-bold leading-none" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>
                      {kpi.value}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Aktif ziyaretçi listesi */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: '#44445a' }}>
                  Aktif Ziyaretçiler
                </p>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(34,201,122,0.1)', color: '#22c97a', border: '1px solid rgba(34,201,122,0.2)' }}>
                  {activeSessions.length} canlı
                </span>
              </div>

              <div className="p-3 space-y-2">
                {activeSessions.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <Globe className="w-8 h-8" style={{ color: '#22225a' }} />
                    <p className="text-[13px] font-medium" style={{ color: '#eeeef4' }}>Şu an aktif ziyaretçi yok</p>
                    <p className="text-[12px]" style={{ color: '#44445a' }}>
                      Mağazanıza trafik geldikçe burada gerçek zamanlı görünecek.
                    </p>
                  </div>
                ) : (
                  activeSessions.map(s => <VisitorCard key={s.id} s={s} />)
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
