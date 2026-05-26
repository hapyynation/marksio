'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import {
  Mail, MessageSquare, ArrowUpRight, ArrowDownRight, TrendingUp, BarChart3,
  Target, Sparkles, Activity, Users,
  ShoppingBag, Eye, MousePointer, Crown, Flame, AlertTriangle,
  CheckCircle, Lightbulb, Loader2, Plus,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { formatCurrency, cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  kpis: { totalRevenue: number; totalSent: number; convRate: number; aov: number }
  funnel: Array<{ label: string; value: number; pct: number; color: string }>
  attribution: Array<{ name: string; value: number; color: string }>
  segments: {
    vip:      { count: number; avgSpent: number; avgOrders: number }
    new:      { count: number; avgSpent: number }
    at_risk:  { count: number; avgSpent: number }
    loyal:    { count: number }
    inactive: { count: number }
  }
  channels: {
    email:    { sent: number; openRate: number; clickRate: number; convRate: number; revenue: number; roi: number }
    whatsapp: { sent: number; openRate: number; clickRate: number; convRate: number; revenue: number; roi: number }
  }
  revenueData: Array<{ month: string; email: number; whatsapp: number }>
  campaignROI: Array<{ name: string; revenue: number; type: string }>
  kpiTable: Array<{ metric: string; current: string; prev: string; change: string; pos: boolean }>
  convRate: number
  hasData: boolean
}

// ── AI insights generator (veri bazlı) ───────────────────────────────────────

