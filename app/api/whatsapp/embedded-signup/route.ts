import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import { encrypt } from '@/lib/encryption'

const META_API = 'https://graph.facebook.com/v19.0'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.marksio.com'

const QUALITY_MAP: Record<string, 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'> = {
  GREEN: 'GREEN', YELLOW: 'YELLOW', RED: 'RED',
}
const TIER_MAP: Record<string, 'TIER_250' | 'TIER_1K' | 'TIER_10K' | 'TIER_100K' | 'UNLIMITED'> = {
  TIER_250: 'TIER_250', TIER_1K: 'TIER_1K', TIER_10K: 'TIER_10K',
  TIER_100K: 'TIER_100K', UNLIMITED: 'UNLIMITED',
}

// POST /api/whatsapp/embedded-signup
// Body: { code: string; wabaId: string; phoneNumberId: string }
//
// Exchanges the OAuth code from FB Embedded Signup for a long-lived user
// access token, then creates a WhatsappAccount using that token.
// Requires env: FACEBOOK_APP_ID, FACEBOOK_APP_SECRET
export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const appId = process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  if (!appId || !appSecret) {
    return NextResponse.json(
      { error: 'Embedded Signup bu sunucuda yapılandırılmamış.' },
      { status: 503 },
    )
  }

  const body = await req.json() as {
    code?: string
    wabaId?: string
    phoneNumberId?: string
  }
  const { code, wabaId, phoneNumberId } = body

  if (!code || !wabaId || !phoneNumberId) {
    return NextResponse.json({ error: 'code, wabaId ve phoneNumberId zorunludur.' }, { status: 400 })
  }

  // 1. Exchange authorization code for user access token
  const tokenRes = await fetch(
    `https://graph.facebook.com/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`,
  ).catch(() => null)

  if (!tokenRes?.ok) {
    const err = tokenRes ? await tokenRes.json().catch(() => ({})) : {}
    console.error('[Embedded Signup] Token exchange hatası:', err)
    return NextResponse.json({ error: 'Meta yetkilendirme kodu geçersiz veya süresi dolmuş. Tekrar deneyin.' }, { status: 400 })
  }

  const tokenData = await tokenRes.json() as { access_token?: string; token_type?: string }
  const userToken = tokenData.access_token
  if (!userToken) {
    return NextResponse.json({ error: 'Meta\'dan token alınamadı.' }, { status: 400 })
  }

  // 2. Exchange short-lived user token for long-lived token (60 days)
  const llRes = await fetch(
    `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${userToken}`,
  ).catch(() => null)

  const accessToken = llRes?.ok
    ? await llRes.json().then((r: { access_token?: string }) => r.access_token ?? userToken).catch(() => userToken)
    : userToken

  // 3. Verify phone number and get display info
  const phoneRes = await fetch(
    `${META_API}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  ).catch(() => null)

  if (!phoneRes?.ok) {
    const err = phoneRes ? await phoneRes.json().catch(() => ({})) : {}
    console.error('[Embedded Signup] Telefon bilgisi hatası:', err)
    return NextResponse.json({ error: 'Phone Number ID doğrulanamadı. Lütfen bilgilerinizi kontrol edin.' }, { status: 400 })
  }

  const phoneData = await phoneRes.json() as {
    display_phone_number?: string
    verified_name?: string
    quality_rating?: string
    messaging_limit_tier?: string
  }

  // 4. Check for existing account
  const existing = await prisma.whatsappAccount.findUnique({ where: { phoneNumberId } })
  if (existing) {
    return NextResponse.json({ error: 'Bu telefon numarası zaten bir hesaba bağlı.' }, { status: 409 })
  }

  const webhookVerifyToken = crypto.randomUUID()

  const account = await prisma.whatsappAccount.create({
    data: {
      userId: session.user.id,
      wabaId,
      phoneNumberId,
      accessToken: encrypt(accessToken),
      appSecret: encrypt(appSecret),
      displayName: phoneData.display_phone_number ?? null,
      verifiedName: phoneData.verified_name ?? null,
      qualityRating: QUALITY_MAP[phoneData.quality_rating ?? ''] ?? 'UNKNOWN',
      messagingTier: TIER_MAP[phoneData.messaging_limit_tier ?? ''] ?? 'TIER_250',
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

  // 5. Subscribe WABA to app (background — don't block response)
  fetch(`${META_API}/${wabaId}/subscribed_apps`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then(r => {
    if (!r.ok) r.json().then(e => console.error('[Embedded Signup] Subscribe hatası:', e)).catch(() => null)
  }).catch(() => null)

  // 6. Template sync (background)
  fetch(`${APP_URL}/api/whatsapp/templates/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: account.id }),
  }).catch(() => null)

  return NextResponse.json({ ...account, subscribed: true }, { status: 201 })
}
