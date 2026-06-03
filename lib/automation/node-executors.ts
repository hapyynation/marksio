/**
 * Automation Node Executors
 * Her node tipi için saf executor fonksiyonları.
 * Engine tarafından çağrılır, side-effect'ler burada yaşar.
 */

import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { buildPremiumEmail } from '@/lib/premium-email-builder'

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY env var not set')
  return new Resend(key)
}

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

export type RunCtx = {
  triggerData: Record<string, unknown>
  vars: Record<string, unknown>
}

export type NodeResult = {
  output:     Record<string, unknown>
  branch?:    string    // 'yes' | 'no' | 'a' | 'b'  (condition / split_test)
  pause?:     true
  resumeAt?:  Date
  pauseLabel?: string
  stop?:      true
  vars?:      Record<string, unknown>
}

/* ─────────────────────────────────────────────────────────────
   TRIGGER — just pass through
───────────────────────────────────────────────────────────── */

export async function execTrigger(): Promise<NodeResult> {
  return { output: {} }
}

/* ─────────────────────────────────────────────────────────────
   WAIT
───────────────────────────────────────────────────────────── */

export async function execWait(data: Record<string, unknown>): Promise<NodeResult> {
  const amount = Number(data.delayAmount ?? 1)
  const unit   = String(data.delayUnit ?? 'hours')

  const msMap: Record<string, number> = {
    minutes: 60_000,
    hours:   3_600_000,
    days:    86_400_000,
  }
  const ms      = (msMap[unit] ?? 3_600_000) * amount
  const resumeAt = new Date(Date.now() + ms)

  return {
    output:     { delayMs: ms },
    pause:      true,
    resumeAt,
    pauseLabel: `${amount} ${unit}`,
  }
}

/* ─────────────────────────────────────────────────────────────
   STOP
───────────────────────────────────────────────────────────── */

export async function execStop(): Promise<NodeResult> {
  return { output: {}, stop: true }
}

/* ─────────────────────────────────────────────────────────────
   CONDITION
───────────────────────────────────────────────────────────── */

export async function execCondition(
  data: Record<string, unknown>,
  customerId: string,
): Promise<NodeResult> {
  const condition = String(data.condition ?? '')
  const cfg       = (data.config ?? {}) as Record<string, unknown>

  const result = await evaluateCondition(condition, cfg, customerId)
  const branch = result ? 'yes' : 'no'
  return { output: { condition, result, branch }, branch }
}

async function evaluateCondition(
  condition: string,
  cfg: Record<string, unknown>,
  customerId: string,
): Promise<boolean> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) return false

  switch (condition) {
    case 'purchased':
      return customer.totalOrders > 0

    case 'is_vip': {
      const tags: string[] = safeParseJson(customer.tags, [])
      return tags.includes('vip') || tags.includes('VIP')
    }

    case 'total_spent_gt': {
      const val = Number(cfg.value ?? 0)
      return customer.totalSpent > val
    }

    case 'order_count_gt': {
      const val = Number(cfg.value ?? 0)
      return customer.totalOrders > val
    }

    case 'email_opened': {
      const event = await prisma.emailEvent.findFirst({
        where: { customerId, type: 'opened' },
        orderBy: { createdAt: 'desc' },
      })
      return !!event
    }

    case 'clicked': {
      const event = await prisma.emailEvent.findFirst({
        where: { customerId, type: 'clicked' },
        orderBy: { createdAt: 'desc' },
      })
      return !!event
    }

    case 'order_completed': {
      const order = await prisma.order.findFirst({
        where: { customerId, status: { in: ['delivered', 'confirmed', 'completed'] } },
      })
      return !!order
    }

    case 'no_purchase': {
      const thresholdDays = Number(cfg.days ?? 30)
      const cutoff = new Date(Date.now() - thresholdDays * 86_400_000)
      const customer = await prisma.customer.findUnique({ where: { id: customerId } })
      if (!customer) return false
      if (!customer.lastOrder) return true
      return new Date(customer.lastOrder) < cutoff
    }

    default:
      return false
  }
}

