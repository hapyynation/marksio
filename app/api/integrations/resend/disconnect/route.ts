import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.integration.deleteMany({
    where: { userId: session.user.id, platform: 'resend' },
  })

  return NextResponse.json({ ok: true })
}
