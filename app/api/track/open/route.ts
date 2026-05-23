import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

export async function GET(req: NextRequest) {
  const campaignId = req.nextUrl.searchParams.get('c')
  const customerId = req.nextUrl.searchParams.get('u')

  if (campaignId) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { userId: true },
    }).catch(() => null)

    await Promise.all([
      prisma.campaign.update({
        where: { id: campaignId },
        data: { opened: { increment: 1 } },
      }).catch(() => null),
      campaign
        ? prisma.campaignOpen.create({
            data: {
              userId: campaign.userId,
              campaignId,
              customerId: customerId || null,
              channel: 'email',
            },
          }).catch(() => null)
        : null,
    ])
  }

  return new NextResponse(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
