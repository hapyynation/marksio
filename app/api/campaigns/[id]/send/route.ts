import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { buildEmailHtml, personalize, type LayoutStyle } from '@/lib/email-campaign-template'

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'
const BATCH_SIZE = 50
const BATCH_DELAY_MS = 600

async function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

function extractName(customer: { firstName?: string | null; lastName?: string | null; name: string }) {
  const parts = customer.name.trim().split(/\s+/)
  return {
    firstName: customer.firstName ?? parts[0] ?? '',
    lastName: customer.lastName ?? parts.slice(1).join(' ') ?? '',
  }
}

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

    const emailDomain = await prisma.emailDomain.findFirst({
      where: { userId, status: 'verified' },
      orderBy: { createdAt: 'desc' },
    })
    const fromEmail = emailDomain
      ? `${storeName} <kampanya@${emailDomain.domain}>`
      : `${storeName} <onboarding@resend.dev>`

    const segmentFilter =
      campaign.segment && campaign.segment !== 'all'
        ? { segment: campaign.segment }
        : {}

    const customers = await prisma.customer.findMany({
      where: { userId, unsubscribed: false, ...segmentFilter },
      select: {
        id: true, email: true, phone: true,
        name: true, firstName: true, lastName: true,
        unsubscribeToken: true,
      },
    })

    if (customers.length === 0) {
      return NextResponse.json({ error: 'Bu segmentte gönderilecek müşteri yok' }, { status: 400 })
    }

    let sent = 0
    let failed = 0
    const errors: string[] = []

    // Update campaign status to sending
    await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'sending' } })

    if (campaign.type === 'email') {
      // Batch processing
      for (let i = 0; i < customers.length; i += BATCH_SIZE) {
        const batch = customers.slice(i, i + BATCH_SIZE)

        const batchResults = await Promise.allSettled(
          batch.map(async customer => {
            if (!customer.email) throw new Error('Email yok')

            const { firstName, lastName } = extractName(customer)
            const trackParams = new URLSearchParams({ c: campaign.id, u: customer.id })
            const ctaUrl = `${BASE_URL}/api/track/click?${trackParams.toString()}&url=${encodeURIComponent(BASE_URL)}`
            const unsubscribeUrl = `${BASE_URL}/unsubscribe/${customer.unsubscribeToken}`
            const trackingPixelUrl = `${BASE_URL}/api/track/open?${trackParams.toString()}`

            const vars: Record<string, string> = {
              firstName,
              lastName,
              email: customer.email,
              productName: campaign.name,
              discountCode: campaign.imagePrompt ? '' : '',
            }

            const subject = personalize(campaign.subject ?? campaign.name, vars)
            const headline = personalize(campaign.headline ?? campaign.name, vars)
            const body = personalize(campaign.body, vars)
            const ctaText = personalize(campaign.ctaText ?? campaign.cta ?? 'Alışverişe Başla', vars)

            const html = buildEmailHtml({
              storeName,
              previewText: campaign.previewText ?? '',
              headline,
              body,
              ctaText,
              ctaUrl,
              imageUrl: campaign.imageUrl ?? undefined,
              discountRate: undefined,
              unsubscribeUrl,
              trackingPixelUrl,
              layoutStyle: (campaign.layoutStyle as LayoutStyle) ?? 'default',
              brandColor: campaign.brandColor ?? undefined,
            })

            const { data: resendData, error } = await resend.emails.send({
              from: fromEmail,
              to: customer.email,
              subject,
              html,
              text: body,
            })

            return { customer, resendId: (resendData as { id?: string } | null)?.id, error }
          })
        )

        // Process results
        const eventRecords: Array<{
          campaignId: string; customerId: string; email: string
          type: string; resendMessageId?: string; metadata: string
        }> = []

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            const { customer, resendId, error } = result.value
            if (error) {
              failed++
              errors.push(`${customer.email}: ${error.message}`)
              eventRecords.push({
                campaignId: campaign.id, customerId: customer.id,
                email: customer.email, type: 'failed',
                metadata: JSON.stringify({ error: error.message }),
              })
            } else {
              sent++
              eventRecords.push({
                campaignId: campaign.id, customerId: customer.id,
                email: customer.email, type: 'sent',
                resendMessageId: resendId,
                metadata: '{}',
              })
            }
          } else {
            failed++
            errors.push(result.reason?.message ?? 'Bilinmeyen hata')
          }
        }

        if (eventRecords.length > 0) {
          await prisma.emailEvent.createMany({ data: eventRecords })
        }

        // Delay between batches
        if (i + BATCH_SIZE < customers.length) {
          await delay(BATCH_DELAY_MS)
        }
      }
    } else if (campaign.type === 'whatsapp') {
      const integration = await prisma.integration.findFirst({
        where: { userId, platform: 'whatsapp', status: 'active' },
      })

      if (!integration?.accessToken || !integration?.sellerId) {
        await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'draft' } })
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
          failed++
          errors.push(`${customer.phone}: ${e instanceof Error ? e.message : 'hata'}`)
        }
      }
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        sent: { increment: sent },
        status: 'active',
        sentAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: customers.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    })
  } catch (err) {
    console.error('[Campaign Send]', err)
    await prisma.campaign.update({ where: { id: params.id }, data: { status: 'draft' } }).catch(() => {})
    return NextResponse.json({ error: 'Kampanya gönderilemedi' }, { status: 500 })
  }
}
