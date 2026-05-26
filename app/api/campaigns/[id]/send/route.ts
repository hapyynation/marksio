import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { buildEmailHtml } from '@/lib/email-campaign-template'

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = session.user.id

  try {
    const campaign = await prisma.campaign.findFirst({ where: { id: params.id, userId } })
    if (!campaign) return NextResponse.json({ error: 'Kampanya bulunamadı' }, { status: 404 })
    if (campaign.status === 'active') return NextResponse.json({ error: 'Kampanya zaten gönderildi' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { storeName: true },
    })
    const storeName = user?.storeName ?? 'Marksio'

    const emailDomain = await prisma.emailDomain.findFirst({
      where: { userId, status: 'verified' },
      orderBy: { createdAt: 'desc' },
    })
    const fromEmail = emailDomain
      ? `${storeName} <kampanya@${emailDomain.domain}>`
      : `${storeName} <kampanya@marksio.co>`

    const segmentFilter =
      campaign.segment && campaign.segment !== 'all'
        ? { segment: campaign.segment }
        : {}

    const customers = await prisma.customer.findMany({
      where: { userId, unsubscribed: false, ...segmentFilter },
      select: { id: true, email: true, phone: true, name: true, unsubscribeToken: true },
    })

    if (customers.length === 0) {
      return NextResponse.json({ error: 'Bu segmentte müşteri yok' }, { status: 400 })
    }

    let sent = 0
    const errors: string[] = []
    const eventRecords: Array<{ campaignId: string; customerId: string; type: string; metadata: string }> = []

    if (campaign.type === 'email') {
      for (const customer of customers) {
        if (!customer.email) continue

        const trackParams = new URLSearchParams({ c: campaign.id, u: customer.id })
        const clickParams = new URLSearchParams({ c: campaign.id, u: customer.id })
        const ctaUrl = `${BASE_URL}/api/track/click?${clickParams.toString()}&url=${encodeURIComponent(BASE_URL)}`
        const unsubscribeUrl = `${BASE_URL}/unsubscribe/${customer.unsubscribeToken}`
        const trackingPixelUrl = `${BASE_URL}/api/track/open?${trackParams.toString()}`

        const html = buildEmailHtml({
          storeName,
          previewText: campaign.previewText ?? '',
          headline: campaign.headline ?? campaign.name,
          body: campaign.body,
          ctaText: campaign.cta ?? 'Alışverişe Başla',
          ctaUrl,
          imageUrl: campaign.imageUrl ?? undefined,
          discountRate: undefined,
          unsubscribeUrl,
          trackingPixelUrl,
        })

        const { error } = await resend.emails.send({
          from: fromEmail,
          to: customer.email,
          subject: campaign.subject ?? campaign.name,
          html,
          text: campaign.body,
        })

        if (error) {
          errors.push(`${customer.email}: ${error.message}`)
          eventRecords.push({ campaignId: campaign.id, customerId: customer.id, type: 'failed', metadata: JSON.stringify({ error: error.message }) })
        } else {
          sent++
          eventRecords.push({ campaignId: campaign.id, customerId: customer.id, type: 'sent', metadata: '{}' })
        }
      }
    } else if (campaign.type === 'whatsapp') {
      const integration = await prisma.integration.findFirst({
        where: { userId, platform: 'whatsapp', status: 'active' },
      })

      if (!integration?.accessToken || !integration?.sellerId) {
        return NextResponse.json({ error: 'WhatsApp Business API bağlantısı bulunamadı' }, { status: 503 })
      }

      for (const customer of customers) {
        if (!customer.phone) continue
        try {
          await sendWhatsAppMessage({
            phoneNumberId: integration.sellerId,
            accessToken: integration.accessToken,
            to: customer.phone,
            body: campaign.body,
          })
          sent++
          eventRecords.push({ campaignId: campaign.id, customerId: customer.id, type: 'sent', metadata: '{}' })
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'hata'
          errors.push(`${customer.phone}: ${msg}`)
          eventRecords.push({ campaignId: campaign.id, customerId: customer.id, type: 'failed', metadata: JSON.stringify({ error: msg }) })
        }
      }
    }

    await Promise.all([
      prisma.campaign.update({
        where: { id: campaign.id },
        data: { sent: { increment: sent }, status: 'active' },
      }),
      eventRecords.length > 0
        ? prisma.emailEvent.createMany({ data: eventRecords })
        : Promise.resolve(),
    ])

    return NextResponse.json({
      success: true,
      sent,
      total: customers.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    })
  } catch (err) {
    console.error('[Campaign Send]', err)
    return NextResponse.json({ error: 'Kampanya gönderilemedi' }, { status: 500 })
  }
}
