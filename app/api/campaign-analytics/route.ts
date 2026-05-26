import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  try {
    if (id) {
      const campaign = await prisma.campaign.findFirst({
        where: { id, userId },
        include: {
          emailEvents: {
            select: { type: true, createdAt: true, openedAt: true, clickedAt: true, bouncedAt: true, failedReason: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      if (!campaign) return NextResponse.json({ error: 'Kampanya bulunamadı' }, { status: 404 })

      const events = campaign.emailEvents
      const countBy = (t: string) => events.filter(e => e.type === t).length

      const sent = countBy('sent') || campaign.sent
      const delivered = countBy('delivered')
      const opened = countBy('opened') || campaign.opened
      const clicked = countBy('clicked') || campaign.clicked
      const bounced = countBy('bounced')
      const complained = countBy('complained')
      const failed = countBy('failed')
      const unsubscribed = countBy('unsubscribed')

      const base = delivered || sent
      const openRate = base > 0 ? +(((opened / base) * 100).toFixed(1)) : 0
      const clickRate = base > 0 ? +(((clicked / base) * 100).toFixed(1)) : 0
      const bounceRate = sent > 0 ? +(((bounced / sent) * 100).toFixed(1)) : 0
      const conversionScore = Math.round((openRate * 0.4) + (clickRate * 0.6))

      return NextResponse.json({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        createdAt: campaign.createdAt,
        sentAt: campaign.sentAt,
        metrics: {
          sent, delivered, opened, clicked, bounced,
          complained, failed, unsubscribed,
          openRate, clickRate, bounceRate, conversionScore,
        },
      })
    }

    // List all campaigns with summary analytics
    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      select: {
        id: true, name: true, type: true, status: true, segment: true,
        purpose: true, sent: true, opened: true, clicked: true,
        converted: true, revenue: true, createdAt: true, sentAt: true,
        _count: { select: { emailEvents: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(campaigns.map(c => ({
      ...c,
      openRate: c.sent > 0 ? +((c.opened / c.sent) * 100).toFixed(1) : 0,
      clickRate: c.sent > 0 ? +((c.clicked / c.sent) * 100).toFixed(1) : 0,
    })))
  } catch (err) {
    console.error('[Campaign Analytics]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
