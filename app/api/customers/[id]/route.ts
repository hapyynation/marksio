import { NextRequest, NextResponse } from 'next/server'

import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  const customer = await prisma.customer.findFirst({
    where: { id: params.id, userId },
    include: {
      orders: {
        include: { items: true },
        orderBy: { placedAt: 'desc' },
        take: 50,
      },
      events: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  })
  if (!customer) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  return NextResponse.json({
    ...customer,
    tags: JSON.parse(customer.tags),
    orders: customer.orders,
    events: customer.events.map(e => ({ ...e, data: JSON.parse(e.data) })),
  })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  const existing = await prisma.customer.findFirst({ where: { id: params.id, userId } })
  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const body = await req.json()

  /* Detect newly added tags to fire tag_added automation events */
  if (body.tags !== undefined) {
    const oldTags: string[] = (() => { try { return JSON.parse(existing.tags) } catch { return [] } })()
    const newTags: string[] = Array.isArray(body.tags) ? body.tags : []
    const addedTags = newTags.filter(t => !oldTags.includes(t))
    for (const tag of addedTags) {
      await prisma.customerEvent.create({
        data: {
          userId,
          customerId: params.id,
          type: 'tag_added',
          source: 'manual',
          data: JSON.stringify({ tag }),
        },
      })
    }
  }

  const updated = await prisma.customer.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.segment !== undefined && { segment: body.segment }),
      ...(body.totalOrders !== undefined && { totalOrders: body.totalOrders }),
      ...(body.totalSpent !== undefined && { totalSpent: body.totalSpent }),
      ...(body.score !== undefined && { score: body.score }),
      ...(body.tags !== undefined && { tags: JSON.stringify(body.tags) }),
    },
  })

  return NextResponse.json({ ...updated, tags: JSON.parse(updated.tags) })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  const existing = await prisma.customer.findFirst({ where: { id: params.id, userId } })
  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  await prisma.customer.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
