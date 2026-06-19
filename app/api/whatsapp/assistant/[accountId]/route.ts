import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

type Tone = 'FORMAL' | 'FRIENDLY' | 'PROFESSIONAL'

export async function GET(
  _req: NextRequest,
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

  const config = await prisma.whatsappAssistantConfig.findUnique({
    where: { accountId: params.accountId },
    include: { faqs: { orderBy: { createdAt: 'asc' } } },
  })

  return NextResponse.json({ config })
}

export async function PUT(
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

  const body = await req.json() as {
    enabled?: boolean
    tone?: Tone
    businessName?: string
    customKnowledge?: string
    fallbackMessage?: string
  }

  const config = await prisma.whatsappAssistantConfig.upsert({
    where: { accountId: params.accountId },
    create: {
      accountId: params.accountId,
      enabled: body.enabled ?? false,
      tone: body.tone ?? 'PROFESSIONAL',
      businessName: body.businessName ?? null,
      customKnowledge: body.customKnowledge ?? null,
      fallbackMessage: body.fallbackMessage ?? null,
    },
    update: {
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.tone && { tone: body.tone }),
      ...(body.businessName !== undefined && { businessName: body.businessName }),
      ...(body.customKnowledge !== undefined && { customKnowledge: body.customKnowledge }),
      ...(body.fallbackMessage !== undefined && { fallbackMessage: body.fallbackMessage }),
    },
    include: { faqs: { orderBy: { createdAt: 'asc' } } },
  })

  return NextResponse.json({ config })
}
