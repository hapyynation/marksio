import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  const existing = await prisma.segment.findFirst({ where: { id: params.id, userId } })
  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.segment.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.rules !== undefined && { rules: JSON.stringify(body.rules) }),
      ...(body.color !== undefined && { color: body.color }),
    },
  })

  return NextResponse.json({ ...updated, rules: JSON.parse(updated.rules) })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  const existing = await prisma.segment.findFirst({ where: { id: params.id, userId } })
  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  if (existing.type === 'builtin') return NextResponse.json({ error: 'Yerleşik segmentler silinemez' }, { status: 400 })

  await prisma.segment.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
