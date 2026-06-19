import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const optInStatus = searchParams.get('optInStatus')
  const tag = searchParams.get('tag')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)

  const contacts = await prisma.whatsappContact.findMany({
    where: {
      userId: session.user.id,
      ...(optInStatus ? { optInStatus: optInStatus as 'OPTED_IN' | 'OPTED_OUT' | 'UNKNOWN' } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  })

  const total = await prisma.whatsappContact.count({
    where: {
      userId: session.user.id,
      ...(optInStatus ? { optInStatus: optInStatus as 'OPTED_IN' | 'OPTED_OUT' | 'UNKNOWN' } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    },
  })

  return NextResponse.json({ contacts, total, page, limit })
}
