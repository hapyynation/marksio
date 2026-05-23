import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
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
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  try {
    const body = await req.json()
    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name: body.name,
        type: body.type,
        status: body.status ?? 'draft',
        segment: body.segment,
        subject: body.subject,
        previewText: body.previewText,
        body: body.body,
        cta: body.cta,
        tips: JSON.stringify(body.tips ?? []),
      },
    })
    return NextResponse.json({ ...campaign, tips: JSON.parse(campaign.tips) }, { status: 201 })
  } catch (err) {
    console.error('[Campaigns POST]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
