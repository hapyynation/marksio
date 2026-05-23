import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const integrations = await prisma.integration.findMany({
    where: { userId: session.user.id },
    select: {
      id: true, platform: true, shopDomain: true, status: true,
      lastSyncAt: true, createdAt: true,
    },
  })

  return NextResponse.json({ integrations })
}
