import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

const TIER_LIMITS: Record<string, number> = {
  TIER_250:  250,
  TIER_1K:   1000,
  TIER_10K:  10000,
  TIER_100K: 100000,
  UNLIMITED: 999999,
}

export async function GET() {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const account = await prisma.whatsappAccount.findFirst({
    where: { userId: session.user.id, status: { not: 'DISCONNECTED' } },
    orderBy: [{ isDemo: 'asc' }, { connectedAt: 'desc' }],
    select: {
      id: true,
      displayName: true,
      verifiedName: true,
      phoneNumberId: true,
      qualityRating: true,
      messagingTier: true,
      status: true,
      isDemo: true,
      lastWebhookAt: true,
      accessToken: true,
    },
  })

  if (!account) return NextResponse.json({ health: null })

  // Count today's outbound messages
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const sentToday = await prisma.whatsappMessage.count({
    where: {
      conversation: { accountId: account.id },
      direction: 'OUTBOUND',
      sentAt: { gte: startOfDay },
      status: { in: ['SENT', 'DELIVERED', 'READ'] },
    },
  })

  const health = {
    accountId: account.id,
    connectionStatus: account.status === 'CONNECTED' ? 'connected' : 'error',
    phoneNumber: account.displayName ?? account.phoneNumberId,
    displayName: account.displayName ?? null,
    verifiedName: account.verifiedName ?? null,
    qualityRating: account.qualityRating,
    messagingTierLimit: TIER_LIMITS[account.messagingTier] ?? 250,
    messagingTierUsed: sentToday,
    lastWebhookAt: account.lastWebhookAt?.toISOString() ?? null,
    hasMetaToken: true,
    isDemo: account.isDemo,
  }

  return NextResponse.json({ health })
}
