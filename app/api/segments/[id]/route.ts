import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { matchesRules, type SegmentRule } from '@/lib/segment-engine'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const segment = await prisma.segment.findFirst({ where: { id: params.id, userId } })
  if (!segment) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  let rules: SegmentRule[] = []
  try { rules = JSON.parse(segment.rules) } catch { /* */ }
  return NextResponse.json({ ...segment, rules })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const existing = await prisma.segment.findFirst({ where: { id: params.id, userId } })
  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const body = await req.json() as {
    name?: string; description?: string; rules?: SegmentRule[]
    matchType?: string; color?: string; icon?: string; active?: boolean
  }

  // Recompute count when rules change
  let count = existing.count
  if (body.rules !== undefined) {
    const rules = body.rules
    const matchType = ((body.matchType ?? existing.matchType) ?? 'all') as 'all' | 'any'
    const customers = await prisma.customer.findMany({
      where: { userId },
      select: {
        totalSpent: true, totalOrders: true, avgOrder: true,
        lastOrder: true, tags: true, source: true, segment: true, score: true,
      },
    })
    count = customers.filter(c => matchesRules(c, rules, matchType)).length
  }

  const updated = await prisma.segment.update({
    where: { id: params.id },
    data: {
      ...(body.name        !== undefined && { name:        body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.rules       !== undefined && { rules:       JSON.stringify(body.rules), count }),
      ...(body.matchType   !== undefined && { matchType:   body.matchType }),
      ...(body.color       !== undefined && { color:       body.color }),
      ...(body.icon        !== undefined && { icon:        body.icon }),
      ...(body.active      !== undefined && { active:      body.active }),
    },
  })

  let rules: SegmentRule[] = []
  try { rules = JSON.parse(updated.rules) } catch { /* */ }
  return NextResponse.json({ ...updated, rules, count: body.rules !== undefined ? count : updated.count })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const existing = await prisma.segment.findFirst({ where: { id: params.id, userId } })
  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  if (existing.type === 'builtin') {
    return NextResponse.json({ error: 'Varsayılan segmentler silinemez' }, { status: 400 })
  }

  await prisma.segment.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
