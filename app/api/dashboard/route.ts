import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = session.user.id
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)

    // All DB queries in parallel — eliminates sequential waterfall
    const [
      thisMonthOrders,
      lastMonthOrders,
      totalCustomers,
      newCustomersThisMonth,
      newCustomersLastMonth,
      campaigns,
      automations,
      emailStats,
      waStats,
      recentOpens,
      recentOrders,
      cartAbandonEvents,
      totalCheckouts,
      integration,
      emailDomain,
      waSettings,
      triggerCountsRaw,
      autoRevenueAgg,
      activeSubscribers,
      waSubscribers,
      segments,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { userId, placedAt: { gte: startOfMonth }, financialStatus: 'paid' },
        select: { total: true },
      }),
      prisma.order.findMany({
        where: { userId, placedAt: { gte: startOfLastMonth, lte: endOfLastMonth }, financialStatus: 'paid' },
        select: { total: true },
      }),
      prisma.customer.count({ where: { userId } }),
      prisma.customer.count({ where: { userId, createdAt: { gte: startOfMonth } } }),
      prisma.customer.count({ where: { userId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
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
      prisma.campaign.aggregate({
        where: { userId, type: 'email' },
        _sum: { sent: true, opened: true, clicked: true, revenue: true },
      }),
      prisma.campaign.aggregate({
        where: { userId, type: 'whatsapp' },
        _sum: { sent: true, revenue: true },
      }),
      prisma.campaignOpen.findMany({
        where: { userId, channel: 'email' },
        orderBy: { openedAt: 'desc' },
        take: 15,
        select: {
          id: true, openedAt: true, channel: true,
          campaign: { select: { name: true, type: true } },
          customer: { select: { name: true, email: true, segment: true, totalSpent: true } },
        },
      }).catch(() => []),
      prisma.order.findMany({
        where: { userId, placedAt: { gte: thirtyDaysAgo }, financialStatus: 'paid' },
        select: { total: true, placedAt: true },
        orderBy: { placedAt: 'asc' },
      }),
      prisma.customerEvent.count({ where: { userId, type: 'cart_abandoned' } }),
      prisma.customerEvent.count({ where: { userId, type: { in: ['checkout_started', 'cart_abandoned'] } } }),
      prisma.integration.findFirst({
        where: { userId, platform: 'shopify', status: 'active' },
        select: { shopDomain: true, lastSyncAt: true },
      }),
      prisma.emailDomain.findFirst({
        where: { userId },
        select: { domain: true, status: true },
      }).catch(() => null),
      prisma.whatsAppSettings.findFirst({
        where: { userId },
        select: { connectionStatus: true },
      }).catch(() => null),
      prisma.customerEvent.groupBy({
        by: ['type'],
        where: { userId, processedAt: null },
        _count: { id: true },
      }).catch(() => []),
      prisma.automation.aggregate({ where: { userId }, _sum: { revenue: true } }),
      prisma.customer.count({ where: { userId, unsubscribed: false } }),
      prisma.customer.count({ where: { userId, phone: { not: null } } }),
      prisma.segment.findMany({
        where: { userId, active: true },
        orderBy: { count: 'desc' },
        take: 6,
        select: { id: true, name: true, count: true, color: true, icon: true },
      }),
    ])

    // Derived revenue metrics
    const revenueThisMonth = thisMonthOrders.reduce((s, o) => s + o.total, 0)
    const revenueLastMonth = lastMonthOrders.reduce((s, o) => s + o.total, 0)
    const revenueChange = (revenueLastMonth > 0 && revenueThisMonth > 0)
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 1000) / 10
      : 0
    const customersChange = (newCustomersLastMonth > 0 && newCustomersThisMonth > 0)
      ? Math.round(((newCustomersThisMonth - newCustomersLastMonth) / newCustomersLastMonth) * 1000) / 10
      : 0

    const emailSent    = emailStats._sum.sent    ?? 0
    const emailOpened  = emailStats._sum.opened  ?? 0
    const emailClicked = emailStats._sum.clicked ?? 0
    const emailRevenue  = Math.round(emailStats._sum.revenue ?? 0)
    const waRevenue     = Math.round(waStats._sum.revenue    ?? 0)
    const automationRev = Math.round(autoRevenueAgg._sum.revenue ?? 0)
    const totalRevenue  = emailRevenue + waRevenue + automationRev

    // 30-day revenue chart
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

    const triggerCounts: Record<string, number> = {}
    for (const t of triggerCountsRaw) triggerCounts[t.type] = t._count.id

    const cartAbandonRate = totalCheckouts > 0
      ? Math.round((cartAbandonEvents / totalCheckouts) * 1000) / 10
      : 0
    const avgOrderValue = totalCustomers > 0
      ? Math.round((totalRevenue || revenueThisMonth) / totalCustomers)
      : 0

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
          openRate: emailSent > 0 ? Math.round((emailOpened  / emailSent) * 100) : 0,
          clickRate: emailSent > 0 ? Math.round((emailClicked / emailSent) * 100) : 0,
          revenue: emailRevenue,
        },
        whatsapp: {
          sent: waStats._sum.sent ?? 0,
          revenue: waRevenue,
        },
      },
      kpiExtended: {
        emailRevenue,
        waRevenue,
        automationRevenue: automationRev,
        totalRevenue: totalRevenue || revenueThisMonth,
        cartAbandonRate,
        activeSubscribers,
        waSubscribers,
        avgOrderValue,
      },
      integrationStatus: {
        shopify:    { ok: !!integration,                              detail: integration?.shopDomain ?? null },
        email:      { ok: emailDomain?.status === 'verified',        detail: emailDomain?.domain     ?? null },
        whatsapp:   { ok: waSettings?.connectionStatus === 'connected', detail: null },
        customerCount: totalCustomers,
      },
      recentOpens,
      revenueChart,
      recentCampaigns: campaigns,
      recentAutomations: automations,
      integration,
      segments,
      triggerCounts,
      isDemo: false,
    })
  } catch (err) {
    console.error('[Dashboard GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
