import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const uid = session.user.id
  const { searchParams } = new URL(req.url)
  const page   = Math.max(1, Number(searchParams.get('page')  ?? 1))
  const limit  = Math.min(100, Number(searchParams.get('limit') ?? 20))
  const status = searchParams.get('status') ?? 'subscribed'
  const search = searchParams.get('search') ?? ''

  const where = {
    userId: uid,
    ...(status === 'unsubscribed' ? { unsubscribed: true } : { unsubscribed: false }),
    ...(search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { name:  { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  }

  const [customers, total, unsubscribedCount, activeCount] = await Promise.all([
    prisma.customer.findMany({
      where,
      select: {
        id: true, email: true, name: true, firstName: true, lastName: true,
        segment: true, tags: true, createdAt: true, unsubscribed: true,
        totalOrders: true, totalSpent: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where }),
    prisma.customer.count({ where: { userId: uid, unsubscribed: true } }),
    prisma.customer.count({ where: { userId: uid, unsubscribed: false } }),
  ])

  return NextResponse.json({
    customers,
    total,
    activeCount,
    unsubscribedCount,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
