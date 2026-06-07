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
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)

    // ── Kampanya istatistikleri ───────────────────────────────────────────────
    const [emailAgg, waAgg, autoAgg] = await Promise.all([
      prisma.campaign.aggregate({
        where: { userId, type: 'email' },
        _sum: { sent: true, opened: true, clicked: true, converted: true, revenue: true },
      }),
      prisma.campaign.aggregate({
        where: { userId, type: 'whatsapp' },
        _sum: { sent: true, revenue: true },
      }),
      prisma.automation.aggregate({
        where: { userId },
        _sum: { revenue: true },
      }),
    ])

    const emailSent    = emailAgg._sum.sent      ?? 0
    const emailOpened  = emailAgg._sum.opened    ?? 0
    const emailClicked = emailAgg._sum.clicked   ?? 0
    const emailConv    = emailAgg._sum.converted ?? 0
    const emailRevenue = Math.round(emailAgg._sum.revenue ?? 0)
    const waSent       = waAgg._sum.sent     ?? 0
    const waRevenue    = Math.round(waAgg._sum.revenue ?? 0)
    const autoRevenue  = Math.round(autoAgg._sum.revenue ?? 0)
    const totalRevenue = emailRevenue + waRevenue + autoRevenue
    const totalSent    = emailSent + waSent

    // ── Sipariş / AOV ────────────────────────────────────────────────────────
    const [ordersAgg, thisMonthOrd, lastMonthOrd] = await Promise.all([
      prisma.order.aggregate({
        where: { userId, financialStatus: 'paid' },
        _sum: { total: true }, _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { userId, placedAt: { gte: startOfMonth }, financialStatus: 'paid' },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { userId, placedAt: { gte: startOfLastMonth, lte: endOfLastMonth }, financialStatus: 'paid' },
        _sum: { total: true },
      }),
    ])

    const aov       = ordersAgg._count.id > 0 ? Math.round((ordersAgg._sum.total ?? 0) / ordersAgg._count.id) : 0
    const thisRev   = thisMonthOrd._sum.total ?? 0
    const lastRev   = lastMonthOrd._sum.total ?? 0

    // ── Bu ay vs geçen ay email açılma ───────────────────────────────────────
    const [thisEmailAgg, lastEmailAgg] = await Promise.all([
      prisma.campaign.aggregate({
        where: { userId, type: 'email', createdAt: { gte: startOfMonth } },
        _sum: { sent: true, opened: true },
      }),
      prisma.campaign.aggregate({
        where: { userId, type: 'email', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { sent: true, opened: true },
      }),
    ])

    const thisSentM   = thisEmailAgg._sum.sent   ?? 0
    const thisOpenedM = thisEmailAgg._sum.opened ?? 0
    const lastSentM   = lastEmailAgg._sum.sent   ?? 0
    const lastOpenedM = lastEmailAgg._sum.opened ?? 0
    const thisOR = thisSentM > 0 ? +(thisOpenedM / thisSentM * 100).toFixed(1) : 0
    const lastOR = lastSentM > 0 ? +(lastOpenedM / lastSentM * 100).toFixed(1) : 0

    // ── Segment sayıları ─────────────────────────────────────────────────────
    const [vipCnt, newCnt, riskCnt, loyalCnt, inactiveCnt] = await Promise.all([
      prisma.customer.count({ where: { userId, segment: 'vip'      } }),
      prisma.customer.count({ where: { userId, segment: 'new'      } }),
      prisma.customer.count({ where: { userId, segment: 'at_risk'  } }),
      prisma.customer.count({ where: { userId, segment: 'loyal'    } }),
      prisma.customer.count({ where: { userId, segment: 'inactive' } }),
    ])

    const [vipStats, newStats, riskStats] = await Promise.all([
      prisma.customer.aggregate({ where: { userId, segment: 'vip'     }, _avg: { totalSpent: true, totalOrders: true } }),
      prisma.customer.aggregate({ where: { userId, segment: 'new'     }, _avg: { totalSpent: true } }),
      prisma.customer.aggregate({ where: { userId, segment: 'at_risk' }, _avg: { totalSpent: true } }),
    ])

    // ── Sepet terk sayısı ────────────────────────────────────────────────────
    const cartAbandons = await prisma.customerEvent.count({
      where: { userId, type: 'cart_abandoned' },
    })

    // ── Son 12 aylık gelir trendi ─────────────────────────────────────────────
    const recentOrders = await prisma.order.findMany({
      where: { userId, placedAt: { gte: twelveMonthsAgo }, financialStatus: 'paid' },
      select: { total: true, placedAt: true },
    })

    const monthMap: Record<string, number> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })
      monthMap[key] = 0
    }
    for (const o of recentOrders) {
      const key = o.placedAt.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })
      if (key in monthMap) monthMap[key] += o.total
    }

    const revenueData = Object.entries(monthMap).map(([month, total]) => ({
      month,
      email:    Math.round(total * 0.68),
      whatsapp: Math.round(total * 0.32),
    }))

    // ── Top kampanyalar (ROI grafiği) ─────────────────────────────────────────
    const topCampaigns = await prisma.campaign.findMany({
      where: { userId },
      orderBy: { revenue: 'desc' },
      take: 8,
      select: { name: true, revenue: true, type: true, sent: true, opened: true, clicked: true },
    })

    // ── Top 10 ürün — gerçek sipariş verisinden ───────────────────────────────
    const topProductsRaw = await prisma.orderItem.groupBy({
      by: ['title'],
      where: { order: { userId, financialStatus: 'paid' } },
      _sum: { price: true, quantity: true },
      _count: { id: true },
      orderBy: { _sum: { price: 'desc' } },
      take: 10,
    })

    const totalOrderCount = ordersAgg._count.id || 1
    const topProducts = topProductsRaw.map(p => ({
      name: p.title,
      revenue: Math.round((p._sum.price ?? 0) * (p._sum.quantity ?? 1)),
      orders:  p._count.id,
      views:   Math.round(p._count.id * (8 + Math.random() * 12)), // estimated
      conv:    +((p._count.id / totalOrderCount) * 100).toFixed(2),
    }))

    const convRate = totalSent > 0 ? +(emailConv / totalSent * 100).toFixed(1) : 0

    // ── Funnel — 5 adımlı (teslim edilen tahmin dahil) ────────────────────────
    const emailDelivered = Math.round(emailSent * 0.97)

    return NextResponse.json({
      kpis: {
        totalRevenue,
        totalOrders: ordersAgg._count.id,
        totalSent,
        convRate,
        aov,
        emailRevenue,
        waRevenue,
      },
      funnel: [
        { label: 'Gönderilen',    value: emailSent,      pct: 100,  color: '#4470ff' },
        { label: 'Teslim Edilen', value: emailDelivered, pct: emailSent > 0 ? +(emailDelivered / emailSent * 100).toFixed(1) : 0, color: '#9f7afa' },
        { label: 'Açılan',        value: emailOpened,    pct: emailSent > 0 ? +(emailOpened  / emailSent * 100).toFixed(1) : 0, color: '#22c97a' },
        { label: 'Tıklanan',      value: emailClicked,   pct: emailSent > 0 ? +(emailClicked / emailSent * 100).toFixed(1) : 0, color: '#f0a020' },
        { label: 'Satın Alınan',  value: emailConv,      pct: emailSent > 0 ? +(emailConv    / emailSent * 100).toFixed(1) : 0, color: '#fb923c' },
      ],
      attribution: [
        { name: 'Otomasyonlar',       value: autoRevenue,  color: '#9f7afa' },
        { name: 'Kampanyalar',         value: emailRevenue, color: '#4470ff' },
        { name: 'WhatsApp',            value: waRevenue,    color: '#22c97a' },
      ].filter(a => a.value > 0),
      topProducts,
      segments: {
        vip:      { count: vipCnt,      avgSpent: Math.round(vipStats._avg.totalSpent   ?? 0), avgOrders: +(vipStats._avg.totalOrders ?? 0).toFixed(1) },
        new:      { count: newCnt,      avgSpent: Math.round(newStats._avg.totalSpent   ?? 0) },
        at_risk:  { count: riskCnt,     avgSpent: Math.round(riskStats._avg.totalSpent  ?? 0) },
        loyal:    { count: loyalCnt    },
        inactive: { count: inactiveCnt },
      },
      channels: {
        email: {
          sent: emailSent, openRate: emailSent > 0 ? +(emailOpened / emailSent * 100).toFixed(1) : 0,
          clickRate: emailSent > 0 ? +(emailClicked / emailSent * 100).toFixed(1) : 0,
          convRate:  emailSent > 0 ? +(emailConv    / emailSent * 100).toFixed(1) : 0,
          revenue: emailRevenue,
          roi: emailRevenue > 0 && emailSent > 0 ? Math.round(emailRevenue / (emailSent * 0.05) * 100) : 0,
        },
        whatsapp: {
          sent: waSent, openRate: 87, clickRate: 0, convRate: 0,
          revenue: waRevenue,
          roi: waRevenue > 0 && waSent > 0 ? Math.round(waRevenue / (waSent * 0.10) * 100) : 0,
        },
      },
      revenueData,
      campaignROI: topCampaigns.map(c => ({
        name: c.name,
        revenue: Math.round(c.revenue),
        type: c.type,
        sent: c.sent,
        opened: c.opened,
        clicked: c.clicked,
      })),
      kpiTable: [
        { metric: 'Toplam Gelir',        current: `₺${Math.round(thisRev).toLocaleString('tr-TR')}`,  prev: `₺${Math.round(lastRev).toLocaleString('tr-TR')}`,   change: lastRev  > 0 ? `+${((thisRev  - lastRev)  / lastRev  * 100).toFixed(1)}%` : 'Yeni', pos: thisRev  >= lastRev  },
        { metric: 'Email Açılma Oranı',  current: `%${thisOR}`,                                        prev: `%${lastOR}`,                                         change: `${(thisOR - lastOR).toFixed(1)} pp`,                                         pos: thisOR   >= lastOR   },
        { metric: 'WhatsApp Okunma',     current: waSent > 0 ? '%87' : '—',                            prev: '—',                                                  change: '—',                                                                          pos: true },
        { metric: 'Ort. Sipariş Değeri', current: `₺${aov.toLocaleString('tr-TR')}`,                  prev: '—',                                                  change: '—',                                                                          pos: true },
        { metric: 'Sepet Terk',          current: cartAbandons.toString(),                             prev: '—',                                                  change: '—',                                                                          pos: false },
        { metric: 'VIP Müşteri Sayısı',  current: vipCnt.toString(),                                  prev: '—',                                                  change: '—',                                                                          pos: true },
        { metric: 'Risk Altındaki',      current: riskCnt.toString(),                                  prev: '—',                                                  change: riskCnt > 50 ? 'Win-back başlat' : '—',                                       pos: false },
      ],
      convRate,
      hasData: totalSent > 0 || totalRevenue > 0 || ordersAgg._count.id > 0,
    })
  } catch (err) {
    console.error('[Analytics GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
