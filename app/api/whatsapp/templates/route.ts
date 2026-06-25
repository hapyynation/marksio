import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

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
