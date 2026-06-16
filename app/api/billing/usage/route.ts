import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLimits } from '@/lib/plan-limits'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, emailQuotaUsed: true, whatsappQuotaUsed: true },
  })
  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const campaignCount = await prisma.campaign.count({
    where: { userId: session.user.id, createdAt: { gte: startOfMonth } },
  })

  const limits = getLimits(user.plan)

  return NextResponse.json({
    emailQuotaUsed: user.emailQuotaUsed,
    emailQuotaLimit: limits.emailSendsPerMonth,
    campaignCount,
    campaignLimit: limits.campaigns,
    whatsappQuotaUsed: user.whatsappQuotaUsed,
    whatsappQuotaLimit: limits.whatsappSends,
  })
}
