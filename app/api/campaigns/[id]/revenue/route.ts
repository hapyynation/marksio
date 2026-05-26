import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId },
    select: {
      id: true, sent: true, opened: true, clicked: true, converted: true,
      revenue: true, sentAt: true,
    },
  })
  if (!campaign) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  // ── Revenue attribution records (last_click only for primary metrics) ──
  const revenueRows = await prisma.campaignRevenue.findMany({
    where: { campaignId: params.id, attributionType: 'last_click' },
    include: {
      order: {
        include: { items: true, customer: { select: { segment: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  const totalRevenue = revenueRows.reduce((s, r) => s + r.revenue, 0)
  const conversions = new Set(revenueRows.map(r => r.customerId)).size
  const aov = conversions > 0 ? totalRevenue / conversions : 0
  const revenuePerRecipient = campaign.sent > 0 ? totalRevenue / campaign.sent : 0
  const conversionRate = campaign.sent > 0 ? (conversions / campaign.sent) * 100 : 0

  // ── Daily revenue chart (last 30 days or since send) ─────────────────
  const dailyMap: Record<string, number> = {}
  for (const r of revenueRows) {
    const day = r.createdAt.toISOString().slice(0, 10)
    dailyMap[day] = (dailyMap[day] ?? 0) + r.revenue
  }

  // Build 30-day series
  const today = new Date()
  const since = campaign.sentAt ? new Date(campaign.sentAt) : new Date(today.getTime() - 30 * 86400000)
  const revenueChart: Array<{ date: string; revenue: number; conversions: number }> = []
  const dayConvMap: Record<string, number> = {}
  for (const r of revenueRows) {
    const day = r.createdAt.toISOString().slice(0, 10)
    dayConvMap[day] = (dayConvMap[day] ?? 0) + 1
  }

  for (let d = new Date(since); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    revenueChart.push({ date: key, revenue: dailyMap[key] ?? 0, conversions: dayConvMap[key] ?? 0 })
  }

  // ── Conversion funnel ─────────────────────────────────────────────────
  const funnel = [
    { stage: 'Gönderildi',  value: campaign.sent,             pct: 100 },
    { stage: 'Açıldı',      value: campaign.opened,            pct: campaign.sent > 0 ? +((campaign.opened / campaign.sent) * 100).toFixed(1) : 0 },
    { stage: 'Tıklandı',    value: campaign.clicked,           pct: campaign.sent > 0 ? +((campaign.clicked / campaign.sent) * 100).toFixed(1) : 0 },
    { stage: 'Dönüştü',     value: conversions,                pct: campaign.sent > 0 ? +((conversions / campaign.sent) * 100).toFixed(1) : 0 },
  ]

  // ── Top products from attributed orders ───────────────────────────────
  const productMap: Record<string, { title: string; quantity: number; revenue: number }> = {}
  for (const r of revenueRows) {
    for (const item of r.order.items) {
      const key = item.title
      if (!productMap[key]) productMap[key] = { title: key, quantity: 0, revenue: 0 }
      productMap[key].quantity += item.quantity
      productMap[key].revenue += item.price * item.quantity
    }
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // ── Best segments ─────────────────────────────────────────────────────
  const segmentMap: Record<string, { count: number; revenue: number }> = {}
  for (const r of revenueRows) {
    const seg = r.order.customer?.segment ?? 'other'
    if (!segmentMap[seg]) segmentMap[seg] = { count: 0, revenue: 0 }
    segmentMap[seg].count++
    segmentMap[seg].revenue += r.revenue
  }
  const topSegments = Object.entries(segmentMap)
    .map(([segment, data]) => ({ segment, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return NextResponse.json({
    metrics: {
      totalRevenue,
      conversions,
      aov,
      revenuePerRecipient,
      conversionRate: +conversionRate.toFixed(1),
      sent: campaign.sent,
      opened: campaign.opened,
      clicked: campaign.clicked,
    },
    revenueChart,
    funnel,
    topProducts,
    topSegments,
  })
}
