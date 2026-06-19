import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import { decrypt } from '@/lib/encryption'
import { Client } from '@upstash/qstash'
import type { Prisma } from '@prisma/client'

const META_API = 'https://graph.facebook.com/v19.0'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.marksio.com'

const CATEGORY_MAP: Record<string, 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'> = {
  MARKETING: 'MARKETING',
  UTILITY: 'UTILITY',
  AUTHENTICATION: 'AUTHENTICATION',
}
const STATUS_MAP: Record<string, 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'DISABLED'> = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PAUSED: 'PAUSED',
  DISABLED: 'DISABLED',
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  let body: { accountId?: string } = {}
  try { body = await req.json() } catch { /* empty body is fine */ }
  const { accountId } = body

  // accountId yoksa kullanıcının ilk bağlı hesabını kullan
  const account = await prisma.whatsappAccount.findFirst({
    where: {
      userId: session.user.id,
      status: 'CONNECTED',
      ...(accountId ? { id: accountId } : {}),
    },
    select: { id: true, wabaId: true, accessToken: true },
  })
  if (!account) return NextResponse.json({ error: 'Bağlı hesap bulunamadı.' }, { status: 404 })

  const accessToken = decrypt(account.accessToken)

  const metaRes = await fetch(
    `${META_API}/${account.wabaId}/message_templates?limit=250`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!metaRes.ok) {
    return NextResponse.json({ error: 'Meta API\'dan template listesi alınamadı.' }, { status: 400 })
  }

  const data = await metaRes.json() as { data?: MetaTemplate[] }
  const templates = data.data ?? []

  let synced = 0
  for (const tpl of templates) {
    await prisma.whatsappTemplate.upsert({
      where: { accountId_metaTemplateId: { accountId: account.id, metaTemplateId: String(tpl.id) } },
      create: {
        accountId: account.id,
        metaTemplateId: String(tpl.id),
        name: tpl.name,
        category: CATEGORY_MAP[tpl.category] ?? 'MARKETING',
        language: tpl.language,
        status: STATUS_MAP[tpl.status] ?? 'PENDING',
        componentsJson: (tpl.components ?? []) as Prisma.InputJsonValue,
        rejectedReason: tpl.rejected_reason ?? null,
        syncedAt: new Date(),
      },
      update: {
        name: tpl.name,
        category: CATEGORY_MAP[tpl.category] ?? 'MARKETING',
        language: tpl.language,
        status: STATUS_MAP[tpl.status] ?? 'PENDING',
        componentsJson: (tpl.components ?? []) as Prisma.InputJsonValue,
        rejectedReason: tpl.rejected_reason ?? null,
        syncedAt: new Date(),
      },
    })
    synced++
  }

  // QStash ile günlük otomatik sync zamanla (sadece ilk sync'te)
  if (accountId) scheduleDaily(accountId).catch(() => null)

  return NextResponse.json({ synced })
}

async function scheduleDaily(accountId: string) {
  if (!process.env.QSTASH_TOKEN) return
  const qstash = new Client({ token: process.env.QSTASH_TOKEN })
  await qstash.schedules.create({
    destination: `${APP_URL}/api/whatsapp/templates/sync`,
    cron: '0 3 * * *',
    body: JSON.stringify({ accountId }),
    headers: { 'Content-Type': 'application/json' },
  })
}

interface MetaTemplate {
  id: string | number
  name: string
  category: string
  language: string
  status: string
  components?: unknown[]
  rejected_reason?: string
}
