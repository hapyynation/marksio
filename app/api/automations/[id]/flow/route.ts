import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const auto = await prisma.automation.findFirst({ where: { id: params.id, userId } })
  if (!auto) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  let flowData = { nodes: [], edges: [] }
  try { flowData = JSON.parse((auto as { flowData?: string }).flowData ?? '{}') } catch {}

  return NextResponse.json({
    id: auto.id,
    name: auto.name,
    trigger: auto.trigger,
    status: auto.status,
    segment: auto.segment,
    flowData,
    sent: auto.sent,
    opened: auto.opened,
    converted: auto.converted,
    revenue: auto.revenue,
  })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const auto = await prisma.automation.findFirst({ where: { id: params.id, userId } })
  if (!auto) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const body = await req.json()

  const updated = await prisma.automation.update({
    where: { id: params.id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.trigger && { trigger: body.trigger }),
      ...(body.flowData && { flowData: JSON.stringify(body.flowData) }),
      ...(body.status && { status: body.status }),
      ...(body.segment !== undefined && { segment: body.segment }),
    },
  })

  return NextResponse.json({ success: true, id: updated.id, status: updated.status })
}
