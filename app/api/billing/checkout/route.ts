import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { VARIANT_IDS, createCheckout } from '@/lib/lemonsqueezy'

const BASE_URL = process.env.NEXTAUTH_URL || 'https://app.marksio.com'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor' }, { status: 401 })
  }

  const { planId } = await req.json() as { planId?: string }

  if (!planId || planId === 'free') {
    return NextResponse.json({ error: 'Geçersiz plan' }, { status: 400 })
  }

  const variantId = VARIANT_IDS[planId]
  if (!variantId) {
    return NextResponse.json({ error: `Bilinmeyen plan: ${planId}` }, { status: 400 })
  }

  if (!process.env.LEMONSQUEEZY_API_KEY) {
    console.error('[Billing] LEMONSQUEEZY_API_KEY eksik')
    return NextResponse.json({ error: 'Ödeme sistemi yapılandırılmamış' }, { status: 503 })
  }

  try {
    const checkout = await createCheckout({
      variantId,
      userEmail:  session.user.email,
      userName:   session.user.name,
      userId:     session.user.id,
      successUrl: `${BASE_URL}/plans?success=1&plan=${planId}`,
      cancelUrl:  `${BASE_URL}/plans?cancelled=1`,
    })

    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    console.error('[Billing Checkout]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Checkout oluşturulamadı' },
      { status: 500 },
    )
  }
}
