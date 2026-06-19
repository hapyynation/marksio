import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { buildEmailHtml, personalize, type LayoutStyle, type Product } from '@/lib/email-campaign-template'
import { getSystemFromAddress } from '@/lib/mail-from'
import { matchesRules, type SegmentRule } from '@/lib/segment-engine'
import { getLimits, getUpgradePlan } from '@/lib/plan-limits'
import { renderEmail, interpolateVars, type EmailTemplate } from '@/lib/email-renderer'

const resend  = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

const BATCH_SIZE              = 50
const BATCH_DELAY_MS          = 600
const DAILY_LIMIT_NEW_DOMAIN  = 500
const DAILY_LIMIT_ESTABLISHED = 50_000

// ─── Result types ─────────────────────────────────────────────────────────────

export interface SendResult {
  success: boolean
  sent: number
  failed: number
  total: number
  errors?: string[]
  error?: string
  code?: string
  statusCode?: number
  domainUsed?: string | null
  usedFallbackDomain?: boolean
  planLimitData?: { feature: string; currentPlan: string; requiredPlan: string }
}

export interface SendOptions {
  /** Enforce monthly plan limits when provided (pass session.user.effectivePlan). Omit to skip. */
  effectivePlan?: string
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function extractName(c: { firstName?: string | null; lastName?: string | null; name: string }) {
  const parts = c.name.trim().split(/\s+/)
  return {
    firstName: c.firstName ?? parts[0] ?? '',
    lastName:  c.lastName  ?? parts.slice(1).join(' ') ?? '',
  }
}

async function getMonthlySentCount(userId: string): Promise<number> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  return prisma.emailEvent.count({
    where: { type: 'sent', createdAt: { gte: startOfMonth }, campaign: { userId } },
  })
}

async function getDailySentCount(userId: string): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  return prisma.emailEvent.count({
    where: { type: 'sent', createdAt: { gte: startOfDay }, campaign: { userId } },
  })
}

// ─── Core executor ────────────────────────────────────────────────────────────

