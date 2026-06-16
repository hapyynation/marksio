import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { storeName, accessToken } = await req.json()
  if (!storeName || !accessToken) {
    return NextResponse.json({ error: 'Mağaza adı ve API token gerekli' }, { status: 400 })
  }

  const domain = storeName.replace(/^https?:\/\//, '').replace(/\/$/, '').replace('.myikas.com', '')

  try {
    const testRes = await fetch('https://graphql.myikas.com/api/1.0/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query: `{ listStore { id name } }` }),
    })

    if (!testRes.ok) {
      return NextResponse.json({ error: 'İkas bağlantısı başarısız. Token hatalı olabilir.' }, { status: 400 })
    }

    const data = await testRes.json()
    if (data.errors) {
      return NextResponse.json({ error: 'İkas API hatası: ' + data.errors[0]?.message }, { status: 400 })
    }

    const storeMeta = data.data?.listStore?.[0]
    const shopName = storeMeta?.name ?? domain

    const integration = await prisma.integration.upsert({
      where: { userId_platform: { userId: session.user.id, platform: 'ikas' } },
      create: {
        userId: session.user.id,
        platform: 'ikas',
        shopDomain: `${domain}.myikas.com`,
        accessToken,
        status: 'active',
        meta: JSON.stringify({ shopName, storeId: storeMeta?.id }),
      },
      update: {
        shopDomain: `${domain}.myikas.com`,
        accessToken,
        status: 'active',
        meta: JSON.stringify({ shopName, storeId: storeMeta?.id }),
      },
    })

    // Webhook'ları arka planda kaydet
    if (process.env.NEXT_PUBLIC_APP_URL) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/ikas/webhooks`, {
        method: 'POST',
        headers: { Cookie: req.headers.get('cookie') ?? '' },
      }).catch(err => console.error('[İkas Connect] Webhook kayıt hatası:', err))
    }

    return NextResponse.json({ success: true, shopName, integrationId: integration.id })
  } catch {
    return NextResponse.json({ error: 'İkas API erişim hatası' }, { status: 500 })
  }
}
