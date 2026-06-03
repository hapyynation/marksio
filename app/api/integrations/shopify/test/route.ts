import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { domain, accessToken } = await req.json()

  if (!domain || !accessToken) {
    return NextResponse.json({ error: 'domain ve accessToken zorunlu' }, { status: 400 })
  }

  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim()

  try {
    const res = await fetch(`https://${cleanDomain}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return NextResponse.json({
        success: false,
        error: res.status === 401
          ? 'Geçersiz API token. Shopify Admin → Apps → Private apps kısmından doğrulayın.'
          : res.status === 404
            ? 'Mağaza bulunamadı. Domain adresini kontrol edin.'
            : `Bağlantı hatası (${res.status}): ${errText.slice(0, 120)}`,
      }, { status: 400 })
    }

    const { shop } = await res.json() as { shop: { name: string; email: string; domain: string; plan_name: string; currency: string; country_name: string } }

    // Fetch quick counts
    const extractCount = async (r: PromiseSettledResult<Response>): Promise<number> => {
      if (r.status !== 'fulfilled' || !r.value.ok) return 0
      const d = await r.value.json().catch(() => ({})) as { count?: number }
      return d.count ?? 0
    }

    const [custRes, orderRes, prodRes] = await Promise.allSettled([
      fetch(`https://${cleanDomain}/admin/api/2024-01/customers/count.json`, { headers: { 'X-Shopify-Access-Token': accessToken } }),
      fetch(`https://${cleanDomain}/admin/api/2024-01/orders/count.json?status=any`, { headers: { 'X-Shopify-Access-Token': accessToken } }),
      fetch(`https://${cleanDomain}/admin/api/2024-01/products/count.json`, { headers: { 'X-Shopify-Access-Token': accessToken } }),
    ])

    const [custCount, orderCount, prodCount] = await Promise.all([
      extractCount(custRes), extractCount(orderRes), extractCount(prodRes),
    ])

    // Check if integration already exists in DB
    const existingIntegration = await prisma.integration.findUnique({
      where: { userId_platform: { userId: session.user.id, platform: 'shopify' } },
    })

    return NextResponse.json({
      success: true,
      shop: {
        name:     shop.name,
        email:    shop.email,
        domain:   shop.domain,
        plan:     shop.plan_name,
        currency: shop.currency,
        country:  shop.country_name,
      },
      counts: { customers: custCount, orders: orderCount, products: prodCount },
      alreadyConnected: !!existingIntegration,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bağlantı kurulamadı'
    return NextResponse.json({
      success: false,
      error: msg.includes('timeout') || msg.includes('fetch')
        ? 'Bağlantı zaman aşımı. Domain adresini ve internet bağlantınızı kontrol edin.'
        : msg,
    }, { status: 400 })
  }
}
