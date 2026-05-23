'use client'

import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useRealtimeCampaignData, LiveActivity } from '@/lib/hooks/useRealtimeCampaignData'
import { Mail, Phone, MessageSquare, ShoppingBag, MousePointerClick, Eye, UserX, TrendingUp, Activity } from 'lucide-react'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'

const channelIcon: Record<string, React.ElementType> = {
  email: Mail, sms: Phone, whatsapp: MessageSquare,
}
const channelColor: Record<string, string> = {
  email: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  sms: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  whatsapp: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
}
const eventConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  open:        { label: 'Açıldı',     icon: Eye,               color: 'text-blue-400' },
  click:       { label: 'Tıklandı',   icon: MousePointerClick, color: 'text-violet-400' },
  purchase:    { label: 'Satın Aldı', icon: ShoppingBag,       color: 'text-emerald-400' },
  unsubscribe: { label: 'Çıktı',      icon: UserX,             color: 'text-red-400' },
}

function ActivityRow({ activity }: { activity: LiveActivity }) {
  const ChannelIcon = channelIcon[activity.channel] ?? Mail
  const event = eventConfig[activity.type] ?? eventConfig.open
  const EventIcon = event.icon
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#141414] transition-colors animate-slide-up">
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center border shrink-0', channelColor[activity.channel])}>
        <ChannelIcon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white truncate">{activity.customer}</p>
          <span className={cn('text-[10px] font-semibold flex items-center gap-0.5', event.color)}>
            <EventIcon className="w-2.5 h-2.5" />
            {event.label}
          </span>
        </div>
        <p className="text-xs text-gray-600 truncate mt-0.5">{activity.campaign}</p>
      </div>
      <div className="text-right shrink-0">
        {activity.amount && (
          <p className="text-sm font-bold text-emerald-400">{formatCurrency(activity.amount)}</p>
        )}
        <p className="text-[10px] text-gray-700">{activity.time}</p>
      </div>
    </div>
  )
}

const MiniTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }> }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-2 text-xs shadow-xl">
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-3">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold text-white">{p.name === 'Gelir' ? formatCurrency(p.value) : formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function LiveActivityDashboard() {
  const { totalRevenue, totalOpens, totalClicks, openRate, activityChart, revenueChart, liveActivities } = useRealtimeCampaignData()

  const metrics = [
    { label: 'Canlı Gelir',   value: formatCurrency(totalRevenue), icon: TrendingUp,        color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', bar: 'from-emerald-500/40' },
    { label: 'Açılma',        value: formatNumber(totalOpens),     icon: Eye,               color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20',       bar: 'from-blue-500/40' },
    { label: 'Tıklama',       value: formatNumber(totalClicks),    icon: MousePointerClick, color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20',   bar: 'from-violet-500/40' },
    { label: 'Açılma Oranı',  value: `%${openRate}`,              icon: Activity,          color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',     bar: 'from-amber-500/40' },
  ]

  return (
    <div className="space-y-4">
      {/* Live badge + metrics */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-semibold text-emerald-400">Canlı Takip</span>
        </div>
        <p className="text-xs text-gray-600">Son kampanya aktiviteleri gerçek zamanlı</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(m => {
          const Icon = m.icon
          return (
            <div key={m.label} className="relative bg-[#111] border border-[#1e1e1e] rounded-2xl p-4 overflow-hidden hover:border-[#2a2a2a] transition-all">
              <div className={cn('absolute top-0 left-0 right-0 h-px bg-gradient-to-r to-transparent', m.bar)} />
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center border mb-3', m.bg)}>
                <Icon className={cn('w-4 h-4', m.color)} />
              </div>
              <p className="text-xl font-bold text-white tabular-nums">{m.value}</p>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-1">{m.label}</p>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Aktivite Akışı</h3>
              <p className="text-xs text-gray-600 mt-0.5">Anlık açılma ve tıklama</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/>Açılma</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block"/>Tıklama</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={activityChart} margin={{ top:5, right:5, bottom:0, left:0 }}>
              <defs>
                <linearGradient id="la-opens"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="la-clicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false}/>
              <XAxis dataKey="time" tick={{ fontSize:9, fill:'#4b5563' }} tickLine={false} axisLine={false} interval={9}/>
              <YAxis tick={{ fontSize:9, fill:'#4b5563' }} tickLine={false} axisLine={false}/>
              <Tooltip content={<MiniTooltip/>}/>
              <Area type="monotone" dataKey="opens"  name="Açılma"  stroke="#3b82f6" strokeWidth={1.5} fill="url(#la-opens)"  dot={false} isAnimationActive={false}/>
              <Area type="monotone" dataKey="clicks" name="Tıklama" stroke="#8b5cf6" strokeWidth={1.5} fill="url(#la-clicks)" dot={false} isAnimationActive={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Kümülatif Gelir</h3>
              <p className="text-xs text-gray-600 mt-0.5">Oturum toplamı</p>
            </div>
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"/>Gelir
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={revenueChart} margin={{ top:5, right:5, bottom:0, left:0 }}>
              <defs>
                <linearGradient id="la-rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false}/>
              <XAxis dataKey="time" tick={{ fontSize:9, fill:'#4b5563' }} tickLine={false} axisLine={false} interval={9}/>
              <YAxis tick={{ fontSize:9, fill:'#4b5563' }} tickLine={false} axisLine={false} tickFormatter={v=>`₺${Math.round(v/1000)}K`}/>
              <Tooltip content={<MiniTooltip/>}/>
              <Area type="monotone" dataKey="revenue" name="Gelir" stroke="#10b981" strokeWidth={1.5} fill="url(#la-rev)" dot={false} isAnimationActive={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live activity feed */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
        <div className="px-4 py-3.5 border-b border-[#1e1e1e] flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400"/>
          <h3 className="text-sm font-semibold text-white">Son Aktiviteler</h3>
          <span className="ml-auto text-[10px] text-gray-600">{liveActivities.length} kayıt</span>
        </div>
        <div className="divide-y divide-[#151515] max-h-72 overflow-y-auto">
          {liveActivities.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-700">
              <Activity className="w-6 h-6 mx-auto mb-2 opacity-20"/>
              <p className="text-xs">Aktivite bekleniyor...</p>
            </div>
          ) : (
            liveActivities.map(a => <ActivityRow key={a.id} activity={a}/>)
          )}
        </div>
      </div>
    </div>
  )
}
