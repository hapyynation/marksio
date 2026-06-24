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
    include: { contact: { select: { phoneNumber: true } } },
  })
  if (!conv) return NextResponse.json({ error: 'Konuşma bulunamadı.' }, { status: 404 })

  const phone = conv.contact.phoneNumber
  const last10 = phone.replace(/\D/g, '').slice(-10)

  const customer = await prisma.customer.findFirst({
    where: {
      userId: session.user.id,
      OR: [
        { phone: { endsWith: last10 } },
        { phone: phone },
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
      source: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!customer) return NextResponse.json({ customer: null })

  return NextResponse.json({ customer })
}
