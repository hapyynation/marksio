import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

async function getAuthorized(id: string, userId: string) {
  return prisma.campaign.findFirst({ where: { id, userId } })
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  const campaign = await getAuthorized(params.id, userId)
  if (!campaign) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  return NextResponse.json({ ...campaign, tips: JSON.parse(campaign.tips) })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  const existing = await getAuthorized(params.id, userId)
  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.campaign.update({
    where: { id: params.id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.status && { status: body.status }),
      ...(body.subject !== undefined && { subject: body.subject }),
      ...(body.body !== undefined && { body: body.body }),
      ...(body.tips !== undefined && { tips: JSON.stringify(body.tips) }),
      ...(body.sent !== undefined && { sent: body.sent }),
      ...(body.opened !== undefined && { opened: body.opened }),
      ...(body.clicked !== undefined && { clicked: body.clicked }),
      ...(body.revenue !== undefined && { revenue: body.revenue }),
    },
  })

  return NextResponse.json({ ...updated, tips: JSON.parse(updated.tips) })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  const existing = await getAuthorized(params.id, userId)
  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  await prisma.campaign.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
