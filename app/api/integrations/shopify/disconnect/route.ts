import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const integration = await prisma.integration.findUnique({
    where: { userId_platform: { userId: session.user.id, platform: 'shopify' } },
  })

  if (integration?.accessToken && integration.shopDomain) {
    // DB'deki webhook ID'lerini oku (meta içinde birden fazla olabilir)
    let meta: Record<string, unknown> = {}
    try { meta = JSON.parse(integration.meta) } catch {}

    const idsFromMeta = (meta.webhookIds as number[] | undefined) ?? []
    const idsFromField = integration.webhookId ? [integration.webhookId] : []
    const allIds = [...new Set([...idsFromMeta.map(String), ...idsFromField])]

    // Shopify'dan webhook'ları sil — hata olursa sessizce geç
    for (const id of allIds) {
      try {
        await fetch(
          `https://${integration.shopDomain}/admin/api/2024-01/webhooks/${id}.json`,
          {
            method: 'DELETE',
            headers: { 'X-Shopify-Access-Token': integration.accessToken },
          },
        )
      } catch (err) {
        console.error(`[Shopify Disconnect] Webhook ${id} silinemedi:`, err)
      }
    }
  }

  await prisma.integration.updateMany({
    where: { userId: session.user.id, platform: 'shopify' },
    data: { status: 'disconnected', accessToken: null, webhookId: null },
  })

  return NextResponse.json({ success: true })
}
