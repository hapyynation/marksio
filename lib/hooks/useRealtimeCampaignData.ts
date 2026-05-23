import { useState, useEffect, useRef, useCallback } from 'react'

export interface ActivityPoint {
  time: string
  opens: number
  clicks: number
  revenue: number
}

export interface CumulativePoint {
  time: string
  revenue: number
}

export interface LiveActivity {
  id: string
  type: 'open' | 'click' | 'purchase' | 'unsubscribe'
  channel: 'email' | 'sms' | 'whatsapp'
  customer: string
  campaign: string
  amount?: number
  time: string
}

const channels = ['email', 'sms', 'whatsapp'] as const
const names = ['Ayşe K.', 'Mehmet A.', 'Fatma Y.', 'Ali D.', 'Zeynep T.', 'Hasan M.', 'Elif Ş.', 'Murat B.', 'Selin Ö.', 'Emre C.']
const campaigns = ['VIP İndirim', 'Sepet Terk', 'Yeni Koleksiyon', 'Hoş Geldin', 'Win-back', 'Bahar Kampanyası']
const eventTypes = ['open', 'click', 'purchase', 'open', 'open', 'click'] as const

function nowTime() {
  return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function useRealtimeCampaignData() {
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOpens, setTotalOpens] = useState(0)
  const [totalClicks, setTotalClicks] = useState(0)
  const [activityChart, setActivityChart] = useState<ActivityPoint[]>([])
  const [revenueChart, setRevenueChart] = useState<CumulativePoint[]>([])
  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([])
  const [openRate, setOpenRate] = useState(0)
  const cumulativeRef = useRef(0)
  const sentRef = useRef(0)

  const tick = useCallback(() => {
    const time = nowTime()
    const opens   = Math.floor(Math.random() * 8)
    const clicks  = Math.floor(Math.random() * 3)
    const revenue = Math.floor(Math.random() * 1200)
    const isPurchase = Math.random() < 0.15

    sentRef.current   += opens + Math.floor(Math.random() * 4)
    cumulativeRef.current += revenue

    setTotalOpens(prev  => prev + opens)
    setTotalClicks(prev => prev + clicks)
    setTotalRevenue(cumulativeRef.current)
    setOpenRate(sentRef.current > 0 ? Math.round((sentRef.current * 0.42 / sentRef.current) * 100) : 42)

    setActivityChart(prev => {
      const next = [...prev, { time, opens, clicks, revenue }]
      return next.slice(-40)
    })
    setRevenueChart(prev => {
      const next = [...prev, { time, revenue: cumulativeRef.current }]
      return next.slice(-40)
    })

    if (isPurchase || Math.random() < 0.4) {
      const type = randomItem(eventTypes)
      const channel = randomItem(channels)
      const activity: LiveActivity = {
        id: Math.random().toString(36).slice(2),
        type,
        channel,
        customer: randomItem(names),
        campaign: randomItem(campaigns),
        amount: type === 'purchase' ? Math.round(150 + Math.random() * 850) : undefined,
        time,
      }
      setLiveActivities(prev => [activity, ...prev].slice(0, 12))
    }
  }, [])

  useEffect(() => {
    tick()
    const interval = setInterval(tick, 2500)
    return () => clearInterval(interval)
  }, [tick])

  return {
    totalRevenue,
    totalOpens,
    totalClicks,
    openRate,
    activityChart,
    revenueChart,
    liveActivities,
  }
}
