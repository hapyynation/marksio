import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const integration = await prisma.integration.findUnique({
    where: { userId_platform: { userId: session.user.id, platform: 'woocommerce' } },
    select: { id: true, status: true, lastSyncAt: true },
  })

  if (!integration || integration.status !== 'active') {
    return NextResponse.json({ status: 'disconnected', lastSyncAt: null, contactCount: 0, orderCount: 0 })
  }

  const [contactCount, orderCount] = await Promise.all([
    prisma.customer.count({ where: { userId: session.user.id, source: 'woocommerce' } }),
    prisma.order.count({ where: { integrationId: integration.id } }),
  ])

  return NextResponse.json({
    status: 'active',
    lastSyncAt: integration.lastSyncAt?.toISOString() ?? null,
    contactCount,
    orderCount,
  })
}
