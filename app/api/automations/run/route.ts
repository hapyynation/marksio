/**
 * POST /api/automations/run
 *
 * Manuel veya cron tetiklemeli çalıştırma.
 *
 * Body (opsiyonel):
 *   automationId — belirli bir otomasyonu çalıştır
 *   customerId   — belirli bir müşteri için
 *   triggerData  — ek event verisi
 *
 * Body yoksa: işlenmemiş CustomerEvent'leri tarar ve
 * eşleşen aktif otomasyonları startRun ile başlatır.
 *
 * Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import { startRun, resumeWaitingRuns } from '@/lib/automation/engine'

const CRON_SECRET = process.env.CRON_SECRET ?? ''

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const hasValidSecret = !!CRON_SECRET && auth === `Bearer ${CRON_SECRET}`
  if (!hasValidSecret) {
    const session = await getApiSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  let body: { automationId?: string; customerId?: string; triggerData?: Record<string, unknown> } = {}
  try { body = await req.json() } catch {}

  /* Manuel: belirli bir otomasyon + müşteri */
  if (body.automationId && body.customerId) {
    const result = await startRun(body.automationId, body.customerId, body.triggerData ?? {})
    return NextResponse.json(result)
  }

  /* Cron: 1) waiting run'ları ilerlet, 2) unprocessed event'leri işle */
  const resumed   = await resumeWaitingRuns()
  const processed = await processCustomerEvents()

  return NextResponse.json({ resumed, processed })
}

/* ─── CustomerEvent tabanlı toplu işleme ─────────────────────────────────── */

async function processCustomerEvents(): Promise<number> {
  const events = await prisma.customerEvent.findMany({
    where: { processedAt: null },
    include: { customer: true },
    take: 100,
    orderBy: { createdAt: 'asc' },
  })

  let count = 0

  for (const event of events) {
    const automations = await prisma.automation.findMany({
      where: { userId: event.userId, status: 'active', trigger: event.type },
    })

    for (const automation of automations) {
      try {
        await startRun(automation.id, event.customerId, JSON.parse(event.data ?? '{}'))
        count++
      } catch (err) {
        console.error(`processEvent error [${automation.id}]:`, err)
      }
    }

    await prisma.customerEvent.update({
      where: { id: event.id },
      data:  { processedAt: new Date() },
    })
  }

  return count
}
