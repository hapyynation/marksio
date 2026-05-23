import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  await prisma.integration.updateMany({
    where: { userId: session.user.id, platform: 'whatsapp' },
    data: { status: 'disconnected' },
  })

  return NextResponse.json({ success: true })
}
