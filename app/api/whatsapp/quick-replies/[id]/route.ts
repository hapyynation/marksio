import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params

  try {
    const existing = await prisma.whatsAppQuickReply.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const { title, triggerKeywords, responseText, isActive } = await req.json()

    const reply = await prisma.whatsAppQuickReply.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(triggerKeywords !== undefined && { triggerKeywords: triggerKeywords.trim() }),
        ...(responseText !== undefined && { responseText: responseText.trim() }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ reply })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params

  try {
    const existing = await prisma.whatsAppQuickReply.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    await prisma.whatsAppQuickReply.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}
