import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applySegmentRules } from '@/lib/segment-engine'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const users = await prisma.user.findMany({ select: { id: true } })
    let total = 0

    for (const user of users) {
      const updated = await applySegmentRules(user.id)
      total += updated
    }

    return NextResponse.json({ ok: true, updated: total })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
