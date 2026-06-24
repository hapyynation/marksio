import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function POST() {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const userId = session.user.id

  const account = await prisma.whatsappAccount.upsert({
    where: { phoneNumberId: `DEMO_${userId.slice(0, 8)}` },
    create: {
      userId,
      wabaId: 'DEMO_WABA',
      phoneNumberId: `DEMO_${userId.slice(0, 8)}`,
      accessToken: 'demo_token',
      appSecret: 'demo_secret',
      displayName: 'Demo Hesabı',
      status: 'CONNECTED',
      isDemo: true,
      webhookVerifyToken: `demo_wh_${userId.slice(0, 12)}`,
    },
    update: {},
  })

  const broadcast = await prisma.whatsappBroadcast.create({
    data: {
      accountId: account.id,
      name: 'Demo Broadcast — Yaz İndirimi',
      description: 'Bu bir demo broadcast\'tir. Gerçek gönderim yapılmamıştır.',
      segmentId: null,
      status: 'COMPLETED',
      sendType: 'IMMEDIATE',
      totalRecipients: 1547,
      sentCount: 1523,
      deliveredCount: 1389,
      readCount: 892,
      clickCount: 143,
      convertedCount: 38,
      failedCount: 24,
      revenue: 14820.50,
      demo: true,
      userId,
    },
  })

  return NextResponse.json({ ok: true, broadcastId: broadcast.id })
}
