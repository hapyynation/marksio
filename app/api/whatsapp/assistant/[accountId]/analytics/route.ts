import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const account = await prisma.whatsappAccount.findFirst({
    where: { id: params.accountId, userId: session.user.id },
    select: { id: true },
  })
  if (!account) return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 })

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [conversations, messages] = await Promise.all([
    prisma.whatsappConversation.findMany({
      where: {
        accountId: params.accountId,
        lastMessageAt: { gte: since },
      },
      select: { id: true, status: true, lastMessageAt: true },
    }),
    prisma.whatsappMessage.count({
      where: {
        conversation: { accountId: params.accountId },
        sentAt: { gte: since },
        direction: 'OUTBOUND',
      },
    }),
  ])

  const total = conversations.length
  const handedOver = conversations.filter(c => c.status === 'HUMAN_TAKEOVER').length
  const closed = conversations.filter(c => c.status === 'CLOSED').length
  const aiResolved = closed
  const resolutionRate = total > 0 ? Math.round((aiResolved / total) * 100) : 0
  const timeSavedMinutes = aiResolved * 4

  return NextResponse.json({
    analytics: {
      totalChats: total,
      aiResolved,
      handedOver,
      resolutionRate,
      timeSavedMinutes,
      totalMessages: messages,
      period: '30d',
    },
  })
}
