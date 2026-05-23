'use client'

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import { Mail, Phone, MessageSquare, ArrowUpRight } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import { revenueData, campaigns } from '@/lib/mock-data'
import { formatCurrency, cn } from '@/lib/utils'

const channelPerformance = [
  { channel: 'Email',    icon: Mail,          color: '#3b82f6', colorClass: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',
    sent: 42800, openRate: 42.6, clickRate: 12.4, convRate: 4.8, revenue: 42500, roi: 680 },
  { channel: 'WhatsApp', icon: MessageSquare, color: '#14b8a6', colorClass: 'text-teal-400',    bg: 'bg-teal-500/10 border-teal-500/20',
    sent: 8400,  openRate: 87.2, clickRate: 34.1, convRate: 9.2, revenue: 23100, roi: 1240 },
  { channel: 'SMS',      icon: Phone,         color: '#10b981', colorClass: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20',
    sent: 18200, openRate: 98.0, clickRate: 18.4, convRate: 3.9, revenue: 24200, roi: 540 },
]

const campaignROI = campaigns
  .filter(c => c.metrics.sent > 0)
  .map(c => ({
    name: c.name.length > 20 ? c.name.slice(0, 20) + '…' : c.name,
    revenue: c.metrics.revenue,
    converted: c.metrics.converted,
    type: c.type,
  }))

const radarData = [
  { metric: 'Email', value: 78 },
  { metric: 'SMS', value: 65 },
  { metric: 'WhatsApp', value: 91 },
  { metric: 'Otomasyon', value: 84 },
  { metric: 'Segm.', value: 72 },
]

const barColors: Record<string, string> = {
  email:    '#3b82f6',
  sms:      '#10b981',
  whatsapp: '#14b8a6',
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 text-xs shadow-2xl">
      <p className="font-semibold text-gray-300 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold text-white">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <AppShell>
      <Header title="Analitik" subtitle="Kanal ve kampanya performans analizi" />

      <div className="p-6 space-y-5 flex-1">
        {/* Channel performance cards */}
        <div className="grid grid-cols-3 gap-4">
          {channelPerformance.map(ch => {
            const Icon = ch.icon
            return (
              <div key={ch.channel} className="relative bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 hover:border-[#2a2a2a] transition-all overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${ch.color}40, transparent)` }} />
                <div className="flex items-center justify-between mb-4">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', ch.bg)}>
                    <Icon className={cn('w-4 h-4', ch.colorClass)} />
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
                    <ArrowUpRight className="w-3 h-3" />ROI ×{(ch.roi / 100).toFixed(1)}
                  </span>
                </div>
                <p className={cn('text-sm font-bold mb-4', ch.colorClass)}>{ch.channel}</p>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Gelir</span>
                    <span className="font-semibold text-white">{formatCurrency(ch.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Açılma</span>
                    <span className="font-semibold" style={{ color: ch.color }}>%{ch.openRate}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Tıklama</span>
                    <span className="font-semibold" style={{ color: ch.color }}>%{ch.clickRate}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Dönüşüm</span>
                    <span className="font-semibold text-emerald-400">%{ch.convRate}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#1e1e1e]">
                  <div className="w-full bg-[#1a1a1a] rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min(ch.convRate * 10, 100)}%`, background: ch.color }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Revenue by channel */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-white">Kanal Bazlı Gelir Trendi</h3>
                <p className="text-xs text-gray-600 mt-0.5">Son 12 ay</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />Email</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />WhatsApp</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />SMS</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  {[
                    { key: 'email',    color: '#3b82f6' },
                    { key: 'whatsapp', color: '#14b8a6' },
                    { key: 'sms',      color: '#10b981' },
                  ].map(({ key, color }) => (
                    <linearGradient key={key} id={`ag-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={color} stopOpacity={0}   />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#4b5563' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} tickLine={false} axisLine={false} tickFormatter={v => `₺${v / 1000}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="email"    name="Email"    stroke="#3b82f6" strokeWidth={1.5} fill="url(#ag-email)"    dot={false} />
                <Area type="monotone" dataKey="whatsapp" name="WhatsApp" stroke="#14b8a6" strokeWidth={1.5} fill="url(#ag-whatsapp)" dot={false} />
                <Area type="monotone" dataKey="sms"      name="SMS"      stroke="#10b981" strokeWidth={1.5} fill="url(#ag-sms)"      dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Radar */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-0.5">Kanal Sağlık Skoru</h3>
            <p className="text-xs text-gray-600 mb-4">Genel performans</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e1e1e" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#4b5563' }} />
                <Radar name="Skor" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <p className="text-3xl font-bold text-blue-400">74<span className="text-sm text-gray-600">/100</span></p>
              <p className="text-xs text-gray-600">Genel Skor</p>
            </div>
          </div>
        </div>

        {/* Campaign ROI bar chart */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Kampanya Gelir Karşılaştırması</h3>
              <p className="text-xs text-gray-600 mt-0.5">Tamamlanan kampanyalar</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={campaignROI} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#4b5563' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} tickLine={false} axisLine={false} tickFormatter={v => `₺${v / 1000}K`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, fontSize: 12, color: '#fff' }} />
              <Bar dataKey="revenue" name="Gelir" radius={[6, 6, 0, 0]}>
                {campaignROI.map((entry, i) => (
                  <Cell key={i} fill={barColors[entry.type] || '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* KPI table */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e1e1e]">
            <h3 className="text-sm font-semibold text-white">Temel Metrikler</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                {['Metrik', 'Bu Ay', 'Geçen Ay', 'Değişim'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#111]">
              {[
                { metric: 'Toplam Gelir',            current: '₺108.400', prev: '₺91.200', change: '+18.9%', pos: true  },
                { metric: 'Email Açılma Oranı',      current: '%42.6',    prev: '%39.8',   change: '+2.8 pp', pos: true  },
                { metric: 'SMS Tıklama Oranı',       current: '%18.4',    prev: '%16.2',   change: '+2.2 pp', pos: true  },
                { metric: 'WhatsApp Okunma',         current: '%87.2',    prev: '%84.5',   change: '+2.7 pp', pos: true  },
                { metric: 'Ortalama Sipariş Değeri', current: '₺189',     prev: '₺179',    change: '+5.6%',   pos: true  },
                { metric: 'Sepet Terk Oranı',        current: '%68.4',    prev: '%72.1',   change: '-3.7 pp', pos: true  },
                { metric: 'Müşteri Edinme Maliyeti', current: '₺42',      prev: '₺48',     change: '-12.5%',  pos: true  },
              ].map(row => (
                <tr key={row.metric} className="hover:bg-[#141414] transition-colors">
                  <td className="px-5 py-3.5 text-gray-400 font-medium">{row.metric}</td>
                  <td className="px-5 py-3.5 text-white font-semibold">{row.current}</td>
                  <td className="px-5 py-3.5 text-gray-600">{row.prev}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn(
                      'inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full',
                      row.pos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    )}>
                      {row.change}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
