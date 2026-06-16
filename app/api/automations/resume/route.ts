/**
 * POST /api/automations/resume
 *
 * İki çağrı yolu:
 * 1. QStash: `upstash-signature` header'ı ile — tek run'ı tam zamanında resume eder
 * 2. Cron / Bearer token: `Authorization: Bearer <CRON_SECRET>` — toplu resume
 */

import { NextRequest, NextResponse } from 'next/server'
import { resumeWaitingRuns, resumeRun } from '@/lib/automation/engine'
import { verifyQStashSignature } from '@/lib/qstash'

const CRON_SECRET = process.env.CRON_SECRET ?? ''

export async function POST(req: NextRequest) {
  // QStash yolu
  if (req.headers.get('upstash-signature')) {
    const isValid = await verifyQStashSignature(req.clone() as Request)
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json() as { runId?: string }
    if (!body.runId) {
      return NextResponse.json({ error: 'Missing runId' }, { status: 400 })
    }

    const resumed = await resumeRun(body.runId)
    return NextResponse.json({ success: true, resumed, runId: body.runId })
  }

  // Cron / manual yolu
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
  if (CRON_SECRET) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const resumed = await resumeWaitingRuns()
  return NextResponse.json({ resumed })
}
