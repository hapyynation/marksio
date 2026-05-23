import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const campaignId = req.nextUrl.searchParams.get('c')
  const customerId = req.nextUrl.searchParams.get('u')
  const url = req.nextUrl.searchParams.get('url')

  if (campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { userId: true },
    }).catch(() => null)

    await Promise.all([
      prisma.campaign.update({
        where: { id: campaignId },
        data: { clicked: { increment: 1 } },
      }).catch(() => null),
      campaign
        ? prisma.campaignOpen.create({
            data: {
              userId: campaign.userId,
              campaignId,
              customerId: customerId || null,
              channel: 'email_click',
            },
          }).catch(() => null)
        : null,
    ])
  }

  const redirect = url ? decodeURIComponent(url) : '/'
  if (!redirect.startsWith('http://') && !redirect.startsWith('https://')) {
    return NextResponse.redirect('/')
  }
  return NextResponse.redirect(redirect)
}
