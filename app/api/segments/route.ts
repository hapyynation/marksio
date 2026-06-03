import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { matchesRules, seedDefaultSegments, type SegmentRule } from '@/lib/segment-engine'

// ─── GET /api/segments ────────────────────────────────────────────────────────

export async function GET() {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  try {
    let segments = await prisma.segment.findMany({
      where: { userId },
      orderBy: [{ type: 'desc' }, { createdAt: 'asc' }],
    })

    // First visit: seed default segments
    if (segments.length === 0) {
      segments = await seedDefaultSegments(userId)
    }

    // Compute real counts from customer data
    const customers = await prisma.customer.findMany({
      where: { userId },
      select: {
        totalSpent: true, totalOrders: true, avgOrder: true,
        lastOrder: true, tags: true, source: true, segment: true, score: true,
      },
    })

    return NextResponse.json(
      segments.map(s => {
        let rules: SegmentRule[] = []
        try { rules = JSON.parse(s.rules) } catch { /* */ }
        const matchType = (s.matchType ?? 'all') as 'all' | 'any'
        const count = customers.filter(c => matchesRules(c, rules, matchType)).length
        return { ...s, rules, count }
      })
    )
  } catch (err) {
    console.error('[Segments GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// ─── POST /api/segments ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  try {
    const body = await req.json() as {
      name: string; description?: string; rules?: SegmentRule[]
      matchType?: string; color?: string; icon?: string
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Segment adı gerekli' }, { status: 400 })
    }

    const rules = body.rules ?? []
    const matchType = (body.matchType ?? 'all') as 'all' | 'any'

    // Compute initial count
    const customers = await prisma.customer.findMany({
      where: { userId },
      select: {
        totalSpent: true, totalOrders: true, avgOrder: true,
        lastOrder: true, tags: true, source: true, segment: true, score: true,
      },
    })
    const count = customers.filter(c => matchesRules(c, rules, matchType)).length

    const segment = await prisma.segment.create({
      data: {
        userId,
        name:        body.name.trim(),
        description: body.description?.trim() ?? null,
        type:        'custom',
        rules:       JSON.stringify(rules),
        matchType,
        color:       body.color ?? '#4470ff',
        icon:        body.icon ?? '👥',
        count,
        active:      true,
      },
    })

    return NextResponse.json({ ...segment, rules, count }, { status: 201 })
  } catch (err) {
    console.error('[Segments POST]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
