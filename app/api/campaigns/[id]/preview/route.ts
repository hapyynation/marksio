import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { buildEmailHtml, personalize, type LayoutStyle, type Product } from '@/lib/email-campaign-template'
import { getSystemFromAddress } from '@/lib/mail-from'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId    = session.user.id
  const userEmail = session.user.email as string | undefined

  if (!userEmail) return NextResponse.json({ error: 'Kullanıcı emaili bulunamadı' }, { status: 400 })

  const campaign = await prisma.campaign.findFirst({ where: { id: params.id, userId } })
  if (!campaign) return NextResponse.json({ error: 'Kampanya bulunamadı' }, { status: 404 })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { storeName: true } })
  const storeName = user?.storeName ?? 'Marksio'

  const emailDomain = await prisma.emailDomain.findFirst({
    where: { userId, status: 'verified' },
    orderBy: { createdAt: 'desc' },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const domainAny = emailDomain as any
  const fromEmail = emailDomain
    ? `${domainAny?.senderName ?? storeName} <${domainAny?.fromPrefix ?? 'kampanya'}@${emailDomain.domain}>`
    : getSystemFromAddress(storeName)

  let products: Product[] = []
  try { products = JSON.parse((campaign as { productsJson?: string }).productsJson ?? '[]') } catch { /* */ }

  const vars: Record<string, string> = { firstName: 'Test', lastName: 'Kullanıcı', email: userEmail, productName: campaign.name, discountCode: '' }
  const subject  = personalize(campaign.subject  ?? campaign.name, vars)
  const headline = personalize(campaign.headline ?? campaign.name, vars)
  const body     = personalize(campaign.body, vars)
  const ctaText  = personalize(campaign.ctaText ?? campaign.cta ?? 'Alışverişe Başla', vars)

  const html = buildEmailHtml({
    storeName:        domainAny?.senderName ?? storeName,
    previewText:      campaign.previewText ?? '',
    headline, body, ctaText,
    ctaUrl:           '#',
    imageUrl:         campaign.imageUrl ?? undefined,
    layoutStyle:      (campaign.layoutStyle as LayoutStyle) ?? 'default',
    brandColor:       campaign.brandColor ?? undefined,
    products,
    unsubscribeUrl:   '#',
    trackingPixelUrl: '',
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: fromEmail,
    to:   userEmail,
    subject: `[ÖNIZLEME] ${subject}`,
    html,
    text: body,
  })

  if (error) {
    return NextResponse.json({ error: `Önizleme gönderilemedi: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ success: true, sentTo: userEmail })
}
