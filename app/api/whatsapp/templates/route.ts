import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import { decrypt } from '@/lib/encryption'
import type { Prisma } from '@prisma/client'

const META_API = 'https://graph.facebook.com/v19.0'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as {
    name?: string
    category?: string
    language?: string
    components?: unknown[]
    saveDraft?: boolean
  }

  if (!body.name || !body.category || !body.language || !Array.isArray(body.components)) {
    return NextResponse.json({ error: 'name, category, language ve components zorunludur.' }, { status: 400 })
  }

  // ── DRAFT SAVE (Meta API'ye gitmez, hesap bağlı olmak zorunda değil) ──
  if (body.saveDraft) {
    const anyAccount = await prisma.whatsappAccount.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!anyAccount) {
      return NextResponse.json({ error: 'Taslak kaydetmek için en az bir WhatsApp hesabı gerekli.' }, { status: 400 })
    }
    try {
      const draft = await prisma.whatsappTemplate.create({
        data: {
          accountId: anyAccount.id,
          metaTemplateId: `draft_${Date.now()}`,
          name: body.name,
          category: body.category as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION',
          language: body.language,
          status: 'DRAFT',
          componentsJson: body.components as unknown as Prisma.InputJsonValue,
        },
      })
      await prisma.whatsappTemplateVersion.create({
        data: {
          templateId: draft.id,
          componentsJson: body.components as unknown as Prisma.InputJsonValue,
          status: 'DRAFT',
          attemptNote: 'AI Şablon Oluşturucu ile taslak kaydedildi',
        },
      })
      return NextResponse.json({ template: draft }, { status: 201 })
    } catch (err) {
      console.error('[templates POST] draft save failed:', err)
      return NextResponse.json({ error: 'Taslak kaydedilemedi.' }, { status: 500 })
    }
  }

  const account = await prisma.whatsappAccount.findFirst({
    where: { userId: session.user.id, status: 'CONNECTED' },
    select: { id: true, wabaId: true, accessToken: true },
  })
  if (!account) return NextResponse.json({ error: 'Bağlı WhatsApp hesabı bulunamadı.' }, { status: 400 })

  let accessToken: string
  try {
    accessToken = decrypt(account.accessToken)
  } catch (err) {
    console.error('[templates POST] decrypt failed:', err)
    return NextResponse.json({ error: 'Erişim belirteci çözümlenemedi. WhatsApp hesabını yeniden bağlayın.' }, { status: 500 })
  }

  const metaRes = await fetch(`${META_API}/${account.wabaId}/message_templates`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: body.name,
      language: body.language,
      category: body.category,
      components: body.components,
    }),
  }).catch((err) => {
    console.error('[templates POST] Meta fetch failed:', err)
    return null
  })

  if (!metaRes?.ok) {
    const errBody = metaRes ? await metaRes.json().catch(() => ({})) : {}
    const metaMsg = (errBody as { error?: { message?: string; error_user_msg?: string } })?.error
    const msg = metaMsg?.error_user_msg ?? metaMsg?.message ?? `Meta API hatası (${metaRes?.status ?? 'network'})`
    console.error('[templates POST] Meta rejected:', errBody)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const metaData = await metaRes.json() as { id?: string; status?: string }

  try {
    const template = await prisma.whatsappTemplate.create({
      data: {
        accountId: account.id,
        metaTemplateId: metaData.id ?? `local_${Date.now()}`,
        name: body.name,
        category: body.category as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION',
        language: body.language,
        status: 'PENDING',
        componentsJson: body.components as unknown as Prisma.InputJsonValue,
        submittedAt: new Date(),
      },
    })

    await prisma.whatsappTemplateVersion.create({
      data: {
        templateId: template.id,
        componentsJson: body.components as unknown as Prisma.InputJsonValue,
        status: 'PENDING',
        attemptNote: 'AI Şablon Oluşturucu ile oluşturuldu',
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (err) {
    console.error('[templates POST] Prisma create failed:', err)
    return NextResponse.json({ error: 'Şablon veritabanına kaydedilemedi.' }, { status: 500 })
  }
}

export async function GET() {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const accounts = await prisma.whatsappAccount.findMany({
    where: { userId: session.user.id, status: 'CONNECTED' },
    select: { id: true, lastSyncAt: true, lastSyncError: true },
  })
  const accountIds = accounts.map(a => a.id)
  const primaryAccount = accounts[0] ?? null

  const templates = await prisma.whatsappTemplate.findMany({
    where: { accountId: { in: accountIds } },
    orderBy: { syncedAt: 'desc' },
    include: {
      broadcasts: {
        select: {
          id: true,
          name: true,
          status: true,
          sentCount: true,
          deliveredCount: true,
          readCount: true,
          clickCount: true,
          revenue: true,
          createdAt: true,
          conversions: { select: { revenue: true } },
        },
      },
      versions: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, rejectedReason: true, attemptNote: true, createdAt: true },
      },
    },
  })

  const result = templates.map(t => {
    const stats = t.broadcasts.reduce(
      (acc, b) => {
        const convRev = b.conversions.reduce((s, c) => s + c.revenue, 0)
        return {
          broadcastCount: acc.broadcastCount + 1,
          sent: acc.sent + b.sentCount,
          delivered: acc.delivered + b.deliveredCount,
          read: acc.read + b.readCount,
          clicked: acc.clicked + b.clickCount,
          revenue: acc.revenue + b.revenue + convRev,
        }
      },
      { broadcastCount: 0, sent: 0, delivered: 0, read: 0, clicked: 0, revenue: 0 }
    )

    const broadcastHistory = t.broadcasts.map(b => ({
      id: b.id,
      name: b.name,
      status: b.status,
      sentCount: b.sentCount,
      readCount: b.readCount,
      revenue: b.revenue + b.conversions.reduce((s, c) => s + c.revenue, 0),
      createdAt: b.createdAt.toISOString(),
    }))

    const pendingDays = t.status === 'PENDING' && t.submittedAt
      ? Math.floor((Date.now() - new Date(t.submittedAt).getTime()) / 86400000)
      : null

    return {
      id: t.id,
      accountId: t.accountId,
      metaTemplateId: t.metaTemplateId,
      name: t.name,
      category: t.category,
      language: t.language,
      status: t.status,
      componentsJson: t.componentsJson,
      rejectedReason: t.rejectedReason,
      qualityRating: t.qualityRating,
      submittedAt: t.submittedAt?.toISOString() ?? null,
      syncedAt: t.syncedAt.toISOString(),
      pendingDays,
      stats,
      broadcastHistory,
      versions: t.versions.map(v => ({ ...v, createdAt: v.createdAt.toISOString() })),
    }
  })

  return NextResponse.json({
    templates: result,
    lastSyncAt: primaryAccount?.lastSyncAt?.toISOString() ?? null,
    lastSyncError: primaryAccount?.lastSyncError ?? null,
  })
}
