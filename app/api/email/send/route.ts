import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { getSystemFromAddress } from '@/lib/mail-from'

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

function buildEmailHtml(params: {
  body: string
  cta?: string
  storeName: string
  campaignId?: string
  customerId?: string
  unsubscribeToken?: string
}) {
  const { body, cta, storeName, campaignId, customerId, unsubscribeToken } = params

  const trackParams = new URLSearchParams()
  if (campaignId) trackParams.set('c', campaignId)
  if (customerId) trackParams.set('u', customerId)
  const trackingPixel = campaignId
    ? `<img src="${BASE_URL}/api/track/open?${trackParams.toString()}" width="1" height="1" style="display:none" />`
    : ''

  const clickParams = new URLSearchParams()
  if (campaignId) clickParams.set('c', campaignId)
  if (customerId) clickParams.set('u', customerId)

  const ctaHtml = cta
    ? `<div style="text-align:center;margin:24px 0">
        <a href="${campaignId ? `${BASE_URL}/api/track/click?${clickParams.toString()}&url=${encodeURIComponent('#')}` : '#'}"
           style="background:#2563EB;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          ${cta}
        </a>
       </div>`
    : ''

  const unsubHtml = unsubscribeToken
    ? `<p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:32px">
        Bu e-postayı almak istemiyorsanız
        <a href="${BASE_URL}/unsubscribe/${unsubscribeToken}" style="color:#2563EB">aboneliğinizi iptal edebilirsiniz</a>.
       </p>`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,sans-serif;background:#f9fafb;margin:0;padding:32px 16px">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <p style="font-size:13px;font-weight:700;color:#2563EB;margin:0 0 16px">${storeName}</p>
    <div style="font-size:15px;line-height:1.7;color:#374151;white-space:pre-line">${body}</div>
    ${ctaHtml}
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
    ${unsubHtml}
    ${trackingPixel}
  </div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const { to, subject, body, previewText, cta, storeName, campaignId } = await req.json()

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'to, subject, body zorunlu' }, { status: 400 })
    }

    const recipients: string[] = Array.isArray(to) ? to : [to]

    // customerId + unsubscribeToken map
    const customerMap: Record<string, { token: string; id: string }> = {}
    if (campaignId) {
      const customers = await prisma.customer.findMany({
        where: { userId: session.user.id, email: { in: recipients }, unsubscribed: false },
        select: { email: true, unsubscribeToken: true, id: true },
      })
      customers.forEach(c => { customerMap[c.email] = { token: c.unsubscribeToken, id: c.id } })
    }

    const validRecipients = campaignId ? recipients.filter(e => customerMap[e]) : recipients

    if (validRecipients.length === 0) {
      return NextResponse.json({ success: true, sent: 0, skipped: recipients.length })
    }

    let sent = 0
    const errors: string[] = []

    for (const email of validRecipients) {
      const customer = customerMap[email]
      const html = buildEmailHtml({
        body,
        cta,
        storeName: storeName ?? 'Marksio',
        campaignId,
        customerId: customer?.id,
        unsubscribeToken: customer?.token,
      })

      const { error } = await resend.emails.send({
        from: getSystemFromAddress(storeName ?? undefined),
        to: email,
        subject,
        html,
        text: body,
        ...(previewText ? { headers: { 'X-Preview-Text': previewText } } : {}),
      })

      if (error) errors.push(`${email}: ${error.message}`)
      else sent++
    }

    if (campaignId && sent > 0) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { sent: { increment: sent }, status: 'active' },
      }).catch(() => null)
    }

    return NextResponse.json({ success: true, sent, skipped: recipients.length - validRecipients.length, errors: errors.length > 0 ? errors : undefined })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email gönderilemedi'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
