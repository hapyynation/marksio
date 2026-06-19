import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

async function verifyOwnership(faqId: string, userId: string) {
  const faq = await prisma.whatsappAssistantFaq.findFirst({
    where: {
      id: faqId,
      config: { account: { userId } },
    },
    select: { id: true },
  })
  return faq
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const faq = await verifyOwnership(params.id, session.user.id)
  if (!faq) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404 })

  const body = await req.json() as { question?: string; answer?: string }
  const updated = await prisma.whatsappAssistantFaq.update({
    where: { id: params.id },
    data: {
      ...(body.question?.trim() && { question: body.question.trim() }),
      ...(body.answer?.trim() && { answer: body.answer.trim() }),
    },
  })

  return NextResponse.json({ faq: updated })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const faq = await verifyOwnership(params.id, session.user.id)
  if (!faq) return NextResponse.json({ error: 'Bulunamadı.' }, { status: 404 })

  await prisma.whatsappAssistantFaq.delete({ where: { id: params.id } })
  return new Response(null, { status: 204 })
}
