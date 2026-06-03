/**
 * POST /api/track/visit
 *
 * Shopify Script Tag tarafından her sayfa görüntülemesinde çağrılır.
 * Gerçek zamanlı ziyaretçi verilerini toplar ve Canlı Takip sayfasına sağlar.
 *
 * Body: { shopDomain, path, source, ref, device, country, email? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const {
      shopDomain,
      path      = '/',
      source    = 'direct',
      ref       = '',
      device    = 'desktop',
      country   = '',
      email,
    } = body as Record<string, string>

    if (!shopDomain) {
      return NextResponse.json({ ok: false }, { status: 400, headers: HEADERS })
    }

    // İlgili kullanıcıyı bul
    const integration = await prisma.integration.findFirst({
      where: { shopDomain, platform: 'shopify', status: 'active' },
      select: { userId: true },
    })
    if (!integration) {
      return NextResponse.json({ ok: true }, { headers: HEADERS })
    }

    const userId = integration.userId

    // Eğer email varsa müşteriyi bul ve CustomerEvent yaz
    if (email) {
      const customer = await prisma.customer.findUnique({
        where: { userId_email: { userId, email: email.toLowerCase() } },
      })
      if (customer) {
        await prisma.customerEvent.create({
          data: {
            userId,
            customerId: customer.id,
            type: 'page_viewed',
            source: 'shopify_pixel',
            data: JSON.stringify({ path, source, ref, device, country }),
          },
        }).catch(() => null)
      }
    }

    // Checkout sayfasındaysa + email varsa sepet terk adayı
    if (path.includes('/checkout') && email) {
      const customer = await prisma.customer.findUnique({
        where: { userId_email: { userId, email: email.toLowerCase() } },
      })
      if (customer) {
        // Checkout başladı event'i (deduplicated)
        const existing = await prisma.customerEvent.findFirst({
          where: {
            customerId: customer.id,
            type: 'checkout_started',
            createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }, // son 30dk
          },
        })
        if (!existing) {
          await prisma.customerEvent.create({
            data: {
              userId,
              customerId: customer.id,
              type: 'checkout_started',
              source: 'shopify_pixel',
              data: JSON.stringify({ path, source }),
            },
          }).catch(() => null)
        }
      }
    }

    return NextResponse.json({ ok: true }, { headers: HEADERS })
  } catch (err) {
    console.error('[Track Visit]', err)
    return NextResponse.json({ ok: true }, { headers: HEADERS })
  }
}