/* ─────────────────────────────────────────────────────────────
   SPLIT TEST (A/B)
───────────────────────────────────────────────────────────── */

export async function execSplitTest(data: Record<string, unknown>): Promise<NodeResult> {
  const aPercent = Number((data.config as Record<string, unknown>)?.aPercent ?? 50)
  const roll     = Math.random() * 100
  const branch   = roll < aPercent ? 'a' : 'b'
  return { output: { roll, branch }, branch }
}

/* ─────────────────────────────────────────────────────────────
   SEND EMAIL
───────────────────────────────────────────────────────────── */

export async function execSendEmail(
  data: Record<string, unknown>,
  customerId: string,
  userId: string,
  ctx: RunCtx,
): Promise<NodeResult> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) throw new Error(`Customer ${customerId} not found`)
  if (customer.unsubscribed) return { output: { skipped: 'unsubscribed' } }

  const cfg = (data.config ?? {}) as Record<string, string>

  /* Şablon seçilmişse template'den al */
  let subject = cfg.subject ?? 'Marksio Mesajı'
  let bodyText = cfg.body ?? ''

  if (cfg.templateId) {
    const tmpl = await prisma.template.findFirst({ where: { id: cfg.templateId, userId } })
    if (tmpl) {
      subject = tmpl.subject ?? subject
      bodyText = tmpl.body
    }
  }

  subject  = interpolate(subject, customer, ctx.triggerData)
  bodyText = interpolate(bodyText, customer, ctx.triggerData)

  /* Gönderici domain */
  const domain = await prisma.emailDomain.findFirst({
    where: { userId, status: 'verified' },
    orderBy: { createdAt: 'desc' },
  })
  const from = domain
    ? `${cfg.senderName ?? 'Mağaza'} <kampanya@${domain.domain}>`
    : `${cfg.senderName ?? 'Mağaza'} <kampanya@marksio.co>`

  const html = buildPremiumEmail({
    storeName: cfg.senderName ?? 'Mağaza',
    headline:  subject,
    body:      bodyText,
    cta:       'Hemen İncele',
    ctaUrl:    '#',
  })

  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY bulunamadı — Email gönderilemedi')
  }

  const result = await getResend().emails.send({
    from,
    to: [customer.email],
    subject,
    html,
    text: bodyText,
  })

  /* Automation sent counter */
  await prisma.automation.updateMany({
    where: { id: String(data.automationId ?? '') },
    data: { sent: { increment: 1 } },
  })

  return { output: { emailId: (result.data as { id?: string } | null)?.id, to: customer.email, subject } }
}

/* ─────────────────────────────────────────────────────────────
   SEND WHATSAPP
───────────────────────────────────────────────────────────── */

export async function execSendWhatsApp(
  data: Record<string, unknown>,
  customerId: string,
  userId: string,
  ctx: RunCtx,
): Promise<NodeResult> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) throw new Error(`Customer ${customerId} not found`)
  if (!customer.phone) return { output: { skipped: 'no_phone' } }

  const cfg     = (data.config ?? {}) as Record<string, string>
  const message = interpolate(cfg.message ?? '', customer, ctx.triggerData)

  const settings = await prisma.whatsAppSettings.findUnique({ where: { userId } })
  const phoneNumberId = settings?.phoneNumberId ?? process.env.META_WHATSAPP_PHONE_NUMBER_ID
  const accessToken   = settings?.metaAccessToken ?? process.env.META_WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    return { output: { skipped: 'no_credentials' } }
  }

  await sendWhatsAppMessage({ phoneNumberId, accessToken, to: customer.phone, body: message })

  return { output: { to: customer.phone, message: message.slice(0, 50) } }
}

/* ─────────────────────────────────────────────────────────────
   ADD / REMOVE TAG
───────────────────────────────────────────────────────────── */

