import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const conv = await prisma.whatsappConversation.findFirst({
    where: { id: params.id, account: { userId: session.user.id } },
    include: {
      contact: { select: { phoneNumber: true, optInStatus: true } },
      tagLinks: { include: { tag: true } },
    },
  })
  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı.' }, { status: 404 })

  return NextResponse.json({ conversation: conv })
}
