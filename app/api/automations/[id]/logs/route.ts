import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const automation = await prisma.automation.findFirst({ where: { id: params.id, userId } })
  if (!automation) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const url   = new URL(req.url)
  const level = url.searchParams.get('level') ?? undefined
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100'), 500)

  const logs = await prisma.automationLog.findMany({
    where: {
      automationId: params.id,
      ...(level ? { level } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  const [total, byLevel] = await Promise.all([
    prisma.automationLog.count({ where: { automationId: params.id } }),
    prisma.automationLog.groupBy({
      by: ['level'],
      where: { automationId: params.id },
      _count: { level: true },
    }),
  ])

  return NextResponse.json({ logs, total, byLevel })
}
