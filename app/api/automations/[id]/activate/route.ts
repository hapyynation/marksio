import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const automation = await prisma.automation.findFirst({ where: { id: params.id, userId } })
  if (!automation) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  let flow: { nodes: unknown[]; edges: unknown[] } | null = null
  try { flow = JSON.parse(automation.flowData) } catch {}

  if (!flow?.nodes?.length) {
    return NextResponse.json({ error: 'Otomasyon akış verisi eksik. Önce builder\'da oluşturun.' }, { status: 400 })
  }

  const updated = await prisma.automation.update({
    where: { id: params.id },
    data:  { status: 'active' },
  })

  return NextResponse.json({ id: updated.id, status: updated.status })
}
