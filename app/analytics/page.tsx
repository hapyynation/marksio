'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, Mail, MessageSquare,
  Target, Sparkles, ShoppingBag,
  Send, Download, Loader2,
  Package, Percent as PercentIcon,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'

/* ─── Types ─── */
interface AnalyticsData {
  kpis: { totalRevenue: number; totalOrders: number; convRate: number; aov: number; emailRevenue: number; waRevenue: number }
  funnel: Array<{ label: string; value: number; pct: number; color: string }>
  attribution: Array<{ name: string; value: number; color: string }>
  segments: { vip: { count: number; avgSpent: number }; at_risk: { count: number }; new: { count: number } }
  channels: {
    email:    { sent: number; openRate: number; clickRate: number; convRate: number; revenue: number; roi: number }
    whatsapp: { sent: number; openRate: number; clickRate: number; convRate: number; revenue: number; roi: number }
  }
  revenueData: Array<{ month: string; email: number; whatsapp: number }>
  campaignROI: Array<{ name: string; revenue: number; type: string; sent: number; opened: number; clicked: number }>
  topProducts?: Array<{ name: string; revenue: number; orders: number; views: number; conv: number }>
  hasData: boolean
}

/* ─── Empty initial data (shown only while API loads) ─── */
const DEMO_DATA: AnalyticsData = {
  kpis: { totalRevenue: 0, totalOrders: 0, convRate: 0, aov: 0, emailRevenue: 0, waRevenue: 0 },
  funnel: [
    { label: 'Gönderilen',    value: 0, pct: 100, color: '#4470ff' },
    { label: 'Teslim Edilen', value: 0, pct: 0,   color: '#9f7afa' },
    { label: 'Açılan',        value: 0, pct: 0,   color: '#22c97a' },
    { label: 'Tıklanan',      value: 0, pct: 0,   color: '#f0a020' },
    { label: 'Satın Alınan',  value: 0, pct: 0,   color: '#fb923c' },
  ],
  attribution: [],
  segments: { vip: { count: 0, avgSpent: 0 }, at_risk: { count: 0 }, new: { count: 0 } },
  channels: {
    email:    { sent: 0, openRate: 0, clickRate: 0, convRate: 0, revenue: 0, roi: 0 },
    whatsapp: { sent: 0, openRate: 0, clickRate: 0, convRate: 0, revenue: 0, roi: 0 },
  },
  revenueData: [],
  campaignROI: [],
  hasData: false,
}


