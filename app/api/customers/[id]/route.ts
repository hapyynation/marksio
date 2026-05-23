import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
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
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  const existing = await prisma.customer.findFirst({ where: { id: params.id, userId } })
  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const body = await req.json()
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
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  const existing = await prisma.customer.findFirst({ where: { id: params.id, userId } })
  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  await prisma.customer.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
