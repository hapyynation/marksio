import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  await prisma.integration.updateMany({
    where: { userId: session.user.id, platform: 'shopify' },
    data: { status: 'disconnected', accessToken: null },
  })

  return NextResponse.json({ success: true })
}
