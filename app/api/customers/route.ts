import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const { searchParams } = new URL(req.url)
  const segment = searchParams.get('segment')
  const search = searchParams.get('search')
  const pageParam = searchParams.get('page')
  const limitParam = searchParams.get('limit')

  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : null
  const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 20

  const where = {
    userId,
    ...(segment && segment !== 'all' && { segment }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ],
    }),
  }

  try {
    if (page === null) {
      // Legacy: return plain array for backward compatibility
      const customers = await prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(customers.map(c => ({
        ...c,
        tags: (() => { try { return JSON.parse(c.tags) } catch { return [] } })(),
      })))
    }

    // Paginated response
    const [customers, total, stats] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customer.count({ where }),
      // Global stats (unfiltered) for KPI cards
      prisma.customer.groupBy({
        by: ['segment'],
        where: { userId },
        _count: { id: true },
        _sum: { totalSpent: true },
      }),
    ])

    const segmentStats = Object.fromEntries(stats.map(s => [s.segment, s._count.id]))
    const totalSpentAll = stats.reduce((acc, s) => acc + (s._sum.totalSpent ?? 0), 0)
    const totalAll = stats.reduce((acc, s) => acc + s._count.id, 0)

    return NextResponse.json({
      customers: customers.map(c => ({
        ...c,
        tags: (() => { try { return JSON.parse(c.tags) } catch { return [] } })(),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
      stats: {
        total: totalAll,
        active: totalAll - (segmentStats['inactive'] ?? 0),
        new: segmentStats['new'] ?? 0,
        vip: segmentStats['vip'] ?? 0,
        atRisk: segmentStats['at_risk'] ?? 0,
        totalSpentAll,
      },
    })
  } catch (err) {
    console.error('[Customers GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  try {
    const body = await req.json()
    const customer = await prisma.customer.create({
      data: {
        userId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        segment: body.segment ?? 'new',
        totalOrders: body.totalOrders ?? 0,
        totalSpent: body.totalSpent ?? 0,
        avgOrder: body.avgOrder ?? 0,
        tags: JSON.stringify(body.tags ?? []),
        score: body.score ?? 50,
      },
    })
    return NextResponse.json({ ...customer, tags: JSON.parse(customer.tags) }, { status: 201 })
  } catch (err) {
    console.error('[Customers POST]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
