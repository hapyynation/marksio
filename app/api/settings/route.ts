import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { storeName: true, currency: true, language: true, timezone: true },
  })

  return NextResponse.json({
    storeName: user?.storeName ?? session.user.storeName,
    currency: user?.currency ?? 'TRY',
    language: user?.language ?? 'tr',
    timezone: user?.timezone ?? 'Europe/Istanbul',
  })
}
