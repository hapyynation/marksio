import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { executeCampaignSend } from '@/lib/campaign-executor'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const result = await executeCampaignSend(params.id, session.user.id, {
    effectivePlan: session.user.effectivePlan,
  })

  if (!result.success) {
    if (result.planLimitData) {
      return NextResponse.json(
        { error: 'PLAN_LIMIT_REACHED', ...result.planLimitData },
        { status: 403 },
      )
    }
    return NextResponse.json(
      { error: result.error, ...(result.code ? { code: result.code } : {}) },
      { status: result.statusCode ?? 400 },
    )
  }

  return NextResponse.json({
    success: true,
    sent:               result.sent,
    failed:             result.failed,
    total:              result.total,
    domainUsed:         result.domainUsed,
    usedFallbackDomain: result.usedFallbackDomain,
    errors:             result.errors,
  })
}
