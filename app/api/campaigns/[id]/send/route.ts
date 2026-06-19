import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { executeCampaignSend } from '@/lib/campaign-executor'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'E-posta servisi yapılandırılmamış (RESEND_API_KEY eksik)' }, { status: 500 })
  }

  try {
    const result = await executeCampaignSend(params.id, session.user.id, {
      effectivePlan: session.user.effectivePlan,
    })

    if (!result.success) {
      console.error('Send error:', result.error, result.code)
      if (result.planLimitData) {
        return NextResponse.json(
          { error: 'PLAN_LIMIT_REACHED', ...result.planLimitData },
          { status: 403 },
        )
      }
      return NextResponse.json(
        { error: result.error ?? 'Kampanya gönderilemedi', ...(result.code ? { code: result.code } : {}) },
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
  } catch (err) {
    console.error('Send error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kampanya gönderilemedi' },
      { status: 500 },
    )
  }
}
