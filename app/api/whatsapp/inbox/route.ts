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
      contact: { select: { phoneNumber: true } },
      messages: {
        orderBy: { sentAt: 'asc' },
        take: 50,
        select: {
          id: true,
          direction: true,
          content: true,
          sentAt: true,
        },
      },
    },
  })

  const conversations = convs.map(c => {
    const lastMsg = c.messages[c.messages.length - 1]
    return {
      id: c.id,
      phone: c.contact.phoneNumber,
      name: null as string | null,
      lastMessage: lastMsg?.content ?? '',
      lastMessageAt: c.lastMessageAt.toISOString(),
      status: mapStatus(c.status),
      aiActive: c.status === 'AI_HANDLING',
      messages: c.messages.map(m => ({
        id: m.id,
        role: (m.direction === 'INBOUND' ? 'customer' : 'assistant') as 'customer' | 'assistant',
        body: m.content ?? '',
        timestamp: m.sentAt.toISOString(),
      })),
    }
  })

  return NextResponse.json({ conversations })
}

function mapStatus(s: string): 'open' | 'closed' | 'human' {
  if (s === 'CLOSED') return 'closed'
  if (s === 'HUMAN_TAKEOVER') return 'human'
  return 'open'
}
