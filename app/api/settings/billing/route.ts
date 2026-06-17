import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLimits } from '@/lib/plan-limits'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      planStatus: true,
      planRenewsAt: true,
      emailQuotaUsed: true,
      whatsappQuotaUsed: true,
      lsSubscriptionId: true,
    },
  })
  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const campaignCount = await prisma.campaign.count({
    where: {
      userId: session.user.id,
      createdAt: { gte: startOfMonth },
      status: { not: 'draft' },
    },
  })

  const limits = getLimits(user.plan)

  return NextResponse.json({
    plan: user.plan,
    planStatus: user.planStatus,
    planRenewsAt: user.planRenewsAt,
    hasSubscription: !!user.lsSubscriptionId,
    emailQuotaUsed: user.emailQuotaUsed,
    emailQuotaLimit: limits.emailSendsPerMonth,
    whatsappQuotaUsed: user.whatsappQuotaUsed,
    whatsappQuotaLimit: limits.whatsappSends,
    campaignCount,
    campaignLimit: limits.campaigns,
  })
}
