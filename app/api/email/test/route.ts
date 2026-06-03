import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { Resend } from 'resend'
import { buildPremiumEmail } from '@/lib/premium-email-builder'
import { getSystemFromAddress } from '@/lib/mail-from'

const resend = new Resend(process.env.RESEND_API_KEY)
const TEST_EMAIL = process.env.TEST_EMAIL ?? 'info@vosensio.com'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const { subject, body, previewText, campaignName, type, templateId, discount, productImage, heroImageUrl } = await req.json()

    const storeName = (session.user as { storeName?: string }).storeName ?? 'Demo Mağaza'
    const headline = subject || campaignName || 'Test Kampanyası'
    const resolvedImage = heroImageUrl || productImage

    const accentMap: Record<string, string> = { vip: '#1a1a1a', winback: '#d97706', welcome: '#059669', promotion: '#ea5c1e' }
    const tplId = templateId || (type === 'vip' ? 'vip' : type === 'at_risk' ? 'winback' : type === 'new' ? 'welcome' : 'promotion')

    const html = buildPremiumEmail({
      storeName,
      accentColor: accentMap[tplId] ?? '#ea5c1e',
      headline,
      subheadline: previewText,
      body: body || 'Bu bir test emailidir.',
      cta: 'Hemen İncele',
      ctaUrl: 'https://marksio.app',
      discount: discount ? String(discount).replace('%', '') : undefined,
      heroImage: resolvedImage,
    })

    const userEmail = (session.user as { email?: string }).email
    const toEmail = userEmail ?? TEST_EMAIL

    const { data, error } = await resend.emails.send({
      from: getSystemFromAddress(storeName),
      to: [toEmail],
      subject: `[TEST] ${headline}`,
      html,
      text: body,
    })

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, id: data?.id, sentTo: toEmail })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email gönderilemedi'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
