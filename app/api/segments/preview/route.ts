import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { matchesRules, type SegmentRule } from '@/lib/segment-engine'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const body = await req.json() as { rules: SegmentRule[]; matchType?: string }
  if (!body.rules?.length) return NextResponse.json({ count: 0 })

  const customers = await prisma.customer.findMany({
    where: { userId },
    select: {
      totalSpent: true, totalOrders: true, avgOrder: true,
      lastOrder: true, tags: true, source: true, segment: true, score: true,
    },
  })

  const matchType = (body.matchType ?? 'all') as 'all' | 'any'
  const count = customers.filter(c => matchesRules(c, body.rules, matchType)).length
  return NextResponse.json({ count })
}
