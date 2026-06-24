import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const broadcast = await prisma.whatsappBroadcast.findFirst({
    where: { id: params.id, account: { userId: session.user.id } },
    include: { template: { select: { name: true } } },
  })
  if (!broadcast) return NextResponse.json({ error: 'Broadcast bulunamadı.' }, { status: 404 })

  const body = await req.json() as {
    templateBId?: string
    trafficA?: number
    name?: string
  }

  if (!body.templateBId) {
    return NextResponse.json({ error: 'templateBId zorunludur.' }, { status: 400 })
  }

  const templateB = await prisma.whatsappTemplate.findFirst({
    where: { id: body.templateBId, account: { userId: session.user.id } },
    select: { name: true },
  })
  if (!templateB) return NextResponse.json({ error: 'B şablonu bulunamadı.' }, { status: 404 })

  const trafficA = body.trafficA ?? 50
  const trafficB = 100 - trafficA

  const abTest = await prisma.aBTest.create({
    data: {
      userId: session.user.id,
      name: body.name ?? `${broadcast.name} — A/B Testi`,
      campaignId: null,
      variantA: {
        templateName: broadcast.template?.name ?? 'Demo',
        broadcastId: broadcast.id,
        traffic: trafficA,
        readRate: broadcast.sentCount > 0 ? Math.round((broadcast.readCount / broadcast.sentCount) * 100 * 10) / 10 : 0,
      },
      variantB: {
        templateName: templateB.name,
        templateId: body.templateBId,
        traffic: trafficB,
        readRate: 0,
      },
      splitPercent: trafficA,
      status: 'running',
      startedAt: new Date(),
    },
  })

  return NextResponse.json({ id: abTest.id }, { status: 201 })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const broadcast = await prisma.whatsappBroadcast.findFirst({
    where: { id: params.id, account: { userId: session.user.id } },
    select: { id: true, name: true, template: { select: { name: true } } },
  })
  if (!broadcast) return NextResponse.json({ error: 'Broadcast bulunamadı.' }, { status: 404 })

  const abTests = await prisma.aBTest.findMany({
    where: {
      userId: session.user.id,
      variantA: { path: ['broadcastId'], equals: params.id },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ abTests })
}
