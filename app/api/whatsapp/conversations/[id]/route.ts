import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params

  try {
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: { id, userId: session.user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })

    if (!conversation) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    return NextResponse.json({ conversation })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params

  try {
    const existing = await prisma.whatsAppConversation.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

    const { status, resolvedBy } = await req.json()
    const conversation = await prisma.whatsAppConversation.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(resolvedBy !== undefined && { resolvedBy }),
      },
    })

    return NextResponse.json({ conversation })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}
