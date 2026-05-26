import { prisma } from './prisma'

const WINDOW_DAYS = 30

export async function attributeRevenue(
  userId: string,
  customerId: string,
  orderId: string,
  orderTotal: number,
  orderPlacedAt: Date,
) {
  const windowStart = new Date(orderPlacedAt)
  windowStart.setDate(windowStart.getDate() - WINDOW_DAYS)

  // All clicks by this customer in the attribution window, oldest first
  const clicks = await prisma.campaignOpen.findMany({
    where: {
      customerId,
      channel: 'email_click',
      openedAt: { gte: windowStart, lte: orderPlacedAt },
    },
    orderBy: { openedAt: 'asc' },
  })

  if (clicks.length === 0) return

  // Deduplicate: keep last click per campaign (in chronological order)
  const seen = new Set<string>()
  const touches: Array<{ campaignId: string; clickedAt: Date }> = []
  for (const c of clicks) {
    if (!c.campaignId || seen.has(c.campaignId)) continue
    seen.add(c.campaignId)
    touches.push({ campaignId: c.campaignId, clickedAt: c.openedAt })
  }

  if (touches.length === 0) return

  const first = touches[0]
  const last = touches[touches.length - 1]
  const touchCount = touches.length

  const daysSince = (ref: Date) =>
    Math.max(0, Math.floor((orderPlacedAt.getTime() - ref.getTime()) / 86_400_000))

  type RevRecord = {
    userId: string; campaignId: string; orderId: string; customerId: string
    revenue: number; orderTotal: number; attributionType: string
    daysSinceClick: number; touchCount: number
  }

  const records: RevRecord[] = []

  // Last-click attribution: 100% credit to last campaign clicked
  records.push({
    userId, campaignId: last.campaignId, orderId, customerId,
    revenue: orderTotal, orderTotal,
    attributionType: 'last_click', daysSinceClick: daysSince(last.clickedAt), touchCount,
  })

  // First-click attribution: 100% credit to first campaign clicked
  if (first.campaignId !== last.campaignId) {
    records.push({
      userId, campaignId: first.campaignId, orderId, customerId,
      revenue: orderTotal, orderTotal,
      attributionType: 'first_click', daysSinceClick: daysSince(first.clickedAt), touchCount,
    })
  }

  // Assisted: equal share across all touched campaigns
  const share = orderTotal / touchCount
  for (const t of touches) {
    records.push({
      userId, campaignId: t.campaignId, orderId, customerId,
      revenue: share, orderTotal,
      attributionType: 'assisted', daysSinceClick: daysSince(t.clickedAt), touchCount,
    })
  }

  // Upsert attribution records
  for (const r of records) {
    await prisma.campaignRevenue.upsert({
      where: { orderId_campaignId_attributionType: { orderId: r.orderId, campaignId: r.campaignId, attributionType: r.attributionType } },
      create: r,
      update: { revenue: r.revenue },
    }).catch(() => null)
  }

  // Update campaign counters for last-click campaign (idempotent: check if already counted)
  const alreadyCounted = await prisma.campaignRevenue.count({
    where: { campaignId: last.campaignId, customerId, attributionType: 'last_click', orderId: { not: orderId } },
  })

  if (alreadyCounted === 0) {
    await prisma.campaign.update({
      where: { id: last.campaignId },
      data: { converted: { increment: 1 }, revenue: { increment: orderTotal } },
    }).catch(() => null)
  }
}
