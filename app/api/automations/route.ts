import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  try {
    const [automations, runCounts, lastRuns] = await Promise.all([
      prisma.automation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),

      /* Run sayıları: status başına, otomasyona göre grupla */
      prisma.automationRun.groupBy({
        by: ['automationId', 'status'],
        where: { automation: { userId } },
        _count: { id: true },
      }),

      /* Her otomasyon için en son run */
      prisma.automationRun.findMany({
        where: { automation: { userId } },
        orderBy: { createdAt: 'desc' },
        distinct: ['automationId'],
        select: {
          automationId: true,
          createdAt:    true,
          status:       true,
          completedAt:  true,
          failedAt:     true,
        },
      }),
    ])

    /* run sayılarını map'e dönüştür */
    const statsMap = new Map<string, Record<string, number>>()
    for (const r of runCounts) {
      if (!statsMap.has(r.automationId)) statsMap.set(r.automationId, {})
      statsMap.get(r.automationId)![r.status] = r._count.id
    }

    const lastRunMap = new Map(lastRuns.map(r => [r.automationId, r]))

    return NextResponse.json(
      automations.map(a => {
        const sm      = statsMap.get(a.id) ?? {}
        const total   = Object.values(sm).reduce((s, v) => s + v, 0)
        const last    = lastRunMap.get(a.id)

        return {
          ...a,
          steps: (() => { try { return JSON.parse(a.steps) } catch { return [] } })(),
          runStats: {
            total,
            completed: sm.completed ?? 0,
            failed:    sm.failed    ?? 0,
            waiting:   sm.waiting   ?? 0,
            running:   sm.running   ?? 0,
            lastRun:   last?.createdAt ?? null,
            lastStatus: last?.status  ?? null,
          },
        }
      }),
    )
  } catch (err) {
    console.error('[Automations GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  try {
    const body = await req.json()
    const automation = await prisma.automation.create({
      data: {
        userId,
        name:     body.name     ?? 'Yeni Otomasyon',
        trigger:  body.trigger  ?? '',
        status:   body.status   ?? 'draft',
        steps:    JSON.stringify(body.steps ?? []),
        segment:  body.segment  ?? null,
        flowData: body.flowData ? JSON.stringify(body.flowData) : '{}',
      },
    })
    return NextResponse.json({ ...automation, steps: JSON.parse(automation.steps) }, { status: 201 })
  } catch (err) {
    console.error('[Automations POST]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
