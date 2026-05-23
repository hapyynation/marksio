import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
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
  const [emailStats, smsStats, waStats] = await Promise.all([
    prisma.campaign.aggregate({ where: { userId, type: 'email' }, _sum: { sent: true, opened: true, clicked: true, revenue: true } }),
    prisma.campaign.aggregate({ where: { userId, type: 'sms' }, _sum: { sent: true, revenue: true } }),
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

  return NextResponse.json({
    stats: {
      revenue: { value: revenueThisMonth, change: revenueChange },
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
        revenue: Math.round(emailStats._sum.revenue ?? 0),
      },
      sms: {
        sent: smsStats._sum.sent ?? 0,
        revenue: Math.round(smsStats._sum.revenue ?? 0),
      },
      whatsapp: {
        sent: waStats._sum.sent ?? 0,
        revenue: Math.round(waStats._sum.revenue ?? 0),
      },
    },
    recentOpens,
    revenueChart,
    recentCampaigns: campaigns,
    recentAutomations: automations,
    integration,
  })
  } catch (err) {
    console.error('[Dashboard GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
