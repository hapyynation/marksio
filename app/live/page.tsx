'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { RefreshCw, Globe, Users, Eye, TrendingUp, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function LivePage() {
  const [storeConnected, setStoreConnected] = useState<boolean | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetch('/api/integrations')
      .then(r => r.json())
      .then((d: { integrations?: Array<{ platform: string; status: string }> }) => {
        const integrations = d.integrations ?? []
        const hasStore = integrations.some(
          i => ['shopify', 'ikas', 'woocommerce'].includes(i.platform) && i.status === 'active'
        )
        setStoreConnected(hasStore)
      })
      .catch(() => setStoreConnected(false))
  }, [])

  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

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
            onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 800) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            Ekranı Yenile
          </button>
          <span className="text-[11px] px-2.5 py-1.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#44445a' }}>
            📅 {today}
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {storeConnected === null ? (
          <div className="flex items-center gap-2" style={{ color: '#44445a' }}>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-[13px]">Yükleniyor...</span>
          </div>
        ) : !storeConnected ? (
          /* No store connected — empty state */
          <div className="flex flex-col items-center gap-6 text-center max-w-sm">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(68,112,255,0.08)', border: '1px solid rgba(68,112,255,0.15)' }}>
              <Store className="w-9 h-9" style={{ color: '#4470ff' }} />
            </div>
            <div>
              <h2 className="text-[18px] font-bold mb-2" style={{ color: '#eeeef4' }}>
                Mağazanı bağla
              </h2>
              <p className="text-[13px] leading-relaxed" style={{ color: '#44445a' }}>
                Mağazanı bağla ve ziyaretçilerini gerçek zamanlı takip et
              </p>
            </div>
            <Link href="/settings?tab=integrations"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold transition-all"
              style={{ background: '#4470ff', color: '#fff' }}>
              Mağaza Bağla →
            </Link>
          </div>
        ) : (
          /* Store connected but no real-time tracking data yet */
          <div className="w-full max-w-4xl space-y-5">
            {/* KPI Row with zeros */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { label: 'Şu An Canlı',       value: '0',  icon: Globe,      color: '#22c97a', bg: 'rgba(34,201,122,0.1)' },
                { label: 'Bugün Ziyaretçi',   value: '0',  icon: Users,      color: '#4470ff', bg: 'rgba(68,112,255,0.1)' },
                { label: 'Sayfa Görüntüleme', value: '0',  icon: Eye,        color: '#9f7afa', bg: 'rgba(159,122,250,0.1)' },
                { label: 'Dönüşüm',           value: '—',  icon: TrendingUp, color: '#f0a020', bg: 'rgba(240,160,32,0.1)' },
              ].map(kpi => {
                const Icon = kpi.icon
                return (
                  <div key={kpi.label} className="rounded-2xl p-4 relative overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg,transparent,${kpi.color}44,transparent)` }} />
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#44445a' }}>{kpi.label}</p>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                      </div>
                    </div>
                    <p className="text-[24px] font-bold leading-none" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>{kpi.value}</p>
                  </div>
                )
              })}
            </div>

            <div className="rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Globe className="w-10 h-10" style={{ color: '#33334a' }} />
              <div>
                <p className="text-[14px] font-semibold mb-1" style={{ color: '#eeeef4' }}>Henüz ziyaretçi verisi yok</p>
                <p className="text-[12px]" style={{ color: '#44445a' }}>
                  Mağazanıza trafik geldikçe burada gerçek zamanlı olarak görünecek.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
