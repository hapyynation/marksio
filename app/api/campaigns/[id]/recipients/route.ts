import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as { id: string }).id

  const campaign = await prisma.campaign.findFirst({ where: { id: params.id, userId } })
  if (!campaign) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  // After a send: use CampaignRecipient records (have real status)
  const recipientCount = await prisma.campaignRecipient.count({ where: { campaignId: params.id } })

  if (recipientCount > 0) {
    const recipients = await prisma.campaignRecipient.findMany({
      where: { campaignId: params.id },
      include: { customer: { select: { id: true, name: true, segment: true } } },
      take: 50,
      orderBy: [{ sentAt: 'desc' }],
    })
    return NextResponse.json({
      customers: recipients.map(r => ({
        id:      r.customerId,
        name:    r.customer?.name ?? '-',
        email:   r.email,
        segment: r.customer?.segment ?? campaign.segment,
        status:  r.status,
        sentAt:  r.sentAt?.toISOString() ?? null,
      })),
      total: recipientCount,
    })
  }

  // Before send: query customers by segment
  const segmentFilter: Record<string, string> =
    campaign.segment && campaign.segment !== 'all' ? { segment: campaign.segment } : {}

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: { userId, unsubscribed: false, ...segmentFilter },
      select: { id: true, name: true, email: true, segment: true },
      take: 50,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where: { userId, unsubscribed: false, ...segmentFilter } }),
  ])

  return NextResponse.json({
    customers: customers.map(c => ({
      id:      c.id,
      name:    c.name,
      email:   c.email ?? '-',
      segment: c.segment,
      status:  'pending',
      sentAt:  null,
    })),
    total,
  })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as { id: string }).id

  const campaign = await prisma.campaign.findFirst({ where: { id: params.id, userId } })
  if (!campaign) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const { ids } = await req.json() as { ids: string[] }
  if (!ids?.length) return NextResponse.json({ error: 'ids zorunlu' }, { status: 400 })

  await prisma.campaignRecipient.deleteMany({
    where: { campaignId: params.id, customerId: { in: ids } },
  })

  return NextResponse.json({ success: true, removed: ids.length })
}