export async function executeCampaignSend(
  campaignId: string,
  userId: string,
  options: SendOptions = {},
): Promise<SendResult> {
  const { effectivePlan } = options

  // ── Fetch campaign ──────────────────────────────────────────────────────────
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } })
  if (!campaign) {
    return { success: false, sent: 0, failed: 0, total: 0, error: 'Kampanya bulunamadı', statusCode: 404 }
  }
  if (campaign.status === 'active' || campaign.status === 'sending') {
    return { success: false, sent: 0, failed: 0, total: 0, error: 'Kampanya zaten gönderildi', statusCode: 400 }
  }

  // ── Fetch user ──────────────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { storeName: true, plan: true },
  })
  const storeName  = user?.storeName ?? 'Marksio'
  const isPaidPlan = user?.plan !== 'free' && user?.plan !== 'starter'

  // ── Monthly plan limit (only enforced when effectivePlan is passed) ─────────
  if (campaign.type === 'email' && effectivePlan) {
    const limits = getLimits(effectivePlan)
    if (limits.emailSendsPerMonth !== -1) {
      const sentThisMonth = await getMonthlySentCount(userId)
      if (sentThisMonth >= limits.emailSendsPerMonth) {
        return {
          success: false, sent: 0, failed: 0, total: 0,
          error: 'PLAN_LIMIT_REACHED', statusCode: 403,
          planLimitData: {
            feature:      'emailSends',
            currentPlan:  effectivePlan,
            requiredPlan: getUpgradePlan(effectivePlan),
          },
        }
      }
    }
  }

  // ── Email domain ────────────────────────────────────────────────────────────
  const emailDomain = campaign.type === 'email'
    ? await prisma.emailDomain.findFirst({
        where: { userId, status: 'verified' },
        orderBy: { createdAt: 'desc' },
      })
    : null

  if (campaign.type === 'email' && !emailDomain && isPaidPlan) {
    return {
      success: false, sent: 0, failed: 0, total: 0, statusCode: 400,
      error: 'Doğrulanmış bir mail domaini bulunamadı. Ayarlar → E-posta Gönderimi bölümünden domain ekleyip doğrulayın.',
      code: 'DOMAIN_UNVERIFIED',
    }
  }

  // ── From header ─────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const domainAny = emailDomain as any
  let fromEmail: string
  if (emailDomain) {
    const prefix      = (domainAny.fromPrefix as string | null) || 'kampanya'
    const displayName = (domainAny.senderName as string | null) || storeName
    fromEmail = `${displayName} <${prefix}@${emailDomain.domain}>`
  } else {
    fromEmail = getSystemFromAddress(storeName)
  }

  // ── Daily domain warmup limit ───────────────────────────────────────────────
  if (campaign.type === 'email') {
    const domainAgeDays = emailDomain
      ? Math.floor((Date.now() - emailDomain.createdAt.getTime()) / 86_400_000)
      : 0
    const dailyLimit = domainAgeDays < 30 ? DAILY_LIMIT_NEW_DOMAIN : DAILY_LIMIT_ESTABLISHED
    const sentToday  = await getDailySentCount(userId)
    if (sentToday >= dailyLimit) {
      return {
        success: false, sent: 0, failed: 0, total: 0, statusCode: 429,
        error: `Günlük gönderim limitine ulaşıldı (${dailyLimit.toLocaleString('tr-TR')} mail). Yarın tekrar deneyin.`,
        code: 'DAILY_LIMIT_REACHED',
      }
    }
  }

  // ── Recipients ──────────────────────────────────────────────────────────────
  let campaignProducts: Product[] = []
  try {
    campaignProducts = JSON.parse((campaign as { productsJson?: string }).productsJson ?? '[]')
  } catch { campaignProducts = [] }

  let segRules: SegmentRule[] = []
  let segMatchType: 'all' | 'any' = 'all'
  let useRuleFilter = false

  if (campaign.segment && campaign.segment !== 'all') {
    const dbSeg = await prisma.segment.findFirst({
      where: {
        userId,
        OR: [
          { id: campaign.segment },
          { name: { equals: campaign.segment, mode: 'insensitive' } },
        ],
      },
    })
    if (dbSeg) {
      try { segRules = JSON.parse(dbSeg.rules) } catch { segRules = [] }
      segMatchType  = (dbSeg.matchType ?? 'all') as 'all' | 'any'
      useRuleFilter = segRules.length > 0
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawCustomers = await prisma.customer.findMany({
    where: {
      userId,
      unsubscribed: false,
      bounced:      false,
      complained:   false,
      ...(!useRuleFilter && campaign.segment && campaign.segment !== 'all'
        ? { segment: campaign.segment }
        : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    select: {
      id: true, email: true, phone: true,
      name: true, firstName: true, lastName: true,
      unsubscribeToken: true,
      totalSpent: true, totalOrders: true, avgOrder: true,
      lastOrder: true, tags: true, source: true, segment: true, score: true,
    },
  })

  const filteredCustomers = campaign.type === 'email'
    ? rawCustomers.filter(c => c.email && c.email.trim() !== '')
    : rawCustomers

  let customers = useRuleFilter
    ? filteredCustomers.filter(c => matchesRules(c, segRules, segMatchType))
    : filteredCustomers

  if (customers.length === 0) {
    return { success: false, sent: 0, failed: 0, total: 0, error: 'Bu segmentte gönderilecek müşteri yok', statusCode: 400 }
  }

  let sent   = 0
  let failed = 0
  const errors: string[] = []

  /* CampaignRecipient: kayıtlı alıcıları kontrol et, tekrar gönderimi önle */
  if (campaign.type === 'email') {
    const existingRecipients = await prisma.campaignRecipient.findMany({
      where: { campaignId: campaign.id, status: 'sent' },
      select: { customerId: true },
    })
    const alreadySent = new Set(existingRecipients.map(r => r.customerId))
    customers = customers.filter(c => !alreadySent.has(c.id))

    /* Pending kayıt oluştur (upsert — tekrar çalışırsa üzerine yaz) */
    if (customers.length > 0) {
      await prisma.campaignRecipient.createMany({
        data: customers.map(c => ({
          campaignId: campaign.id,
          customerId: c.id,
          email:      c.email ?? '',
          status:     'pending',
        })),
        skipDuplicates: true,
      })
    }
  }

  // ── A/B test split ─────────────────────────────────────────────────────────
  interface ABVariant { subject?: string; body?: string; ctaText?: string }
  const customerVariantMap = new Map<string, 'A' | 'B'>()
  let activeABTest: { id: string; variantA: ABVariant; variantB: ABVariant; splitPercent: number } | null = null

  if (campaign.type === 'email') {
    const abTest = await prisma.aBTest.findFirst({
      where: { campaignId: campaign.id, userId, status: 'running' },
    })
    if (abTest) {
      activeABTest = {
        id:           abTest.id,
        variantA:     (abTest.variantA as ABVariant),
        variantB:     (abTest.variantB as ABVariant),
        splitPercent: abTest.splitPercent,
      }
      const cutoff = Math.floor(customers.length * (abTest.splitPercent / 100))
      customers.forEach((c, idx) => {
        customerVariantMap.set(c.id, idx < cutoff ? 'A' : 'B')
      })
    }
  }

  await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'sending' } })

  try {
    // ── Email batch send ────────────────────────────────────────────────────────
    if (campaign.type === 'email') {
      for (let i = 0; i < customers.length; i += BATCH_SIZE) {
        const batch = customers.slice(i, i + BATCH_SIZE)

        const batchResults = await Promise.allSettled(
          batch.map(async customer => {
            if (!customer.email) throw new Error('Email yok')

            const { firstName, lastName } = extractName(customer)
            const trackParams             = new URLSearchParams({ c: campaign.id, u: customer.id })
            const ctaUrl                  = `${BASE_URL}/api/track/click?${trackParams.toString()}&url=${encodeURIComponent(BASE_URL)}`
            const unsubscribeUrl          = `${BASE_URL}/unsubscribe/${customer.unsubscribeToken}`
            const trackingPixelUrl        = `${BASE_URL}/api/track/open?${trackParams.toString()}`

            const vars: Record<string, string> = {
              firstName, lastName,
              name: customer.name,
              email: customer.email ?? '',
              segment: customer.segment ?? '',
              productName: campaign.name, discountCode: '',
            }

            // Apply A/B variant overrides if this customer is in a test
            const abVariant = activeABTest ? customerVariantMap.get(customer.id) : undefined
            const abOverride = abVariant === 'A' ? activeABTest?.variantA : abVariant === 'B' ? activeABTest?.variantB : undefined

            const subject  = personalize(abOverride?.subject  ?? campaign.subject  ?? campaign.name, vars)
            const headline = personalize(campaign.headline ?? campaign.name, vars)
            const body     = personalize(abOverride?.body     ?? campaign.body, vars)
            const ctaText  = personalize(abOverride?.ctaText  ?? campaign.ctaText ?? campaign.cta ?? 'Alışverişe Başla', vars)

            const campaignAny = campaign as Record<string, unknown>
            let html: string
            let emailText = body

            if (campaignAny.templateType && campaignAny.templateType !== 'custom') {
              const rendered = await renderEmail(
                campaignAny.templateType as EmailTemplate,
                {
                  brandName:          domainAny?.senderName ?? storeName,
                  brandColor:         (campaignAny.brandColor as string) ?? '#4470ff',
                  customerName:       firstName || 'Değerli Müşterimiz',
                  ctaText:            interpolateVars(ctaText, vars),
                  ctaUrl:             (campaignAny.ctaUrl as string) ?? ctaUrl,
                  bodyText:           body,
                  subject,
                  heroText:           headline,
                  discountCode:       (campaignAny.discountCode as string) ?? undefined,
                  discountAmount:     undefined,
                  productImageUrl:    campaign.imageUrl ?? undefined,
                  specialOfferText:   body,
                  daysSinceLastOrder: 30,
                  unsubscribeUrl,
                  cartItems:          campaignProducts.map((p: Product) => ({
                    name:     p.productName,
                    price:    `${p.price ?? 0} ₺`,
                    imageUrl: p.productImage ?? undefined,
                    quantity: 1,
                  })),
                  cartTotal:       '—',
                  orderNumber:     '—',
                  orderDate:       new Date().toLocaleDateString('tr-TR'),
                  orderItems:      [],
                  subtotal:        '—',
                  shipping:        '—',
                  total:           '—',
                  shippingAddress: '',
                },
              )
              html      = rendered.html
              emailText = rendered.text
            } else {
              html = buildEmailHtml({
                storeName:       domainAny?.senderName ?? storeName,
                previewText:     campaign.previewText ?? '',
                headline, body, ctaText, ctaUrl,
                imageUrl:        campaign.imageUrl ?? undefined,
                discountRate:    undefined,
                unsubscribeUrl,
                trackingPixelUrl,
                layoutStyle:     (campaign.layoutStyle as LayoutStyle) ?? 'default',
                brandColor:      campaign.brandColor ?? undefined,
                products:        campaignProducts,
              })
            }

            const { data: resendData, error } = await resend.emails.send({
              from: fromEmail, to: customer.email, subject, html, text: emailText,
              headers: {
                'List-Unsubscribe':      `<${unsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            })

            return { customer, resendId: (resendData as { id?: string } | null)?.id, error }
          })
        )

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
                email: customer.email ?? '', type: 'failed',
                metadata: JSON.stringify({ error: error.message }),
              })
            } else {
              sent++
              eventRecords.push({
                campaignId: campaign.id, customerId: customer.id,
                email: customer.email ?? '', type: 'sent',
                resendMessageId: resendId, metadata: '{}',
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

        /* CampaignRecipient status güncelle */
        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            const { customer, error } = result.value
            if (customer?.id) {
              await prisma.campaignRecipient.updateMany({
                where: { campaignId: campaign.id, customerId: customer.id },
                data: {
                  status: error ? 'failed' : 'sent',
                  sentAt: error ? null : new Date(),
                },
              }).catch(() => null)
            }
          }
        }

        if (i + BATCH_SIZE < customers.length) await sleep(BATCH_DELAY_MS)
      }

    // ── WhatsApp batch send ─────────────────────────────────────────────────────
    } else if (campaign.type === 'whatsapp') {
      const integration = await prisma.integration.findFirst({
        where: { userId, platform: 'whatsapp', status: 'active' },
      })

      if (!integration?.accessToken || !integration?.sellerId) {
        await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'draft' } })
        return {
          success: false, sent: 0, failed: 0, total: customers.length, statusCode: 503,
          error: 'WhatsApp Business API bağlantısı bulunamadı',
        }
      }

      for (const customer of customers) {
        if (!customer.phone) continue
        try {
          await sendWhatsAppMessage({
            phoneNumberId: integration.sellerId,
            accessToken:   integration.accessToken,
            to:            customer.phone,
            body:          campaign.body,
          })
          sent++
        } catch (e) {
          failed++
          errors.push(`${customer.phone}: ${e instanceof Error ? e.message : 'hata'}`)
        }
      }
    }

    // ── Finalize A/B test counts ────────────────────────────────────────────────
    if (activeABTest) {
      let sentA = 0; let sentB = 0
      customerVariantMap.forEach(v => { if (v === 'A') sentA++; else sentB++ })
      await prisma.aBTest.update({
        where: { id: activeABTest.id },
        data: {
          sentA:     { increment: sentA },
          sentB:     { increment: sentB },
          startedAt: new Date(),
        },
      }).catch(() => null)
    }

    // ── Finalize ────────────────────────────────────────────────────────────────
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { sent: { increment: sent }, status: 'active', sentAt: new Date() },
    })

    return {
      success: true, sent, failed, total: customers.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      domainUsed: emailDomain?.domain ?? null,
      usedFallbackDomain: !emailDomain,
    }

  } catch (err) {
    console.error(`[CampaignExecutor] campaign=${campaignId}`, err)
    await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'draft' } }).catch(() => {})
    return {
      success: false, sent, failed, total: customers.length,
      error: 'Kampanya gönderilemedi', statusCode: 500,
    }
  }
}
