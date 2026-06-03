import { NextRequest, NextResponse } from 'next/server'
import { resumeWaitingRuns, processUnhandledEvents, scanTimedTriggers } from '@/lib/automation/engine'

const CRON_SECRET = process.env.CRON_SECRET ?? ''

export async function GET(req: NextRequest) {
  if (CRON_SECRET) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const [resumed, processed, triggered] = await Promise.all([
    resumeWaitingRuns(),
    processUnhandledEvents(),
    scanTimedTriggers(),
  ])

  return NextResponse.json({ ok: true, resumed, processed, triggered, ts: new Date().toISOString() })
}

export async function POST(req: NextRequest) {
  return GET(req)
}
