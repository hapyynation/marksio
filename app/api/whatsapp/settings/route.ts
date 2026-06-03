import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULTS = {
  botName: 'Marksio Asistan',
  welcomeMessage: 'Merhaba! Size nasıl yardımcı olabilirim?',
  fallbackMessage: 'Üzgünüm, bu konuda yardımcı olamıyorum. Ekibimiz en kısa sürede iletişime geçecek.',
  tone: 'friendly',
  responseLength: 'medium',
  emojiUsage: 'low',
  humanHandoffMessage: 'Sizi mağaza ekibimizle bağlıyorum.',
  businessHoursMessage: 'Mesai saatlerimiz dışında yazıyorsunuz. En kısa sürede yanıt vereceğiz.',
  language: 'tr',
  autoResponseEnabled: true,
  businessHoursEnabled: false,
  businessHoursStart: '09:00',
  businessHoursEnd: '18:00',
  metaAccessToken: '',
  phoneNumberId: '',
  businessAccountId: '',
  webhookVerifyToken: '',
  appSecret: '',
  connectionStatus: 'disconnected',
}

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = session.user.id

  try {
    const [settings, totalConversations, activeConversations, resolvedByBot, humanHandoffs, campaignAgg] = await Promise.all([
      prisma.whatsAppSettings.findUnique({ where: { userId } }),
      prisma.whatsAppConversation.count({ where: { userId } }),
      prisma.whatsAppConversation.count({ where: { userId, status: 'open' } }),
      prisma.whatsAppConversation.count({ where: { userId, resolvedBy: 'bot' } }),
      prisma.whatsAppConversation.count({ where: { userId, resolvedBy: 'human' } }),
      prisma.whatsAppCampaign.aggregate({
        where: { userId },
        _sum: { sentCount: true, failedCount: true },
      }),
    ])

    const totalResolved = resolvedByBot + humanHandoffs

    return NextResponse.json({
      settings: settings
        ? {
            ...settings,
            metaAccessToken: settings.metaAccessToken ? '●●●●●●●●●●●●' : '',
            appSecret: settings.appSecret ? '●●●●●●●●●●●●' : '',
            hasMetaToken: !!settings.metaAccessToken,
            hasAppSecret: !!settings.appSecret,
          }
        : { ...DEFAULTS, hasMetaToken: false, hasAppSecret: false },
      stats: {
        totalConversations,
        activeConversations,
        botResolutionRate: totalResolved > 0 ? Math.round((resolvedByBot / totalResolved) * 100) : 0,
        humanHandoffs,
        campaignMessagesSent: campaignAgg._sum.sentCount ?? 0,
        failedMessages: campaignAgg._sum.failedCount ?? 0,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = session.user.id

  try {
    const body = await req.json()

    const {
      botName, welcomeMessage, fallbackMessage, tone, responseLength,
      emojiUsage, humanHandoffMessage, businessHoursMessage, language,
      autoResponseEnabled, businessHoursEnabled, businessHoursStart, businessHoursEnd,
      metaAccessToken, phoneNumberId, businessAccountId, webhookVerifyToken, appSecret,
    } = body

    const existing = await prisma.whatsAppSettings.findUnique({ where: { userId } })

    const sensitiveUpdate: Record<string, string> = {}
    if (metaAccessToken && !metaAccessToken.startsWith('●')) {
      sensitiveUpdate.metaAccessToken = metaAccessToken
    }
    if (appSecret && !appSecret.startsWith('●')) {
      sensitiveUpdate.appSecret = appSecret
    }

    const data = {
      botName: botName ?? DEFAULTS.botName,
      welcomeMessage: welcomeMessage ?? DEFAULTS.welcomeMessage,
      fallbackMessage: fallbackMessage ?? DEFAULTS.fallbackMessage,
      tone: tone ?? DEFAULTS.tone,
      responseLength: responseLength ?? DEFAULTS.responseLength,
      emojiUsage: emojiUsage ?? DEFAULTS.emojiUsage,
      humanHandoffMessage: humanHandoffMessage ?? DEFAULTS.humanHandoffMessage,
      businessHoursMessage: businessHoursMessage ?? DEFAULTS.businessHoursMessage,
      language: language ?? DEFAULTS.language,
      autoResponseEnabled: autoResponseEnabled ?? existing?.autoResponseEnabled ?? DEFAULTS.autoResponseEnabled,
      businessHoursEnabled: businessHoursEnabled ?? existing?.businessHoursEnabled ?? DEFAULTS.businessHoursEnabled,
      businessHoursStart: businessHoursStart ?? existing?.businessHoursStart ?? DEFAULTS.businessHoursStart,
      businessHoursEnd: businessHoursEnd ?? existing?.businessHoursEnd ?? DEFAULTS.businessHoursEnd,
      phoneNumberId: phoneNumberId ?? existing?.phoneNumberId ?? '',
      businessAccountId: businessAccountId ?? existing?.businessAccountId ?? '',
      webhookVerifyToken: webhookVerifyToken ?? existing?.webhookVerifyToken ?? '',
      ...sensitiveUpdate,
    }

    const settings = await prisma.whatsAppSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    })

    return NextResponse.json({
      ok: true,
      settings: { ...settings, metaAccessToken: undefined, appSecret: undefined },
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}
