import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const original = await prisma.automation.findFirst({ where: { id: params.id, userId } })
  if (!original) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const cloned = await prisma.automation.create({
    data: {
      userId,
      name:          `${original.name} (Kopya)`,
      trigger:       original.trigger,
      status:        'draft',
      steps:         original.steps,
      flowData:      original.flowData,
      triggerConfig: original.triggerConfig,
      segment:       original.segment,
    },
  })

  return NextResponse.json({ id: cloned.id, name: cloned.name }, { status: 201 })
}
