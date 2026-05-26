import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const campaignId = sp.get('c')
  const customerId = sp.get('u')
  const rawUrl = sp.get('url')

  if (campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { userId: true },
    }).catch(() => null)

    if (campaign) {
      await Promise.all([
        // Increment clicked counter
        prisma.campaign.update({
          where: { id: campaignId },
          data: { clicked: { increment: 1 } },
        }).catch(() => null),

        // Track in CampaignOpen for attribution lookups
        prisma.campaignOpen.create({
          data: {
            userId: campaign.userId,
            campaignId,
            customerId: customerId || null,
            channel: 'email_click',
          },
        }).catch(() => null),

        // Record EmailEvent 'clicked' for detailed analytics
        prisma.emailEvent.create({
          data: {
            campaignId,
            customerId: customerId || null,
            type: 'clicked',
            clickedAt: new Date(),
            metadata: JSON.stringify({ via: 'email_cta' }),
          },
        }).catch(() => null),
      ])
    }
  }

  // Build destination URL with UTM params
  let destination = '/'
  if (rawUrl) {
    try {
      const decoded = decodeURIComponent(rawUrl)
      if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) {
        return NextResponse.redirect(new URL('/'))
      }
      const dest = new URL(decoded)
      if (campaignId) {
        dest.searchParams.set('utm_source', 'marksio')
        dest.searchParams.set('utm_medium', 'email')
        dest.searchParams.set('utm_campaign', campaignId)
        if (customerId) dest.searchParams.set('utm_content', customerId)
      }
      destination = dest.toString()
    } catch {
      destination = '/'
    }
  }

  return NextResponse.redirect(destination)
}
