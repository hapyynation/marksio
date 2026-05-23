import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  const { searchParams } = new URL(req.url)
  const segment = searchParams.get('segment')
  const search = searchParams.get('search')

  try {
    const customers = await prisma.customer.findMany({
      where: {
        userId,
        ...(segment && segment !== 'all' && { segment }),
        ...(search && {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(customers.map(c => ({
      ...c,
      tags: (() => { try { return JSON.parse(c.tags) } catch { return [] } })(),
    })))
  } catch (err) {
    console.error('[Customers GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
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
