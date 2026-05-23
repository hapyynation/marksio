import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { buildPremiumEmail } from '@/lib/premium-email-builder'

const ACCENT: Record<string, string> = {
  promotion: '#ea5c1e', abandoned_cart: '#d97706', new_product: '#7c3aed',
  winback: '#d97706', vip: '#1a1a1a', welcome: '#059669',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const {
    templateId, subject, body, previewText,
    discount, couponCode, productImage, cta, ctaUrl,
    storeName: storeNameParam,
  } = await req.json()

  const storeName = storeNameParam || (session.user as { storeName?: string }).storeName || 'Demo Mağaza'
  const tplId = templateId || 'promotion'

  const html = buildPremiumEmail({
    storeName,
    accentColor: ACCENT[tplId] ?? '#ea5c1e',
    headline: subject || 'Kampanya Başlığı',
    subheadline: previewText || '',
    body: body || 'Email içeriği...',
    cta: cta || 'Hemen İncele',
    ctaUrl: ctaUrl || '#',
    discount: discount ? String(discount).replace('%', '') : undefined,
    couponCode: couponCode || undefined,
    heroImage: productImage || undefined,
  })

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
