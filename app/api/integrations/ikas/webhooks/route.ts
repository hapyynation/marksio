import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const IKAS_GQL = 'https://graphql.myikas.com/api/1.0/graphql'

const IKAS_WEBHOOK_TOPICS = [
  'ORDER_CREATED',
  'ORDER_UPDATED',
  'CUSTOMER_CREATED',
  'CUSTOMER_UPDATED',
  'CART_ABANDONED',
] as const

export async function POST() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const integration = await prisma.integration.findUnique({
    where: { userId_platform: { userId: session.user.id, platform: 'ikas' } },
  })
  if (!integration?.accessToken) {
    return NextResponse.json({ error: 'İkas bağlantısı bulunamadı' }, { status: 404 })
  }

  let meta: Record<string, unknown> = {}
  try { meta = JSON.parse(integration.meta) } catch {}

  const webhookSecret = (meta.webhookSecret as string | undefined) ?? randomUUID()
  const deliveryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/ikas?iid=${integration.id}`
  const registeredIds: string[] = []

  for (const topic of IKAS_WEBHOOK_TOPICS) {
    try {
      const res = await fetch(IKAS_GQL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${integration.accessToken}`,
        },
        body: JSON.stringify({
          query: `
            mutation CreateWebhook($input: CreateWebhookInput!) {
              createWebhook(input: $input) {
                webhook { id topic }
              }
            }
          `,
          variables: {
            input: { topic, deliveryUrl, webhookSecret },
          },
        }),
      })

      const json = await res.json()
      const webhookId = json?.data?.createWebhook?.webhook?.id
      if (webhookId) registeredIds.push(webhookId)
    } catch (err) {
      console.error(`[İkas Webhooks] ${topic} kaydı başarısız:`, err)
    }
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      meta: JSON.stringify({
        ...meta,
        webhookSecret,
        webhookIds: registeredIds,
        webhooksRegistered: true,
      }),
    },
  })

  return NextResponse.json({ success: true, registered: registeredIds.length })
}
