import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { prisma } from '@/lib/prisma'

function verifyHmac(params: URLSearchParams, secret: string): boolean {
  const hmac = params.get('hmac') ?? ''
  const pairs: string[] = []
  params.forEach((value, key) => {
    if (key !== 'hmac') pairs.push(`${key}=${value}`)
  })
  pairs.sort()
  const message = pairs.join('&')
  const computed = createHmac('sha256', secret).update(message).digest('hex')
  return computed === hmac
}

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

  // HMAC doğrula
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET
  if (clientSecret && !verifyHmac(searchParams, clientSecret)) {
    return NextResponse.redirect(new URL('/settings?error=invalid_hmac', req.url))
  }

  try {
    // Code'u access token ile değiştir
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }),
    })

    const tokenBody = await tokenRes.json()
    console.log('Shopify token response:', tokenRes.status, JSON.stringify(tokenBody))

    if (!tokenRes.ok) {
      const errMsg = tokenBody?.error_description || tokenBody?.error || 'Token alınamadı'
      throw new Error(errMsg)
    }
    const { access_token } = tokenBody

    await prisma.integration.upsert({
      where: { userId_platform: { userId, platform: 'shopify' } },
      create: {
        userId,
        platform: 'shopify',
        shopDomain: shop,
        accessToken: access_token,
        status: 'active',
      },
      update: {
        shopDomain: shop,
        accessToken: access_token,
        status: 'active',
      },
    })

    const res = NextResponse.redirect(new URL('/settings?tab=integrations&connected=shopify', req.url))
    res.cookies.delete('shopify_oauth_nonce')
    return res
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Shopify OAuth callback error:', msg)
    return NextResponse.redirect(new URL(`/settings?error=${encodeURIComponent(msg)}`, req.url))
  }
}
