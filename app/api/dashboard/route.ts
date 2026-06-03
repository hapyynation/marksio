import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// --- Demo data for new users ---
function makeDemoChart() {
  const labels = ['1 May', '5 May', '10 May', '15 May', '20 May', '25 May', '28 May']
  const values = [18400, 24200, 19800, 31500, 27600, 38900, 42300]
  return labels.map((label, i) => ({ date: `2025-05-${String(i * 4 + 1).padStart(2,'0')}`, label, value: values[i] }))
}

const DEMO_DATA = {
  stats: {
    revenue: { value: 202700, change: 34 },
    customers: { value: 1248, change: 22, newThisMonth: 87 },
    campaigns: { sent: 18400, opened: 6992, clicked: 1840 },
    cartAbandons: 143,
  },
  channelStats: {
    email: { sent: 18400, opened: 6992, clicked: 1840, openRate: 38, clickRate: 10, revenue: 152300 },
    whatsapp: { sent: 4100, revenue: 26000 },
  },
  recentOpens: [
    { id: '1', openedAt: new Date().toISOString(), channel: 'email', campaign: { name: 'Anneler Günü Kampanyası', type: 'email' }, customer: { name: 'Ayşe Kara', email: 'ayse@example.com', segment: 'vip', totalSpent: 12400 } },
    { id: '2', openedAt: new Date(Date.now()-120000).toISOString(), channel: 'email', campaign: { name: 'Yeni Sezon İndirimi', type: 'email' }, customer: { name: 'Mert Yıldız', email: 'mert@example.com', segment: 'loyal', totalSpent: 5800 } },
    { id: '3', openedAt: new Date(Date.now()-300000).toISOString(), channel: 'email', campaign: { name: 'Hoş Geldin Serisi', type: 'email' }, customer: { name: 'Zeynep Öz', email: 'zeynep@example.com', segment: 'new', totalSpent: 890 } },
  ],
  revenueChart: makeDemoChart(),
  recentCampaigns: [
    { id: 'demo1', name: 'Anneler Günü Kampanyası', type: 'email', status: 'sent', sent: 4200, opened: 1638, clicked: 420, revenue: 38400, createdAt: new Date().toISOString() },
    { id: 'demo2', name: 'Yeni Sezon İndirimi', type: 'email', status: 'sent', sent: 3800, opened: 1444, clicked: 380, revenue: 29700, createdAt: new Date(Date.now()-86400000).toISOString() },
    { id: 'demo3', name: 'Sepet Terk Akışı', type: 'email', status: 'active', sent: 890, opened: 534, clicked: 267, revenue: 18200, createdAt: new Date(Date.now()-172800000).toISOString() },
  ],
  recentAutomations: [
    { id: 'autod1', name: 'Hoş Geldin Serisi', trigger: 'customer_created', status: 'active', sent: 312, converted: 87, revenue: 14300 },
    { id: 'autod2', name: 'Sepet Terk', trigger: 'cart_abandoned', status: 'active', sent: 143, converted: 41, revenue: 11200 },
    { id: 'autod3', name: 'Win-back', trigger: 'no_purchase_90d', status: 'active', sent: 208, converted: 34, revenue: 8900 },
  ],
  integration: null,
  triggerCounts: { cart_abandoned: 143, order_placed: 28 },
}

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = session.user.id
  try {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [thisMonthOrders, lastMonthOrders] = await Promise.all([
    prisma.order.findMany({ where: { userId, placedAt: { gte: startOfMonth }, financialStatus: 'paid' }, select: { total: true, customerId: true } }),
    prisma.order.findMany({ where: { userId, placedAt: { gte: startOfLastMonth, lte: endOfLastMonth }, financialStatus: 'paid' }, select: { total: true } }),
  ])

  const revenueThisMonth = thisMonthOrders.reduce((s, o) => s + o.total, 0)
  const revenueLastMonth = lastMonthOrders.reduce((s, o) => s + o.total, 0)
  const revenueChange = revenueLastMonth > 0 ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 : 0

  const [totalCustomers, newCustomersThisMonth, newCustomersLastMonth] = await Promise.all([
    prisma.customer.count({ where: { userId } }),
    prisma.customer.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
    prisma.customer.count({ where: { userId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
  ])
  const customersChange = newCustomersLastMonth > 0 ? ((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 100 : 0

  const [campaigns, automations] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, type: true, status: true, sent: true, opened: true, clicked: true, revenue: true, createdAt: true },
    }),
    prisma.automation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, trigger: true, status: true, sent: true, converted: true, revenue: true },
    }),
  ])

  // Channel stats
  const [emailStats, waStats] = await Promise.all([
    prisma.campaign.aggregate({ where: { userId, type: 'email' }, _sum: { sent: true, opened: true, clicked: true, revenue: true } }),
    prisma.campaign.aggregate({ where: { userId, type: 'whatsapp' }, _sum: { sent: true, revenue: true } }),
  ])

  const emailSent = emailStats._sum.sent ?? 0
  const emailOpened = emailStats._sum.opened ?? 0
  const emailClicked = emailStats._sum.clicked ?? 0

  // Son 30 günlük açılmalar — müşteri + segment bilgisi
  const recentOpens = await prisma.campaignOpen.findMany({
    where: { userId, channel: 'email' },
    orderBy: { openedAt: 'desc' },
    take: 15,
    select: {
      id: true,
      openedAt: true,
      channel: true,
      campaign: { select: { name: true, type: true } },
      customer: { select: { name: true, email: true, segment: true, totalSpent: true } },
    },
  }).catch(() => [])

  // Son 30 günlük gelir grafiği
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
  const recentOrders = await prisma.order.findMany({
    where: { userId, placedAt: { gte: thirtyDaysAgo }, financialStatus: 'paid' },
    select: { total: true, placedAt: true },
    orderBy: { placedAt: 'asc' },
  })

  const revenueByDay: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo.getTime() + i * 86400000)
    revenueByDay[d.toISOString().slice(0, 10)] = 0
  }
  for (const o of recentOrders) {
    const key = o.placedAt.toISOString().slice(0, 10)
    if (key in revenueByDay) revenueByDay[key] += o.total
  }

  const revenueChart = Object.entries(revenueByDay).map(([date, value]) => ({
    date,
    label: new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
    value: Math.round(value),
  }))

  const cartAbandonEvents = await prisma.customerEvent.count({ where: { userId, type: 'cart_abandoned' } })
  const integration = await prisma.integration.findFirst({ where: { userId, platform: 'shopify', status: 'active' }, select: { shopDomain: true, lastSyncAt: true } })

  // Tetikleyici sayıları (işlenmemiş CustomerEvent'ler)
  const triggerCountsRaw = await prisma.customerEvent.groupBy({
    by: ['type'],
    where: { userId, processedAt: null },
    _count: { id: true },
  }).catch(() => [])
  const triggerCounts: Record<string, number> = {}
  for (const t of triggerCountsRaw) triggerCounts[t.type] = t._count.id

  const isEmpty = totalCustomers === 0 && campaigns.length === 0

  // Return demo data for new users so dashboard is never empty
  if (isEmpty) {
    return NextResponse.json({ ...DEMO_DATA, isDemo: true })
  }

  const emailRevenue    = Math.round(emailStats._sum.revenue ?? 0)
  const waRevenue       = Math.round(waStats._sum.revenue ?? 0)
  const autoRevenueAgg  = await prisma.automation.aggregate({ where: { userId }, _sum: { revenue: true } })
  const automationRev   = Math.round(autoRevenueAgg._sum.revenue ?? 0)
  const totalRevenue    = emailRevenue + waRevenue + automationRev

  // Sepet terk oranı
  const totalCheckouts  = await prisma.customerEvent.count({ where: { userId, type: { in: ['checkout_started', 'cart_abandoned'] } } })
  const cartAbandonRate = totalCheckouts > 0 ? +((cartAbandonEvents / totalCheckouts) * 100).toFixed(1) : 68.7

  // Aktif email aboneler (unsubscribed olmayan)
  const activeSubscribers = await prisma.customer.count({ where: { userId, unsubscribed: false } })
  const waSubscribers     = await prisma.customer.count({ where: { userId, phone: { not: null } } })

  return NextResponse.json({
    stats: {
      revenue: { value: totalRevenue || revenueThisMonth, change: revenueChange },
      customers: { value: totalCustomers, change: customersChange, newThisMonth: newCustomersThisMonth },
      campaigns: { sent: emailSent, opened: emailOpened, clicked: emailClicked },
      cartAbandons: cartAbandonEvents,
    },
    channelStats: {
      email: {
        sent: emailSent,
        opened: emailOpened,
        clicked: emailClicked,
        openRate: emailSent > 0 ? Math.round((emailOpened / emailSent) * 100) : 0,
        clickRate: emailSent > 0 ? Math.round((emailClicked / emailSent) * 100) : 0,
        revenue: emailRevenue,
      },
      whatsapp: {
        sent: waStats._sum.sent ?? 0,
        revenue: waRevenue,
      },
    },
    // Yeni dashboard secondary metrics için
    kpiExtended: {
      emailRevenue,
      waRevenue,
      automationRevenue: automationRev,
      totalRevenue: totalRevenue || revenueThisMonth,
      cartAbandonRate,
      activeSubscribers,
      waSubscribers,
    },
    recentOpens,
    revenueChart,
    recentCampaigns: campaigns,
    recentAutomations: automations,
    integration,
    triggerCounts,
    isDemo: false,
  })
  } catch (err) {
    console.error('[Dashboard GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
