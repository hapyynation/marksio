import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const uid = session.user.id

  const [customers, campaigns, segments, automations] = await Promise.all([
    prisma.customer.findMany({
      where: { userId: uid },
      select: {
        id: true, name: true, email: true, phone: true,
        segment: true, totalOrders: true, totalSpent: true,
        lastOrder: true, unsubscribed: true, createdAt: true,
      },
    }),
    prisma.campaign.findMany({
      where: { userId: uid },
      select: {
        id: true, name: true, type: true, status: true,
        subject: true, sent: true, opened: true, clicked: true,
        revenue: true, sentAt: true, createdAt: true,
      },
    }),
    prisma.segment.findMany({
      where: { userId: uid },
      select: { id: true, name: true, type: true, count: true, createdAt: true },
    }),
    prisma.automation.findMany({
      where: { userId: uid },
      select: {
        id: true, name: true, trigger: true, status: true,
        sent: true, converted: true, revenue: true, createdAt: true,
      },
    }),
  ])

  const exportData = {
    exportedAt: new Date().toISOString(),
    customers,
    campaigns,
    segments,
    automations,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="marksio-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
