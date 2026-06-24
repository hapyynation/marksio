import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

type Tone = 'FORMAL' | 'FRIENDLY' | 'PROFESSIONAL'
type ResponseLength = 'SHORT' | 'MEDIUM' | 'LONG'
type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH'
type HandoverRuleType = 'AI_CANNOT_RESOLVE' | 'ORDER_COMPLAINT' | 'RETURN_REQUEST' | 'ANGRY_CUSTOMER' | 'MANUAL_TRANSFER'

async function verifyPlanAndAccount(userId: string, accountId: string) {
  const [user, account] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    prisma.whatsappAccount.findFirst({ where: { id: accountId, userId }, select: { id: true } }),
  ])
  const hasPlan = ['growth', 'agency'].includes(user?.plan ?? '')
  return { hasPlan, account }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { hasPlan, account } = await verifyPlanAndAccount(session.user.id, params.accountId)
  if (!hasPlan) return NextResponse.json({ error: 'Bu özellik Growth veya Agency planı gerektirir.' }, { status: 403 })
  if (!account) return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 })

  const config = await prisma.whatsappAssistantConfig.findUnique({
    where: { accountId: params.accountId },
    include: {
      faqs: { orderBy: { createdAt: 'asc' } },
      handoverRules: true,
      knowledgeSources: { orderBy: { createdAt: 'asc' } },
    },
  })

  return NextResponse.json({ config })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { hasPlan, account } = await verifyPlanAndAccount(session.user.id, params.accountId)
  if (!hasPlan) return NextResponse.json({ error: 'Bu özellik Growth veya Agency planı gerektirir.' }, { status: 403 })
  if (!account) return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 })

  const body = await req.json() as {
    enabled?: boolean
    tone?: Tone
    responseLength?: ResponseLength
    confidenceLevel?: ConfidenceLevel
    businessName?: string
    customKnowledge?: string
    fallbackMessage?: string
    websiteUrl?: string
    shopifyEnabled?: boolean
    workingHoursStart?: string
    workingHoursEnd?: string
    offlineMessage?: string
    handoverRules?: Array<{ ruleType: HandoverRuleType; enabled: boolean }>
  }

  const configData = {
    ...(body.enabled !== undefined && { enabled: body.enabled }),
    ...(body.tone && { tone: body.tone }),
    ...(body.responseLength && { responseLength: body.responseLength }),
    ...(body.confidenceLevel && { confidenceLevel: body.confidenceLevel }),
    ...(body.businessName !== undefined && { businessName: body.businessName }),
    ...(body.customKnowledge !== undefined && { customKnowledge: body.customKnowledge }),
    ...(body.fallbackMessage !== undefined && { fallbackMessage: body.fallbackMessage }),
    ...(body.websiteUrl !== undefined && { websiteUrl: body.websiteUrl }),
    ...(body.shopifyEnabled !== undefined && { shopifyEnabled: body.shopifyEnabled }),
    ...(body.workingHoursStart !== undefined && { workingHoursStart: body.workingHoursStart }),
    ...(body.workingHoursEnd !== undefined && { workingHoursEnd: body.workingHoursEnd }),
    ...(body.offlineMessage !== undefined && { offlineMessage: body.offlineMessage }),
  }

  const config = await prisma.whatsappAssistantConfig.upsert({
    where: { accountId: params.accountId },
    create: {
      accountId: params.accountId,
      enabled: body.enabled ?? false,
      tone: body.tone ?? 'PROFESSIONAL',
      responseLength: body.responseLength ?? 'MEDIUM',
      confidenceLevel: body.confidenceLevel ?? 'MEDIUM',
      businessName: body.businessName ?? null,
      customKnowledge: body.customKnowledge ?? null,
      fallbackMessage: body.fallbackMessage ?? null,
      websiteUrl: body.websiteUrl ?? null,
      shopifyEnabled: body.shopifyEnabled ?? false,
      workingHoursStart: body.workingHoursStart ?? null,
      workingHoursEnd: body.workingHoursEnd ?? null,
      offlineMessage: body.offlineMessage ?? null,
    },
    update: configData,
    include: {
      faqs: { orderBy: { createdAt: 'asc' } },
      handoverRules: true,
      knowledgeSources: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (body.handoverRules?.length) {
    await Promise.all(
      body.handoverRules.map(rule =>
        prisma.whatsappHandoverRule.upsert({
          where: { configId_ruleType: { configId: config.id, ruleType: rule.ruleType } },
          create: { configId: config.id, ruleType: rule.ruleType, enabled: rule.enabled },
          update: { enabled: rule.enabled },
        })
      )
    )
  }

  return NextResponse.json({ config })
}
