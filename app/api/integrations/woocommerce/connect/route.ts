import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { storeUrl, consumerKey, consumerSecret } = await req.json()
  if (!storeUrl || !consumerKey || !consumerSecret) {
    return NextResponse.json({ error: 'Mağaza URL, Consumer Key ve Secret gerekli' }, { status: 400 })
  }

  const domain = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

  try {
    const testRes = await fetch(`https://${domain}/wp-json/wc/v3/system_status`, {
      headers: { Authorization: `Basic ${auth}` },
    })

    if (!testRes.ok) {
      return NextResponse.json({ error: 'WooCommerce bağlantısı başarısız. Bilgileri kontrol edin.' }, { status: 400 })
    }

    const data = await testRes.json()
    const shopName = data?.settings?.blog_name ?? domain

    await prisma.integration.upsert({
      where: { userId_platform: { userId: session.user.id, platform: 'woocommerce' } },
      create: {
        userId: session.user.id,
        platform: 'woocommerce',
        shopDomain: domain,
        accessToken: consumerKey,
        apiSecret: consumerSecret,
        status: 'active',
        meta: JSON.stringify({ shopName }),
      },
      update: {
        shopDomain: domain,
        accessToken: consumerKey,
        apiSecret: consumerSecret,
        status: 'active',
        meta: JSON.stringify({ shopName }),
      },
    })

    return NextResponse.json({ success: true, shopName })
  } catch {
    return NextResponse.json({ error: 'WooCommerce API erişim hatası' }, { status: 500 })
  }
}
