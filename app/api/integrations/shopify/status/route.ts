import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { SyncMeta } from '@/lib/shopify'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const integration = await prisma.integration.findUnique({
    where: { userId_platform: { userId: session.user.id, platform: 'shopify' } },
    select: { id: true, status: true, shopDomain: true, lastSyncAt: true, meta: true },
  })

  if (!integration) {
    return NextResponse.json({ connected: false })
  }

  let meta: SyncMeta = {}
  try { meta = JSON.parse(integration.meta ?? '{}') as SyncMeta } catch {}

  return NextResponse.json({
    connected: integration.status === 'active',
    status: integration.status,
    shopDomain: integration.shopDomain,
    shopName: meta.shopName,
    lastSyncAt: integration.lastSyncAt,
    syncInProgress: meta.syncInProgress ?? false,
    webhooksRegistered: meta.webhooksRegistered ?? false,
    lastSync: meta.lastSync ?? null,
  })
}
