import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLimits, isAtLimit, getUpgradePlan } from '@/lib/plan-limits'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(campaigns.map(c => ({
      ...c,
      tips: (() => { try { return JSON.parse(c.tips) } catch { return [] } })(),
    })))
  } catch (err) {
    console.error('[Campaigns GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = session.user.id
  const effectivePlan = session.user.effectivePlan
  const limits = getLimits(effectivePlan)

  if (limits.campaigns !== -1) {
    const count = await prisma.campaign.count({ where: { userId } })
    if (isAtLimit(count, limits.campaigns)) {
      return NextResponse.json({
        error: 'PLAN_LIMIT_REACHED',
        feature: 'campaigns',
        currentPlan: effectivePlan,
        requiredPlan: getUpgradePlan(effectivePlan),
      }, { status: 403 })
    }
  }

  try {
    const body = await req.json()
    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name: body.name,
        type: body.type ?? 'email',
        status: body.status ?? 'draft',
        segment: body.segment ?? 'all',
        subject: body.subject,
        previewText: body.previewText,
        headline: body.headline,
        body: body.body ?? '',
        cta: body.cta,
        tips: JSON.stringify(body.tips ?? []),
        purpose: body.purpose,
        imageUrl: body.imageUrl,
        imagePrompt: body.imagePrompt,
        ctaText: body.ctaText,
        ctaUrl: body.ctaUrl,
        layoutStyle: body.layoutStyle,
        brandColor: body.brandColor,
        templateType: body.templateType,
        productsJson: JSON.stringify(body.products ?? []),
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      },
    })
    return NextResponse.json({ ...campaign, tips: JSON.parse(campaign.tips) }, { status: 201 })
  } catch (err) {
    console.error('[Campaigns POST]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
