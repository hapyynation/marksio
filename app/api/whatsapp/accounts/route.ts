import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import { encrypt } from '@/lib/encryption'

const META_API = 'https://graph.facebook.com/v19.0'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.marksio.com'

function mapMetaError(code: number | undefined, message: string): string {
  if (code === 190) return 'Access token süresi dolmuş veya geçersiz. Meta Developer Portal\'dan yeni bir token oluşturun.'
  if (code === 200 || code === 10) return 'Token, telefon numarasına erişim iznine sahip değil. Uygulama izinlerini kontrol edin.'
  if (code === 100) return 'Telefon numarası bulunamadı. Phone Number ID değerini kontrol edin.'
  if (message?.includes('Invalid OAuth') || message?.includes('access token')) return 'Geçersiz token formatı. Token\'ı kopyalarken başına/sonuna boşluk gelmiş olabilir.'
  if (message?.includes('not found')) return 'Hesap bulunamadı. WABA ID veya Phone Number ID hatalı olabilir.'
  return 'Meta API bağlantı hatası. Girdiğiniz bilgileri kontrol edin ve tekrar deneyin.'
}

const QUALITY_MAP: Record<string, 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'> = {
  GREEN: 'GREEN', YELLOW: 'YELLOW', RED: 'RED',
}
const TIER_MAP: Record<string, 'TIER_250' | 'TIER_1K' | 'TIER_10K' | 'TIER_100K' | 'UNLIMITED'> = {
  TIER_250: 'TIER_250', TIER_1K: 'TIER_1K', TIER_10K: 'TIER_10K',
  TIER_100K: 'TIER_100K', UNLIMITED: 'UNLIMITED',
}

export async function GET() {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const accounts = await prisma.whatsappAccount.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      wabaId: true,
      phoneNumberId: true,
      displayName: true,
      verifiedName: true,
      qualityRating: true,
      messagingTier: true,
      webhookVerifyToken: true,
      status: true,
      isDemo: true,
      lastWebhookAt: true,
      connectedAt: true,
    },
    orderBy: { connectedAt: 'desc' },
  })

  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as {
    wabaId?: string
    phoneNumberId?: string
    accessToken?: string
    appSecret?: string
  }
  const { wabaId, phoneNumberId, accessToken, appSecret } = body

  if (!wabaId || !phoneNumberId || !accessToken || !appSecret) {
    return NextResponse.json({ error: 'Tüm alanlar zorunludur.' }, { status: 400 })
  }

  // Aynı phone number ID zaten bağlı mı?
  const existing = await prisma.whatsappAccount.findUnique({
    where: { phoneNumberId },
  })
  if (existing) {
    return NextResponse.json({ error: 'Bu telefon numarası zaten bir hesaba bağlı.' }, { status: 409 })
  }

  // Meta API bağlantı testi
  const metaRes = await fetch(
    `${META_API}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  ).catch(() => null)

  if (!metaRes || !metaRes.ok) {
    const err = metaRes ? await metaRes.json().catch(() => ({})) : {}
    const code = (err as { error?: { code?: number } })?.error?.code
    const msg = (err as { error?: { message?: string } })?.error?.message ?? ''
    return NextResponse.json({ error: mapMetaError(code, msg) }, { status: 400 })
  }

  const metaData = await metaRes.json() as {
    display_phone_number?: string
    verified_name?: string
    quality_rating?: string
    messaging_limit_tier?: string
  }

  const webhookVerifyToken = crypto.randomUUID()

  const account = await prisma.whatsappAccount.create({
    data: {
      userId: session.user.id,
      wabaId,
      phoneNumberId,
      accessToken: encrypt(accessToken),
      appSecret: encrypt(appSecret),
      displayName: metaData.display_phone_number ?? null,
      verifiedName: metaData.verified_name ?? null,
      qualityRating: QUALITY_MAP[metaData.quality_rating ?? ''] ?? 'UNKNOWN',
      messagingTier: TIER_MAP[metaData.messaging_limit_tier ?? ''] ?? 'TIER_250',
      webhookVerifyToken,
      status: 'CONNECTED',
    },
    select: {
      id: true,
      wabaId: true,
      phoneNumberId: true,
      displayName: true,
      verifiedName: true,
      qualityRating: true,
      messagingTier: true,
      webhookVerifyToken: true,
      status: true,
      connectedAt: true,
    },
  })

  // Template sync'i arka planda tetikle
  fetch(`${APP_URL}/api/whatsapp/templates/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: account.id }),
  }).catch(() => null)

  // WABA'yı bu uygulamaya abone et (gelen mesajları almak için zorunlu)
  const subscribeRes = await fetch(
    `${META_API}/${wabaId}/subscribed_apps`,
    { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } }
  ).catch(() => null)

  if (!subscribeRes?.ok) {
    const subscribeErr = subscribeRes ? await subscribeRes.json().catch(() => ({})) : {}
    console.error('[WhatsApp Subscribe] Hata:', subscribeErr)
    return NextResponse.json(
      { ...account, subscribed: false, subscribeError: 'Bağlantı kuruldu ama mesaj alma yetkisi etkinleştirilemedi. Webhook ayarladıktan sonra tekrar deneyin.' },
      { status: 201 }
    )
  }

  console.log('[WhatsApp Subscribe] Başarılı — wabaId:', wabaId)
  return NextResponse.json({ ...account, subscribed: true }, { status: 201 })
}
