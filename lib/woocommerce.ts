import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

const WC_WEBHOOK_TOPICS = [
  'order.created',
  'order.updated',
  'customer.created',
  'customer.updated',
] as const

export async function registerWooCommerceWebhooks(integrationId: string): Promise<void> {
  const integration = await prisma.integration.findUnique({ where: { id: integrationId } })
  if (!integration?.accessToken || !integration.apiSecret || !integration.shopDomain) return

  let meta: Record<string, unknown> = {}
  try { meta = JSON.parse(integration.meta) } catch {}

  const webhookSecret = (meta.webhookSecret as string | undefined) ?? randomUUID()
  const deliveryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/woocommerce`
  const auth = Buffer.from(`${integration.accessToken}:${integration.apiSecret}`).toString('base64')
  const base = `https://${integration.shopDomain}/wp-json/wc/v3`
  const registeredIds: number[] = []

  for (const topic of WC_WEBHOOK_TOPICS) {
    try {
      const res = await fetch(`${base}/webhooks`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Marksio — ${topic}`,
          topic,
          delivery_url: deliveryUrl,
          secret: webhookSecret,
          status: 'active',
        }),
      })

      if (res.ok) {
        const json = await res.json()
        if (json?.id) registeredIds.push(json.id)
      } else {
        console.error(`[WooCommerce Webhooks] ${topic} kayıt hatası:`, res.status)
      }
    } catch (err) {
      console.error(`[WooCommerce Webhooks] ${topic} kayıt başarısız:`, err)
    }
  }

  await prisma.integration.update({
    where: { id: integrationId },
    data: {
      meta: JSON.stringify({
        ...meta,
        webhookSecret,
        webhookIds: registeredIds,
        webhooksRegistered: true,
      }),
    },
  })
}

export async function deleteWooCommerceWebhooks(integrationId: string): Promise<void> {
  const integration = await prisma.integration.findUnique({ where: { id: integrationId } })
  if (!integration?.accessToken || !integration.apiSecret || !integration.shopDomain) return

  let meta: Record<string, unknown> = {}
  try { meta = JSON.parse(integration.meta) } catch {}

  const webhookIds = (meta.webhookIds as number[] | undefined) ?? []
  if (webhookIds.length === 0) return

  const auth = Buffer.from(`${integration.accessToken}:${integration.apiSecret}`).toString('base64')
  const base = `https://${integration.shopDomain}/wp-json/wc/v3`

  for (const id of webhookIds) {
    try {
      await fetch(`${base}/webhooks/${id}?force=true`, {
        method: 'DELETE',
        headers: { Authorization: `Basic ${auth}` },
      })
    } catch (err) {
      console.error(`[WooCommerce Webhooks] ${id} silme başarısız:`, err)
    }
  }
}
