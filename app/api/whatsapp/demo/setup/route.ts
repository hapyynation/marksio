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

  return NextResponse.json({ ok: true, accountId: account.id, isDemo: true })
}
