import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })
  if (!['growth', 'agency'].includes(user?.plan ?? '')) {
    return NextResponse.json({ error: 'Bu özellik Growth veya Agency planı gerektirir.' }, { status: 403 })
  }

  const account = await prisma.whatsappAccount.findFirst({
    where: { id: params.accountId, userId: session.user.id },
    select: { id: true },
  })
  if (!account) return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 })

  const body = await req.json() as { question?: string; answer?: string }
  if (!body.question?.trim() || !body.answer?.trim()) {
    return NextResponse.json({ error: 'Soru ve cevap zorunludur.' }, { status: 400 })
  }

  let config = await prisma.whatsappAssistantConfig.findUnique({
    where: { accountId: params.accountId },
  })
  if (!config) {
    config = await prisma.whatsappAssistantConfig.create({
      data: { accountId: params.accountId },
    })
  }

  const faq = await prisma.whatsappAssistantFaq.create({
    data: {
      configId: config.id,
      question: body.question.trim(),
      answer: body.answer.trim(),
    },
  })

  return NextResponse.json({ faq }, { status: 201 })
}
