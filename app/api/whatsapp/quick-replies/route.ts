import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const replies = await prisma.whatsAppQuickReply.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ replies })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const { title, triggerKeywords, responseText, isActive } = await req.json()

    if (!title?.trim() || !triggerKeywords?.trim() || !responseText?.trim()) {
      return NextResponse.json({ error: 'title, triggerKeywords ve responseText zorunlu' }, { status: 400 })
    }

    const reply = await prisma.whatsAppQuickReply.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        triggerKeywords: triggerKeywords.trim(),
        responseText: responseText.trim(),
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json({ reply })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}
