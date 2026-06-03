'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import {
  RefreshCw, Globe, Users, Eye, ShoppingBag, TrendingUp,
  MapPin, Monitor, Smartphone, Tablet, ArrowUpRight, Zap,
  MessageSquare, Sparkles, Send, X,
} from 'lucide-react'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

/* ─── Demo data ─── */
const LIVE_VISITORS = [
  { time: 'Az önce',  flag: '🇹🇷', location: 'İstanbul, Türkiye',  browser: 'Chrome', os: 'MacOS',   path: '/collections/yaz-koleksiyonu', source: 'google / organic',   action: 'Ürün İnceliyor',  actionColor: '#99b4ff' },
  { time: '10 sn önce', flag: '🇩🇪', location: 'Berlin, Almanya',    browser: 'Safari', os: 'iOS',    path: '/products/oversize-tshirt',    source: 'instagram / story',  action: 'Sepete Ekledi',   actionColor: '#22c97a' },
  { time: '15 sn önce', flag: '🇬🇧', location: 'Londra, İngiltere',  browser: 'Chrome', os: 'Windows', path: '/collections/indirimli-urunler', source: 'google / cpc',    action: 'Ürün İnceliyor',  actionColor: '#99b4ff' },
  { time: '20 sn önce', flag: '🇫🇷', location: 'Paris, Fransa',      browser: 'Firefox', os: 'MacOS',  path: '/products/deri-canta',         source: 'facebook / ads',    action: 'Sepet Terk Etti', actionColor: '#e84545' },
  { time: '30 sn önce', flag: '🇳🇱', location: 'Amsterdam, Hollanda', browser: 'Chrome', os: 'Android', path: '/',                           source: 'direct / none',     action: 'Ana Sayfa',       actionColor: '#8080a0' },
  { time: '45 sn önce', flag: '🇦🇪', location: 'Dubai, BAE',          browser: 'Safari', os: 'iOS',    path: '/collections/yeni-gelenler',   source: 'tiktok / ads',      action: 'Ürün İnceliyor',  actionColor: '#99b4ff' },
]

const TOP_LOCATIONS = [
  { flag: '🇹🇷', name: 'İstanbul, Türkiye', count: 124, pct: 23.3, color: '#4470ff' },
  { flag: '🇬🇧', name: 'Londra, İngiltere', count: 89,  pct: 16.7, color: '#22c97a' },
  { flag: '🇩🇪', name: 'Berlin, Almanya',   count: 67,  pct: 12.6, color: '#9f7afa' },
  { flag: '🇫🇷', name: 'Paris, Fransa',     count: 43,  pct: 8.1,  color: '#f0a020' },
  { flag: '🇳🇱', name: 'Amsterdam, Hollanda', count: 34, pct: 6.4, color: '#fb923c' },
]

const DEVICE_DATA = [
  { name: 'Masaüstü', value: 52.4, count: 279, color: '#4470ff' },
  { name: 'Mobil',    value: 42.1, count: 224, color: '#22c97a' },
  { name: 'Tablet',   value: 5.5,  count: 29,  color: '#9f7afa' },
]

const AI_SUGGESTIONS = [
  { icon: Zap,          color: '#e84545', bg: 'rgba(232,69,69,0.08)', title: 'Yüksek Terk Oranı', text: 'Sepet terk oranı %68.7. WhatsApp ile terk eden kullanıcılara ulaş.', action: 'Aksiyon Al' },
  { icon: TrendingUp,   color: '#22c97a', bg: 'rgba(34,201,122,0.08)', title: 'Popüler Ürün', text: '"Oversize T-Shirt" ürünü son 1 saatte 38 kez incelendi.', action: 'Ürüne Bak' },
  { icon: MessageSquare, color: '#99b4ff', bg: 'rgba(153,180,255,0.08)', title: 'Yeni Fırsat', text: "Londra'dan gelen trafik %35 arttı. Özel kampanya oluştur.", action: 'Kampanya' },
]

