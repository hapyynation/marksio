import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

async function getAuthorizedConv(id: string, userId: string) {
  return prisma.whatsappConversation.findFirst({
    where: { id, account: { userId } },
    select: { id: true },
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const conv = await getAuthorizedConv(params.id, session.user.id)
  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı.' }, { status: 404 })

  const notes = await prisma.internalNote.findMany({
    where: { conversationId: params.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ notes })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const conv = await getAuthorizedConv(params.id, session.user.id)
  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı.' }, { status: 404 })

  const { note } = await req.json() as { note?: string }
  if (!note?.trim()) return NextResponse.json({ error: 'Not boş olamaz.' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  })

  const created = await prisma.internalNote.create({
    data: {
      conversationId: params.id,
      userId: session.user.id,
      note: note.trim(),
      createdBy: user?.name ?? 'Temsilci',
    },
  })

  return NextResponse.json({ note: created })
}
