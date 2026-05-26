import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runSync } from '@/app/api/integrations/shopify/sync/route'

// Called daily by Vercel Cron — syncs all active Shopify integrations
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const integrations = await prisma.integration.findMany({
    where: { platform: 'shopify', status: 'active' },
    select: { id: true, userId: true, shopDomain: true, accessToken: true, meta: true },
  })

  const results: Array<{ userId: string; success: boolean; error?: string }> = []

  for (const ig of integrations) {
    if (!ig.shopDomain || !ig.accessToken) continue
    try {
      await runSync(ig.userId, ig.id, ig.shopDomain, ig.accessToken, ig.meta)
      results.push({ userId: ig.userId, success: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`Cron sync failed for ${ig.shopDomain}:`, msg)
      results.push({ userId: ig.userId, success: false, error: msg })
    }
  }

  return NextResponse.json({ synced: results.length, results })
}
