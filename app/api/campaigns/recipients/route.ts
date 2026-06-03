import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const segment = new URL(req.url).searchParams.get('segment') ?? 'all'

  try {
    const where = {
      userId,
      unsubscribed: false,
      ...(segment !== 'all' ? { segment } : {}),
    }
    const count = await prisma.customer.count({ where })
    return NextResponse.json({ count, segment })
  } catch (err) {
    console.error('[Recipients Count]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
