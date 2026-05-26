import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { buildEmailHtml, personalize, type LayoutStyle, type Product } from '@/lib/email-campaign-template'

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const user = session.user as { email?: string | null; name?: string | null }

  const {
    toEmail,
    subject,
    previewText,
    headline,
    body,
    ctaText,
    imageUrl,
    discountRate,
    layoutStyle,
    brandColor,
    storeName: storeNameOverride,
    products,
  } = await req.json()

  const targetEmail = toEmail || user.email
  if (!targetEmail) return NextResponse.json({ error: 'Email adresi gerekli' }, { status: 400 })

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { storeName: true, email: true } })
    const storeName = storeNameOverride || dbUser?.storeName || 'Marksio'

    const emailDomain = await prisma.emailDomain.findFirst({
      where: { userId, status: 'verified' },
      orderBy: { createdAt: 'desc' },
    })
    const fromEmail = emailDomain
      ? `${storeName} <test@${emailDomain.domain}>`
      : `${storeName} <onboarding@resend.dev>`

    const testVars: Record<string, string> = {
      firstName: 'Test',
      lastName: 'Kullanıcı',
      email: targetEmail,
      productName: headline ?? 'Ürün',
      discountCode: '',
    }

    const html = buildEmailHtml({
      storeName,
      previewText: personalize(previewText ?? '', testVars),
      headline: personalize(headline ?? 'Test E-posta', testVars),
      body: personalize(body ?? 'Bu bir test e-postasıdır.', testVars),
      ctaText: personalize(ctaText ?? 'Alışverişe Başla', testVars),
      ctaUrl: BASE_URL,
      imageUrl: imageUrl || undefined,
      discountRate: discountRate || undefined,
      unsubscribeUrl: `${BASE_URL}/unsubscribe/test`,
      trackingPixelUrl: `${BASE_URL}/api/track/open?c=test&u=test`,
      layoutStyle: (layoutStyle as LayoutStyle) ?? 'default',
      brandColor: brandColor || undefined,
      products: (products as Product[]) || [],
    })

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: targetEmail,
      subject: `[TEST] ${subject ?? headline ?? 'Kampanya Önizleme'}`,
      html,
    })

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, sentTo: targetEmail })
  } catch (err) {
    console.error('[Send Test Email]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Test maili gönderilemedi' }, { status: 500 })
  }
}
