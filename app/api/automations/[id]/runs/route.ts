/**
 * GET /api/automations/[id]/runs
 * Bir otomasyonun çalışma geçmişini döner.
 *
 * Query params:
 *   limit  — default 20
 *   status — filter by status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { retryRun } from '@/lib/automation/engine'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const url    = new URL(req.url)
  const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100)
  const status = url.searchParams.get('status') ?? undefined

  /* Automation bu kullanıcıya mı ait? */
  const automation = await prisma.automation.findFirst({ where: { id: params.id, userId } })
  if (!automation) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const runs = await prisma.automationRun.findMany({
    where: {
      automationId: params.id,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      steps: { orderBy: { createdAt: 'asc' } },
      logs:  { orderBy: { createdAt: 'asc' }, take: 50 },
    },
  })

  /* Summary stats */
  const [total, byStatus] = await Promise.all([
    prisma.automationRun.count({ where: { automationId: params.id } }),
    prisma.automationRun.groupBy({
      by: ['status'],
      where: { automationId: params.id },
      _count: { status: true },
    }),
  ])

  return NextResponse.json({ runs, total, byStatus })
}

/* POST /api/automations/[id]/runs  — body: { runId }  → retry a failed run */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const automation = await prisma.automation.findFirst({ where: { id: params.id, userId } })
  if (!automation) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const { runId } = await req.json()
  if (!runId) return NextResponse.json({ error: 'runId zorunlu' }, { status: 400 })

  try {
    const { newRunId } = await retryRun(runId)
    return NextResponse.json({ newRunId })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 })
  }
}
