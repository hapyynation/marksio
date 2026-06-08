import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { executeCampaignSend } from '@/lib/campaign-executor'

const CRON_SECRET = process.env.CRON_SECRET ?? ''

export async function GET(req: NextRequest) {
  if (CRON_SECRET) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date()

  // Find up to 10 scheduled campaigns whose send time has arrived.
  // We cap at 10 to stay within Vercel's function timeout (10 s on Hobby, 60 s on Pro).
  const campaigns = await prisma.campaign.findMany({
    where: {
      status:      'scheduled',
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 10,
    select: { id: true, userId: true, name: true, scheduledAt: true },
  })

  console.log(`[Cron/Campaigns] ${campaigns.length} planlanmış kampanya bulundu — ${now.toISOString()}`)

  if (campaigns.length === 0) {
    return NextResponse.json({ processed: 0, succeeded: 0, failed: 0, ts: now.toISOString() })
  }

  let succeeded = 0
  let failed    = 0

  for (const campaign of campaigns) {
    console.log(`[Cron/Campaigns] Gönderiliyor: campaign=${campaign.id} user=${campaign.userId} scheduledAt=${campaign.scheduledAt?.toISOString()}`)

    try {
      // No effectivePlan passed — skips plan limit check for pre-scheduled sends
      const result = await executeCampaignSend(campaign.id, campaign.userId)

      if (result.success) {
        succeeded++
        console.log(`[Cron/Campaigns] Başarılı: campaign=${campaign.id} name="${campaign.name}" sent=${result.sent} failed=${result.failed}`)
      } else {
        failed++
        console.error(`[Cron/Campaigns] Başarısız: campaign=${campaign.id} name="${campaign.name}" error="${result.error}" code=${result.code ?? 'n/a'}`)
        // Mark failed so cron does not retry on the next run
        await prisma.campaign.update({
          where: { id: campaign.id },
          data:  { status: 'failed' },
        }).catch(e => console.error('[Cron/Campaigns] Status update hatası:', e))
      }
    } catch (err) {
      failed++
      console.error(`[Cron/Campaigns] Beklenmeyen hata: campaign=${campaign.id}`, err)
      await prisma.campaign.update({
        where: { id: campaign.id },
        data:  { status: 'failed' },
      }).catch(() => {})
    }
  }

  console.log(`[Cron/Campaigns] Tamamlandı — işlenen:${campaigns.length} başarılı:${succeeded} başarısız:${failed}`)

  return NextResponse.json({
    processed: campaigns.length,
    succeeded,
    failed,
    ts: now.toISOString(),
  })
}

export async function POST(req: NextRequest) {
  return GET(req)
}
