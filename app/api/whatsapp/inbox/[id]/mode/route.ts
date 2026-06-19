import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { aiActive } = await req.json() as { aiActive?: boolean }

  const conv = await prisma.whatsappConversation.findFirst({
    where: {
      id: params.id,
      account: { userId: session.user.id },
    },
    select: { id: true },
  })
  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı.' }, { status: 404 })

  await prisma.whatsappConversation.update({
    where: { id: params.id },
    data: { status: aiActive ? 'AI_HANDLING' : 'HUMAN_TAKEOVER' },
  })

  return NextResponse.json({ ok: true })
}
