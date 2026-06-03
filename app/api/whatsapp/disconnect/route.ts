import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    await prisma.whatsAppSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        metaAccessToken: null,
        phoneNumberId: null,
        businessAccountId: null,
        appSecret: null,
        connectionStatus: 'disconnected',
      },
      update: {
        metaAccessToken: null,
        phoneNumberId: null,
        businessAccountId: null,
        appSecret: null,
        connectionStatus: 'disconnected',
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}
