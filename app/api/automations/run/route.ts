/**
 * Otomasyon engine — işlenmemiş CustomerEvent'leri tarar,
 * eşleşen aktif otomasyonları bulur ve mesaj gönderir.
 *
 * POST /api/automations/run
 * Cron veya webhook'tan tetiklenebilir (örn: Vercel Cron, GitHub Actions, Shopify webhook sonrası)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { buildPremiumEmail } from '@/lib/premium-email-builder'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

const resend = new Resend(process.env.RESEND_API_KEY)

// Cron secret — yetkisiz çağrıları engeller
const CRON_SECRET = process.env.CRON_SECRET ?? ''

export async function POST(req: NextRequest) {
  // Yetki kontrolü
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = []
  let processed = 0
  let sent = 0

  try {
    // ── İşlenmemiş event'leri çek ─────────────────────────────────────
    const events = await prisma.customerEvent.findMany({
      where: { processedAt: null },
      include: { customer: true },
      take: 100, // batch limit
      orderBy: { createdAt: 'asc' },
    })

    for (const event of events) {
      // Bu event tipiyle eşleşen aktif otomasyonları bul
      const automations = await prisma.automation.findMany({
        where: {
          userId: event.userId,
          status: 'active',
          trigger: event.type,
        },
      })

      for (const automation of automations) {
        const steps: AutomationStep[] = JSON.parse(automation.steps || '[]')

        for (const step of steps) {
          // Gecikme hesapla
          const sendAt = calculateSendAt(event.createdAt, step)
          if (sendAt > new Date()) continue // Henüz zamanı gelmediyse atla

          if (event.customer.unsubscribed) continue

          try {
            await executeStep(step, event.customer, automation, event)
            sent++
          } catch (err) {
            results.push(`Hata [${automation.name}/${step.channel}]: ${err}`)
          }
        }

        // Otomasyon sent sayacını güncelle
        await prisma.automation.update({
          where: { id: automation.id },
          data: { sent: { increment: steps.length } },
        })
      }

      // Event'i işlendi olarak işaretle
      await prisma.customerEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date() },
      })

      processed++
    }
  } catch (err) {
    console.error('Automation engine error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ processed, sent, results })
}

// ── Tip tanımları ─────────────────────────────────────────────────────────

interface AutomationStep {
  id: string
  channel: 'email' | 'whatsapp'
  immediate: boolean
  delayAmount: string
  delayUnit: 'dakika' | 'saat' | 'gün' | 'hafta'
  message: string
}

interface CustomerRecord {
  id: string
  name: string
  email: string
  phone: string | null
  unsubscribeToken: string
}

interface EventRecord {
  id: string
  type: string
  data: string
}

interface AutomationRecord {
  id: string
  name: string
}

// ── Gecikme hesabı ─────────────────────────────────────────────────────────

function calculateSendAt(eventTime: Date, step: AutomationStep): Date {
  if (step.immediate) return eventTime

  const amount = parseInt(step.delayAmount) || 1
  const ms = {
    dakika: 60 * 1000,
    saat: 3600 * 1000,
    gün: 86400 * 1000,
    hafta: 7 * 86400 * 1000,
  }[step.delayUnit] ?? 3600000

  return new Date(eventTime.getTime() + amount * ms)
}

// ── Adım çalıştır ──────────────────────────────────────────────────────────

async function executeStep(
  step: AutomationStep,
  customer: CustomerRecord,
  automation: AutomationRecord,
  event: EventRecord,
) {
  const message = interpolateMessage(step.message, customer, event)

  if (step.channel === 'email') {
    await sendEmail(customer, automation.name, message)
  } else if (step.channel === 'whatsapp') {
    await sendWhatsApp(customer, message)
  }
}

// ── Mesaj şablonu interpolasyonu ───────────────────────────────────────────

function interpolateMessage(template: string, customer: CustomerRecord, event: EventRecord): string {
  let eventData: Record<string, string> = {}
  try { eventData = JSON.parse(event.data) } catch {}

  return template
    .replace(/\{\{isim\}\}/gi, customer.name.split(' ')[0] || customer.name)
    .replace(/\{\{ad\}\}/gi, customer.name.split(' ')[0] || customer.name)
    .replace(/\{\{tam_isim\}\}/gi, customer.name)
    .replace(/\{\{siparis_no\}\}/gi, eventData.orderNumber || '')
    .replace(/\{\{toplam\}\}/gi, eventData.total ? `₺${eventData.total}` : '')
    .replace(/\{\{url\}\}/gi, eventData.abandonedCheckoutUrl || '#')
}

// ── Email gönder ───────────────────────────────────────────────────────────

async function sendEmail(customer: CustomerRecord, subject: string, body: string) {
  if (!process.env.RESEND_API_KEY) return

  const html = buildPremiumEmail({
    storeName: 'Marksio',
    accentColor: '#ea5c1e',
    headline: subject,
    body,
    cta: 'Hemen İncele',
    ctaUrl: 'https://marksio.app',
  })

  await resend.emails.send({
    from: 'Marksio <onboarding@resend.dev>',
    to: [customer.email],
    subject,
    html,
    text: body,
  })
}

// ── WhatsApp gönder (Meta Cloud API) ──────────────────────────────────────

async function sendWhatsApp(customer: CustomerRecord, message: string) {
  if (!customer.phone) return

  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN
  if (!phoneNumberId || !accessToken) return

  await sendWhatsAppMessage({ phoneNumberId, accessToken, to: customer.phone, body: message })
}
