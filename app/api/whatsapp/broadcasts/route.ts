import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function GET() {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const raw = await prisma.whatsappBroadcast.findMany({
    where: { account: { userId: session.user.id } },
    include: {
      template: { select: { name: true, category: true, componentsJson: true } },
      conversions: { select: { revenue: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const broadcasts = raw.map(b => {
    const convRevenue = b.conversions.reduce((a, c) => a + c.revenue, 0)
    const totalRevenue = b.revenue + convRevenue
    const cost = b.sentCount * 0.15
    const roi = cost > 0 ? totalRevenue / cost : 0

    let bodyPreview = ''
    try {
      const comps = b.template?.componentsJson as Array<{ type: string; text?: string }> | undefined
      const body = comps?.find(c => c.type === 'BODY')
      bodyPreview = body?.text?.slice(0, 100) ?? ''
    } catch { /* */ }

    return {
      id: b.id,
      name: b.name,
      description: b.description ?? null,
      demo: b.demo,
      templateName: b.template?.name ?? 'Demo',
      templateBody: bodyPreview,
      templateCategory: b.template?.category ?? 'MARKETING',
      segmentId: b.segmentId,
      segmentName: b.segmentId ?? 'Tüm Aboneler',
      status: b.status === 'COMPLETED' ? 'SENT' : b.status,
      sendType: b.sendType ?? 'IMMEDIATE',
      scheduledAt: b.scheduledAt?.toISOString() ?? null,
      sentAt: b.status === 'COMPLETED' ? b.updatedAt?.toISOString() ?? null : null,
      createdAt: b.createdAt?.toISOString() ?? new Date().toISOString(),
      stats: {
        total: b.totalRecipients,
        sent: b.sentCount,
        delivered: b.deliveredCount,
        read: b.readCount,
        clicked: b.clickCount ?? 0,
        converted: b.convertedCount + b.conversions.length,
        failed: b.failedCount,
        revenue: Math.round(totalRevenue),
        roi: Math.round(roi * 10) / 10,
      },
    }
  })

  const totalSent = broadcasts.reduce((a, b) => a + b.stats.sent, 0)
  const totalDelivered = broadcasts.reduce((a, b) => a + b.stats.delivered, 0)
  const totalRead = broadcasts.reduce((a, b) => a + b.stats.read, 0)
  const totalClicked = broadcasts.reduce((a, b) => a + b.stats.clicked, 0)
  const totalConverted = broadcasts.reduce((a, b) => a + b.stats.converted, 0)
  const totalRevenue = broadcasts.reduce((a, b) => a + b.stats.revenue, 0)
  const roiValues = broadcasts.filter(b => b.stats.roi > 0).map(b => b.stats.roi)
  const avgRoi = roiValues.length > 0 ? roiValues.reduce((a, v) => a + v, 0) / roiValues.length : 0

  const kpis = {
    total: broadcasts.length,
    totalSent,
    totalDelivered,
    deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
    totalRead,
    readRate: totalSent > 0 ? Math.round((totalRead / totalSent) * 100) : 0,
    totalClicked,
    clickRate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
    totalConverted,
    totalRevenue,
    avgRoi: Math.round(avgRoi * 10) / 10,
  }

  return NextResponse.json({ broadcasts, kpis })
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as {
    accountId?: string
    templateId?: string
    segmentId?: string
    name?: string
    description?: string
    scheduledAt?: string
    sendType?: string
  }

  if (!body.accountId || !body.templateId || !body.name) {
    return NextResponse.json({ error: 'accountId, templateId ve name zorunludur.' }, { status: 400 })
  }

  const account = await prisma.whatsappAccount.findFirst({
    where: { id: body.accountId, userId: session.user.id },
    select: { id: true },
  })
  if (!account) return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 })

  const broadcast = await prisma.whatsappBroadcast.create({
    data: {
      accountId: body.accountId,
      templateId: body.templateId,
      segmentId: body.segmentId ?? null,
      name: body.name,
      description: body.description ?? null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      sendType: body.sendType ?? 'IMMEDIATE',
      status: 'DRAFT',
      userId: session.user.id,
    },
  })

  return NextResponse.json(broadcast, { status: 201 })
}
