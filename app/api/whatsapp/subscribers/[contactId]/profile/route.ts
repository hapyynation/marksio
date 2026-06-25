import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const contact = await prisma.whatsappContact.findFirst({
    where: { id: params.contactId, userId: session.user.id },
  })
  if (!contact) return NextResponse.json({ error: 'Abone bulunamadı.' }, { status: 404 })

  const phoneSuffix = contact.phoneNumber.replace(/\D/g, '').slice(-10)

  const [customer, optInHistory, lastConversation] = await Promise.all([
    prisma.customer.findFirst({
      where: {
        userId: session.user.id,
        OR: [
          { phone: { endsWith: phoneSuffix } },
          { phone: contact.phoneNumber },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        segment: true,
        totalOrders: true,
        totalSpent: true,
        avgOrder: true,
        lastOrder: true,
        riskScore: true,
        score: true,
        tags: true,
        createdAt: true,
        orders: {
          orderBy: { placedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            currency: true,
            placedAt: true,
            items: {
              select: { title: true, quantity: true, price: true, imageUrl: true },
            },
          },
        },
      },
    }),
    prisma.whatsappOptInHistory.findMany({
      where: { userId: session.user.id, phoneNumber: contact.phoneNumber },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.whatsappConversation.findFirst({
      where: { contact: { phoneNumber: contact.phoneNumber, userId: session.user.id } },
      orderBy: { lastMessageAt: 'desc' },
      select: {
        id: true,
        status: true,
        lastMessageAt: true,
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: { content: true, direction: true, sentAt: true },
        },
        internalNotes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, note: true, createdBy: true, createdAt: true },
        },
        tagLinks: {
          include: { tag: true },
        },
      },
    }),
  ])

  return NextResponse.json({
    contact: {
      id: contact.id,
      phone: contact.phoneNumber,
      optIn: contact.optInStatus,
      tags: contact.tags,
      windowOpen: contact.windowExpiresAt ? contact.windowExpiresAt > new Date() : false,
      windowExpiresAt: contact.windowExpiresAt?.toISOString() ?? null,
      lastMessageAt: contact.lastInboundAt?.toISOString() ?? null,
      createdAt: contact.createdAt.toISOString(),
    },
    customer: customer
      ? {
          ...customer,
          tags: JSON.parse(customer.tags ?? '[]') as string[],
          lastOrder: customer.lastOrder?.toISOString() ?? null,
          createdAt: customer.createdAt.toISOString(),
          orders: customer.orders.map(o => ({
            ...o,
            placedAt: o.placedAt.toISOString(),
          })),
        }
      : null,
    optInHistory,
    conversation: lastConversation
      ? {
          id: lastConversation.id,
          status: lastConversation.status,
          lastMessageAt: lastConversation.lastMessageAt?.toISOString(),
          lastMessage: lastConversation.messages[0] ?? null,
          notes: lastConversation.internalNotes,
          tags: lastConversation.tagLinks.map(l => l.tag),
        }
      : null,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const contact = await prisma.whatsappContact.findFirst({
    where: { id: params.contactId, userId: session.user.id },
    select: { id: true, phoneNumber: true, optInStatus: true, tags: true },
  })
  if (!contact) return NextResponse.json({ error: 'Abone bulunamadı.' }, { status: 404 })

  const body = await req.json() as { optIn?: string; tags?: string[] }
  const updates: Record<string, unknown> = {}

  if (body.optIn && ['OPTED_IN', 'OPTED_OUT', 'UNKNOWN'].includes(body.optIn)) {
    updates.optInStatus = body.optIn
    if (body.optIn !== contact.optInStatus) {
      await prisma.whatsappOptInHistory.create({
        data: {
          userId: session.user.id,
          phoneNumber: contact.phoneNumber,
          status: body.optIn as 'OPTED_IN' | 'OPTED_OUT' | 'UNKNOWN',
          source: 'manual',
        },
      })
    }
  }

  if (Array.isArray(body.tags)) {
    updates.tags = body.tags
  }

  const updated = await prisma.whatsappContact.update({
    where: { id: contact.id },
    data: updates,
  })

  return NextResponse.json({ contact: updated })
}
