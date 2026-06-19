import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''

  const contacts = await prisma.whatsappContact.findMany({
    where: {
      userId: session.user.id,
      ...(search ? {
        OR: [
          { phoneNumber: { contains: search } },
        ],
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  const subscribers = contacts.map(c => ({
    id: c.id,
    phone: c.phoneNumber,
    name: null as string | null,
    optIn: c.optInStatus === 'OPTED_IN',
    lastMessageAt: c.lastInboundAt?.toISOString() ?? null,
    tags: c.tags,
  }))

  return NextResponse.json({ subscribers })
}
