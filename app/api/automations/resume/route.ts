/**
 * POST /api/automations/resume
 *
 * 'waiting' durumundaki ve süresi dolmuş run'ları ilerletir.
 * Cron job tarafından periyodik olarak çağrılır.
 *
 * Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { resumeWaitingRuns } from '@/lib/automation/engine'

const CRON_SECRET = process.env.CRON_SECRET ?? ''

export async function POST(req: NextRequest) {
  if (CRON_SECRET) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const resumed = await resumeWaitingRuns()
  return NextResponse.json({ resumed })
}

/* Vercel Cron: GET ile de çağrılabilir */
export async function GET(req: NextRequest) {
  return POST(req)
}
