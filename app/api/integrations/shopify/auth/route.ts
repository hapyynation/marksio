import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { randomBytes } from 'crypto'

const SCOPES = 'read_customers,write_customers,read_orders,read_checkouts,read_products'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const shop = req.nextUrl.searchParams.get('shop')
  if (!shop) return NextResponse.json({ error: 'shop parametresi gerekli' }, { status: 400 })

  const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`

  const clientId = process.env.SHOPIFY_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'SHOPIFY_CLIENT_ID tanımlı değil' }, { status: 500 })

  const userId = (session.user as any).id
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/shopify/callback`
  const nonce = randomBytes(16).toString('hex')
  // state = nonce:userId — callback'te session olmasa da user'ı bileceğiz
  const state = `${nonce}:${userId}`

  const authUrl =
    `https://${shopDomain}/admin/oauth/authorize` +
    `?client_id=${clientId}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`

  const res = NextResponse.redirect(authUrl)
  res.cookies.set('shopify_oauth_nonce', nonce, { httpOnly: true, maxAge: 300, path: '/', sameSite: 'lax' })
  return res
}
