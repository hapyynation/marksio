import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params

  const test = await prisma.aBTest.findFirst({ where: { id, userId: session.user.id } })
  if (!test) return NextResponse.json({ error: 'Test bulunamadı' }, { status: 404 })
  if (test.status === 'completed') return NextResponse.json({ error: 'Test zaten tamamlandı' }, { status: 400 })

  const openRateA = test.sentA > 0 ? test.openedA / test.sentA : 0
  const openRateB = test.sentB > 0 ? test.openedB / test.sentB : 0

  let winnerVariant: string | null = null
  if (Math.abs(openRateA - openRateB) > 0.01) {
    winnerVariant = openRateA >= openRateB ? 'A' : 'B'
  }

  const updated = await prisma.aBTest.update({
    where: { id },
    data: {
      status:        'completed',
      winnerVariant,
      completedAt:   new Date(),
    },
  })

  return NextResponse.json(updated)
}
