import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
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

    return NextResponse.json({ success: true, integration: { id: integration.id, shopName, domain } })
  } catch {
    return NextResponse.json({ error: 'Shopify API erişim hatası' }, { status: 500 })
  }
}