export default function LivePage() {
  const [now, setNow] = useState(532)
  const [todayVisitors, setTodayVisitors] = useState(8421)
  const [pageViews, setPageViews] = useState(23542)
  const [aiOpen, setAiOpen] = useState(true)
  const [aiInput, setAiInput] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setNow(n => n + Math.floor(Math.random() * 3) - 1)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 800)
    setTodayVisitors(v => v + Math.floor(Math.random() * 10))
    setPageViews(v => v + Math.floor(Math.random() * 30))
  }

  const today = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <AppShell>
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 h-14 shrink-0"
        style={{ background: 'rgba(8,8,15,0.95)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-[16px] font-bold" style={{ color: '#eeeef4' }}>Canlı Takip</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(34,201,122,0.1)', border: '1px solid rgba(34,201,122,0.25)' }}>
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold" style={{ color: '#22c97a' }}>Canlı</span>
          </div>
          <p className="text-[12px]" style={{ color: '#44445a' }}>Ziyaretçilerinizi anlık olarak takip edin</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh}
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

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Main content ── */}
        <div className="flex-1 p-6 overflow-auto space-y-5">

          {/* ── KPI Row ── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[
              { label: 'Şu An Canlı',       value: formatNumber(now),          sub: '↑ %18.2', icon: Globe,       color: '#22c97a', bg: 'rgba(34,201,122,0.1)',   subPos: true },
              { label: 'Bugün Ziyaretçi',   value: formatNumber(todayVisitors), sub: '↑ %24.6', icon: Users,       color: '#4470ff', bg: 'rgba(68,112,255,0.1)',   subPos: true },
              { label: 'Sayfa Görüntüleme', value: formatNumber(pageViews),     sub: '↑ %31.7', icon: Eye,         color: '#9f7afa', bg: 'rgba(159,122,250,0.1)',  subPos: true },
              { label: 'Saatlik Zirve',      value: '17:00',                    sub: '↑ %15.3', icon: TrendingUp,  color: '#f0a020', bg: 'rgba(240,160,32,0.1)',   subPos: true },
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
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                    </div>
                  </div>
                  <p className="text-[24px] font-bold leading-none mb-2" style={{ color: '#eeeef4', letterSpacing: '-0.02em' }}>{kpi.value}</p>
                  <span className="text-[10px] font-semibold" style={{ color: '#22c97a' }}>{kpi.sub} önceki 30 güne göre</span>
                </div>
              )
            })}
          </div>

          {/* ── Map placeholder + Visitor Feed ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Map */}
            <div className="xl:col-span-2 rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', minHeight: 320 }}>
              <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>Canlı Ziyaretçi Haritası</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.04)', color: '#8080a0' }}>Tüm Ülkeler</span>
              </div>
              {/* Simple world map visualization */}
              <div className="relative h-64 flex items-center justify-center"
                style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(68,112,255,0.04) 0%, transparent 70%)' }}>
                <div className="absolute inset-0" style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect width='800' height='400' fill='transparent'/%3E%3C/svg%3E\")",
                  opacity: 0.1,
                }} />
                {/* City dots */}
                {[
                  { top: '35%', left: '52%', count: 156, size: 'lg' },
                  { top: '30%', left: '48%', count: 124, size: 'md' },
                  { top: '28%', left: '65%', count: 89,  size: 'sm' },
                  { top: '32%', left: '51%', count: 67,  size: 'sm' },
                  { top: '38%', left: '36%', count: 43,  size: 'xs' },
                  { top: '42%', left: '55%', count: 34,  size: 'xs' },
                ].map((dot, i) => (
                  <div key={i} className="absolute flex flex-col items-center gap-1" style={{ top: dot.top, left: dot.left }}>
                    <div className="rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{
                        width: dot.size === 'lg' ? 42 : dot.size === 'md' ? 34 : dot.size === 'sm' ? 26 : 20,
                        height: dot.size === 'lg' ? 42 : dot.size === 'md' ? 34 : dot.size === 'sm' ? 26 : 20,
                        background: `rgba(68,112,255,${dot.size === 'lg' ? 0.7 : dot.size === 'md' ? 0.55 : dot.size === 'sm' ? 0.45 : 0.35})`,
                        boxShadow: `0 0 ${dot.size === 'lg' ? 24 : 12}px rgba(68,112,255,0.5)`,
                        border: '1px solid rgba(68,112,255,0.5)',
                      }}>
                      {dot.count}
                    </div>
                  </div>
                ))}
                <div className="absolute bottom-4 left-5 flex items-center gap-4 text-[11px]" style={{ color: '#8080a0' }}>
                  {[['#4470ff', 'Yüksek'], ['#22c97a', 'Orta'], ['#22c97a33', 'Düşük']].map(([c, l]) => (
                    <span key={l} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: c }} />{l}
                    </span>
                  ))}
                </div>
              </div>

              {/* Visitor feed */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="px-5 py-3 flex items-center justify-between">
                  <p className="text-[12px] font-semibold" style={{ color: '#eeeef4' }}>Canlı Ziyaretçi Akışı</p>
                  <button className="text-[11px] font-semibold flex items-center gap-1" style={{ color: '#44445a' }}>
                    Tüm canlı aktiviteleri görüntüle <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="overflow-hidden">
                  {LIVE_VISITORS.map((v, i) => (
                    <div key={i} className="px-5 py-2.5 flex items-center gap-3 transition-all"
                      style={{ borderBottom: i < LIVE_VISITORS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span className="text-[10px] shrink-0 w-20" style={{ color: '#33334a' }}>{v.time}</span>
                      <span className="text-[13px] shrink-0">{v.flag}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] font-medium" style={{ color: '#8080a0' }}>{v.location}</span>
                        <span className="text-[10px] ml-2" style={{ color: '#33334a' }}>{v.browser} • {v.os}</span>
                      </div>
                      <span className="text-[11px] truncate max-w-[160px] shrink-0" style={{ color: '#33334a', fontFamily: 'monospace' }}>{v.path}</span>
                      <span className="text-[10px] shrink-0" style={{ color: '#33334a' }}>{v.source}</span>
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-lg shrink-0"
                        style={{ background: `${v.actionColor}15`, color: v.actionColor }}>
                        {v.action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column: locations + devices */}
            <div className="flex flex-col gap-4">
              {/* Top locations */}
              <div className="rounded-2xl overflow-hidden flex-1"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-[12px] font-semibold" style={{ color: '#eeeef4' }}>En Aktif Konumlar</p>
                  <button className="text-[11px]" style={{ color: '#44445a' }}>Tümü</button>
                </div>
                <div className="p-3 space-y-2">
                  {TOP_LOCATIONS.map((loc, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg transition-all"
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <span className="text-[11px] font-bold shrink-0 w-4" style={{ color: '#44445a' }}>{i + 1}</span>
                      <span className="text-[13px] shrink-0">{loc.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate" style={{ color: '#eeeef4' }}>{loc.name}</p>
                        <div className="mt-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-1 rounded-full" style={{ width: `${loc.pct * 3}%`, background: loc.color }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] font-bold" style={{ color: '#eeeef4' }}>{loc.count}</p>
                        <p className="text-[10px]" style={{ color: '#44445a' }}>%{loc.pct}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Donut */}
                <div className="px-4 py-3 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={TOP_LOCATIONS.map(l => ({ name: l.name, value: l.pct }))} cx="50%" cy="50%" innerRadius={36} outerRadius={52} dataKey="value" strokeWidth={0}>
                          {TOP_LOCATIONS.map((loc, i) => <Cell key={i} fill={loc.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => `%${v}`} contentStyle={{ background: '#141420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-[20px] font-bold" style={{ color: '#eeeef4' }}>{formatNumber(now)}</p>
                      <p className="text-[9px]" style={{ color: '#44445a' }}>canlı ziyaretçi</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Device distribution */}
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <p className="text-[12px] font-semibold" style={{ color: '#eeeef4' }}>Cihaz Dağılımı</p>
                  <button className="text-[11px]" style={{ color: '#44445a' }}>Tümü</button>
                </div>
                <div className="p-4 space-y-3">
                  {DEVICE_DATA.map((d, i) => {
                    const DevIcon = i === 0 ? Monitor : i === 1 ? Smartphone : Tablet
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <DevIcon className="w-3.5 h-3.5" style={{ color: d.color }} />
                            <span className="text-[12px]" style={{ color: '#eeeef4' }}>{d.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[12px] font-bold" style={{ color: '#eeeef4' }}>{d.count}</span>
                            <span className="text-[11px] ml-1.5" style={{ color: d.color }}>%{d.value}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${d.value}%`, background: d.color }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="px-4 pb-3 text-[11px]" style={{ color: '#44445a' }}>
                  ↑ Son 30 güne kıyasla %12.4 artış
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── AI Asistan panel ── */}
        {aiOpen && (
          <div className="w-[340px] shrink-0 flex flex-col border-l overflow-hidden"
            style={{ background: '#0d0d1a', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(159,122,250,0.15)', border: '1px solid rgba(159,122,250,0.25)' }}>
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>AI Asistan</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(68,112,255,0.15)', color: '#99b4ff' }}>BETA</span>
                </div>
              </div>
              <button onClick={() => setAiOpen(false)} className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.05]" style={{ color: '#44445a' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto space-y-3">
              <div className="p-3 rounded-xl text-[12px]" style={{ background: 'rgba(68,112,255,0.06)', border: '1px solid rgba(68,112,255,0.15)' }}>
                <p style={{ color: '#8080a0' }}>
                  Merhaba Admin! 👋 <br />Canlı verileri analiz ettim. İşte sana 3 aksiyon önerim:
                </p>
              </div>
              {AI_SUGGESTIONS.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={i} className="p-3.5 rounded-xl cursor-default transition-all"
                    style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                      </div>
                      <p className="text-[11px] font-bold" style={{ color: s.color }}>{s.title}</p>
                    </div>
                    <p className="text-[11.5px] leading-relaxed mb-2.5" style={{ color: '#8080a0' }}>{s.text}</p>
                    <button className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                      style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}30` }}>
                      {s.action}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Chat input */}
            <div className="p-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  placeholder="AI'a bir şey sor..."
                  className="flex-1 bg-transparent text-[12px] outline-none"
                  style={{ color: '#eeeef4' }}
                />
                <button className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: '#4470ff' }}>
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <p className="text-[10px] mt-2 text-center" style={{ color: '#33334a' }}>AI cevaplar her zaman %100 doğru olmayabilir.</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