/* ─── Helpers ─── */
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2.5 shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)' }}>
      <p className="text-[10px] font-semibold mb-2" style={{ color: 'var(--text-3)', fontFamily: 'monospace' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-2)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />{p.name}
          </span>
          <span className="text-[11px] font-bold" style={{ color: 'var(--text-1)', fontFamily: 'monospace' }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

interface AiMessage { role: 'user' | 'ai'; text: string }

/* ─── Analytics AI Panel ─── */
function AnalyticsAiPanel({
  data, aiInput, setAiInput, aiMessages, aiLoading, onSend,
}: {
  data: AnalyticsData
  aiInput: string
  setAiInput: (v: string) => void
  aiMessages: AiMessage[]
  aiLoading: boolean
  onSend: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const insights: Array<{ icon: React.ElementType; color: string; title: string; text: string }> = []

  if (data.channels.email.openRate > 0) {
    insights.push({
      icon: Mail, color: '#99b4ff',
      title: 'E-posta Performansı',
      text: `E-posta açılma oranınız %${data.channels.email.openRate}. Tıklama oranı: %${data.channels.email.clickRate}.`,
    })
  }
  if (data.segments.vip.count > 0 && data.segments.vip.avgSpent > 0) {
    insights.push({
      icon: TrendingUp, color: '#22c97a',
      title: 'VIP Segment Fırsatı',
      text: `${data.segments.vip.count} VIP müşteriniz var. Ortalama harcama: ${formatCurrency(data.segments.vip.avgSpent)}.`,
    })
  }
  if (data.segments.at_risk.count > 0) {
    insights.push({
      icon: ShoppingBag, color: '#f0a020',
      title: 'Riskli Müşteriler',
      text: `${data.segments.at_risk.count} müşteri alışveriş yapmayı bıraktı. Win-back kampanyası oluşturun.`,
    })
  }
  if (data.kpis.convRate > 0) {
    insights.push({
      icon: Target, color: '#9f7afa',
      title: 'Dönüşüm Oranı',
      text: `Genel dönüşüm oranınız %${data.kpis.convRate}. Hedefleme iyileştirmesiyle artırılabilir.`,
    })
  }

  const atRiskCount = data.segments.at_risk.count
  const vipPotential = data.segments.vip.count > 0 && data.segments.vip.avgSpent > 0
    ? data.segments.vip.count * data.segments.vip.avgSpent * 0.1
    : 0

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [aiMessages, aiLoading])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !aiLoading && aiInput.trim()) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="p-4 flex-1 overflow-auto space-y-3" ref={scrollRef}>
      {aiMessages.length === 0 && (
        <>
          <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>Öne Çıkan İçgörüler</p>
          {insights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <Sparkles className="w-6 h-6" style={{ color: 'var(--text-3)' }} />
              <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>
                Yeterli veri birikince AI önerileri burada görünecek.
              </p>
            </div>
          ) : insights.map((ins, i) => {
            const Icon = ins.icon
            return (
              <div key={i} className="p-3.5 rounded-xl cursor-default transition-all"
                style={{ background: `${ins.color}08`, border: `1px solid ${ins.color}20` }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ins.color}18` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: ins.color }} />
                  </div>
                  <p className="text-[11px] font-bold" style={{ color: ins.color }}>{ins.title}</p>
                </div>
                <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{ins.text}</p>
              </div>
            )
          })}

          {(atRiskCount > 0 || vipPotential > 0) && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
              <p className="text-[11px] font-semibold mb-2.5" style={{ color: 'var(--text-3)' }}>Önerilen Aksiyonlar</p>
              <div className="space-y-2">
                {atRiskCount > 0 && (
                  <div className="flex items-start justify-between gap-2 p-3 rounded-xl cursor-default"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>Riskli segmentleri canlandırın</p>
                    <span className="text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded-lg whitespace-nowrap"
                      style={{ background: 'rgba(232,69,69,0.15)', color: '#e84545' }}>
                      {atRiskCount} kritik
                    </span>
                  </div>
                )}
                {vipPotential > 0 && (
                  <div className="flex items-start justify-between gap-2 p-3 rounded-xl cursor-default"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>VIP segmentine özel kampanya gönderin</p>
                    <span className="text-[10px] font-semibold shrink-0 px-2 py-0.5 rounded-lg whitespace-nowrap"
                      style={{ background: 'rgba(34,201,122,0.15)', color: '#22c97a' }}>
                      {formatCurrency(vipPotential)} potansiyel
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {aiMessages.length > 0 && (
        <div className="space-y-3 pb-2">
          {aiMessages.map((msg, i) => (
            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'ai' && (
                <div className="w-5 h-5 rounded-md shrink-0 mt-0.5 mr-2 flex items-center justify-center"
                  style={{ background: 'rgba(159,122,250,0.2)' }}>
                  <Sparkles className="w-2.5 h-2.5" style={{ color: '#9f7afa' }} />
                </div>
              )}
              <div className="max-w-[85%] px-3 py-2 rounded-xl text-[12px] leading-relaxed"
                style={msg.role === 'user'
                  ? { background: 'var(--primary)', color: '#fff' }
                  : { background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border)' }
                }>
                {msg.text}
              </div>
            </div>
          ))}
          {aiLoading && (
            <div className="flex justify-start">
              <div className="w-5 h-5 rounded-md shrink-0 mt-0.5 mr-2 flex items-center justify-center"
                style={{ background: 'rgba(159,122,250,0.2)' }}>
                <Sparkles className="w-2.5 h-2.5" style={{ color: '#9f7afa' }} />
              </div>
              <div className="px-3 py-2 rounded-xl flex items-center gap-1.5"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#9f7afa' }} />
                <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>Analiz ediliyor…</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pt-2 sticky bottom-0" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)' }}>
          <input
            value={aiInput}
            onChange={e => setAiInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Analitik sorularınızı sorun…"
            className="flex-1 bg-transparent text-[12px] outline-none"
            style={{ color: 'var(--text-1)' }}
          />
          <button
            onClick={onSend}
            disabled={aiLoading || !aiInput.trim()}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40"
            style={{ background: 'var(--primary)' }}>
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      </div>
    </div>
  )
}

type Period = '7d' | '30d' | '3m' | '12m'

const PERIODS: { key: Period; label: string }[] = [
  { key: '7d',  label: 'Son 7 gün'  },
  { key: '30d', label: 'Son 30 gün' },
  { key: '3m',  label: 'Son 3 ay'   },
  { key: '12m', label: 'Son 12 ay'  },
]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>(DEMO_DATA)
  const [loading, setLoading] = useState(true)
  const [channelFilter, setChannelFilter] = useState('all')
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [period, setPeriod] = useState<Period>('30d')

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
  const dateRangeLabel = `${thirtyDaysAgo.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`

  useEffect(() => {
    setLoading(true)
    fetch(`/api/analytics?period=${period}`)
      .then(r => r.json())
      .then(d => { if (d?.kpis) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period])

  async function handleAiSend() {
    const question = aiInput.trim()
    if (!question || aiLoading) return
    setAiInput('')
    setAiMessages(prev => [...prev, { role: 'user', text: question }])
    setAiLoading(true)
    try {
      const res = await fetch('/api/analytics/ai-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: {
            totalRevenue: data.kpis.totalRevenue,
            totalOrders: data.kpis.totalOrders,
            emailOpenRate: data.channels.email.openRate,
            clickRate: data.channels.email.clickRate,
            convRate: data.kpis.convRate,
            emailRevenue: data.kpis.emailRevenue,
            waRevenue: data.kpis.waRevenue,
          },
        }),
      })
      const d = await res.json() as { reply?: string; error?: string }
      setAiMessages(prev => [...prev, { role: 'ai', text: d.reply ?? d.error ?? 'Yanıt alınamadı.' }])
    } catch {
      setAiMessages(prev => [...prev, { role: 'ai', text: 'Bağlantı hatası. Lütfen tekrar deneyin.' }])
    } finally {
      setAiLoading(false)
    }
  }

  function handleExport() {
    const rows: string[][] = [
      ['Metrik', 'Değer'],
      ['Toplam Gelir', String(data.kpis.totalRevenue)],
      ['Toplam Sipariş', String(data.kpis.totalOrders)],
      ['E-posta Geliri', String(data.kpis.emailRevenue)],
      ['WhatsApp Geliri', String(data.kpis.waRevenue)],
      ['Ort. Sipariş Değeri', String(data.kpis.aov)],
      ['Dönüşüm Oranı (%)', String(data.kpis.convRate)],
      [],
      ['Kanal', 'Gönderilen', 'Açılma %', 'Tıklama %', 'Dönüşüm %', 'Gelir'],
      ['E-posta',
        String(data.channels.email.sent),
        String(data.channels.email.openRate),
        String(data.channels.email.clickRate),
        String(data.channels.email.convRate),
        String(data.channels.email.revenue),
      ],
      ['WhatsApp',
        String(data.channels.whatsapp.sent),
        String(data.channels.whatsapp.openRate),
        String(data.channels.whatsapp.clickRate),
        String(data.channels.whatsapp.convRate),
        String(data.channels.whatsapp.revenue),
      ],
    ]
    if (data.campaignROI.length > 0) {
      rows.push([], ['Kampanya', 'Gönderilen', 'Açılan', 'Tıklanan', 'Gelir'])
      data.campaignROI.forEach(c => rows.push([c.name, String(c.sent), String(c.opened), String(c.clicked), String(c.revenue)]))
    }
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `marksio-analitik-${period}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const kpis = [
    { label: 'Toplam Gelir',         value: data.kpis.totalRevenue > 0 ? formatCurrency(data.kpis.totalRevenue) : '—',     icon: TrendingUp,    color: '#22c97a', bg: 'rgba(34,201,122,0.1)' },
    { label: 'Toplam Sipariş',       value: data.kpis.totalOrders > 0 ? formatNumber(data.kpis.totalOrders) : '—',         icon: ShoppingBag,   color: '#4470ff', bg: 'rgba(68,112,255,0.1)' },
    { label: 'E-posta Geliri',       value: data.kpis.emailRevenue > 0 ? formatCurrency(data.kpis.emailRevenue) : '—',     icon: Mail,          color: '#99b4ff', bg: 'rgba(153,180,255,0.1)' },
    { label: 'WhatsApp Geliri',      value: data.kpis.waRevenue > 0 ? formatCurrency(data.kpis.waRevenue) : '—',           icon: MessageSquare, color: '#22c97a', bg: 'rgba(34,201,122,0.1)' },
    { label: 'Ort. Sipariş Değeri',  value: data.kpis.aov > 0 ? formatCurrency(data.kpis.aov) : '—',                      icon: Target,        color: '#f0a020', bg: 'rgba(240,160,32,0.1)' },
    { label: 'Dönüşüm Oranı',        value: data.kpis.convRate > 0 ? `%${data.kpis.convRate}` : '—',                      icon: PercentIcon,   color: '#9f7afa', bg: 'rgba(159,122,250,0.1)' },
  ]

  const CHANNEL_TABS = [
    { key: 'all',      label: 'Tümü'    },
    { key: 'email',    label: 'E-posta' },
    { key: 'whatsapp', label: 'WhatsApp'},
  ]

  return (
    <AppShell>
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 h-14 shrink-0 gap-2"
        style={{ background: 'var(--surface)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-[15px] md:text-[16px] font-bold" style={{ color: 'var(--text-1)' }}>Analitik</h1>
          <p className="text-[11px] hidden sm:block" style={{ color: 'var(--text-3)' }}>Pazarlama performansınızı analiz edin ve büyüme fırsatlarını keşfedin.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-0.5 p-0.5 rounded-xl"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap"
                style={period === p.key
                  ? { background: 'var(--primary-soft)', color: 'var(--primary)' }
                  : { color: 'var(--text-3)' }}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            <Download className="w-3.5 h-3.5" /> Raporu Dışa Aktar
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Main content ── */}
        <div className="flex-1 overflow-auto p-5 space-y-5">

          {/* ── Channel filter tabs ── */}
          <div className="flex items-center gap-1 flex-wrap">
            {CHANNEL_TABS.map(tab => (
              <button key={tab.key} onClick={() => setChannelFilter(tab.key)}
                className="px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                style={channelFilter === tab.key
                  ? { background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)' }
                  : { background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                {tab.label}
              </button>
            ))}
            <div className="ml-auto" />
          </div>

          {/* ── 6 KPI cards ── */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {kpis.map(kpi => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} className="rounded-2xl p-4 relative overflow-hidden cursor-default transition-all"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}>
                  <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg,transparent,${kpi.color}44,transparent)` }} />
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{kpi.label}</p>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: kpi.bg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                    </div>
                  </div>
                  <p className="text-[22px] font-bold leading-none" style={{ color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                    {loading ? <span className="inline-block h-6 w-24 rounded skeleton" /> : kpi.value}
                  </p>
                </div>
              )
            })}
          </div>

          {/* ── Revenue Trend + Channel Distribution ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Revenue Trend */}
            <div className="xl:col-span-2 rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                  <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>Gelir Trendi</h3>
                  <div className="flex items-center gap-4 mt-1">
                    {[{ color: '#99b4ff', label: 'Toplam Gelir' }, { color: '#22c97a', label: 'E-posta Geliri' }].map(l => (
                      <span key={l.label} className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-2)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: l.color }} /> {l.label}
                      </span>
                    ))}
                  </div>
                </div>
                <select className="text-[11px] px-2.5 py-1 rounded-xl outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-2)' }}>
                  <option>Tümü</option>
                  <option>E-posta</option>
                  <option>WhatsApp</option>
                </select>
              </div>
              <div className="px-3 py-4">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data.revenueData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="g-email" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#99b4ff" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#99b4ff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g-wa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c97a" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#22c97a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'monospace' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} tickFormatter={v => `₺${(v / 1000).toFixed(0)}k`} width={38} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="email" name="E-posta" stroke="#99b4ff" strokeWidth={1.5} fill="url(#g-email)" dot={false} activeDot={{ r: 3, fill: '#99b4ff', strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="whatsapp" name="WhatsApp" stroke="#22c97a" strokeWidth={1.5} fill="url(#g-wa)" dot={false} activeDot={{ r: 3, fill: '#22c97a', strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Channel distribution donut */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>Kanal Bazlı Gelir Dağılımı</h3>
                <button className="text-[11px] mt-0.5 font-semibold" style={{ color: 'var(--text-3)' }}>Tümünü Gör →</button>
              </div>
              <div className="p-4 relative">
                <div className="h-36 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.attribution} cx="50%" cy="50%" innerRadius={44} outerRadius={62} dataKey="value" strokeWidth={0}>
                        {data.attribution.map((_, i) => <Cell key={i} fill={data.attribution[i].color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-[16px] font-bold" style={{ color: 'var(--text-1)', fontFamily: 'monospace' }}>{formatCurrency(data.kpis.totalRevenue)}</p>
                      <p className="text-[9px]" style={{ color: 'var(--text-3)' }}>Toplam Gelir</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mt-2">
                  {data.attribution.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.color }} />
                        <span style={{ color: 'var(--text-2)' }}>{a.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: 'var(--text-1)', fontFamily: 'monospace' }}>{formatCurrency(a.value)}</span>
                        <span style={{ color: a.color, fontFamily: 'monospace' }}>%{((a.value / data.kpis.totalRevenue) * 100).toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Funnel + Campaign Performance ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Funnel */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>Funnel Analizi</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
                    style={{ background: 'rgba(153,180,255,0.1)', color: '#99b4ff', border: '1px solid rgba(153,180,255,0.15)' }}>E-posta</span>
                </div>
                <select className="text-[11px] px-2 py-1 rounded-xl outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-2)' }}>
                  <option>E-posta</option>
                  <option>WhatsApp</option>
                </select>
              </div>
              <div className="p-5 space-y-2">
                {data.funnel.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-28 shrink-0">
                      <p className="text-[12px] font-medium" style={{ color: 'var(--text-1)' }}>{step.label}</p>
                    </div>
                    <div className="flex-1">
                      <div className="h-5 rounded-md overflow-hidden relative" style={{ background: 'var(--surface-2)' }}>
                        <div className="h-5 rounded-md transition-all duration-700"
                          style={{ width: `${step.pct}%`, background: `${step.color}`, opacity: 0.75 }} />
                      </div>
                    </div>
                    <div className="w-24 shrink-0 text-right">
                      <span className="text-[11px] font-bold" style={{ color: 'var(--text-1)', fontFamily: 'monospace' }}>{formatNumber(step.value)}</span>
                      <span className="text-[10px] ml-1.5" style={{ color: step.color }}>%{step.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign Performance */}
            <div className="rounded-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>Kampanya Performansı</h3>
                <Link href="/campaigns" className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--text-3)' }}>
                  Tüm Kampanyaları Gör →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                      {['KAMPANYA', 'GÖNDERİLEN', 'AÇILMA ORANI', 'TIKLANMA', 'GELİR'].map(col => (
                        <th key={col} className="text-left px-4 py-2.5 text-[9px] font-semibold tracking-wider whitespace-nowrap"
                          style={{ color: '#3e3e54' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaignROI.map((camp, i) => {
                      const isEmail = camp.type === 'email'
                      const openRate = camp.sent > 0 ? (camp.opened / camp.sent * 100).toFixed(1) : null
                      const clickRate = camp.sent > 0 ? (camp.clicked / camp.sent * 100).toFixed(1) : null
                      return (
                        <tr key={i} className="transition-all cursor-default"
                          style={{ borderBottom: i < data.campaignROI.length - 1 ? '1px solid var(--border)' : 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                                style={{ background: isEmail ? 'rgba(153,180,255,0.1)' : 'rgba(34,201,122,0.1)' }}>
                                {isEmail ? <Mail className="w-3 h-3" style={{ color: '#99b4ff' }} /> : <MessageSquare className="w-3 h-3" style={{ color: '#22c97a' }} />}
                              </div>
                              <span className="text-[12px] font-medium truncate max-w-[130px]" style={{ color: 'var(--text-1)' }}>{camp.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--text-2)', fontFamily: 'monospace' }}>
                            {camp.sent > 0 ? formatNumber(camp.sent) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {openRate ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                                  <div className="h-1.5 rounded-full" style={{ width: `${Math.min(parseFloat(openRate), 100)}%`, background: '#99b4ff' }} />
                                </div>
                                <span className="text-[11px] shrink-0" style={{ color: '#99b4ff', fontFamily: 'monospace' }}>%{openRate}</span>
                              </div>
                            ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                          </td>
                          <td className="px-4 py-3 text-[11px]" style={{ color: '#9f7afa', fontFamily: 'monospace' }}>
                            {clickRate ? `%${clickRate}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-[12px] font-bold" style={{ color: '#22c97a', fontFamily: 'monospace' }}>
                            {camp.revenue > 0 ? formatCurrency(camp.revenue) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Top Products ── */}
          <div className="rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>Top 10 Ürün Performansı</h3>
              <button className="text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all"
                style={{ background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border-2)' }}>
                Gelire Göre ↓
              </button>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
                  {['#', 'ÜRÜN', 'GELİR', 'SİPARİŞ', 'GÖRÜNTÜLEME', 'DÖNÜŞÜM'].map(col => (
                    <th key={col} className="text-left px-4 py-2.5 text-[9px] font-semibold tracking-wider" style={{ color: '#3e3e54' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              {(data.topProducts?.length ?? 0) > 0 && (
                <tbody>
                  {(data.topProducts ?? []).map((p, i) => (
                    <tr key={i} className="transition-all cursor-default"
                      style={{ borderBottom: i < (data.topProducts?.length ?? 0) - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-4 py-3 text-[11px] font-bold" style={{ color: 'var(--text-3)' }}>{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.15)' }}>
                            <Package className="w-3.5 h-3.5" style={{ color: '#99b4ff' }} />
                          </div>
                          <span className="text-[12px] font-medium" style={{ color: 'var(--text-1)' }}>{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[12px] font-bold" style={{ color: '#22c97a', fontFamily: 'monospace' }}>{formatCurrency(p.revenue)}</td>
                      <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--text-2)', fontFamily: 'monospace' }}>{formatNumber(p.orders)}</td>
                      <td className="px-4 py-3 text-[11px]" style={{ color: 'var(--text-2)', fontFamily: 'monospace' }}>{formatNumber(p.views)}</td>
                      <td className="px-4 py-3 text-[11px] font-semibold" style={{ color: '#9f7afa' }}>%{p.conv}</td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
            </div>
            {(data.topProducts?.length ?? 0) === 0 && (
              <div className="py-8 text-center">
                <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>Sipariş verisi bulunmuyor</p>
              </div>
            )}
            {(data.topProducts?.length ?? 0) > 0 && (
              <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button className="text-[11px] font-semibold" style={{ color: 'var(--text-3)' }}>Tüm Ürünleri Gör →</button>
              </div>
            )}
          </div>

        </div>

        {/* ── AI Analiz Asistanı — desktop only ── */}
        <div className="hidden lg:flex w-[320px] shrink-0 flex-col border-l overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-4 py-3.5 shrink-0"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(159,122,250,0.15)', border: '1px solid rgba(159,122,250,0.25)' }}>
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-[13px] font-semibold" style={{ color: 'var(--text-1)' }}>AI Analiz Asistanı</p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>Beta</span>
              </div>
            </div>
          </div>

          <AnalyticsAiPanel
            data={data}
            aiInput={aiInput}
            setAiInput={setAiInput}
            aiMessages={aiMessages}
            aiLoading={aiLoading}
            onSend={handleAiSend}
          />
        </div>
      </div>
    </AppShell>
  )
}