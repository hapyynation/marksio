import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function GET() {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const accounts = await prisma.whatsappAccount.findMany({
    where: { userId: session.user.id, status: 'CONNECTED' },
    select: { id: true },
  })
  const accountIds = accounts.map(a => a.id)

  const convs = await prisma.whatsappConversation.findMany({
    where: { accountId: { in: accountIds } },
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    include: {
      contact: {
        select: { phoneNumber: true, windowExpiresAt: true, lastInboundAt: true },
      },
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 1,
        select: { id: true, direction: true, content: true, status: true, sentAt: true },
      },
    },
  })

  const conversations = convs.map(c => {
    const lastMsg = c.messages[0]
    const hasUnread = lastMsg?.direction === 'INBOUND'
    return {
      id: c.id,
      phone: c.contact.phoneNumber,
      name: null as string | null,
      lastMessage: lastMsg?.content ?? '',
      lastMessageAt: c.lastMessageAt.toISOString(),
      lastMessageDirection: lastMsg?.direction ?? null,
      status: c.status as 'AI_HANDLING' | 'HUMAN_TAKEOVER' | 'CLOSED',
      aiActive: c.status === 'AI_HANDLING',
      hasUnread,
      windowExpiresAt: c.contact.windowExpiresAt?.toISOString() ?? null,
    }
  })

  return NextResponse.json({ conversations })
}
