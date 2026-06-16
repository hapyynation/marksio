import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { registerWebhooks, registerScriptTag } from '@/lib/shopify'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { shopDomain, accessToken } = await req.json()
  if (!shopDomain || !accessToken) {
    return NextResponse.json({ error: 'shopDomain ve accessToken gerekli' }, { status: 400 })
  }

  // Normalize domain
  const domain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')

  // Validate credentials by calling Shopify
  try {
    const testRes = await fetch(
      `https://${domain}/admin/api/2024-01/shop.json`,
      { headers: { 'X-Shopify-Access-Token': accessToken } }
    )
    if (!testRes.ok) {
      return NextResponse.json({ error: 'Shopify bağlantısı başarısız. Domain veya token hatalı.' }, { status: 400 })
    }
    const shopData = await testRes.json()
    const shopName = shopData.shop?.name ?? domain

    // Upsert integration
    const integration = await prisma.integration.upsert({
      where: { userId_platform: { userId: session.user.id, platform: 'shopify' } },
      create: {
        userId: session.user.id,
        platform: 'shopify',
        shopDomain: domain,
        accessToken,
        status: 'active',
        meta: JSON.stringify({ shopName }),
      },
      update: {
        shopDomain: domain,
        accessToken,
        status: 'active',
        meta: JSON.stringify({ shopName }),
      },
    })

    // Register webhooks + Script Tag async (non-blocking)
    const appUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? ''
    if (appUrl) {
      Promise.all([
        registerWebhooks(domain, accessToken, appUrl),
        registerScriptTag(domain, accessToken, appUrl, integration.id),
      ])
        .then(() =>
          prisma.integration.update({
            where: { id: integration.id },
            data: { meta: JSON.stringify({ shopName, webhooksRegistered: true, scriptTagInstalled: true }) },
          }),
        )
        .catch(console.error)
    }

    return NextResponse.json({ success: true, integration: { id: integration.id, shopName, domain } })
  } catch {
    return NextResponse.json({ error: 'Shopify API erişim hatası' }, { status: 500 })
  }
}
