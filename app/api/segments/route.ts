import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  try {
    const segments = await prisma.segment.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
    })
    const customerCounts = await prisma.customer.groupBy({
      by: ['segment'],
      where: { userId },
      _count: { segment: true },
    })
    const countMap: Record<string, number> = {}
    customerCounts.forEach(c => { countMap[c.segment] = c._count.segment })
    return NextResponse.json(segments.map(s => ({
      ...s,
      rules: (() => { try { return JSON.parse(s.rules) } catch { return [] } })(),
      count: countMap[s.name.toLowerCase().replace(/ /g, '_')] ?? s.count,
    })))
  } catch (err) {
    console.error('[Segments GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  try {
    const body = await req.json()
    const segment = await prisma.segment.create({
      data: {
        userId,
        name: body.name,
        description: body.description,
        type: 'custom',
        rules: JSON.stringify(body.rules ?? []),
        color: body.color ?? 'violet',
        icon: body.icon ?? 'Users',
      },
    })
    return NextResponse.json({ ...segment, rules: JSON.parse(segment.rules) }, { status: 201 })
  } catch (err) {
    console.error('[Segments POST]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