export async function execAddTag(
  data: Record<string, unknown>,
  customerId: string,
): Promise<NodeResult> {
  const tag = String((data.config as Record<string, string>)?.tag ?? '').trim()
  if (!tag) return { output: { skipped: 'no_tag' } }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) throw new Error(`Customer ${customerId} not found`)

  const tags: string[] = safeParseJson(customer.tags, [])
  if (!tags.includes(tag)) {
    tags.push(tag)
    await prisma.customer.update({ where: { id: customerId }, data: { tags: JSON.stringify(tags) } })
  }

  return { output: { tag, added: !tags.includes(tag) } }
}

export async function execRemoveTag(
  data: Record<string, unknown>,
  customerId: string,
): Promise<NodeResult> {
  const tag = String((data.config as Record<string, string>)?.tag ?? '').trim()
  if (!tag) return { output: { skipped: 'no_tag' } }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) throw new Error(`Customer ${customerId} not found`)

  const tags: string[] = safeParseJson(customer.tags, [])
  const filtered = tags.filter(t => t !== tag)

  if (filtered.length !== tags.length) {
    await prisma.customer.update({ where: { id: customerId }, data: { tags: JSON.stringify(filtered) } })
  }

  return { output: { tag, removed: filtered.length !== tags.length } }
}

/* ─────────────────────────────────────────────────────────────
   MOVE SEGMENT
───────────────────────────────────────────────────────────── */

export async function execMoveSegment(
  data: Record<string, unknown>,
  customerId: string,
): Promise<NodeResult> {
  const cfg    = (data.config ?? {}) as Record<string, string>
  const segName  = String(cfg.segment ?? '').trim()
  const action   = cfg.segmentAction ?? 'add' // 'add' | 'remove'

  if (!segName) return { output: { skipped: 'no_segment' } }

  if (action === 'add') {
    await prisma.customer.update({ where: { id: customerId }, data: { segment: segName } })
  } else {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (customer?.segment === segName) {
      await prisma.customer.update({ where: { id: customerId }, data: { segment: 'new' } })
    }
  }

  return { output: { segment: segName, action } }
}

/* ─────────────────────────────────────────────────────────────
   WEBHOOK
───────────────────────────────────────────────────────────── */

export async function execWebhook(
  data: Record<string, unknown>,
  customerId: string,
  ctx: RunCtx,
): Promise<NodeResult> {
  const cfg    = (data.config ?? {}) as Record<string, string>
  const url    = cfg.url ?? ''
  const method = cfg.method ?? 'POST'

  if (!url) return { output: { skipped: 'no_url' } }

  const body = cfg.body
    ? interpolate(cfg.body, null, ctx.triggerData)
    : JSON.stringify({ customerId, triggerData: ctx.triggerData })

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method !== 'GET' ? body : undefined,
    signal: AbortSignal.timeout(10_000),
  })

  return { output: { url, status: res.status, ok: res.ok } }
}

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

export function safeParseJson<T>(str: string, fallback: T): T {
  try { return JSON.parse(str) } catch { return fallback }
}

type CustomerLike = { name: string; email: string; phone?: string | null } | null

function interpolate(
  template: string,
  customer: CustomerLike,
  triggerData: Record<string, unknown>,
): string {
  const firstName = customer?.name?.split(' ')[0] ?? ''
  return template
    .replace(/\{\{firstName\}\}/gi, firstName)
    .replace(/\{\{isim\}\}/gi, firstName)
    .replace(/\{\{ad\}\}/gi, firstName)
    .replace(/\{\{tam_isim\}\}/gi, customer?.name ?? '')
    .replace(/\{\{email\}\}/gi, customer?.email ?? '')
    .replace(/\{\{phone\}\}/gi, customer?.phone ?? '')
    .replace(/\{\{siparis_no\}\}/gi, String(triggerData.orderNumber ?? ''))
    .replace(/\{\{toplam\}\}/gi, triggerData.total ? `₺${triggerData.total}` : '')
    .replace(/\{\{url\}\}/gi, String(triggerData.abandonedCheckoutUrl ?? '#'))
}
