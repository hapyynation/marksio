/**
 * POST /api/automations/trigger
 *
 * Bir trigger event'ini alır ve eşleşen aktif otomasyonları başlatır.
 *
 * Body:
 *   triggerType  — cart_abandoned | new_customer | order_created | ...
 *   customerId   — string
 *   userId       — string (internal) veya omit edilebilir (session'dan alınır)
 *   data         — Record<string, unknown> (opsiyonel extra event data)
 *
 * Kullanım:
 *   Shopify/İkas webhook'larından, cron job'dan veya manuel olarak çağrılır.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startRun } from '@/lib/automation/engine'
import { getApiSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  /* Auth: ya session'dan userId al, ya da body'deki userId kabul et
     (internal çağrılar için) */
  const session = await getApiSession()

  const body = await req.json() as {
    triggerType: string
    customerId:  string
    userId?:     string
    data?:       Record<string, unknown>
  }

  const userId = session?.user
    ? (session.user as { id: string }).id
    : body.userId

  if (!userId)      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  if (!body.triggerType) return NextResponse.json({ error: 'triggerType zorunlu' }, { status: 400 })
  if (!body.customerId)  return NextResponse.json({ error: 'customerId zorunlu' }, { status: 400 })

  /* Eşleşen aktif otomasyonları bul */
  const automations = await prisma.automation.findMany({
    where: {
      userId,
      status: 'active',
      trigger: body.triggerType,
    },
  })

  if (automations.length === 0) {
    return NextResponse.json({ triggered: 0, message: 'Eşleşen aktif otomasyon yok' })
  }

  const results: { automationId: string; runId: string; skipped?: boolean }[] = []

  for (const automation of automations) {
    try {
      const { runId, skipped } = await startRun(
        automation.id,
        body.customerId,
        body.data ?? {},
      )
      results.push({ automationId: automation.id, runId, skipped })
    } catch (err) {
      results.push({ automationId: automation.id, runId: '', skipped: false })
      console.error(`startRun error [${automation.id}]:`, err)
    }
  }

  return NextResponse.json({
    triggered: results.filter(r => !r.skipped).length,
    total:     results.length,
    results,
  })
}
