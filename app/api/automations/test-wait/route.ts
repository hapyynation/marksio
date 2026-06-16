import { NextRequest, NextResponse } from 'next/server'
import { scheduleAutomationResume } from '@/lib/qstash'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not allowed', { status: 403 })
  }

  const { runId, delaySeconds = 10 } = await req.json() as {
    runId: string
    delaySeconds?: number
  }

  const resumeAt = new Date(Date.now() + delaySeconds * 1000)
  const messageId = await scheduleAutomationResume(runId, resumeAt)

  return NextResponse.json({ messageId, resumeAt })
}
