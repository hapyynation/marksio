import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { LS_API_URL } from '@/lib/lemonsqueezy'

function env(key: string): string {
  return (process.env[key] ?? '').replace(/^﻿/, '').trim()
}

export async function DELETE() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const uid = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { lsSubscriptionId: true, planStatus: true },
  })

  // Cancel Lemon Squeezy subscription if active
  const apiKey = env('LEMONSQUEEZY_API_KEY')
  if (user?.lsSubscriptionId && user.planStatus === 'active' && apiKey) {
    await fetch(`${LS_API_URL}/subscriptions/${user.lsSubscriptionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/vnd.api+json',
      },
    }).catch(() => null)
  }

  // Cascade delete — order matters for FK constraints
  await prisma.$transaction([
    prisma.automationRunStep.deleteMany({ where: { run: { userId: uid } } }),
    prisma.automationLog.deleteMany({ where: { userId: uid } }),
    prisma.automationRun.deleteMany({ where: { userId: uid } }),
    prisma.campaignRecipient.deleteMany({ where: { campaign: { userId: uid } } }),
    prisma.emailEvent.deleteMany({ where: { campaign: { userId: uid } } }),
    prisma.campaignOpen.deleteMany({ where: { userId: uid } }),
    prisma.campaignRevenue.deleteMany({ where: { userId: uid } }),
    prisma.customerEvent.deleteMany({ where: { userId: uid } }),
    prisma.orderItem.deleteMany({ where: { order: { userId: uid } } }),
    prisma.order.deleteMany({ where: { userId: uid } }),
    prisma.customer.deleteMany({ where: { userId: uid } }),
    prisma.campaign.deleteMany({ where: { userId: uid } }),
    prisma.campaignProduct.deleteMany({ where: { userId: uid } }),
    prisma.automation.deleteMany({ where: { userId: uid } }),
    prisma.segment.deleteMany({ where: { userId: uid } }),
    prisma.syncLog.deleteMany({ where: { userId: uid } }),
    prisma.emailDomain.deleteMany({ where: { userId: uid } }),
    prisma.integration.deleteMany({ where: { userId: uid } }),
    prisma.whatsAppSettings.deleteMany({ where: { userId: uid } }),
    prisma.whatsAppQuickReply.deleteMany({ where: { userId: uid } }),
    prisma.whatsAppCampaign.deleteMany({ where: { userId: uid } }),
    prisma.template.deleteMany({ where: { userId: uid } }),
    prisma.emailVerification.deleteMany({ where: { userId: uid } }),
    prisma.user.delete({ where: { id: uid } }),
  ])

  // Sign out from Supabase
  const supabase = await createClient()
  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}
