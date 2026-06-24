import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const broadcast = await prisma.whatsappBroadcast.findFirst({
    where: { id: params.id, account: { userId: session.user.id } },
    include: {
      template: { select: { name: true, category: true, language: true, componentsJson: true } },
      conversions: { select: { revenue: true, createdAt: true } },
      messages: {
        select: { status: true, sentAt: true },
        orderBy: { sentAt: 'asc' },
      },
    },
  })

  if (!broadcast) return NextResponse.json({ error: 'Broadcast bulunamadı.' }, { status: 404 })

  const convRevenue = broadcast.conversions.reduce((a, c) => a + c.revenue, 0)
  const totalRevenue = broadcast.revenue + convRevenue
  const cost = broadcast.sentCount * 0.15
  const roi = cost > 0 ? totalRevenue / cost : 0

  const hourlyCounts: Record<number, { sent: number; delivered: number; read: number }> = {}
  for (const msg of broadcast.messages) {
    const h = new Date(msg.sentAt).getHours()
    if (!hourlyCounts[h]) hourlyCounts[h] = { sent: 0, delivered: 0, read: 0 }
    if (msg.status === 'SENT' || msg.status === 'DELIVERED' || msg.status === 'READ') hourlyCounts[h].sent++
    if (msg.status === 'DELIVERED' || msg.status === 'READ') hourlyCounts[h].delivered++
    if (msg.status === 'READ') hourlyCounts[h].read++
  }

  const hourlyStats = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${String(h).padStart(2, '0')}:00`,
    ...(hourlyCounts[h] ?? { sent: 0, delivered: 0, read: 0 }),
  })).filter(h => h.sent > 0)

  let bodyText = ''
  try {
    const comps = broadcast.template?.componentsJson as Array<{ type: string; text?: string }> | undefined
    bodyText = comps?.find(c => c.type === 'BODY')?.text ?? ''
  } catch { /* */ }

  return NextResponse.json({
    broadcast: {
      id: broadcast.id,
      name: broadcast.name,
      description: broadcast.description,
      demo: broadcast.demo,
      templateName: broadcast.template?.name ?? 'Demo',
      templateBody: bodyText,
      templateCategory: broadcast.template?.category ?? 'MARKETING',
      segmentId: broadcast.segmentId,
      segmentName: broadcast.segmentId ?? 'Tüm Aboneler',
      status: broadcast.status === 'COMPLETED' ? 'SENT' : broadcast.status,
      sendType: broadcast.sendType ?? 'IMMEDIATE',
      scheduledAt: broadcast.scheduledAt?.toISOString() ?? null,
      createdAt: broadcast.createdAt?.toISOString() ?? null,
      updatedAt: broadcast.updatedAt?.toISOString() ?? null,
      stats: {
        total: broadcast.totalRecipients,
        sent: broadcast.sentCount,
        delivered: broadcast.deliveredCount,
        read: broadcast.readCount,
        clicked: broadcast.clickCount ?? 0,
        converted: broadcast.convertedCount + broadcast.conversions.length,
        failed: broadcast.failedCount,
        revenue: Math.round(totalRevenue),
        roi: Math.round(roi * 10) / 10,
        deliveryRate: broadcast.sentCount > 0 ? Math.round((broadcast.deliveredCount / broadcast.sentCount) * 100) : 0,
        readRate: broadcast.sentCount > 0 ? Math.round((broadcast.readCount / broadcast.sentCount) * 100) : 0,
        clickRate: broadcast.sentCount > 0 ? Math.round(((broadcast.clickCount ?? 0) / broadcast.sentCount) * 100) : 0,
        conversionRate: broadcast.sentCount > 0 ? Math.round(((broadcast.convertedCount + broadcast.conversions.length) / broadcast.sentCount) * 100) : 0,
      },
    },
    hourlyStats,
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const broadcast = await prisma.whatsappBroadcast.findFirst({
    where: { id: params.id, account: { userId: session.user.id } },
    select: { id: true, status: true },
  })
  if (!broadcast) return NextResponse.json({ error: 'Broadcast bulunamadı.' }, { status: 404 })
  if (broadcast.status !== 'DRAFT' && broadcast.status !== 'SCHEDULED') {
    return NextResponse.json({ error: 'Gönderilmiş broadcast düzenlenemez.' }, { status: 409 })
  }

  const body = await req.json() as {
    name?: string
    description?: string
    templateId?: string
    segmentId?: string
    scheduledAt?: string | null
    sendType?: string
  }

  const updated = await prisma.whatsappBroadcast.update({
    where: { id: params.id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.templateId && { templateId: body.templateId }),
      ...(body.segmentId !== undefined && { segmentId: body.segmentId }),
      ...(body.scheduledAt !== undefined && {
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      }),
      ...(body.sendType && { sendType: body.sendType }),
      ...(body.sendType === 'SCHEDULED' && body.scheduledAt && { status: 'SCHEDULED' }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const broadcast = await prisma.whatsappBroadcast.findFirst({
    where: { id: params.id, account: { userId: session.user.id } },
    select: { id: true, status: true },
  })
  if (!broadcast) return NextResponse.json({ error: 'Broadcast bulunamadı.' }, { status: 404 })
  if (broadcast.status === 'SENDING') {
    return NextResponse.json({ error: 'Gönderilen broadcast silinemez.' }, { status: 409 })
  }

  await prisma.whatsappBroadcast.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
