import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const integrations = await prisma.integration.findMany({
    where: { userId: session.user.id },
    select: {
      id: true, platform: true, shopDomain: true, status: true,
      lastSyncAt: true, createdAt: true, meta: true,
    },
  })

  return NextResponse.json({ integrations })
}
