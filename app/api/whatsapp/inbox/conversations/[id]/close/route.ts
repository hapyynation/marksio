import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const conv = await prisma.whatsappConversation.findFirst({
    where: { id: params.id, account: { userId: session.user.id } },
    select: { id: true },
  })
  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı.' }, { status: 404 })

  await prisma.whatsappConversation.update({
    where: { id: params.id },
    data: { status: 'CLOSED' },
  })

  return NextResponse.json({ ok: true, status: 'CLOSED' })
}
