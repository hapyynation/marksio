import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const campaigns = await prisma.whatsAppCampaign.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ campaigns })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const { name, message, audienceSegmentId, scheduledAt } = await req.json()

    if (!name?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'name ve message zorunlu' }, { status: 400 })
    }

    const campaign = await prisma.whatsAppCampaign.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        message: message.trim(),
        audienceSegmentId: audienceSegmentId || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: 'draft',
      },
    })

    return NextResponse.json({ campaign })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}