function generateInsights(d: AnalyticsData) {
  const insights: Array<{ icon: React.ElementType; color: string; text: string }> = []
  const { kpis, channels, segments } = d

  if (channels.email.openRate > 30)
    insights.push({ icon: CheckCircle, color: 'text-emerald-400', text: `Email açılma oranınız %${channels.email.openRate} ile sektör ortalaması (%21) üzerinde. Mükemmel performans!` })
  else if (channels.email.sent > 0)
    insights.push({ icon: Lightbulb, color: 'text-amber-400', text: `Email açılma oranınız %${channels.email.openRate}. Konu satırını A/B test ederek %25+ hedefleyin.` })

  if (channels.whatsapp.revenue > channels.email.revenue && channels.whatsapp.sent > 0)
    insights.push({ icon: CheckCircle, color: 'text-teal-400', text: `WhatsApp kanalı email'den daha yüksek gelir üretiyor. WhatsApp otomasyon akışlarını genişletin.` })
  else if (channels.whatsapp.sent === 0)
    insights.push({ icon: Lightbulb, color: 'text-teal-400', text: 'WhatsApp kampanyaları henüz gönderilmedi. WhatsApp ile %87 okunma oranına ulaşabilirsiniz.' })

  if (segments.vip.count > 0)
    insights.push({ icon: Crown, color: 'text-[#b4c5ff]', text: `${segments.vip.count} VIP müşteriniz var. Ort. harcama ₺${segments.vip.avgSpent.toLocaleString('tr-TR')} — özel sadakat kampanyası oluşturun.` })

  if (segments.at_risk.count > segments.loyal.count)
    insights.push({ icon: AlertTriangle, color: 'text-orange-400', text: `${segments.at_risk.count} müşteri risk altında. Sadık (${segments.loyal.count}) sayısını geçti — win-back akışı başlatın.` })
  else if (segments.at_risk.count > 0)
    insights.push({ icon: AlertTriangle, color: 'text-orange-400', text: `${segments.at_risk.count} müşteri 60+ gündür inaktif. Kişiselleştirilmiş bir geri kazanım kampanyası gönderin.` })

  if (kpis.aov > 0)
    insights.push({ icon: Target, color: 'text-violet-400', text: `Ortalama sipariş değeriniz ₺${kpis.aov.toLocaleString('tr-TR')}. Bundle kampanyalarıyla %15-20 artış hedeflenebilir.` })

  if (insights.length === 0)
    insights.push(
      { icon: Lightbulb, color: 'text-[#b4c5ff]',  text: 'İlk kampanyanızı gönderin — açılma oranı, tıklama ve gelir verisi burada görünecek.' },
      { icon: Target,    color: 'text-amber-400',   text: 'Müşteri içe aktarın ve segmentlere ayırın. AI otomatik VIP, Sadık ve Risk grubunu oluşturur.' },
      { icon: CheckCircle, color: 'text-teal-400',  text: 'Mağazanızı Shopify veya İkas ile bağlayın — gerçek sipariş verisi analitiği güçlendirir.' },
    )

  return insights.slice(0, 4)
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1d1f28] border border-[#272a33] rounded-lg p-3 text-xs shadow-2xl">
      <p className="font-bold text-[#8b95a8] mb-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: p.color }}>{p.name}</span>
          </div>
          <span className="font-bold text-[#e2e8f8]">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyAnalytics() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#191b24] border border-[#272a33] flex items-center justify-center">
        <BarChart3 className="w-8 h-8 text-[#8b95a8]/40" />
      </div>
      <div>
        <p className="text-[#e2e8f8] font-semibold text-lg">Henüz analiz verisi yok</p>
        <p className="text-[#8b95a8] text-sm mt-1.5 max-w-sm">
          İlk kampanyanızı gönderin veya mağazanızı bağlayın. Açılma, tıklama ve gelir verileri burada gösterilecek.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/campaigns/new" className="flex items-center gap-2 px-5 py-2.5 bg-[#0062ff] hover:bg-[#0052d4] text-white text-sm font-semibold rounded-xl transition-all">
          <Plus className="w-4 h-4" /> Kampanya Oluştur
        </Link>
        <Link href="/settings" className="flex items-center gap-2 px-5 py-2.5 border border-[#272a33] text-[#8b95a8] hover:text-[#e2e8f8] text-sm font-semibold rounded-xl transition-all">
          Mağaza Bağla
        </Link>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AppShell>
        <Header title="Analytics" subtitle="Kanal ve kampanya performans analizi" />
        <div className="flex-1 bg-[#11131c] p-4 lg:p-6 space-y-4 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl bg-[#1a1e2b] h-24">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="relative overflow-hidden rounded-xl bg-[#1a1e2b] h-64">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
            </div>
            <div className="relative overflow-hidden rounded-xl bg-[#1a1e2b] h-64">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell>
        <Header title="Analytics" subtitle="Kanal ve kampanya performans analizi" />
        <div className="flex-1 bg-[#11131c]"><EmptyAnalytics /></div>
      </AppShell>
    )
  }

  const { kpis, funnel, attribution, segments, channels, revenueData, campaignROI, kpiTable } = data
  const maxAttr = Math.max(...attribution.map(a => a.value), 1)
  const aiInsights = generateInsights(data)

  const channelPerformance = [
    {
      channel: 'Email', icon: Mail, colorClass: 'text-[#b4c5ff]',
      bg: 'bg-[#b4c5ff]/10', border: 'border-[#b4c5ff]/20',
      sent: channels.email.sent, openRate: channels.email.openRate, clickRate: channels.email.clickRate,
      convRate: channels.email.convRate, revenue: channels.email.revenue, roi: channels.email.roi,
    },
    {
      channel: 'WhatsApp', icon: MessageSquare, colorClass: 'text-teal-400',
      bg: 'bg-teal-500/10', border: 'border-teal-500/20',
      sent: channels.whatsapp.sent, openRate: channels.whatsapp.openRate, clickRate: channels.whatsapp.clickRate,
      convRate: channels.whatsapp.convRate, revenue: channels.whatsapp.revenue, roi: channels.whatsapp.roi,
    },
  ]

  return (
    <AppShell>
      <Header title="Analytics" subtitle="Kanal ve kampanya performans analizi" />

      <div className="p-6 space-y-5 flex-1 bg-[#11131c] animate-fade-in">

        {!data.hasData && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400/80">
              Henüz gönderilmiş kampanya veya gelir verisi yok. Değerler kampanyalar gönderildikçe dolacak.
              <Link href="/campaigns/new" className="ml-1 underline hover:no-underline">İlk kampanyayı oluştur →</Link>
            </p>
          </div>
        )}

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Toplam Gelir',    value: formatCurrency(kpis.totalRevenue), icon: TrendingUp,  color: 'text-[#b4c5ff]',  bg: 'bg-[#b4c5ff]/10' },
            { label: 'Toplam Gönderim', value: kpis.totalSent.toLocaleString('tr-TR'), icon: Activity, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { label: 'Dönüşüm Oranı',  value: `%${kpis.convRate}`, icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Ort. AOV',        value: formatCurrency(kpis.aov), icon: ShoppingBag, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-[#191b24] border border-[#272a33] rounded-lg px-5 py-4 hover:border-[#b4c5ff]/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', kpi.bg)}>
                  <kpi.icon className={cn('w-4 h-4', kpi.color)} />
                </div>
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#8b95a8]">—</span>
              </div>
              <p className="text-xl font-bold text-[#e2e8f8]">{kpi.value}</p>
              <p className="text-[11px] text-[#8b95a8] mt-0.5 font-medium">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Conversion Funnel + Revenue Attribution */}
        <div className="grid grid-cols-2 gap-4">
          {/* Conversion Funnel */}
          <div className="bg-[#191b24] border border-[#272a33] rounded-lg p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#e2e8f8]">Dönüşüm Hunisi</h3>
              <p className="text-[11px] text-[#8b95a8] mt-0.5">Email kanalı · Tüm zamanlar</p>
            </div>
            <div className="space-y-3">
              {funnel.map((step, i) => {
                const Icon = [Mail, Eye, MousePointer, ShoppingBag][i]
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${step.color}20` }}>
                          <Icon className="w-3 h-3" style={{ color: step.color }} />
                        </div>
                        <span className="text-xs text-[#8b95a8]">{step.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#e2e8f8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {step.value.toLocaleString('tr-TR')}
                        </span>
                        <span className="text-[10px] text-[#8b95a8] ml-2" style={{ fontFamily: 'JetBrains Mono, monospace' }}>%{step.pct}</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#272a33] rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${step.pct}%`, background: step.color }} />
                    </div>
                    {i < funnel.length - 1 && step.value > 0 && funnel[i + 1].value > 0 && (
                      <div className="flex justify-end mt-1">
                        <span className="text-[10px] text-[#8b95a8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {((funnel[i + 1].value / step.value) * 100).toFixed(1)}% geçti ↓
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Revenue Attribution */}
          <div className="bg-[#191b24] border border-[#272a33] rounded-lg p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#e2e8f8]">Gelir Atıfı</h3>
              <p className="text-[11px] text-[#8b95a8] mt-0.5">Kampanya türüne göre</p>
            </div>
            {attribution.length > 0 ? (
              <div className="space-y-3">
                {attribution.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[#8b95a8]">{item.name}</span>
                      <span className="text-xs font-bold text-[#e2e8f8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                    <div className="w-full bg-[#272a33] rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${(item.value / maxAttr) * 100}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-[#272a33] flex items-center justify-between">
                  <span className="text-xs text-[#8b95a8] font-semibold">Toplam</span>
                  <span className="text-sm font-bold text-emerald-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {formatCurrency(attribution.reduce((s, d) => s + d.value, 0))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-[#8b95a8]">
                <BarChart3 className="w-7 h-7 mb-2 opacity-20" />
                <p className="text-sm">Henüz gelir atıfı yok</p>
                <p className="text-xs mt-1 opacity-60">Kampanya geliri eklendikçe görünecek</p>
              </div>
            )}
          </div>
        </div>

        {/* Segment Matrices */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-[#b4c5ff]" />
            <h3 className="text-sm font-semibold text-[#e2e8f8]">Segment Matrisleri</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'VIP Müşteriler', icon: Crown, color: 'text-[#b4c5ff]', bg: 'bg-[#b4c5ff]/10', border: 'border-[#b4c5ff]/20',
                count: segments.vip.count,
                stats: [
                  { key: 'Ort. Harcama', val: formatCurrency(segments.vip.avgSpent) },
                  { key: 'Ort. Sipariş', val: segments.vip.avgOrders.toString() },
                  { key: 'Segment',      val: 'VIP' },
                  { key: 'Durum',        val: segments.vip.count > 0 ? 'Aktif' : 'Yok' },
                ],
              },
              {
                label: 'Yeni Kazanılan', icon: Flame, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
                count: segments.new.count,
                stats: [
                  { key: 'İlk Sipariş', val: formatCurrency(segments.new.avgSpent) },
                  { key: 'Segment',     val: 'Yeni' },
                  { key: 'Sadık',       val: segments.loyal.count.toString() },
                  { key: 'Pasif',       val: segments.inactive.count.toString() },
                ],
              },
              {
                label: 'Kayıp Riski', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20',
                count: segments.at_risk.count,
                stats: [
                  { key: 'Ort. Harcama', val: formatCurrency(segments.at_risk.avgSpent) },
                  { key: 'Risk Grubu',   val: segments.at_risk.count.toString() },
                  { key: 'Pasif',        val: segments.inactive.count.toString() },
                  { key: 'Urgency',      val: segments.at_risk.count > 10 ? 'Yüksek' : 'Normal' },
                ],
              },
            ].map((seg, i) => {
              const Icon = seg.icon
              return (
                <div key={i} className={cn('bg-[#191b24] border rounded-lg p-5', seg.border)}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border', seg.bg, seg.border)}>
                      <Icon className={cn('w-5 h-5', seg.color)} />
                    </div>
                    <div>
                      <p className={cn('text-sm font-bold', seg.color)}>{seg.label}</p>
                      <p className="text-[10px] text-[#8b95a8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {seg.count.toLocaleString('tr-TR')} müşteri
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {seg.stats.map(stat => (
                      <div key={stat.key} className="p-2.5 rounded-lg bg-[#272a33] border border-[#272a33]">
                        <p className="text-sm font-bold text-[#e2e8f8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{stat.val || '—'}</p>
                        <p className="text-[10px] text-[#8b95a8] mt-0.5">{stat.key}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Channel Performance Cards */}
          <div className="space-y-3">
            {channelPerformance.map(ch => {
              const Icon = ch.icon
              return (
                <div key={ch.channel} className={cn('bg-[#191b24] border rounded-lg p-4', ch.border)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center border', ch.bg, ch.border)}>
                        <Icon className={cn('w-4 h-4', ch.colorClass)} />
                      </div>
                      <div>
                        <p className={cn('text-sm font-bold', ch.colorClass)}>{ch.channel}</p>
                        <p className="text-[10px] text-[#8b95a8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{ch.sent.toLocaleString('tr-TR')} gönderim</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {ch.roi > 0 ? `ROI ×${(ch.roi / 100).toFixed(1)}` : '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'Gelir',    value: formatCurrency(ch.revenue), color: 'text-[#e2e8f8]' },
                      { label: 'Açılma',   value: ch.openRate > 0 ? `%${ch.openRate}` : '—', color: ch.colorClass },
                      { label: 'Tıklama',  value: ch.clickRate > 0 ? `%${ch.clickRate}` : '—', color: ch.colorClass },
                      { label: 'Dönüşüm', value: ch.convRate > 0 ? `%${ch.convRate}` : '—', color: 'text-emerald-400' },
                    ].map(stat => (
                      <div key={stat.label} className="p-2 rounded-lg bg-[#272a33] text-center">
                        <p className={cn('text-xs font-bold', stat.color)} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{stat.value}</p>
                        <p className="text-[9px] text-[#8b95a8] mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Revenue Trend + AI Insights + KPI Table */}
          <div className="col-span-2 space-y-3">
            {/* Revenue Trend */}
            <div className="bg-[#191b24] border border-[#272a33] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#e2e8f8]">Gelir Trendi</h3>
                  <p className="text-[11px] text-[#8b95a8] mt-0.5">Son 12 ay</p>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  {[{ color: '#b4c5ff', label: 'Email' }, { color: '#14b8a6', label: 'WhatsApp' }].map(l => (
                    <span key={l.label} className="flex items-center gap-1.5 text-[#8b95a8]">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: l.color }} />{l.label}
                    </span>
                  ))}
                </div>
              </div>
              {revenueData.some(d => d.email > 0 || d.whatsapp > 0) ? (
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                    <defs>
                      {[{ key: 'email', color: '#b4c5ff' }, { key: 'whatsapp', color: '#14b8a6' }].map(({ key, color }) => (
                        <linearGradient key={key} id={`flux-${key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#272a33" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8b95a8', fontFamily: 'JetBrains Mono, monospace' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#8b95a8', fontFamily: 'JetBrains Mono, monospace' }} tickLine={false} axisLine={false} tickFormatter={v => `₺${v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="email" name="Email" stroke="#b4c5ff" strokeWidth={1.5} fill="url(#flux-email)" dot={false} />
                    <Area type="monotone" dataKey="whatsapp" name="WhatsApp" stroke="#14b8a6" strokeWidth={1.5} fill="url(#flux-whatsapp)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-[#8b95a8]">
                  <BarChart3 className="w-7 h-7 mb-2 opacity-20" />
                  <p className="text-sm">Gelir verisi henüz yok</p>
                </div>
              )}
            </div>

            {/* AI Insights + KPI row */}
            <div className="grid grid-cols-2 gap-3">
              {/* AI Insights */}
              <div className="bg-[#191b24] border border-[#272a33] rounded-lg p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-md bg-[#0062ff]/15 border border-[#b4c5ff]/20 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-[#b4c5ff]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#e2e8f8]">AI Önerileri</h3>
                </div>
                <div className="space-y-2 flex-1">
                  {aiInsights.map((insight, i) => {
                    const Icon = insight.icon
                    return (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-[#272a33] border border-[#272a33] text-xs">
                        <Icon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', insight.color)} />
                        <p className="text-[#8b95a8] leading-relaxed text-[11px]">{insight.text}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* KPI Table */}
              <div className="bg-[#191b24] border border-[#272a33] rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-[#272a33]">
                  <h3 className="text-sm font-semibold text-[#e2e8f8]">Temel Metrikler</h3>
                  <p className="text-[11px] text-[#8b95a8] mt-0.5">Bu ay vs geçen ay</p>
                </div>
                <div className="divide-y divide-[#272a33]">
                  {kpiTable.map(row => (
                    <div key={row.metric} className="px-4 py-2 flex items-center justify-between hover:bg-[#272a33] transition-colors">
                      <span className="text-[11px] text-[#8b95a8] font-medium">{row.metric}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#e2e8f8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{row.current}</span>
                        {row.change !== '—' && (
                          <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5', row.pos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                            {row.pos ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                            {row.change}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
