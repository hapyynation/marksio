import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function GET() {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const raw = await prisma.whatsappBroadcast.findMany({
    where: { account: { userId: session.user.id } },
    include: { template: { select: { name: true } } },
    orderBy: { scheduledAt: 'desc' },
  })

  const broadcasts = raw.map(b => ({
    id: b.id,
    name: b.name,
    templateName: b.template.name,
    segmentName: b.segmentId ?? 'Tüm Aboneler',
    status: b.status === 'COMPLETED' ? 'SENT' : b.status,
    scheduledAt: b.scheduledAt?.toISOString() ?? null,
    sentAt: b.status === 'COMPLETED' ? b.template.name : null,
    stats: {
      sent: b.sentCount,
      delivered: b.deliveredCount,
      read: b.readCount,
    },
  }))

  return NextResponse.json({ broadcasts })
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as {
    accountId?: string
    templateId?: string
    segmentId?: string
    name?: string
    scheduledAt?: string
  }

  if (!body.accountId || !body.templateId || !body.name) {
    return NextResponse.json({ error: 'accountId, templateId ve name zorunludur.' }, { status: 400 })
  }

  // Hesabın bu kullanıcıya ait olduğunu doğrula
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
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      status: 'DRAFT',
    },
  })

  return NextResponse.json(broadcast, { status: 201 })
}
