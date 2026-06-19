import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateHealthScore } from '@/lib/resend-api'

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const uid = session.user.id
  const { searchParams } = new URL(req.url)
  const period = (searchParams.get('period') ?? '30d') as '7d' | '30d' | '90d'
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const emailDomain = await prisma.emailDomain.findFirst({
    where: { userId: uid, status: 'verified' },
    select: { domain: true },
  })

  const [sent, delivered, opened, clicked, bounced, complained, unsubscribed] = await Promise.all([
    prisma.emailEvent.count({ where: { campaign: { userId: uid }, type: 'sent',         createdAt: { gte: startDate } } }),
    prisma.emailEvent.count({ where: { campaign: { userId: uid }, type: 'delivered',    createdAt: { gte: startDate } } }),
    prisma.emailEvent.count({ where: { campaign: { userId: uid }, type: 'opened',       createdAt: { gte: startDate } } }),
    prisma.emailEvent.count({ where: { campaign: { userId: uid }, type: 'clicked',      createdAt: { gte: startDate } } }),
    prisma.emailEvent.count({ where: { campaign: { userId: uid }, type: 'bounced',      createdAt: { gte: startDate } } }),
    prisma.emailEvent.count({ where: { campaign: { userId: uid }, type: 'complained',   createdAt: { gte: startDate } } }),
    prisma.emailEvent.count({ where: { campaign: { userId: uid }, type: 'unsubscribed', createdAt: { gte: startDate } } }),
  ])

  interface DailyRow { date: Date; sent: bigint; opened: bigint; clicked: bigint; bounced: bigint }
  const rawTrend = await prisma.$queryRaw<DailyRow[]>`
    SELECT
      DATE("createdAt") as date,
      COUNT(CASE WHEN type = 'sent'    THEN 1 END) as sent,
      COUNT(CASE WHEN type = 'opened'  THEN 1 END) as opened,
      COUNT(CASE WHEN type = 'clicked' THEN 1 END) as clicked,
      COUNT(CASE WHEN type = 'bounced' THEN 1 END) as bounced
    FROM "EmailEvent" ee
    JOIN "Campaign" c ON c.id = ee."campaignId"
    WHERE c."userId" = ${uid}
      AND ee."createdAt" >= ${startDate}
    GROUP BY DATE(ee."createdAt")
    ORDER BY date ASC
  `

  const dailyTrend = rawTrend.map(r => ({
    date:    r.date.toISOString().slice(0, 10),
    sent:    Number(r.sent),
    opened:  Number(r.opened),
    clicked: Number(r.clicked),
    bounced: Number(r.bounced),
  }))

  const bounceRate    = sent > 0 ? (bounced    / sent)      * 100 : 0
  const complaintRate = sent > 0 ? (complained / sent)      * 100 : 0
  const openRate      = delivered > 0 ? (opened    / delivered) * 100 : 0
  const deliveryRate  = sent > 0 ? (delivered  / sent)      * 100 : 0
  const clickRate     = opened > 0 ? (clicked   / opened)   * 100 : 0
  const unsubRate     = sent > 0 ? (unsubscribed / sent)    * 100 : 0

  const { score, status } = calculateHealthScore({ bounceRate, complaintRate, openRate, deliveryRate })

  await prisma.emailHealthScore.upsert({
    where:  { userId: uid },
    create: { userId: uid, score, status, bounceRate, complaintRate, openRate, deliveryRate, unsubscribeRate: unsubRate },
    update: { score, status, bounceRate, complaintRate, openRate, deliveryRate, unsubscribeRate: unsubRate, lastCalculated: new Date() },
  })

  const r = (v: number, d = 1) => Math.round(v * Math.pow(10, d)) / Math.pow(10, d)

  return NextResponse.json({
    period,
    domain: emailDomain?.domain ?? null,
    summary: { sent, delivered, opened, clicked, bounced, complained, unsubscribed },
    rates: {
      deliveryRate:    r(deliveryRate),
      openRate:        r(openRate),
      clickRate:       r(clickRate),
      bounceRate:      r(bounceRate, 2),
      complaintRate:   r(complaintRate, 2),
      unsubscribeRate: r(unsubRate, 2),
    },
    dailyTrend,
    health: { score, status },
  })
}
