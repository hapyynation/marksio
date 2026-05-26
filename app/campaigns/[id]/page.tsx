'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'
import {
  ArrowLeft, Mail, MessageSquare, TrendingUp, Eye, MousePointerClick,
  ShoppingBag, Calendar, Users, Zap, ChevronRight, Loader2,
  CheckCircle2, Circle, Clock, AlertCircle, Send,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { formatCurrency, formatNumber, formatDate, cn } from '@/lib/utils'

interface Campaign {
  id: string; name: string; type: string; status: string; segment: string
  subject?: string; previewText?: string; body?: string; cta?: string
  sent: number; opened: number; clicked: number; converted: number; revenue: number
  sentAt?: string; scheduledAt?: string; createdAt: string; tips: string[]
}

const typeConfig: Record<string, { label: string; icon: typeof Mail; color: string; bg: string; bar: string }> = {
  email:    { label: 'Email',    icon: Mail,          color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', bar: '#3b82f6' },
  whatsapp: { label: 'WhatsApp', icon: MessageSquare, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', bar: '#14b8a6' },
}
const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  completed: { label: 'Tamamlandı', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  active:    { label: 'Aktif',      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',          icon: Zap },
  scheduled: { label: 'Planlandı',  color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',       icon: Clock },
  draft:     { label: 'Taslak',     color: 'text-gray-500 bg-gray-500/10 border-gray-500/20',          icon: Circle },
}
const periodOptions = [
  { key: '1d', label: '24 Saat' },
  { key: '7d', label: '7 Gün' },
  { key: '30d', label: '30 Gün' },
  { key: 'all', label: 'Tümü' },
]

function genChartData(c: Campaign, period: string) {
  const pts = period === '1d' ? 24 : period === '7d' ? 7 : period === '30d' ? 30 : 12
  const lbl = (i: number) =>
    period === '1d' ? `${String(i).padStart(2,'0')}:00`
    : period === '7d' ? ['Pzt','Sal','Çar','Per','Cum','Cts','Paz'][i%7]
    : period === '30d' ? `${i+1}` : `Ay ${i+1}`
  const total = c.opened || 0
  return Array.from({ length: pts }, (_, i) => {
    const mid = i > pts*0.25 && i < pts*0.75
    const w = Math.random()*0.4 + (mid ? 0.4 : 0.05)
    const opens = Math.round((total/pts)*w*2.5)
    const clicks = Math.round(opens*(0.2+Math.random()*0.15))
    return { label: lbl(i), opens, clicks, revenue: clicks*Math.round(70+Math.random()*60) }
  })
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 text-xs shadow-2xl">
      <p className="font-semibold text-gray-400 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-5 mb-1">
          <span style={{ color: p.color }} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-bold text-white">{p.name === 'Gelir' ? formatCurrency(p.value) : formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')

  useEffect(() => {
    if (!id) return
    fetch(`/api/campaigns/${id}`)
      .then(r => r.json())
      .then(d => { setCampaign(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return (
    <AppShell><div className="flex-1 flex items-center justify-center bg-[#0a0a0a]"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div></AppShell>
  )
  if (!campaign) return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center text-gray-600">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Kampanya bulunamadı</p>
          <Link href="/campaigns" className="text-xs text-blue-400 hover:text-blue-300 mt-2 inline-block">← Geri dön</Link>
        </div>
      </div>
    </AppShell>
  )

  const type   = typeConfig[campaign.type]   ?? typeConfig.email
  const status = statusConfig[campaign.status] ?? statusConfig.draft
  const StatusIcon = status.icon
  const TypeIcon   = type.icon

  const openRate  = campaign.sent > 0 ? ((campaign.opened    / campaign.sent)*100).toFixed(1) : '0.0'
  const clickRate = campaign.sent > 0 ? ((campaign.clicked   / campaign.sent)*100).toFixed(1) : '0.0'
  const convRate  = campaign.sent > 0 ? ((campaign.converted / campaign.sent)*100).toFixed(1) : '0.0'
  const chartData = genChartData(campaign, period)

  const stats = [
    { label: 'Gönderildi',   value: formatNumber(campaign.sent),       icon: Send,              color: 'text-gray-300',    bg: 'bg-[#1a1a1a] border-[#2a2a2a]',          grad: 'from-gray-500/40' },
    { label: 'Açıldı',       value: `%${openRate}`,                    icon: Eye,               color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       grad: 'from-blue-500/50' },
    { label: 'Tıklandı',     value: `%${clickRate}`,                   icon: MousePointerClick, color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20',   grad: 'from-violet-500/50' },
    { label: 'Dönüşüm',      value: `%${convRate}`,                    icon: TrendingUp,        color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', grad: 'from-emerald-500/50' },
    { label: 'Toplam Gelir', value: formatCurrency(campaign.revenue),  icon: ShoppingBag,       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', grad: 'from-emerald-500/50' },
  ]

  return (
    <AppShell>
      <div className="h-14 bg-[#0a0a0a] border-b border-[#1e1e1e] flex items-center px-6 gap-3 sticky top-0 z-20">
        <Link href="/campaigns" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" /> Kampanyalar
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-700 shrink-0" />
        <span className="text-sm text-gray-400 truncate">{campaign.name}</span>
        <div className="ml-auto shrink-0">
          <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', status.color)}>
            <StatusIcon className="w-3 h-3" />{status.label}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-5 flex-1 bg-[#0a0a0a]">
        {/* Identity */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center border shrink-0', type.bg)}>
            <TypeIcon className={cn('w-6 h-6', type.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white leading-tight">{campaign.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 flex-wrap">
              <span className={cn('font-semibold', type.color)}>{type.label}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3"/>{campaign.segment}</span>
              {campaign.sentAt && <><span>·</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{formatDate(campaign.sentAt)}</span></>}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="relative bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 hover:border-[#2a2a2a] transition-all overflow-hidden">
                <div className={cn('absolute top-0 left-0 right-0 h-px bg-gradient-to-r to-transparent', s.grad)} />
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center border mb-3', s.bg)}>
                  <Icon className={cn('w-4 h-4', s.color)} />
                </div>
                <p className="text-xl font-bold text-white tracking-tight">{s.value}</p>
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            )
          })}
        </div>

        {/* Chart */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Performans Analizi</h3>
              <p className="text-xs text-gray-600 mt-0.5">Açılma ve tıklama trendi</p>
            </div>
            <div className="flex items-center gap-1 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-1">
              {periodOptions.map(p => (
                <button key={p.key} onClick={() => setPeriod(p.key)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    period === p.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-300')}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {campaign.sent > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top:5, right:5, bottom:0, left:0 }}>
                <defs>
                  <linearGradient id="grad-o" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="grad-c" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false}/>
                <XAxis dataKey="label" tick={{ fontSize:10, fill:'#4b5563' }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize:10, fill:'#4b5563' }} tickLine={false} axisLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="opens"  name="Açıldı"   stroke="#3b82f6" strokeWidth={1.5} fill="url(#grad-o)" dot={false} activeDot={{ r:3, fill:'#3b82f6', strokeWidth:0 }}/>
                <Area type="monotone" dataKey="clicks" name="Tıklandı" stroke="#8b5cf6" strokeWidth={1.5} fill="url(#grad-c)" dot={false} activeDot={{ r:3, fill:'#8b5cf6', strokeWidth:0 }}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-gray-700">
              <TrendingUp className="w-8 h-8 mb-2 opacity-20"/>
              <p className="text-sm">Henüz veri yok</p>
            </div>
          )}
        </div>

        {/* Revenue chart */}
        {campaign.revenue > 0 && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Gelir Dağılımı</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top:5, right:5, bottom:0, left:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false}/>
                <XAxis dataKey="label" tick={{ fontSize:10, fill:'#4b5563' }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize:10, fill:'#4b5563' }} tickLine={false} axisLine={false} tickFormatter={v=>`₺${v}`}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="revenue" name="Gelir" radius={[4,4,0,0]}>
                  {chartData.map((_,i)=><Cell key={i} fill={type.bar} fillOpacity={0.5+(i%3)*0.15}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Content */}
        {(campaign.subject || campaign.body) && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e1e1e]">
              <h3 className="text-sm font-semibold text-white">Kampanya İçeriği</h3>
            </div>
            <div className="p-5 space-y-4">
              {campaign.subject && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Konu Satırı</p>
                  <p className="text-sm font-semibold text-white bg-[#0d0d0d] border border-[#1e1e1e] px-4 py-3 rounded-xl">{campaign.subject}</p>
                </div>
              )}
              {campaign.body && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Mesaj</p>
                  <p className="text-sm text-gray-400 bg-[#0d0d0d] border border-[#1e1e1e] px-4 py-3 rounded-xl whitespace-pre-line leading-relaxed">{campaign.body}</p>
                </div>
              )}
              {campaign.cta && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">CTA Butonu</p>
                  <span className="inline-flex items-center px-5 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-semibold rounded-xl">{campaign.cta}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI tips */}
        {campaign.tips?.length > 0 && (
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-yellow-400"/>
              <h3 className="text-sm font-semibold text-white">AI Önerileri</h3>
            </div>
            <ul className="space-y-2.5">
              {campaign.tips.map((tip,i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-gray-500">
                  <div className="w-5 h-5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i+1}</div>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  )
}
