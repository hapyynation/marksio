import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

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

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { storeName: true } })
    const storeName = user?.storeName ?? 'Marksio'

    // Kullanıcının verify edilmiş email domain'ini bul
    const emailDomain = await prisma.emailDomain.findFirst({
      where: { userId, status: 'verified' },
      orderBy: { createdAt: 'desc' },
    })
    const fromEmail = emailDomain
      ? `${storeName} <kampanya@${emailDomain.domain}>`
      : `${storeName} <kampanya@marksio.co>`

    // Segment müşterilerini çek
    const segmentFilter = campaign.segment && campaign.segment !== 'all'
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

    if (campaign.type === 'email') {
      for (const customer of customers) {
        if (!customer.email) continue

        const trackParams = new URLSearchParams({ c: campaign.id, u: customer.id })
        const clickParams = new URLSearchParams({ c: campaign.id, u: customer.id })

        const ctaHtml = campaign.cta
          ? `<div style="text-align:center;margin:24px 0">
              <a href="${BASE_URL}/api/track/click?${clickParams.toString()}&url=${encodeURIComponent('#')}"
                 style="background:#2563EB;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
                ${campaign.cta}
              </a>
             </div>`
          : ''

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;background:#f9fafb;margin:0;padding:32px 16px">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;padding:32px">
    <p style="font-size:13px;font-weight:700;color:#2563EB;margin:0 0 16px">${storeName}</p>
    <div style="font-size:15px;line-height:1.7;color:#374151;white-space:pre-line">${campaign.body}</div>
    ${ctaHtml}
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
    <p style="font-size:11px;color:#9ca3af;text-align:center">
      <a href="${BASE_URL}/unsubscribe/${customer.unsubscribeToken}" style="color:#2563EB">Aboneliği iptal et</a>
    </p>
    <img src="${BASE_URL}/api/track/open?${trackParams.toString()}" width="1" height="1" style="display:none" />
  </div>
</body></html>`

        const { error } = await resend.emails.send({
          from: fromEmail,
          to: customer.email,
          subject: campaign.subject ?? campaign.name,
          html,
          text: campaign.body,
        })

        if (error) errors.push(`${customer.email}: ${error.message}`)
        else sent++
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
        } catch (e) {
          errors.push(`${customer.phone}: ${e instanceof Error ? e.message : 'hata'}`)
        }
      }
    }

    // Kampanya istatistiklerini güncelle
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { sent: { increment: sent }, status: 'active' },
    })

    return NextResponse.json({ success: true, sent, total: customers.length, errors: errors.length ? errors : undefined })
  } catch (err) {
    console.error('[Campaign Send]', err)
    return NextResponse.json({ error: 'Kampanya gönderilemedi' }, { status: 500 })
  }
}
