import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOAuthHmac, registerWebhooks } from '@/lib/shopify'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const shop = searchParams.get('shop')
  const stateParam = searchParams.get('state') ?? ''

  if (!code || !shop) {
    return NextResponse.redirect(new URL('/settings?error=missing_params', req.url))
  }

  // state = "nonce:userId" formatında
  const [nonce, userId] = stateParam.split(':')
  const storedNonce = req.cookies.get('shopify_oauth_nonce')?.value
  if (!nonce || !userId || nonce !== storedNonce) {
    return NextResponse.redirect(new URL('/settings?error=invalid_state', req.url))
  }

  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET
  if (clientSecret && !verifyOAuthHmac(searchParams, clientSecret)) {
    return NextResponse.redirect(new URL('/settings?error=invalid_hmac', req.url))
  }

  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: clientSecret,
        code,
      }),
    })

    const tokenBody = await tokenRes.json() as Record<string, string>
    if (!tokenRes.ok) {
      throw new Error(tokenBody?.error_description || tokenBody?.error || 'Token alınamadı')
    }
    const { access_token } = tokenBody

    // Fetch shop name
    let shopName = shop
    try {
      const shopRes = await fetch(`https://${shop}/admin/api/2024-10/shop.json`, {
        headers: { 'X-Shopify-Access-Token': access_token },
      })
      const shopData = await shopRes.json() as { shop?: { name?: string } }
      shopName = shopData.shop?.name ?? shop
    } catch {}

    const integration = await prisma.integration.upsert({
      where: { userId_platform: { userId, platform: 'shopify' } },
      create: {
        userId, platform: 'shopify', shopDomain: shop, accessToken: access_token,
        status: 'active', meta: JSON.stringify({ shopName, webhooksRegistered: false }),
      },
      update: {
        shopDomain: shop, accessToken: access_token, status: 'active',
        meta: JSON.stringify({ shopName, webhooksRegistered: false }),
      },
    })

    // Register webhooks async (non-blocking)
    const appUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? ''
    if (appUrl) {
      registerWebhooks(shop, access_token, appUrl)
        .then(() =>
          prisma.integration.update({
            where: { id: integration.id },
            data: { meta: JSON.stringify({ shopName, webhooksRegistered: true }) },
          }),
        )
        .catch(console.error)
    }

    const res = NextResponse.redirect(
      new URL('/settings?tab=integrations&connected=shopify', req.url),
    )
    res.cookies.delete('shopify_oauth_nonce')
    return res
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Shopify OAuth callback error:', msg)
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(msg)}`, req.url),
    )
  }
}
