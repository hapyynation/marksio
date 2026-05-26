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
        select: {
          id: true, name: true, type: true, status: true, segment: true,
          subject: true, purpose: true, sent: true, opened: true,
          clicked: true, converted: true, revenue: true, createdAt: true,
          scheduledAt: true,
          emailEvents: {
            select: { type: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      if (!campaign) return NextResponse.json({ error: 'Kampanya bulunamadı' }, { status: 404 })

      const events = campaign.emailEvents
      const sentCount = events.filter(e => e.type === 'sent').length || campaign.sent
      const openedCount = events.filter(e => e.type === 'opened').length || campaign.opened
      const clickedCount = events.filter(e => e.type === 'clicked').length || campaign.clicked
      const failedCount = events.filter(e => e.type === 'failed').length

      return NextResponse.json({
        ...campaign,
        metrics: {
          sent: sentCount,
          opened: openedCount,
          clicked: clickedCount,
          failed: failedCount,
          converted: campaign.converted,
          openRate: sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0,
          clickRate: sentCount > 0 ? Math.round((clickedCount / sentCount) * 100) : 0,
        },
      })
    }

    // List all campaigns with analytics
    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      select: {
        id: true, name: true, type: true, status: true, segment: true,
        purpose: true, sent: true, opened: true, clicked: true,
        converted: true, revenue: true, createdAt: true,
        _count: { select: { emailEvents: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(campaigns.map(c => ({
      ...c,
      openRate: c.sent > 0 ? Math.round((c.opened / c.sent) * 100) : 0,
      clickRate: c.sent > 0 ? Math.round((c.clicked / c.sent) * 100) : 0,
    })))
  } catch (err) {
    console.error('[Campaign Analytics]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
